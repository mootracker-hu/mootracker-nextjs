'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface ExpectedBirth {
  enar: string;
  name?: string;
  expected_birth_date: string;
  current_pen?: string;
  days_until_birth: number;
  alert_level: 'overdue' | 'critical' | 'upcoming' | 'distant';
}

export default function ExpectedBirthsWidget() {
  const [expectedBirths, setExpectedBirths] = useState<ExpectedBirth[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExpectedBirths = async () => {
      try {
        // 🔍 1. Lekérdezzük a vemhes állatokat
        const { data: animalsData, error: animalsError } = await supabase
          .from('animals')
          .select('enar, name, expected_birth_date')
          .eq('pregnancy_status', 'vemhes')
          .eq('statusz', 'aktív')
          .not('expected_birth_date', 'is', null)
          .order('expected_birth_date', { ascending: true })
          .limit(10); // Több mint 5, hogy biztosan legyen elég

        if (animalsError) throw animalsError;

        // 🔍 2. HÁROM módon ellenőrizzük az elléseket párhuzamosan
        const [birthsResponse, calvesResponse, offspringResponse] = await Promise.all([
          // 2a. Births tábla - ellési rekordok
          supabase
            .from('births')
            .select('mother_enar'),
          
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
            .eq('statusz', 'aktív')
        ]);

        if (birthsResponse.error) throw birthsResponse.error;
        if (calvesResponse.error) throw calvesResponse.error;
        if (offspringResponse.error) throw offspringResponse.error;

        // 🚫 3. Minden módon ellettek állatok gyűjtése
        const animalsWithBirths = new Set<string>();

        // 3a. Direkt births rekordok
        (birthsResponse.data || []).forEach(birth => {
          if (birth.mother_enar) {
            animalsWithBirths.add(birth.mother_enar);
          }
        });

        // 3b. Temp ID-s borjak anyái (calves + births JOIN)
        (calvesResponse.data || []).forEach((calf: any) => {
          if (calf.births?.mother_enar) {
            animalsWithBirths.add(calf.births.mother_enar);
          }
        });

        // 3c. Önálló ENAR-os utódok anyái
        (offspringResponse.data || []).forEach(animal => {
          if (animal.anya_enar) {
            animalsWithBirths.add(animal.anya_enar);
          }
        });

        // 🔍 4. Szűrés
        const filteredAnimals = (animalsData || []).filter(animal => 
          !animalsWithBirths.has(animal.enar)
        );

        console.log('💡 DASHBOARD WIDGET DEBUG - Várható ellések:');
        console.log('📊 Összes vemhes állat:', animalsData?.length || 0);
        console.log('📋 Births rekordok:', birthsResponse.data?.length || 0);
        console.log('🐮 Temp ID-s borjak:', calvesResponse.data?.length || 0);
        console.log('👶 Önálló utódok:', offspringResponse.data?.length || 0);
        console.log('🚫 Már ellettek:', animalsWithBirths.size);
        console.log('✅ Widget - valóban várható ellések:', filteredAnimals.length);
        console.log('🎯 Widget ENARok:', filteredAnimals.map(a => a.enar));

        // 📊 5. Adatok feldolgozása és TOP 5 kiválasztása
        const today = new Date();
        const processedBirths = filteredAnimals.map(birth => {
          const birthDate = new Date(birth.expected_birth_date);
          const diffTime = birthDate.getTime() - today.getTime();
          const daysUntilBirth = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          let alertLevel: ExpectedBirth['alert_level'];
          if (daysUntilBirth < 0) alertLevel = 'overdue';
          else if (daysUntilBirth <= 7) alertLevel = 'critical';
          else if (daysUntilBirth <= 30) alertLevel = 'upcoming';
          else alertLevel = 'distant';

          return {
            ...birth,
            days_until_birth: daysUntilBirth,
            alert_level: alertLevel
          };
        }).slice(0, 5); // TOP 5 legközelebbi

        setExpectedBirths(processedBirths);
      } catch (error) {
        console.error('❌ Dashboard widget - Várható ellések lekérdezési hiba:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchExpectedBirths();
  }, []);

  const getAlertColors = (alertLevel: string) => {
    switch (alertLevel) {
      case 'overdue':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'critical':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'upcoming':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const getAlertIcon = (alertLevel: string) => {
    switch (alertLevel) {
      case 'overdue': return '🚨';
      case 'critical': return '⚠️';
      case 'upcoming': return '📅';
      default: return '🐄';
    }
  };

  const getTimeText = (days: number) => {
    if (days < 0) return `${Math.abs(days)} nappal túllépte!`;
    if (days === 0) return 'Ma várható!';
    if (days === 1) return 'Holnap várható!';
    return `${days} nap múlva`;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <span className="text-2xl mr-3">🐄🍼</span>
          <h2 className="text-lg font-semibold text-gray-900">Várható Ellések</h2>
        </div>
        <Link
          href="/dashboard/expected-births"
          className="bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-lg transition-colors text-sm inline-flex items-center"
        >
          <span className="mr-1">📊</span>
          Összes
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
          <span className="ml-2 text-gray-600">Betöltés...</span>
        </div>
      ) : expectedBirths.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">🐄</div>
          <p>Nincs várható ellés a közeljövőben</p>
          <p className="text-sm mt-1">✅ Minden ellés már rögzítve van!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {expectedBirths.map(birth => (
            <div key={birth.enar} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getAlertIcon(birth.alert_level)}</span>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">
                        {birth.name || birth.enar}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getAlertColors(birth.alert_level)}`}>
                        {getTimeText(birth.days_until_birth)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      📅 {new Date(birth.expected_birth_date).toLocaleDateString('hu-HU')}
                    </p>
                  </div>
                </div>
                <Link
                  href={`/dashboard/animals/${birth.enar}`}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  👁️ Részletek
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}