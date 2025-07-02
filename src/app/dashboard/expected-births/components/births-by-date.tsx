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

      const { data, error } = await supabase
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

      if (error) throw error;

     // Adatok feldolgozása
const processedBirths: ExpectedBirth[] = (data || []).map((animal: any) => {
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
          Jelenleg nincs vemhes állat várható ellési dátummal.
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