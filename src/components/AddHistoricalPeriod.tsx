// src/components/AddHistoricalPeriod.tsx
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import AnimalSelector from './AnimalSelector';
import { broadcastManualPeriodAdded, broadcastPenHistoryUpdate, broadcastAnimalHistoryUpdate } from '@/lib/penHistorySync';

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

  // ÚJ: Állatok és tenyészbikák state-jei
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


  // ÚJ: Kiválasztott állatok adatainak lekérdezése
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
      .select('id, enar, kategoria, ivar, szuletesi_datum')
      .in('id', selectedAnimals);

    if (error) throw error;
    setSelectedAnimalsData(data || []);
  } catch (error) {
    console.error('❌ Kiválasztott állatok adatainak lekérdezése sikertelen:', error);
  }
};

// ÚJ: Tenyészbikák betöltése
useEffect(() => {
  loadAvailableBulls();
}, []);

const loadAvailableBulls = async () => {
  try {
    const { data, error } = await supabase
      .from('animals')
      .select('id, enar, name, kategoria')
      .eq('kategoria', 'tenyészbika')
      .eq('statusz', 'aktív')
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
      console.log('💾 Mentés indítása:', {
        selectedAnimals: selectedAnimals.length,
        animalsData: selectedAnimalsData.length,
        functionType: formData.function_type
      });

      // 2. Metadata összeállítása
      const metadata: any = {
        animal_count: selectedAnimalsData.length,
        manual_entry: true,
        entry_date: new Date().toISOString(),
        selected_animal_ids: selectedAnimals // Hivatkozás az állat ID-kre
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
    kplsz: bull.kplsz || ''
  }));
  metadata.bull_count = selectedBullsData.length;
  
  // Nőivarok és bikák szétválasztása
  const bulls = selectedAnimalsData.filter(a => a.kategoria === 'tenyészbika') || [];
  const females = selectedAnimalsData.filter(a => a.kategoria !== 'tenyészbika') || [];
  
  metadata.bull_count_actual = bulls.length;
  metadata.female_count = females.length;
  metadata.selected_bulls = selectedBullsData; // Teljes tenyészbika adatok
}

      // Kategória összesítő a metadata-ba
      // ÚJ:
      const categoryStats: Record<string, number> = {};
      selectedAnimalsData.forEach(animal => {
        categoryStats[animal.kategoria] = (categoryStats[animal.kategoria] || 0) + 1;
      });
      metadata.category_breakdown = categoryStats;

      // 3. Periódus mentése
      const { error: insertError } = await supabase
        .from('pen_history_periods')
        .insert({
          pen_id: penId,
          function_type: formData.function_type,
          start_date: formData.start_date,
          end_date: formData.end_date || null,
          animals_snapshot: selectedAnimalsData, // Teljes állat adatok
          metadata: metadata,
          notes: formData.notes || null,
          historical: true // Manual rögzítés
        });

      if (insertError) {
        throw new Error(`Mentési hiba: ${insertError.message}`);
      }

      console.log('✅ Történeti periódus sikeresen mentve');

      // ✅ ÚJ: Fizikai állat szinkronizáció (csak folyamatban lévő periódusokhoz)
if (!formData.end_date) {
  try {
    console.log('🔄 Folyamatban lévő periódus - állatok fizikai szinkronizálása...');
    
    for (const animal of selectedAnimalsData) {
      // Régi hozzárendelések lezárása
      await supabase
        .from('animal_pen_assignments')
        .update({ removed_at: new Date().toISOString() })
        .eq('animal_id', animal.id)
        .is('removed_at', null);
      
      // Új hozzárendelés
      await supabase
        .from('animal_pen_assignments')
        .insert({
          animal_id: animal.id,
          pen_id: penId,
          assigned_at: new Date().toISOString(),
          assignment_reason: 'Folyamatban lévő periódus szinkronizáció'
        });
      
      // Animals tábla frissítése
      await supabase
        .from('animals')
        .update({ jelenlegi_karam: penNumber })
        .eq('id', animal.id);
    }
    
    console.log('✅ Állatok fizikailag szinkronizálva:', selectedAnimalsData.length);
  } catch (syncError) {
    console.error('❌ Fizikai szinkronizáció hiba:', syncError);
  }
} else {
  console.log('📚 Lezárt periódus - csak történeti kártya, nincs fizikai mozgatás');
}

      // ✅ ÚJ: Broadcast értesítések
      broadcastPenHistoryUpdate(penId, 'period_added', { 
        functionType: formData.function_type,
        animalCount: selectedAnimalsData.length 
      });

      // Érintett állatok broadcast-ja
      const animalIds = selectedAnimalsData.map(animal => animal.id.toString());
      if (animalIds.length > 0) {
        broadcastAnimalHistoryUpdate(animalIds, 'period_added', { 
          penId,
          functionType: formData.function_type 
        });
      }

      // Sikeres mentés üzenet
      const categoryBreakdown = Object.entries(categoryStats)
        .map(([kategoria, count]) => `${kategoria}: ${count}`)
        .join(', ');

      alert(`✅ Történeti periódus sikeresen rögzítve!

Periódus: ${formData.function_type}
Állatok: ${selectedAnimalsData.length} db
Kategóriák: ${categoryBreakdown}
Időszak: ${formData.start_date} - ${formData.end_date || 'folyamatban'}`);

      onSave();

    } catch (error) {
      console.error('❌ Mentési hiba:', error);
      alert(`❌ Hiba történt a mentés során:\n${error instanceof Error ? error.message : 'Ismeretlen hiba'}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <span className="text-2xl mr-3">📝</span>
          <h3 className="text-xl font-bold text-gray-900">
            Történeti Periódus Hozzáadása
          </h3>
        </div>
        <div className="text-sm text-gray-500">
          Karám {penNumber}
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

        {/* ÚJ: AnimalSelector integráció */}
        <div>
          <AnimalSelector
            penId={penId}
            selected={selectedAnimals}
            onChange={setSelectedAnimals}
            multiSelect={true}
            currentOnly={false} // Minden állat elérhető, nem csak karámbeliek
            label="🐄 Állatok kiválasztása *"
            placeholder="Keresés ENAR, kategória alapján..."
            maxHeight="max-h-80"
          />
        </div>

        {/* Kiválasztott állatok összesítő */}
        {selectedAnimalsData.length > 0 && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">
              📊 Kiválasztott állatok összesítő ({selectedAnimalsData.length} db)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-blue-800">Kategóriák:</p>
                <ul className="text-blue-700">
                  // ÚJ:
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
                  // ÚJ:
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

        {/* Hárem specifikus mező */}
{formData.function_type === 'hárem' && (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      🐂 Tenyészbikák kiválasztása
    </label>
    
    {availableBulls.length > 0 ? (
      <div className="border border-gray-300 rounded-lg p-3 max-h-48 overflow-y-auto">
        <div className="space-y-2">
          {availableBulls.map(bull => (
            <label key={bull.id} className="flex items-center">
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
              <span className="text-sm">
                🐂 {bull.enar} - {bull.name || 'Névtelen'}
              </span>
            </label>
          ))}
        </div>
        
        {selectedBulls.length > 0 && (
          <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded">
            <p className="text-green-800 text-sm">
              {selectedBulls.length} tenyészbika kiválasztva
            </p>
          </div>
        )}
      </div>
    ) : (
      <div className="p-3 text-gray-500 text-sm border border-gray-200 rounded-lg">
        Nincsenek elérhető tenyészbikák az adatbázisban
      </div>
    )}
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
              Történeti Periódus Mentése
            </>
          )}
        </button>
      </div>
    </div>
  );
}