'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface SyncResult {
  duplicates: Array<{
    id: number;
    enar: string;
    jelenlegi_karam: string;
    aktiv_hozzarendelesek_szama: number; // ← VISSZAÁLLÍTVA: integer → number
    aktiv_karamok: string;
  }>;
  syncIssues: Array<{
    id: number;
    enar: string;
    jelenlegi_karam: string;
    aktiv_hozzarendeles_karam: string;
    szinkronizacio_statusz: string;
  }>;
  stats: {
    totalAnimals: number; // ← VISSZAÁLLÍTVA: integer → number
    duplicateCount: number; // ← VISSZAÁLLÍTVA: integer → number
    syncIssueCount: number; // ← VISSZAÁLLÍTVA: integer → number
  };
}

export function AdminEszkozok() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncData, setSyncData] = useState<SyncResult | null>(null);
  const [fixChoices, setFixChoices] = useState<{[animalId: string]: 'keep_animals' | 'keep_assignment' | 'skip'}>({});

  const checkSynchronization = async () => {
    setIsLoading(true);
    console.log('🔍 Szinkronizáció ellenőrzés kezdése...');
    
    try {
      // ✅ EGYSZERŰ SQL LEKÉRDEZÉSEK RPC HELYETT
      console.log('🔍 Egyszerű SQL lekérdezések indítása...');
      
      // 1. Duplikált hozzárendelések keresése - egyszerű SQL
      const { data: duplicatesRaw, error: dupError } = await supabase
        .from('animals')
        .select(`
          id, enar, jelenlegi_karam,
          animal_pen_assignments!inner(pen_id, pens!inner(pen_number))
        `)
        .is('animal_pen_assignments.removed_at', null);
      
      console.log('🔍 Duplikáció raw eredmény:', { duplicatesRaw, dupError });
      
      // 2. Szinkronizációs hibák keresése - egyszerű SQL
      const { data: syncIssuesRaw, error: syncError } = await supabase
        .from('animals')
        .select(`
          id, enar, jelenlegi_karam, statusz,
          animal_pen_assignments!left(pen_id, removed_at, pens!inner(pen_number))
        `)
        .eq('statusz', 'aktív');
      
      console.log('🔍 Szinkronizáció raw eredmény:', { syncIssuesRaw, syncError });
      
      // 3. Statisztikák számítása
      const { count: totalAnimals, error: statsError } = await supabase
        .from('animals')
        .select('*', { count: 'exact', head: true })
        .eq('statusz', 'aktív');
      
      console.log('🔍 Statisztika eredmény:', { totalAnimals, statsError });

      // 4. Hibakezelés
      if (dupError || syncError || statsError) {
        throw new Error(`SQL lekérdezési hiba: ${dupError?.message || syncError?.message || statsError?.message}`);
      }

      // 5. Duplikációk feldolgozása
      const duplicatesMap = new Map();
      duplicatesRaw?.forEach((animal: any) => {
        const key = animal.id;
        const penNumber = animal.animal_pen_assignments?.[0]?.pens?.pen_number;
        
        if (duplicatesMap.has(key)) {
          duplicatesMap.get(key).count++;
          if (penNumber) {
            duplicatesMap.get(key).pens.add(penNumber);
          }
        } else {
          duplicatesMap.set(key, {
            id: animal.id,
            enar: animal.enar,
            jelenlegi_karam: animal.jelenlegi_karam,
            count: 1,
            pens: new Set(penNumber ? [penNumber] : [])
          });
        }
      });

      const duplicates = Array.from(duplicatesMap.values())
        .filter(item => item.count > 1)
        .map(item => ({
          id: item.id,
          enar: item.enar,
          jelenlegi_karam: item.jelenlegi_karam,
          aktiv_hozzarendelesek_szama: item.count,
          aktiv_karamok: Array.from(item.pens).join(', ')
        }));

      // 6. Szinkronizációs hibák feldolgozása
      const syncIssues = syncIssuesRaw?.filter((animal: any) => {
        const activeAssignment = animal.animal_pen_assignments?.find((a: any) => !a.removed_at);
        const assignedPen = activeAssignment?.pens?.pen_number;
        
        // Szinkronizációs hiba feltételei
        if (animal.jelenlegi_karam !== assignedPen) return true;
        if (animal.jelenlegi_karam === null && assignedPen) return true;
        if (animal.jelenlegi_karam && !assignedPen) return true;
        
        return false;
      }).map((animal: any) => {
        const activeAssignment = animal.animal_pen_assignments?.find((a: any) => !a.removed_at);
        const assignedPen = activeAssignment?.pens?.pen_number || null;
        
        let status = 'Nincs szinkron';
        if (animal.jelenlegi_karam === assignedPen) {
          status = 'Szinkron';
        } else if (animal.jelenlegi_karam === null && assignedPen) {
          status = 'Animals NULL, de van aktív hozzárendelés';
        } else if (animal.jelenlegi_karam && !assignedPen) {
          status = 'Animals van, de nincs aktív hozzárendelés';
        } else if (animal.jelenlegi_karam === null && !assignedPen) {
          status = 'Nincs karám hozzárendelése - Elhelyezésre vár';
        }
        
        return {
          id: animal.id,
          enar: animal.enar,
          jelenlegi_karam: animal.jelenlegi_karam,
          aktiv_hozzarendeles_karam: assignedPen,
          szinkronizacio_statusz: status
        };
      }) || [];

      // 7. Eredmények feldolgozása
      const processedSyncData = {
        duplicates: duplicates || [],
        syncIssues: syncIssues || [],
        stats: { 
          totalAnimals: totalAnimals || 0, 
          duplicateCount: duplicates?.length || 0, 
          syncIssueCount: syncIssues?.length || 0 
        }
      };

      console.log('✅ Feldolgozott adatok:', processedSyncData);

      setSyncData(processedSyncData);
      setFixChoices({}); // Választások törlése
      setShowSyncModal(true);
      setIsOpen(false);

    } catch (error) {
      console.error('💥 Teljes hiba:', error);
      
      // Részletes hibaüzenet
      const errorMessage = error instanceof Error ? error.message : 'Ismeretlen hiba';
      alert(`❌ Ellenőrzési hiba: ${errorMessage}\n\nEllenőrizd a konzolt további részletekért.`);
    } finally {
      setIsLoading(false);
    }
  };

  const fixSyncIssues = async () => {
    if (!syncData || syncData.syncIssues.length === 0) return;
    
    const selectedFixes = Object.entries(fixChoices).filter(([_, choice]) => choice !== 'skip');
    
    if (selectedFixes.length === 0) {
      alert('❌ Nem választottál javítási műveletet!');
      return;
    }
    
    if (!confirm(`${selectedFixes.length} kiválasztott hibát javítsunk?\n\nEllenőrizd a választásokat az összefoglalóban.`)) return;

    setIsLoading(true);
    let successCount = 0;
    let errorCount = 0;
    
    try {
      for (const [animalIdStr, choice] of selectedFixes) {
        const animalId = parseInt(animalIdStr);
        const issue = syncData.syncIssues.find(item => item.id === animalId);
        if (!issue) continue;

        try {
          if (choice === 'keep_assignment') {
            // Animals tábla frissítése az aktív hozzárendelés alapján
            await supabase
              .from('animals')
              .update({ jelenlegi_karam: issue.aktiv_hozzarendeles_karam })
              .eq('id', animalId);
            successCount++;
          } else if (choice === 'keep_animals') {
            // Jelenlegi aktív hozzárendelés lezárása
            const { data: currentAssignment } = await supabase
              .from('animal_pen_assignments')
              .select('id, pen_id')
              .eq('animal_id', animalId)
              .is('removed_at', null)
              .single();

            if (currentAssignment) {
              await supabase
                .from('animal_pen_assignments')
                .update({ removed_at: new Date().toISOString() })
                .eq('id', currentAssignment.id);
            }

            // Új hozzárendelés létrehozása az animals tábla alapján
            const { data: targetPen } = await supabase
              .from('pens')
              .select('id')
              .eq('pen_number', issue.jelenlegi_karam)
              .single();

            if (targetPen) {
              await supabase
                .from('animal_pen_assignments')
                .insert({
                  animal_id: animalId,
                  pen_id: targetPen.id,
                  assigned_at: new Date().toISOString(),
                  assignment_reason: 'szinkronizacio_javitas_admin'
                });
            }
            successCount++;
          }
        } catch (error) {
          console.error(`Hiba ${issue.enar} javításánál:`, error);
          errorCount++;
        }
      }

      // Újra ellenőrzés
      await checkSynchronization();
      setFixChoices({});
      
      const message = `✅ Javítás befejezve!\n\nSikeres: ${successCount}\nHibás: ${errorCount}`;
      alert(message);

    } catch (error) {
      alert(`❌ Javítási hiba: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const SyncModal = () => {
    if (!showSyncModal || !syncData) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
          {/* Header */}
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">
              🔍 Szinkronizáció Ellenőrzés
            </h2>
            <button
              onClick={() => setShowSyncModal(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {/* Statisztikák */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-600">{syncData.stats.totalAnimals}</div>
                <div className="text-sm text-blue-800">Összes aktív állat</div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-red-600">{syncData.stats.duplicateCount}</div>
                <div className="text-sm text-red-800">Duplikált hozzárendelés</div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-yellow-600">{syncData.stats.syncIssueCount}</div>
                <div className="text-sm text-yellow-800">Szinkronizációs hiba</div>
              </div>
            </div>

            {/* Duplikációk */}
            {syncData.duplicates.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-medium text-red-600 mb-3">
                  ❌ Duplikált aktív hozzárendelések ({syncData.duplicates.length} db)
                </h3>
                <div className="bg-red-50 border border-red-200 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-red-200">
                      <thead className="bg-red-100">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-red-800">ENAR</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-red-800">Jelenlegi karám</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-red-800">Aktív hozzárendelések</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-red-800">Karámok</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-red-200">
                        {syncData.duplicates.map((item) => (
                          <tr key={item.id}>
                            <td className="px-3 py-2 text-sm font-medium text-gray-900">{item.enar}</td>
                            <td className="px-3 py-2 text-sm text-gray-600">{item.jelenlegi_karam}</td>
                            <td className="px-3 py-2 text-sm text-red-600 font-bold">{item.aktiv_hozzarendelesek_szama}</td>
                            <td className="px-3 py-2 text-sm text-gray-600">{item.aktiv_karamok}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Szinkronizációs hibák */}
            {syncData.syncIssues.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-medium text-yellow-600 mb-3 flex items-center justify-between">
                  <span>⚠️ Szinkronizációs hibák ({syncData.syncIssues.length} db)</span>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setFixChoices({})}
                      className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded"
                    >
                      🔄 Választások törlése
                    </button>
                  </div>
                </h3>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-yellow-200">
                      <thead className="bg-yellow-100">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-yellow-800">ENAR</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-yellow-800">Animals tábla</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-yellow-800">Aktív hozzárendelés</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-yellow-800">Státusz</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-yellow-800">Javítás választása</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-yellow-200">
                        {syncData.syncIssues.map((item) => (
                          <tr key={item.id} className={fixChoices[item.id] ? 'bg-blue-50' : ''}>
                            <td className="px-3 py-2 text-sm font-medium text-gray-900">{item.enar}</td>
                            <td className="px-3 py-2 text-sm text-gray-600">
                              <span className={fixChoices[item.id] === 'keep_animals' ? 'bg-green-200 px-1 rounded' : ''}>
                                {item.jelenlegi_karam || 'NULL'}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-sm text-gray-600">
                              <span className={fixChoices[item.id] === 'keep_assignment' ? 'bg-green-200 px-1 rounded' : ''}>
                                {item.aktiv_hozzarendeles_karam}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-sm text-yellow-600">{item.szinkronizacio_statusz}</td>
                            <td className="px-3 py-2">
                              <div className="flex flex-col space-y-1">
                                {/* Ha van aktív hozzárendelés */}
                                {item.aktiv_hozzarendeles_karam && (
                                  <button
                                    onClick={() => setFixChoices(prev => ({
                                      ...prev,
                                      [item.id]: 'keep_assignment'
                                    }))}
                                    className={`text-xs px-2 py-1 rounded transition-colors ${
                                      fixChoices[item.id] === 'keep_assignment'
                                        ? 'bg-green-500 text-white'
                                        : 'bg-gray-100 hover:bg-green-100 text-gray-700'
                                    }`}
                                  >
                                    ✅ Karám: {item.aktiv_hozzarendeles_karam}
                                  </button>
                                )}
                                
                                {/* Ha van Animals karám */}
                                {item.jelenlegi_karam && (
                                  <button
                                    onClick={() => setFixChoices(prev => ({
                                      ...prev,
                                      [item.id]: 'keep_animals'
                                    }))}
                                    className={`text-xs px-2 py-1 rounded transition-colors ${
                                      fixChoices[item.id] === 'keep_animals'
                                        ? 'bg-green-500 text-white'
                                        : 'bg-gray-100 hover:bg-green-100 text-gray-700'
                                    }`}
                                  >
                                    ✅ Karám: {item.jelenlegi_karam}
                                  </button>
                                )}
                                
                                {/* ELHELYEZÉSRE VÁRÓ ÁLLAT ESETÉN */}
                                {!item.aktiv_hozzarendeles_karam && !item.jelenlegi_karam && (
                                  <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                                    📍 ELHELYEZÉSRE VÁR<br/>
                                    Nincs karám hozzárendelése.<br/>
                                    Karám oldalon helyezhető el.
                                  </div>
                                )}
                                
                                <button
                                  onClick={() => setFixChoices(prev => ({
                                    ...prev,
                                    [item.id]: 'skip'
                                  }))}
                                  className={`text-xs px-2 py-1 rounded transition-colors ${
                                    fixChoices[item.id] === 'skip'
                                      ? 'bg-gray-500 text-white'
                                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                  }`}
                                >
                                  ⏭️ Kihagyás
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                {/* Választások összefoglalása */}
                {Object.keys(fixChoices).length > 0 && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="text-sm font-medium text-blue-800 mb-2">
                      📋 Kiválasztott javítások ({Object.keys(fixChoices).filter(id => fixChoices[id] !== 'skip').length} db):
                    </div>
                    <div className="text-xs text-blue-700 space-y-1">
                      {Object.entries(fixChoices).map(([animalId, choice]) => {
                        const animal = syncData.syncIssues.find(item => item.id.toString() === animalId);
                        if (!animal || choice === 'skip') return null;
                        
                        return (
                          <div key={animalId}>
                            <strong>{animal.enar}</strong>: {
                              choice === 'keep_assignment' 
                                ? `Animals tábla → ${animal.aktiv_hozzarendeles_karam}`
                                : `Hozzárendelés → ${animal.jelenlegi_karam} (és régi hozzárendelés lezárása)`
                            }
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Minden rendben üzenet */}
            {syncData.duplicates.length === 0 && syncData.syncIssues.length === 0 && (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">✅</div>
                <h3 className="text-xl font-medium text-green-600 mb-2">Minden rendben!</h3>
                <p className="text-gray-600">
                  Nincsenek duplikációk vagy szinkronizációs hibák a rendszerben.
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-between">
            <button
              onClick={() => setShowSyncModal(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Bezárás
            </button>
            <div className="flex space-x-3">
              <button
                onClick={checkSynchronization}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? '🔄 Frissítés...' : '🔄 Újra ellenőrzés'}
              </button>
              {syncData.syncIssues.length > 0 && (
                <button
                  onClick={fixSyncIssues}
                  disabled={isLoading || Object.keys(fixChoices).filter(id => fixChoices[id] !== 'skip').length === 0}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? '🔧 Javítás...' : `🔧 ${Object.keys(fixChoices).filter(id => fixChoices[id] !== 'skip').length} kiválasztott javítása`}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="relative inline-block">
        {/* Szuper diszkrét trigger */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-gray-400 hover:text-gray-600 p-1 rounded transition-colors duration-200"
          title="Admin eszközök"
        >
          <span className="text-xs">⚙️</span>
        </button>

        {/* Dropdown menu */}
        {isOpen && (
          <>
            {/* Háttér overlay - kattintásra bezár */}
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setIsOpen(false)}
            />
            
            {/* Menu */}
            <div className="absolute right-0 top-8 bg-white rounded-md shadow-lg border border-gray-200 py-2 z-20 min-w-64">
              <div className="px-3 py-1 text-xs font-medium text-gray-500 border-b border-gray-100 mb-1">
                Admin Eszközök
              </div>
              
              <button
                onClick={checkSynchronization}
                disabled={isLoading}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                <span className="mr-3">🔍</span>
                <div>
                  <div className="font-medium">Szinkronizáció Ellenőrzés</div>
                  <div className="text-xs text-gray-500">Duplikációk és inkonzisztenciák keresése</div>
                </div>
                {isLoading && <span className="ml-auto animate-spin">⚙️</span>}
              </button>

              <button
                onClick={() => {
                  alert('📊 Karám statisztikák\n\nEz a funkció hamarosan elérhető lesz!');
                  setIsOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
              >
                <span className="mr-3">📊</span>
                <div>
                  <div className="font-medium">Karám Statisztikák</div>
                  <div className="text-xs text-gray-500">Részletes adatelemzés és jelentések</div>
                </div>
              </button>

              <button
                onClick={() => {
                  alert('🔍 Adatintegritás Ellenőrzés\n\nEz a funkció hamarosan elérhető lesz!');
                  setIsOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
              >
                <span className="mr-3">🔍</span>
                <div>
                  <div className="font-medium">Adatintegritás</div>
                  <div className="text-xs text-gray-500">Teljes rendszer ellenőrzése</div>
                </div>
              </button>
            </div>
          </>
        )}
      </div>

      <SyncModal />
    </>
  );
}