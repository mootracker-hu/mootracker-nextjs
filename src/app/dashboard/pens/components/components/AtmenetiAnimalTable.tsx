import React from 'react';
import Link from 'next/link';
import { WeightCell } from '@/components/shared/WeightCell';
import AgeCell from '@/components/shared/AgeCell';

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
    // Átmeneti-specifikus mezők
    transfer_reason?: string;
    decision_deadline?: string;
    target_pen_candidates?: string;
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

// 🔄 ÁTMENETI TÁBLÁZAT - Clean & Optimized + WeightCell + AgeCell
export const AtmenetiAnimalTable: React.FC<AnimalTableProps> = ({
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
                                🔄 Áthelyezés oka
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                📅 Döntési határidő
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                🎯 Célkarám jelöltek
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                🎂 Életkor
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
                            
                            // Döntési határidő státusz színezés
                            const getDeadlineStatus = (deadline?: string) => {
                                if (!deadline) return 'text-gray-500';
                                
                                const deadlineDate = new Date(deadline);
                                const today = new Date();
                                const diffDays = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                                
                                if (diffDays < 0) return 'text-red-600 font-bold'; // Lejárt
                                if (diffDays <= 3) return 'text-orange-600 font-medium'; // Sürgős
                                return 'text-green-600'; // Rendben
                            };
                            
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
                                    
                                    {/* ✅ ÁTHELYEZÉS OKA */}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {animal.transfer_reason ? (
                                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-yellow-100 text-yellow-800">
                                                🔄 {animal.transfer_reason}
                                            </span>
                                        ) : (
                                            <span className="text-gray-400">-</span>
                                        )}
                                    </td>
                                    
                                    {/* ✅ DÖNTÉSI HATÁRIDŐ - Színkódolt sürgősség szerint */}
                                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${getDeadlineStatus(animal.decision_deadline)}`}>
                                        {animal.decision_deadline ? (
                                            <div>
                                                <div>{formatDate(animal.decision_deadline)}</div>
                                                {(() => {
                                                    const deadlineDate = new Date(animal.decision_deadline);
                                                    const today = new Date();
                                                    const diffDays = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                                                    
                                                    if (diffDays < 0) {
                                                        return <div className="text-xs">⚠️ {Math.abs(diffDays)} napja lejárt</div>;
                                                    } else if (diffDays <= 3) {
                                                        return <div className="text-xs">⏰ {diffDays} nap maradt</div>;
                                                    } else {
                                                        return <div className="text-xs">✅ {diffDays} nap maradt</div>;
                                                    }
                                                })()}
                                            </div>
                                        ) : (
                                            '-'
                                        )}
                                    </td>
                                    
                                    {/* ✅ CÉLKARÁM JELÖLTEK */}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {animal.target_pen_candidates ? (
                                            <div className="max-w-32 truncate" title={animal.target_pen_candidates}>
                                                🎯 {animal.target_pen_candidates}
                                            </div>
                                        ) : (
                                            <span className="text-gray-400">-</span>
                                        )}
                                    </td>
                                    
                                    {/* ✅ ÚJ: ÉLETKOR OSZLOP - AgeCell automatikus színezéssel */}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                       <AgeCell birthDate={animal.szuletesi_datum || animal.birth_date || ''} />
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
                    <div className="text-gray-400 text-lg mb-2">🔄</div>
                    <div className="text-gray-500">Nincs állat ebben az átmeneti karámban</div>
                    <div className="text-xs text-gray-400 mt-2">
                        Az átmeneti karám azoknak az állatoknak a helye, amelyek áthelyezésre várnak
                    </div>
                </div>
            )}
        </div>
    );
};