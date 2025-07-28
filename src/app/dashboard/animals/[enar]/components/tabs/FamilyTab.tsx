'use client';

import React, { useState, useEffect } from 'react';
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

  // 🆕 DINAMIKUS SZÜLŐ KERESÉS STATE
  const [motherData, setMotherData] = useState<{ enar: string, name?: string } | null>(null);
  const [fatherData, setFatherData] = useState<{
    enar: string,
    name?: string,
    kplsz?: string,
    source?: string,
    uncertain_paternity?: boolean,
    possible_fathers?: any[],
    blood_test_date?: string
  } | null>(null);
  const [loadingMother, setLoadingMother] = useState(true);
  const [loadingFather, setLoadingFather] = useState(true);

  // 🆕 SZÜLŐ ADATOK DINAMIKUS BETÖLTÉSE
  useEffect(() => {
    const fetchParentData = async () => {
      setLoadingMother(true);
      setLoadingFather(true);

      try {
        // ========== ANYA KERESÉS ==========
        // 1. Ha van közvetlen anya_enar
        if (animal.anya_enar) {
          console.log('🐄 Közvetlen anya_enar található:', animal.anya_enar);

          // Keressük meg az anya nevét is
          const { data: motherInfo } = await supabase
            .from('animals')
            .select('enar, name')
            .eq('enar', animal.anya_enar)
            .single();

          setMotherData({
            enar: animal.anya_enar,
            name: motherInfo?.name || undefined
          });
        }
        // 2. Ha nincs közvetlen anya_enar, de van birth_id
        else if (animal.birth_id) {
          console.log('🔍 Anya keresése birth_id alapján:', animal.birth_id);

          const { data: birthData } = await supabase
            .from('births')
            .select(`
              mother_enar
            `)
            .eq('id', animal.birth_id)
            .single();

          if (birthData?.mother_enar) {
            console.log('✅ Anya megtalálva birth_id alapján:', birthData.mother_enar);
            setMotherData({
              enar: birthData.mother_enar,
              name: undefined // Nincs szükség a mother join-ra
            });
          } else {
            setMotherData(null);
          }
        } else {
          setMotherData(null);
        }

        // ========== APA KERESÉS ==========
        // 1. Ha van közvetlen father_enar
        if (animal.father_enar) {
          console.log('🐂 Közvetlen father_enar található:', animal.father_enar);

          const { data: fatherInfo } = await supabase
            .from('animals')
            .select('enar, name')
            .eq('enar', animal.father_enar)
            .single();

          setFatherData({
            enar: animal.father_enar,
            name: animal.father_name || fatherInfo?.name || undefined,
            kplsz: animal.father_kplsz || undefined,
            source: animal.father_source || 'direct',
            uncertain_paternity: animal.uncertain_paternity || false,  // ← ADD HOZZÁ!
            possible_fathers: animal.possible_fathers || []           // ← ADD HOZZÁ!
          });
        }
        // 2. Birth record alapján keresés
        else if (animal.birth_id) {
          console.log('🔍 Apa keresése birth_id alapján:', animal.birth_id);

          const { data: birthData } = await supabase
            .from('births')
            .select(`
      father_enar,
      father_name,
      father_kplsz,
      mother_enar
    `)
            .eq('id', animal.birth_id)
            .single();

          // ⭐ ÚJ: PÁRHUZAMOS VV KERESÉS - MINDIG!
          const motherEnar = animal.anya_enar || birthData?.mother_enar;
          let vvData = null;

          if (motherEnar) {
            console.log('🔍 Párhuzamos VV keresés az anya alapján:', motherEnar);

            const { data: vvResults } = await supabase
              .from('vv_results')
              .select(`
        father_enar,
        father_name,
        father_kplsz,
        uncertain_paternity,
        possible_fathers,
        blood_test_date,
        vv_date,
        pregnancy_status
      `)
              .eq('animal_enar', motherEnar)
              .eq('pregnancy_status', 'vemhes')
              .order('vv_date', { ascending: false })
              .limit(1);

            vvData = vvResults?.[0];

            // ⭐ DEBUG LOGOK:
            console.log('🔍 VV eredmény:', vvData);
            if (vvData) {
              console.log('🔍 DEBUG - VV uncertain_paternity:', vvData.uncertain_paternity);
              console.log('🔍 DEBUG - VV possible_fathers:', vvData.possible_fathers);
              console.log('🔍 DEBUG - VV possible_fathers length:', vvData.possible_fathers?.length);
            }
          }

          // ⭐ DÖNTÉSI LOGIKA: VV PRIORITÁS BIZONYTALAN APASÁG ESETÉN
          if (vvData && (vvData.uncertain_paternity || (vvData.possible_fathers && vvData.possible_fathers.length > 1))) {
            console.log('✅ BIZONYTALAN APASÁG - VV eredmény használata:', vvData);
            setFatherData({
              enar: vvData.father_enar,
              name: vvData.father_name || undefined,
              kplsz: vvData.father_kplsz || undefined,
              source: 'vv_record',
              uncertain_paternity: vvData.uncertain_paternity || false,
              possible_fathers: vvData.possible_fathers || [],
              blood_test_date: vvData.blood_test_date || undefined
            });
          }
          // Ha nincs bizonytalan apaság a VV-ben, használjuk a births adatot
          else if (birthData?.father_enar) {
            console.log('✅ Apa megtalálva birth_id alapján (nincs VV bizonytalan apaság):', birthData.father_enar);
            setFatherData({
              enar: birthData.father_enar,
              name: birthData.father_name || undefined,
              kplsz: birthData.father_kplsz || undefined,
              source: 'birth_record'
            });
          }
          // Ha a VV-ben van apa adat (de nem bizonytalan), azt használjuk
          else if (vvData && vvData.father_enar) {
            console.log('✅ Apa megtalálva VV results alapján (egyértelmű):', vvData);
            setFatherData({
              enar: vvData.father_enar,
              name: vvData.father_name || undefined,
              kplsz: vvData.father_kplsz || undefined,
              source: 'vv_record',
              uncertain_paternity: vvData.uncertain_paternity || false,
              possible_fathers: vvData.possible_fathers || [],
              blood_test_date: vvData.blood_test_date || undefined
            });
          }

          else {
            console.log('❌ Nem található apa adat sem births-ben, sem VV-ben');
            setFatherData(null);
          }
        }
        // 4. Legacy apa_enar keresés
        else if (animal.apa_enar) {
          console.log('📝 Régi apa_enar mező használata:', animal.apa_enar);
          setFatherData({
            enar: animal.apa_enar,
            source: 'legacy'
          });
        } else {
          setFatherData(null);
        }

      } catch (error) {
        console.error('❌ Hiba a szülő adatok betöltésekor:', error);
        setMotherData(null);
        setFatherData(null);
      } finally {
        setLoadingMother(false);
        setLoadingFather(false);
      }
    };

    fetchParentData();
  }, [
    animal.anya_enar,
    animal.birth_id,
    animal.father_enar,
    animal.father_name,        // ← EZT ADD HOZZÁ!
    animal.father_kplsz,       // ← EZT ADD HOZZÁ!
    animal.uncertain_paternity, // ← EZT ADD HOZZÁ!
    animal.possible_fathers,   // ← EZT ADD HOZZÁ!
    animal.apa_enar
  ]);

  // Amikor a szerkesztés gombra kattintunk, betöltjük a meglévő apa adatokat az űrlapba.
  const openFatherModalForEditing = () => {
    setManualFatherForm({
      father_enar: animal.father_enar || fatherData?.enar || animal.apa_enar || '',
      father_name: animal.father_name || fatherData?.name || '',
      father_kplsz: animal.father_kplsz || fatherData?.kplsz || animal.apa_kplsz || '',
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

  // 🆕 ANYA ADATOK MEGJELENÍTÉSE
  const MotherDataDisplay = () => {
    if (loadingMother) {
      return (
        <div className="w-full px-3 py-2 border border-transparent rounded-lg bg-gray-50 text-gray-700 min-h-[42px] flex items-center">
          <div className="animate-pulse flex items-center">
            <div className="h-4 bg-gray-300 rounded w-20 mr-2"></div>
            <span className="text-gray-400">Betöltés...</span>
          </div>
        </div>
      );
    }

    if (motherData) {
      return (
        <div className="w-full px-3 py-2 border border-transparent rounded-lg bg-green-50 text-gray-700 min-h-[42px] flex items-center justify-between">
          <div>
            <span className="font-medium text-green-800">
              🐄 {displayEnar(motherData.enar)}
            </span>
            {motherData.name && (
              <span className="text-green-600 ml-2">({motherData.name})</span>
            )}
          </div>
          {!animal.anya_enar && (
            <button
              onClick={async () => {
                try {
                  const { error } = await supabase
                    .from('animals')
                    .update({ anya_enar: motherData.enar })
                    .eq('id', animal.id);

                  if (error) throw error;

                  alert('✅ Anya ENAR sikeresen rögzítve!');
                  onUpdate();
                } catch (error) {
                  console.error('❌ Hiba az anya ENAR rögzítésekor:', error);
                  alert('❌ Hiba történt az anya ENAR rögzítésekor!');
                }
              }}
              className="bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1 rounded"
              title="Anya ENAR rögzítése az animals táblában"
            >
              📌 Rögzítés
            </button>
          )}
        </div>
      );
    }

    return (
      <div className="w-full px-3 py-2 border border-transparent rounded-lg bg-gray-50 text-gray-700 min-h-[42px] flex items-center">
        <span className="text-gray-400">Nincs megadva</span>
      </div>
    );
  };

  // 🆕 APA ADATOK MEGJELENÍTÉSE
  const FatherDataDisplay = () => {
    // 🔥 JAVÍTOTT FORRÁS MEGJELENÍTÉS
    const getSourceText = (source: string) => {
      switch (source) {
        case 'direct':
          return '📝 Közvetlen megadás';
        case 'birth_record':
          return '🐄 Ellési rekord';
        case 'vv_record':
          return '🔬 VV eredmény (vemhességi vizsgálat)';
        case 'legacy':
          return '📚 Régi rendszer';
        case 'manual':
          return '✏️ Manuális rögzítés';
        default:
          return '❓ Ismeretlen forrás';
      }
    };
    if (loadingFather) {
      return (
        <div className="bg-gray-50 border-l-4 border-gray-400 p-4 rounded-r-lg">
          <div className="animate-pulse flex items-center">
            <div className="h-4 bg-gray-300 rounded w-20 mr-2"></div>
            <span className="text-gray-400">Betöltés...</span>
          </div>
        </div>
      );
    }

    if (fatherData) {
      // Bizonytalan apaság esetén
      if (fatherData.uncertain_paternity && fatherData.possible_fathers && fatherData.possible_fathers.length > 1) {
        return (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-yellow-800 font-semibold mb-2 flex items-center">
                  ⚠️ Bizonytalan Apaság
                </h3>
                <p className="text-yellow-700 mb-3 text-sm">
                  🩸 <strong>Vérvizsgálat szükséges a pontos apa meghatározásához!</strong>
                </p>

                <div className="bg-yellow-100 p-3 rounded mb-3">
                  <p className="font-medium text-yellow-800 mb-2 text-sm">Lehetséges apák:</p>
                  <div className="space-y-1">
                    {fatherData.possible_fathers.map((father: any, index: number) => (
                      <div key={index} className="text-yellow-800 text-sm">
                        🐂 {father.name || 'Ismeretlen'} ({father.enar || 'Nincs ENAR'})
                        {father.kplsz && ` - KPLSZ: ${father.kplsz}`}
                      </div>
                    ))}
                  </div>
                </div>

                {fatherData.blood_test_date && (
                  <p className="text-yellow-700 text-sm mb-2">
                    🗓️ Vérvizsgálat időpontja: {new Date(fatherData.blood_test_date).toLocaleDateString('hu-HU')}
                  </p>
                )}

                <p className="text-sm text-yellow-600">
                  <strong>Forrás:</strong> {getSourceText(fatherData.source || 'unknown')}
                </p>
              </div>
              <button
                onClick={openFatherModalForEditing}
                className="bg-yellow-600 hover:bg-yellow-700 text-white text-xs px-2 py-1 rounded ml-2"
              >
                ✏️ Szerkesztés
              </button>
            </div>
          </div>
        );
      }

      // Egyértelmű apaság esetén
      return (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-r-lg">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-green-800 font-semibold mb-1">✅ Apa Azonosítva</h3>
              <p className="text-green-700">
                🐂 <strong>{fatherData.name || 'Névtelen'}</strong> ({fatherData.enar})
              </p>
              {fatherData.kplsz && <p className="text-green-700">KPLSZ: {fatherData.kplsz}</p>}
              <p className="text-sm text-green-600 mt-1">
                <strong>Forrás:</strong> {getSourceText(fatherData.source || 'unknown')}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={openFatherModalForEditing}
                className="bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1 rounded"
              >
                ✏️ Szerkesztés
              </button>
              {!animal.father_enar && (
                <button
                  onClick={async () => {
                    try {
                      const { error } = await supabase
                        .from('animals')
                        .update({
                          father_enar: fatherData.enar,
                          father_name: fatherData.name,
                          father_kplsz: fatherData.kplsz,
                          father_source: fatherData.source,
                          uncertain_paternity: fatherData.uncertain_paternity,
                          possible_fathers: fatherData.possible_fathers
                        })
                        .eq('id', animal.id);

                      if (error) throw error;

                      alert('✅ Apa ENAR sikeresen rögzítve!');
                      onUpdate();
                    } catch (error) {
                      console.error('❌ Hiba az apa ENAR rögzítésekor:', error);
                      alert('❌ Hiba történt az apa ENAR rögzítésekor!');
                    }
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1 rounded"
                  title="Apa ENAR rögzítése az animals táblában"
                >
                  📌 Rögzítés
                </button>
              )}
            </div>
          </div>
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
              <MotherDataDisplay />
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
                <input type="text" value={manualFatherForm.father_name} onChange={(e) => setManualFatherForm({ ...manualFatherForm, father_name: e.target.value })} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Apa KPLSZ</label>
                <input type="text" value={manualFatherForm.father_kplsz} onChange={(e) => setManualFatherForm({ ...manualFatherForm, father_kplsz: e.target.value })} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md" />
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