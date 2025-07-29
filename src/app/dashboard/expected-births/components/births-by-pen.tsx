'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ExpectedBirth, PenBirths, getAlertLevel } from '@/types/expected-births-types';
import BirthAlertCard from './birth-alert-card';

const BirthsByPen: React.FC = () => {
  const [penBirths, setPenBirths] = useState<PenBirths[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBirthsByPen();
  }, []);

  const fetchBirthsByPen = async () => {
    try {
      setLoading(true);
      setError(null);

      // 🔍 1. LEGÚJABB VEMHES VV EREDMÉNYEK LEKÉRDEZÉSE
      console.log('🔍 Legújabb VV eredmények lekérdezése (karám szerint)...');

      const { data: allVVResults, error: vvError } = await supabase
        .from('vv_results')
        .select(`
        animal_enar,
        vv_date,
        pregnancy_status,
        expected_birth_date,
        historical
      `)
        .eq('pregnancy_status', 'vemhes')
        .order('vv_date', { ascending: false });

      if (vvError) throw vvError;

      // 🧠 2. CSOPORTOSÍTÁS ÁLLATONKÉNT - CSAK LEGÚJABB VV EREDMÉNYEK
      console.log('🧠 VV eredmények csoportosítása állatonként...');

      const latestVVMap = new Map<string, any>();
      (allVVResults || []).forEach(vv => {
        if (!latestVVMap.has(vv.animal_enar)) {
          latestVVMap.set(vv.animal_enar, vv);
        }
      });

      const latestVVAnimals = Array.from(latestVVMap.keys());
      console.log('🎯 Állatatok legújabb vemhes VV-vel:', latestVVAnimals.length);

      if (latestVVAnimals.length === 0) {
        setPenBirths([]);
        return;
      }

      // 🔍 3. ANIMALS TÁBLA KIEGÉSZÍTŐ ADATOK (név, kategória, karám)
      console.log('🔍 Animals tábla kiegészítő adatok lekérdezése...');

      const { data: animalsData, error: animalsError } = await supabase
        .from('animals')
        .select(`
        enar,
        name,
        kategoria,
        statusz,
        animal_pen_assignments(
          pen_id,
          assigned_at,
          pens(
            id,
            pen_number,
            pen_type,
            capacity
          )
        )
      `)
        .in('enar', latestVVAnimals)
        .eq('statusz', 'aktív');

      if (animalsError) throw animalsError;

      // 🗂️ 4. ANIMALS ADATOK MAPPELÉSE + LEGUTÓBBI KARÁM ASSIGNMENT
      const animalsMap = new Map<string, any>();
      (animalsData || []).forEach(animal => {
        // 🎯 LEGUTÓBBI KARÁM ASSIGNMENT KERESÉSE
        let latestPenAssignment = null;

        if (animal.animal_pen_assignments && animal.animal_pen_assignments.length > 0) {
          // Rendezés assigned_at szerint (legutóbbi első)
          const sortedAssignments = animal.animal_pen_assignments.sort((a: any, b: any) =>
            new Date(b.assigned_at).getTime() - new Date(a.assigned_at).getTime()
          );

          // Legutóbbi assignment kiválasztása
          latestPenAssignment = sortedAssignments[0];

          console.log(`🏠 ${animal.enar}: ${sortedAssignments.length} assignment, legutóbbi: ${(latestPenAssignment as any)?.pens?.pen_number || 'N/A'} (${latestPenAssignment?.assigned_at})`);
        } else {
          console.log(`⚠️ ${animal.enar}: Nincs karám assignment`);
        }

        // Állat adatok tárolása a legutóbbi karám assignment-tel
        animalsMap.set(animal.enar, {
          ...animal,
          latest_pen_assignment: latestPenAssignment
        });
      });

      // 🧠 5. VV + ANIMALS ADATOK KOMBINÁLÁSA
      console.log('🧠 VV és Animals adatok kombinálása...');

      const combinedAnimals = latestVVAnimals
        .map(enar => {
          const vvData = latestVVMap.get(enar);
          const animalData = animalsMap.get(enar);

          if (!animalData) {
            console.warn(`⚠️ ${enar}: VV van, de nincs aktív állat adat`);
            return null;
          }

          return {
            enar: enar,
            name: animalData.name,
            kategoria: animalData.kategoria,
            expected_birth_date: vvData.expected_birth_date,
            pregnancy_status: vvData.pregnancy_status,
            vv_date: vvData.vv_date,
            historical: vvData.historical,
            // 🎯 LEGUTÓBBI KARÁM ASSIGNMENT HASZNÁLATA
            latest_pen_assignment: animalData.latest_pen_assignment
          };
        })
        .filter(animal => animal !== null);

      console.log('✅ Kombinált állatok száma:', combinedAnimals.length);

      // 🔍 6. BIRTHS ÉS UTÓDOK LEKÉRDEZÉSE (változatlan logika)
      const [birthsResponse, calvesResponse, offspringResponse] = await Promise.all([
        // 6a. Births tábla
        supabase
          .from('births')
          .select('mother_enar, birth_date, birth_type, complications, notes'),

        // 6b. Calves tábla
        supabase
          .from('calves')
          .select(`
          temp_id, 
          birth_id,
          births!inner(mother_enar)
        `)
          .not('temp_id', 'is', null),

        // 6c. Animals tábla - utódok
        supabase
          .from('animals')
          .select('anya_enar')
          .not('anya_enar', 'is', null)
          .eq('statusz', 'aktív')
      ]);

      if (birthsResponse.error) throw birthsResponse.error;
      if (calvesResponse.error) throw calvesResponse.error;
      if (offspringResponse.error) throw offspringResponse.error;

      // 🧠 7. INTELLIGENS KIZÁRÁSI LOGIKA (VV Map alapú + Expected Date ellenőrzés)
      const animalsWithBirths = new Set<string>();
      const todayTimestamp = new Date().getTime(); // Mai dátum timestamp

      // 7a. Births rekordok intelligens elemzése + Expected Date ellenőrzés
      (birthsResponse.data || []).forEach(birth => {
        if (!birth.mother_enar) return;

        const birthDate = birth.birth_date;
        const latestVV = latestVVMap.get(birth.mother_enar);
        const latestVVDate = latestVV?.vv_date;
        const expectedBirthDate = latestVV?.expected_birth_date;

        if (latestVVDate && birthDate) {
          const birthDateTime = new Date(birthDate).getTime();
          const vvDateTime = new Date(latestVVDate).getTime();

          if (vvDateTime > birthDateTime) {
            // ✅ VV ÚJABB mint az ellés
            // 🆕 DE ELLENŐRIZZÜK: Az expected_birth_date még jövőbeli-e?
            if (expectedBirthDate) {
              const expectedDateTime = new Date(expectedBirthDate).getTime();

              if (expectedDateTime > todayTimestamp) {
                // ✅ Expected birth date jövőbeli → VÁRHATÓ ELLÉS
                console.log(`✅ ${birth.mother_enar}: VV (${latestVVDate}) újabb mint ellés (${birthDate}) ÉS expected birth jövőbeli (${expectedBirthDate}) → VÁRHATÓ ELLÉS`);
                return; // NEM adjuk hozzá a kizárt listához
              } else {
                // ❌ Expected birth date múltbeli/túllépett → KIZÁRVA
                console.log(`❌ ${birth.mother_enar}: VV újabb DE expected birth TÚLLÉPETT (${expectedBirthDate}) → KIZÁRVA`);
                animalsWithBirths.add(birth.mother_enar);
              }
            } else {
              // ❌ Nincs expected birth date → biztonsági kizárás
              console.log(`❌ ${birth.mother_enar}: VV újabb DE nincs expected birth date → KIZÁRVA`);
              animalsWithBirths.add(birth.mother_enar);
            }
          } else {
            // ❌ Ellés újabb mint VV → kizárjuk
            console.log(`❌ ${birth.mother_enar}: Ellés (${birthDate}) újabb mint VV (${latestVVDate}) → KIZÁRVA`);
            animalsWithBirths.add(birth.mother_enar);
          }
        } else if (!latestVVDate) {
          console.log(`❌ ${birth.mother_enar}: Van ellés de nincs legújabb VV → KIZÁRVA`);
          animalsWithBirths.add(birth.mother_enar);
        } else {
          console.log(`⚠️ ${birth.mother_enar}: Nincs ellés dátum → KIZÁRVA`);
          animalsWithBirths.add(birth.mother_enar);
        }
      });

      // 7b. Temp ID-s borjak anyái - INTELLIGENS VV + Expected Date ellenőrzés
      (calvesResponse.data || []).forEach((calf: any) => {
        if (calf.births?.mother_enar) {
          const motherEnar = calf.births.mother_enar;
          const latestVV = latestVVMap.get(motherEnar);
          const latestVVDate = latestVV?.vv_date;
          const expectedBirthDate = latestVV?.expected_birth_date;

          const relatedBirth = (birthsResponse.data || []).find(birth =>
            birth.mother_enar === motherEnar
          );

          if (relatedBirth && latestVVDate && relatedBirth.birth_date) {
            const birthDateTime = new Date(relatedBirth.birth_date).getTime();
            const vvDateTime = new Date(latestVVDate).getTime();

            if (vvDateTime > birthDateTime) {
              // ✅ VV ÚJABB mint a temp borjak ellése
              // 🆕 DE ELLENŐRIZZÜK: Az expected_birth_date még jövőbeli-e?
              if (expectedBirthDate) {
                const expectedDateTime = new Date(expectedBirthDate).getTime();

                if (expectedDateTime > todayTimestamp) {
                  // ✅ Expected birth date jövőbeli → VÁRHATÓ ELLÉS
                  console.log(`✅ ${motherEnar}: Van temp borjú DE VV (${latestVVDate}) újabb mint ellés (${relatedBirth.birth_date}) ÉS expected birth jövőbeli (${expectedBirthDate}) → VÁRHATÓ ELLÉS`);
                  return; // NEM adjuk hozzá a kizárt listához
                } else {
                  // ❌ Expected birth date múltbeli/túllépett → KIZÁRVA
                  console.log(`❌ ${motherEnar}: Van temp borjú, VV újabb DE expected birth TÚLLÉPETT (${expectedBirthDate}) → KIZÁRVA`);
                  animalsWithBirths.add(motherEnar);
                }
              } else {
                // ❌ Nincs expected birth date → biztonsági kizárás
                console.log(`❌ ${motherEnar}: Van temp borjú, VV újabb DE nincs expected birth date → KIZÁRVA`);
                animalsWithBirths.add(motherEnar);
              }
            } else {
              // ❌ Temp borjú ellése újabb → kizárjuk
              console.log(`❌ ${motherEnar}: Van temp borjú ÉS ellés (${relatedBirth.birth_date}) újabb mint VV (${latestVVDate}) → KIZÁRVA`);
              animalsWithBirths.add(motherEnar);
            }
          } else {
            console.log(`❌ ${motherEnar}: Van temp borjú de nincs VV vagy birth_date → KIZÁRVA`);
            animalsWithBirths.add(motherEnar);
          }
        }
      });

      // 7c. Önálló ENAR-os utódok
      (offspringResponse.data || []).forEach(animal => {
        if (animal.anya_enar) {
          animalsWithBirths.add(animal.anya_enar);
          console.log(`❌ ${animal.anya_enar}: Van ENAR-os utód → KIZÁRVA`);
        }
      });

      // 🔍 8. VÉGSŐ SZŰRÉS ÉS DEBUG
      const filteredAnimals = combinedAnimals.filter(animal =>
        !animalsWithBirths.has(animal.enar)
      );

      console.log('🔍 === KARÁM SZERINTI VÁRHATÓ ELLÉSEK DEBUG ===');
      console.log('💡 Összes legújabb vemhes VV:', latestVVMap.size);
      console.log('🐮 Aktív állatok VV-vel:', combinedAnimals.length);
      console.log('📋 Births rekordok száma:', birthsResponse.data?.length || 0);
      console.log('🐮 Temp ID-s borjak száma:', calvesResponse.data?.length || 0);
      console.log('👶 Önálló utódok száma:', offspringResponse.data?.length || 0);
      console.log('🚫 Végleg kizárt anyák:', animalsWithBirths.size);
      console.log('✅ Valóban várható ellések:', filteredAnimals.length);

      // 📊 9. ADATOK FELDOLGOZÁSA KARÁM SZERINT (javított karám logikával)
      const today = new Date();
      const penMap = new Map<string, PenBirths>();

      filteredAnimals.forEach((animal: any) => {
        const birthDate = new Date(animal.expected_birth_date);
        const daysRemaining = Math.ceil((birthDate.getTime() - todayTimestamp) / (1000 * 60 * 60 * 24));

        // 🎯 LEGUTÓBBI KARÁM ASSIGNMENT HASZNÁLATA
        const latestAssignment = animal.latest_pen_assignment;
        const pen = (latestAssignment as any)?.pens;

        let penId: string;
        let penNumber: string;
        let penType: string;
        let capacity: number;

        if (pen) {
          penId = pen.id;
          penNumber = pen.pen_number;
          penType = pen.pen_type;
          capacity = pen.capacity || 999;
        } else {
          // Nincs karám hozzárendelés
          penId = 'no-pen';
          penNumber = 'Nincs karám';
          penType = 'nincs';
          capacity = 999;
        }

        // Karám létrehozása ha még nincs
        if (!penMap.has(penId)) {
          penMap.set(penId, {
            pen_id: penId,
            pen_number: penNumber,
            pen_type: penType,
            capacity: capacity,
            pregnant_count: 0,
            earliest_birth: '',
            animals: []
          });
        }

        const penData = penMap.get(penId)!;

        // Állat hozzáadása
        const birthData: ExpectedBirth = {
          enar: animal.enar,
          name: animal.name,
          kategoria: animal.kategoria,
          expected_birth_date: animal.expected_birth_date,
          pregnancy_status: animal.pregnancy_status,
          pen_number: penNumber,
          pen_type: penType,
          days_remaining: daysRemaining,
          alert_level: getAlertLevel(daysRemaining)
        };

        penData.animals.push(birthData);
        penData.pregnant_count++;

        // Legkorábbi ellés
        if (!penData.earliest_birth || animal.expected_birth_date < penData.earliest_birth) {
          penData.earliest_birth = animal.expected_birth_date;
        }
      });

      // Karamok rendezése
      const sortedPens = Array.from(penMap.values())
        .filter(pen => pen.pregnant_count > 0)
        .map(pen => {
          pen.animals.sort((a, b) =>
            new Date(a.expected_birth_date).getTime() - new Date(b.expected_birth_date).getTime()
          );
          return pen;
        })
        .sort((a, b) => {
          if (!a.earliest_birth) return 1;
          if (!b.earliest_birth) return -1;
          return new Date(a.earliest_birth).getTime() - new Date(b.earliest_birth).getTime();
        });

      setPenBirths(sortedPens);
    } catch (error) {
      console.error('Karám szerinti ellések betöltési hiba:', error);
      setError('Hiba történt az adatok betöltése során');
    } finally {
      setLoading(false);
    }
  };

  const handleAnimalClick = (enar: string) => {
    window.location.href = `/dashboard/animals/${enar}`;
  };

  const getPenIcon = (penType: string) => {
    switch (penType) {
      case 'ellető': return '🏥';
      case 'vemhes': return '🐄';
      case 'outdoor': return '🌿';
      case 'birthing': return '🍼';
      case 'nincs': return '❓';
      default: return '🏠';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('hu-HU');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="text-2xl mb-2">🏠</div>
          <div className="text-gray-600">Karamok betöltése...</div>
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
          onClick={fetchBirthsByPen}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
        >
          Újra próbálkozás
        </button>
      </div>
    );
  }

  if (penBirths.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
        <div className="text-4xl mb-4">🏠🐄</div>
        <h3 className="text-lg font-medium text-green-800 mb-2">
          Nincs várható ellés karamokban
        </h3>
        <p className="text-green-600">
          ✅ Minden ellés már rögzítve van! 🎉
        </p>
        <p className="text-sm text-gray-500 mt-2">
          (VV Results alapú intelligens szűréssel)
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Összesítő statisztikák */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-gray-800">{penBirths.length}</div>
          <div className="text-sm text-gray-600">🏠 Érintett karám</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-800">
            {penBirths.reduce((sum, pen) => sum + pen.pregnant_count, 0)}
          </div>
          <div className="text-sm text-green-600">🐄 Vemhes állat</div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-800">
            {penBirths.length > 0 ? formatDate(penBirths[0].earliest_birth) : '-'}
          </div>
          <div className="text-sm text-blue-600">📅 Legkorábbi ellés</div>
        </div>
      </div>

      {/* Karamok listája */}
      {penBirths.map((pen) => (
        <div key={pen.pen_id} className="bg-white rounded-lg border border-gray-200 shadow-sm">
          {/* Karám fejléc */}
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{getPenIcon(pen.pen_type)}</span>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Karám {pen.pen_number}
                  </h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span>📋 {pen.pen_type}</span>
                    <span>👥 {pen.pregnant_count}/{pen.capacity} állat</span>
                    <span>📅 Legkorábbi: {formatDate(pen.earliest_birth)}</span>
                  </div>
                </div>
              </div>

              {/* Kapacitás mutató */}
              <div className="text-right">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${(pen.pregnant_count / pen.capacity) > 0.8 ? 'bg-red-500' :
                        (pen.pregnant_count / pen.capacity) > 0.6 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                    style={{ width: `${Math.min((pen.pregnant_count / pen.capacity) * 100, 100)}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {Math.round((pen.pregnant_count / pen.capacity) * 100)}% telítettség
                </div>
              </div>
            </div>
          </div>

          {/* Állatok listája */}
          <div className="p-6 space-y-3">
            {pen.animals.map((animal) => (
              <BirthAlertCard
                key={animal.enar}
                birth={animal}
                onClick={() => handleAnimalClick(animal.enar)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default BirthsByPen;