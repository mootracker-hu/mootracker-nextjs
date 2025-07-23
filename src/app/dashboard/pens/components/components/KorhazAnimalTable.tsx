import React from 'react';
import Link from 'next/link';
import { WeightCell } from '@/components/shared/WeightCell';
import { displayEnar } from '@/constants/enar-formatter';

// TypeScript típusok
interface Animal {
    id: string;
    enar: string;
    name?: string; 
    szuletesi_datum: string;
    kategoria: string;
    ivar: string;
    statusz: string;
    current_weight?: number;
    last_weight_measured_at?: string;
    notes?: string;
    // Kórház-specifikus mezők
    treatment_type?: string;
    treatment_start?: string;
    expected_recovery?: string;
    veterinarian?: string;
    return_pen_id?: string;
    // További mezők...
    assigned_at?: string;
    pairing_date?: string;
    vv_date?: string;
    birth_date?: string;
}

interface AnimalTableProps {
    animals: Animal[];
    selectedAnimals: string[];
    onToggleAnimal: (id: string) => void;
    onSelectAll: () => void;
    onClearSelection: () => void;
    handleAnimalClick: (animal: Animal) => void;
}

// Segédfunkciók
const getSafeKey = (animal: Animal, index: number): string => {
    if (animal.id && animal.id !== 'NaN' && animal.id !== '') {
        return `${animal.id}-${index}`;
    }
    if (animal.enar) {
        return `enar-${animal.enar}-${index}`;
    }
    return `fallback-${index}-${Math.random().toString(36).substr(2, 9)}`;
};

const formatDate = (dateString?: string): string => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('hu-HU');
};

// 🏥 KÓRHÁZ TÁBLÁZAT - Clean & Optimized + WeightCell
export const KorhazAnimalTable: React.FC<AnimalTableProps> = ({
    animals, 
    selectedAnimals, 
    onToggleAnimal, 
    onSelectAll, 
    onClearSelection, 
    handleAnimalClick
}) => {
    return (
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
                <table className="table-auto w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                <input
                                    type="checkbox"
                                    checked={selectedAnimals.length === animals.length && animals.length > 0}
                                    onChange={() => selectedAnimals.length === animals.length ? onClearSelection() : onSelectAll()}
                                    className="rounded border-gray-300"
                                />
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                🏷️ ENAR
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                📛 Név
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                🏥 Kezelés típusa
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                📅 Kezelés kezdete
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                🩺 Várható gyógyulás
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                👨‍⚕️ Állatorvos
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                🔙 Visszatérés helye
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                ⚖️ UTOLSÓ MÉRÉS
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                📝 Feljegyzés
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                ⚙️ Műveletek
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {animals.map((animal, index) => {
                            const isClickable = animal.enar && (animal.enar.includes('/') || animal.enar.startsWith('temp-'));
                            
                            // Kezelés időtartam számítás
                            const getTreatmentDuration = (startDate?: string) => {
                                if (!startDate) return null;
                                
                                const start = new Date(startDate);
                                const today = new Date();
                                const diffDays = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                                
                                return diffDays;
                            };

                            // Gyógyulás státusz színezés
                            const getRecoveryStatus = (recoveryDate?: string) => {
                                if (!recoveryDate) return 'text-gray-500';
                                
                                const recovery = new Date(recoveryDate);
                                const today = new Date();
                                const diffDays = Math.ceil((recovery.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                                
                                if (diffDays < 0) return 'text-green-600 font-medium'; // Gyógyult
                                if (diffDays <= 3) return 'text-orange-600 font-medium'; // Hamarosan
                                return 'text-blue-600'; // Még kezelés alatt
                            };

                            // Kezelés típus színezés
                            const getTreatmentTypeColor = (type?: string) => {
                                if (!type) return 'bg-gray-100 text-gray-800';
                                
                                const lowerType = type.toLowerCase();
                                if (lowerType.includes('sebészet') || lowerType.includes('műtét')) {
                                    return 'bg-red-100 text-red-800';
                                }
                                if (lowerType.includes('antibiotikum') || lowerType.includes('gyógyszer')) {
                                    return 'bg-blue-100 text-blue-800';
                                }
                                if (lowerType.includes('láz') || lowerType.includes('fertőzés')) {
                                    return 'bg-orange-100 text-orange-800';
                                }
                                if (lowerType.includes('sérülés') || lowerType.includes('trauma')) {
                                    return 'bg-purple-100 text-purple-800';
                                }
                                return 'bg-green-100 text-green-800';
                            };
                            
                            const treatmentDays = getTreatmentDuration(animal.treatment_start);
                            
                            return (
                                <tr 
                                    key={getSafeKey(animal, index)}
                                    className={`hover:bg-gray-50 transition-colors ${
                                        selectedAnimals.includes(animal.id) ? 'bg-blue-50' : ''
                                    } ${isClickable ? 'cursor-pointer' : ''}`}
                                    onClick={isClickable ? () => handleAnimalClick(animal) : undefined}
                                >
                                    {/* ✅ CHECKBOX */}
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <input
                                            type="checkbox"
                                            checked={selectedAnimals.includes(animal.id)}
                                            onChange={() => onToggleAnimal(animal.id)}
                                            className="rounded border-gray-300"
                                        />
                                    </td>
                                    
                                    {/* ✅ ENAR */}
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {isClickable ? (
                                            <span className="text-orange-600 font-medium cursor-pointer hover:text-orange-800">
                                                🐮 {displayEnar(animal.enar)}
                                            </span>
                                        ) : (
                                            <Link 
                                                href={`/dashboard/animals/${encodeURIComponent(animal.enar)}`} 
                                                className="text-blue-600 hover:text-blue-800 font-medium"
                                            >
                                               {displayEnar(animal.enar)}
                                            </Link>
                                        )}
                                    </td>
                                    
                                    {/* ✅ NÉV */}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                        {animal.name || '-'}
                                    </td>
                                    
                                    {/* ✅ KEZELÉS TÍPUSA - Színkódolt badge */}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        {animal.treatment_type ? (
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTreatmentTypeColor(animal.treatment_type)}`}>
                                                🏥 {animal.treatment_type}
                                            </span>
                                        ) : (
                                            <span className="text-gray-400">-</span>
                                        )}
                                    </td>
                                    
                                    {/* ✅ KEZELÉS KEZDETE - Időtartammal */}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {animal.treatment_start ? (
                                            <div>
                                                <div className="font-medium">{formatDate(animal.treatment_start)}</div>
                                                {treatmentDays !== null && (
                                                    <div className="text-xs text-gray-500">
                                                        🕐 {treatmentDays} napja
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            '-'
                                        )}
                                    </td>
                                    
                                    {/* ✅ VÁRHATÓ GYÓGYULÁS - Státusz színkódolással */}
                                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${getRecoveryStatus(animal.expected_recovery)}`}>
                                        {animal.expected_recovery ? (
                                            <div>
                                                <div className="font-medium">{formatDate(animal.expected_recovery)}</div>
                                                {(() => {
                                                    const recovery = new Date(animal.expected_recovery);
                                                    const today = new Date();
                                                    const diffDays = Math.ceil((recovery.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                                                    
                                                    if (diffDays < 0) {
                                                        return <div className="text-xs">✅ Gyógyult/Ellenőrzés</div>;
                                                    } else if (diffDays <= 3) {
                                                        return <div className="text-xs">⏰ {diffDays} nap múlva</div>;
                                                    } else {
                                                        return <div className="text-xs">🏥 {diffDays} nap múlva</div>;
                                                    }
                                                })()}
                                            </div>
                                        ) : (
                                            '-'
                                        )}
                                    </td>
                                    
                                    {/* ✅ ÁLLATORVOS */}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {animal.veterinarian ? (
                                            <div className="flex items-center">
                                                <span className="mr-1">👨‍⚕️</span>
                                                <span className="font-medium">{animal.veterinarian}</span>
                                            </div>
                                        ) : (
                                            <span className="text-gray-400">-</span>
                                        )}
                                    </td>
                                    
                                    {/* ✅ VISSZATÉRÉS HELYE */}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {animal.return_pen_id ? (
                                            <div className="flex items-center">
                                                <span className="mr-1">🔙</span>
                                                <span className="font-medium text-blue-600">{animal.return_pen_id}</span>
                                            </div>
                                        ) : (
                                            <span className="text-gray-400">-</span>
                                        )}
                                    </td>
                                    
                                    {/* ✅ SÚLYMÉRÉS - WeightCell komponens használata */}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        <WeightCell 
                                            weight={animal.current_weight} 
                                            lastMeasured={animal.last_weight_measured_at} 
                                        />
                                    </td>
                                    
                                    {/* ✅ FELJEGYZÉS */}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {animal.notes || '-'}
                                    </td>
                                    
                                    {/* ✅ MŰVELETEK */}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <button 
                                            className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                                            title="Műveletek"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                alert('🔧 Műveletek menü hamarosan elérhető!');
                                            }}
                                        >
                                            <span className="text-lg">⋯</span>
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            
            {/* ✅ EMPTY STATE */}
            {animals.length === 0 && (
                <div className="text-center py-12">
                    <div className="text-gray-400 text-lg mb-2">🏥</div>
                    <div className="text-gray-500">Nincs állat ebben a kórház karámban</div>
                    <div className="text-xs text-gray-400 mt-2">
                        A kórház karám a beteg vagy sérült állatoknak a helye
                    </div>
                </div>
            )}
        </div>
    );
};