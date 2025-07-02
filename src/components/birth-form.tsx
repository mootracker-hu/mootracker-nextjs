'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { CalendarDays, Clock, Baby, UserCheck, AlertTriangle, Save, X, Plus } from 'lucide-react';
import { 
  BirthFormData, 
  CalfData, 
  FatherOption,
  BIRTH_TYPE_OPTIONS,
  BIRTH_OUTCOME_OPTIONS,
  FATHER_TYPE_OPTIONS,
  CALF_GENDER_OPTIONS,
  BirthFormProps
} from '@/types/birth-types';

// Generate temp ID helper function
function generateTempId(anyaEnar: string, calfNumber: number): string {
  const cleaned = anyaEnar.replace(/[^0-9]/g, '');
  const lastFive = cleaned.slice(-5);
  return `${lastFive}/${calfNumber}`;
}

export default function BirthForm({ 
  motherEnar, 
  onSuccess, 
  onCancel, 
  prefillFromVV 
}: BirthFormProps) {
  // Form state
  const [formData, setFormData] = useState<BirthFormData>({
    birth_date: prefillFromVV?.expectedBirthDate || new Date().toISOString().split('T')[0],
    birth_time: '',
    historical: false,
    
    father_type: prefillFromVV?.fatherData?.type || 'natural',
    uncertain_paternity: !!prefillFromVV?.fatherData?.possibleFathers,
    father_enar: prefillFromVV?.fatherData?.enar || '',
    father_kplsz: prefillFromVV?.fatherData?.kplsz || '',
    father_name: prefillFromVV?.fatherData?.name || '',
    possible_fathers: prefillFromVV?.fatherData?.possibleFathers || [],
    
    birth_type: 'easy_no_help',
    birth_outcome: 'successful',
    mother_survived: true,
    complications: '',
    attendant_person: '',
    notes: '',
    mother_notes: '',  // ← ADD HOZZÁ EZT!
    
    calf_count: 1,
    calves: [
      {
        calf_number: 1,
        gender: 'male',
        is_alive: true,
        birth_weight: undefined,
        temp_id: generateTempId(motherEnar, 1)
      }
    ]
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update temp IDs when calf count changes
  useEffect(() => {
    const newCalves: CalfData[] = [];
    for (let i = 1; i <= formData.calf_count; i++) {
      const existingCalf = formData.calves.find(c => c.calf_number === i);
      newCalves.push({
        calf_number: i,
        gender: existingCalf?.gender || 'male',
        is_alive: existingCalf?.is_alive ?? true,
        birth_weight: existingCalf?.birth_weight,
        temp_id: generateTempId(motherEnar, i)
      });
    }
    setFormData(prev => ({ ...prev, calves: newCalves }));
  }, [formData.calf_count, motherEnar]);

  // Handle input changes
  const handleInputChange = (field: keyof BirthFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleCalfChange = (calfIndex: number, field: keyof CalfData, value: any) => {
    setFormData(prev => ({
      ...prev,
      calves: prev.calves.map((calf, index) => 
        index === calfIndex ? { ...calf, [field]: value } : calf
      )
    }));
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    
    try {
      // Get current user and farm
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Nincs bejelentkezett felhasználó');
      }

      const { data: userRole, error: roleError } = await supabase
        .from('user_roles')
        .select('farm_id')
        .eq('user_id', user.id)
        .single();

      if (roleError || !userRole) {
        throw new Error('Felhasználó farm adatai nem találhatók');
      }

      // Insert birth record
      const { data: birth, error: birthError } = await supabase
        .from('births')
        .insert({
          mother_enar: motherEnar,
          father_enar: formData.father_enar,
          father_kplsz: formData.father_kplsz,
          father_name: formData.father_name,
          father_type: formData.father_type,
          uncertain_paternity: formData.uncertain_paternity,
          possible_fathers: formData.possible_fathers,
          birth_date: formData.birth_date,
          birth_time: formData.birth_time || null,
          birth_type: formData.birth_type,
          birth_outcome: formData.birth_outcome,
          mother_survived: formData.mother_survived,
          complications: formData.complications,
          attendant_person: formData.attendant_person,
          notes: formData.notes,
          mother_notes: formData.mother_notes,  // ← ADD HOZZÁ EZT!
          historical: formData.historical,
          user_id: user.id,
          farm_id: userRole.farm_id
        })
        .select()
        .single();

      if (birthError) {
        throw new Error('Ellés mentése sikertelen: ' + birthError.message);
      }

      // Insert calves
      const calvesToInsert = formData.calves.map(calf => ({
        birth_id: birth.id,
        calf_number: calf.calf_number,
        temp_id: generateTempId(motherEnar, calf.calf_number),
        gender: calf.gender,
        is_alive: calf.is_alive,
        birth_weight: calf.birth_weight,
        
        // Copy father data from birth
        father_enar: formData.father_enar,
        father_kplsz: formData.father_kplsz,
        father_name: formData.father_name,
        father_type: formData.father_type,
        uncertain_paternity: formData.uncertain_paternity,
        possible_fathers: formData.possible_fathers
      }));

      const { data: calves, error: calvesError } = await supabase
        .from('calves')
        .insert(calvesToInsert)
        .select();

      if (calvesError) {
        await supabase.from('births').delete().eq('id', birth.id);
        throw new Error('Borjú adatok mentése sikertelen: ' + calvesError.message);
      }

      // Update mother animal record (only if not historical)
      if (!formData.historical) {
        const updates: any = {
          last_birth_date: formData.birth_date
        };

        if (formData.birth_outcome === 'successful' && formData.mother_survived) {
          updates.pregnancy_status = null;
          updates.expected_birth_date = null;
        }

        if (!formData.mother_survived) {
          updates.statusz = 'elhullott';
          updates.kikerulesi_datum = formData.birth_date;
          updates.exit_reason = 'elhullás';
          updates.elhullas_datum = formData.birth_date;
        }

        await supabase
          .from('animals')
          .update(updates)
          .eq('enar', motherEnar);
      }
      
      // Success callback
      if (onSuccess) {
        onSuccess(birth);
      }
      
    } catch (error) {
      console.error('Error submitting birth:', error);
      setErrors({ submit: error instanceof Error ? error.message : 'Hiba történt az ellés mentése során' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-lg shadow-lg">
      <div className="bg-gradient-to-r from-blue-50 to-green-50 p-6 rounded-t-lg">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-blue-900">
          <Baby className="h-6 w-6" />
          🐄 Ellés rögzítése - {motherEnar}
        </h1>
        {prefillFromVV?.expectedBirthDate && (
          <p className="text-sm text-blue-600 bg-blue-100 p-2 rounded mt-2">
            📅 VV alapján várható ellési dátum: {prefillFromVV.expectedBirthDate}
          </p>
        )}
      </div>

      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Alapadatok */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="col-span-full text-lg font-semibold text-gray-800 flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              📅 Alapadatok
            </h3>
            
            <div>
              <label htmlFor="birth_date" className="block text-sm font-medium text-gray-700 mb-1">
                Ellés dátuma *
              </label>
              <input
                id="birth_date"
                type="date"
                value={formData.birth_date}
                onChange={(e) => handleInputChange('birth_date', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md ${errors.birth_date ? 'border-red-500' : 'border-gray-300'}`}
                required
              />
              {errors.birth_date && (
                <p className="text-sm text-red-500 mt-1">{errors.birth_date}</p>
              )}
            </div>

            <div>
              <label htmlFor="birth_time" className="block text-sm font-medium text-gray-700 mb-1">
                Ellés időpontja
              </label>
              <input
                id="birth_time"
                type="time"
                value={formData.birth_time}
                onChange={(e) => handleInputChange('birth_time', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div className="flex items-center space-x-2 pt-6">
              <input
                id="historical"
                type="checkbox"
                checked={formData.historical}
                onChange={(e) => handleInputChange('historical', e.target.checked)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
              />
              <label htmlFor="historical" className="text-sm font-medium text-gray-700">
                📚 Történeti ellés (múltbeli adat rögzítése - nem generál riasztásokat)
              </label>
            </div>
          </div>

          {/* Ellési adatok */}
          <div className="p-4 bg-green-50 rounded-lg">
            <h3 className="text-lg font-semibold text-green-800 flex items-center gap-2 mb-4">
              🏥 Ellési adatok
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ellés típusa *</label>
                <select
                  value={formData.birth_type}
                  onChange={(e) => handleInputChange('birth_type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                >
                  {BIRTH_TYPE_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ellés eredménye *</label>
                <select
                  value={formData.birth_outcome}
                  onChange={(e) => handleInputChange('birth_outcome', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                >
                  {BIRTH_OUTCOME_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-2 mb-4">
              <input
                id="mother_survived"
                type="checkbox"
                checked={formData.mother_survived}
                onChange={(e) => handleInputChange('mother_survived', e.target.checked)}
                className="h-4 w-4 text-green-600 border-gray-300 rounded"
              />
              <label htmlFor="mother_survived" className="text-sm font-medium text-gray-700">
                ✅ Anya túlélte az ellést
              </label>
            </div>

                  <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                👨‍⚕️ Jelenlévő személy
              </label>
              <input
                type="text"
                value={formData.attendant_person}
                onChange={(e) => handleInputChange('attendant_person', e.target.value)}
                placeholder="Ki volt jelen az ellésnél"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            {!formData.mother_survived && (
              <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded">
                <div className="flex items-center gap-2 text-red-800">
                  <AlertTriangle className="h-5 w-5" />
                  <span className="font-semibold">Figyelem!</span>
                </div>
                <p className="text-sm text-red-700 mt-1">
                  Az anya elhullását automatikusan rögzítjük az ellés dátumával.
                </p>
              </div>
            )}
          </div>

            {/* Megjegyzések */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-800 flex items-center gap-2 mb-4">
              📝 Megjegyzések
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  🐄 Megjegyzés az anyáról
                </label>
                <textarea
                  value={formData.mother_notes || ''}
                  onChange={(e) => handleInputChange('mother_notes', e.target.value)}
                  placeholder="Pl. első ellés, jó anyai tulajdonságok, nehéz ellés múltja..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  📋 Általános megjegyzés az ellésről
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Pl. gyors ellés, komplikációk, különleges körülmények..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md resize-none"
                />
              </div>
            </div>
          </div>

          {/* Borjú adatok */}
          <div className="p-4 bg-yellow-50 rounded-lg">
            <h3 className="text-lg font-semibold text-yellow-800 flex items-center gap-2 mb-4">
              🐄 Borjú adatok
            </h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Borjak száma</label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="calf_count"
                    value="1"
                    checked={formData.calf_count === 1}
                    onChange={(e) => handleInputChange('calf_count', parseInt(e.target.value))}
                    className="mr-2"
                  />
                  1 borjú
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="calf_count"
                    value="2"
                    checked={formData.calf_count === 2}
                    onChange={(e) => handleInputChange('calf_count', parseInt(e.target.value))}
                    className="mr-2"
                  />
                  2 borjú (iker)
                </label>
              </div>
            </div>

            <div className="space-y-4">
              {formData.calves.map((calf, index) => (
                <div key={index} className="p-4 bg-white rounded border">
                  <h4 className="font-semibold text-gray-800 mb-3">
                    {index + 1}. borjú (ID: {calf.temp_id})
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ivar *</label>
                      <select
                        value={calf.gender}
                        onChange={(e) => handleCalfChange(index, 'gender', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        required
                      >
                        {CALF_GENDER_OPTIONS.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Születési súly (kg)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={calf.birth_weight || ''}
                        onChange={(e) => handleCalfChange(index, 'birth_weight', parseFloat(e.target.value) || undefined)}
                        placeholder="25.5"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>

                    <div className="flex items-center space-x-2 pt-6">
                      <input
                        id={`calf_${index}_alive`}
                        type="checkbox"
                        checked={calf.is_alive}
                        onChange={(e) => handleCalfChange(index, 'is_alive', e.target.checked)}
                        disabled={formData.birth_outcome === 'stillborn' || formData.birth_outcome === 'miscarriage'}
                        className="h-4 w-4 text-green-600 border-gray-300 rounded"
                      />
                      <label htmlFor={`calf_${index}_alive`} className="text-sm font-medium text-gray-700">
                        💚 Él
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Error display */}
          {errors.submit && (
            <div className="p-3 bg-red-100 border border-red-300 rounded">
              <p className="text-red-700">{errors.submit}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t">
            {onCancel && (
              <button 
                type="button" 
                onClick={onCancel}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <X className="h-4 w-4 inline mr-2" />
                Mégsem
              </button>
            )}
            
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              <Save className="h-4 w-4 inline mr-2" />
              {isSubmitting ? 'Mentés...' : '💾 Ellés mentése'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}