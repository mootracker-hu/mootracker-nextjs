// src/components/AddHistoricalPeriod.tsx
'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

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
    animal_enars: '', // textarea - soronként ENAR számok
    bull_names: '',  // hárem esetén bikák nevei
    notes: ''
  });

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

  const handleSave = async () => {
    // Validáció
    if (!formData.start_date || !formData.function_type) {
      alert('⚠️ Kérlek töltsd ki a kötelező mezőket!');
      return;
    }

    // ENAR-ok feldolgozása
    const animal_enars = formData.animal_enars
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (animal_enars.length === 0) {
      alert('⚠️ Legalább egy állat ENAR-t meg kell adni!');
      return;
    }

    setSaving(true);

    try {
      // 1. Állatok ellenőrzése és lekérdezése
      console.log('🔍 Állatok keresése:', animal_enars);
      
      const { data: animals, error: animalsError } = await supabase
        .from('animals')
        .select('id, enar, kategoria, ivar')
        .in('enar', animal_enars);

      if (animalsError) {
        throw new Error(`Állatok lekérdezési hiba: ${animalsError.message}`);
      }

      // Ellenőrizzük, hogy minden ENAR megtalálható-e
      const foundEnars = animals?.map(a => a.enar) || [];
      const missingEnars = animal_enars.filter(enar => !foundEnars.includes(enar));
      
      if (missingEnars.length > 0) {
        const continueAnyway = confirm(
          `⚠️ A következő ENAR számok nem találhatók az adatbázisban:\n\n${missingEnars.join('\n')}\n\nFolytatod a mentést a megtalált állatokkal?`
        );
        
        if (!continueAnyway) {
          setSaving(false);
          return;
        }
      }

      // 2. Metadata összeállítása
      const metadata: any = {
        animal_count: animals?.length || 0,
        manual_entry: true,
        entry_date: new Date().toISOString()
      };

      // Hárem specifikus metadata
      if (formData.function_type === 'hárem' && formData.bull_names) {
        const bullNames = formData.bull_names
          .split(',')
          .map(name => name.trim())
          .filter(name => name.length > 0);

        metadata.bulls = bullNames.map(name => ({ name, enar: '', kplsz: '' }));
        metadata.bull_count = bullNames.length;
        
        // Nőivarok és bikák szétválasztása
        const bulls = animals?.filter(a => a.kategoria === 'tenyészbika') || [];
        const females = animals?.filter(a => a.kategoria !== 'tenyészbika') || [];
        
        metadata.bull_count_actual = bulls.length;
        metadata.female_count = females.length;
      }

      // 3. Periódus mentése
      const { error: insertError } = await supabase
        .from('pen_history_periods')
        .insert({
          pen_id: penId,
          function_type: formData.function_type,
          start_date: formData.start_date,
          end_date: formData.end_date || null,
          animals_snapshot: animals || [],
          metadata: metadata,
          notes: formData.notes || null,
          historical: true // Manual rögzítés
        });

      if (insertError) {
        throw new Error(`Mentési hiba: ${insertError.message}`);
      }

      console.log('✅ Történeti periódus sikeresen mentve');
      alert(`✅ Történeti periódus sikeresen rögzítve!\n\nPeriódus: ${formData.function_type}\nÁllatok: ${animals?.length || 0} db\nIdőszak: ${formData.start_date} - ${formData.end_date || 'folyamatban'}`);
      
      onSave();

    } catch (error) {
      console.error('❌ Mentési hiba:', error);
      alert(`❌ Hiba történt a mentés során:\n${error instanceof Error ? error.message : 'Ismeretlen hiba'}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border p-6 max-w-2xl mx-auto">
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
              onChange={(e) => setFormData({...formData, start_date: e.target.value})}
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
              onChange={(e) => setFormData({...formData, end_date: e.target.value})}
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
            onChange={(e) => setFormData({...formData, function_type: e.target.value})}
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

        {/* Állatok listája */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            🐄 Állatok ENAR számai *
          </label>
          <textarea
            value={formData.animal_enars}
            onChange={(e) => setFormData({...formData, animal_enars: e.target.value})}
            placeholder="ENAR számok (soronként egy):&#10;HU 32772 0999 0&#10;HU 32772 1001 2&#10;HU 35163 0088 0&#10;stb..."
            rows={8}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors font-mono text-sm"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            💡 Minden sorba egy ENAR számot írj (pl. HU 32772 0999 0)
          </p>
        </div>

        {/* Hárem specifikus mező */}
        {formData.function_type === 'hárem' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🐂 Tenyészbikák nevei
            </label>
            <input
              type="text"
              value={formData.bull_names}
              onChange={(e) => setFormData({...formData, bull_names: e.target.value})}
              placeholder="Tenyészbikák nevei (vesszővel elválasztva): Béla, Balotelli, Bonucci"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
            />
            <p className="text-xs text-gray-500 mt-1">
              💡 Vesszővel válaszd el a neveket
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
            onChange={(e) => setFormData({...formData, notes: e.target.value})}
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
          disabled={saving || !formData.start_date || !formData.function_type}
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