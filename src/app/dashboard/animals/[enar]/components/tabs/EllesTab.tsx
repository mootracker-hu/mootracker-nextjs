'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import BirthForm from '@/components/birth-form';
import type { Animal } from '@/types/animal-types';
import type { Birth } from '@/types/birth-types';

export default function EllesTab({ animal }: { animal: Animal }) {
  const [showBirthForm, setShowBirthForm] = useState(false);
  const [birthHistory, setBirthHistory] = useState<any[]>([]);
  const [loadingBirths, setLoadingBirths] = useState(true);
  const [selectedBirth, setSelectedBirth] = useState<any>(null);
  const [editingBirth, setEditingBirth] = useState<any>(null);
  const [deletingBirth, setDeletingBirth] = useState<any>(null);
  const [assigningEarTag, setAssigningEarTag] = useState<any>(null);
  const [possibleAnimals, setPossibleAnimals] = useState<any[]>([]);
  const [selectedAnimalEnar, setSelectedAnimalEnar] = useState<string>('');
  // 🆕 VV adatok state változói az ellés form számára
  const [vvResults, setVvResults] = useState<any[]>([]);
  const [loadingVV, setLoadingVV] = useState(true);
  const [selectedVVForBirth, setSelectedVVForBirth] = useState<any>(null);

  // 🆕 KÉSŐBB ELPUSZTULT ÁLLAPOT VÁLTOZÓK
  const [dyingCalf, setDyingCalf] = useState<any>(null);
  const [deathDate, setDeathDate] = useState('');
  const [deathReason, setDeathReason] = useState('');
  const [deathNotes, setDeathNotes] = useState('');

  // 🔥 EREDETI DATA LOADING LOGIKA
  const refreshBirthHistory = async () => {
    if (!animal?.enar) return;

    const { data } = await supabase
      .from('births')
      .select(`
        *,
        calves (*)
      `)
      .eq('mother_enar', animal?.enar)
      .order('birth_date', { ascending: false });

    if (data && data.length > 0) {
      // 🔥 MANUÁLIS CALVES HOZZÁADÁS - EREDETI LOGIKA!
      for (let i = 0; i < data.length; i++) {
        const { data: calvesForBirth } = await supabase
          .from('calves')
          .select('*, planned_enar')  // ← PLANNED_ENAR IS!
          .eq('birth_id', data[i].id);

        data[i].calves = calvesForBirth || [];
        console.log(`✅ Birth ${i}: ${calvesForBirth?.length || 0} borjú hozzáadva`);
      }
    }

    setBirthHistory(data || []);
  };

  const refreshData = async () => {
    if (!animal?.enar) return;
    setLoadingBirths(true);
    try {
      // VV eredmények párhuzamos betöltése
      const vvResult = await supabase
        .from('vv_results')
        .select('*')
        .eq('animal_enar', animal.enar)
        .eq('pregnancy_status', 'vemhes')
        .order('vv_date', { ascending: false });

      if (vvResult.error) throw vvResult.error;
      setVvResults(vvResult.data || []);
      if (vvResult.data && vvResult.data.length > 0) {
        setSelectedVVForBirth(vvResult.data[0]);
      }

      // Birth history betöltése komplex logikával
      await refreshBirthHistory();

    } catch (err) {
      console.error('❌ Hiba az ellési adatok betöltésekor:', err);
    } finally {
      setLoadingBirths(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, [animal.enar]);

  // 🔥 EREDETI FÜLSZÁM KERESÉSI LOGIKA - PASTE-2.TXT-BŐL
  useEffect(() => {
    const fetchPossibleAnimals = async () => {
      if (!assigningEarTag || !animal?.enar) {
        console.log('🚫 Nincs assigningEarTag vagy animal.enar');
        return;
      }

      console.log('🔍 FEJLETT ÁLLAT KERESÉS DEBUG:');
      console.log('🐄 Anya ENAR:', animal.enar);
      console.log('🐮 Borjú temp_id:', assigningEarTag.temp_id);
      console.log('📚 Történeti ellés?', selectedBirth?.historical);

      if (!selectedBirth?.historical) {
        console.log('🆕 Új ellés - nincs keresés szükséges');
        setPossibleAnimals([]);
        return;
      }

      try {
        const motherEnar = animal.enar;
        const cleanEnar = motherEnar.replace(/\s/g, ''); // Szóközök nélkül

        // 🎯 KÖZVETLEN KERESÉS minden formátummal
        const searchFormats = [motherEnar, cleanEnar];

        for (const format of searchFormats) {
          console.log(`🔍 Próbálkozás formátummal: "${format}"`);

          // Először birth_id = null szűréssel
          let { data: directResult, error: directError } = await supabase
            .from('animals')
            .select('enar, name, kategoria, anya_enar, birth_id, statusz, szuletesi_datum')
            .eq('anya_enar', format)
            .eq('statusz', 'aktív')
            .is('birth_id', null);

          console.log(`✅ "${format}" eredmény (birth_id=null):`, directResult);

          if (directResult && directResult.length > 0) {
            console.log(`🎉 TALÁLAT "${format}" formátummal!`, directResult);
            setPossibleAnimals(directResult);
            return;
          }

          // Ha nincs találat birth_id=null szűréssel, próbáljuk anélkül
          const { data: allResult } = await supabase
            .from('animals')
            .select('enar, name, kategoria, anya_enar, birth_id, statusz, szuletesi_datum')
            .eq('anya_enar', format)
            .eq('statusz', 'aktív');

          // 🎯 TÖRTÉNETI ELLÉSHEZ: birth_id szűrés ELTÁVOLÍTÁSA
          if (allResult && allResult.length > 0) {
            if (selectedBirth?.historical) {
              console.log(`🎉 TÖRTÉNETI ELLÉS - ÖSSZES TALÁLAT "${format}" formátummal!`, allResult);
              setPossibleAnimals(allResult);
              return;
            }
          }
        }

        console.log('❌ NINCS TALÁLAT - üres lista beállítása');
        setPossibleAnimals([]);

      } catch (err) {
        console.error('❌ Fejlett keresési hiba:', err);
        setPossibleAnimals([]);
      }
    };

    fetchPossibleAnimals();
  }, [assigningEarTag, selectedBirth?.historical, animal?.enar]);

  const handleEditBirth = (birth: any) => {
    setEditingBirth(birth);
    setShowBirthForm(true);
  };

  const handleDeleteBirth = (birth: any) => {
    setDeletingBirth(birth);
  };

  const confirmDeleteBirth = async () => {
    if (!deletingBirth) return;
    try {
      await supabase.from('calves').delete().eq('birth_id', deletingBirth.id);
      await supabase.from('births').delete().eq('id', deletingBirth.id);
      setDeletingBirth(null);
      refreshData();
      alert('✅ Ellés sikeresen törölve!');
    } catch (error: any) {
      console.error('Törlési hiba:', error);
      alert('❌ Hiba történt a törlés során!');
    }
  };

  // 🆕 KÉSŐBB ELPUSZTULT KEZELÉS
  const handleCalfDeath = (calf: any) => {
    setDyingCalf(calf);
    setDeathDate(new Date().toISOString().split('T')[0]);
    setDeathReason('');
    setDeathNotes('');
  };

  const confirmCalfDeath = async () => {
    if (!dyingCalf || !deathDate || !deathReason) {
      alert('❌ Kérjük töltse ki a kötelező mezőket!');
      return;
    }

    try {
      // 1. JAVÍTOTT - Borjú elpusztulásának rögzítése (CSAK is_alive!)
      const { error: calfError } = await supabase
        .from('calves')
        .update({
          is_alive: false  // ← CSAK EZ! A többi mező nem létezik!
        })
        .eq('id', dyingCalf.id);

      if (calfError) {
        console.error('❌ Calves update hiba:', calfError);
        throw calfError;
      }

      // 2. Ellés frissítése a "később elpusztult" jelzéssel
      const { error: birthError } = await supabase
        .from('births')
        .update({
          calf_died_later: true,
          calf_death_date: deathDate,
          calf_death_reason: deathReason,
          calf_death_notes: deathNotes
        })
        .eq('id', dyingCalf.birth_id);

      if (birthError) {
        console.error('❌ Births update hiba:', birthError);
        throw birthError;
      }

      console.log('✅ Borjú státusz frissítve:', {
        calfId: dyingCalf.id,
        tempId: dyingCalf.temp_id,
        newStatus: 'is_alive = false',
        birthUpdated: 'calf_died_later = true'
      });

      alert('✅ Borjú státusza sikeresen frissítve!');
      setDyingCalf(null);
      refreshData();

    } catch (err) {
      console.error('❌ Hiba a státusz frissítésekor:', err);
      alert('❌ Hiba történt a státusz frissítése során!');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <span className="text-2xl mr-3">🐄</span>
          <h3 className="text-lg font-semibold text-gray-900">Ellési adatok</h3>
        </div>
        <div className="flex items-center gap-4">
          {vvResults.length > 0 && (
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">🔬 VV eredmény:</label>
              <select
                value={selectedVVForBirth?.id || ''}
                onChange={(e) => {
                  const selected = vvResults.find(vv => String(vv.id) === e.target.value);
                  setSelectedVVForBirth(selected || null);
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500"
              >
                <option value="">VV nélkül</option>
                {vvResults.map((vv) => (
                  <option key={vv.id} value={vv.id}>
                    {new Date(vv.vv_date).toLocaleDateString('hu-HU')} - {vv.father_name || vv.father_enar}
                  </option>
                ))}
              </select>
            </div>
          )}
          <button
            onClick={() => setShowBirthForm(true)}
            className="bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-3 rounded-lg transition-colors inline-flex items-center"
          >
            <span className="mr-2">➕</span>Új ellés rögzítése
          </button>
        </div>
      </div>

      {showBirthForm && (
        <BirthForm
          motherEnar={animal.enar}
          editMode={!!editingBirth}
          editData={editingBirth ? { birth: editingBirth, calves: editingBirth.calves || [] } : undefined}
          onSuccess={async () => {
            setShowBirthForm(false);
            setEditingBirth(null);

            // 🔄 SZINKRONIZÁLÁS: Ha ellés módosítás, frissítjük az állatok születési dátumát
            if (editingBirth?.id) {
              console.log('🔄 Ellés módosítva, animals tábla szinkronizálása...');
              const { error: syncError } = await supabase
                .from('animals')
                .update({ szuletesi_datum: editingBirth.birth_date })
                .eq('birth_id', editingBirth.id);

              if (syncError) {
                console.error('⚠️ Animals szinkronizálási figyelmeztetés:', syncError);
              } else {
                console.log('✅ Animals tábla szinkronizálva');
              }
            }

            refreshData();
            alert(editingBirth ? '✅ Ellés sikeresen frissítve és szinkronizálva!' : '✅ Ellés sikeresen rögzítve!');
          }}
          onCancel={() => {
            setShowBirthForm(false);
            setEditingBirth(null);
          }}
          prefillFromVV={selectedVVForBirth ? {
            expectedBirthDate: selectedVVForBirth.expected_birth_date,
            fatherData: {
              type: 'natural',
              enar: selectedVVForBirth.father_enar,
              kplsz: selectedVVForBirth.father_kplsz,
              name: selectedVVForBirth.father_name,
              possibleFathers: selectedVVForBirth.possible_fathers || []
            }
          } : undefined}
        />
      )}

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center mb-4">
          <span className="text-2xl mr-3">📊</span>
          <h4 className="text-lg font-semibold text-gray-900">Ellési Történet</h4>
        </div>

        {loadingBirths ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Ellési adatok betöltése...</p>
          </div>
        ) : birthHistory.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">🐄</div>
            <p>Még nincs rögzített ellés</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">📅 Ellés Dátuma</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">🏥 Típus</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">✅ Eredmény</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">🐄 Borjak</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">👨‍⚕️ Jelenlévő személy</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">⚙️ Műveletek</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {birthHistory.map((birth, index) => (
                  <tr key={birth.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(birth.birth_date).toLocaleDateString('hu-HU')}
                      {birth.historical && (
                        <span className="ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          📚 Történeti
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${birth.birth_type === 'easy_no_help' ? 'bg-green-100 text-green-800' :
                        birth.birth_type === 'easy_with_help' ? 'bg-yellow-100 text-yellow-800' :
                          birth.birth_type === 'difficult_help' ? 'bg-orange-100 text-orange-800' :
                            'bg-red-100 text-red-800'
                        }`}>
                        {birth.birth_type === 'easy_no_help' ? '🟢 Könnyű' :
                          birth.birth_type === 'easy_with_help' ? '🟡 Könnyű, segítséggel' :
                            birth.birth_type === 'difficult_help' ? '🟠 Nehéz, segítséggel' :
                              '🔴 Nehéz, állatorvosi'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${birth.birth_outcome === 'successful' ? 'bg-green-100 text-green-800' :
                        birth.birth_outcome === 'stillborn' ? 'bg-red-100 text-red-800' :
                          'bg-orange-100 text-orange-800'
                        }`}>
                        {birth.birth_outcome === 'successful' ? '✅ Sikeres' :
                          birth.birth_outcome === 'stillborn' ? '💀 Halva születés' :
                            '⚠️ Vetélés'}
                      </span>

                      {/* 🆕 KÉSŐBB ELPUSZTULT JELÖLÉS TÁBLÁZATBAN */}
                      {birth.calf_died_later && (
                        <div className="mt-1">
                          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 border-red-200">
                            💀 Borjú később elpusztult
                          </span>
                          <div className="text-xs text-red-600 mt-1">
                            📅 {birth.calf_death_date} - {birth.calf_death_reason}
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {birth.calves?.length || 0} db
                      {birth.calves?.map((calf: any, i: number) => (
                        <div key={i} className="text-xs text-gray-500">
                          {calf.gender === 'male' ? '🐂' : '🐄'} {calf.temp_id}
                          {calf.is_alive ? ' 💚' : ' 💀'}
                          {calf.enar && <span className="text-blue-600"> 🏷️</span>}
                        </div>
                      ))}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {birth.attendant_person || '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedBirth(birth)}
                          className="text-blue-600 hover:text-blue-800 font-medium text-xs px-2 py-1 rounded transition-colors"
                          title="Részletek megtekintése"
                        >
                          👁️ Részletek
                        </button>
                        <button
                          onClick={() => handleEditBirth(birth)}
                          className="text-green-600 hover:text-green-800 font-medium text-xs px-2 py-1 rounded transition-colors"
                          title="Ellés szerkesztése"
                        >
                          ✏️ Szerkesztés
                        </button>
                        <button
                          onClick={() => handleDeleteBirth(birth)}
                          className="text-red-600 hover:text-red-800 font-medium text-xs px-2 py-1 rounded transition-colors"
                          title="Ellés törlése"
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

      {/* ELLÉSI RÉSZLETEI MODAL */}
      {selectedBirth && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-sm border max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">🐄</span>
                  <h3 className="text-xl font-bold text-gray-900">Ellés Részletei</h3>
                </div>
                <button
                  onClick={() => setSelectedBirth(null)}
                  className="text-gray-400 hover:text-gray-600 p-2 transition-colors"
                >
                  ❌
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <span className="mr-2">📅</span>Alapadatok
                  </h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Ellés dátuma:</strong> {new Date(selectedBirth.birth_date).toLocaleDateString('hu-HU')}</p>
                    {selectedBirth.birth_time && (
                      <p><strong>Ellés időpontja:</strong> {selectedBirth.birth_time}</p>
                    )}
                    <p><strong>Ellés típusa:</strong> {
                      selectedBirth.birth_type === 'easy_no_help' ? '🟢 Könnyű, segítség nélkül' :
                        selectedBirth.birth_type === 'easy_with_help' ? '🟡 Könnyű, segítséggel' :
                          selectedBirth.birth_type === 'difficult_help' ? '🟠 Nehéz, segítséggel' :
                            '🔴 Nehéz, állatorvosi beavatkozással'
                    }</p>

                    {/* EREDMÉNY + KÉSŐBB ELPUSZTULT */}
                    <div>
                      <strong>Eredmény:</strong>
                      <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${selectedBirth.birth_outcome === 'successful' ? 'bg-green-100 text-green-800' :
                        selectedBirth.birth_outcome === 'stillborn' ? 'bg-red-100 text-red-800' :
                          'bg-orange-100 text-orange-800'
                        }`}>
                        {selectedBirth.birth_outcome === 'successful' ? '✅ Sikeres' :
                          selectedBirth.birth_outcome === 'stillborn' ? '💀 Halva születés' :
                            '⚠️ Vetélés'}
                      </span>

                      {/* 🆕 KÉSŐBB ELPUSZTULT JELÖLÉS MODAL-BAN */}
                      {selectedBirth.calf_died_later && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <div className="text-red-600 text-sm font-medium">
                            💀 Borjú később elpusztult
                          </div>
                          <div className="text-red-700 text-xs mt-1">
                            📅 Dátum: {selectedBirth.calf_death_date}
                          </div>
                          <div className="text-red-600 text-xs">
                            ⚠️ Ok: {selectedBirth.calf_death_reason}
                          </div>
                          {selectedBirth.calf_death_notes && (
                            <div className="text-gray-600 text-xs mt-1 italic">
                              💬 "{selectedBirth.calf_death_notes}"
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <p><strong>Anya túlélte:</strong> {selectedBirth.mother_survived ? '✅ Igen' : '❌ Nem'}</p>
                    {selectedBirth.historical && (
                      <p className="text-blue-600"><strong>📚 Történeti ellés</strong></p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <span className="mr-2">🐄</span>Borjú adatok
                  </h4>
                  <div className="space-y-3 text-sm">
                    {selectedBirth.calves?.map((calf: any, index: number) => (
                      <div key={index} className="p-3 border rounded-lg bg-gray-50">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-gray-900">
                            {calf.gender === 'male' ? '🐂' : '🐄'} {calf.temp_id}
                          </span>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${calf.is_alive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                            {calf.is_alive ? '💚 Él' : '💀 Nem él'}
                          </span>
                        </div>
                        <p><strong>Ivar:</strong> {calf.gender === 'male' ? 'Bika' : 'Üsző'}</p>
                        {calf.birth_weight && (
                          <p><strong>Születési súly:</strong> {calf.birth_weight} kg</p>
                        )}

                        {/* 🔥 ENAR VERZIÓBÓL: PLANNED ENAR + FÜLSZÁM LOGIKA */}
                        {calf.enar ? (
                          <div>
                            <p><strong>ENAR:</strong> {calf.enar}</p>
                            <p className="text-xs text-gray-500">
                              Fülszám felhelyezve: {calf.ear_tag_date ?
                                new Date(calf.ear_tag_date).toLocaleDateString('hu-HU') :
                                'Ismeretlen'}
                            </p>
                          </div>
                        ) : (
                          <div>
                            {/* 🆕 PLANNED ENAR MEGJELENÍTÉS */}
                            {calf.planned_enar ? (
                              <div>
                                <p className="text-blue-600 mb-2"><strong>Tervezett ENAR:</strong> 📝 {calf.planned_enar}</p>
                                <p className="text-orange-600 mb-2"><strong>Státusz:</strong> ⏳ Fülszám behelyezésre vár</p>
                              </div>
                            ) : (
                              <p className="text-orange-600 mb-2"><strong>ENAR:</strong> ⏳ Függőben</p>
                            )}

                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setAssigningEarTag(calf);
                                  setSelectedBirth(selectedBirth);
                                }}
                                className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-3 py-1 rounded"
                              >
                                🏷️ Fülszám hozzárendelése
                              </button>

                              {/* 🆕 PLANNED ENAR GOMB - ENAR VERZIÓBÓL! */}
                              <button
                                onClick={async () => {
                                  const plannedEnar = prompt('Add meg a tervezett ENAR számot:', calf.planned_enar || 'HU ');
                                  if (plannedEnar) {
                                    try {
                                      const { error } = await supabase
                                        .from('calves')
                                        .update({ planned_enar: plannedEnar })
                                        .eq('temp_id', calf.temp_id);

                                      if (error) {
                                        console.error('❌ Planned ENAR mentési hiba:', error);
                                        alert('❌ Hiba történt a tervezett ENAR mentésekor!');
                                      } else {
                                        console.log('✅ Planned ENAR mentve:', plannedEnar, 'for calf:', calf.temp_id);
                                        alert('✅ Tervezett ENAR sikeresen mentve!');
                                        refreshData(); // UI frissítése
                                      }
                                    } catch (err) {
                                      console.error('❌ Planned ENAR save error:', err);
                                      alert('❌ Váratlan hiba történt!');
                                    }
                                  }
                                }}
                                className="bg-yellow-500 hover:bg-yellow-600 text-white text-xs px-3 py-1 rounded"
                              >
                                📝 ENAR tervezése
                              </button>
                            </div>
                          </div>
                        )}

                        {/* 🆕 STÁTUSZ FRISSÍTÉS GOMB */}
                        {calf.is_alive && (
                          <div className="mt-3 pt-2 border-t">
                            <button
                              onClick={() => handleCalfDeath(calf)}
                              className="bg-orange-500 hover:bg-orange-600 text-white text-xs px-3 py-1 rounded"
                            >
                              🔄 Státusz frissítés
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedBirth(null)}
                  className="bg-gray-600 hover:bg-gray-700 text-white font-medium px-6 py-3 rounded-lg"
                >
                  ✅ Bezárás
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FÜLSZÁM HOZZÁRENDELÉS MODAL - EREDETI VERZIÓ */}
      {assigningEarTag && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-sm border max-w-lg w-full mx-4">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">🏷️</span>
                  <h3 className="text-xl font-bold text-gray-900">
                    {selectedBirth?.historical ? 'Állat összekapcsolása' : 'Fülszám hozzárendelése'}
                  </h3>
                </div>
                <button
                  onClick={() => setAssigningEarTag(null)}
                  className="text-gray-400 hover:text-gray-600 p-2 transition-colors"
                >
                  ❌
                </button>
              </div>

              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Borjú:</strong> {assigningEarTag.gender === 'male' ? '🐂' : '🐄'} {assigningEarTag.temp_id}
                </p>
                <p className="text-sm text-blue-600">
                  <strong>Anya:</strong> {animal.enar}
                </p>
              </div>

              <div className="mb-4">
                <div className="bg-gray-50 p-3 rounded-lg mb-3 max-h-60 overflow-y-auto">
                  <p className="text-sm text-gray-600 mb-2">
                    💡 Javasolt állatok ({possibleAnimals.length} találat):
                  </p>

                  <div className="space-y-2">
                    {possibleAnimals.length > 0 ? (
                      possibleAnimals.map((possibleAnimal: any, index: number) => (
                        <div key={possibleAnimal.enar} className="flex items-center p-2 bg-white border border-gray-200 rounded hover:bg-green-50">
                          <input
                            type="radio"
                            name="selectedAnimal"
                            value={possibleAnimal.enar}
                            className="mr-3 text-green-600"
                            id={`animal-${index}`}
                          />
                          <label htmlFor={`animal-${index}`} className="flex-1 cursor-pointer">
                            <div className="font-medium text-green-800">
                              🎯 {possibleAnimal.enar}
                              {index === 0 && (
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded ml-2">
                                  Ajánlott
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-600 mt-1">
                              {possibleAnimal.name && (
                                <div>📝 Név: {possibleAnimal.name}</div>
                              )}
                              <div>🏷️ Kategória: {possibleAnimal.kategoria}</div>
                            </div>
                          </label>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-gray-500 text-sm">
                        <div className="text-2xl mb-2">🔍</div>
                        <p className="font-medium">Állatok keresése...</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 🔥 ENAR VERZIÓBÓL: MANUAL ENAR INPUT */}
                <div className="border-t pt-3 mt-3">
                  <p className="text-sm text-gray-600 mb-2">
                    🔧 Vagy add meg manuálisan az ENAR-t:
                  </p>
                  <input
                    type="text"
                    placeholder="HU 36050 0011 8"
                    className="w-full p-2 border border-gray-300 rounded text-sm"
                    onBlur={(e) => {
                      if (e.target.value.trim()) {
                        supabase
                          .from('animals')
                          .select('enar, name, kategoria')
                          .eq('enar', e.target.value.trim())
                          .eq('statusz', 'aktív')
                          .single()
                          .then(({ data, error }) => {
                            if (data) {
                              setPossibleAnimals(prev => [data, ...prev.filter(a => a.enar !== data.enar)]);
                              console.log('✅ Manual ENAR hozzáadva:', data);
                            } else {
                              console.log('❌ ENAR nem található:', e.target.value);
                              alert('❌ Ez az ENAR nem található az aktív állatok között');
                            }
                          });
                      }
                    }}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setAssigningEarTag(null)}
                  className="bg-white hover:bg-gray-50 text-gray-700 font-medium px-6 py-3 rounded-lg border border-gray-300 transition-colors"
                >
                  Mégse
                </button>
                <button
                  onClick={async () => {
                    const selectedAnimalEnar = (document.querySelector('input[name="selectedAnimal"]:checked') as HTMLInputElement)?.value;

                    if (!selectedAnimalEnar) {
                      alert('⚠️ Kérlek válassz ki egy állatot!');
                      return;
                    }

                    try {
                      // 1. Borjú frissítése
                      const { error: calfError } = await supabase
                        .from('calves')
                        .update({
                          enar: selectedAnimalEnar,
                          ear_tag_date: new Date().toISOString().split('T')[0]
                        })
                        .eq('temp_id', assigningEarTag.temp_id);

                      if (calfError) throw calfError;

                      // 2. Állat frissítése
                      const { error: animalError } = await supabase
                        .from('animals')
                        .update({
                          birth_id: selectedBirth.id,
                          temp_id: assigningEarTag.temp_id
                        })
                        .eq('enar', selectedAnimalEnar);

                      if (animalError) throw animalError;

                      // 3. HIÁNYZÓ RÉSZ: Anya has_given_birth = true beállítása
                      const motherEnar = selectedBirth?.mother_enar;
                      if (motherEnar) {
                        const { error: motherError } = await supabase
                          .from('animals')
                          .update({ has_given_birth: true })
                          .eq('enar', motherEnar);

                        if (motherError) {
                          console.error('⚠️ Anya has_given_birth update hiba:', motherError);
                          // Folytatjuk, mert a fő művelet sikerült
                        } else {
                          console.log('✅ Anya has_given_birth = true beállítva:', motherEnar);
                        }
                      }

                      // 4. Siker!
                      alert(`✅ Sikeresen összekapcsoltad!\n${assigningEarTag.temp_id} → ${selectedAnimalEnar}`);
                      setAssigningEarTag(null);
                      refreshData();

                    } catch (error) {
                      console.error('Összekapcsolási hiba:', error);
                      alert('❌ Hiba történt az összekapcsolás során!');
                    }
                  }}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-medium px-6 py-3 rounded-lg transition-colors"
                >
                  🏷️ {selectedBirth?.historical ? 'Összekapcsolás' : 'Hozzárendelés'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🆕 STÁTUSZ FRISSÍTÉS MODAL */}
      {dyingCalf && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-sm border max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <span className="text-2xl mr-3">🔄</span>
                <h3 className="text-lg font-semibold text-gray-900">Borjú Státusz Frissítése</h3>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Borjú:</strong> {dyingCalf.temp_id} ({dyingCalf.gender === 'male' ? 'Bika' : 'Üsző'})
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Elpusztulás dátuma *</label>
                  <input
                    type="date"
                    value={deathDate}
                    onChange={(e) => setDeathDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Elpusztulás oka *</label>
                  <select
                    value={deathReason}
                    onChange={(e) => setDeathReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    required
                  >
                    <option value="">Válassz okot</option>
                    <option value="Betegség">Betegség</option>
                    <option value="Baleset">Baleset</option>
                    <option value="Szövődmény">Ellési szövődmény</option>
                    <option value="Veleszületett rendellenesség">Veleszületett rendellenesség</option>
                    <option value="Ismeretlen">Ismeretlen ok</option>
                    <option value="Egyéb">Egyéb</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Megjegyzések</label>
                  <textarea
                    value={deathNotes}
                    onChange={(e) => setDeathNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    rows={3}
                    placeholder="További részletek..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setDyingCalf(null)}
                  className="bg-gray-600 hover:bg-gray-700 text-white font-medium px-4 py-2 rounded-lg"
                >
                  Mégse
                </button>
                <button
                  onClick={confirmCalfDeath}
                  className="bg-orange-600 hover:bg-orange-700 text-white font-medium px-4 py-2 rounded-lg"
                >
                  🔄 Státusz frissítése
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TÖRLÉS MODAL */}
      {deletingBirth && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-sm border max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-red-600 text-xl">⚠️</span>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">Ellés Törlése</h3>
                  <p className="text-sm text-gray-600">Ez a művelet nem visszafordítható!</p>
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg mb-4">
                <p className="text-sm"><strong>Ellés dátuma:</strong> {new Date(deletingBirth.birth_date).toLocaleDateString('hu-HU')}</p>
                <p className="text-sm"><strong>Eredmény:</strong> {deletingBirth.birth_outcome}</p>
                <p className="text-sm"><strong>Borjak:</strong> {deletingBirth.calves?.length || 0} db</p>
              </div>
              <p className="text-gray-700 mb-6">
                Biztosan törölni szeretnéd ezt az ellési rekordot és az összes kapcsolódó borjú adatot?
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeletingBirth(null)}
                  className="bg-white hover:bg-gray-50 text-gray-700 font-medium px-6 py-3 rounded-lg border"
                >
                  Mégse
                </button>
                <button
                  onClick={confirmDeleteBirth}
                  className="bg-red-500 hover:bg-red-600 text-white font-medium px-6 py-3 rounded-lg"
                >
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