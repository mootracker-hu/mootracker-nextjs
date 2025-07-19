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
  const [vvResults, setVvResults] = useState<any[]>([]);
  const [loadingVV, setLoadingVV] = useState(true);
  const [selectedVVForBirth, setSelectedVVForBirth] = useState<any>(null);

  const refreshData = async () => {
    if (!animal?.enar) return;
    setLoadingBirths(true);
    try {
      // Párhuzamos adatlekérdezés a gyorsabb betöltésért
      const [birthsResult, vvResult] = await Promise.all([
        supabase.from('births').select('*, calves(*)').eq('mother_enar', animal.enar).order('birth_date', { ascending: false }),
        supabase.from('vv_results').select('*').eq('animal_enar', animal.enar).eq('pregnancy_status', 'vemhes').order('vv_date', { ascending: false })
      ]);

      if (birthsResult.error) throw birthsResult.error;
      setBirthHistory(birthsResult.data || []);

      if (vvResult.error) throw vvResult.error;
      setVvResults(vvResult.data || []);
      if (vvResult.data && vvResult.data.length > 0) {
        setSelectedVVForBirth(vvResult.data[0]);
      }
    } catch (err) {
      console.error('❌ Hiba az ellési adatok betöltésekor:', err);
    } finally {
      setLoadingBirths(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, [animal.enar]);

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
              <select value={selectedVVForBirth?.id || ''} onChange={(e) => { const selected = vvResults.find(vv => String(vv.id) === e.target.value); setSelectedVVForBirth(selected || null); }} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500">
                <option value="">VV nélkül</option>
                {vvResults.map((vv) => ( <option key={vv.id} value={vv.id}>{new Date(vv.vv_date).toLocaleDateString('hu-HU')} - {vv.father_name || vv.father_enar}</option> ))}
              </select>
            </div>
          )}
          <button onClick={() => setShowBirthForm(true)} className="bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-3 rounded-lg transition-colors inline-flex items-center">
            <span className="mr-2">➕</span>Új ellés rögzítése
          </button>
        </div>
      </div>

      {showBirthForm && (
        <BirthForm
          motherEnar={animal.enar}
          editMode={!!editingBirth}
          editData={editingBirth ? { birth: editingBirth, calves: editingBirth.calves || [] } : undefined}
          onSuccess={() => { setShowBirthForm(false); setEditingBirth(null); refreshData(); alert(editingBirth ? '✅ Ellés sikeresen frissítve!' : '✅ Ellés sikeresen rögzítve!'); }}
          onCancel={() => { setShowBirthForm(false); setEditingBirth(null); }}
          prefillFromVV={selectedVVForBirth ? { expectedBirthDate: selectedVVForBirth.expected_birth_date, fatherData: { type: 'natural', enar: selectedVVForBirth.father_enar, kplsz: selectedVVForBirth.father_kplsz, name: selectedVVForBirth.father_name, possibleFathers: selectedVVForBirth.possible_fathers || [] } } : undefined}
        />
      )}

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center mb-4">
          <span className="text-2xl mr-3">📊</span>
          <h4 className="text-lg font-semibold text-gray-900">Ellési Történet</h4>
        </div>

        {loadingBirths ? (
          <div className="text-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div><p className="text-gray-600">Ellési adatok betöltése...</p></div>
        ) : birthHistory.length === 0 ? (
          <div className="text-center py-8 text-gray-500"><div className="text-4xl mb-2">🐄</div><p>Még nincs rögzített ellés</p></div>
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
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(birth.birth_date).toLocaleDateString('hu-HU')}{birth.historical && (<span className="ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">📚 Történeti</span>)}</td>
                    <td className="px-4 py-4 whitespace-nowrap"><span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${birth.birth_type === 'easy_no_help' ? 'bg-green-100 text-green-800' : birth.birth_type === 'easy_with_help' ? 'bg-yellow-100 text-yellow-800' : birth.birth_type === 'difficult_help' ? 'bg-orange-100 text-orange-800' : 'bg-red-100 text-red-800'}`}>{birth.birth_type === 'easy_no_help' ? '🟢 Könnyű' : birth.birth_type === 'easy_with_help' ? '🟡 Könnyű, segítséggel' : birth.birth_type === 'difficult_help' ? '🟠 Nehéz, segítséggel' : '🔴 Nehéz, állatorvosi'}</span></td>
                    <td className="px-4 py-4 whitespace-nowrap"><span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${birth.birth_outcome === 'successful' ? 'bg-green-100 text-green-800' : birth.birth_outcome === 'stillborn' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'}`}>{birth.birth_outcome === 'successful' ? '✅ Sikeres' : birth.birth_outcome === 'stillborn' ? '💀 Halva születés' : '⚠️ Vetélés'}</span></td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{birth.calves?.length || 0} db{birth.calves?.map((calf: any, i: number) => (<div key={i} className="text-xs text-gray-500">{calf.gender === 'male' ? '🐂' : '🐄'} {calf.temp_id}{calf.is_alive ? ' 💚' : ' 💀'}{calf.enar && <span className="text-blue-600"> 🏷️</span>}</div>))}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{birth.attendant_person || '-'}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900"><div className="flex gap-2"><button onClick={() => setSelectedBirth(birth)} className="text-blue-600 hover:text-blue-800 font-medium text-xs px-2 py-1 rounded transition-colors" title="Részletek megtekintése">👁️ Részletek</button><button onClick={() => handleEditBirth(birth)} className="text-green-600 hover:text-green-800 font-medium text-xs px-2 py-1 rounded transition-colors" title="Ellés szerkesztése">✏️ Szerkesztés</button><button onClick={() => handleDeleteBirth(birth)} className="text-red-600 hover:text-red-800 font-medium text-xs px-2 py-1 rounded transition-colors" title="Ellés törlése">🗑️ Törlés</button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedBirth && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><div className="bg-white rounded-lg shadow-sm border max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"><div className="p-6"><div className="flex justify-between items-center mb-6"><div className="flex items-center"><span className="text-2xl mr-3">🐄</span><h3 className="text-xl font-bold text-gray-900">Ellés Részletei</h3></div><button onClick={() => setSelectedBirth(null)} className="text-gray-400 hover:text-gray-600 p-2 transition-colors">❌</button></div><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div><h4 className="font-semibold text-gray-900 mb-3 flex items-center"><span className="mr-2">📅</span>Alapadatok</h4><div className="space-y-2 text-sm"><p><strong>Ellés dátuma:</strong> {new Date(selectedBirth.birth_date).toLocaleDateString('hu-HU')}</p>{selectedBirth.birth_time && (<p><strong>Ellés időpontja:</strong> {selectedBirth.birth_time}</p>)}<p><strong>Ellés típusa:</strong> {selectedBirth.birth_type === 'easy_no_help' ? '🟢 Könnyű, segítség nélkül' : selectedBirth.birth_type === 'easy_with_help' ? '🟡 Könnyű, segítséggel' : selectedBirth.birth_type === 'difficult_help' ? '🟠 Nehéz, segítséggel' : '🔴 Nehéz, állatorvosi beavatkozással'}</p><p><strong>Eredmény:</strong><span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${selectedBirth.birth_outcome === 'successful' ? 'bg-green-100 text-green-800' : selectedBirth.birth_outcome === 'stillborn' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'}`}>{selectedBirth.birth_outcome === 'successful' ? '✅ Sikeres' : selectedBirth.birth_outcome === 'stillborn' ? '💀 Halva születés' : '⚠️ Vetélés'}</span></p><p><strong>Anya túlélte:</strong> {selectedBirth.mother_survived ? '✅ Igen' : '❌ Nem'}</p>{selectedBirth.historical && (<p className="text-blue-600"><strong>📚 Történeti ellés</strong></p>)}</div></div><div><h4 className="font-semibold text-gray-900 mb-3 flex items-center"><span className="mr-2">🐄</span>Borjú adatok</h4><div className="space-y-3 text-sm">{selectedBirth.calves?.map((calf: any, index: number) => (<div key={index} className="p-3 border rounded-lg bg-gray-50"><div className="flex justify-between items-center mb-2"><span className="font-medium text-gray-900">{calf.gender === 'male' ? '🐂' : '🐄'} {calf.temp_id}</span><span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${calf.is_alive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{calf.is_alive ? '💚 Él' : '💀 Nem él'}</span></div><p><strong>Ivar:</strong> {calf.gender === 'male' ? 'Bika' : 'Üsző'}</p>{calf.birth_weight && (<p><strong>Születési súly:</strong> {calf.birth_weight} kg</p>)}{calf.enar ? (<div><p><strong>ENAR:</strong> {calf.enar}</p><p className="text-xs text-gray-500">Fülszám felhelyezve: {calf.ear_tag_date ? new Date(calf.ear_tag_date).toLocaleDateString('hu-HU') : 'Ismeretlen'}</p></div>) : (<div><p className="text-orange-600 mb-2"><strong>ENAR:</strong> ⏳ Függőben</p><button onClick={() => { setAssigningEarTag(calf); setSelectedBirth(selectedBirth); }} className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-3 py-1 rounded">🏷️ Fülszám hozzárendelése</button></div>)}</div>))}</div></div></div><div className="mt-6 flex justify-end"><button onClick={() => setSelectedBirth(null)} className="bg-gray-600 hover:bg-gray-700 text-white font-medium px-6 py-3 rounded-lg">✅ Bezárás</button></div></div></div></div>
      )}
      
      {deletingBirth && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><div className="bg-white rounded-lg shadow-sm border max-w-md w-full mx-4"><div className="p-6"><div className="flex items-center mb-4"><div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center"><span className="text-red-600 text-xl">⚠️</span></div><div className="ml-4"><h3 className="text-lg font-semibold text-gray-900">Ellés Törlése</h3><p className="text-sm text-gray-600">Ez a művelet nem visszafordítható!</p></div></div><div className="bg-gray-50 p-3 rounded-lg mb-4"><p className="text-sm"><strong>Ellés dátuma:</strong> {new Date(deletingBirth.birth_date).toLocaleDateString('hu-HU')}</p><p className="text-sm"><strong>Eredmény:</strong> {deletingBirth.birth_outcome}</p><p className="text-sm"><strong>Borjak:</strong> {deletingBirth.calves?.length || 0} db</p></div><p className="text-gray-700 mb-6">Biztosan törölni szeretnéd ezt az ellési rekordot és az összes kapcsolódó borjú adatot?</p><div className="flex justify-end gap-3"><button onClick={() => setDeletingBirth(null)} className="bg-white hover:bg-gray-50 text-gray-700 font-medium px-6 py-3 rounded-lg border">Mégse</button><button onClick={confirmDeleteBirth} className="bg-red-500 hover:bg-red-600 text-white font-medium px-6 py-3 rounded-lg">Törlés</button></div></div></div></div>
      )}
    </div>
  );
}