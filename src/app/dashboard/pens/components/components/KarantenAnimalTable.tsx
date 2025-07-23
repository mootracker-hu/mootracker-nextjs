import React from 'react';
import Link from 'next/link';
import { WeightCell } from '@/components/shared/WeightCell';

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
    // Karantén-specifikus mezők
    quarantine_reason?: string;
    quarantine_start?: string;
    expected_release?: string;
    observation_points?: string;
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

// 🔒 KARANTÉN TÁBLÁZAT - Clean & Optimized + WeightCell
export const KarantenAnimalTable: React.FC<AnimalTableProps> = ({
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
                                🔒 Karantén oka
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                📅 Karantén kezdete
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                🔓 Várható feloldás
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                👁️ Megfigyelési pontok
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
                            
                            // Karantén időtartam számítás
                            const getQuarantineDuration = (startDate?: string) => {
                                if (!startDate) return null;
                                
                                const start = new Date(startDate);
                                const today = new Date();
                                const diffDays = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                                
                                return diffDays;
                            };

                            // Feloldás státusz színezés
                            const getReleaseStatus = (releaseDate?: string) => {
                                if (!releaseDate) return 'text-gray-500';
                                
                                const release = new Date(releaseDate);
                                const today = new Date();
                                const diffDays = Math.ceil((release.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                                
                                if (diffDays < 0) return 'text-green-600 font-medium'; // Feloldható
                                if (diffDays <= 3) return 'text-orange-600 font-medium'; // Hamarosan
                                return 'text-blue-600'; // Még várakozik
                            };

                            // Karantén ok színezés
                            const getQuarantineReasonColor = (reason?: string) => {
                                if (!reason) return 'bg-gray-100 text-gray-800';
                                
                                const lowerReason = reason.toLowerCase();
                                if (lowerReason.includes('beteg') || lowerReason.includes('fertőzés')) {
                                    return 'bg-red-100 text-red-800';
                                }
                                if (lowerReason.includes('új') || lowerReason.includes('vásárolt')) {
                                    return 'bg-blue-100 text-blue-800';
                                }
                                if (lowerReason.includes('gyanús')) {
                                    return 'bg-yellow-100 text-yellow-800';
                                }
                                return 'bg-purple-100 text-purple-800';
                            };
                            
                            const quarantineDays = getQuarantineDuration(animal.quarantine_start);
                            
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
                                                🐮 {animal.enar}
                                            </span>
                                        ) : (
                                            <Link 
                                                href={`/dashboard/animals/${encodeURIComponent(animal.enar)}`} 
                                                className="text-blue-600 hover:text-blue-800 font-medium"
                                            >
                                                {animal.enar}
                                            </Link>
                                        )}
                                    </td>
                                    
                                    {/* ✅ NÉV */}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                        {animal.name || '-'}
                                    </td>
                                    
                                    {/* ✅ KARANTÉN OKA - Színkódolt badge */}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        {animal.quarantine_reason ? (
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getQuarantineReasonColor(animal.quarantine_reason)}`}>
                                                🔒 {animal.quarantine_reason}
                                            </span>
                                        ) : (
                                            <span className="text-gray-400">-</span>
                                        )}
                                    </td>
                                    
                                    {/* ✅ KARANTÉN KEZDETE - Időtartammal */}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {animal.quarantine_start ? (
                                            <div>
                                                <div className="font-medium">{formatDate(animal.quarantine_start)}</div>
                                                {quarantineDays !== null && (
                                                    <div className="text-xs text-gray-500">
                                                        📅 {quarantineDays} napja
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            '-'
                                        )}
                                    </td>
                                    
                                    {/* ✅ VÁRHATÓ FELOLDÁS - Státusz színkódolással */}
                                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${getReleaseStatus(animal.expected_release)}`}>
                                        {animal.expected_release ? (
                                            <div>
                                                <div className="font-medium">{formatDate(animal.expected_release)}</div>
                                                {(() => {
                                                    const release = new Date(animal.expected_release);
                                                    const today = new Date();
                                                    const diffDays = Math.ceil((release.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                                                    
                                                    if (diffDays < 0) {
                                                        return <div className="text-xs">✅ Feloldható</div>;
                                                    } else if (diffDays <= 3) {
                                                        return <div className="text-xs">⏰ {diffDays} nap múlva</div>;
                                                    } else {
                                                        return <div className="text-xs">🔒 {diffDays} nap múlva</div>;
                                                    }
                                                })()}
                                            </div>
                                        ) : (
                                            '-'
                                        )}
                                    </td>
                                    
                                    {/* ✅ MEGFIGYELÉSI PONTOK */}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {animal.observation_points ? (
                                            <div className="max-w-32 truncate" title={animal.observation_points}>
                                                👁️ {animal.observation_points}
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
                    <div className="text-gray-400 text-lg mb-2">🔒</div>
                    <div className="text-gray-500">Nincs állat ebben a karantén karámban</div>
                    <div className="text-xs text-gray-400 mt-2">
                        A karantén karám az új, beteg vagy gyanús állatoknak a helye
                    </div>
                </div>
            )}
        </div>
    );
};