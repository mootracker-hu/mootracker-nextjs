// src/components/PenHistoryTab.tsx
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import PenHistoryCard from './PenHistoryCard';
import AddHistoricalPeriod from './AddHistoricalPeriod';
import EditHistoricalPeriod from './EditHistoricalPeriod'; // ÚJ IMPORT
import { 
  broadcastManualPeriodAdded, 
  broadcastPenHistoryUpdate,
  broadcastAnimalHistoryUpdate,
  usePenHistorySync 
} from '@/lib/penHistorySync';

interface Animal {
  id: number;
  enar: string;
  kategoria: string;
  ivar: string;
  statusz: string; // ← Ezt add hozzá
}

interface PenHistoryPeriod {
  id: string;
  pen_id: string;
  function_type: string;
  start_date: string;
  end_date: string | null;
  animals_snapshot: Animal[];
  metadata: any;
  notes?: string;
  historical: boolean;
  created_at: string;
}

interface PenHistoryTabProps {
  penId: string;
  penNumber: string;
  onDataChange?: () => void;
}

export default function PenHistoryTab({ 
  penId, 
  penNumber, 
  onDataChange 
}: PenHistoryTabProps) {
  const [periods, setPeriods] = useState<PenHistoryPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false); // ÚJ STATE
  const [selectedPeriod, setSelectedPeriod] = useState<PenHistoryPeriod | null>(null);
  const [editingPeriod, setEditingPeriod] = useState<PenHistoryPeriod | null>(null); // ÚJ STATE
  const [filter, setFilter] = useState<'all' | 'harem' | 'other'>('all');

  // Periódusok betöltése
  const loadPeriods = async () => {
    try {
      setLoading(true);
      console.log('📚 Karámtörténet betöltése...', penId);

      const { data, error } = await supabase
        .from('pen_history_periods')
        .select('*')
        .eq('pen_id', penId)
        .order('start_date', { ascending: false }); // Legújabb felül

      if (error) {
        console.error('❌ Karámtörténet betöltési hiba:', error);
        return;
      }

      console.log('✅ Karámtörténet betöltve:', data?.length || 0, 'periódus');
      setPeriods(data || []);

    } catch (error) {
      console.error('💥 loadPeriods hiba:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPeriods();
  }, [penId]);

  // ✅ ÚJ: Real-time szinkronizáció (a loadPeriods függvény után)
  const { lastSync } = usePenHistorySync(penId, undefined, loadPeriods);

  // Szűrt periódusok
  const filteredPeriods = periods.filter(period => {
    if (filter === 'all') return true;
    if (filter === 'harem') return period.function_type === 'hárem';
    if (filter === 'other') return period.function_type !== 'hárem';
    return true;
  });

  // ÚJ: Szerkesztés indítása
  const startEdit = (period: PenHistoryPeriod) => {
    setEditingPeriod(period);
    setShowEditForm(true);
    setSelectedPeriod(null); // Modal bezárása
  };

  // Periódus törlése
  const deletePeriod = async (periodId: string) => {
    const period = periods.find(p => p.id === periodId);
    if (!period) return;

    const confirmDelete = confirm(
      `🗑️ Biztosan törölni szeretnéd ezt a periódust?\n\n` +
      `Típus: ${period.function_type}\n` +
      `Időszak: ${new Date(period.start_date).toLocaleDateString('hu-HU')} - ${period.end_date ? new Date(period.end_date).toLocaleDateString('hu-HU') : 'folyamatban'}\n` +
      `Állatok: ${period.animals_snapshot?.length || 0} db\n\n` +
      `⚠️ Ez a művelet nem visszafordítható!`
    );

    if (!confirmDelete) return;

    try {
      const { error } = await supabase
        .from('pen_history_periods')
        .delete()
        .eq('id', periodId);

      if (error) {
        throw error;
      }

      console.log('✅ Periódus sikeresen törölve:', periodId);
      alert('✅ Periódus sikeresen törölve!');
      
      // Lista frissítése
      loadPeriods();
      
      // Parent komponens értesítése
      if (onDataChange) {
        onDataChange();
      }

    } catch (error) {
      console.error('❌ Törlési hiba:', error);
      alert('❌ Hiba történt a törlés során: ' + (error instanceof Error ? error.message : 'Ismeretlen hiba'));
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Karámtörténet betöltése...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center">
          <span className="text-2xl mr-3">📚</span>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Karám {penNumber} Történet
            </h2>
            <p className="text-sm text-gray-600">
              {periods.length} periódus összesen
            </p>
          </div>
        </div>
        
        <button 
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg transition-colors inline-flex items-center"
        >
          <span className="mr-2">📝</span>
          Történeti Periódus Hozzáadása
        </button>
      </div>

      {/* Szűrők */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'all' 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          🏠 Minden ({periods.length})
        </button>
        <button
          onClick={() => setFilter('harem')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'harem' 
              ? 'bg-pink-100 text-pink-800 border border-pink-200' 
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          💕 Hárem ({periods.filter(p => p.function_type === 'hárem').length})
        </button>
        <button
          onClick={() => setFilter('other')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'other' 
              ? 'bg-gray-100 text-gray-800 border border-gray-200' 
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          🔄 Egyéb ({periods.filter(p => p.function_type !== 'hárem').length})
        </button>
      </div>

      {/* Manual add form */}
      {showAddForm && (
        <div className="mb-6">
          <AddHistoricalPeriod 
            penId={penId}
            penNumber={penNumber}
            onSave={() => {
              setShowAddForm(false);
              loadPeriods(); // Lista frissítése
              if (onDataChange) onDataChange(); // Parent értesítése
            }}
            onCancel={() => setShowAddForm(false)}
          />
        </div>
      )}

      {/* ÚJ: Manual edit form */}
      {showEditForm && editingPeriod && (
        <div className="mb-6">
          <EditHistoricalPeriod 
            period={editingPeriod}
            penNumber={penNumber}
            onSave={() => {
              setShowEditForm(false);
              setEditingPeriod(null);
              loadPeriods(); // Lista frissítése
              if (onDataChange) onDataChange(); // Parent értesítése
            }}
            onCancel={() => {
              setShowEditForm(false);
              setEditingPeriod(null);
            }}
          />
        </div>
      )}

      {/* Periódus kártyák */}
      {filteredPeriods.length === 0 ? (
        <div className="text-center py-12">
          <span className="text-6xl mb-4 block">📚</span>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {filter === 'all' 
              ? 'Még nincs karám történet' 
              : `Nincs ${filter === 'harem' ? 'hárem' : 'egyéb'} periódus`
            }
          </h3>
          <p className="text-gray-600 mb-6">
            {filter === 'all'
              ? 'Add hozzá az első történeti periódust a "📝 Történeti Periódus Hozzáadása" gombbal.'
              : 'Próbálj meg másik szűrőt használni.'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPeriods.map(period => (
            <PenHistoryCard 
              key={period.id}
              period={period}
              onClick={() => setSelectedPeriod(period)}
            />
          ))}
        </div>
      )}

      {/* Részletek modal - FRISSÍTETT SZERKESZTÉS GOMBBAL */}
      {selectedPeriod && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden mx-4">
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center">
                <span className="text-2xl mr-3">📋</span>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {selectedPeriod.function_type.toUpperCase()} Periódus Részletei
                  </h3>
                  <p className="text-sm text-gray-600">
                    Karám {penNumber} • {new Date(selectedPeriod.start_date).toLocaleDateString('hu-HU')} - {' '}
                    {selectedPeriod.end_date ? new Date(selectedPeriod.end_date).toLocaleDateString('hu-HU') : 'folyamatban'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {/* ÚJ: Szerkesztés gomb */}
                <button
                  onClick={() => startEdit(selectedPeriod)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors inline-flex items-center"
                >
                  <span className="mr-1">✏️</span>
                  Szerkesztés
                </button>
                
                {/* Törlés gomb */}
                <button
                  onClick={() => {
                    setSelectedPeriod(null);
                    deletePeriod(selectedPeriod.id);
                  }}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors inline-flex items-center"
                >
                  <span className="mr-1">🗑️</span>
                  Törlés
                </button>
                
                {/* Bezárás gomb */}
                <button
                  onClick={() => setSelectedPeriod(null)}
                  className="text-gray-400 hover:text-gray-600 p-2 transition-colors"
                >
                  <span className="text-xl">❌</span>
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {/* Alapadatok */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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
                    <p><strong>Típus:</strong> {selectedPeriod.historical ? '📚 Manual rögzítés' : '🤖 Automatikus'}</p>
                    {selectedPeriod.metadata?.last_edited && (
                      <p><strong>Utolsó szerkesztés:</strong> {new Date(selectedPeriod.metadata.last_edited).toLocaleDateString('hu-HU')}</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <span className="mr-2">🐄</span>
                    Állatok ({selectedPeriod.animals_snapshot?.length || 0} db)
                  </h4>
                  {selectedPeriod.function_type === 'hárem' && (
                    <div className="space-y-2 text-sm mb-4">
                      {(() => {
                        const animals = selectedPeriod.animals_snapshot || [];
                        const bulls = animals.filter(a => a.kategoria === 'tenyészbika');
                        const females = animals.filter(a => a.kategoria !== 'tenyészbika');
                        return (
                          <>
                            <p><strong>🐂 Tenyészbikák:</strong> {bulls.length} db</p>
                            <p><strong>🐄 Nőivarok:</strong> {females.length} db</p>
                          </>
                        );
                      })()}
                    </div>
                  )}
                  
                  {/* Eladott állatok információ */}
                  {selectedPeriod.metadata?.sold_animals_count > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded p-2 text-sm">
                      <p className="text-red-800 font-medium">📦 Eladott állatok: {selectedPeriod.metadata.sold_animals_count} db</p>
                      <p className="text-red-600 text-xs">Csak történeti rögzítés</p>
                    </div>
                  )}
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
                            {bull.sold_status === 'eladott' && (
                              <span className="ml-2 text-xs text-red-600">[ELADOTT]</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* További metadata */}
                  {selectedPeriod.metadata.pregnancy_rate && (
                    <p className="text-sm text-pink-700">
                      <strong>📊 Fogamzási ráta:</strong> {selectedPeriod.metadata.pregnancy_rate}%
                    </p>
                  )}
                </div>
              )}

              {/* Állatok táblázat */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <span className="mr-2">📋</span>
                  Állatok listája
                </h4>
                
                {selectedPeriod.animals_snapshot && selectedPeriod.animals_snapshot.length > 0 ? (
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
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Státusz
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {selectedPeriod.animals_snapshot.map((animal, index) => (
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
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                              {animal.statusz === 'eladott' ? (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  📦 Eladott
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  ✅ Aktív
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>Nincs állat adat mentve ehhez a periódushoz</p>
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