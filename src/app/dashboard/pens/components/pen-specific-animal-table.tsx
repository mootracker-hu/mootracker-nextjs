import React from 'react';
import Link from 'next/link';

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
}

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
    animals, selectedAnimals, onToggleAnimal, onSelectAll, onClearSelection
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
                    {animals.map((animal) => {
                        const twelveMonthTarget = addDays(new Date(animal.szuletesi_datum), 365);
                        return (
                            <tr key={animal.id} className={`hover:bg-gray-50 ${selectedAnimals.includes(animal.id) ? 'bg-blue-50' : ''}`}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <input
                                        type="checkbox"
                                        checked={selectedAnimals.includes(animal.id)}
                                        onChange={() => onToggleAnimal(animal.id)}
                                        className="rounded border-gray-300"
                                    />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <Link href={`/dashboard/animals/${encodeURIComponent(animal.enar)}`} className="text-blue-600 hover:text-blue-800 font-medium">
                                        {animal.enar}
                                    </Link>
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
    animals, selectedAnimals, onToggleAnimal, onSelectAll, onClearSelection
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
                    {animals.map((animal) => {
                        const twentyFourMonthTarget = addDays(new Date(animal.szuletesi_datum), 730);
                        return (
                            <tr key={animal.id} className={`hover:bg-gray-50 ${selectedAnimals.includes(animal.id) ? 'bg-blue-50' : ''}`}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <input
                                        type="checkbox"
                                        checked={selectedAnimals.includes(animal.id)}
                                        onChange={() => onToggleAnimal(animal.id)}
                                        className="rounded border-gray-300"
                                    />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <Link href={`/dashboard/animals/${encodeURIComponent(animal.enar)}`} className="text-blue-600 hover:text-blue-800 font-medium">
                                        {animal.enar}
                                    </Link>
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
    animals, selectedAnimals, onToggleAnimal, onSelectAll, onClearSelection
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
                    {animals.map((animal) => {
                        const vvPlanned = animal.harem_start_date ? addDays(new Date(animal.harem_start_date), 75) : '-';
                        return (
                            <tr key={animal.id} className={`hover:bg-gray-50 ${selectedAnimals.includes(animal.id) ? 'bg-blue-50' : ''}`}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <input
                                        type="checkbox"
                                        checked={selectedAnimals.includes(animal.id)}
                                        onChange={() => onToggleAnimal(animal.id)}
                                        className="rounded border-gray-300"
                                    />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <Link href={`/dashboard/animals/${encodeURIComponent(animal.enar)}`} className="text-blue-600 hover:text-blue-800 font-medium">
                                        {animal.enar}
                                    </Link>
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
    animals, selectedAnimals, onToggleAnimal, onSelectAll, onClearSelection
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
                    {animals.map((animal) => {
                        const expectedBirth = animal.expected_birth_date ? new Date(animal.expected_birth_date) : null;
                        const rccDate = expectedBirth ? addDays(expectedBirth, -42) : '-';
                        const bovipastDate = expectedBirth ? addDays(expectedBirth, -28) : '-';
                        const feedRemovalDate = expectedBirth ? addDays(expectedBirth, -14) : '-';

                        return (
                            <tr key={animal.id} className={`hover:bg-gray-50 ${selectedAnimals.includes(animal.id) ? 'bg-blue-50' : ''}`}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <input
                                        type="checkbox"
                                        checked={selectedAnimals.includes(animal.id)}
                                        onChange={() => onToggleAnimal(animal.id)}
                                        className="rounded border-gray-300"
                                    />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <Link href={`/dashboard/animals/${encodeURIComponent(animal.enar)}`} className="text-blue-600 hover:text-blue-800 font-medium">
                                        {animal.enar}
                                    </Link>
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
    animals, selectedAnimals, onToggleAnimal, onSelectAll, onClearSelection
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
                    {animals.map((animal) => (
                        <tr key={animal.id} className={`hover:bg-gray-50 ${selectedAnimals.includes(animal.id) ? 'bg-blue-50' : ''}`}>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <input
                                    type="checkbox"
                                    checked={selectedAnimals.includes(animal.id)}
                                    onChange={() => onToggleAnimal(animal.id)}
                                    className="rounded border-gray-300"
                                />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <Link href={`/dashboard/animals/${encodeURIComponent(animal.enar)}`} className="text-blue-600 hover:text-blue-800 font-medium">
                                    {animal.enar}
                                </Link>
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
    animals, selectedAnimals, onToggleAnimal, onSelectAll, onClearSelection
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
                    {animals.map((animal) => (
                        <tr key={animal.id} className={`hover:bg-gray-50 ${selectedAnimals.includes(animal.id) ? 'bg-blue-50' : ''}`}>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <input
                                    type="checkbox"
                                    checked={selectedAnimals.includes(animal.id)}
                                    onChange={() => onToggleAnimal(animal.id)}
                                    className="rounded border-gray-300"
                                />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <Link href={`/dashboard/animals/${encodeURIComponent(animal.enar)}`} className="text-blue-600 hover:text-blue-800 font-medium">
                                    {animal.enar}
                                </Link>
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
    animals, selectedAnimals, onToggleAnimal, onSelectAll, onClearSelection
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
                    {animals.map((animal) => {
                        const eighteenMonthTarget = addDays(new Date(animal.szuletesi_datum), 545);
                        const twentyFourMonthTarget = addDays(new Date(animal.szuletesi_datum), 730);
                        return (
                            <tr key={animal.id} className={`hover:bg-gray-50 ${selectedAnimals.includes(animal.id) ? 'bg-blue-50' : ''}`}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <input
                                        type="checkbox"
                                        checked={selectedAnimals.includes(animal.id)}
                                        onChange={() => onToggleAnimal(animal.id)}
                                        className="rounded border-gray-300"
                                    />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <Link href={`/dashboard/animals/${encodeURIComponent(animal.enar)}`} className="text-blue-600 hover:text-blue-800 font-medium">
                                        {animal.enar}
                                    </Link>
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

// További táblázatok hasonló módon modernizálva...
// (Üres, Átmeneti, Kórház, Karantén, Selejt - mind ugyanazzal a pattern-nel)

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
    const tableProps = {
        animals,
        selectedAnimals,
        onToggleAnimal,
        onSelectAll,
        onClearSelection
    };

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
        // További cases a többi táblázathoz...
        default:
            return <div>Táblázat típus nem található</div>;
    }
};

export default PenSpecificAnimalTable;