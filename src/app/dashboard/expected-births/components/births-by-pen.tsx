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

      // Egyszerű lekérdezés: vemhes állatok + karám info
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
            pens(
              id,
              pen_number,
              pen_type,
              capacity
            )
          )
        `)
        .eq('pregnancy_status', 'vemhes')
        .eq('statusz', 'aktív')
        .not('expected_birth_date', 'is', null)
        .order('expected_birth_date', { ascending: true });

      if (error) throw error;

      // Adatok feldolgozása karám szerint
      const penMap = new Map<string, PenBirths>();

      (data || []).forEach((animal: any) => {
        const today = new Date();
        const birthDate = new Date(animal.expected_birth_date);
        const daysRemaining = Math.ceil((birthDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        // Karám információ kinyerése
        const assignment = animal.animal_pen_assignments?.[0];
        const pen = assignment?.pens;

        let penId: string;
        let penNumber: string;
        let penType: string;
        let capacity: number;

        if (pen) {
          penId = pen.id;
          penNumber = pen.pen_number;
          penType = pen.pen_type;
          capacity = pen.capacity;
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
          Jelenleg nincs karám vemhes állatokkal.
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
                    className={`h-2 rounded-full ${
                      (pen.pregnant_count / pen.capacity) > 0.8 ? 'bg-red-500' :
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