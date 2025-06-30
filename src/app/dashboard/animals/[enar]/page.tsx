// src/app/dashboard/animals/[enar]/page.tsx
'use client';

interface Father {
  enar: string;
  name: string;
  kplsz: string;
}
import { useState, useEffect } from 'react';
import React from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import VVForm from '@/components/vv-form';
import CurrentStatusTab from './components/current-status-tab';

interface Animal {
  id: number;
  enar: string;
  szuletesi_datum: string;
  ivar: string;
  kategoria: string;
  jelenlegi_karam?: string;
  statusz: string;
  anya_enar?: string;
  apa_enar?: string;
  kplsz?: string;
  bekerules_datum: string;
  created_at: string;
  birth_location?: 'nálunk' | 'vásárolt' | 'ismeretlen';
  name?: string;
  breed?: string;
}

const BREEDS = [
  'Blonde d\'aquitaine',
  'Limousin',
  'Magyartarka',
  'Egyéb húshasznú',
  'Egyéb tejhasznú'
];

// SzaporitasTab komponens definíció
function SzaporitasTab({ animal }: { animal: any }) {
  const [showVVForm, setShowVVForm] = React.useState(false);
  const [vvResults, setVvResults] = React.useState<any[]>([]);
  const [loadingVV, setLoadingVV] = React.useState(true);
  const [selectedVV, setSelectedVV] = React.useState<any>(null);
  const [editingVV, setEditingVV] = React.useState<any>(null);
  const [deletingVV, setDeletingVV] = React.useState<any>(null);

  // VV eredmények betöltése
  React.useEffect(() => {
    const fetchVVResults = async () => {
      try {
        setLoadingVV(true);
        const { data, error } = await supabase
          .from('vv_results')
          .select('*')
          .eq('animal_enar', animal?.enar)
          .order('vv_date', { ascending: false });

        if (error) {
          console.error('❌ VV eredmények betöltési hiba:', error);
        } else {
          console.log('✅ VV eredmények betöltve:', data);
          setVvResults(data || []);
        }
      } catch (err) {
        console.error('❌ VV fetch hiba:', err);
      } finally {
        setLoadingVV(false);
      }
    };

    if (animal?.enar) {
      fetchVVResults();
    }
  }, [animal?.enar]);

  const refreshVVResults = async () => {
    const { data } = await supabase
      .from('vv_results')
      .select('*')
      .eq('animal_enar', animal?.enar)
      .order('vv_date', { ascending: false });

    setVvResults(data || []);
  };

  const handleEditVV = (vvResult: any) => {
    console.log('Edit VV:', vvResult);
    setEditingVV(vvResult);
    setShowVVForm(true);
  };

  const handleDeleteVV = (vvResult: any) => {
    console.log('Delete VV:', vvResult);
    setDeletingVV(vvResult);
  };

  const confirmDeleteVV = async () => {
    if (!deletingVV) return;

    try {
      const { error } = await supabase
        .from('vv_results')
        .delete()
        .eq('id', deletingVV.id);

      if (error) throw error;

      window.location.reload();
      setDeletingVV(null);

      alert('VV eredmény sikeresen törölve!');
    } catch (error) {
      console.error('Törlési hiba:', error);
      alert('Hiba történt a törlés során!');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <span className="text-2xl mr-3">🔬</span>
          <h3 className="text-lg font-semibold text-gray-900">Szaporítási adatok</h3>
        </div>
        <button
          onClick={() => setShowVVForm(true)}
          className="bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-3 rounded-lg transition-colors inline-flex items-center"
        >
          <span className="mr-2">➕</span>
          Új VV eredmény
        </button>
      </div>

      {showVVForm && (
        <VVForm
          animalEnar={String(animal?.enar || 'ISMERETLEN')}
          onSubmit={() => {
            setShowVVForm(false);
            setEditingVV(null);
            refreshVVResults();
          }}
          onCancel={() => {
            setShowVVForm(false);
            setEditingVV(null);
          }}
          editMode={editingVV ? true : false}
          editData={editingVV}
        />
      )}

      {/* VV Történet Táblázat */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center mb-4">
          <span className="text-2xl mr-3">📊</span>
          <h4 className="text-lg font-semibold text-gray-900">VV Történet</h4>
        </div>

        {loadingVV ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">VV eredmények betöltése...</p>
          </div>
        ) : vvResults.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">🔬</div>
            <p>Még nincs rögzített VV eredmény</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    📅 VV Dátuma
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ✅ Eredmény
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ⏱️ Napok
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    🐂 Tenyészbika
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    🐄 Ellés
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    👨‍⚕️ Állatorvos
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ⚙️ Műveletek
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {vvResults.map((result, index) => (
                  <tr key={result.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(result.vv_date).toLocaleDateString('hu-HU')}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${result.pregnancy_status === 'vemhes' ? 'bg-green-100 text-green-800' :
                        result.pregnancy_status === 'ures' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                        {result.pregnancy_status === 'vemhes' ? '🤰 Vemhes' :
                          result.pregnancy_status === 'ures' ? '❌ Üres' : '🌱 Csíra'}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {result.vv_result_days} nap
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {result.father_name ? (
                        result.uncertain_paternity && result.possible_fathers && result.possible_fathers.length > 1
                          ? `${result.father_name} + ${result.possible_fathers.length - 1} további`
                          : result.father_name
                      ) : result.father_enar || '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {result.expected_birth_date ?
                        new Date(result.expected_birth_date).toLocaleDateString('hu-HU') : '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {result.veterinarian || '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedVV(result)}
                          className="text-blue-600 hover:text-blue-800 font-medium text-xs px-2 py-1 rounded transition-colors"
                          title="Részletek megtekintése"
                        >
                          👁️ Részletek
                        </button>
                        <button
                          onClick={() => handleEditVV(result)}
                          className="text-green-600 hover:text-green-800 font-medium text-xs px-2 py-1 rounded transition-colors"
                          title="VV eredmény szerkesztése"
                        >
                          ✏️ Szerkesztés
                        </button>
                        <button
                          onClick={() => handleDeleteVV(result)}
                          className="text-red-600 hover:text-red-800 font-medium text-xs px-2 py-1 rounded transition-colors"
                          title="VV eredmény törlése"
                        >
                          🗑️ Törlés
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* VV Részletek Modal - DESIGN SYSTEM */}
      {selectedVV && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-sm border max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">🔬</span>
                  <h3 className="text-xl font-bold text-gray-900">VV Eredmény Részletei</h3>
                </div>
                <button
                  onClick={() => setSelectedVV(null)}
                  className="text-gray-400 hover:text-gray-600 p-2 transition-colors"
                >
                  ❌
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <span className="mr-2">📅</span>
                    Alapadatok
                  </h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>VV dátuma:</strong> {new Date(selectedVV.vv_date).toLocaleDateString('hu-HU')}</p>
                    <p><strong>VV eredmény:</strong> {selectedVV.vv_result_days} nap</p>
                    <p><strong>Státusz:</strong>
                      <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${selectedVV.pregnancy_status === 'vemhes' ? 'bg-green-100 text-green-800' :
                        selectedVV.pregnancy_status === 'ures' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                        {selectedVV.pregnancy_status === 'vemhes' ? '🤰 Vemhes' :
                          selectedVV.pregnancy_status === 'ures' ? '❌ Üres' : '🌱 Csíra'}
                      </span>
                    </p>
                  </div>
                </div>

                {selectedVV.pregnancy_status === 'vemhes' && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <span className="mr-2">🐂</span>
                      Lehetséges apá{selectedVV.possible_fathers && selectedVV.possible_fathers.length > 1 ? 'k' : ''}
                    </h4>
                    <div className="space-y-3 text-sm">
                      {selectedVV.possible_fathers && selectedVV.possible_fathers.length > 0 ? (
                        selectedVV.possible_fathers.map((father: Father, index: number) => (
                          <div key={index} className={`p-3 border rounded-lg ${index === 0 ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-medium text-gray-900">
                                🐂 {father.name || `${index + 1}. lehetséges apa`}
                              </span>
                            </div>
                            <p><strong>Név:</strong> {father.name || '-'}</p>
                            <p><strong>ENAR:</strong> {father.enar || '-'}</p>
                            <p><strong>KPLSZ:</strong> {father.kplsz || '-'}</p>
                          </div>
                        ))
                      ) : (
                        <div className="p-3 border rounded-lg bg-gray-50">
                          <p><strong>Név:</strong> {selectedVV.father_name || '-'}</p>
                          <p><strong>ENAR:</strong> {selectedVV.father_enar || '-'}</p>
                          <p><strong>KPLSZ:</strong> {selectedVV.father_kplsz || '-'}</p>
                        </div>
                      )}
                      <p><strong>Bizonytalan apaság:</strong> {selectedVV.uncertain_paternity ? '⚠️ Igen' : '✅ Nem'}</p>
                      {selectedVV.blood_test_required && (
                        <p><strong>Vérvizsgálat:</strong>
                          {selectedVV.blood_test_date ?
                            new Date(selectedVV.blood_test_date).toLocaleDateString('hu-HU') :
                            '🩸 Szükséges'
                          }
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {selectedVV.expected_birth_date && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <span className="mr-2">📅</span>
                      Ellési előrejelzés
                    </h4>
                    <div className="space-y-2 text-sm">
                      <p><strong>Várható ellés:</strong> {new Date(selectedVV.expected_birth_date).toLocaleDateString('hu-HU')}</p>
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <span className="mr-2">👨‍⚕️</span>
                    Egyéb adatok
                  </h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Állatorvos:</strong> {selectedVV.veterinarian || '-'}</p>
                    <p><strong>Rögzítés dátuma:</strong> {new Date(selectedVV.created_at).toLocaleDateString('hu-HU')}</p>
                  </div>
                </div>
              </div>

              {selectedVV.notes && (
                <div className="mt-6">
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                    <span className="mr-2">📝</span>
                    Megjegyzések
                  </h4>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                    {selectedVV.notes}
                  </p>
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedVV(null)}
                  className="bg-gray-600 hover:bg-gray-700 text-white font-medium px-6 py-3 rounded-lg transition-colors inline-flex items-center"
                >
                  <span className="mr-2">✅</span>
                  Bezárás
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal - DESIGN SYSTEM */}
      {deletingVV && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-sm border max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-red-600 text-xl">⚠️</span>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">VV Eredmény Törlése</h3>
                  <p className="text-sm text-gray-600">Ez a művelet nem visszafordítható!</p>
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg mb-4">
                <p className="text-sm"><strong>VV dátuma:</strong> {new Date(deletingVV.vv_date).toLocaleDateString('hu-HU')}</p>
                <p className="text-sm"><strong>Eredmény:</strong> {deletingVV.vv_result_days} nap ({deletingVV.pregnancy_status})</p>
                <p className="text-sm"><strong>Bika:</strong> {deletingVV.father_name || deletingVV.father_enar}</p>
              </div>

              <p className="text-gray-700 mb-6">
                Biztosan törölni szeretnéd ezt a VV eredményt? Ez a művelet nem visszafordítható.
              </p>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeletingVV(null)}
                  className="bg-white hover:bg-gray-50 text-gray-700 font-medium px-6 py-3 rounded-lg border border-gray-300 transition-colors inline-flex items-center"
                >
                  <span className="mr-2">❌</span>
                  Mégse
                </button>
                <button
                  onClick={confirmDeleteVV}
                  className="bg-red-500 hover:bg-red-600 text-white font-medium px-6 py-3 rounded-lg transition-colors inline-flex items-center"
                >
                  <span className="mr-2">🗑️</span>
                  Törlés
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AnimalDetailPage() {
  const router = useRouter();

  const [animal, setAnimal] = useState<Animal | null>(null);
  const [editedAnimal, setEditedAnimal] = useState<Animal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('reszletek');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Manual URL parsing
  useEffect(() => {
    console.log('🔍 ENAR Extraction Starting...');

    if (typeof window !== 'undefined') {
      try {
        const pathname = window.location.pathname;
        console.log('Current pathname:', pathname);

        const pathParts = pathname.split('/');
        const lastPart = pathParts[pathParts.length - 1];

        if (lastPart && lastPart !== 'undefined' && lastPart.length > 0) {
          const decodedEnar = decodeURIComponent(lastPart);
          console.log('✅ Decoded ENAR:', decodedEnar);
          fetchAnimal(decodedEnar);
        } else {
          setError('ENAR nem található az URL-ben');
          setLoading(false);
        }
      } catch (err) {
        console.error('❌ ENAR decode error:', err);
        setError('Hibás ENAR formátum az URL-ben');
        setLoading(false);
      }
    }
  }, []);

  // Fetch animal data
  const fetchAnimal = async (enar: string) => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Searching for animal with ENAR:', enar);

      const { data, error: supabaseError } = await supabase
        .from('animals')
        .select(`
    *,
    animal_pen_assignments!left(
      pen_id,
      assigned_at,
      removed_at,
      pens(
        pen_number,
        location,
        pen_type
      )
    )
  `)
        .eq('enar', enar)
        .single();

      if (supabaseError) {
        console.error('❌ Supabase error:', supabaseError);
        if (supabaseError.code === 'PGRST116') {
          setError(`Állat nem található: ${enar}`);
        } else {
          setError(`Adatbázis hiba: ${supabaseError.message}`);
        }
        return;
      }

      if (!data) {
        setError(`Nincs állat ezzel az ENAR-ral: ${enar}`);
        return;
      }

      console.log('✅ Animal loaded successfully:', data);

      if (!isEditing) {
        setAnimal(data);
        setEditedAnimal(data);
      } else {
        setAnimal(data);
        console.log('🔒 Editing in progress - preserving edited state');
      }
    } catch (err) {
      console.error('❌ Fetch error:', err);
      setError('Hiba történt az adatok betöltése során');
    } finally {
      setLoading(false);
    }
  };

  // Save changes
  const handleSave = async () => {
    if (!editedAnimal || !animal) return;

    try {
      setSaving(true);

      const { error } = await supabase
        .from('animals')
        .update({
          kategoria: editedAnimal.kategoria,
          ivar: editedAnimal.ivar,
          statusz: editedAnimal.statusz,
          jelenlegi_karam: editedAnimal.jelenlegi_karam,
          anya_enar: editedAnimal.anya_enar,
          apa_enar: editedAnimal.apa_enar,
          kplsz: editedAnimal.kplsz,
          szuletesi_datum: editedAnimal.szuletesi_datum,
          bekerules_datum: editedAnimal.bekerules_datum,
          name: editedAnimal.name,
          breed: editedAnimal.breed
        })
        .eq('enar', animal.enar);

      if (error) {
        console.error('Save error:', error);
        alert('Hiba a mentés során: ' + error.message);
        return;
      }

      setAnimal(editedAnimal);
      setIsEditing(false);

      await new Promise(resolve => setTimeout(resolve, 50));

    } catch (err) {
      console.error('Save error:', err);
      alert('Hiba történt a mentés során');
    } finally {
      setSaving(false);
    }
  };

  // Update field
  const updateField = (field: keyof Animal, value: string) => {
    if (!editedAnimal) return;
    setEditedAnimal({
      ...editedAnimal,
      [field]: value
    });
  };

  const handlePenChange = async (newPenId: string) => {
    if (!animal?.id) return;

    try {
      console.log(`🔄 Karám változtatás: ${animal.jelenlegi_karam} → ${newPenId}`);

      await supabase
        .from('animal_pen_assignments')
        .update({ removed_at: new Date().toISOString() })
        .eq('animal_id', animal.id)
        .is('removed_at', null);

      if (newPenId) {
        const { data: penData } = await supabase
          .from('pens')
          .select('id')
          .eq('pen_number', newPenId)
          .single();

        if (penData?.id) {
          await supabase
            .from('animal_pen_assignments')
            .insert({
              animal_id: animal.id,
              pen_id: penData.id,
              assigned_at: new Date().toISOString(),
              assignment_reason: 'manual_edit',
              notes: 'Állat részletek oldalon módosítva'
            });
        }
      }

      updateField('jelenlegi_karam', newPenId);

      setTimeout(() => {
        window.location.reload();
      }, 500);

      console.log('✅ Karám sikeresen megváltoztatva!');

    } catch (error) {
      console.error('❌ Hiba a karám változtatásnál:', error);
      alert('Hiba történt a karám változtatáskor!');
    }
  };

  // Calculate age
  const calculateAge = (birthDate: string) => {
    const birth = new Date(birthDate);
    const now = new Date();
    const diffMs = now.getTime() - birth.getTime();
    const years = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 365.25));
    const months = Math.floor((diffMs % (1000 * 60 * 60 * 24 * 365.25)) / (1000 * 60 * 60 * 24 * 30.44));

    if (years > 0) {
      return `${years} év ${months} hó`;
    }
    return `${months} hónap`;
  };

  // Get short ID
  const getShortId = (enar: string) => {
    const numbers = enar.replace(/\D/g, '');
    return numbers.slice(-5);
  };

  // Category colors
  const getCategoryColor = (category: string) => {
    const colors = {
      'tehén': 'bg-green-100 text-green-800 border-green-200',
      'szűz_üsző': 'bg-blue-100 text-blue-800 border-blue-200',
      'vemhes_üsző': 'bg-purple-100 text-purple-800 border-purple-200',
      'nőivarú_borjú': 'bg-pink-100 text-pink-800 border-pink-200',
      'hímivarú_borjú': 'bg-orange-100 text-orange-800 border-orange-200',
      'hízóbika': 'bg-red-100 text-red-800 border-red-200',
      'tenyészbika': 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // Dropdown options
  const categoryOptions = [
    { value: 'tehén', label: 'Tehén' },
    { value: 'szűz_üsző', label: 'Szűz üsző' },
    { value: 'vemhes_üsző', label: 'Vemhes üsző' },
    { value: 'nőivarú_borjú', label: 'Nőivarú borjú' },
    { value: 'hímivarú_borjú', label: 'Hímivarú borjú' },
    { value: 'hízóbika', label: 'Hízóbika' },
    { value: 'tenyészbika', label: 'Tenyészbika' }
  ];

  const genderOptions = [
    { value: 'nő', label: 'Nő' },
    { value: 'hím', label: 'Hím' }
  ];

  const statusOptions = [
    { value: 'aktív', label: 'Aktív' },
    { value: 'eladott', label: 'Eladott' },
    { value: 'elhullott', label: 'Elhullott' },
    { value: 'karantén', label: 'Karantén' }
  ];

  const penOptions = [
    { value: '', label: 'Nincs megadva' },
    { value: '1', label: '1 - Bal oldal' },
    { value: '2', label: '2 - Bal oldal' },
    { value: '3', label: '3 - Bal oldal' },
    { value: '4A', label: '4A - Bal oldal' },
    { value: '4B', label: '4B - Bal oldal' },
    { value: '5', label: '5 - Jobb oldal' },
    { value: '6', label: '6 - Jobb oldal' },
    { value: '7', label: '7 - Jobb oldal' },
    { value: '8', label: '8 - Jobb oldal' },
    { value: '9', label: '9 - Jobb oldal' },
    { value: '10', label: '10 - Jobb oldal' },
    { value: '11', label: '11 - Jobb oldal' },
    { value: '12A', label: '12A - Konténereknél' },
    { value: '12B', label: '12B - Konténereknél' },
    { value: '13', label: '13 - Hátsó sor' },
    { value: '14', label: '14 - Hátsó sor' },
    { value: '15', label: '15 - Hátsó sor' },
    { value: 'E1', label: 'E1 - Ellető istálló' },
    { value: 'E2', label: 'E2 - Ellető istálló' },
    { value: 'E3', label: 'E3 - Ellető istálló' },
    { value: 'E4', label: 'E4 - Ellető istálló' },
    { value: 'E5', label: 'E5 - Ellető istálló' },
    { value: 'E6', label: 'E6 - Ellető istálló' },
    { value: 'E7', label: 'E7 - Ellető istálló' },
    { value: 'E8', label: 'E8 - Ellető istálló' },
    { value: 'E9', label: 'E9 - Ellető istálló' },
    { value: 'E10', label: 'E10 - Ellető istálló' },
    { value: 'E11', label: 'E11 - Ellető istálló' },
    { value: 'E12', label: 'E12 - Ellető istálló' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Adatok betöltése...</p>
        </div>
      </div>
    );
  }

  if (error || !animal || !editedAnimal) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">🐄</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Hiba történt</h1>
          <p className="text-gray-600 mb-4">{error || 'Ismeretlen hiba'}</p>
          <button
            onClick={() => router.back()}
            className="bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-3 rounded-lg transition-colors inline-flex items-center"
          >
            <span className="mr-2">⬅️</span>
            Vissza
          </button>
        </div>
      </div>
    );
  }

  // MODERNIZÁLT TABOK - EMOJI IKONOKKAL
  const tabs: { id: string; name: string }[] = [
    { id: 'reszletek', name: '📋 Részletek' },
    { id: 'szuletesi', name: '📅 Születési adatok' },
    { id: 'helyzet', name: '📍 Jelenlegi helyzet' },
    { id: 'csalad', name: '🐄💕🐂 Család' },
    { id: 'szaporitas', name: '🔬 Szaporítás' },
    { id: 'egeszseg', name: '❤️ Egészség' },
    { id: 'esemenynaplo', name: '📊 Eseménynapló' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">

        {/* Header - DESIGN SYSTEM */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="text-gray-400 hover:text-gray-600 p-2 transition-colors"
              >
                ⬅️
              </button>
              <div className="flex items-center">
                <span className="text-4xl mr-4">🐄</span>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    {animal.enar}
                  </h1>
                  <p className="mt-2 text-gray-600">
                    #{getShortId(animal.enar)} • {animal.kategoria}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              {isEditing && (
                <button
                  onClick={() => {
                    setEditedAnimal(animal);
                    setIsEditing(false);
                  }}
                  className="bg-white hover:bg-gray-50 text-gray-700 font-medium px-6 py-3 rounded-lg border border-gray-300 transition-colors inline-flex items-center"
                >
                  <span className="mr-2">❌</span>
                  Mégse
                </button>
              )}
              <button
                onClick={isEditing ? handleSave : () => setIsEditing(true)}
                disabled={saving}
                className="bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-3 rounded-lg transition-colors disabled:opacity-50 inline-flex items-center"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Mentés...
                  </>
                ) : isEditing ? (
                  <>
                    <span className="mr-2">💾</span>
                    Mentés
                  </>
                ) : (
                  <>
                    <span className="mr-2">✏️</span>
                    Szerkesztés
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation - DESIGN SYSTEM */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-6 py-4 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${activeTab === tab.id
                  ? 'border-green-500 text-green-600 bg-green-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                {tab.name}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {/* Részletek Tab */}
        {activeTab === 'reszletek' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Alapadatok Kártya */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center mb-4">
                <span className="text-2xl mr-3">📋</span>
                <h3 className="text-lg font-semibold text-gray-900">Alapadatok</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🏷️ ENAR azonosító
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={animal.enar}
                      disabled
                      className="flex-1 block w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                    />
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      #{getShortId(animal.enar)}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    📝 Név
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedAnimal.name || ''}
                      onChange={(e) => updateField('name', e.target.value)}
                      placeholder="Állat neve (opcionális)"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    />
                  ) : (
                    <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                      {animal.name || 'Nincs név megadva'}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🏷️ Kategória
                  </label>
                  {isEditing ? (
                    <select
                      value={editedAnimal.kategoria}
                      onChange={(e) => updateField('kategoria', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors bg-white"
                    >
                      {categoryOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getCategoryColor(animal.kategoria)}`}>
                      {categoryOptions.find(opt => opt.value === animal.kategoria)?.label || animal.kategoria}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ⚥ Ivar
                  </label>
                  {isEditing ? (
                    <select
                      value={editedAnimal.ivar}
                      onChange={(e) => updateField('ivar', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors bg-white"
                    >
                      {genderOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="text-xl">
                      {animal.ivar === 'nő' ? '♀️' : '♂️'}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ⏰ Életkor
                  </label>
                  <input
                    type="text"
                    value={calculateAge(animal.szuletesi_datum)}
                    disabled
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                  />
                </div>
              </div>
            </div>

            {/* Állapot Kártya */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center mb-4">
                <span className="text-2xl mr-3">📊</span>
                <h3 className="text-lg font-semibold text-gray-900">Jelenlegi állapot</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ✅ Státusz
                  </label>
                  {isEditing ? (
                    <select
                      value={editedAnimal.statusz}
                      onChange={(e) => updateField('statusz', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors bg-white"
                    >
                      {statusOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${animal.statusz === 'aktív' ? 'bg-green-100 text-green-800' :
                      animal.statusz === 'eladott' ? 'bg-blue-100 text-blue-800' :
                        animal.statusz === 'elhullott' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                      }`}>
                      {statusOptions.find(opt => opt.value === animal.statusz)?.label || animal.statusz}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    📍 Jelenlegi karám
                  </label>
                  {isEditing ? (
                    <select
                      value={editedAnimal.jelenlegi_karam || ''}
                      onChange={(e) => handlePenChange(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors bg-white"
                    >
                      {penOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div>
                      {(() => {
                        const assignment = (animal as any).animal_pen_assignments?.find(
                          (a: any) => a.removed_at === null
                        );

                        const penInfo = assignment?.pens;

                        if (penInfo?.pen_number) {
                          return (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                              📍 {penInfo.pen_number} - {penInfo.location}
                            </span>
                          );
                        } else {
                          return (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                              🏠 Nincs karám hozzárendelés
                            </span>
                          );
                        }
                      })()}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    📅 Születési dátum
                  </label>
                  <input
                    type="text"
                    value={animal.szuletesi_datum}
                    disabled
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    📅 Bekerülés dátuma
                  </label>
                  <input
                    type="text"
                    value={animal.bekerules_datum}
                    disabled
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🌍 Származás
                  </label>
                  {isEditing ? (
                    <select
                      value={editedAnimal?.birth_location || 'ismeretlen'}
                      onChange={() => { }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors bg-white"
                    >
                      <option value="nálunk">🏠 Nálunk született</option>
                      <option value="vásárolt">🛒 Vásárolt</option>
                      <option value="ismeretlen">❓ Ismeretlen</option>
                    </select>
                  ) : (
                    <div className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium ${animal?.birth_location === 'nálunk'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-blue-100 text-blue-800'
                      }`}>
                      {animal?.birth_location === 'nálunk' ? '🏠 Nálunk született' : '🛒 Vásárolt'}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🐄 Fajta
                  </label>
                  {isEditing ? (
                    <select
                      value={editedAnimal.breed || ''}
                      onChange={(e) => updateField('breed', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors bg-white"
                    >
                      <option value="">Válasszon fajtát...</option>
                      {BREEDS.map(breed => (
                        <option key={breed} value={breed}>
                          {breed}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                      {animal.breed || 'Nincs fajta megadva'}
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>
        )}

        {/* Születési adatok Tab */}
        {activeTab === 'szuletesi' && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center mb-6">
              <span className="text-2xl mr-3">📅</span>
              <h3 className="text-lg font-semibold text-gray-900">Születési adatok</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📅 Születési dátum
                </label>
                <input
                  type="date"
                  value={isEditing ? (editedAnimal?.szuletesi_datum || '') : (animal?.szuletesi_datum || '')}
                  onChange={(e) => {
                    if (!isEditing || !editedAnimal) return;
                    const newValue = e.target.value;
                    setEditedAnimal(prev => prev ? { ...prev, szuletesi_datum: newValue } : null);
                  }}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📅 Bekerülés dátuma
                </label>
                <input
                  type="date"
                  value={isEditing ? (editedAnimal?.bekerules_datum || '') : (animal?.bekerules_datum || '')}
                  onChange={(e) => {
                    if (!isEditing || !editedAnimal) return;
                    const newValue = e.target.value;
                    setEditedAnimal(prev => prev ? { ...prev, bekerules_datum: newValue } : null);
                  }}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ⏰ Életkor
                </label>
                <input
                  type="text"
                  value={calculateAge(animal?.szuletesi_datum)}
                  disabled
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Jelenlegi helyzet Tab */}
        {activeTab === 'helyzet' && (
          <CurrentStatusTab animal={animal} />
        )}

        {/* Család Tab */}
        {activeTab === 'csalad' && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center mb-6">
              <span className="text-2xl mr-3">🐄💕🐂</span>
              <h3 className="text-lg font-semibold text-gray-900">Szülők és családfa</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🐄 Anya ENAR
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedAnimal.anya_enar || ''}
                    onChange={(e) => updateField('anya_enar', e.target.value)}
                    placeholder="Pl. HU 30223 0444 9"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                  />
                ) : (
                  <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                    {animal.anya_enar || 'Nincs megadva'}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🐂 Apa ENAR
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedAnimal.apa_enar || ''}
                    onChange={(e) => updateField('apa_enar', e.target.value)}
                    placeholder="Pl. HU 30223 0444 9"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                  />
                ) : (
                  <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                    {animal.apa_enar || 'Nincs megadva'}
                  </div>
                )}
              </div>

              {(animal.kplsz || isEditing) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    📋 KPLSZ szám
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedAnimal.kplsz || ''}
                      onChange={(e) => updateField('kplsz', e.target.value)}
                      placeholder="KPLSZ azonosító"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    />
                  ) : (
                    <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                      {animal.kplsz || 'Nincs megadva'}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Szaporítás Tab */}
        {activeTab === 'szaporitas' && (
          <SzaporitasTab animal={animal} />
        )}

        {/* Placeholder tabs */}
        {['egeszseg', 'esemenynaplo'].includes(activeTab) && (
          <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
            <div className="text-gray-400 text-6xl mb-4">🐄</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Hamarosan elérhető
            </h3>
            <p className="text-gray-500">
              Ez a funkció még fejlesztés alatt áll
            </p>
          </div>
        )}
      </div>
    </div>
  );
}