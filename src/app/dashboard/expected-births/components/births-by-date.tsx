'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ExpectedBirth, getAlertLevel } from '@/types/expected-births-types';
import BirthAlertCard from './birth-alert-card';

const BirthsByDate: React.FC = () => {
  const [births, setBirths] = useState<ExpectedBirth[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchExpectedBirths();
  }, []);

  const fetchExpectedBirths = async () => {
    try {
      setLoading(true);
      setError(null);

      // 🔍 1. Lekérdezzük a vemhes állatokat
      const { data: animalsData, error: animalsError } = await supabase
        .from('animals')
        .select(`
          id,
          enar,
          name,
          kategoria,
          expected_birth_date,
          pregnancy_status,
          animal_pen_assignments!left(
            pen_id,
            pens(pen_number, pen_type)
          )
        `)
        .eq('pregnancy_status', 'vemhes')
        .eq('statusz', 'aktív')
        .not('expected_birth_date', 'is', null)
        .order('expected_birth_date', { ascending: true });

      if (animalsError) throw animalsError;

      // 🔍 2. BIRTHS ÉS VV RESULTS KOMBINÁLT LEKÉRDEZÉS
      const [birthsResponse, calvesResponse, offspringResponse, vvResponse] = await Promise.all([
        // 2a. Births tábla - MINDEN ellési rekord dátummal
        supabase
          .from('births')
          .select('mother_enar, birth_date, birth_type, complications, notes'),

        // 2b. Calves tábla - temp ID-s borjak
        supabase
          .from('calves')
          .select(`
            temp_id, 
            birth_id,
            births!inner(mother_enar)
          `)
          .not('temp_id', 'is', null),

        // 2c. Animals tábla - önálló ENAR-os utódok
        supabase
          .from('animals')
          .select('anya_enar')
          .not('anya_enar', 'is', null)
          .eq('statusz', 'aktív'),

        // 2d. ÚJ: VV Results - legutóbbi vemhes eredmények állatonként
        supabase
          .from('vv_results')
          .select('animal_enar, vv_date, pregnancy_status')
          .eq('pregnancy_status', 'vemhes')
          .order('vv_date', { ascending: false })
      ]);

      if (birthsResponse.error) throw birthsResponse.error;
      if (calvesResponse.error) throw calvesResponse.error;
      if (offspringResponse.error) throw offspringResponse.error;
      if (vvResponse.error) throw vvResponse.error;

      // 🧠 3. INTELLIGENS KIZÁRÁSI LOGIKA
      const animalsWithBirths = new Set<string>();

      // 3a. VV Results mappelése - legutóbbi vemhes VV állatonként
      const latestVVMap = new Map<string, string>(); // animal_enar -> vv_date
      (vvResponse.data || []).forEach(vv => {
        if (!latestVVMap.has(vv.animal_enar) || vv.vv_date > latestVVMap.get(vv.animal_enar)!) {
          latestVVMap.set(vv.animal_enar, vv.vv_date);
        }
      });

      // 3b. Births rekordok intelligens elemzése
      (birthsResponse.data || []).forEach(birth => {
        if (!birth.mother_enar) return;

        const birthDate = birth.birth_date;
        const latestVVDate = latestVVMap.get(birth.mother_enar);

        // 🔍 DÖNTÉSI LOGIKA:
        if (latestVVDate && birthDate) {
          const birthDateTime = new Date(birthDate).getTime();
          const vvDateTime = new Date(latestVVDate).getTime();

          if (vvDateTime > birthDateTime) {
            // ✅ VV ÚJABB mint az ellés → NEM zárjuk ki (újra vemhes lehet)
            console.log(`✅ ${birth.mother_enar}: VV (${latestVVDate}) újabb mint ellés (${birthDate}) → VÁRHATÓ ELLÉS`);
            return; // NEM adjuk hozzá a kizárt listához
          } else {
            // ❌ Ellés újabb mint VV → kizárjuk
            console.log(`❌ ${birth.mother_enar}: Ellés (${birthDate}) újabb mint VV (${latestVVDate}) → KIZÁRVA`);
            animalsWithBirths.add(birth.mother_enar);
          }
        } else if (!latestVVDate) {
          // Nincs VV eredmény, de van ellés → kizárjuk
          console.log(`❌ ${birth.mother_enar}: Van ellés de nincs VV → KIZÁRVA`);
          animalsWithBirths.add(birth.mother_enar);
        } else {
          // Nincs ellés dátum → biztonsági kizárás
          console.log(`⚠️ ${birth.mother_enar}: Nincs ellés dátum → KIZÁRVA`);
          animalsWithBirths.add(birth.mother_enar);
        }
      });

      // 3c. Temp ID-s borjak anyái - INTELLIGENS VV DÁTUM ELLENŐRZÉS
      (calvesResponse.data || []).forEach((calf: any) => {
        if (calf.births?.mother_enar) {
          const motherEnar = calf.births.mother_enar;
          const latestVVDate = latestVVMap.get(motherEnar);

          // Keressük meg a births rekordot ehhez a calf-hoz
          const relatedBirth = (birthsResponse.data || []).find(birth =>
            birth.mother_enar === motherEnar
          );

          if (relatedBirth && latestVVDate && relatedBirth.birth_date) {
            const birthDateTime = new Date(relatedBirth.birth_date).getTime();
            const vvDateTime = new Date(latestVVDate).getTime();

            if (vvDateTime > birthDateTime) {
              // ✅ VV ÚJABB mint a temp borjak ellése → NEM zárjuk ki
              console.log(`✅ ${motherEnar}: Van temp borjú DE VV (${latestVVDate}) újabb mint ellés (${relatedBirth.birth_date}) → VÁRHATÓ ELLÉS`);
              return; // NEM adjuk hozzá a kizárt listához
            } else {
              // ❌ Temp borjú ellése újabb → kizárjuk
              console.log(`❌ ${motherEnar}: Van temp borjú ÉS ellés (${relatedBirth.birth_date}) újabb mint VV (${latestVVDate}) → KIZÁRVA`);
              animalsWithBirths.add(motherEnar);
            }
          } else {
            // Nincs VV vagy nincs birth_date → biztonsági kizárás
            console.log(`❌ ${motherEnar}: Van temp borjú de nincs VV vagy birth_date → KIZÁRVA`);
            animalsWithBirths.add(motherEnar);
          }
        }
      });

      // 3d. Önálló ENAR-os utódok anyái
      (offspringResponse.data || []).forEach(animal => {
        if (animal.anya_enar) {
          animalsWithBirths.add(animal.anya_enar);
          console.log(`❌ ${animal.anya_enar}: Van ENAR-os utód → KIZÁRVA`);
        }
      });

      // 🔍 4. Szűrés és részletes debug
      const filteredAnimals = (animalsData || []).filter(animal =>
        !animalsWithBirths.has(animal.enar)
      );

      console.log('🔍 === INTELLIGENS VÁRHATÓ ELLÉSEK DEBUG ===');
      console.log('💡 Összes vemhes állat:', animalsData?.length || 0);
      console.log('📋 Births rekordok száma:', birthsResponse.data?.length || 0);
      console.log('🔬 VV eredmények száma:', vvResponse.data?.length || 0);
      console.log('🧠 VV Map size:', latestVVMap.size);
      console.log('🐮 Temp ID-s borjak száma:', calvesResponse.data?.length || 0);
      console.log('👶 Önálló utódok száma:', offspringResponse.data?.length || 0);
      console.log('🚫 Végleg kizárt anyák:', animalsWithBirths.size);
      console.log('✅ Valóban várható ellések:', filteredAnimals.length);
      console.log('🎯 Várható ellések ENARok:', filteredAnimals.map(a => a.enar));

      // KONKRÉT PÉLDA DEBUG:
      const testAnimal = 'HU 30223 4444 0';
      console.log(`🎯 ${testAnimal} részletes elemzés:`);
      console.log(`   - Legutóbbi VV: ${latestVVMap.get(testAnimal) || 'NINCS'}`);
      console.log(`   - Kizárva: ${animalsWithBirths.has(testAnimal) ? 'IGEN' : 'NEM'}`);

      // Debug: mely anyák vannak kizárva
      const excludedMothers = Array.from(animalsWithBirths);
      console.log('🚫 Véglegesen kizárt anyák:', excludedMothers);

      // 📊 5. Adatok feldolgozása
      const processedBirths: ExpectedBirth[] = filteredAnimals.map((animal: any) => {
        const today = new Date();
        const birthDate = new Date(animal.expected_birth_date);
        const daysRemaining = Math.ceil((birthDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        // Karám info kinyerése
        const assignment = animal.animal_pen_assignments?.[0];
        const pen = assignment?.pens;

        return {
          enar: animal.enar,
          name: animal.name,
          kategoria: animal.kategoria,
          expected_birth_date: animal.expected_birth_date,
          pregnancy_status: animal.pregnancy_status,
          pen_number: pen?.pen_number || 'Nincs karám',
          pen_type: pen?.pen_type || 'ismeretlen',
          days_remaining: daysRemaining,
          alert_level: getAlertLevel(daysRemaining)
        };
      });

      setBirths(processedBirths);
    } catch (error) {
      console.error('Várható ellések betöltési hiba:', error);
      setError('Hiba történt az adatok betöltése során');
    } finally {
      setLoading(false);
    }
  };

  const handleAnimalClick = (enar: string) => {
    // Állat adatlapjára navigálás
    window.location.href = `/dashboard/animals/${enar}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="text-2xl mb-2">🐄</div>
          <div className="text-gray-600">Várható ellések betöltése...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">❌</span>
          <div>
            <h3 className="font-medium text-red-800">Hiba történt</h3>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
        <button
          onClick={fetchExpectedBirths}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
        >
          Újra próbálkozás
        </button>
      </div>
    );
  }

  if (births.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
        <div className="text-4xl mb-4">🐄✨</div>
        <h3 className="text-lg font-medium text-green-800 mb-2">
          Nincs várható ellés
        </h3>
        <p className="text-green-600">
          ✅ Minden ellés már rögzítve van! 🎉
        </p>
        <p className="text-sm text-gray-500 mt-2">
          (Births + temp ID-s borjak + önálló utódok is figyelembe véve)
        </p>
      </div>
    );
  }

  // Csoportosítás riasztási szint szerint
  const overdueAnimals = births.filter(b => b.alert_level === 'overdue');
  const criticalAnimals = births.filter(b => b.alert_level === 'critical');
  const upcomingAnimals = births.filter(b => b.alert_level === 'upcoming');
  const distantAnimals = births.filter(b => b.alert_level === 'distant');

  return (
    <div className="space-y-6">
      {/* Statisztikák */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-red-800">{overdueAnimals.length}</div>
          <div className="text-sm text-red-600">🚨 Túllépett</div>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-orange-800">{criticalAnimals.length}</div>
          <div className="text-sm text-orange-600">⚠️ Kritikus (7 nap)</div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-yellow-800">{upcomingAnimals.length}</div>
          <div className="text-sm text-yellow-600">📅 Közelgő (30 nap)</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-800">{distantAnimals.length}</div>
          <div className="text-sm text-green-600">🐄 Távoli</div>
        </div>
      </div>

      {/* Túllépett ellések */}
      {overdueAnimals.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-red-800 mb-4 flex items-center">
            🚨 Túllépett ellések ({overdueAnimals.length})
          </h2>
          <div className="space-y-3">
            {overdueAnimals.map((birth) => (
              <BirthAlertCard
                key={birth.enar}
                birth={birth}
                onClick={() => handleAnimalClick(birth.enar)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Kritikus ellések */}
      {criticalAnimals.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-orange-800 mb-4 flex items-center">
            ⚠️ Kritikus ellések - 7 napon belül ({criticalAnimals.length})
          </h2>
          <div className="space-y-3">
            {criticalAnimals.map((birth) => (
              <BirthAlertCard
                key={birth.enar}
                birth={birth}
                onClick={() => handleAnimalClick(birth.enar)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Közelgő ellések */}
      {upcomingAnimals.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-yellow-800 mb-4 flex items-center">
            📅 Közelgő ellések - 30 napon belül ({upcomingAnimals.length})
          </h2>
          <div className="space-y-3">
            {upcomingAnimals.map((birth) => (
              <BirthAlertCard
                key={birth.enar}
                birth={birth}
                onClick={() => handleAnimalClick(birth.enar)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Távoli ellések */}
      {distantAnimals.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-green-800 mb-4 flex items-center">
            🐄 Távoli ellések - 30+ nap ({distantAnimals.length})
          </h2>
          <div className="space-y-3">
            {distantAnimals.map((birth) => (
              <BirthAlertCard
                key={birth.enar}
                birth={birth}
                onClick={() => handleAnimalClick(birth.enar)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BirthsByDate;