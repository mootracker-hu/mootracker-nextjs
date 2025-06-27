// VV Form Component - VV eredmény rögzítése tenyészbika adatokkal
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Calendar, User, Stethoscope, AlertTriangle, FileText, X, Plus } from 'lucide-react';

interface TenyeszbikaOption {
  enar: string;
  kplsz: string;
  name: string;
}

interface VVFormData {
  vv_date: string;
  vv_result_days: number;
  pregnancy_status: 'vemhes' | 'ures' | 'csira';
  father_enar?: string;
  father_kplsz?: string;
  father_name?: string;
  uncertain_paternity: boolean;
  possible_fathers: string[];
  blood_test_required: boolean;
  blood_test_date?: string;
  expected_birth_date?: string;
  veterinarian?: string;
  notes?: string;
}

interface VVFormProps {
  animalEnar: string;
  onSubmit: () => void;
  onCancel: () => void;
  editMode?: boolean;        // ← Cseréld `;`-t `,`-ra
  editData?: any;            // ← Ez maradhat `;`
}

const VVForm: React.FC<VVFormProps> = ({
  animalEnar,
  onSubmit,
  onCancel,
  editMode = false,
  editData = null
}) => {
  const [loading, setLoading] = useState(false);
  const [availableBulls, setAvailableBulls] = useState<TenyeszbikaOption[]>([]);
  const [formData, setFormData] = useState<VVFormData>(() => {
    // Edit mode esetén előre kitöltjük a form-ot
    if (editMode && editData) {
      return {
        vv_date: editData.vv_date ? new Date(editData.vv_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        vv_result_days: editData.vv_result_days || 0,
        pregnancy_status: editData.pregnancy_status || 'ures',
        father_enar: editData.father_enar || '',              // ← HIÁNYZIK
        father_kplsz: editData.father_kplsz || '',            // ← HIÁNYZIK  
        father_name: editData.father_name || '',              // ← HIÁNYZIK
        uncertain_paternity: editData.uncertain_paternity || false,
        possible_fathers: editData.possible_fathers ?
          editData.possible_fathers.map((father: any) =>
            typeof father === 'string' ? father : father.enar
          ) : [],
        blood_test_required: editData.blood_test_required || false,
        blood_test_date: editData.blood_test_date || '',      // ← HIÁNYZIK
        expected_birth_date: editData.expected_birth_date || '', // ← HIÁNYZIK
        veterinarian: editData.veterinarian || '',            // ← HIÁNYZIK
        notes: editData.notes || ''
      };
    }

    // Új VV esetén alapértelmezett értékek
    return {
      vv_date: new Date().toISOString().split('T')[0],
      vv_result_days: 0,
      pregnancy_status: 'ures',
      father_enar: '',                  // ← HIÁNYZIK
      father_kplsz: '',                // ← HIÁNYZIK
      father_name: '',                 // ← HIÁNYZIK
      uncertain_paternity: false,
      possible_fathers: [],
      blood_test_required: false,
      blood_test_date: '',             // ← HIÁNYZIK
      expected_birth_date: '',         // ← HIÁNYZIK
      veterinarian: '',                // ← HIÁNYZIK
      notes: ''
    };
  });


  // Tenyészbikák betöltése
  useEffect(() => {
    const fetchBulls = async () => {
      try {
        const { data, error } = await supabase
          .from('animals')
          .select('enar, kplsz, name')
          .eq('kategoria', 'tenyészbika')
          .eq('statusz', 'aktív')
          .order('name');

        if (error) throw error;
        setAvailableBulls(data || []);
      } catch (error) {
        console.error('Tenyészbikák betöltési hiba:', error);
      }
    };

    fetchBulls();
  }, []);

  // Ellési dátum automatikus számítása
  useEffect(() => {
    if (formData.pregnancy_status === 'vemhes' && formData.vv_date && formData.vv_result_days) {
      const vvDate = new Date(formData.vv_date);
      const conceptionDate = new Date(vvDate);
      conceptionDate.setDate(conceptionDate.getDate() - formData.vv_result_days);

      const expectedBirth = new Date(conceptionDate);
      expectedBirth.setDate(expectedBirth.getDate() + 285); // 285 napos vemhesség

      setFormData(prev => ({
        ...prev,
        expected_birth_date: expectedBirth.toISOString().split('T')[0]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        expected_birth_date: undefined
      }));
    }
  }, [formData.vv_date, formData.vv_result_days, formData.pregnancy_status]);

  const handleInputChange = (field: keyof VVFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleBullSelection = (selectedEnar: string) => {
  const selectedBull = availableBulls.find(bull => bull.enar === selectedEnar);
  if (selectedBull) {
    setFormData(prev => {
      // Ha bizonytalan apaság be van kapcsolva, a fő apa is bekerül a possible_fathers listába
      let newPossibleFathers = prev.possible_fathers;
      
      if (prev.uncertain_paternity) {
        // Ha még nincs benne, add hozzá
        if (!newPossibleFathers.includes(selectedEnar)) {
          newPossibleFathers = [...newPossibleFathers, selectedEnar];
        }
      } else {
        // Ha nincs bizonytalan apaság, csak a fő apa legyen
        newPossibleFathers = [selectedEnar];
      }

      return {
        ...prev,
        father_enar: selectedBull.enar,
        father_kplsz: selectedBull.kplsz,
        father_name: selectedBull.name,
        possible_fathers: newPossibleFathers
      };
    });
  }
};

  // Lehetséges apák kezelése
  const addPossibleFather = (fatherEnar: string) => {
    if (fatherEnar && !formData.possible_fathers.includes(fatherEnar)) {
      setFormData(prev => ({
        ...prev,
        possible_fathers: [...prev.possible_fathers, fatherEnar]
      }));
    }
  };

  const removePossibleFather = (fatherEnar: string) => {
    setFormData(prev => ({
      ...prev,
      possible_fathers: prev.possible_fathers.filter(f => f !== fatherEnar)
    }));
  };

  const getBullInfo = (enar: string) => {
    return availableBulls.find(bull => bull.enar === enar);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('🔍 FORMDATA POSSIBLE FATHERS RÉSZLETES:', formData.possible_fathers);
formData.possible_fathers.forEach((enar, index) => {
  console.log(`🔍 ${index}. apa ENAR:`, enar);
  console.log(`🔍 ${index}. apa getBullInfo:`, getBullInfo(enar));
});
      console.log('🔍 FORMDATA POSSIBLE FATHERS:', formData.possible_fathers);
    console.log('🔍 FORMDATA LENGTH:', formData.possible_fathers.length);

      // Adatok előkészítése mentéshez
     const dataToSave = {
  animal_enar: animalEnar,
  vv_date: formData.vv_date,
  vv_result_days: formData.vv_result_days,
  pregnancy_status: formData.pregnancy_status,
  father_enar: formData.father_enar || null,
  father_kplsz: formData.father_kplsz || null,
  father_name: formData.father_name || null,
  uncertain_paternity: formData.uncertain_paternity,
  possible_fathers: formData.possible_fathers.length > 0 
  ? formData.possible_fathers.map(enar => {
      console.log('🔍 MAPPING ENAR:', enar);
      const bullInfo = getBullInfo(enar);
      console.log('🔍 MAPPING RESULT:', bullInfo);
      const result = {
        enar: String(enar),
        name: String(bullInfo?.name || ''),
        kplsz: String(bullInfo?.kplsz || '')
      };
      console.log('🔍 MAPPED OBJECT:', result);
      return result;
    })
  : null,
  blood_test_required: formData.blood_test_required,
  blood_test_date: formData.blood_test_date || null,
  expected_birth_date: formData.expected_birth_date || null,
  veterinarian: formData.veterinarian || null,
  notes: formData.notes || null
};
      console.log('🔍 DATASAVE TELJES:', dataToSave);
      console.log('🔍 POSSIBLE FATHERS KÜLÖN:', dataToSave.possible_fathers);
console.log('🔍 UNCERTAIN PATERNITY:', dataToSave.uncertain_paternity);

      // VV eredmény mentése az adatbázisba
      // VV eredmény mentése/frissítése az adatbázisba
      let error;

      if (editMode && editData?.id) {
        // EDIT MODE - meglévő rekord frissítése
        const { error: updateError } = await supabase
          .from('vv_results')
          .update(dataToSave)
          .eq('id', editData.id);
        error = updateError;
      } else {
        // CREATE MODE - új rekord létrehozása
        const { error: insertError } = await supabase
          .from('vv_results')
          .insert(dataToSave);
        error = insertError;
      }

      if (error) {
        console.error('Supabase hiba:', error);
        alert(`Adatbázis hiba: ${error.message}`);
        throw error;
      }

      // Ha vemhes, akkor frissítjük az állat adatait is
      if (formData.pregnancy_status === 'vemhes') {
        const { error: updateError } = await supabase
          .from('animals')
          .update({
            pregnancy_status: 'vemhes',
            expected_birth_date: formData.expected_birth_date,
            kategoria: 'vemhes_üsző'
          })
          .eq('enar', animalEnar);

        if (updateError) {
          console.warn('Állat adatok frissítési hiba:', updateError);
        }
      }

      alert(editMode ? 'VV eredmény sikeresen frissítve!' : 'VV eredmény sikeresen rögzítve!');
      onSubmit();

    } catch (error) {
      console.error('VV mentési hiba:', error);
      alert('Hiba történt: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">
          🔬 VV Eredmény Rögzítése
        </h2>
        <div className="text-sm text-gray-600">
          Állat: <span className="font-medium">{animalEnar}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* VV Alapadatok */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="inline h-4 w-4 mr-1" />
              VV dátuma *
            </label>
            <input
              type="date"
              required
              value={formData.vv_date}
              onChange={(e) => handleInputChange('vv_date', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              VV eredmény (napok) *
            </label>
            <input
              type="number"
              required
              min="0"
              max="285"
              value={formData.vv_result_days}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '' || value === '0' || parseInt(value) >= 0) {
                  handleInputChange('vv_result_days', value === '' ? 0 : parseInt(value));
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
            />
            <p className="text-xs text-gray-500 mt-1">0-285 nap között (0 = csíra)</p>
          </div>
        </div>

        {/* VV Eredmény */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            VV eredmény *
          </label>
          <div className="grid grid-cols-3 gap-3">
            {['ures', 'vemhes', 'csira'].map((status) => (
              <label
                key={status}
                className={`flex items-center justify-center p-3 border rounded-lg cursor-pointer transition-colors ${formData.pregnancy_status === status
                  ? status === 'vemhes' ? 'bg-green-100 border-green-500 text-green-800'
                    : status === 'ures' ? 'bg-red-100 border-red-500 text-red-800'
                      : 'bg-yellow-100 border-yellow-500 text-yellow-800'
                  : 'bg-gray-50 border-gray-300 hover:bg-gray-100'
                  }`}
              >
                <input
                  type="radio"
                  name="pregnancy_status"
                  value={status}
                  checked={formData.pregnancy_status === status}
                  onChange={(e) => handleInputChange('pregnancy_status', e.target.value)}
                  className="sr-only"
                />
                <span className="font-medium">
                  {status === 'vemhes' ? '🤰 Vemhes' :
                    status === 'ures' ? '❌ Üres' : '🌱 Csíra'}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Tenyészbika kiválasztás - csak vemhes esetén */}
        {formData.pregnancy_status === 'vemhes' && (
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h3 className="text-lg font-medium text-green-800 mb-4">🐂 Tenyészbika adatok</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tenyészbika kiválasztása *
                </label>
                <select
                  required={formData.pregnancy_status === 'vemhes'}
                  value={formData.father_enar || ''}
                  onChange={(e) => handleBullSelection(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">Válassz tenyészbikát...</option>
                  {availableBulls.map((bull) => (
                    <option key={bull.enar} value={bull.enar}>
                      🐂 {bull.name} - {bull.enar} (KPLSZ: {bull.kplsz})
                    </option>
                  ))}
                </select>
              </div>

              {/* Kiválasztott tenyészbika adatok */}
              {formData.father_enar && (
                <div className="bg-white p-3 rounded border">
                  <p className="text-sm">
                    <strong>Apa neve:</strong> {formData.father_name}<br />
                    <strong>Apa ENAR:</strong> {formData.father_enar}<br />
                    <strong>Apa KPLSZ:</strong> {formData.father_kplsz}
                  </p>
                </div>
              )}

              {/* Bizonytalan apaság */}
              <div className="flex items-center space-x-2">
                <input
  type="checkbox"
  id="uncertain_paternity"
  checked={formData.uncertain_paternity}
  onChange={(e) => {
    const isChecked = e.target.checked;
    setFormData(prev => {
      let newPossibleFathers = prev.possible_fathers;
      
      if (isChecked) {
        // Bekapcsolás: ha van fő apa és nincs a listában, add hozzá
        if (prev.father_enar && !newPossibleFathers.includes(prev.father_enar)) {
          newPossibleFathers = [prev.father_enar, ...newPossibleFathers];
        }
      } else {
        // Kikapcsolás: csak a fő apa maradjon
        newPossibleFathers = prev.father_enar ? [prev.father_enar] : [];
      }
      
      return {
        ...prev,
        uncertain_paternity: isChecked,
        possible_fathers: newPossibleFathers
      };
    });
  }}
  className="rounded border-gray-300"
/>
                <label htmlFor="uncertain_paternity" className="text-sm text-gray-700">
                  <AlertTriangle className="inline h-4 w-4 mr-1 text-yellow-500" />
                  Bizonytalan apaság (több lehetséges apa)
                </label>
              </div>

              {/* További lehetséges apák kezelése */}
              {formData.uncertain_paternity && (
                <div className="bg-yellow-50 p-4 rounded border border-yellow-200">
                  <h4 className="font-medium text-yellow-800 mb-3">
                    🐂 Lehetséges apák listája
                  </h4>

                  {/* Lehetséges apák hozzáadása */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      További lehetséges apa hozzáadása
                    </label>
                    <div className="flex gap-2">
                      <select
                        id="new-possible-father"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500"
                      >
                        <option value="">Válassz egy másik bikát...</option>
                        {availableBulls
                          .filter(bull =>
                            bull.enar !== formData.father_enar &&
                            !formData.possible_fathers.includes(bull.enar)
                          )
                          .map((bull) => (
                            <option key={bull.enar} value={bull.enar}>
                              🐂 {bull.name} - {bull.enar}
                            </option>
                          ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          const select = document.getElementById('new-possible-father') as HTMLSelectElement;
                          if (select.value) {
                            addPossibleFather(select.value);
                            select.value = '';
                          }
                        }}
                        className="px-3 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Kilistázott lehetséges apák */}
                  {formData.possible_fathers.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-yellow-800">Lehetséges apák:</p>
                      {formData.possible_fathers.map((fatherEnar, index) => {
                        const enarString = typeof fatherEnar === 'string'
                          ? fatherEnar
                          : (fatherEnar as any)?.enar || '';
                        const bullInfo = getBullInfo(enarString);

                        return (
                          <div
                            key={`father-${index}`}
                            className="flex items-center justify-between bg-white p-2 rounded border"
                          >
                            <div className="text-sm">
                              <strong>{bullInfo?.name || 'Ismeretlen'}</strong> - {fatherEnar}
                              {bullInfo?.kplsz && (
                                <span className="text-gray-600"> (KPLSZ: {bullInfo.kplsz})</span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => removePossibleFather(fatherEnar)}
                              className="text-red-500 hover:text-red-700 transition-colors"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Vérvizsgálat szükséges */}
                  <div className="mt-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <input
                        type="checkbox"
                        id="blood_test_required"
                        checked={formData.blood_test_required}
                        onChange={(e) => handleInputChange('blood_test_required', e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <label htmlFor="blood_test_required" className="text-sm text-yellow-800">
                        🩸 Vérvizsgálat szükséges az apaság megállapításához
                      </label>
                    </div>

                    {formData.blood_test_required && (
                      <input
                        type="date"
                        value={formData.blood_test_date || ''}
                        onChange={(e) => handleInputChange('blood_test_date', e.target.value)}
                        placeholder="Vérvizsgálat dátuma"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500 mt-2"
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Ellési dátum - automatikus számítás */}
        {formData.pregnancy_status === 'vemhes' && formData.expected_birth_date && (
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="text-lg font-medium text-blue-800 mb-2">📅 Ellési előrejelzés</h3>
            <p className="text-blue-700">
              <strong>Várható ellés dátuma:</strong> {new Date(formData.expected_birth_date).toLocaleDateString('hu-HU')}
            </p>
            <p className="text-sm text-blue-600 mt-1">
              (285 napos vemhességi idővel számolva)
            </p>
          </div>
        )}

        {/* Állatorvos */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <User className="inline h-4 w-4 mr-1" />
            Vizsgáló állatorvos
          </label>
          <input
            type="text"
            value={formData.veterinarian || ''}
            onChange={(e) => handleInputChange('veterinarian', e.target.value)}
            placeholder="Dr. Példa Péter"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
          />
        </div>

        {/* Megjegyzések */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FileText className="inline h-4 w-4 mr-1" />
            Megjegyzések
          </label>
          <textarea
            value={formData.notes || ''}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            rows={3}
            placeholder="További megfigyelések, megjegyzések..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
          />
        </div>

        {/* Gombok */}
        <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            Mégse
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400 rounded-md transition-colors"
          >
            <Stethoscope className="h-4 w-4 mr-2" />
            {loading ? 'Mentés...' : 'VV Eredmény Mentése'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default VVForm;