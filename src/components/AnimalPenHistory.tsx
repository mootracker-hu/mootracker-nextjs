// src/components/AnimalPenHistory.tsx
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import PenHistoryCard from './PenHistoryCard';

interface Animal {
  id: number;
  enar: string;
  kategoria: string;
  ivar: string;
}

interface PenHistoryPeriod {
  id: string;
  pen_id: string;
  pen_number: string;
  pen_location: string;
  function_type: string;
  start_date: string;
  end_date: string | null;
  animals_snapshot: Animal[];
  metadata: any;
  notes?: string;
  historical: boolean;
  created_at: string;
}

interface AnimalPenHistoryProps {
  animalEnar: string;
  animalId: number;
}

export default function AnimalPenHistory({ animalEnar, animalId }: AnimalPenHistoryProps) {
  const [periods, setPeriods] = useState<PenHistoryPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<PenHistoryPeriod | null>(null);

  // Állat-specifikus periódusok betöltése
  const loadAnimalPeriods = async () => {
    try {
      setLoading(true);
      console.log('🐄 Állat karám történet betöltése...', animalEnar);

      // Lekérdezzük azokat a periódusokat, ahol ez az állat szerepel
      // Először minden periódust lekérdezünk, majd JavaScript-ben szűrünk
      const { data, error } = await supabase
        .from('pen_history_periods')
        .select(`
          *,
          pens!inner(
            pen_number,
            location
          )
        `)
        .order('start_date', { ascending: false }); // Legújabb felül

      if (error) {
        console.error('❌ Állat karám történet betöltési hiba:', error);
        return;
      }

      console.log('✅ Karám periódusok betöltve:', data?.length || 0, 'összesen');
      
      // JavaScript-ben szűrjük azokat, ahol ez az állat szerepel
      const animalPeriods = data?.filter(period => {
        const animals = period.animals_snapshot || [];
        return animals.some((animal: any) => animal.enar === animalEnar);
      }) || [];

      console.log('✅ Állat-specifikus periódusok szűrve:', animalPeriods.length, 'találat');
      
      // Adatok formázása
      const formattedPeriods = animalPeriods.map(period => ({
        ...period,
        pen_number: period.pens?.pen_number || 'Ismeretlen',
        pen_location: period.pens?.location || 'Ismeretlen helyszín'
      })) || [];

      setPeriods(formattedPeriods);

    } catch (error) {
      console.error('💥 loadAnimalPeriods hiba:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnimalPeriods();
  }, [animalEnar]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Karám történet betöltése...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <span className="text-2xl mr-3">📚</span>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              {animalEnar} Karám Történet
            </h3>
            <p className="text-sm text-gray-600">
              {periods.length} karám periódus {periods.length === 0 ? '' : 'kronológiai sorrendben'}
            </p>
          </div>
        </div>
      </div>

      {/* Timeline kártyák */}
      {periods.length === 0 ? (
        <div className="text-center py-12">
          <span className="text-6xl mb-4 block">📚</span>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Még nincs karám történet
          </h3>
          <p className="text-gray-600 mb-6">
            Ez az állat még nem szerepel egyetlen karám periódusban sem.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
            <p className="text-sm text-blue-800">
              💡 <strong>Tipp:</strong> A karám történet automatikusan rögzítődik, amikor:
            </p>
            <ul className="text-sm text-blue-700 mt-2 text-left">
              <li>• Az állatot karámba helyezed</li>
              <li>• Manual történeti periódust rögzítesz</li>
              <li>• Karám funkciót váltasz</li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-sm text-gray-600 mb-4">
            📍 <strong>Megjegyzés:</strong> Ez az állat karám útja időrendben, legújabbtól a legrégebbi felé.
          </div>
          
          {/* Kártyák kronológiai sorrendben */}
          {periods.map((period, index) => (
            <div key={period.id} className="relative">
              {/* Timeline vonal */}
              {index < periods.length - 1 && (
                <div className="absolute left-8 top-16 w-0.5 h-8 bg-gray-200 z-0"></div>
              )}
              
              {/* Kártya különleges állat-specifikus megjelenítéssel */}
              <div className="relative z-10">
                <div className="flex items-start gap-4">
                  {/* Timeline pont */}
                  <div className="flex-shrink-0 w-4 h-4 bg-green-500 rounded-full mt-4 border-2 border-white shadow-sm"></div>
                  
                  {/* Kártya tartalma */}
                  <div className="flex-1">
                    <div className="bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-green-300 hover:shadow-md transition-all duration-200">
                      {/* Karám info */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <span className="text-lg mr-2">🏠</span>
                          <h4 className="font-bold text-gray-800">
                            Karám {period.pen_number}
                          </h4>
                          <span className="ml-2 text-sm text-gray-500">
                            ({period.pen_location})
                          </span>
                        </div>
                        {period.historical && (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            📚 Manual
                          </span>
                        )}
                      </div>

                      {/* Funkció és időszak */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <div>
                          <div className="flex items-center text-sm text-gray-600 mb-1">
                            <span className="mr-1">🎯</span>
                            <span className="font-medium">Funkció:</span>
                          </div>
                          <div className="text-sm">
                            {(() => {
                              const displays = {
                                'bölcsi': '🐮 Bölcsi',
                                'óvi': '🐄 Óvi', 
                                'hárem': '💕 Hárem',
                                'vemhes': '🐄💖 Vemhes',
                                'ellető': '🐄🍼 Ellető',
                                'tehén': '🐄🍼 Tehén',
                                'hízóbika': '🐂 Hízóbika',
                                'üres': '⭕ Üres',
                                'átmeneti': '🔄 Átmeneti',
                                'kórház': '🏥 Kórház',
                                'karantén': '🔒 Karantén',
                                'selejt': '📦 Selejt'
                              };
                              return displays[period.function_type as keyof typeof displays] || period.function_type;
                            })()}
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex items-center text-sm text-gray-600 mb-1">
                            <span className="mr-1">📅</span>
                            <span className="font-medium">Időszak:</span>
                          </div>
                          <div className="text-sm">
                            {new Date(period.start_date).toLocaleDateString('hu-HU')} - {' '}
                            {period.end_date 
                              ? new Date(period.end_date).toLocaleDateString('hu-HU')
                              : 'folyamatban'
                            }
                          </div>
                          <div className="text-xs text-gray-500">
                            ({(() => {
                              const start = new Date(period.start_date);
                              const end = period.end_date ? new Date(period.end_date) : new Date();
                              const diffTime = Math.abs(end.getTime() - start.getTime());
                              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                              return `${diffDays} nap${!period.end_date ? ' eddig' : ''}`;
                            })()})
                          </div>
                        </div>
                      </div>

                      {/* Hárem specifikus info */}
                      {period.function_type === 'hárem' && period.metadata && (
                        <div className="mb-3 p-3 bg-pink-50 rounded-lg border border-pink-200">
                          <div className="text-sm text-pink-800">
                            {period.metadata.bulls && Array.isArray(period.metadata.bulls) ? (
                              <div>
                                🐂 <strong>Tenyészbikák:</strong> {' '}
                                {period.metadata.bulls.map((bull: any) => bull.name || bull.enar).join(', ')}
                              </div>
                            ) : period.metadata.tenyeszbika_name ? (
                              <div>
                                🐂 <strong>Tenyészbika:</strong> {period.metadata.tenyeszbika_name}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      )}

                      {/* Állatok száma */}
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <div>
                          🐄 <strong>Társak:</strong> {(period.animals_snapshot?.length || 1) - 1} további állat
                        </div>
                        <button
                          onClick={() => setSelectedPeriod(period)}
                          className="bg-green-100 text-green-700 px-3 py-1 rounded hover:bg-green-200 transition-colors"
                        >
                          📋 Részletek
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Részletek modal - ugyanaz mint a PenHistoryTab-ban */}
      {selectedPeriod && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden mx-4">
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center">
                <span className="text-2xl mr-3">📋</span>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Karám {selectedPeriod.pen_number} - {selectedPeriod.function_type.toUpperCase()} Periódus
                  </h3>
                  <p className="text-sm text-gray-600">
                    {new Date(selectedPeriod.start_date).toLocaleDateString('hu-HU')} - {' '}
                    {selectedPeriod.end_date ? new Date(selectedPeriod.end_date).toLocaleDateString('hu-HU') : 'folyamatban'}
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => setSelectedPeriod(null)}
                className="text-gray-400 hover:text-gray-600 p-2 transition-colors"
              >
                <span className="text-xl">❌</span>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {/* Alapadatok */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <span className="mr-2">🏠</span>
                    Karám adatok
                  </h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Karám:</strong> {selectedPeriod.pen_number}</p>
                    <p><strong>Helyszín:</strong> {selectedPeriod.pen_location}</p>
                    <p><strong>Funkció:</strong> {selectedPeriod.function_type}</p>
                    <p><strong>Típus:</strong> {selectedPeriod.historical ? '📚 Manual rögzítés' : '🤖 Automatikus'}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <span className="mr-2">📅</span>
                    Időszak adatok
                  </h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Kezdet:</strong> {new Date(selectedPeriod.start_date).toLocaleDateString('hu-HU')}</p>
                    <p><strong>Vég:</strong> {selectedPeriod.end_date ? new Date(selectedPeriod.end_date).toLocaleDateString('hu-HU') : 'Folyamatban'}</p>
                    <p><strong>Időtartam:</strong> {(() => {
                      const start = new Date(selectedPeriod.start_date);
                      const end = selectedPeriod.end_date ? new Date(selectedPeriod.end_date) : new Date();
                      const diffTime = Math.abs(end.getTime() - start.getTime());
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                      return `${diffDays} nap`;
                    })()}</p>
                  </div>
                </div>
              </div>

              {/* Hárem specifikus adatok */}
              {selectedPeriod.function_type === 'hárem' && selectedPeriod.metadata && (
                <div className="mb-6 p-4 bg-pink-50 rounded-lg border border-pink-200">
                  <h4 className="font-semibold text-pink-900 mb-3 flex items-center">
                    <span className="mr-2">💕</span>
                    Hárem adatok
                  </h4>
                  
                  {/* Tenyészbikák */}
                  {selectedPeriod.metadata.bulls && (
                    <div className="mb-3">
                      <p className="font-medium text-pink-800 mb-2">🐂 Tenyészbikák:</p>
                      <div className="space-y-1">
                        {selectedPeriod.metadata.bulls.map((bull: any, index: number) => (
                          <div key={index} className="text-sm text-pink-700 bg-pink-100 px-2 py-1 rounded">
                            • {bull.name || `${index + 1}. tenyészbika`} {bull.enar && `(${bull.enar})`}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Társak listája */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <span className="mr-2">🐄</span>
                  Társak ebben a periódusban ({(selectedPeriod.animals_snapshot?.length || 1) - 1} további állat)
                </h4>
                
                {selectedPeriod.animals_snapshot && selectedPeriod.animals_snapshot.length > 1 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            ENAR
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Kategória
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Ivar
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {selectedPeriod.animals_snapshot
                          .filter(animal => animal.enar !== animalEnar) // Az aktuális állatot kihagyjuk
                          .map((animal, index) => (
                            <tr key={animal.id || index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {animal.enar}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                {animal.kategoria === 'tenyészbika' ? '🐂' : '🐄'} {animal.kategoria}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                {animal.ivar === 'hím' ? '♂️' : '♀️'} {animal.ivar}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                    <p>Ez az állat egyedül volt ebben a periódusban</p>
                  </div>
                )}
              </div>

              {/* Megjegyzések */}
              {selectedPeriod.notes && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                    <span className="mr-2">📝</span>
                    Megjegyzések
                  </h4>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {selectedPeriod.notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}