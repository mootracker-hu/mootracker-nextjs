// src/components/AddHistoricalPeriod.tsx
// ✅ JAVÍTOTT VERZIÓ - CSAK METADATA, NINCS FIZIKAI MOZGATÁS

'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import AnimalSelector from './AnimalSelector';
import { broadcastManualPeriodAdded, broadcastPenHistoryUpdate } from '@/lib/penHistorySync';
import { displayEnar } from '@/constants/enar-formatter';

interface AddHistoricalPeriodProps {
  penId: string;
  penNumber: string;
  onSave: () => void;
  onCancel: () => void;
}

export default function AddHistoricalPeriod({
  penId,
  penNumber,
  onSave,
  onCancel
}: AddHistoricalPeriodProps) {
  const [formData, setFormData] = useState({
    start_date: '',
    end_date: '',
    function_type: 'hárem',
    notes: ''
  });

  // Állatok és tenyészbikák state-jei
  const [selectedAnimals, setSelectedAnimals] = useState<number[]>([]);
  const [selectedAnimalsData, setSelectedAnimalsData] = useState<any[]>([]);
  const [selectedBulls, setSelectedBulls] = useState<number[]>([]);
  const [availableBulls, setAvailableBulls] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

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
      const { data, error } = await supabase
        .from('animals')
        .select('id, enar, kategoria, ivar, szuletesi_datum, statusz')
        .in('id', selectedAnimals);

      if (error) throw error;
      setSelectedAnimalsData(data || []);
    } catch (error) {
      console.error('❌ Kiválasztott állatok adatainak lekérdezése sikertelen:', error);
    }
  };

  // Tenyészbikák betöltése (aktív, eladott, elhullott)
  useEffect(() => {
    loadAvailableBulls();
  }, []);

  const loadAvailableBulls = async () => {
    try {
      const { data, error } = await supabase
        .from('animals')
        .select('id, enar, name, kategoria, statusz')
        .eq('kategoria', 'tenyészbika')
        .in('statusz', ['aktív', 'eladott', 'elhullott'])
        .order('enar');

      if (error) throw error;
      setAvailableBulls(data || []);
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
      console.log('📚 TÖRTÉNETI METADATA MENTÉS (fizikai mozgatás nélkül):', {
        selectedAnimals: selectedAnimals.length,
        functionType: formData.function_type,
        physicalMovement: false // ⚠️ FONTOS: NINCS FIZIKAI MOZGATÁS!
      });

      // ✅ TISZTA METADATA ÖSSZEÁLLÍTÁSA (fizikai mozgatás nélkül)
      const metadata: any = {
        animal_count: selectedAnimalsData.length,
        manual_entry: true,
        entry_date: new Date().toISOString(),
        selected_animal_ids: selectedAnimals,
        historical_only: true, // ⚠️ CSAK TÖRTÉNETI DOKUMENTÁCIÓ!
        no_physical_movement: true // ⚠️ FIZIKAI MOZGATÁS TILTVA!
      };

      // Hárem specifikus metadata
      if (formData.function_type === 'hárem' && selectedBulls.length > 0) {
        const selectedBullsData = availableBulls.filter(bull =>
          selectedBulls.includes(bull.id)
        );

        metadata.bulls = selectedBullsData.map(bull => ({
          id: bull.id,
          enar: bull.enar,
          name: bull.name || 'Névtelen',
          kplsz: bull.kplsz || '',
          sold_status: bull.statusz === 'eladott' ? {
            sold_date: bull.sold_date,
            sold_to: bull.sold_to
          } : null
        }));
        metadata.bull_count = selectedBullsData.length;

        // Nőivarok és bikák szétválasztása
        const bulls = selectedAnimalsData.filter(a => a.kategoria === 'tenyészbika') || [];
        const females = selectedAnimalsData.filter(a => a.kategoria !== 'tenyészbika') || [];

        metadata.bull_count_actual = bulls.length;
        metadata.female_count = females.length;
        metadata.selected_bulls = selectedBullsData;
      }

      // Kategória összesítő
      const categoryStats: Record<string, number> = {};
      selectedAnimalsData.forEach(animal => {
        categoryStats[animal.kategoria] = (categoryStats[animal.kategoria] || 0) + 1;
      });
      metadata.category_breakdown = categoryStats;

      // Nem aktív állatok kezelése
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
      }

      // ✅ TÖRTÉNETI PERIÓDUS MENTÉSE (CSAK METADATA!)
      // ❌ NINCS animal_pen_assignments MÓDOSÍTÁS!
      // ❌ NINCS animals.jelenlegi_karam FRISSÍTÉS!
      // ❌ NINCS FIZIKAI MOZGATÁS!

      const { error: insertError } = await supabase
        .from('pen_history_periods')
        .insert({
          pen_id: penId,
          function_type: formData.function_type,
          start_date: formData.start_date,
          end_date: formData.end_date || null,
          animals_snapshot: selectedAnimalsData, // Csak adatok mentése!
          metadata: metadata,
          notes: formData.notes || null,
          historical: true // ⚠️ TÖRTÉNETI JELÖLÉS!
        });

      if (insertError) {
        throw new Error(`Mentési hiba: ${insertError.message}`);
      }

      console.log('✅ Történeti periódus (CSAK METADATA) sikeresen mentve');

      // ÚJ:
      broadcastPenHistoryUpdate(penId, 'period_added', {
        functionType: formData.function_type,
        animalCount: selectedAnimalsData.length,
        historicalOnly: true
      });

      // Sikeres mentés üzenet
      const categoryBreakdown = Object.entries(categoryStats)
        .map(([kategoria, count]) => `${kategoria}: ${count}`)
        .join(', ');

      const soldInfo = inactiveAnimals.length > 0
        ? `\n\n📋 Nem aktív állatok: ${inactiveAnimals.length} db (${soldAnimals.length} eladott, ${deceasedAnimals.length} elhullott)`
        : '';

      alert(`✅ Történeti periódus sikeresen dokumentálva!

⚠️ CSAK DOKUMENTÁCIÓS CÉLÚ - fizikai mozgatás nem történt!

Periódus: ${formData.function_type}
Állatok: ${selectedAnimalsData.length} db dokumentálva
Kategóriák: ${categoryBreakdown}
Időszak: ${formData.start_date} - ${formData.end_date || 'folyamatban'}${soldInfo}

💡 Valódi állat mozgatáshoz használd a karám oldal "🔄 Mozgatás" gombját!`);

      onSave();

    } catch (error) {
      console.error('❌ Történeti dokumentálási hiba:', error);
      alert(`❌ Hiba történt a dokumentálás során:\n${error instanceof Error ? error.message : 'Ismeretlen hiba'}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <span className="text-2xl mr-3">📚</span>
          <h3 className="text-xl font-bold text-gray-900">
            Történeti Periódus Dokumentálása
          </h3>
        </div>
        <div className="text-sm text-gray-500">
          Karám {penNumber}
        </div>
      </div>

      {/* ⚠️ NAGY FIGYELMEZTETÉS - MÓDOSÍTOTT */}
      <div className="bg-amber-50 p-4 rounded-lg border-2 border-amber-400 mb-6">
        <div className="flex items-start">
          <span className="text-2xl mr-3">⚠️</span>
          <div>
            <h4 className="font-bold text-amber-800 text-lg">Csak Történeti Dokumentáció!</h4>
            <p className="text-amber-700 mt-2">
              Ez a funkció <strong>kizárólag dokumentációs célú</strong>.
              <strong className="text-red-700"> Fizikai állat mozgatás NEM történik!</strong>
            </p>
            <p className="text-amber-600 text-sm mt-2">
              💡 Valódi állat mozgatáshoz használd a karám oldal <strong>"🔄 Állatok Mozgatása"</strong> gombját!
            </p>
          </div>
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

        {/* Állatok kiválasztása - FIGYELMEZTETÉSSEL */}
        <div>
          <AnimalSelector
            penId={penId}
            selected={selectedAnimals}
            onChange={setSelectedAnimals}
            multiSelect={true}
            currentOnly={false}
            includeSoldAnimals={true}
            label="🐄 Állatok dokumentálása * (aktív, eladott és elhullott állatok)"
            placeholder="Keresés ENAR, kategória alapján... (csak dokumentációhoz)"
            maxHeight="max-h-80"
          />

          {/* ⚠️ ERŐS FIGYELMEZTETÉS */}
          <div className="bg-red-50 p-3 rounded-lg border-2 border-red-300 mt-3">
            <div className="flex items-start">
              <span className="text-lg mr-2">🚫</span>
              <div>
                <h5 className="font-medium text-red-800">Fontos - Csak Dokumentáció!</h5>
                <p className="text-sm text-red-700 mt-1">
                  A kiválasztott állatok jelenlegi karám hozzárendelése <strong>NEM változik</strong>.
                  Ez csak történeti dokumentáció, nem valódi mozgatás!
                </p>
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-600 mt-2">
            📚 <strong>Történeti dokumentáció:</strong> Eladott és elhullott állatok is kiválaszthatók
            karámtörténet dokumentálásához.
          </p>
        </div>

        {/* Kiválasztott állatok összesítő */}
        {selectedAnimalsData.length > 0 && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">
              📊 Dokumentálandó állatok ({selectedAnimalsData.length} db)
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
                  <p className="text-xs text-blue-600 mt-1">
                    📚 Minden állat csak történeti dokumentációként kerül rögzítésre.
                  </p>
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

        {/* Hárem specifikus mező - METADATA FIGYELMEZTETÉSSEL */}
        {formData.function_type === 'hárem' && (
          <div className="bg-pink-50 p-4 rounded-lg border border-pink-200">
            <h4 className="text-lg font-medium text-pink-900 mb-2 flex items-center">
              💕 Hárem Metadata (csak dokumentáció)
            </h4>

            <p className="text-sm text-pink-700 mb-4">
              ⚠️ Ez csak történeti dokumentáció - tenyészbikák fizikai hozzárendelése <strong>NEM történik</strong>!
            </p>

            <label className="block text-sm font-medium text-gray-700 mb-2">
              🐂 Tenyészbikák dokumentálása (aktív és eladott)
            </label>

            {availableBulls.length > 0 ? (
              <div className="border border-gray-300 rounded-lg p-3 max-h-48 overflow-y-auto">
                <div className="space-y-2">
                  {availableBulls.map(bull => (
                    <label key={bull.id} className={`flex items-center ${bull.statusz === 'eladott' ? 'bg-red-50 p-2 rounded border border-red-200' : ''}`}>
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
                      </span>
                    </label>
                  ))}
                </div>

                {selectedBulls.length > 0 && (
                  <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded">
                    <p className="text-green-800 text-sm">
                      {selectedBulls.length} tenyészbika dokumentálva (csak metadata)
                      {(() => {
                        const selectedBullsData = availableBulls.filter(bull => selectedBulls.includes(bull.id));
                        const activeBulls = selectedBullsData.filter(b => b.statusz === 'aktív').length;
                        const soldBulls = selectedBullsData.filter(b => b.statusz === 'eladott').length;

                        return soldBulls > 0 ? ` (${activeBulls} aktív, ${soldBulls} eladott)` : '';
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
              📚 Csak metadata dokumentáció - fizikai bika hozzárendelés nem történik.
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
            placeholder="További megjegyzések a történeti periódusról..."
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
          className="bg-amber-600 hover:bg-amber-700 text-white font-medium px-6 py-3 rounded-lg transition-colors disabled:opacity-50 inline-flex items-center"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Dokumentálás...
            </>
          ) : (
            <>
              <span className="mr-2">📚</span>
              Történeti Dokumentálás (Csak Metadata)
            </>
          )}
        </button>
      </div>
    </div>
  );
}