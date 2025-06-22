// src/app/dashboard/pens/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import AnimalMovementPanel from '../components/animal-movement-panel';
import PenFunctionManager from '../components/pen-function-manager';
import {
    ArrowLeft,
    Users,
    Settings,
    AlertTriangle,
    Calendar,
    MapPin,
    Edit3,
    Move,
    Plus,
    Filter,
    Search,
    Download,
    MoreHorizontal
} from 'lucide-react';

// TypeScript interfaces - egyértelműen definiálva
interface Animal {
    id: number;
    enar: string;
    szuletesi_datum: string;
    ivar: string;
    kategoria: string;
    jelenlegi_karam?: string;
    statusz: string;
    anya_enar?: string;
    apa_enar?: string;
    created_at: string;
    birth_location?: 'nálunk' | 'vásárolt' | 'ismeretlen';
    assigned_at?: string;
    assignment_reason?: string;
}

interface PenDetailsType {
    id: string;
    pen_number: string;
    pen_type: 'outdoor' | 'barn' | 'birthing';
    capacity: number;
    location?: string;
    current_function?: PenFunctionType;
    animal_count: number;
}

interface PenFunctionType {
    id: string;
    function_type: 'bölcsi' | 'óvi' | 'hárem' | 'vemhes' | 'hízóbika' | 'ellető' | 'üres' | 'tehén';
    start_date: string;
    metadata: any;
    notes?: string;
}

export default function PenDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const penId = params.id as string;

    // State management
    const [pen, setPen] = useState<PenDetailsType | null>(null);
    const [animals, setAnimals] = useState<Animal[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedAnimals, setSelectedAnimals] = useState<number[]>([]);
    const [showMovementPanel, setShowMovementPanel] = useState(false);
    const [showFunctionManager, setShowFunctionManager] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    console.log('🔍 PEN DETAILS RENDER:', { 
        pen: pen?.pen_number, 
        loading, 
        hasData: !!pen 
    });

    // Data loading effects
    useEffect(() => {
        fetchPenDetails();
    }, [penId]);

    useEffect(() => {
        if (pen?.id) {
            fetchAnimalsInPen();
        }
    }, [pen?.id]);

    // Animals count update
    useEffect(() => {
        if (pen) {
            setPen(prev => prev ? {...prev, animal_count: animals.length} : null);
        }
    }, [animals.length]);

    // Fetch pen details
    const fetchPenDetails = async () => {
        try {
            console.log('🏠 Fetching pen with ID:', penId);
            setLoading(true);
            setError(null);
            
            // Egyszerű lekérdezés először - nézzük meg létezik-e a karám
            const { data: simplePen, error: simpleError } = await supabase
                .from('pens')
                .select('*')
                .eq('id', penId)
                .single();

            console.log('📊 Simple pen query result:', { simplePen, simpleError });

            if (simpleError) {
                console.error('❌ Simple pen fetch error:', simpleError);
                setError(`Karám nem található: ${simpleError.message}`);
                setLoading(false);
                return;
            }

            if (!simplePen) {
                console.error('❌ No pen found with ID:', penId);
                setError('Karám nem található');
                setLoading(false);
                return;
            }

            // Ha a karám létezik, próbáljuk meg a funkciókat is
            const { data: penFunctions, error: functionsError } = await supabase
                .from('pen_functions')
                .select('*')
                .eq('pen_id', penId);

            console.log('📊 Pen functions query result:', { penFunctions, functionsError });

            // Kombináljuk az adatokat
            const activeFunction = penFunctions?.find((f: any) => f.end_date === null);
            console.log('🎯 Active function found:', activeFunction);
            
            const penWithFunction: PenDetailsType = {
                ...simplePen,
                current_function: activeFunction ? {
                    id: activeFunction.id,
                    function_type: (activeFunction.function_name || 'üres') as PenFunctionType['function_type'],
                    start_date: activeFunction.start_date,
                    metadata: activeFunction.metadata || {},
                    notes: activeFunction.notes
                } : undefined,
                animal_count: 0 // Will be updated when animals load
            };
            
            console.log('✅ Final pen object:', penWithFunction);
            setPen(penWithFunction);
            setLoading(false);

        } catch (err) {
            console.error('💥 fetchPenDetails catch error:', err);
            setError(`Hiba történt a karám betöltésekor: ${err}`);
            setLoading(false);
        }
    };

    // Fetch animals in pen
    const fetchAnimalsInPen = async () => {
        if (!pen?.id) return;
        
        try {
            console.log(`🐄 Állatok betöltése ${pen.pen_number} karamhoz...`);
            
            const { data: assignments, error: assignError } = await supabase
                .from('animal_pen_assignments')
                .select(`
                    animal_id,
                    assigned_at,
                    assignment_reason,
                    animals!inner(
                        id,
                        enar,
                        szuletesi_datum,
                        ivar,
                        kategoria,
                        statusz,
                        anya_enar,
                        apa_enar,
                        birth_location
                    )
                `)
                .eq('pen_id', pen.id)
                .is('removed_at', null);

            if (assignError) {
                console.error('❌ Állatok betöltési hiba:', assignError);
                setError('Nem sikerült betölteni az állatok listáját');
                return;
            }

            console.log(`✅ ${assignments?.length || 0} állat betöltve:`, assignments);
            
            const animalsData: Animal[] = assignments?.map((assignment: any) => ({
                ...assignment.animals,
                assigned_at: assignment.assigned_at,
                assignment_reason: assignment.assignment_reason
            })) || [];

            setAnimals(animalsData);
            
        } catch (err) {
            console.error('💥 fetchAnimalsInPen error:', err);
            setError('Hiba történt az állatok betöltésekor');
        }
    };

    // Helper functions
    const getCategoryEmoji = (kategoria: string): string => {
        const emojiMap: { [key: string]: string } = {
            'nőivarú_borjú': '🐮',
            'szűz_üsző': '🐄',
            'háremben_lévő_üsző': '🐄💕',
            'vemhes_üsző': '🐄💖',
            'üres_üsző': '🐄🚫',
            'csíra': '🐄⚠️',
            'tehén': '🐄🍼',
            'hímivarú_borjú': '🐂',
            'hízóbika': '🐂',
            'tenyészbika': '🐂'
        };
        return emojiMap[kategoria] || '❓';
    };

    const getFunctionEmoji = (functionType: string): string => {
        const emojiMap: { [key: string]: string } = {
            'bölcsi': '🐮',
            'óvi': '🐄',
            'hárem': '🐄💕',
            'vemhes': '🐄💖',
            'hízóbika': '🐂',
            'ellető': '🐄🍼',
            'tehén': '🐄🍼',
            'üres': '⭕'
        };
        return emojiMap[functionType] || '❓';
    };

    const getFunctionColor = (functionType: string): string => {
        const colorMap: { [key: string]: string } = {
            'bölcsi': 'bg-blue-100 text-blue-800 border-blue-200',
            'óvi': 'bg-green-100 text-green-800 border-green-200',
            'hárem': 'bg-pink-100 text-pink-800 border-pink-200',
            'vemhes': 'bg-purple-100 text-purple-800 border-purple-200',
            'hízóbika': 'bg-orange-100 text-orange-800 border-orange-200',
            'ellető': 'bg-red-100 text-red-800 border-red-200',
            'tehén': 'bg-green-100 text-green-800 border-green-200',
            'üres': 'bg-gray-100 text-gray-800 border-gray-200'
        };
        return colorMap[functionType] || 'bg-gray-100 text-gray-800 border-gray-200';
    };

    const getCapacityColor = (current: number, capacity: number): string => {
        const percentage = (current / capacity) * 100;
        if (percentage < 60) return 'text-green-600';
        if (percentage < 80) return 'text-yellow-600';
        if (percentage < 100) return 'text-orange-600';
        return 'text-red-600';
    };

    const calculateAge = (birthDate: string): string => {
        const birth = new Date(birthDate);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - birth.getTime());
        const diffMonths = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30.44));
        if (diffMonths < 12) {
            return `${diffMonths} hó`;
        } else {
            const years = Math.floor(diffMonths / 12);
            const months = diffMonths % 12;
            return `${years} év ${months > 0 ? months + ' hó' : ''}`;
        }
    };

    // Animal selection handlers
    const toggleAnimalSelection = (animalId: number) => {
        setSelectedAnimals(prev =>
            prev.includes(animalId)
                ? prev.filter(id => id !== animalId)
                : [...prev, animalId]
        );
    };

    const selectAllAnimals = () => {
        setSelectedAnimals(filteredAnimals.map(animal => animal.id));
    };

    const clearSelection = () => {
        setSelectedAnimals([]);
    };

    // Filtered animals
    const filteredAnimals = animals.filter((animal: Animal) =>
        animal.enar?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        animal.kategoria?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Loading state
    if (loading) {
        console.log('🔄 LOADING STATE = true, loading screen megjelenítése');
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Karám betöltése...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <AlertTriangle className="h-12 w-12 text-red-600 mx-auto" />
                    <p className="mt-4 text-red-600">{error}</p>
                    <Link 
                        href="/dashboard/pens"
                        className="mt-4 inline-flex items-center text-blue-600 hover:text-blue-800"
                    >
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Vissza a karamokhoz
                    </Link>
                </div>
            </div>
        );
    }

    // No pen data
    if (!pen) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <AlertTriangle className="h-12 w-12 text-gray-600 mx-auto" />
                    <p className="mt-4 text-gray-600">Karám nem található</p>
                    <Link 
                        href="/dashboard/pens"
                        className="mt-4 inline-flex items-center text-blue-600 hover:text-blue-800"
                    >
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Vissza a karamokhoz
                    </Link>
                </div>
            </div>
        );
    }

    console.log('✅ LOADING FALSE, main content megjelenítése');

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center">
                            <Link
                                href="/dashboard/pens"
                                className="mr-4 p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </Link>
                            <h1 className="text-2xl font-bold text-gray-900">
                                Karám {pen.pen_number}
                            </h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            {selectedAnimals.length > 0 && (
                                <button
                                    onClick={() => setShowMovementPanel(true)}
                                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                                >
                                    <Move className="h-4 w-4 mr-2" />
                                    Mozgatás ({selectedAnimals.length})
                                </button>
                            )}
                            <button
                                onClick={() => setShowFunctionManager(true)}
                                className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                            >
                                <Settings className="h-4 w-4 mr-2" />
                                Funkció Kezelés
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Karám információk */}
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {/* Alapadatok */}
                        <div className="md:col-span-2">
                            <div className="bg-gray-50 rounded-lg p-4">
                                <h3 className="text-lg font-medium text-gray-900 mb-3">Karám Adatok</h3>
                                <div className="space-y-2">
                                    <div className="flex items-center">
                                        <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                                        <span className="text-sm text-gray-600">Helye: {pen.location}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <Users className="h-4 w-4 text-gray-400 mr-2" />
                                        <span className={`text-sm font-medium ${getCapacityColor(pen.animal_count, pen.capacity)}`}>
                                            {pen.animal_count} / {pen.capacity} állat
                                        </span>
                                    </div>
                                    <div className="flex items-center">
                                        <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                                        <span className="text-sm text-gray-600">
                                            Funkció kezdete: {pen.current_function?.start_date ? 
                                                new Date(pen.current_function.start_date).toLocaleDateString('hu-HU') : 
                                                'Nincs megadva'
                                            }
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Jelenlegi funkció */}
                        <div>
                            <div className="bg-gray-50 rounded-lg p-4">
                                <h3 className="text-lg font-medium text-gray-900 mb-3">Jelenlegi Funkció</h3>
                                <div className={`px-3 py-2 rounded-full text-sm font-medium border ${getFunctionColor(pen.current_function?.function_type || 'üres')}`}>
                                    {getFunctionEmoji(pen.current_function?.function_type || 'üres')}
                                    {pen.current_function?.function_type ?
                                        pen.current_function.function_type.charAt(0).toUpperCase() + pen.current_function.function_type.slice(1)
                                        : 'Nincs funkció'}
                                </div>
                            </div>
                        </div>

                        {/* Kapacitás kihasználtság */}
                        <div>
                            <div className="bg-gray-50 rounded-lg p-4">
                                <h3 className="text-lg font-medium text-gray-900 mb-3">Kihasználtság</h3>
                                <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                                    <div
                                        className={`h-3 rounded-full transition-all ${pen.animal_count / pen.capacity > 0.8 ? 'bg-red-500' :
                                            pen.animal_count / pen.capacity > 0.6 ? 'bg-yellow-500' : 'bg-green-500'
                                            }`}
                                        style={{ width: `${Math.min((pen.animal_count / pen.capacity) * 100, 100)}%` }}
                                    />
                                </div>
                                <p className="text-sm text-gray-600">
                                    {pen.capacity > 0 ? ((pen.animal_count / pen.capacity) * 100).toFixed(1) : 0}%
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Hárem extra információk */}
                    {pen.current_function?.function_type === 'hárem' && pen.current_function.metadata && (
                        <div className="mt-6 bg-pink-50 border border-pink-200 rounded-lg p-4">
                            <h4 className="font-medium text-pink-800 mb-2">Hárem Információk</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                {pen.current_function.metadata.tenyeszbika_name && (
                                    <div>
                                        <span className="text-pink-600">Tenyészbika:</span>
                                        <p className="font-medium">{pen.current_function.metadata.tenyeszbika_name}</p>
                                        {pen.current_function.metadata.tenyeszbika_enar && (
                                            <p className="text-xs text-pink-600">{pen.current_function.metadata.tenyeszbika_enar}</p>
                                        )}
                                    </div>
                                )}
                                {pen.current_function.metadata.parozas_kezdete && (
                                    <div>
                                        <span className="text-pink-600">Párzás kezdete:</span>
                                        <p className="font-medium">{new Date(pen.current_function.metadata.parozas_kezdete).toLocaleDateString('hu-HU')}</p>
                                    </div>
                                )}
                                {pen.current_function.metadata.vv_esedekessege && (
                                    <div>
                                        <span className="text-pink-600">VV esedékessége:</span>
                                        <p className="font-medium">{new Date(pen.current_function.metadata.vv_esedekessege).toLocaleDateString('hu-HU')}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Állatok lista */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Vezérlők */}
                <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
                    <div className="flex items-center space-x-4 mb-4 sm:mb-0">
                        <h2 className="text-xl font-semibold text-gray-900">
                            Állatok ({filteredAnimals.length})
                        </h2>
                        {selectedAnimals.length > 0 && (
                            <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-600">
                                    {selectedAnimals.length} kiválasztva
                                </span>
                                <button
                                    onClick={clearSelection}
                                    className="text-xs text-blue-600 hover:text-blue-800"
                                >
                                    Törlés
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center space-x-4">
                        {/* Keresés */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <input
                                type="text"
                                placeholder="Keresés ENAR vagy kategória..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 w-64"
                            />
                        </div>
                        {/* Kiválasztás vezérlők */}
                        <button
                            onClick={selectAllAnimals}
                            className="text-sm text-blue-600 hover:text-blue-800"
                        >
                            Mind kiválaszt
                        </button>
                        <button className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm bg-white hover:bg-gray-50">
                            <Download className="h-4 w-4 mr-2" />
                            Export
                        </button>
                    </div>
                </div>

                {/* Állatok táblázat */}
                <div className="bg-white shadow-sm rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <input
                                        type="checkbox"
                                        checked={selectedAnimals.length === filteredAnimals.length && filteredAnimals.length > 0}
                                        onChange={() => selectedAnimals.length === filteredAnimals.length ? clearSelection() : selectAllAnimals()}
                                        className="rounded border-gray-300"
                                    />
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    ENAR
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Kategória
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Életkor
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Származás
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Műveletek
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredAnimals.map((animal) => (
                                <tr
                                    key={animal.id}
                                    className={`hover:bg-gray-50 ${selectedAnimals.includes(animal.id) ? 'bg-blue-50' : ''}`}
                                >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <input
                                            type="checkbox"
                                            checked={selectedAnimals.includes(animal.id)}
                                            onChange={() => toggleAnimalSelection(animal.id)}
                                            className="rounded border-gray-300"
                                        />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <Link
                                            href={`/dashboard/animals/${encodeURIComponent(animal.enar)}`}
                                            className="text-blue-600 hover:text-blue-800 font-medium"
                                        >
                                            {animal.enar}
                                        </Link>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                            {getCategoryEmoji(animal.kategoria)} {animal.kategoria.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {calculateAge(animal.szuletesi_datum)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            animal.birth_location === 'nálunk' ? 'bg-green-100 text-green-800' :
                                            animal.birth_location === 'vásárolt' ? 'bg-blue-100 text-blue-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`}>
                                            {animal.birth_location === 'nálunk' ? '🏠 Nálunk' :
                                             animal.birth_location === 'vásárolt' ? '🛒 Vásárolt' : '❓ Ismeretlen'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <button className="text-gray-400 hover:text-gray-600">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {filteredAnimals.length === 0 && (
                        <div className="text-center py-12">
                            <Users className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">Nincsenek állatok</h3>
                            <p className="mt-1 text-sm text-gray-500">
                                {searchTerm ? 'Nincs találat a keresési feltételre.' : 'Ez a karám jelenleg üres.'}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Movement Panel Modal */}
            <AnimalMovementPanel
                isOpen={showMovementPanel}
                onClose={() => setShowMovementPanel(false)}
                selectedAnimals={selectedAnimals}
                animals={filteredAnimals}
                availablePens={[
                    { id: '1', pen_number: '1', pen_type: 'outdoor' as const, capacity: 27, location: 'Bal oldal', animal_count: 20 },
                    { id: '2', pen_number: '2', pen_type: 'outdoor' as const, capacity: 25, location: 'Bal oldal', animal_count: 18 },
                    { id: '11', pen_number: 'E1', pen_type: 'birthing' as const, capacity: 25, location: 'Ellető istálló', animal_count: 15 }
                ]}
                currentPenId={penId}
                onMove={(targetPenId, reason, notes) => {
                    console.log('Move to:', targetPenId, reason, notes);
                    alert(`Állatok mozgatva a ${targetPenId} karamra! Ok: ${reason}`);
                    setShowMovementPanel(false);
                    setSelectedAnimals([]);
                }}
            />

            {/* Function Manager Modal */}
            <PenFunctionManager
                isOpen={showFunctionManager}
                onClose={() => setShowFunctionManager(false)}
                pen={pen as any}
                onFunctionChange={async (newFunction: string, metadata: any, notes: string) => {
                    try {
                        // Close old function
                        await supabase
                            .from('pen_functions')
                            .update({ end_date: new Date().toISOString() })
                            .eq('pen_id', pen?.id)
                            .is('end_date', null);
                        
                        // Add new function
                        await supabase
                            .from('pen_functions')
                            .insert({
                                pen_id: pen?.id,
                                function_name: newFunction,
                                start_date: new Date().toISOString(),
                                metadata: metadata,
                                notes: notes
                            });
                        
                        setShowFunctionManager(false);
                        alert('Funkció sikeresen megváltoztatva!');
                        window.location.reload();
                    } catch (error) {
                        console.error('Hiba:', error);
                        alert('Hiba történt a funkció váltáskor!');
                    }
                }}
            />
        </div>
    );
}