import React, { useState } from 'react';
import Link from 'next/link';
// A meglévő importok után add hozzá:
import { createClient } from '@/lib/supabase/client';

// TypeScript típusok
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

const getSafeKey = (animal: Animal, index: number): string => {
    // 1. Ha van ID és nem NaN, használd azt + index-szel
    if (animal.id && animal.id !== 'NaN' && animal.id !== '') {
        return `${animal.id}-${index}`;
    }
    // 2. Ha van ENAR, használd azt + index-szel
    if (animal.enar) {
        return `enar-${animal.enar}-${index}`;
    }
    // 3. Végső fallback
    return `fallback-${index}-${Math.random().toString(36).substr(2, 9)}`;
};

// Segédfunkciók
const calculateAge = (birthDate: string): string => {
    const birth = new Date(birthDate);
    const today = new Date();
    const ageInDays = Math.floor((today.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24));
    const ageInMonths = Math.floor(ageInDays / 30.44);

    if (ageInMonths < 12) {
        return `${ageInMonths} hónap`;
    }
    return `${Math.floor(ageInMonths / 12)} év ${ageInMonths % 12} hónap`;
};

const addDays = (date: Date, days: number): string => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result.toLocaleDateString('hu-HU');
};

const formatDate = (dateString?: string): string => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('hu-HU');
};

// 🍼 BÖLCSI TÁBLÁZAT - DESIGN SYSTEM MODERNIZED
const BolcsiAnimalTable: React.FC<AnimalTableProps> = ({
    animals, selectedAnimals, onToggleAnimal, onSelectAll, onClearSelection, handleAnimalClick
}) => {
    return (
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
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
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">🏷️ ENAR</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">📅 Születési dátum</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">🎯 12 hónapos ekkor</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">📝 Feljegyzés</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">⚙️ Műveletek</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {animals.map((animal, index) => {
                        const twelveMonthTarget = addDays(new Date(animal.szuletesi_datum), 365);
                        return (
                            <tr key={getSafeKey(animal, index)}
                                className={`hover:bg-gray-50 cursor-pointer ${selectedAnimals.includes(animal.id) ? 'bg-blue-50' : ''}`}
                                onClick={() => handleAnimalClick(animal)}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <input
                                        type="checkbox"
                                        checked={selectedAnimals.includes(animal.id)}
                                        onChange={() => onToggleAnimal(animal.id)}
                                        className="rounded border-gray-300"
                                    />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {animal.enar && (animal.enar.includes('/') || animal.enar.startsWith('temp-')) ? (
    <span className="text-orange-600 font-medium cursor-pointer hover:text-orange-800">
        🐮 {animal.enar}
    </span>
) : (
    <Link href={`/dashboard/animals/${encodeURIComponent(animal.enar)}`} className="text-blue-600 hover:text-blue-800 font-medium">
        {animal.enar}
    </Link>
)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {formatDate(animal.szuletesi_datum)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium text-orange-600">
                                    {twelveMonthTarget}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {animal.notes || '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <button className="text-gray-400 hover:text-gray-600">
                                        <span className="text-lg">⋯</span>
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

// 🎓 ÓVI TÁBLÁZAT - DESIGN SYSTEM MODERNIZED
const OviAnimalTable: React.FC<AnimalTableProps> = ({
    animals, selectedAnimals, onToggleAnimal, onSelectAll, onClearSelection, handleAnimalClick
}) => {
    return (
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
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
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">🏷️ ENAR</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">📅 Születési dátum</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">🎯 24 hónapos ekkor</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">📝 Feljegyzés</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">⚙️ Műveletek</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {animals.map((animal, index) => {
                        const twentyFourMonthTarget = addDays(new Date(animal.szuletesi_datum), 730);
                        return (
                            <tr key={getSafeKey(animal, index)}
                                className={`hover:bg-gray-50 cursor-pointer ${selectedAnimals.includes(animal.id) ? 'bg-blue-50' : ''}`}
                                onClick={() => handleAnimalClick(animal)}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <input
                                        type="checkbox"
                                        checked={selectedAnimals.includes(animal.id)}
                                        onChange={() => onToggleAnimal(animal.id)}
                                        className="rounded border-gray-300"
                                    />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {animal.enar && (animal.enar.includes('/') || animal.enar.startsWith('temp-')) ? (
    <span className="text-orange-600 font-medium cursor-pointer hover:text-orange-800">
        🐮 {animal.enar}
    </span>
) : (
    <Link href={`/dashboard/animals/${encodeURIComponent(animal.enar)}`} className="text-blue-600 hover:text-blue-800 font-medium">
        {animal.enar}
    </Link>
)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {formatDate(animal.szuletesi_datum)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium text-purple-600">
                                    {twentyFourMonthTarget}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {animal.notes || '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <button className="text-gray-400 hover:text-gray-600">
                                        <span className="text-lg">⋯</span>
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

// 👑 HÁREM TÁBLÁZAT - DESIGN SYSTEM MODERNIZED
const HaremAnimalTable: React.FC<AnimalTableProps> = ({
    animals, selectedAnimals, onToggleAnimal, onSelectAll, onClearSelection, handleAnimalClick
}) => {
    return (
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
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
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">🏷️ ENAR</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">📛 Név</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">💕 Hárem kezdete</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">🔬 VV tervezett</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">✅ VV eredmény</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">🍼 Várható ellés</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">📝 Feljegyzés</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">⚙️ Műveletek</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {animals.map((animal, index) => {
                        const vvPlanned = animal.harem_start_date ? addDays(new Date(animal.harem_start_date), 75) : '-';
                        return (
                            <tr key={getSafeKey(animal, index)}
                                className={`hover:bg-gray-50 cursor-pointer ${selectedAnimals.includes(animal.id) ? 'bg-blue-50' : ''}`}
                                onClick={() => handleAnimalClick(animal)}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <input
                                        type="checkbox"
                                        checked={selectedAnimals.includes(animal.id)}
                                        onChange={() => onToggleAnimal(animal.id)}
                                        className="rounded border-gray-300"
                                    />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {animal.enar && (animal.enar.includes('/') || animal.enar.startsWith('temp-')) ? (
    <span className="text-orange-600 font-medium cursor-pointer hover:text-orange-800">
        🐮 {animal.enar}
    </span>
) : (
    <Link href={`/dashboard/animals/${encodeURIComponent(animal.enar)}`} className="text-blue-600 hover:text-blue-800 font-medium">
        {animal.enar}
    </Link>
)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                    {animal.name || '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {formatDate(animal.harem_start_date)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium text-blue-600">
                                    {vvPlanned}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {animal.vv_result ? (
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${animal.vv_result === 'vemhes' ? 'bg-green-100 text-green-800' :
                                            animal.vv_result === 'ures' ? 'bg-red-100 text-red-800' :
                                                'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {animal.vv_result === 'vemhes' ? '🤰 Vemhes' :
                                                animal.vv_result === 'ures' ? '❌ Üres' : '🌱 Csíra'}
                                        </span>
                                    ) : (
                                        <span className="text-gray-400">-</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium text-green-600">
                                    {formatDate(animal.expected_birth_date)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {animal.notes || '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <button className="text-gray-400 hover:text-gray-600">
                                        <span className="text-lg">⋯</span>
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

// 🤰 VEMHES TÁBLÁZAT - DESIGN SYSTEM MODERNIZED
const VemhesAnimalTable: React.FC<AnimalTableProps> = ({
    animals, selectedAnimals, onToggleAnimal, onSelectAll, onClearSelection, handleAnimalClick
}) => {
    return (
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
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
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">🏷️ ENAR</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">📛 Név</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">🍼 Várható ellés</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">💉 RCC ideje</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">💉 BoviPast ideje</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">🚫 Abrak elvétel</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">📝 Feljegyzés</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">⚙️ Műveletek</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {animals.map((animal, index) => {
                        const expectedBirth = animal.expected_birth_date ? new Date(animal.expected_birth_date) : null;
                        const rccDate = expectedBirth ? addDays(expectedBirth, -42) : '-';
                        const bovipastDate = expectedBirth ? addDays(expectedBirth, -28) : '-';
                        const feedRemovalDate = expectedBirth ? addDays(expectedBirth, -14) : '-';

                        return (
                            <tr key={getSafeKey(animal, index)}
                                className={`hover:bg-gray-50 cursor-pointer ${selectedAnimals.includes(animal.id) ? 'bg-blue-50' : ''}`}
                                onClick={() => handleAnimalClick(animal)}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <input
                                        type="checkbox"
                                        checked={selectedAnimals.includes(animal.id)}
                                        onChange={() => onToggleAnimal(animal.id)}
                                        className="rounded border-gray-300"
                                    />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {animal.enar && (animal.enar.includes('/') || animal.enar.startsWith('temp-')) ? (
    <span className="text-orange-600 font-medium cursor-pointer hover:text-orange-800">
        🐮 {animal.enar}
    </span>
) : (
    <Link href={`/dashboard/animals/${encodeURIComponent(animal.enar)}`} className="text-blue-600 hover:text-blue-800 font-medium">
        {animal.enar}
    </Link>
)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                    {animal.name || '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium text-green-600">
                                    {formatDate(animal.expected_birth_date)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium text-red-600">
                                    {rccDate}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium text-orange-600">
                                    {bovipastDate}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium text-blue-600">
                                    {feedRemovalDate}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {animal.notes || '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <button className="text-gray-400 hover:text-gray-600">
                                        <span className="text-lg">⋯</span>
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

// 🍼 ELLETŐ TÁBLÁZAT - DESIGN SYSTEM MODERNIZED
const ElletoAnimalTable: React.FC<AnimalTableProps> = ({
    animals, selectedAnimals, onToggleAnimal, onSelectAll, onClearSelection, handleAnimalClick
}) => {
    return (
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
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
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">🏷️ ENAR</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">📛 Név</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">🍼 Ellés időpontja</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">🌟 Ellés lefolyása</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">⚥ Borjú neme</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">🏷️ Borjú ENAR</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">📝 Feljegyzés</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">⚙️ Műveletek</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {animals.map((animal, index) => (
                        <tr key={getSafeKey(animal, index)}
                            className={`hover:bg-gray-50 cursor-pointer ${selectedAnimals.includes(animal.id) ? 'bg-blue-50' : ''}`}
                            onClick={() => handleAnimalClick(animal)}>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <input
                                    type="checkbox"
                                    checked={selectedAnimals.includes(animal.id)}
                                    onChange={() => onToggleAnimal(animal.id)}
                                    className="rounded border-gray-300"
                                />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                {animal.enar && (animal.enar.includes('/') || animal.enar.startsWith('temp-')) ? (
    <span className="text-orange-600 font-medium cursor-pointer hover:text-orange-800">
        🐮 {animal.enar}
    </span>
) : (
    <Link href={`/dashboard/animals/${encodeURIComponent(animal.enar)}`} className="text-blue-600 hover:text-blue-800 font-medium">
        {animal.enar}
    </Link>
)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                {animal.name || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium text-green-600">
                                {formatDate(animal.birth_date)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800`}>
                                    🍼 Természetes
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                {animal.calf_gender ? (
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${animal.calf_gender === 'hímivar' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'
                                        }`}>
                                        {animal.calf_gender === 'hímivar' ? '♂ Hímivar' : '♀ Nőivar'}
                                    </span>
                                ) : (
                                    <span className="text-gray-400">-</span>
                                )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                {animal.calf_enar || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {animal.notes || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <button className="text-gray-400 hover:text-gray-600">
                                    <span className="text-lg">⋯</span>
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

// 🐄 TEHÉN TÁBLÁZAT - DESIGN SYSTEM MODERNIZED
const TehenAnimalTable: React.FC<AnimalTableProps> = ({
    animals, selectedAnimals, onToggleAnimal, onSelectAll, onClearSelection, handleAnimalClick
}) => {
    return (
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
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
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">🏷️ ENAR</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">📛 Név</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">🍼 Ellés dátuma</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">🏷️ Borjú ENAR</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">⚥ Borjú neme</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">🔬 Következő VV</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">📝 Feljegyzés</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">⚙️ Műveletek</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {animals.map((animal, index) => (
                        <tr key={getSafeKey(animal, index)}
                            className={`hover:bg-gray-50 cursor-pointer ${selectedAnimals.includes(animal.id) ? 'bg-blue-50' : ''}`}
                            onClick={() => handleAnimalClick(animal)}>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <input
                                    type="checkbox"
                                    checked={selectedAnimals.includes(animal.id)}
                                    onChange={() => onToggleAnimal(animal.id)}
                                    className="rounded border-gray-300"
                                />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                {animal.enar && (animal.enar.includes('/') || animal.enar.startsWith('temp-')) ? (
    <span className="text-orange-600 font-medium cursor-pointer hover:text-orange-800">
        🐮 {animal.enar}
    </span>
) : (
    <Link href={`/dashboard/animals/${encodeURIComponent(animal.enar)}`} className="text-blue-600 hover:text-blue-800 font-medium">
        {animal.enar}
    </Link>
)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                {animal.name || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium text-green-600">
                                {formatDate(animal.birth_date)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                {animal.calf_enar || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                {animal.calf_gender ? (
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${animal.calf_gender === 'hímivar' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'
                                        }`}>
                                        {animal.calf_gender === 'hímivar' ? '♂ Hímivar' : '♀ Nőivar'}
                                    </span>
                                ) : (
                                    <span className="text-gray-400">-</span>
                                )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium text-blue-600">
                                {formatDate(animal.expected_birth_date)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {animal.notes || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <button className="text-gray-400 hover:text-gray-600">
                                    <span className="text-lg">⋯</span>
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Linkek más modulokra - EMOJI IKONOKKAL MODERNIZÁLVA */}
            <div className="bg-gray-50 px-6 py-3 border-t">
                <div className="flex space-x-4">
                    <Link href="/dashboard/weighing" className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800">
                        📏 Súlymérés modul
                    </Link>
                    <Link href="/dashboard/vaccination" className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800">
                        💉 Vakcinázás modul
                    </Link>
                    <Link href="/dashboard/breeding" className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800">
                        🔬 VV eredmények
                    </Link>
                </div>
            </div>
        </div>
    );
};

// 💪 HÍZÓBIKA TÁBLÁZAT - DESIGN SYSTEM MODERNIZED  
const HizoikaAnimalTable: React.FC<AnimalTableProps> = ({
    animals, selectedAnimals, onToggleAnimal, onSelectAll, onClearSelection, handleAnimalClick
}) => {
    return (
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
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
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">🏷️ ENAR</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">📅 Születési dátum</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">🎯 18 hónapos ekkor</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">🎯 24 hónapos ekkor</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">📝 Feljegyzés</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">⚙️ Műveletek</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {animals.map((animal, index) => {
                        const eighteenMonthTarget = addDays(new Date(animal.szuletesi_datum), 545);
                        const twentyFourMonthTarget = addDays(new Date(animal.szuletesi_datum), 730);
                        return (
                            <tr key={getSafeKey(animal, index)}
                                className={`hover:bg-gray-50 cursor-pointer ${selectedAnimals.includes(animal.id) ? 'bg-blue-50' : ''}`}
                                onClick={() => handleAnimalClick(animal)}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <input
                                        type="checkbox"
                                        checked={selectedAnimals.includes(animal.id)}
                                        onChange={() => onToggleAnimal(animal.id)}
                                        className="rounded border-gray-300"
                                    />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {animal.enar && (animal.enar.includes('/') || animal.enar.startsWith('temp-')) ? (
    <span className="text-orange-600 font-medium cursor-pointer hover:text-orange-800">
        🐮 {animal.enar}
    </span>
) : (
    <Link href={`/dashboard/animals/${encodeURIComponent(animal.enar)}`} className="text-blue-600 hover:text-blue-800 font-medium">
        {animal.enar}
    </Link>
)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {formatDate(animal.szuletesi_datum)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium text-orange-600">
                                    {eighteenMonthTarget}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium text-red-600">
                                    {twentyFourMonthTarget}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {animal.notes || '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <button className="text-gray-400 hover:text-gray-600">
                                        <span className="text-lg">⋯</span>
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

// 🏥 KÓRHÁZ TÁBLÁZAT
const KorhazAnimalTable: React.FC<AnimalTableProps> = ({
    animals, selectedAnimals, onToggleAnimal, onSelectAll, onClearSelection, handleAnimalClick
}) => {
    return (
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
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
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">🏷️ ENAR</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">🏥 Kezelés típusa</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">📅 Kezelés kezdete</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">👨‍⚕️ Állatorvos</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">📝 Feljegyzés</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">⚙️ Műveletek</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {animals.map((animal, index) => (
                        <tr key={getSafeKey(animal, index)}
                            className={`hover:bg-gray-50 cursor-pointer ${selectedAnimals.includes(animal.id) ? 'bg-blue-50' : ''}`}
                            onClick={() => handleAnimalClick(animal)}>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <input
                                    type="checkbox"
                                    checked={selectedAnimals.includes(animal.id)}
                                    onChange={() => onToggleAnimal(animal.id)}
                                    className="rounded border-gray-300"
                                />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                {animal.enar && (animal.enar.includes('/') || animal.enar.startsWith('temp-')) ? (
    <span className="text-orange-600 font-medium cursor-pointer hover:text-orange-800">
        🐮 {animal.enar}
    </span>
) : (
    <Link href={`/dashboard/animals/${encodeURIComponent(animal.enar)}`} className="text-blue-600 hover:text-blue-800 font-medium">
        {animal.enar}
    </Link>
)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">-</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">-</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">-</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {animal.notes || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <button className="text-gray-400 hover:text-gray-600">
                                    <span className="text-lg">⋯</span>
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

// 🔒 KARANTÉN TÁBLÁZAT
const KarantenAnimalTable: React.FC<AnimalTableProps> = ({
    animals, selectedAnimals, onToggleAnimal, onSelectAll, onClearSelection, handleAnimalClick
}) => {
    return (
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
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
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">🏷️ ENAR</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">🔒 Karantén oka</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">📅 Kezdete</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">👁️ Megfigyelés</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">📝 Feljegyzés</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">⚙️ Műveletek</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {animals.map((animal, index) => (
                        <tr key={getSafeKey(animal, index)}
                            className={`hover:bg-gray-50 cursor-pointer ${selectedAnimals.includes(animal.id) ? 'bg-blue-50' : ''}`}
                            onClick={() => handleAnimalClick(animal)}>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <input
                                    type="checkbox"
                                    checked={selectedAnimals.includes(animal.id)}
                                    onChange={() => onToggleAnimal(animal.id)}
                                    className="rounded border-gray-300"
                                />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                {animal.enar && (animal.enar.includes('/') || animal.enar.startsWith('temp-')) ? (
    <span className="text-orange-600 font-medium cursor-pointer hover:text-orange-800">
        🐮 {animal.enar}
    </span>
) : (
    <Link href={`/dashboard/animals/${encodeURIComponent(animal.enar)}`} className="text-blue-600 hover:text-blue-800 font-medium">
        {animal.enar}
    </Link>
)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">-</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">-</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">-</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {animal.notes || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <button className="text-gray-400 hover:text-gray-600">
                                    <span className="text-lg">⋯</span>
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

// 📦 SELEJT TÁBLÁZAT
const SelejtAnimalTable: React.FC<AnimalTableProps> = ({
    animals, selectedAnimals, onToggleAnimal, onSelectAll, onClearSelection, handleAnimalClick
}) => {
    return (
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
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
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">🏷️ ENAR</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">📦 Selejtezés oka</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">📅 Selejtezés dátuma</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">💰 Becsült érték</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">📝 Feljegyzés</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">⚙️ Műveletek</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {animals.map((animal, index) => (
                        <tr key={getSafeKey(animal, index)}
                            className={`hover:bg-gray-50 cursor-pointer ${selectedAnimals.includes(animal.id) ? 'bg-blue-50' : ''}`}
                            onClick={() => handleAnimalClick(animal)}>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <input
                                    type="checkbox"
                                    checked={selectedAnimals.includes(animal.id)}
                                    onChange={() => onToggleAnimal(animal.id)}
                                    className="rounded border-gray-300"
                                />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                {animal.enar && (animal.enar.includes('/') || animal.enar.startsWith('temp-')) ? (
    <span className="text-orange-600 font-medium cursor-pointer hover:text-orange-800">
        🐮 {animal.enar}
    </span>
) : (
    <Link href={`/dashboard/animals/${encodeURIComponent(animal.enar)}`} className="text-blue-600 hover:text-blue-800 font-medium">
        {animal.enar}
    </Link>
)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">-</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">-</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">-</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {animal.notes || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <button className="text-gray-400 hover:text-gray-600">
                                    <span className="text-lg">⋯</span>
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

// 🔄 ÁTMENETI TÁBLÁZAT
const AtmenetiAnimalTable: React.FC<AnimalTableProps> = ({
    animals, selectedAnimals, onToggleAnimal, onSelectAll, onClearSelection, handleAnimalClick
}) => {
    return (
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
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
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">🏷️ ENAR</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">🔄 Áthelyezés oka</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">📅 Döntési határidő</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">🎯 Célkarám jelöltek</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">📝 Feljegyzés</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">⚙️ Műveletek</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {animals.map((animal, index) => (
                        <tr key={getSafeKey(animal, index)}
                            className={`hover:bg-gray-50 cursor-pointer ${selectedAnimals.includes(animal.id) ? 'bg-blue-50' : ''}`}
                            onClick={() => handleAnimalClick(animal)}>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <input
                                    type="checkbox"
                                    checked={selectedAnimals.includes(animal.id)}
                                    onChange={() => onToggleAnimal(animal.id)}
                                    className="rounded border-gray-300"
                                />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                {animal.enar && (animal.enar.includes('/') || animal.enar.startsWith('temp-')) ? (
    <span className="text-orange-600 font-medium cursor-pointer hover:text-orange-800">
        🐮 {animal.enar}
    </span>
) : (
    <Link href={`/dashboard/animals/${encodeURIComponent(animal.enar)}`} className="text-blue-600 hover:text-blue-800 font-medium">
        {animal.enar}
    </Link>
)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">-</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">-</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">-</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {animal.notes || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <button className="text-gray-400 hover:text-gray-600">
                                    <span className="text-lg">⋯</span>
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

// További táblázatok ugyanígy az eredeti kóddal + getSafeKey...
// (Rövidítve, mert azonos pattern)



// 🎯 FŐ KOMPONENS - SWITCH-CASE LOGIC
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

    // ✅ ITT ADD HOZZÁ EZEKET:
    const [selectedCalfDetails, setSelectedCalfDetails] = useState<any | null>(null);
    const supabase = createClient();

    // Intelligens modal választó függvény
    const handleAnimalClick = async (animal: any) => {
        const isTempId = animal.enar.includes('/') || animal.enar.startsWith('temp-');

        if (isTempId) {
            await fetchCalfDetails(animal.enar);
        } else {
            window.open(`/dashboard/animals/${animal.enar}`, '_blank');
        }
    };

    // Borjú részletek lekérdező függvény
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

    // Helper függvények (calves page-ből)
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
        const age = calculateCalfAge(birthDate); // ✅ Javított név
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

    const tableProps = {
        animals,
        selectedAnimals,
        onToggleAnimal,
        onSelectAll,
        onClearSelection,
        handleAnimalClick // ✅ ÚJ PROP HOZZÁADÁSA
    };

    return (
        <>
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
                        return <HizoikaAnimalTable {...tableProps} />;
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

            {/* ✅ KOMPLEX BORJÚ RÉSZLETEI MODAL */}
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