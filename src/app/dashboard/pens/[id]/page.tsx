// src/app/dashboard/pens/[id]/page.tsx - ✅ JAVÍTOTT getFunctionColor
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import AnimalMovementPanel from '../components/animal-movement-panel';
import PenFunctionManager from '../components/pen-function-manager';
import PenSpecificAnimalTable from '../components/pen-specific-animal-table';
import {
    AlertTriangle
} from 'lucide-react';
import { useAlertsNew } from '@/hooks/useAlertsNew';
import { PenAlertsWidget } from '../components/pen-alerts-widget';

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
    function_type: 'bölcsi' | 'óvi' | 'hárem' | 'vemhes' | 'hízóbika' | 'ellető' | 'üres' | 'tehén' | 'átmeneti' | 'kórház' | 'karantén' | 'selejt';
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
    const [showHaremHistory, setShowHaremHistory] = useState(false);
    const [haremHistory, setHaremHistory] = useState<any[]>([]);
    const [showPenHistory, setShowPenHistory] = useState(false);
    const [penHistory, setPenHistory] = useState<any[]>([]);


    // Riasztások hook hozzáadása
    const { alerts, animalPenMap } = useAlertsNew();

    // Állat alertek hozzárendelése ehhez a karámhoz (ugyanaz mint pen-card.tsx-ben)
    // Állat alertek hozzárendelése ehhez a karámhoz
    const penSpecificAlerts = alerts.filter(alert => {
        if (!pen?.id) return false;

        console.log('🔍 Checking alert:', alert.id, 'animal_id:', alert.animal_id, 'pen_id:', alert.pen_id);

        // 1. Karám-specifikus alertek
        if (alert.pen_id === pen.id) {
            console.log('✅ Pen alert match!');
            return true;
        }

        // 2. Állat alertek - mapping alapján
        if (alert.animal_id && animalPenMap) {
            const animalPenId = animalPenMap[alert.animal_id];
            console.log('🗺️ Animal', alert.animal_id, 'is in pen:', animalPenId, 'current pen:', pen.id);
            return animalPenId === pen.id;
        }

        return false;
    });

    console.log('FILTERED ALERTS for pen detail', penId, ':', penSpecificAlerts);

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
            setPen(prev => prev ? { ...prev, animal_count: animals.length } : null);
        }
    }, [animals.length]);

    // Hárem történet modal kezelése
    useEffect(() => {
        if (showHaremHistory) {
            fetchHaremHistory();
        }
    }, [showHaremHistory]);

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

            // ✅ JAVÍTOTT AKTÍV FUNKCIÓ KERESÉS
            const activeFunction = penFunctions?.find((f: any) => {
                // 1. Nincs end_date (NULL)
                if (f.end_date === null) return true;
                // 2. end_date üres string
                if (f.end_date === '') return true;
                // 3. end_date jövőbeli dátum
                if (f.end_date && new Date(f.end_date) > new Date()) return true;
                return false;
            }) || penFunctions?.[penFunctions.length - 1]; // Fallback: legutóbbi funkció

            console.log('🎯 Active function found:', activeFunction);
            console.log('🔍 All functions:', penFunctions);

            const penWithFunction: PenDetailsType = {
                ...simplePen,
                current_function: activeFunction ? {
                    id: activeFunction.id,
                    function_type: (activeFunction.function_type || 'üres') as PenFunctionType,
                    start_date: activeFunction.start_date,
                    end_date: activeFunction.end_date || null,
                    metadata: activeFunction.metadata || {},
                    notes: activeFunction.notes || ''
                } : {
                    // DEFAULT FUNKCIÓ HA NINCS AKTÍV
                    id: 'default',
                    function_type: 'üres',
                    start_date: new Date().toISOString(),
                    end_date: null,
                    metadata: {},
                    notes: ''
                },
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
            console.log(`🐄 Állatok és borjak betöltése ${pen.pen_number} karamhoz...`);

            // 1. ✅ VALÓDI ÁLLATOK LEKÉRDEZÉSE (eredeti)
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

            // 2. ✅ TEMP ID-S BORJAK LEKÉRDEZÉSE (új)
            const { data: calves, error: calvesError } = await supabase
                .from('calves')
                .select('*')
                .eq('current_pen_id', pen.id)
                .is('enar', null); // Csak ENAR nélküli borjak

            if (calvesError) {
                console.warn('⚠️ Borjak betöltési hiba:', calvesError);
            }

            console.log(`✅ ${assignments?.length || 0} állat + ${calves?.length || 0} borjú betöltve`);

            // 3. ✅ ÁLLATOK FORMÁZÁSA
            const animalsData: Animal[] = assignments?.map((assignment: any) => ({
                ...assignment.animals,
                assigned_at: assignment.assigned_at,
                assignment_reason: assignment.assignment_reason
            })) || [];

            // 4. ✅ BORJAK FORMÁZÁSA (Animal interface-re alakítva)
            const calvesData: Animal[] = calves?.map((calf: any) => ({
                id: parseInt(`9${calf.id}`) || Math.floor(Math.random() * 999999), // Egyedi number ID
                enar: calf.temp_id || `temp-${calf.id}`, // temp_id lesz az "ENAR"
                szuletesi_datum: calf.created_at || new Date().toISOString().split('T')[0],
                ivar: calf.gender || 'ismeretlen',
                kategoria: calf.gender === 'hímivar' ? 'hímivarú_borjú' : 'nőivarú_borjú',
                statusz: 'aktív',
                anya_enar: '', // Üres string a típus miatt
                apa_enar: '', // Üres string a típus miatt
                birth_location: 'nálunk' as const,
                created_at: calf.created_at || new Date().toISOString(),
                assigned_at: calf.created_at || new Date().toISOString(),
                assignment_reason: 'születés'
            })) || [];

            // 5. ✅ ÖSSZEFŰZÉS ÉS BEÁLLÍTÁS
            const allAnimals = [...animalsData, ...calvesData];
            setAnimals(allAnimals);

        } catch (err) {
            console.error('💥 fetchAnimalsInPen error:', err);
            setError('Hiba történt az állatok betöltésekor');
        }
    };

         // Teljes karám történet betöltése - ÚJ FUNKCIÓ
const fetchFullPenHistory = async () => {
  try {
    console.log('📚 Teljes karám történet betöltése...', pen?.id);
    
    const { data, error } = await supabase
      .from('pen_functions')
      .select('*')
      .eq('pen_id', pen?.id)
      .order('start_date', { ascending: false });

    if (error) {
      console.error('❌ Történet betöltési hiba:', error);
      return;
    }

    console.log('✅ Karám történet betöltve:', data?.length || 0, 'periódus');
    setPenHistory(data || []);
    
  } catch (error) {
    console.error('💥 fetchFullPenHistory hiba:', error);
  }
};

// Egyedi periódus törlése - ÚJ FUNKCIÓ
const deletePeriod = async (periodId: string, functionType: string, isActive: boolean) => {
  const confirmMessage = isActive 
    ? `🚨 AKTÍV ${functionType.toUpperCase()} periódus törlése?\n\nEz visszaállítja a karamot ÜRES állapotba!\n\nBiztosan folytatod?`
    : `🗑️ ${functionType.toUpperCase()} periódus törlése?\n\nEz a művelet nem vonható vissza!\n\nBiztosan törlöd?`;
    
  if (!confirm(confirmMessage)) return;

  try {
    console.log('🗑️ Periódus törlése...', periodId);
    
    const { error } = await supabase
      .from('pen_functions')
      .delete()
      .eq('id', periodId);

    if (error) throw error;
    
    console.log('✅ Periódus sikeresen törölve');
    alert('✅ Periódus sikeresen törölve!');
    
    if (isActive) {
      alert('📝 A karám most ÜRES funkcióra vált.');
      setTimeout(() => window.location.reload(), 1000);
    } else {
      fetchFullPenHistory(); // Lista frissítése
    }
  } catch (error) {
    console.error('❌ Törlési hiba:', error);
    alert('❌ Hiba a törlés során: ' + (error instanceof Error ? error.message : 'Ismeretlen hiba'));
  }
};

// Tömeges régi periódusok törlése - ÚJ FUNKCIÓ  
// Tömeges hárem törlés - csak régi hárem periódusok
const deleteAllOldHaremPeriods = async () => {
  if (!confirm('🗑️ TÖMEGES TÖRLÉS\n\nTörölni szeretnéd az ÖSSZES régi (lezárt) periódust?\n\n✅ Az aktív periódus megmarad\n❌ A régi periódusok véglegesen törlődnek\n\nBiztosan folytatod?')) return;

  try {
    console.log('🗑️ Tömeges törlés kezdése...');
    
    const { error } = await supabase
      .from('pen_functions')
      .delete()
      .eq('pen_id', pen?.id)
      .not('end_date', 'is', null);

    if (error) throw error;
    
    console.log('✅ Régi periódusok törölve');
    alert('✅ Régi periódusok sikeresen törölve!');
    fetchFullPenHistory();
  } catch (error) {
    console.error('❌ Tömeges törlési hiba:', error);
    alert('❌ Hiba a tömeges törlés során: ' + (error instanceof Error ? error.message : 'Ismeretlen hiba'));
  }
};

    // Hárem történet betöltése
    const fetchHaremHistory = async () => {
        try {
            console.log('📚 Hárem történet betöltése...', pen?.id);

            const { data, error } = await supabase
                .from('pen_functions')
                .select('*')
                .eq('pen_id', pen?.id)
                .eq('function_type', 'hárem')  // ← JAVÍTVA: function_name → function_type
                .order('start_date', { ascending: false });

            if (error) {
                console.error('❌ Hárem történet hiba:', error);
                return;
            }

            console.log('✅ Hárem történet betöltve:', data?.length || 0, 'periódus');
            setHaremHistory(data || []);

        } catch (error) {
            console.error('💥 fetchHaremHistory hiba:', error);
        }
    };

    // Hárem periódus törlése
    const deleteHaremPeriod = async (periodId: string, isActive: boolean) => {
        try {
            // Biztonsági ellenőrzés
            if (isActive) {
                const confirmActive = confirm(
                    '🚨 FIGYELEM!\n\nAz AKTÍV hárem periódust szeretnéd törölni?\n\n' +
                    '⚠️ Ez a funkció visszaállítja a karamot ÜRES állapotba!\n\n' +
                    'Biztosan folytatod?'
                );
                if (!confirmActive) return;
            } else {
                const confirmOld = confirm(
                    '🗑️ Hárem periódus törlése\n\n' +
                    'Biztosan törölni szeretnéd ezt a hárem periódust?\n\n' +
                    '⚠️ Ez a művelet nem vonható vissza!'
                );
                if (!confirmOld) return;
            }

            console.log('🗑️ Hárem periódus törlése...', periodId);

            const { error } = await supabase
                .from('pen_functions')
                .delete()
                .eq('id', periodId);

            if (error) {
                console.error('❌ Törlési hiba:', error);
                alert('❌ Hiba történt a törlés során: ' + error.message);
                return;
            }

            console.log('✅ Hárem periódus sikeresen törölve:', periodId);
            alert('✅ Hárem periódus sikeresen törölve!');

            if (isActive) {
                alert('📝 Info: A karám most ÜRES funkcióra vált.');
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            } else {
                fetchHaremHistory();
            }

        } catch (error) {
            console.error('💥 deleteHaremPeriod hiba:', error);
            alert('❌ Váratlan hiba a törlés során!');
        }
    };

    // Tömeges törlés - csak régi periódusok
    const deleteAllOldPeriods = async () => {
        try {
            const confirmBulk = confirm(
                '🗑️ TÖMEGES TÖRLÉS\n\n' +
                'Törölni szeretnéd az ÖSSZES régi (lezárt) hárem periódust?\n\n' +
                '✅ Az aktív periódus megmarad\n' +
                '❌ A régi periódusok véglegesen törlődnek\n\n' +
                'Biztosan folytatod?'
            );

            if (!confirmBulk) return;

            console.log('🗑️ Tömeges törlés kezdése...');

            const { error } = await supabase
                .from('pen_functions')
                .delete()
                .eq('pen_id', pen?.id)
                .eq('function_type', 'hárem')
                .not('end_date', 'is', null);

            if (error) {
                console.error('❌ Tömeges törlési hiba:', error);
                alert('❌ Hiba történt a tömeges törlés során: ' + error.message);
                return;
            }

            console.log('✅ Régi hárem periódusok sikeresen törölve');
            alert('✅ Régi hárem periódusok sikeresen törölve!');
            fetchHaremHistory();

        } catch (error) {
            console.error('💥 deleteAllOldPeriods hiba:', error);
            alert('❌ Váratlan hiba a tömeges törlés során!');
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
            'üres': '⭕',
            'átmeneti': '🔄',
            'kórház': '🏥',
            'karantén': '🔒',
            'selejt': '📦'
        };
        return emojiMap[functionType] || '❓';
    };

    // ✅ JAVÍTOTT SZÍNPALETTA - MINDEN FUNKCIÓ EGYSÉGESEN MINT A TÖBBI FÁJLBAN!
    const getFunctionColor = (functionType: string): string => {
        const colorMap = {
            // 🐮 BORJÚ FUNKCIÓK - Kék árnyalatok (fiatal állatok)
            'bölcsi': 'bg-blue-100 text-blue-800 border-blue-200',

            // 🐄 FEJLŐDÉSI FUNKCIÓK - Indigo (növekedés)  
            'óvi': 'bg-indigo-100 text-indigo-800 border-indigo-200',

            // 💕 TENYÉSZTÉSI FUNKCIÓK - Pink/Rose (KÜLÖNBÖZŐEK!)
            'hárem': 'bg-pink-100 text-pink-800 border-pink-200',
            'vemhes': 'bg-rose-100 text-rose-800 border-rose-200',

            // 🍼 ANYASÁG FUNKCIÓK - Zöld árnyalatok (természet/élet)
            'ellető': 'bg-emerald-100 text-emerald-800 border-emerald-200',
            'tehén': 'bg-green-100 text-green-800 border-green-200',

            // 🐂 HÍZÓBIKA - Narancs (erő/munka)
            'hízóbika': 'bg-orange-100 text-orange-800 border-orange-200',

            // ⭕ SPECIÁLIS FUNKCIÓK - ✅ ÖSSZES ÚJ TÍPUS HOZZÁADVA!
            'üres': 'bg-gray-100 text-gray-800 border-gray-200',
            'átmeneti': 'bg-teal-100 text-teal-800 border-teal-200',
            'kórház': 'bg-red-100 text-red-800 border-red-200',
            'karantén': 'bg-amber-100 text-amber-800 border-amber-200',
            'selejt': 'bg-slate-100 text-slate-800 border-slate-200'
        } as const;

        return colorMap[functionType as keyof typeof colorMap] || 'bg-gray-100 text-gray-800 border-gray-200';
    };

    const getCapacityColor = (current: number, capacity: number): string => {
        const percentage = (current / capacity) * 100;
        if (percentage < 60) return 'text-green-600';
        if (percentage < 80) return 'text-orange-500';
        if (percentage < 100) return 'text-orange-600';
        return 'text-red-500';
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
                        <span className="mr-1">⬅️</span>
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
                        <span className="mr-1">⬅️</span>
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
                                className="mr-4 p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 inline-flex items-center"
                            >
                                <span className="mr-1">⬅️</span>
                            </Link>
                            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                                <span className="text-3xl mr-3">🏠</span>
                                Karám {pen.pen_number}
                            </h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            {selectedAnimals.length > 0 && (
                                <button
                                    onClick={() => setShowMovementPanel(true)}
                                    className="bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-lg transition-colors inline-flex items-center"
                                >
                                    <span className="mr-2">🔄</span>
                                    Mozgatás ({selectedAnimals.length})
                                </button>
                            )}
                            <button
                                onClick={() => setShowFunctionManager(true)}
                                className="bg-teal-500 hover:bg-teal-600 text-white font-medium px-4 py-2 rounded-lg transition-colors inline-flex items-center"
                            >
                                <span className="mr-2">⚙️</span>
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
                            <div className="bg-gray-50 rounded-lg p-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-3">Karám Adatok</h3>
                                <div className="space-y-2">
                                    <div className="flex items-center">
                                        <span className="text-lg mr-2">📍</span>
                                        <span className="text-sm text-gray-600">Helye: {pen.location}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <span className="text-lg mr-2">🐄</span>
                                        <span className={`text-sm font-medium ${getCapacityColor(pen.animal_count, pen.capacity)}`}>
                                            {pen.animal_count} / {pen.capacity} állat
                                        </span>
                                    </div>
                                    <div className="flex items-center">
                                        <span className="text-lg mr-2">📅</span>
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
                            <div className="bg-gray-50 rounded-lg p-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-3">Jelenlegi Funkció</h3>
                                <div className={`px-3 py-2 rounded-full text-sm font-medium border ${getFunctionColor(pen.current_function?.function_type || 'üres')}`}>
                                    {getFunctionEmoji(pen.current_function?.function_type || 'üres')}
                                    <span className="ml-2">
                                        {pen.current_function?.function_type ?
                                            pen.current_function.function_type.charAt(0).toUpperCase() + pen.current_function.function_type.slice(1)
                                            : 'üres'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Kapacitás kihasználtság */}
                        <div>
                            <div className="bg-gray-50 rounded-lg p-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-3">Kihasználtság</h3>
                                <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                                    <div
                                        className={`h-3 rounded-full transition-all ${pen.animal_count / pen.capacity > 0.8 ? 'bg-red-500' :
                                            pen.animal_count / pen.capacity > 0.6 ? 'bg-orange-500' : 'bg-green-500'
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
                        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-6">
                            <h4 className="font-medium text-green-800 mb-3 flex items-center">
                                <span className="text-xl mr-2">🐄💕</span>
                                Hárem Információk
                            </h4>

                            {/* TÖBBBIKÁS MEGJELENÍTÉS */}
                            {pen.current_function.metadata.bulls && Array.isArray(pen.current_function.metadata.bulls) ? (
                                <div className="space-y-4">
                                    {/* Tenyészbikák listája */}
                                    <div>
                                        <span className="text-green-600 flex items-center mb-2">
                                            <span className="mr-1">🐂</span>
                                            Tenyészbika/ák ({pen.current_function.metadata.bulls.length}):
                                        </span>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                            {pen.current_function.metadata.bulls.map((bull: any, index: number) => (
                                                <div key={bull.id || index} className="bg-white border border-green-200 rounded-lg p-3">
                                                    <div className="flex items-center">
                                                        <span className="text-lg mr-2">🐂</span>
                                                        <div>
                                                            <p className="font-medium text-green-900">{bull.name}</p>
                                                            <p className="text-xs text-green-600">{bull.enar}</p>
                                                            <p className="text-xs text-green-500">KPLSZ: {bull.kplsz}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Párzás és VV adatok */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                        {pen.current_function.metadata.parozas_kezdete && (
                                            <div>
                                                <span className="text-green-600 flex items-center">
                                                    <span className="mr-1">💕</span>
                                                    Hárem kezdete:
                                                </span>
                                                <p className="font-medium">{new Date(pen.current_function.metadata.parozas_kezdete).toLocaleDateString('hu-HU')}</p>
                                            </div>
                                        )}
                                        {pen.current_function.metadata.vv_esedekssege && (
                                            <div>
                                                <span className="text-green-600 flex items-center">
                                                    <span className="mr-1">🔬</span>
                                                    VV esedékessége:
                                                </span>
                                                <p className="font-medium">{new Date(pen.current_function.metadata.vv_esedekssege).toLocaleDateString('hu-HU')}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                /* LEGACY SINGLE BULL SUPPORT */
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                    {pen.current_function.metadata.tenyeszbika_name && (
                                        <div>
                                            <span className="text-green-600 flex items-center">
                                                <span className="mr-1">🐂</span>
                                                Tenyészbika:
                                            </span>
                                            <p className="font-medium">{pen.current_function.metadata.tenyeszbika_name}</p>
                                            {pen.current_function.metadata.tenyeszbika_enar && (
                                                <p className="text-xs text-green-600">{pen.current_function.metadata.tenyeszbika_enar}</p>
                                            )}
                                        </div>
                                    )}
                                    {pen.current_function.metadata.parozas_kezdete && (
                                        <div>
                                            <span className="text-green-600 flex items-center">
                                                <span className="mr-1">💕</span>
                                                Hárem kezdete:
                                            </span>
                                            <p className="font-medium">{new Date(pen.current_function.metadata.parozas_kezdete).toLocaleDateString('hu-HU')}</p>
                                        </div>
                                    )}
                                    {pen.current_function.metadata.vv_esedekssege && (
                                        <div>
                                            <span className="text-green-600 flex items-center">
                                                <span className="mr-1">🔬</span>
                                                VV esedékessége:
                                            </span>
                                            <p className="font-medium">{new Date(pen.current_function.metadata.vv_esedekssege).toLocaleDateString('hu-HU')}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                    <PenAlertsWidget
                        penId={pen.id}
                        alerts={penSpecificAlerts as any}
                        className="mt-6"
                    />
                     {/* Univerzális Karám Történet Gomb */}
                    <div className="mt-6">
                        <button
                            onClick={() => {
                                setShowPenHistory(true);
                                fetchFullPenHistory();
                            }}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors inline-flex items-center"
                        >
                            <span className="mr-2">📚</span>
                            Karám Történet
                        </button>
                    </div>
                </div>
            </div>

            {/* Állatok lista */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Vezérlők */}
                <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
                    <div className="flex items-center space-x-4 mb-4 sm:mb-0">
                        <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                            <span className="text-2xl mr-2">🐄</span>
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
                            <input
                                type="text"
                                placeholder="🔎 ENAR vagy kategória keresése..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                            />
                        </div>
                        {/* Kiválasztás vezérlők */}
                        <button
                            onClick={selectAllAnimals}
                            className="text-sm text-blue-600 hover:text-blue-800"
                        >
                            Mind kiválaszt
                        </button>
                        <button className="bg-white hover:bg-gray-50 text-gray-700 font-medium px-4 py-2 rounded-lg border border-gray-300 transition-colors inline-flex items-center">
                            <span className="mr-2">📥</span>
                            Export
                        </button>
                    </div>
                </div>

                {/* Karám-specifikus állatok táblázat */}
                <PenSpecificAnimalTable
                    penFunction={pen.current_function?.function_type || 'üres'}
                    animals={filteredAnimals.map(animal => ({
                        ...animal,
                        id: animal.id.toString()
                    }))}
                    selectedAnimals={selectedAnimals.map(id => id.toString())}
                    onToggleAnimal={(id) => toggleAnimalSelection(parseInt(id))}
                    onSelectAll={selectAllAnimals}
                    onClearSelection={clearSelection}
                />

                {filteredAnimals.length === 0 && (
                    <div className="text-center py-12">
                        <span className="text-6xl mb-4 block">🐄</span>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">Nincsenek állatok</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            {searchTerm ? 'Nincs találat a keresési feltételre.' : 'Ez a karám jelenleg üres.'}
                        </p>
                    </div>
                )}
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
                onMove={async (targetPenId, reason, notes) => {
                    try {
                        console.log('🔄 Állatok mozgatása:', {
                            from: penId,
                            to: targetPenId,
                            animals: selectedAnimals,
                            reason,
                            notes
                        });

                        // 1. ✅ RÉGI HOZZÁRENDELÉSEK LEZÁRÁSA
                        const { error: removeError } = await supabase
                            .from('animal_pen_assignments')
                            .update({ removed_at: new Date().toISOString() })
                            .in('animal_id', selectedAnimals)
                            .is('removed_at', null);

                        if (removeError) {
                            throw new Error(`Régi hozzárendelések lezárása sikertelen: ${removeError.message}`);
                        }

                        // 2. ✅ ÚJ HOZZÁRENDELÉSEK LÉTREHOZÁSA
                        const newAssignments = selectedAnimals.map(animalId => ({
                            animal_id: animalId,
                            pen_id: targetPenId,
                            assigned_at: new Date().toISOString(),
                            assignment_reason: reason,
                            notes: notes || null
                        }));

                        const { error: assignError } = await supabase
                            .from('animal_pen_assignments')
                            .insert(newAssignments);

                        if (assignError) {
                            throw new Error(`Új hozzárendelések létrehozása sikertelen: ${assignError.message}`);
                        }

                        // 3. ✅ MOZGATÁSI TÖRTÉNET RÖGZÍTÉSE
                        const movements = selectedAnimals.map(animalId => ({
                            animal_id: animalId,
                            from_pen_id: penId,
                            to_pen_id: targetPenId,
                            moved_at: new Date().toISOString(),
                            movement_reason: reason,
                            notes: notes || null,
                            moved_by: 'manual'
                        }));

                        const { error: movementError } = await supabase
                            .from('animal_movements')
                            .insert(movements);

                        if (movementError) {
                            console.warn('⚠️ Mozgatási történet mentése sikertelen:', movementError.message);
                        }

                        // 4. ✅ UI FRISSÍTÉS
                        console.log(`✅ ${selectedAnimals.length} állat sikeresen mozgatva ${targetPenId} karamra`);

                        alert(`✅ ${selectedAnimals.length} állat sikeresen mozgatva!\n\nCélkarám: ${targetPenId}\nOk: ${reason}`);

                        setShowMovementPanel(false);
                        setSelectedAnimals([]);

                        setTimeout(() => {
                            window.location.reload();
                        }, 1000);

                    } catch (error) {
                        console.error('❌ Mozgatási hiba:', error);
                        const errorMessage = error instanceof Error ? error.message : 'Ismeretlen hiba';
                        alert(`❌ Mozgatási hiba: ${errorMessage}`);
                    }
                }}
            />

            {/* Function Manager Modal */}
            <PenFunctionManager
                isOpen={showFunctionManager}
                onClose={() => setShowFunctionManager(false)}
                pen={pen as any}
                onFunctionChange={async (newFunction: string, metadata: any, notes: string) => {
                    try {
                        console.log('🔄 Funkció váltás indítása:', { newFunction, metadata, notes });

                        // 1. RÉGI FUNKCIÓ LEZÁRÁSA
                        const { error: closeError } = await supabase
                            .from('pen_functions')
                            .update({ end_date: new Date().toISOString() })
                            .eq('pen_id', pen?.id)
                            .is('end_date', null);

                        if (closeError) throw closeError;

                        // 2. ÚJ FUNKCIÓ LÉTREHOZÁSA
                        const { data: newPenFunction, error: insertError } = await supabase
                            .from('pen_functions')
                            .insert({
                                pen_id: pen?.id,
                                function_type: newFunction,
                                start_date: new Date().toISOString(),
                                end_date: null,
                                metadata: metadata || {},
                                notes: notes || ''
                            })
                            .select()
                            .single();

                        if (insertError) throw insertError;

                        console.log('✅ Funkció váltás sikeres!', newPenFunction);

                        setShowFunctionManager(false);
                        alert('Funkció sikeresen megváltoztatva!');

                        // NE RELOAD - csak refresh a pen adatokat
                        window.location.reload();
                    } catch (error) {
                        console.error('💥 Funkció váltási hiba:', error);
                        alert('Hiba történt: ' + (error instanceof Error ? error.message : String(error)));
                    }
                }}
            />
            {/* Hárem Történet Modal */}
            {showHaremHistory && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg w-full max-w-4xl max-h-[80vh] overflow-hidden">
                        <div className="flex items-center justify-between p-6 border-b">
                            <h3 className="text-lg font-medium text-gray-900 flex items-center">
                                <span className="text-2xl mr-3">📚</span>
                                Karám {pen.pen_number} - Hárem Történet
                            </h3>

                            {/* Törlés gombok */}
                            <div className="flex items-center space-x-3">
                                {haremHistory.length > 1 && (
                                    <button
                                        onClick={deleteAllOldHaremPeriods}
                                        className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors inline-flex items-center"
                                        title="Régi periódusok törlése"
                                    >
                                        <span className="mr-1">🗑️</span>
                                        Régi törlése
                                    </button>
                                )}

                                <button
                                    onClick={() => setShowHaremHistory(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <span className="text-xl">❌</span>
                                </button>
                            </div>
                        </div>
                        <div className="p-6 overflow-y-auto max-h-[60vh]">
                            {haremHistory.length === 0 ? (
                                <div className="text-center py-8">
                                    <span className="text-4xl mb-4 block">📚</span>
                                    <p className="text-gray-500">Még nincs hárem történet</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {haremHistory.map((period, index) => (
                                        <div key={period.id} className="border border-green-200 rounded-lg p-4 bg-green-50">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center">
                                                    <span className="text-xl mr-2">🐄💕</span>
                                                    <span className="font-medium text-green-800">
                                                        {index === 0 ? 'AKTÍV PERIÓDUS' : `Periódus ${haremHistory.length - index}`}
                                                    </span>
                                                </div>

                                                <div className="flex items-center space-x-3">
                                                    <div className="text-sm text-green-600">
                                                        {new Date(period.start_date).toLocaleDateString('hu-HU')} -
                                                        {period.end_date ? new Date(period.end_date).toLocaleDateString('hu-HU') : 'Folyamatban'}
                                                    </div>

                                                    {/* Egyedi törlés gomb */}
                                                    <button
                                                        onClick={() => deleteHaremPeriod(period.id, index === 0)}
                                                        className={`px-2 py-1 rounded text-xs font-medium transition-colors inline-flex items-center ${index === 0
                                                                ? 'bg-red-100 hover:bg-red-200 text-red-700 border border-red-300'
                                                                : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300'
                                                            }`}
                                                        title={index === 0 ? 'Aktív periódus törlése' : 'Periódus törlése'}
                                                    >
                                                        <span className="mr-1">🗑️</span>
                                                        {index === 0 ? 'Aktív törlés' : 'Törlés'}
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {/* Tenyészbikák */}
                                                <div>
                                                    <span className="text-sm font-medium text-green-700 flex items-center mb-2">
                                                        <span className="mr-1">🐂</span>
                                                        Tenyészbikák ({period.metadata?.bull_count || 0}):
                                                    </span>
                                                    {period.metadata?.bulls ? (
                                                        <div className="space-y-1">
                                                            {period.metadata.bulls.map((bull: any, i: number) => (
                                                                <div key={i} className="text-sm text-green-600">
                                                                    • {bull.name} ({bull.enar})
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="text-sm text-gray-500">Nincs adat</div>
                                                    )}
                                                </div>

                                                {/* Nőivarok */}
                                                <div>
                                                    <span className="text-sm font-medium text-green-700 flex items-center mb-2">
                                                        <span className="mr-1">🐄</span>
                                                        Nőivarok ({period.metadata?.female_count || 0}):
                                                    </span>
                                                    {period.metadata?.females ? (
                                                        <div className="max-h-32 overflow-y-auto">
                                                            <div className="text-sm text-green-600">
                                                                {period.metadata.females.map((f: any, i: number) => f.enar).join(', ')}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="text-sm text-gray-500">Nincs pillanatkép</div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Timeline adatok */}
                                            <div className="mt-4 pt-3 border-t border-green-200">
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                                    {period.metadata?.parozas_kezdete && (
                                                        <div>
                                                            <span className="text-green-600">💕 Párzás kezdete:</span>
                                                            <p className="font-medium">{new Date(period.metadata.parozas_kezdete).toLocaleDateString('hu-HU')}</p>
                                                        </div>
                                                    )}
                                                    {period.metadata?.vv_esedekssege && (
                                                        <div>
                                                            <span className="text-green-600">🔬 VV esedékessége:</span>
                                                            <p className="font-medium">{new Date(period.metadata.vv_esedekssege).toLocaleDateString('hu-HU')}</p>
                                                        </div>
                                                    )}
                                                    {period.metadata?.snapshot_created_at && (
                                                        <div>
                                                            <span className="text-green-600">📸 Pillanatkép:</span>
                                                            <p className="font-medium">{new Date(period.metadata.snapshot_created_at).toLocaleDateString('hu-HU')}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {/* Teljes Karám Történet Modal - ÚJ */}
{showPenHistory && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg w-full max-w-5xl max-h-[85vh] overflow-hidden">
      <div className="flex items-center justify-between p-6 border-b">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <span className="text-2xl mr-3">📚</span>
          Karám {pen.pen_number} - Teljes Történet
        </h3>
        
       {/* Szűrő gombok */}
<div className="flex items-center space-x-2">
  <button className="px-3 py-1 bg-green-100 text-green-800 rounded-lg text-sm font-medium">
    🏠 Minden ({penHistory.length})
  </button>
  <button className="px-3 py-1 bg-pink-100 text-pink-800 rounded-lg text-sm">
    💕 Hárem ({penHistory.filter(p => p.function_type === 'hárem').length})
  </button>
  
  {/* TÖMEGES TÖRLÉS GOMB */}
  {penHistory.length > 1 && (
    <button
      onClick={deleteAllOldHaremPeriods}
      className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
      title="Régi periódusok törlése"
    >
      🗑️ Régi törlése
    </button>
  )}
  
  <button
    onClick={() => setShowPenHistory(false)}
    className="text-gray-400 hover:text-gray-600"
  >
    <span className="text-xl">❌</span>
  </button>
</div>
      </div>
      
      <div className="p-6 overflow-y-auto max-h-[70vh]">
        {penHistory.length === 0 ? (
          <div className="text-center py-8">
            <span className="text-4xl mb-4 block">📚</span>
            <p className="text-gray-500">Még nincs karám történet</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* HÁREM PERIÓDUSOK - KIEMELVE */}
            {penHistory.filter(p => p.function_type === 'hárem').length > 0 && (
              <div>
                <h4 className="text-lg font-semibold text-pink-800 mb-4 flex items-center">
                  <span className="mr-2">💕</span>
                  Hárem Periódusok ({penHistory.filter(p => p.function_type === 'hárem').length})
                </h4>
                
                <div className="space-y-4">
                  {penHistory
                    .filter(p => p.function_type === 'hárem')
                    .map((period, index) => (
                    <div key={period.id} className="border-2 border-pink-200 rounded-lg p-6 bg-pink-50">
                      <div className="flex items-center justify-between mb-3">
  <div className="flex items-center">
    <span className="text-xl mr-2">🐄💕</span>
    <span className="font-medium text-pink-800">
      {(!period.end_date || period.end_date === null || period.end_date === '') 
        ? 'AKTÍV HÁREM' 
        : `Hárem Periódus ${penHistory.filter(p => p.function_type === 'hárem').length - index}`}
    </span>
  </div>
  
  <div className="flex items-center space-x-3">
    <div className="text-sm text-pink-600">
      {new Date(period.start_date).toLocaleDateString('hu-HU')} - 
      {period.end_date ? new Date(period.end_date).toLocaleDateString('hu-HU') : 'Folyamatban'}
    </div>
    
    {/* TÖRLÉS GOMB */}
    <button
      onClick={() => deletePeriod(
        period.id, 
        'hárem', 
        !period.end_date || period.end_date === null || period.end_date === ''
      )}
      className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
        (!period.end_date || period.end_date === null || period.end_date === '')
          ? 'bg-red-100 hover:bg-red-200 text-red-700 border border-red-300' 
          : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300'
      }`}
      title={(!period.end_date || period.end_date === null || period.end_date === '') ? 'Aktív hárem törlése' : 'Hárem periódus törlése'}
    >
      🗑️ Törlés
    </button>
  </div>
</div>

                      {/* Hárem snapshot adatok */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Tenyészbikák */}
                        <div>
                          <span className="text-sm font-medium text-pink-700 flex items-center mb-2">
                            <span className="mr-1">🐂</span>
                            Tenyészbikák ({period.metadata?.bull_count || 0}):
                          </span>
                          {period.metadata?.bulls ? (
                            <div className="space-y-1">
                              {period.metadata.bulls.map((bull: any, i: number) => (
                                <div key={i} className="text-sm text-pink-600 bg-white px-2 py-1 rounded border">
                                  🐂 {bull.name} ({bull.enar})
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-sm text-gray-500">Nincs snapshot adat</div>
                          )}
                        </div>

                        {/* Nőivarok */}
                        <div>
                          <span className="text-sm font-medium text-pink-700 flex items-center mb-2">
                            <span className="mr-1">🐄</span>
                            Nőivarok ({period.metadata?.female_count || 0}):
                          </span>
                          {period.metadata?.females ? (
                            <div className="max-h-24 overflow-y-auto bg-white p-2 rounded border">
                              <div className="text-xs text-pink-600">
                                {period.metadata.females.map((f: any, i: number) => f.enar).join(', ')}
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm text-gray-500">Nincs snapshot</div>
                          )}
                        </div>
                      </div>

                      {/* Hárem timeline */}
                      {(period.metadata?.parozas_kezdete || period.metadata?.vv_esedekssege) && (
                        <div className="mt-4 pt-3 border-t border-pink-200">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            {period.metadata?.parozas_kezdete && (
                              <div>
                                <span className="text-pink-600">💕 Párzás kezdete:</span>
                                <p className="font-medium">{new Date(period.metadata.parozas_kezdete).toLocaleDateString('hu-HU')}</p>
                              </div>
                            )}
                            {period.metadata?.vv_esedekssege && (
                              <div>
                                <span className="text-pink-600">🔬 VV esedékessége:</span>
                                <p className="font-medium">{new Date(period.metadata.vv_esedekssege).toLocaleDateString('hu-HU')}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* EGYÉB FUNKCIÓK - KOMPAKT */}
            {penHistory.filter(p => p.function_type !== 'hárem').length > 0 && (
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <span className="mr-2">🔄</span>
                  Egyéb Funkciók ({penHistory.filter(p => p.function_type !== 'hárem').length})
                </h4>
                
                <div className="space-y-3">
                  {penHistory
                    .filter(p => p.function_type !== 'hárem')
                    .map((period) => (
                    <div key={period.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between">
  <div className="flex items-center">
    <span className="text-xl mr-2">{getFunctionEmoji(period.function_type)}</span>
    <div>
      <span className="font-medium text-gray-800">{period.function_type?.toUpperCase()}</span>
      <div className="text-sm text-gray-600">
        {new Date(period.start_date).toLocaleDateString('hu-HU')} - 
        {period.end_date ? new Date(period.end_date).toLocaleDateString('hu-HU') : 'Folyamatban'}
        {period.end_date && (
          <span className="ml-2 text-gray-500">
            ({Math.ceil((new Date(period.end_date).getTime() - new Date(period.start_date).getTime()) / (1000 * 60 * 60 * 24))} nap)
          </span>
        )}
      </div>
    </div>
  </div>
  
  <div className="flex items-center space-x-3">
    {/* Funkció-specifikus összefoglaló */}
    <div className="text-sm text-gray-600">
      {period.function_type === 'bölcsi' && '🐮 Borjú nevelés'}
      {period.function_type === 'óvi' && '🐄 Üsző fejlesztés'}
      {period.function_type === 'ellető' && '🍼 Ellés körül'}
      {period.function_type === 'vemhes' && '🤰 Vemhesség'}
      {period.function_type === 'hízóbika' && '🐂 Hizlalás'}
      {period.function_type === 'tehén' && '🐄🍼 Anyaság'}
      {period.function_type === 'üres' && '⭕ Használaton kívül'}
      {period.function_type === 'átmeneti' && '🔄 Átmeneti'}
      {period.function_type === 'kórház' && '🏥 Kezelés'}
      {period.function_type === 'karantén' && '🔒 Elkülönítés'}
      {period.function_type === 'selejt' && '📦 Értékesítésre vár'}
    </div>
    
    {/* TÖRLÉS GOMB */}
    <button
      onClick={() => deletePeriod(
        period.id, 
        period.function_type, 
        !period.end_date || period.end_date === null || period.end_date === ''
      )}
      className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
        (!period.end_date || period.end_date === null || period.end_date === '')
          ? 'bg-red-100 hover:bg-red-200 text-red-700 border border-red-300' 
          : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300'
      }`}
      title={(!period.end_date || period.end_date === null || period.end_date === '') ? 'Aktív periódus törlése' : 'Periódus törlése'}
    >
      🗑️ Törlés
    </button>
  </div>
</div>
                      
                      {/* Ha van metadata, mutassunk belőle valamit */}
                      {period.metadata && Object.keys(period.metadata).length > 0 && (
                        <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-500">
                          📋 Metadata: {Object.keys(period.metadata).length} adat mentve
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  </div>
)}
        </div>
    );
}