// src/app/dashboard/bulls/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Edit, Trash2, Search, Eye, EyeOff } from 'lucide-react';

interface Bull {
    id: string;
    name: string;
    enar: string;
    kplsz: string;
    active: boolean;
    created_at: string;
    notes?: string;
}

export default function BullsManagementPage() {
    const [bulls, setBulls] = useState<Bull[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showInactive, setShowInactive] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingBull, setEditingBull] = useState<Bull | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        enar: '',
        kplsz: '',
        notes: ''
    });

    // Fetch bulls from database
    const fetchBulls = async () => {
  try {
    setLoading(true);
    const { data, error } = await supabase
      .from('bulls')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    setBulls(data || []); // ← BULLS, nem availableBulls!
  } catch (error) {
    console.error('Error fetching bulls:', error);
    alert('Hiba a tenyészbikák betöltésekor!');
  } finally {
    setLoading(false);
  }
};

    useEffect(() => {
        fetchBulls();
    }, []);

    // Filter bulls based on search and active status
    const filteredBulls = bulls.filter(bull => {
        const matchesSearch = bull.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            bull.enar.toLowerCase().includes(searchTerm.toLowerCase()) ||
            bull.kplsz.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = showInactive ? true : bull.active;

        return matchesSearch && matchesStatus;
    });

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name || !formData.enar || !formData.kplsz) {
            alert('Név, ENAR és KPLSZ kötelező mezők!');
            return;
        }

        try {
            if (editingBull) {
                // Update existing bull
                const { error } = await supabase
                    .from('bulls')
                    .update({
                        name: formData.name,
                        enar: formData.enar,
                        kplsz: formData.kplsz,
                        notes: formData.notes || null
                    })
                    .eq('id', editingBull.id);

                if (error) throw error;
                alert('Tenyészbika sikeresen frissítve!');
            } else {
                // Create new bull
                const { error } = await supabase
                    .from('bulls')
                    .insert({
                        name: formData.name,
                        enar: formData.enar,
                        kplsz: formData.kplsz,
                        notes: formData.notes || null,
                        active: true
                    });

                if (error) throw error;
                alert('Új tenyészbika sikeresen hozzáadva!');
            }

            // Reset form and refresh data
            setFormData({ name: '', enar: '', kplsz: '', notes: '' });
            setShowForm(false);
            setEditingBull(null);
            fetchBulls();
        } catch (error) {
  console.error('Error saving bull:', error);
  
  // TypeScript-safe error handling
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  const errorCode = (error as any)?.code || 'No code';
  const errorHint = (error as any)?.hint || 'No hint';
  
  console.error('Error details:', errorMessage);
  console.error('Error code:', errorCode);
  console.error('Error hint:', errorHint);
  
  alert(`Hiba a mentés során: ${errorMessage}`);
}
    };

    // Handle edit
    const handleEdit = (bull: Bull) => {
        setEditingBull(bull);
        setFormData({
            name: bull.name,
            enar: bull.enar,
            kplsz: bull.kplsz,
            notes: bull.notes || ''
        });
        setShowForm(true);
    };

    // Handle delete/deactivate
    const handleToggleActive = async (bull: Bull) => {
        const action = bull.active ? 'deaktiválni' : 'aktiválni';

        if (confirm(`Biztosan szeretnéd ${action} ${bull.name} tenyészbikát?`)) {
            try {
                const { error } = await supabase
                    .from('bulls')
                    .update({ active: !bull.active })
                    .eq('id', bull.id);

                if (error) throw error;

                alert(`${bull.name} sikeresen ${bull.active ? 'deaktiválva' : 'aktiválva'}!`);
                fetchBulls();
            } catch (error) {
                console.error('Error toggling bull status:', error);
                alert('Hiba a státusz változtatásakor!');
            }
        }
    };

    // Handle permanent delete
    const handleDelete = async (bull: Bull) => {
        if (confirm(`VÉGLEGESEN törölni szeretnéd ${bull.name} tenyészbikát? Ez a művelet nem vonható vissza!`)) {
            try {
                const { error } = await supabase
                    .from('bulls')
                    .delete()
                    .eq('id', bull.id);

                if (error) throw error;

                alert(`${bull.name} tenyészbika véglegesen törölve!`);
                fetchBulls();
            } catch (error) {
                console.error('Error deleting bull:', error);
                alert('Hiba a törlés során!');
            }
        }
    };

    // Reset form
    const resetForm = () => {
        setFormData({ name: '', enar: '', kplsz: '', notes: '' });
        setShowForm(false);
        setEditingBull(null);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center">
                            <span className="text-3xl mr-3">🐂</span>
                            <h1 className="text-2xl font-bold text-gray-900">Tenyészbika Management</h1>
                        </div>
                        <button
                            onClick={() => setShowForm(true)}
                            className="bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-lg transition-colors inline-flex items-center"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Új Tenyészbika
                        </button>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
                    <div className="flex items-center space-x-4 mb-4 sm:mb-0">
                        <h2 className="text-xl font-semibold text-gray-900">
                            Tenyészbikák ({filteredBulls.length})
                        </h2>
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                checked={showInactive}
                                onChange={(e) => setShowInactive(e.target.checked)}
                                className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                            />
                            <span className="ml-2 text-sm text-gray-600">Inaktívak mutatása</span>
                        </label>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <input
                            type="text"
                            placeholder="Keresés név, ENAR vagy KPLSZ..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 w-64"
                        />
                    </div>
                </div>

                {/* Bulls Table */}
                <div className="bg-white shadow-sm rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Név
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    ENAR
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    KPLSZ
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Státusz
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Létrehozva
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Műveletek
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredBulls.map((bull) => (
                                <tr key={bull.id} className={`hover:bg-gray-50 ${!bull.active ? 'opacity-60' : ''}`}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <span className="text-2xl mr-2">🐂</span>
                                            <span className="text-sm font-medium text-gray-900">{bull.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {bull.enar}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {bull.kplsz}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bull.active
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-gray-100 text-gray-800'
                                            }`}>
                                            {bull.active ? '✅ Aktív' : '❌ Inaktív'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(bull.created_at).toLocaleDateString('hu-HU')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => handleEdit(bull)}
                                                className="text-blue-600 hover:text-blue-900"
                                                title="Szerkesztés"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleToggleActive(bull)}
                                                className={`${bull.active ? 'text-yellow-600 hover:text-yellow-900' : 'text-green-600 hover:text-green-900'}`}
                                                title={bull.active ? 'Deaktiválás' : 'Aktiválás'}
                                            >
                                                {bull.active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                            <button
                                                onClick={() => handleDelete(bull)}
                                                className="text-red-600 hover:text-red-900"
                                                title="Végleges törlés"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {filteredBulls.length === 0 && (
                        <div className="text-center py-12">
                            <span className="text-6xl mb-4 block">🐂</span>
                            <h3 className="mt-2 text-sm font-medium text-gray-900">Nincsenek tenyészbikák</h3>
                            <p className="mt-1 text-sm text-gray-500">
                                {searchTerm ? 'Nincs találat a keresési feltételre.' : 'Kezdj el egy új tenyészbika hozzáadásával.'}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg w-full max-w-md">
                        <div className="flex items-center justify-between p-6 border-b">
                            <h3 className="text-lg font-medium text-gray-900">
                                {editingBull ? 'Tenyészbika szerkesztése' : 'Új tenyészbika hozzáadása'}
                            </h3>
                            <button
                                onClick={resetForm}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <span className="text-xl">❌</span>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        🐂 Név *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                                        placeholder="pl. Balotelli"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        🏷️ ENAR *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.enar}
                                        onChange={(e) => setFormData({ ...formData, enar: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                                        placeholder="HU 12345 6789 0"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        📋 KPLSZ *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.kplsz}
                                        onChange={(e) => setFormData({ ...formData, kplsz: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                                        placeholder="KPLSZ szám"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        📝 Megjegyzések
                                    </label>
                                    <textarea
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                                        placeholder="Opcionális megjegyzések..."
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end space-x-4 mt-6">
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                                >
                                    Mégse
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                                >
                                    {editingBull ? 'Frissítés' : 'Hozzáadás'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}