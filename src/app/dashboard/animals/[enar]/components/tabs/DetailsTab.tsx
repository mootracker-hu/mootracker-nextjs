'use client';

import React, { useState, useEffect } from 'react';
import type { Animal } from '@/types/animal-types';
import { displayEnar } from '@/constants/enar-formatter';
import { supabase } from '@/lib/supabase';

// --- Konstansok és segédfüggvények (VÁLTOZATLAN) ---
const getCategoryColor = (category: string | null) => {
  if (!category) return 'bg-gray-100 text-gray-800 border-gray-200';
  const colors: { [key: string]: string } = {
    'tehén': 'bg-green-100 text-green-800 border-green-200', 'szűz_üsző': 'bg-blue-100 text-blue-800 border-blue-200', 'vemhes_üsző': 'bg-purple-100 text-purple-800 border-purple-200', 'nőivarú_borjú': 'bg-pink-100 text-pink-800 border-pink-200', 'hímivarú_borjú': 'bg-orange-100 text-orange-800 border-orange-200', 'hízóbika': 'bg-red-100 text-red-800 border-red-200', 'tenyészbika': 'bg-gray-200 text-gray-900 border-gray-300 font-semibold'
  };
  return colors[category] || 'bg-gray-100 text-gray-800 border-gray-200';
};

const categoryOptions = [{ value: 'tehén', label: 'Tehén' }, { value: 'szűz_üsző', label: 'Szűz üsző' }, { value: 'vemhes_üsző', label: 'Vemhes üsző' }, { value: 'nőivarú_borjú', label: 'Nőivarú borjú' }, { value: 'hímivarú_borjú', label: 'Hímivarú borjú' }, { value: 'hízóbika', label: 'Hízóbika' }, { value: 'tenyészbika', label: 'Tenyészbika' }];
const statusOptions = [{ value: 'aktív', label: 'Aktív' }, { value: 'eladott', label: 'Eladott' }, { value: 'elhullott', label: 'Elhullott' }, { value: 'karantén', label: 'Karantén' }];
const birthLocationOptions = [{ value: 'nálunk', label: '🏠 Nálunk született' }, { value: 'vásárolt', label: '🛒 Vásárolt' }, { value: 'ismeretlen', label: '❓ Ismeretlen' }];
const BREEDS = ['Blonde d\'aquitaine', 'Limousin', 'Magyartarka', 'Egyéb húshasznú', 'Egyéb tejhasznú'];

interface DetailsTabProps {
  animal: Animal;
  editedAnimal: Animal;
  isEditing: boolean;
  updateField: (field: keyof Animal, value: any) => void;
  onUpdate: () => void;
  calculateAge: (date: string) => string;
  getShortId: (enar: string) => string;
}

const DetailsTab: React.FC<DetailsTabProps> = ({
  animal,
  editedAnimal,
  isEditing,
  updateField,
  onUpdate,
  calculateAge,
  getShortId
}) => {
  // 🆕 KARÁM STATE
  const [currentPen, setCurrentPen] = useState<string | null>(null);

  // 🆕 JELENLEGI KARÁM BETÖLTÉSE
  const fetchCurrentPen = async () => {
    if (!animal?.enar || !animal?.id) return;

    try {
      console.log('🔍 Jelenlegi karám meghatározása:', animal.enar);

      // Egyszerű megoldás: jelenlegi_karam mezőből
      if (animal.jelenlegi_karam) {
        setCurrentPen(`Karám ${animal.jelenlegi_karam}`);
        return;
      }

      // Fallback: karám történet alapján
      const animalIdString = animal.id.toString();

      const { data: allPeriods } = await supabase
        .from('pen_history_periods')
        .select(`*, pens!inner(pen_number)`)
        .order('start_date', { ascending: false });

      if (allPeriods && allPeriods.length > 0) {
        const animalLatestPeriod = allPeriods.find(period => {
          const animals = period.animals_snapshot as any[] || [];
          return animals.some(animalInPeriod =>
            animalInPeriod.enar === animal.enar ||
            animalInPeriod.id === animalIdString ||
            (typeof animalInPeriod === 'string' && animalInPeriod === animal.enar)
          );
        });

        if (animalLatestPeriod) {
          const penNumber = animalLatestPeriod.pens?.pen_number;
          const isOngoing = !animalLatestPeriod.end_date;
          setCurrentPen(`Karám ${penNumber}${isOngoing ? '' : ' (lezárt)'}`);
          return;
        }
      }

      setCurrentPen('Nincs karám történet');
    } catch (error) {
      console.error('❌ Hiba a jelenlegi karám meghatározásában:', error);
      setCurrentPen('Hiba történt');
    }
  };

  useEffect(() => {
    if (animal?.id) {
      fetchCurrentPen();
    }
  }, [animal?.id]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* --- ALAPADATOK KÁRTYA --- */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center mb-4">
          <span className="text-2xl mr-3">📋</span>
          <h3 className="text-lg font-semibold text-gray-900">Alapadatok</h3>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">🏷️ ENAR azonosító</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={displayEnar(animal.enar)}
                disabled
                className="flex-1 w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
              />
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">#{getShortId(animal.enar)}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">📝 Név</label>
            {isEditing ? (
              <input
                type="text"
                value={editedAnimal.name || ''}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="Állat neve (opcionális)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            ) : (
              <div className="w-full px-3 py-2 border border-transparent rounded-lg bg-gray-50 text-gray-700 min-h-[42px] flex items-center">
                {animal.name || <span className="text-gray-400">Nincs név megadva</span>}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">🏷️ Kategória</label>
            {isEditing ? (
              <select
                value={editedAnimal.kategoria || ''}
                onChange={(e) => updateField('kategoria', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white"
              >
                {categoryOptions.map(option =>
                  <option key={option.value} value={option.value}>{option.label}</option>
                )}
              </select>
            ) : (
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getCategoryColor(animal.kategoria)}`}>
                {categoryOptions.find(opt => opt.value === animal.kategoria)?.label || animal.kategoria}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">⚥ Ivar</label>
            {isEditing ? (
              <select
                value={editedAnimal.ivar || ''}
                onChange={(e) => updateField('ivar', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white"
              >
                <option value="">Válasszon...</option>
                <option value="nő">♀️ Nőivar</option>
                <option value="hím">♂️ Hímivar</option>
              </select>
            ) : (
              <div className="w-full px-3 py-2 border border-transparent rounded-lg bg-gray-50 text-gray-700 min-h-[42px] flex items-center">
                {animal.ivar === 'nő' ? '♀️ Nőivar' : '♂️ Hímivar'}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">⏰ Életkor</label>
            <div className="w-full px-3 py-2 border border-transparent rounded-lg bg-gray-50 text-gray-700 min-h-[42px] flex items-center">
              {calculateAge(animal.szuletesi_datum)}
            </div>
          </div>
        </div>
      </div>

      {/* --- JELENLEGI ÁLLAPOT KÁRTYA --- */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center mb-4">
          <span className="text-2xl mr-3">📊</span>
          <h3 className="text-lg font-semibold text-gray-900">Jelenlegi állapot</h3>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">✅ Státusz</label>
            {isEditing ? (
              <select
                value={editedAnimal.statusz || ''}
                onChange={(e) => updateField('statusz', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white"
              >
                {statusOptions.map(option =>
                  <option key={option.value} value={option.value}>{option.label}</option>
                )}
              </select>
            ) : (
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${animal.statusz === 'aktív' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {statusOptions.find(opt => opt.value === animal.statusz)?.label || animal.statusz}
              </span>
            )}
          </div>

          {/* 🆕 JELENLEGI KARÁM MEGJELENÍTÉS */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">📍 Jelenlegi karám</label>
              <button onClick={fetchCurrentPen} className="text-xs text-blue-600 hover:text-blue-800 inline-flex items-center">
                <span className="mr-1">🔄</span>Frissítés
              </button>
            </div>
            <div className={`p-3 rounded-md border ${!currentPen || currentPen.includes('Hiba') || currentPen.includes('Nincs') ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
              <span className={`font-medium ${!currentPen || currentPen.includes('Hiba') || currentPen.includes('Nincs') ? 'text-red-800' : 'text-green-800'}`}>
                {currentPen || 'Meghatározás...'}
              </span>
              <div className="text-xs text-gray-500 mt-1">ℹ️ Karám történet alapján</div>
            </div>

            {/* 💡 KARÁM MÓDOSÍTÁS INFORMÁCIÓ */}
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-sm text-blue-800">
                <strong>💡 Karám módosítás:</strong> Karám Történelem tab → TeljesKaramTortenelem komponens
              </div>
              <div className="text-xs text-blue-600 mt-1">
                Fejlettebb karám kezelés és történelem rögzítés
              </div>
            </div>
          </div>

          {/* SZERKESZTHETŐ SZÜLETÉSI DÁTUM */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              📅 Születési dátum
              {isEditing && <span className="text-xs text-blue-600 ml-2">(Ez frissíti a kapcsolt ellés dátumát is)</span>}
            </label>
            {isEditing ? (
              <input
                type="date"
                value={editedAnimal.szuletesi_datum || ''}
                onChange={(e) => updateField('szuletesi_datum', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            ) : (
              <div className="w-full px-3 py-2 border border-transparent rounded-lg bg-gray-50 text-gray-700 min-h-[42px] flex items-center">
                {new Date(animal.szuletesi_datum).toLocaleDateString('hu-HU')}
              </div>
            )}
          </div>

          {/* SZERKESZTHETŐ BEKERÜLÉS DÁTUMA */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">📅 Bekerülés dátuma</label>
            {isEditing ? (
              <input
                type="date"
                value={editedAnimal.bekerules_datum || ''}
                onChange={(e) => updateField('bekerules_datum', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            ) : (
              <div className="w-full px-3 py-2 border border-transparent rounded-lg bg-gray-50 text-gray-700 min-h-[42px] flex items-center">
                {animal.bekerules_datum ? new Date(animal.bekerules_datum).toLocaleDateString('hu-HU') : <span className="text-gray-400">Nincs megadva</span>}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">🌍 Származás</label>
            {isEditing ? (
              <select
                value={editedAnimal.birth_location || 'ismeretlen'}
                onChange={(e) => updateField('birth_location', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white"
              >
                {birthLocationOptions.map(option =>
                  <option key={option.value} value={option.value}>{option.label}</option>
                )}
              </select>
            ) : (
              <div className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium ${animal?.birth_location === 'nálunk' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                {birthLocationOptions.find(o => o.value === animal.birth_location)?.label || 'Ismeretlen'}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">🐄 Fajta</label>
            {isEditing ? (
              <select
                value={editedAnimal.breed || ''}
                onChange={(e) => updateField('breed', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white"
              >
                <option value="">Válasszon...</option>
                {BREEDS.map(breed =>
                  <option key={breed} value={breed}>{breed}</option>
                )}
              </select>
            ) : (
              <div className="w-full px-3 py-2 border border-transparent rounded-lg bg-gray-50 text-gray-700 min-h-[42px] flex items-center">
                {animal.breed || <span className="text-gray-400">Nincs megadva</span>}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 🆕 MEGJEGYZÉSEK KÁRTYA */}
      <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center mb-4">
          <span className="text-2xl mr-3">📝</span>
          <h3 className="text-lg font-semibold text-gray-900">Megjegyzések és Jegyzetek</h3>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            💬 Jegyzetek
            {isEditing && <span className="text-xs text-gray-500 ml-2">(Választások, események, egészségügyi megjegyzések)</span>}
          </label>
          {isEditing ? (
            <textarea
              value={editedAnimal.notes || ''}
              onChange={(e) => updateField('notes', e.target.value)}
              placeholder="Ide írhatsz bármilyen megjegyzést az állattal kapcsolatban..."
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 resize-vertical"
            />
          ) : (
            <div className="w-full px-3 py-2 border border-transparent rounded-lg bg-gray-50 text-gray-700 min-h-[100px] whitespace-pre-line">
              {animal.notes || <span className="text-gray-400">Nincs megjegyzés</span>}
            </div>
          )}
        </div>

        {/* MEGJEGYZÉSEK ELŐNÉZETE */}
        {animal.notes && !isEditing && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-xs text-blue-600 font-medium mb-1">📊 Gyors áttekintés:</div>
            <div className="text-sm text-blue-800">
              {animal.notes.includes('📅 VÁLASZTÁS') && <div>✓ Választási bejegyzések találhatók</div>}
              {animal.notes.includes('🥗 ABRAK') && <div>✓ Takarmányozási megjegyzések</div>}
              {animal.notes.includes('💰 ÉRTÉKESÍTÉS') && <div>✓ Értékesítési adatok</div>}
              {animal.notes.includes('🏥') && <div>✓ Egészségügyi megjegyzések</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DetailsTab;