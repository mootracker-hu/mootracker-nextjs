import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

// ✅ ÚJ IMPORTOK: Meglévő komponensek a helyes útvonalon (dupla components mappa)
import { BolcsiAnimalTable } from './components/BolcsiAnimalTable';
import { OviAnimalTable } from './components/OviAnimalTable';  
import { HaremAnimalTable } from './components/HaremAnimalTable';
import { VemhesAnimalTable } from './components/VemhesAnimalTable';
import { ElletoAnimalTable } from './components/ElletoAnimalTable';
import { TehenAnimalTable } from './components/TehenAnimalTable';
import { HizobikaAnimalTable } from './components/HizobikaAnimalTable';
import { KorhazAnimalTable } from './components/KorhazAnimalTable';
import { KarantenAnimalTable } from './components/KarantenAnimalTable';
import { SelejtAnimalTable } from './components/SelejtAnimalTable';
import { AtmenetiAnimalTable } from './components/AtmenetiAnimalTable';

// TypeScript típusok (megmaradnak)
interface Animal {
    id: string;
    enar: string;
    name?: string; 
    szuletesi_datum: string;
    kategoria: string;
    ivar: string;
    statusz: string;
    birth_location?: 'nálunk' | 'vásárolt' | 'ismeretlen';
    jelenlegi_karam?: string;
    anya_enar?: string;
    apa_enar?: string;
    created_at: string;
    assigned_at?: string;
    assignment_reason?: string;
    // ✅ ÚJ MEZŐK A page.tsx LEKÉRDEZÉSBŐL:
    pairing_date?: string;
    current_weight?: number;
    last_weight_measured_at?: string;
    vv_date?: string;
    pregnancy_status?: string;
    // Karám-specifikus mezők
    harem_start_date?: string;
    vv_result?: 'vemhes' | 'ures' | 'csira';
    expected_birth_date?: string;
    birth_date?: string;
    calf_enar?: string;
    calf_gender?: 'hímivar' | 'nőivar';
    treatment_type?: string;
    treatment_start?: string;
    expected_recovery?: string;
    veterinarian?: string;
    return_pen_id?: string;
    transfer_reason?: string;
    decision_deadline?: string;
    target_pen_candidates?: string;
    quarantine_reason?: string;
    quarantine_start?: string;
    expected_release?: string;
    observation_points?: string;
    culling_reason?: string;
    culling_date?: string;
    sales_plan?: string;
    estimated_value?: number;
    notes?: string;
}

type PenFunctionType =
    | 'bölcsi' | 'óvi' | 'hárem' | 'vemhes' | 'ellető' | 'tehén'
    | 'hízóbika' | 'üres' | 'átmeneti' | 'kórház' | 'karantén' | 'selejt';

interface AnimalTableProps {
    animals: Animal[];
    selectedAnimals: string[];
    onToggleAnimal: (id: string) => void;
    onSelectAll: () => void;
    onClearSelection: () => void;
    handleAnimalClick: (animal: Animal) => void; // ✅ ÚJ PROP
}

// 🎯 FŐ KOMPONENS - SWITCH-CASE LOGIC (tisztított verzió)
interface PenSpecificAnimalTableProps {
    penFunction: PenFunctionType;
    animals: Animal[];
    selectedAnimals: string[];
    onToggleAnimal: (id: string) => void;
    onSelectAll: () => void;
    onClearSelection: () => void;
}

const PenSpecificAnimalTable: React.FC<PenSpecificAnimalTableProps> = ({
    penFunction,
    animals,
    selectedAnimals,
    onToggleAnimal,
    onSelectAll,
    onClearSelection
}) => {

    // ✅ BORJÚ MODAL LOGIKA (eredeti funkcionalitás megmarad)
    const [selectedCalfDetails, setSelectedCalfDetails] = useState<any | null>(null);
    const supabase = createClient();

    // Intelligens modal választó függvény (eredeti logika megmarad)
    const handleAnimalClick = async (animal: any) => {
        const isTempId = animal.enar.includes('/') || animal.enar.startsWith('temp-');

        if (isTempId) {
            await fetchCalfDetails(animal.enar);
        } else {
            window.open(`/dashboard/animals/${animal.enar}`, '_blank');
        }
    };

    // Borjú részletek lekérdező függvény (eredeti logika megmarad)
    const fetchCalfDetails = async (tempId: string) => {
        try {
            console.log('🔍 Teljes borjú lekérdezés:', tempId);

            // 1. ✅ BORJÚ ALAPADATOK
            const { data: calfData, error: calfError } = await supabase
                .from('calves')
                .select('*')
                .eq('temp_id', tempId);

            if (calfError || !calfData?.[0]) {
                throw new Error(`Borjú nem található: ${calfError?.message}`);
            }

            const calf = calfData[0];
            console.log('✅ Borjú megtalálva:', calf);

            // 2. ✅ SZÜLETÉSI ADATOK (ha van birth_id)
            let birthData = null;
            if (calf.birth_id) {
                const { data: births } = await supabase
                    .from('births')
                    .select('*')
                    .eq('id', calf.birth_id);
                birthData = births?.[0];
            }

            // 3. ✅ VV EREDMÉNYEK (anya ENAR alapján)
            let vvData = null;
            if (birthData?.mother_enar) {
                const { data: vvResults } = await supabase
                    .from('vv_results')
                    .select('*')
                    .eq('animal_enar', birthData.mother_enar)
                    .eq('pregnancy_status', 'vemhes')
                    .order('vv_date', { ascending: false })
                    .limit(1);
                vvData = vvResults?.[0];
            }

            // 4. ✅ TELJES OBJEKTUM ÖSSZEÁLLÍTÁSA
            const completeCalfData = {
                ...calf,
                birth: birthData,
                vv_result: vvData
            };

            console.log('🎉 Teljes borjú adatok:', completeCalfData);
            setSelectedCalfDetails(completeCalfData);

        } catch (err) {
            console.error('❌ Teljes hiba:', err);
            alert(`❌ Hiba: ${(err as any).message}`);
        }
    };

    // Helper függvények (calves page-ből) - eredeti logika megmarad
    const calculateCalfAge = (birthDate: string) => {
        const birth = new Date(birthDate);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - birth.getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    const getFatherDisplay = (calf: any) => {
        const vv = calf.vv_result;
        if (!vv) return '❓ Ismeretlen';
        if (vv.possible_fathers?.length > 1) return `🤷‍♂️ ${vv.possible_fathers.length} lehetséges apa`;
        return vv.father_name ? `🐂 ${vv.father_name}` : '❓ Nincs adat';
    };

    const getProtocolStatus = (birthDate: string) => {
        const age = calculateCalfAge(birthDate);
        if (age <= 15) {
            return {
                message: `${15 - age} nap múlva: BoviPast + fülszám`,
                color: 'bg-yellow-100 text-yellow-800 border-yellow-200'
            };
        } else {
            return {
                message: `${age - 15} napja túllépte: Sürgős protokoll!`,
                color: 'bg-red-100 text-red-800 border-red-200'
            };
        }
    };

    // ✅ TÁBLÁZAT PROPS - minden komponensnek ugyanezek mennek át
    const tableProps = {
        animals,
        selectedAnimals,
        onToggleAnimal,
        onSelectAll,
        onClearSelection,
        handleAnimalClick
    };

    return (
        <>
            {/* ✅ SWITCH-CASE LOGIKA - külső komponensekkel */}
            {(() => {
                switch (penFunction) {
                    case 'bölcsi':
                        return <BolcsiAnimalTable {...tableProps} />;
                    case 'óvi':
                        return <OviAnimalTable {...tableProps} />;
                    case 'hárem':
                        return <HaremAnimalTable {...tableProps} />;
                    case 'vemhes':
                        return <VemhesAnimalTable {...tableProps} />;
                    case 'ellető':
                        return <ElletoAnimalTable {...tableProps} />;
                    case 'tehén':
                        return <TehenAnimalTable {...tableProps} />;
                    case 'hízóbika':
                        return <HizobikaAnimalTable {...tableProps} />;
                    case 'kórház':
                        return <KorhazAnimalTable {...tableProps} />;
                    case 'karantén':
                        return <KarantenAnimalTable {...tableProps} />;
                    case 'selejt':
                        return <SelejtAnimalTable {...tableProps} />;
                    case 'átmeneti':
                        return <AtmenetiAnimalTable {...tableProps} />;
                    default:
                        return <div>Táblázat típus nem található</div>;
                }
            })()}

            {/* ✅ KOMPLEX BORJÚ RÉSZLETEI MODAL - eredeti logika 100% megmarad */}
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
                                            <span className="text-gray-600">Apa:</span>
                                            <div className="font-medium">
                                                {getFatherDisplay(selectedCalfDetails)}
                                            </div>
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
                                                    `${calculateCalfAge(selectedCalfDetails.birth.birth_date)} nap` :
                                                    '-'
                                                }
                                            </div>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">Típus:</span>
                                            <div className="font-medium">
                                                🆕 Új ellés
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* VV Eredmény Részletek */}
                                {selectedCalfDetails.vv_result && (
                                    <div className="bg-blue-50 p-4 rounded-lg">
                                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                                            <span className="mr-2">🔬</span>
                                            VV Eredmény Részletek
                                        </h4>
                                        <div className="text-sm space-y-2">
                                            {selectedCalfDetails.vv_result.possible_fathers &&
                                                Array.isArray(selectedCalfDetails.vv_result.possible_fathers) &&
                                                selectedCalfDetails.vv_result.possible_fathers.length > 1 ? (
                                                <div>
                                                    <span className="text-gray-600">Lehetséges apák ({selectedCalfDetails.vv_result.possible_fathers.length}):</span>
                                                    <div className="font-medium space-y-1 mt-1">
                                                        {selectedCalfDetails.vv_result.possible_fathers.map((father: any, index: number) => (
                                                            <div key={`modal-father-${index}`} className="bg-white p-2 rounded border">
                                                                🐂 {father.name || father.father_name || 'Névtelen'}
                                                                {father.enar || father.father_enar ? ` (${father.enar || father.father_enar})` : ''}
                                                                {father.kplsz || father.father_kplsz ? ` - KPLSZ: ${father.kplsz || father.father_kplsz}` : ''}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    {(selectedCalfDetails.vv_result.father_name ||
                                                        (selectedCalfDetails.vv_result.possible_fathers && selectedCalfDetails.vv_result.possible_fathers[0]?.name)) && (
                                                            <div>
                                                                <span className="text-gray-600">Tenyészbika név:</span>
                                                                <div className="font-medium">
                                                                    {selectedCalfDetails.vv_result.father_name ||
                                                                        selectedCalfDetails.vv_result.possible_fathers?.[0]?.name ||
                                                                        selectedCalfDetails.vv_result.possible_fathers?.[0]?.father_name}
                                                                </div>
                                                            </div>
                                                        )}
                                                    {(selectedCalfDetails.vv_result.father_enar ||
                                                        (selectedCalfDetails.vv_result.possible_fathers && selectedCalfDetails.vv_result.possible_fathers[0]?.enar)) && (
                                                            <div>
                                                                <span className="text-gray-600">Tenyészbika ENAR:</span>
                                                                <div className="font-medium">
                                                                    {selectedCalfDetails.vv_result.father_enar ||
                                                                        selectedCalfDetails.vv_result.possible_fathers?.[0]?.enar ||
                                                                        selectedCalfDetails.vv_result.possible_fathers?.[0]?.father_enar}
                                                                </div>
                                                            </div>
                                                        )}
                                                </>
                                            )}

                                            {selectedCalfDetails.vv_result.vv_date && (
                                                <div>
                                                    <span className="text-gray-600">VV dátum:</span>
                                                    <div className="font-medium">{new Date(selectedCalfDetails.vv_result.vv_date).toLocaleDateString('hu-HU')}</div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Tervezett ENAR */}
                                <div className="bg-green-50 p-4 rounded-lg">
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
                                        alert('🏷️ Fülszám kezelés funkció hamarosan elérhető!');
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
        </>
    );
};

export default PenSpecificAnimalTable;