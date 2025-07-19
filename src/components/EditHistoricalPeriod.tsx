// src/components/EditHistoricalPeriod.tsx
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import AnimalSelector from './AnimalSelector';
import { broadcastPenHistoryUpdate, broadcastAnimalHistoryUpdate } from '@/lib/penHistorySync';

interface PenHistoryPeriod {
  id: string;
  pen_id: string;
  function_type: string;
  start_date: string;
  end_date: string | null;
  animals_snapshot: any[];
  metadata: any;
  notes?: string;
  historical: boolean;
  created_at: string;
}

interface EditHistoricalPeriodProps {
  period: PenHistoryPeriod;
  penNumber: string;
  onSave: () => void;
  onCancel: () => void;
}

export default function EditHistoricalPeriod({
  period,
  penNumber,
  onSave,
  onCancel
}: EditHistoricalPeriodProps) {
  const [formData, setFormData] = useState({
    start_date: period.start_date,
    end_date: period.end_date || '',
    function_type: period.function_type,
    notes: period.notes || ''
  });

  const [selectedAnimals, setSelectedAnimals] = useState<number[]>([]);
  const [selectedAnimalsData, setSelectedAnimalsData] = useState<any[]>([]);
  const [selectedBulls, setSelectedBulls] = useState<number[]>([]);
  const [availableBulls, setAvailableBulls] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Funkció opciók
  const functionOptions = [
    { value: 'hárem', label: '💕 Hárem' },
    { value: 'vemhes', label: '🐄💖 Vemhes' },
    { value: 'bölcsi', label: '🐮 Bölcsi' },
    { value: 'óvi', label: '🐄 Óvi' },
    { value: 'ellető', label: '🐄🍼 Ellető' },
    { value: 'tehén', label: '🐄🍼 Tehén' },
    { value: 'hízóbika', label: '🐂 Hízóbika' },
    { value: 'üres', label: '⭕ Üres' },
    { value: 'átmeneti', label: '🔄 Átmeneti' },
    { value: 'kórház', label: '🏥 Kórház' },
    { value: 'karantén', label: '🔒 Karantén' },
    { value: 'selejt', label: '📦 Selejt' }
  ];

  // Eredeti adatok betöltése
  useEffect(() => {
    loadOriginalData();
  }, [period]);

  const loadOriginalData = async () => {
    try {
      setLoading(true);
      console.log('📂 Eredeti periódus adatok betöltése:', period.id);

      // 1. Állatok ID-k kinyerése a snapshot-ból
      const animalIds = period.animals_snapshot?.map(animal => animal.id).filter(Boolean) || [];
      console.log('🐄 Eredeti állat ID-k:', animalIds);

      setSelectedAnimals(animalIds);

      // 2. Tenyészbikák kinyerése a metadata-ból
      if (period.metadata?.bulls) {
        const bullIds = period.metadata.bulls.map((bull: any) => bull.id).filter(Boolean);
        console.log('🐂 Eredeti tenyészbika ID-k:', bullIds);
        setSelectedBulls(bullIds);
      }

      // 3. Tenyészbikák listájának betöltése
      await loadAvailableBulls();

    } catch (error) {
      console.error('❌ Eredeti adatok betöltési hiba:', error);
    } finally {
      setLoading(false);
    }
  };

  // Kiválasztott állatok adatainak lekérdezése
  useEffect(() => {
    if (selectedAnimals.length > 0) {
      loadSelectedAnimalsData();
    } else {
      setSelectedAnimalsData([]);
    }
  }, [selectedAnimals]);

  const loadSelectedAnimalsData = async () => {
    try {
      console.log('🔍 Kiválasztott állatok adatainak lekérdezése:', selectedAnimals);
      
      if (selectedAnimals.length === 0) {
        setSelectedAnimalsData([]);
        return;
      }

      const { data, error } = await supabase
        .from('animals')
        .select('id, enar, kategoria, ivar, szuletesi_datum, statusz')
        .in('id', selectedAnimals);

      if (error) {
        console.error('❌ Supabase error:', error);
        throw error;
      }

      console.log('✅ Állatok betöltve:', data?.length || 0);
      setSelectedAnimalsData(data || []);
    } catch (error) {
      console.error('❌ Kiválasztott állatok adatainak lekérdezése sikertelen:', error);
    }
  };

  // Tenyészbikák betöltése
  const loadAvailableBulls = async () => {
    try {
      const { data, error } = await supabase
        .from('animals')
        .select('id, enar, name, kategoria, statusz')
        .eq('kategoria', 'tenyészbika')
        .in('statusz', ['aktív', 'eladott', 'elhullott']) // ← ELHULLOTT TENYÉSZBIKÁK IS!
        .order('enar');

      if (error) throw error;
      setAvailableBulls(data || []);
      console.log('🐂 Tenyészbikák betöltve:', data?.length || 0);
    } catch (error) {
      console.error('❌ Tenyészbikák betöltése sikertelen:', error);
    }
  };

  const handleSave = async () => {
    // Validáció
    if (!formData.start_date || !formData.function_type) {
      alert('⚠️ Kérlek töltsd ki a kötelező mezőket!');
      return;
    }

    if (selectedAnimals.length === 0) {
      alert('⚠️ Legalább egy állatot ki kell választani!');
      return;
    }

    setSaving(true);

    try {
      console.log('💾 Periódus frissítés indítása:', {
        periodId: period.id,
        selectedAnimals: selectedAnimals.length,
        animalsData: selectedAnimalsData.length,
        functionType: formData.function_type
      });

      // Metadata összeállítása
      const metadata: any = {
        ...period.metadata, // Meglévő metadata megőrzése
        animal_count: selectedAnimalsData.length,
        last_edited: new Date().toISOString(),
        selected_animal_ids: selectedAnimals
      };

      // Hárem specifikus metadata frissítése
      if (formData.function_type === 'hárem' && selectedBulls.length > 0) {
        const selectedBullsData = availableBulls.filter(bull => 
          selectedBulls.includes(bull.id)
        );
        
        metadata.bulls = selectedBullsData.map(bull => ({
          id: bull.id,
          enar: bull.enar,
          name: bull.name || 'Névtelen',
          kplsz: bull.kplsz || '',
          sold_status: bull.statusz === 'eladott' ? 'eladott' : 'aktív'
        }));
        metadata.bull_count = selectedBullsData.length;
        
        const bulls = selectedAnimalsData.filter(a => a.kategoria === 'tenyészbika') || [];
        const females = selectedAnimalsData.filter(a => a.kategoria !== 'tenyészbika') || [];
        
        metadata.bull_count_actual = bulls.length;
        metadata.female_count = females.length;
        metadata.selected_bulls = selectedBullsData;
      } else if (formData.function_type !== 'hárem') {
        // Ha már nem hárem, töröljük a hárem specifikus metadata-t
        delete metadata.bulls;
        delete metadata.bull_count;
        delete metadata.bull_count_actual;
        delete metadata.female_count;
        delete metadata.selected_bulls;
      }

      // Kategória összesítő frissítése
      const categoryStats: Record<string, number> = {};
      selectedAnimalsData.forEach(animal => {
        categoryStats[animal.kategoria] = (categoryStats[animal.kategoria] || 0) + 1;
      });
      metadata.category_breakdown = categoryStats;

      // Eladott és elhullott állatok számlálása
      const soldAnimals = selectedAnimalsData.filter(a => a.statusz === 'eladott');
      const deceasedAnimals = selectedAnimalsData.filter(a => a.statusz === 'elhullott');
      const inactiveAnimals = [...soldAnimals, ...deceasedAnimals];
      
      if (inactiveAnimals.length > 0) {
        metadata.inactive_animals_count = inactiveAnimals.length;
        metadata.sold_animals_count = soldAnimals.length;
        metadata.deceased_animals_count = deceasedAnimals.length;
        metadata.contains_inactive_animals = true;
        metadata.inactive_animals = inactiveAnimals.map(a => ({
          id: a.id,
          enar: a.enar,
          statusz: a.statusz
        }));
      } else {
        delete metadata.inactive_animals_count;
        delete metadata.sold_animals_count;
        delete metadata.deceased_animals_count;
        delete metadata.contains_inactive_animals;
        delete metadata.inactive_animals;
      }

      // Periódus frissítése
      const { error: updateError } = await supabase
        .from('pen_history_periods')
        .update({
          function_type: formData.function_type,
          start_date: formData.start_date,
          end_date: formData.end_date || null,
          animals_snapshot: selectedAnimalsData,
          metadata: metadata,
          notes: formData.notes || null
        })
        .eq('id', period.id);

      if (updateError) {
        throw new Error(`Frissítési hiba: ${updateError.message}`);
      }

      console.log('✅ Történeti periódus sikeresen frissítve');

      // Fizikai állat szinkronizáció (ha folyamatban lévő periódus)
      if (!formData.end_date) {
        try {
          console.log('🔄 Folyamatban lévő periódus - állatok fizikai szinkronizálása...');
          
          // Előző fizikai hozzárendelések lezárása ehhez a karámhoz
          await supabase
            .from('animal_pen_assignments')
            .update({ removed_at: new Date().toISOString() })
            .eq('pen_id', period.pen_id)
            .is('removed_at', null);

          // Csak az aktív állatok fizikai mozgatása
          const activeAnimals = selectedAnimalsData.filter(a => a.statusz === 'aktív');
          
          for (const animal of activeAnimals) {
            // Új hozzárendelés
            await supabase
              .from('animal_pen_assignments')
              .insert({
                animal_id: animal.id,
                pen_id: period.pen_id,
                assigned_at: new Date().toISOString(),
                assignment_reason: 'Szerkesztett periódus szinkronizáció'
              });
            
            // Animals tábla frissítése
            await supabase
              .from('animals')
              .update({ jelenlegi_karam: penNumber })
              .eq('id', animal.id);
          }
          
          console.log('✅ Aktív állatok fizikailag szinkronizálva:', activeAnimals.length);
        } catch (syncError) {
          console.error('❌ Fizikai szinkronizáció hiba:', syncError);
        }
      }

      // Broadcast értesítések
      broadcastPenHistoryUpdate(period.pen_id, 'period_updated', { 
        periodId: period.id,
        functionType: formData.function_type,
        animalCount: selectedAnimalsData.length 
      });

      // Érintett állatok broadcast-ja
      const activeAnimalIds = selectedAnimalsData.filter(a => a.statusz === 'aktív').map(animal => animal.id.toString());
      if (activeAnimalIds.length > 0) {
        broadcastAnimalHistoryUpdate(activeAnimalIds, 'period_updated', { 
          penId: period.pen_id,
          functionType: formData.function_type 
        });
      }

      // Sikeres frissítés üzenet
      const categoryBreakdown = Object.entries(categoryStats)
        .map(([kategoria, count]) => `${kategoria}: ${count}`)
        .join(', ');

      const inactiveInfo = inactiveAnimals.length > 0 ? `\n\n📋 Nem aktív állatok: ${inactiveAnimals.length} db (${soldAnimals.length} eladott, ${deceasedAnimals.length} elhullott)` : '';

      alert(`✅ Történeti periódus sikeresen frissítve!

Periódus: ${formData.function_type}
Állatok: ${selectedAnimalsData.length} db (${selectedAnimalsData.filter(a => a.statusz === 'aktív').length} aktív + ${inactiveAnimals.length} nem aktív)
Kategóriák: ${categoryBreakdown}
Időszak: ${formData.start_date} - ${formData.end_date || 'folyamatban'}${inactiveInfo}`);

      onSave();

    } catch (error) {
      console.error('❌ Frissítési hiba:', error);
      alert(`❌ Hiba történt a frissítés során:\n${error instanceof Error ? error.message : 'Ismeretlen hiba'}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg border p-6 max-w-4xl mx-auto">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Periódus adatok betöltése...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg border p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <span className="text-2xl mr-3">✏️</span>
          <h3 className="text-xl font-bold text-gray-900">
            Történeti Periódus Szerkesztése
          </h3>
        </div>
        <div className="text-sm text-gray-500">
          Karám {penNumber} • ID: {period.id.slice(0, 8)}...
        </div>
      </div>

      <div className="space-y-6">
        {/* Időszak */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📅 Kezdet dátum *
            </label>
            <input
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📅 Vég dátum
            </label>
            <input
              type="date"
              value={formData.end_date}
              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
              placeholder="Üres = folyamatban"
            />
            <p className="text-xs text-gray-500 mt-1">
              💡 Ha üres marad, akkor "folyamatban" lesz
            </p>
          </div>
        </div>

        {/* Funkció típus */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            🎯 Funkció típus *
          </label>
          <select
            value={formData.function_type}
            onChange={(e) => setFormData({ ...formData, function_type: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors bg-white"
            required
          >
            {functionOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Állatok kiválasztása */}
        <div>
          <AnimalSelector
            penId={period.pen_id}
            selected={selectedAnimals}
            onChange={setSelectedAnimals}
            multiSelect={true}
            currentOnly={false}
            includeSoldAnimals={true}
            label="🐄 Állatok kiválasztása * (aktív, eladott és elhullott állatok)"
            placeholder="Keresés ENAR, kategória alapján... (eladott és elhullott állatok is megjelennek)"
            maxHeight="max-h-80"
          />
          <p className="text-xs text-gray-600 mt-2">
            💡 <strong>Szerkesztés módban:</strong> Állatok hozzáadhatók és eltávolíthatók. Az eladott és elhullott állatok is elérhetők.
          </p>
        </div>

        {/* Kiválasztott állatok összesítő */}
        {selectedAnimalsData.length > 0 && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">
              📊 Kiválasztott állatok összesítő ({selectedAnimalsData.length} db)
            </h4>
            
            {/* Státusz szerinti bontás */}
            {(() => {
              const activeCount = selectedAnimalsData.filter(a => a.statusz === 'aktív').length;
              const soldCount = selectedAnimalsData.filter(a => a.statusz === 'eladott').length;
              const deceasedCount = selectedAnimalsData.filter(a => a.statusz === 'elhullott').length;
              
              return (
                <div className="mb-3 p-2 bg-white rounded border">
                  <p className="text-sm font-medium text-gray-700 mb-1">Státusz megoszlás:</p>
                  <div className="flex gap-4 text-sm">
                    <span className="text-green-700">✅ Aktív: {activeCount} db</span>
                    {soldCount > 0 && (
                      <span className="text-red-700">📦 Eladott: {soldCount} db</span>
                    )}
                    {deceasedCount > 0 && (
                      <span className="text-gray-700">💀 Elhullott: {deceasedCount} db</span>
                    )}
                  </div>
                  {(soldCount > 0 || deceasedCount > 0) && (
                    <p className="text-xs text-red-600 mt-1">
                      ℹ️ A nem aktív állatok csak történeti rögzítésre kerülnek, fizikai mozgatás nem történik.
                    </p>
                  )}
                </div>
              );
            })()}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-blue-800">Kategóriák:</p>
                <ul className="text-blue-700">
                  {(() => {
                    const categoryStats: Record<string, number> = {};
                    selectedAnimalsData.forEach(animal => {
                      categoryStats[animal.kategoria] = (categoryStats[animal.kategoria] || 0) + 1;
                    });

                    return Object.entries(categoryStats).map(([kategoria, count]) => (
                      <li key={kategoria}>• {kategoria}: {count} db</li>
                    ));
                  })()}
                </ul>
              </div>
              <div>
                <p className="font-medium text-blue-800">Ivarok:</p>
                <ul className="text-blue-700">
                  {(() => {
                    const ivarStats: Record<string, number> = {};
                    selectedAnimalsData.forEach(animal => {
                      ivarStats[animal.ivar] = (ivarStats[animal.ivar] || 0) + 1;
                    });

                    return Object.entries(ivarStats).map(([ivar, count]) => (
                      <li key={ivar}>• {ivar}: {count} db</li>
                    ));
                  })()}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Hárem specifikus mező - ELADOTT ÉS ELHULLOTT TENYÉSZBIKÁK IS */}
        {formData.function_type === 'hárem' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🐂 Tenyészbikák kiválasztása (aktív, eladott és elhullott)
            </label>
            
            {availableBulls.length > 0 ? (
              <div className="border border-gray-300 rounded-lg p-3 max-h-48 overflow-y-auto">
                <div className="space-y-2">
                  {availableBulls.map(bull => (
                    <label key={bull.id} className={`flex items-center ${
                      bull.statusz === 'eladott' ? 'bg-red-50 p-2 rounded border border-red-200' : 
                      bull.statusz === 'elhullott' ? 'bg-gray-50 p-2 rounded border border-gray-200' : ''
                    }`}>
                      <input
                        type="checkbox"
                        checked={selectedBulls.includes(bull.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedBulls([...selectedBulls, bull.id]);
                          } else {
                            setSelectedBulls(selectedBulls.filter(id => id !== bull.id));
                          }
                        }}
                        className="mr-3 rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      <span className="text-sm flex-1">
                        🐂 {bull.enar} - {bull.name || 'Névtelen'}
                        {bull.statusz === 'eladott' && (
                          <span className="ml-2 text-xs text-red-600">
                            [ELADOTT]
                          </span>
                        )}
                        {bull.statusz === 'elhullott' && (
                          <span className="ml-2 text-xs text-gray-600">
                            [ELHULLOTT]
                          </span>
                        )}
                      </span>
                    </label>
                  ))}
                </div>
                
                {selectedBulls.length > 0 && (
                  <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded">
                    <p className="text-green-800 text-sm">
                      {selectedBulls.length} tenyészbika kiválasztva
                      {(() => {
                        const selectedBullsData = availableBulls.filter(bull => selectedBulls.includes(bull.id));
                        const activeBulls = selectedBullsData.filter(b => b.statusz === 'aktív').length;
                        const soldBulls = selectedBullsData.filter(b => b.statusz === 'eladott').length;
                        const deceasedBulls = selectedBullsData.filter(b => b.statusz === 'elhullott').length;
                        
                        const statusParts = [];
                        if (activeBulls > 0) statusParts.push(`${activeBulls} aktív`);
                        if (soldBulls > 0) statusParts.push(`${soldBulls} eladott`);
                        if (deceasedBulls > 0) statusParts.push(`${deceasedBulls} elhullott`);
                        
                        return statusParts.length > 1 ? ` (${statusParts.join(', ')})` : '';
                      })()}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3 text-gray-500 text-sm border border-gray-200 rounded-lg">
                Nincsenek elérhető tenyészbikák az adatbázisban
              </div>
            )}
            <p className="text-xs text-gray-600 mt-2">
              💡 Eladott és elhullott tenyészbikák is kiválaszthatók történeti hárem periódus szerkesztéséhez.
            </p>
          </div>
        )}

        {/* Megjegyzés */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            📝 Megjegyzések
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="További megjegyzések a periódusról..."
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
          />
        </div>
      </div>

      {/* Gombok */}
      <div className="flex justify-end gap-3 mt-8">
        <button
          onClick={onCancel}
          disabled={saving}
          className="bg-white hover:bg-gray-50 text-gray-700 font-medium px-6 py-3 rounded-lg border border-gray-300 transition-colors disabled:opacity-50 inline-flex items-center"
        >
          <span className="mr-2">❌</span>
          Mégse
        </button>
        <button
          onClick={handleSave}
          disabled={saving || !formData.start_date || !formData.function_type || selectedAnimals.length === 0}
          className="bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-3 rounded-lg transition-colors disabled:opacity-50 inline-flex items-center"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Mentés...
            </>
          ) : (
            <>
              <span className="mr-2">💾</span>
              Változtatások Mentése
            </>
          )}
        </button>
      </div>
    </div>
  );
}