import React from 'react';
import Link from 'next/link';
import { WeightCell } from '@/components/shared/WeightCell';
import { AgeCell } from '@/components/shared/AgeCell';  // ← ÚJ IMPORT

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
    // Selejt-specifikus mezők
    culling_reason?: string;
    culling_date?: string;
    sales_plan?: string;
    estimated_value?: number;
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

// Segédfunkciók (eredeti kódból)
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

// 📦 SELEJT TÁBLÁZAT - Eredeti funkcionalitás + WeightCell + AgeCell
export const SelejtAnimalTable: React.FC<AnimalTableProps> = ({
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
                                📦 Selejtezés oka
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                📅 Selejtezés dátuma
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                📋 Értékesítési terv
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                💰 Becsült érték
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
                            
                            // Selejtezés ok színezés (eredeti logika alapján)
                            const getCullingReasonColor = (reason?: string) => {
                                if (!reason) return 'bg-gray-100 text-gray-800';
                                
                                const lowerReason = reason.toLowerCase();
                                if (lowerReason.includes('betegség') || lowerReason.includes('sérülés')) {
                                    return 'bg-red-100 text-red-800';
                                }
                                if (lowerReason.includes('termelékenység') || lowerReason.includes('teljesítmény')) {
                                    return 'bg-orange-100 text-orange-800';
                                }
                                if (lowerReason.includes('kor') || lowerReason.includes('öregedés')) {
                                    return 'bg-blue-100 text-blue-800';
                                }
                                if (lowerReason.includes('gazdasági') || lowerReason.includes('költség')) {
                                    return 'bg-purple-100 text-purple-800';
                                }
                                return 'bg-gray-100 text-gray-800';
                            };

                            // Értékesítési terv színezés
                            const getSalesPlanColor = (plan?: string) => {
                                if (!plan) return 'text-gray-500';
                                
                                const lowerPlan = plan.toLowerCase();
                                if (lowerPlan.includes('vágóhíd') || lowerPlan.includes('levágás')) {
                                    return 'text-red-600 font-medium';
                                }
                                if (lowerPlan.includes('eladás') || lowerPlan.includes('értékesítés')) {
                                    return 'text-green-600 font-medium';
                                }
                                return 'text-blue-600 font-medium';
                            };
                            
                            return (
                                <tr 
                                    key={getSafeKey(animal, index)}
                                    className={`hover:bg-gray-50 transition-colors ${
                                        selectedAnimals.includes(animal.id) ? 'bg-blue-50' : ''
                                    } ${isClickable ? 'cursor-pointer' : ''}`}
                                    onClick={isClickable ? () => handleAnimalClick(animal) : undefined}
                                >
                                    {/* ✅ CHECKBOX - eredeti logika */}
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <input
                                            type="checkbox"
                                            checked={selectedAnimals.includes(animal.id)}
                                            onChange={() => onToggleAnimal(animal.id)}
                                            className="rounded border-gray-300"
                                        />
                                    </td>
                                    
                                    {/* ✅ ENAR - eredeti logika */}
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
                                    
                                    {/* ✅ SELEJTEZÉS OKA - eredeti logika + színezés */}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        {animal.culling_reason ? (
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCullingReasonColor(animal.culling_reason)}`}>
                                                📦 {animal.culling_reason}
                                            </span>
                                        ) : (
                                            <span className="text-gray-400">-</span>
                                        )}
                                    </td>
                                    
                                    {/* ✅ SELEJTEZÉS DÁTUMA - eredeti logika */}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {animal.culling_date ? (
                                            <div className="font-medium text-red-600">
                                                {formatDate(animal.culling_date)}
                                            </div>
                                        ) : (
                                            <span className="text-gray-400">-</span>
                                        )}
                                    </td>
                                    
                                    {/* ✅ ÉRTÉKESÍTÉSI TERV - eredeti logika */}
                                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${getSalesPlanColor(animal.sales_plan)}`}>
                                        {animal.sales_plan ? (
                                            <div>
                                                📋 {animal.sales_plan}
                                            </div>
                                        ) : (
                                            <span className="text-gray-400">-</span>
                                        )}
                                    </td>
                                    
                                    {/* ✅ BECSÜLT ÉRTÉK - eredeti logika */}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {animal.estimated_value ? (
                                            <div className="font-medium text-green-600">
                                                💰 {animal.estimated_value.toLocaleString('hu-HU')} Ft
                                            </div>
                                        ) : (
                                            <span className="text-gray-400">-</span>
                                        )}
                                    </td>
                                    
                                    {/* ✅ ÚJ: ÉLETKOR OSZLOP - AgeCell automatikus színezéssel */}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        <AgeCell birthDate={animal.szuletesi_datum || animal.birth_date} />
                                    </td>
                                    
                                    {/* ✅ SÚLYMÉRÉS - REFAKTORÁLT: WeightCell komponens */}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        <WeightCell 
                                            weight={animal.current_weight} 
                                            lastMeasured={animal.last_weight_measured_at} 
                                        />
                                    </td>
                                    
                                    {/* ✅ FELJEGYZÉS - eredeti logika */}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {animal.notes || '-'}
                                    </td>
                                    
                                    {/* ✅ MŰVELETEK - eredeti logika */}
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
                    <div className="text-gray-400 text-lg mb-2">📦</div>
                    <div className="text-gray-500">Nincs állat ebben a selejt karámban</div>
                    <div className="text-xs text-gray-400 mt-2">
                        A selejt karám az értékesítésre/kivonásra szánt állatoknak a helye
                    </div>
                </div>
            )}
        </div>
    );
};