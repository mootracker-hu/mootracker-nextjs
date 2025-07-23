'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Animal } from '@/types/animal-types';
// A meglévő importok után add hozzá:
import { displayEnar, formatEnarInput, cleanEnarForDb } from '@/constants/enar-formatter';

// A FamilyTab megkapja a szükséges adatokat és függvényeket a fő oldaltól (page.tsx).
interface FamilyTabProps {
  animal: Animal;
  isEditing: boolean;
  updateField: (field: keyof Animal, value: any) => void;
  onUpdate: () => void; // Ez a függvény szól a szülőnek, hogy frissítse az adatokat.
}

const FamilyTab: React.FC<FamilyTabProps> = ({ animal, isEditing, updateField, onUpdate }) => {
  // A modális ablak és az űrlap állapotát ez a komponens kezeli, elzárva a fő oldaltól.
  const [showManualFatherModal, setShowManualFatherModal] = useState(false);
  const [manualFatherForm, setManualFatherForm] = useState({
    father_enar: '',
    father_name: '',
    father_kplsz: '',
  });

  // Amikor a szerkesztés gombra kattintunk, betöltjük a meglévő apa adatokat az űrlapba.
  const openFatherModalForEditing = () => {
    setManualFatherForm({
      father_enar: animal.father_enar || animal.apa_enar || '',
      father_name: animal.father_name || '',
      father_kplsz: animal.father_kplsz || animal.apa_kplsz || '',
    });
    setShowManualFatherModal(true);
  };

  const handleManualFatherSave = async () => {
    if (!manualFatherForm.father_enar) {
      alert('Az apa ENAR megadása kötelező!');
      return;
    }
    try {
      const updateData = {
        father_enar: manualFatherForm.father_enar || null,
        father_name: manualFatherForm.father_name || null,
        father_kplsz: manualFatherForm.father_kplsz || null,
        father_source: 'manual' as const // Jelöljük, hogy ez manuális bejegyzés volt
      };

      const { error } = await supabase
        .from('animals')
        .update(updateData)
        .eq('id', animal.id);

      if (error) throw error;

      alert('✅ Apa adatok sikeresen mentve!');
      setShowManualFatherModal(false);
      onUpdate(); // Szólunk a főoldalnak (page.tsx), hogy töltse újra az állat adatait
    } catch (error: any) {
      console.error('Hiba az apa adatok mentésekor:', error);
      alert(`❌ Hiba történt: ${error.message}`);
    }
  };

  // Ez a belső komponens felel a különböző apasági állapotok megjelenítéséért, hogy a fő JSX tiszta maradjon.
  const FatherDataDisplay = () => {
    if (animal.father_enar) {
       return (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-r-lg">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-green-800 font-semibold mb-1">✅ Apa Azonosítva</h3>
              <p className="text-green-700">🐂 <strong>{animal.father_name || 'Névtelen'}</strong> ({displayEnar(animal.father_enar)})</p>
              {animal.father_kplsz && <p className="text-green-700">KPLSZ: {animal.father_kplsz}</p>}
              <p className="text-sm text-green-600 mt-1">Forrás: {animal.father_source || 'Manuális'}</p>
            </div>
            <button onClick={openFatherModalForEditing} className="bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1 rounded">✏️ Szerkesztés</button>
          </div>
        </div>
      );
    }
    
    if(animal.apa_enar) {
         return (
             <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
                <p className="text-blue-700">Legacy Apa ENAR: <strong>{displayEnar(animal.apa_enar)}</strong></p>
                <button onClick={openFatherModalForEditing} className="mt-2 bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1 rounded">⬆️ Adatok frissítése</button>
             </div>
         );
    }

    return (
       <div className="bg-gray-50 border-l-4 border-gray-400 p-4 rounded-r-lg">
         <div className="flex items-center justify-between">
            <div>
                <h3 className="text-gray-700 font-semibold">❓ Apa Adat Hiányzik</h3>
                <p className="text-sm text-gray-500 mt-1">Rögzítsd VV vagy ellési adatoknál, vagy add meg manuálisan.</p>
            </div>
            <button onClick={() => setShowManualFatherModal(true)} className="bg-gray-600 hover:bg-gray-700 text-white text-xs px-2 py-1 rounded">➕ Hozzáadás</button>
         </div>
       </div>
    );
  };


  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center mb-6">
          <span className="text-2xl mr-3">🐄💕🐂</span>
          <h3 className="text-lg font-semibold text-gray-900">Szülők és családfa</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Anya ENAR</label>
            {isEditing ? (
              <input 
                type="text" 
                value={formatEnarInput(animal.anya_enar || '')} 
                onChange={(e) => {
                  const formatted = formatEnarInput(e.target.value);
                  updateField('anya_enar', cleanEnarForDb(formatted));
                }}
                placeholder="HU 36050 0080 8" 
                maxLength={16}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" 
              />
            ) : (
              <div className="w-full px-3 py-2 border border-transparent rounded-lg bg-gray-50 text-gray-700 min-h-[42px] flex items-center">
                {displayEnar(animal.anya_enar) || <span className="text-gray-400">Nincs megadva</span>}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Apa Adatok</label>
            <FatherDataDisplay />
          </div>
          {(animal.kplsz || isEditing) && (
             <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">KPLSZ szám (saját)</label>
              {isEditing ? (
                <input type="text" value={animal.kplsz || ''} onChange={(e) => updateField('kplsz', e.target.value)} placeholder="KPLSZ azonosító" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" />
              ) : (
                <div className="w-full px-3 py-2 border border-transparent rounded-lg bg-gray-50 text-gray-700 min-h-[42px] flex items-center">{animal.kplsz || <span className="text-gray-400">Nincs megadva</span>}</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* --- APA ADATOK MODÁLIS ABLAK --- */}
      {showManualFatherModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">🐂 Apa Adatok Manuális Rögzítése</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Apa ENAR *</label>
                <input 
                  type="text" 
                  value={manualFatherForm.father_enar} 
                  onChange={(e) => setManualFatherForm({ 
                    ...manualFatherForm, 
                    father_enar: formatEnarInput(e.target.value) 
                  })} 
                  placeholder="HU 36050 0080 8"
                  maxLength={16}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Apa Neve</label>
                <input type="text" value={manualFatherForm.father_name} onChange={(e) => setManualFatherForm({ ...manualFatherForm, father_name: e.target.value })} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Apa KPLSZ</label>
                <input type="text" value={manualFatherForm.father_kplsz} onChange={(e) => setManualFatherForm({ ...manualFatherForm, father_kplsz: e.target.value })} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"/>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowManualFatherModal(false)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">Mégse</button>
              <button onClick={handleManualFatherSave} className="px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700">Mentés</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FamilyTab;