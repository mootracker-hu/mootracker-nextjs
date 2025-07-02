// src/app/dashboard/calves/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { CalfWithDetails } from '@/types/calf-types';
import EarTagModal from '@/components/ear-tag-modal';

export default function CalvesPage() {
    const [calves, setCalves] = useState<CalfWithDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedCalf, setSelectedCalf] = useState<CalfWithDetails | null>(null);
    const [isEarTagModalOpen, setIsEarTagModalOpen] = useState(false);
    const [selectedCalfDetails, setSelectedCalfDetails] = useState<CalfWithDetails | null>(null);
    const [motherEnarFilter, setMotherEnarFilter] = useState('');

    const supabase = createClient();

    useEffect(() => {
        fetchCalves();
    }, []);

    const fetchCalves = async () => {
        try {
            setLoading(true);
            console.log('🐮 Fetching calves...');

            const { data, error } = await supabase
                .from('calves')
                .select(`
          *,
          planned_enar,
          birth:births!inner(
            id,
            mother_enar,
            birth_date,
            birth_type,
            historical
          )
        `)
                .is('enar', null) // Csak fülszám nélküli borjak
                .order('created_at', { ascending: false });

            if (error) {
                console.error('❌ Error fetching calves:', error);
                setError(error.message);
                return;
            }

            console.log('✅ Calves data:', data);
            setCalves(data || []);

        } catch (err) {
            console.error('❌ Unexpected error:', err);
            setError('Váratlan hiba történt');
        } finally {
            setLoading(false);
        }
    };

    const handleEarTagSuccess = () => {
        setIsEarTagModalOpen(false);
        setSelectedCalf(null);
        fetchCalves(); // Frissítjük a listát
    };

    const calculateAge = (birthDate: string) => {
        const birth = new Date(birthDate);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - birth.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const getGenderDisplay = (gender: string) => {
        return gender === 'male' ? '🐂 Bika' : '🐄 Üsző';
    };

    const getProtocolStatus = (birthDate: string) => {
        const age = calculateAge(birthDate);
        if (age <= 15) {
            return {
                status: 'pending',
                message: `${15 - age} nap múlva: BoviPast + fülszám`,
                color: 'bg-yellow-100 text-yellow-800 border-yellow-200'
            };
        } else {
            return {
                status: 'overdue',
                message: `${age - 15} napja túllépte: Sürgős protokoll!`,
                color: 'bg-red-100 text-red-800 border-red-200'
            };
        }
    };

    if (loading) {
        return (
            <div className="p-6">
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Borjak betöltése...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h3 className="text-red-800 font-medium">Hiba történt</h3>
                    <p className="text-red-600 mt-1">{error}</p>
                    <button
                        onClick={fetchCalves}
                        className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                        Újrapróbálás
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl font-bold text-gray-900">🐮 Borjak</h1>
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                        {calves.length} fülszám nélküli borjú
                    </span>
                </div>
                <p className="text-gray-600">
                    Fülszám nélküli borjak kezelése és 15 napos protokoll követése
                </p>
                
                {/* Anya ENAR szűrő */}
                <div className="mt-4">
                    <input
                        type="text"
                        placeholder="🔍 Keresés anya ENAR szerint (pl. HU 30223 4479 8)"
                        value={motherEnarFilter}
                        onChange={(e) => setMotherEnarFilter(e.target.value)}
                        className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">📅</span>
                        <h3 className="font-medium text-gray-900">Összes borjú</h3>
                    </div>
                    <p className="text-2xl font-bold text-green-600">{calves.length}</p>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">⏰</span>
                        <h3 className="font-medium text-gray-900">Protokoll esedékes</h3>
                    </div>
                    <p className="text-2xl font-bold text-yellow-600">
                        {calves.filter(calf => calculateAge(calf.birth?.birth_date || '') <= 15).length}
                    </p>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">🚨</span>
                        <h3 className="font-medium text-gray-900">Túllépett</h3>
                    </div>
                    <p className="text-2xl font-bold text-red-600">
                        {calves.filter(calf => calculateAge(calf.birth?.birth_date || '') > 15).length}
                    </p>
                </div>
            </div>

            {/* Calves Table */}
            {calves.filter(calf => 
                motherEnarFilter === '' || 
                calf.birth?.mother_enar?.toLowerCase().includes(motherEnarFilter.toLowerCase())
            ).length === 0 ? (
                <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                    <div className="text-6xl mb-4">🐮</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {motherEnarFilter ? 'Nincs találat a szűrésre' : 'Nincsenek fülszám nélküli borjak'}
                    </h3>
                    <p className="text-gray-600">
                        {motherEnarFilter ? 
                            'Próbáld meg módosítani a keresési feltételt.' :
                            'Minden borjú megkapta a fülszámát, vagy még nem születtek új borjak.'
                        }
                    </p>
                </div>
            ) : (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Temp ID
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Anya
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Születés
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Életkor
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Ivar
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Tervezett ENAR
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Protokoll státusz
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Műveletek
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {calves.filter(calf => 
                                    motherEnarFilter === '' || 
                                    calf.birth?.mother_enar?.toLowerCase().includes(motherEnarFilter.toLowerCase())
                                ).map((calf) => {
                                    const age = calculateAge(calf.birth?.birth_date || '');
                                    const protocol = getProtocolStatus(calf.birth?.birth_date || '');

                                    return (
                                        <tr key={calf.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {calf.temp_id}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                    {calf.birth?.mother_enar}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                    {calf.birth?.birth_date ? new Date(calf.birth.birth_date).toLocaleDateString('hu-HU') : '-'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                    {age} nap
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                    {getGenderDisplay(calf.gender)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm">
                                                    {calf.planned_enar ? (
                                                        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 border-blue-200">
                                                            📝 {calf.planned_enar}
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 border-gray-200">
                                                            ⏳ Nincs tervezve
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${protocol.color}`}>
                                                    {protocol.message}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <button
                                                    className="text-green-600 hover:text-green-900 mr-3"
                                                    onClick={() => {
                                                        setSelectedCalf(calf);
                                                        setIsEarTagModalOpen(true);
                                                    }}
                                                >
                                                    🏷️ Fülszám
                                                </button>
                                                <button
                                                    className="text-blue-600 hover:text-blue-900"
                                                    onClick={() => setSelectedCalfDetails(calf)}
                                                >
                                                    👁️ Részletek
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            
            {/* EarTag Modal */}
            {selectedCalf && (
                <EarTagModal
                    isOpen={isEarTagModalOpen}
                    onClose={() => {
                        setIsEarTagModalOpen(false);
                        setSelectedCalf(null);
                    }}
                    calf={selectedCalf}
                    onSuccess={handleEarTagSuccess}
                />
            )}

            {/* Borjú Részletek Modal */}
            {selectedCalfDetails && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-sm border max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center">
                                    <span className="text-2xl mr-3">🐄</span>
                                    <h3 className="text-xl font-bold text-gray-900">Borjú Részletei</h3>
                                </div>
                                <button
                                    onClick={() => setSelectedCalfDetails(null)}
                                    className="text-gray-400 hover:text-gray-600 p-2 transition-colors"
                                >
                                    ❌
                                </button>
                            </div>

                            <div className="space-y-4">
                                {/* Alapadatok */}
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                                        <span className="mr-2">📋</span>
                                        Alapadatok
                                    </h4>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <span className="text-gray-600">Temp ID:</span>
                                            <div className="font-medium">{selectedCalfDetails.temp_id}</div>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">Ivar:</span>
                                            <div className="font-medium">
                                                {selectedCalfDetails.gender === 'male' ? '🐂 Bika' : '🐄 Üsző'}
                                            </div>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">Anya ENAR:</span>
                                            <div className="font-medium">{selectedCalfDetails.birth?.mother_enar}</div>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">Születés:</span>
                                            <div className="font-medium">
                                                {selectedCalfDetails.birth?.birth_date ? 
                                                    new Date(selectedCalfDetails.birth.birth_date).toLocaleDateString('hu-HU') : 
                                                    '-'
                                                }
                                            </div>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">Életkor:</span>
                                            <div className="font-medium">
                                                {selectedCalfDetails.birth?.birth_date ? 
                                                    `${calculateAge(selectedCalfDetails.birth.birth_date)} nap` : 
                                                    '-'
                                                }
                                            </div>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">Típus:</span>
                                            <div className="font-medium">
                                                {selectedCalfDetails.birth?.historical ? '📚 Történeti' : '🆕 Új ellés'}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Tervezett ENAR */}
                                <div className="bg-blue-50 p-4 rounded-lg">
                                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                                        <span className="mr-2">📝</span>
                                        Tervezett ENAR
                                    </h4>
                                    {selectedCalfDetails.planned_enar ? (
                                        <div className="text-blue-800 font-medium mb-2">
                                            📝 {selectedCalfDetails.planned_enar}
                                        </div>
                                    ) : (
                                        <div className="text-gray-600 mb-2">
                                            ⏳ Még nincs tervezve
                                        </div>
                                    )}
                                    <button
                                        onClick={async () => {
                                            const plannedEnar = prompt(
                                                'Add meg a tervezett ENAR számot:', 
                                                selectedCalfDetails.planned_enar || 'HU '
                                            );
                                            if (plannedEnar) {
                                                try {
                                                    const { error } = await supabase
                                                        .from('calves')
                                                        .update({ planned_enar: plannedEnar })
                                                        .eq('temp_id', selectedCalfDetails.temp_id);

                                                    if (error) {
                                                        alert('❌ Hiba történt a mentés során!');
                                                    } else {
                                                        alert('✅ Tervezett ENAR sikeresen mentve!');
                                                        fetchCalves(); // UI frissítése
                                                        setSelectedCalfDetails(null); // Modal bezárása
                                                    }
                                                } catch (err) {
                                                    alert('❌ Váratlan hiba történt!');
                                                }
                                            }
                                        }}
                                        className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-3 py-2 rounded transition-colors"
                                    >
                                        📝 {selectedCalfDetails.planned_enar ? 'ENAR módosítása' : 'ENAR tervezése'}
                                    </button>
                                </div>

                                {/* Protokoll státusz */}
                                <div className="bg-yellow-50 p-4 rounded-lg">
                                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                                        <span className="mr-2">⏰</span>
                                        15 napos protokoll
                                    </h4>
                                    {(() => {
                                        if (!selectedCalfDetails.birth?.birth_date) return null;
                                        const protocol = getProtocolStatus(selectedCalfDetails.birth.birth_date);
                                        return (
                                            <div className={`p-3 rounded border ${protocol.color}`}>
                                                <div className="font-medium">{protocol.message}</div>
                                                <div className="text-xs mt-1 text-gray-600">
                                                    BoviPast vakcina + fülszám felhelyezés + szarvtalanítás
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>

                            {/* Akció gombok */}
                            <div className="mt-6 flex gap-3">
                                <button
                                    onClick={() => setSelectedCalfDetails(null)}
                                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium px-4 py-3 rounded-lg transition-colors"
                                >
                                    ✅ Bezárás
                                </button>
                                <button
                                    onClick={() => {
                                        setSelectedCalf(selectedCalfDetails);
                                        setSelectedCalfDetails(null);
                                        setIsEarTagModalOpen(true);
                                    }}
                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-3 rounded-lg transition-colors"
                                >
                                    🏷️ Fülszám kezelése
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}