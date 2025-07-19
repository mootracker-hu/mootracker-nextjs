'use client';

import React from 'react';
import { supabase } from '@/lib/supabase';
import VVForm from '@/components/vv-form';
import type { Father } from '@/types/animal-types';

export default function SzaporitasTab({ animal }: { animal: any }) {
  const [showVVForm, setShowVVForm] = React.useState(false);
  const [vvResults, setVvResults] = React.useState<any[]>([]);
  const [loadingVV, setLoadingVV] = React.useState(true);
  const [selectedVV, setSelectedVV] = React.useState<any>(null);
  const [editingVV, setEditingVV] = React.useState<any>(null);
  const [deletingVV, setDeletingVV] = React.useState<any>(null);

  const refreshVVResults = async () => {
    if (!animal?.enar) return;
    try {
        setLoadingVV(true);
        const { data, error } = await supabase
            .from('vv_results')
            .select('*')
            .eq('animal_enar', animal.enar)
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
  
  React.useEffect(() => {
    if (animal?.enar) {
      refreshVVResults();
    }
  }, [animal?.enar]);

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
      const { error } = await supabase.from('vv_results').delete().eq('id', deletingVV.id);
      if (error) throw error;
      setDeletingVV(null);
      refreshVVResults(); // Frissítés a törlés után
      alert('VV eredmény sikeresen törölve!');
    } catch (error) {
      console.error('Törlési hiba:', error);
      alert('Hiba történt a törlés során!');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center"><span className="text-2xl mr-3">🔬</span><h3 className="text-lg font-semibold text-gray-900">Szaporítási adatok</h3></div>
        <button onClick={() => setShowVVForm(true)} className="bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-3 rounded-lg transition-colors inline-flex items-center"><span className="mr-2">➕</span>Új VV eredmény</button>
      </div>

      {showVVForm && (
        <VVForm
          animalEnar={String(animal?.enar || 'ISMERETLEN')}
          onSubmit={() => { setShowVVForm(false); setEditingVV(null); refreshVVResults(); }}
          onCancel={() => { setShowVVForm(false); setEditingVV(null); }}
          editMode={!!editingVV}
          editData={editingVV}
        />
      )}

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center mb-4"><span className="text-2xl mr-3">📊</span><h4 className="text-lg font-semibold text-gray-900">VV Történet</h4></div>
        {loadingVV ? <div className="text-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div><p>VV eredmények betöltése...</p></div> : 
        vvResults.length === 0 ? <div className="text-center py-8 text-gray-500"><div className="text-4xl mb-2">🔬</div><p>Még nincs rögzített VV eredmény</p></div> : 
        (<div className="overflow-x-auto"><table className="min-w-full divide-y divide-gray-200"><thead className="bg-gray-50"><tr><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">📅 VV Dátuma</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">✅ Eredmény</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">⏱️ Napok</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">🐂 Tenyészbika</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">🐄 Ellés</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">👨‍⚕️ Állatorvos</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">⚙️ Műveletek</th></tr></thead><tbody className="bg-white divide-y divide-gray-200">
        {vvResults.map((result, index) => (<tr key={result.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}><td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(result.vv_date).toLocaleDateString('hu-HU')}</td><td className="px-4 py-4 whitespace-nowrap"><span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${result.pregnancy_status === 'vemhes' ? 'bg-green-100 text-green-800' : result.pregnancy_status === 'ures' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>{result.pregnancy_status === 'vemhes' ? '🐄💖 Vemhes' : result.pregnancy_status === 'ures' ? '❌ Üres' : '🌱 Csíra'}</span></td><td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{result.vv_result_days} nap</td><td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{result.father_name ? (result.uncertain_paternity && result.possible_fathers && result.possible_fathers.length > 1 ? `${result.father_name} + ${result.possible_fathers.length - 1} további` : result.father_name) : result.father_enar || '-'}</td><td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{result.expected_birth_date ? new Date(result.expected_birth_date).toLocaleDateString('hu-HU') : '-'}</td><td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{result.veterinarian || '-'}</td><td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900"><div className="flex gap-2"><button onClick={() => setSelectedVV(result)} className="text-blue-600 hover:text-blue-800 font-medium text-xs px-2 py-1 rounded transition-colors" title="Részletek megtekintése">👁️ Részletek</button><button onClick={() => handleEditVV(result)} className="text-green-600 hover:text-green-800 font-medium text-xs px-2 py-1 rounded transition-colors" title="VV eredmény szerkesztése">✏️ Szerkesztés</button><button onClick={() => handleDeleteVV(result)} className="text-red-600 hover:text-red-800 font-medium text-xs px-2 py-1 rounded transition-colors" title="VV eredmény törlése">🗑️ Törlés</button></div></td></tr>))}
        </tbody></table></div>)}
      </div>

      {selectedVV && (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><div className="bg-white rounded-lg shadow-sm border max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"><div className="p-6"><div className="flex justify-between items-center mb-6"><div className="flex items-center"><span className="text-2xl mr-3">🔬</span><h3 className="text-xl font-bold text-gray-900">VV Eredmény Részletei</h3></div><button onClick={() => setSelectedVV(null)} className="text-gray-400 hover:text-gray-600 p-2 transition-colors">❌</button></div><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div><h4 className="font-semibold text-gray-900 mb-3 flex items-center"><span className="mr-2">📅</span>Alapadatok</h4><div className="space-y-2 text-sm"><p><strong>VV dátuma:</strong> {new Date(selectedVV.vv_date).toLocaleDateString('hu-HU')}</p><p><strong>VV eredmény:</strong> {selectedVV.vv_result_days} nap</p><p><strong>Státusz:</strong><span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${selectedVV.pregnancy_status === 'vemhes' ? 'bg-green-100 text-green-800' : selectedVV.pregnancy_status === 'ures' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>{selectedVV.pregnancy_status === 'vemhes' ? '🤰 Vemhes' : selectedVV.pregnancy_status === 'ures' ? '❌ Üres' : '🌱 Csíra'}</span></p></div></div>{selectedVV.pregnancy_status === 'vemhes' && (<div><h4 className="font-semibold text-gray-900 mb-3 flex items-center"><span className="mr-2">🐂</span>Lehetséges apá{selectedVV.possible_fathers && selectedVV.possible_fathers.length > 1 ? 'k' : ''}</h4><div className="space-y-3 text-sm">{selectedVV.possible_fathers && selectedVV.possible_fathers.length > 0 ? (selectedVV.possible_fathers.map((father: Father, index: number) => (<div key={index} className={`p-3 border rounded-lg ${index === 0 ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}><div className="flex justify-between items-center mb-2"><span className="font-medium text-gray-900">🐂 {father.name || `${index + 1}. lehetséges apa`}</span></div><p><strong>Név:</strong> {father.name || '-'}</p><p><strong>ENAR:</strong> {father.enar || '-'}</p><p><strong>KPLSZ:</strong> {father.kplsz || '-'}</p></div>))) : (<div className="p-3 border rounded-lg bg-gray-50"><p><strong>Név:</strong> {selectedVV.father_name || '-'}</p><p><strong>ENAR:</strong> {selectedVV.father_enar || '-'}</p><p><strong>KPLSZ:</strong> {selectedVV.father_kplsz || '-'}</p></div>)}<p><strong>Bizonytalan apaság:</strong> {selectedVV.uncertain_paternity ? '⚠️ Igen' : '✅ Nem'}</p>{selectedVV.blood_test_required && (<p><strong>Vérvizsgálat:</strong>{selectedVV.blood_test_date ? new Date(selectedVV.blood_test_date).toLocaleDateString('hu-HU') : '🩸 Szükséges'}</p>)}</div></div>)}{selectedVV.expected_birth_date && (<div><h4 className="font-semibold text-gray-900 mb-3 flex items-center"><span className="mr-2">📅</span>Ellési előrejelzés</h4><div className="space-y-2 text-sm"><p><strong>Várható ellés:</strong> {new Date(selectedVV.expected_birth_date).toLocaleDateString('hu-HU')}</p></div></div>)}<div><h4 className="font-semibold text-gray-900 mb-3 flex items-center"><span className="mr-2">👨‍⚕️</span>Egyéb adatok</h4><div className="space-y-2 text-sm"><p><strong>Állatorvos:</strong> {selectedVV.veterinarian || '-'}</p><p><strong>Rögzítés dátuma:</strong> {new Date(selectedVV.created_at).toLocaleDateString('hu-HU')}</p></div></div></div>{selectedVV.notes && (<div className="mt-6"><h4 className="font-semibold text-gray-900 mb-2 flex items-center"><span className="mr-2">📝</span>Megjegyzések</h4><p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedVV.notes}</p></div>)}<div className="mt-6 flex justify-end"><button onClick={() => setSelectedVV(null)} className="bg-gray-600 hover:bg-gray-700 text-white font-medium px-6 py-3 rounded-lg transition-colors inline-flex items-center"><span className="mr-2">✅</span>Bezárás</button></div></div></div></div>)}

      {deletingVV && (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><div className="bg-white rounded-lg shadow-sm border max-w-md w-full mx-4"><div className="p-6"><div className="flex items-center mb-4"><div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center"><span className="text-red-600 text-xl">⚠️</span></div><div className="ml-4"><h3 className="text-lg font-semibold text-gray-900">VV Eredmény Törlése</h3><p className="text-sm text-gray-600">Ez a művelet nem visszafordítható!</p></div></div><div className="bg-gray-50 p-3 rounded-lg mb-4"><p className="text-sm"><strong>VV dátuma:</strong> {new Date(deletingVV.vv_date).toLocaleDateString('hu-HU')}</p><p className="text-sm"><strong>Eredmény:</strong> {deletingVV.vv_result_days} nap ({deletingVV.pregnancy_status})</p><p className="text-sm"><strong>Bika:</strong> {deletingVV.father_name || deletingVV.father_enar}</p></div><p className="text-gray-700 mb-6">Biztosan törölni szeretnéd ezt a VV eredményt? Ez a művelet nem visszafordítható.</p><div className="flex justify-end gap-3"><button onClick={() => setDeletingVV(null)} className="bg-white hover:bg-gray-50 text-gray-700 font-medium px-6 py-3 rounded-lg border border-gray-300 transition-colors inline-flex items-center"><span className="mr-2">❌</span>Mégse</button><button onClick={confirmDeleteVV} className="bg-red-500 hover:bg-red-600 text-white font-medium px-6 py-3 rounded-lg transition-colors inline-flex items-center"><span className="mr-2">🗑️</span>Törlés</button></div></div></div></div>)}
    </div>
  );
}