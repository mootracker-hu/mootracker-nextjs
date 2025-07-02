// src/app/dashboard/calves/components/ear-tag-modal.tsx
"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { CalfFormData } from '@/types/calf-types';


interface EarTagModalProps {
  isOpen: boolean;
  onClose: () => void;
  calf: {
    id: string;
    temp_id: string;
    gender: string;
    planned_enar?: string;
    birth?: {
      id: string;
      mother_enar: string;
      birth_date: string;
      historical: boolean;
    };
  };
  onSuccess: () => void;
}

export default function EarTagModal({ isOpen, onClose, calf, onSuccess }: EarTagModalProps) {
  const [formData, setFormData] = useState<CalfFormData>({
    enar: calf.planned_enar || '',
    ear_tag_date: new Date().toISOString().split('T')[0]
  });
  const [mode, setMode] = useState<'plan' | 'activate'>('plan');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  // Módválasztás az ellés típusa alapján
  useEffect(() => {
    if (calf.birth?.historical) {
      setMode('plan'); // Történeti ellés → csak tervezés/manual
    } else {
      setMode(calf.planned_enar ? 'activate' : 'plan');
    }
  }, [calf]);

  const handlePlanEnar = async () => {
    try {
      setIsSubmitting(true);
      setError(null);

      if (!formData.enar.trim()) {
        throw new Error('ENAR megadása kötelező');
      }

      // ENAR formátum ellenőrzés
      const enarRegex = /^HU\s\d{5}\s\d{4}\s\d$/;
      if (!enarRegex.test(formData.enar)) {
        throw new Error('ENAR formátum: HU 12345 6789 0');
      }

      console.log('📝 Planning ENAR:', formData.enar, 'for calf:', calf.temp_id);

      // Planned ENAR mentése
      const { error: updateError } = await supabase
        .from('calves')
        .update({
          planned_enar: formData.enar
        })
        .eq('id', calf.id);

      if (updateError) {
        throw new Error('ENAR tervezés sikertelen: ' + updateError.message);
      }

      console.log('✅ ENAR planned successfully');
      onSuccess();
      onClose();

    } catch (err) {
      console.error('❌ Error planning ENAR:', err);
      setError(err instanceof Error ? err.message : 'Hiba történt');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleActivateEnar = async () => {
    try {
      setIsSubmitting(true);
      setError(null);

      console.log('🏷️ Activating ENAR:', formData.enar, 'for calf:', calf.temp_id);

      // Ellenőrizzük hogy az ENAR még nem létezik az animals táblában
      const { data: existingAnimal, error: checkError } = await supabase
        .from('animals')
        .select('enar')
        .eq('enar', formData.enar)
        .single();

      if (existingAnimal) {
        throw new Error('Ez az ENAR már használatban van az állatok között');
      }

      // Frissítjük a borjú adatait (aktiválás)
      const { error: updateCalfError } = await supabase
        .from('calves')
        .update({
          enar: formData.enar,
          ear_tag_date: formData.ear_tag_date
        })
        .eq('id', calf.id);

      if (updateCalfError) {
        throw new Error('Fülszám aktiválás sikertelen: ' + updateCalfError.message);
      }

      // Ha nem történeti ellés → automatikus állat létrehozás
      if (!calf.birth?.historical) {
        console.log('🤖 Creating automatic animal record...');

        // Kategória meghatározás
        const kategoria = calf.gender === 'male' ? 'hímivarú_borjú' : 'nőivarú_borjú';

        // Automatikus állat létrehozás
        const { error: animalError } = await supabase
          .from('animals')
          .insert({
            enar: formData.enar,
            szuletesi_datum: calf.birth?.birth_date,
            ivar: calf.gender === 'male' ? 'hím' : 'nő',
            kategoria: kategoria,
            statusz: 'aktív',
            mother_enar: calf.birth?.mother_enar,
            birth_location: 'nálunk',
            acquisition_date: formData.ear_tag_date,
            birth_id: calf.birth?.id,
            temp_id: calf.temp_id // Kapcsolat megőrzése
          });

        if (animalError) {
          console.error('❌ Animal creation error:', animalError);
          throw new Error('Automatikus állat létrehozás sikertelen: ' + animalError.message);
        }

        console.log('✅ Automatic animal created');
      }

      console.log('✅ ENAR activated successfully');
      onSuccess();
      onClose();

    } catch (err) {
      console.error('❌ Error activating ENAR:', err);
      setError(err instanceof Error ? err.message : 'Hiba történt');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {mode === 'plan' ? '📝 ENAR Tervezése' : '🏷️ Fülszám Aktiválása'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600">
            <strong>Temp ID:</strong> {calf.temp_id}
          </div>
          <div className="text-sm text-gray-600">
            <strong>Anya:</strong> {calf.birth?.mother_enar}
          </div>
          <div className="text-sm text-gray-600">
            <strong>Ivar:</strong> {calf.gender === 'male' ? '🐂 Bika' : '🐄 Üsző'}
          </div>
          <div className="text-sm text-gray-600">
            <strong>Született:</strong> {calf.birth?.birth_date ? new Date(calf.birth.birth_date).toLocaleDateString('hu-HU') : '-'}
          </div>
          <div className="text-sm text-gray-600">
            <strong>Típus:</strong> {calf.birth?.historical ? '📚 Történeti' : '🆕 Új ellés'}
          </div>
          {calf.planned_enar && (
            <div className="text-sm text-green-600 font-medium">
              <strong>Tervezett ENAR:</strong> {calf.planned_enar}
            </div>
          )}
        </div>

        {/* Mode Selection */}
        {!calf.birth?.historical && (
          <div className="mb-4">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                type="button"
                onClick={() => setMode('plan')}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  mode === 'plan' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                📝 Tervezés
              </button>
              <button
                type="button"
                onClick={() => setMode('activate')}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  mode === 'activate' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                🏷️ Aktiválás
              </button>
            </div>
          </div>
        )}

        {/* Mode Explanation */}
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700">
            {mode === 'plan' ? (
              <>
                <strong>📝 Tervezés:</strong> ENAR előrögzítése. Később aktiváláskor automatikusan létrejön az állat rekord.
              </>
            ) : (
              <>
                <strong>🏷️ Aktiválás:</strong> Fülszám behelyezése és automatikus állat létrehozás.
              </>
            )}
          </p>
        </div>

        <form onSubmit={(e) => {
          e.preventDefault();
          mode === 'plan' ? handlePlanEnar() : handleActivateEnar();
        }}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ENAR *
            </label>
            <input
              type="text"
              value={formData.enar}
              onChange={(e) => setFormData({ ...formData, enar: e.target.value })}
              placeholder="HU 12345 6789 0"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Formátum: HU 12345 6789 0
            </p>
          </div>

          {mode === 'activate' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fülszám felhelyezés dátuma *
              </label>
              <input
                type="date"
                value={formData.ear_tag_date}
                onChange={(e) => setFormData({ ...formData, ear_tag_date: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                required
              />
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              disabled={isSubmitting}
            >
              Mégse
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Mentés...' : (mode === 'plan' ? '📝 Tervezés' : '🏷️ Aktiválás')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}