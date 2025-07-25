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
import * as XLSX from 'xlsx';
// A többi import után, körülbelül a 12. sor környékén:
//import TeljesKaramTortenelem from '@/components/TeljesKaramTortenelem';
// Add hozzá ezt a többi import után:
import HaremDashboard from '@/components/HaremDashboard';
import PenEventsTab from '@/components/PenEventsTab';
import PenHistoryTab from '@/components/PenHistoryTab';
// Ez a helyes import:
import { QuickDuplicateFixButton } from '@/components/QuickDuplicateFixButton';
import { AdminEszkozok } from '@/components/AdminEszkozok';
import { ColorHelpers } from '@/constants/colors';
import { VV_CONSTANTS } from '@/constants/business';
import AnimalSelector from '@/components/AnimalSelector';

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
    const [showAddAnimalsPanel, setShowAddAnimalsPanel] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showHaremHistory, setShowHaremHistory] = useState(false);
    const [haremHistory, setHaremHistory] = useState<any[]>([]);
    const [showPenHistory, setShowPenHistory] = useState(false);
    const [penHistory, setPenHistory] = useState<any[]>([]);
    // Szerkesztési state-ek
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingPeriod, setEditingPeriod] = useState<any>(null);
    const [allPens, setAllPens] = useState<any[]>([]);
    // Ha van dashboard default, akkor events-re változtatni:
    // A useState típus javítása:
    const [activeTab, setActiveTab] = useState<'animals' | 'events' | 'harem' | 'timeline'>('animals');
    const [selectedAnimalsForAdd, setSelectedAnimalsForAdd] = useState<number[]>([]);

    // Riasztások hook hozzáadása
    const { alerts, animalPenMap } = useAlertsNew();

    // Állat alertek hozzárendelése ehhez a karámhoz (ugyanaz mint pen-card.tsx-ben)
    const penSpecificAlerts = alerts.filter(alert => {
        if (!pen?.id) return false;

        console.log('🔍 Checking alert:', alert.id, 'animal_id:', alert.animal_id, 'pen_id:', alert.pen_id);

        // 1. Karám-specifikus alertek
        if (alert.pen_id === pen.id) {
            console.log('✅ Pen alert match!');
            return true;
        }

        // 2. Állat alertek - JAVÍTOTT: karám szám alapú mapping
        if (alert.animal_id && animalPenMap) {
            const animalPenId = animalPenMap[alert.animal_id];
            console.log('🗺️ Animal', alert.animal_id, 'is in pen:', animalPenId, 'current pen:', pen.pen_number); // ← pen.pen_number a log-ban is
            return animalPenId === pen.pen_number; // ← JAVÍTVA!
        }

        return false;
    });

    console.log('FILTERED ALERTS for pen detail', penId, ':', penSpecificAlerts);

    console.log('🔍 PEN DETAILS RENDER:', {
        pen: pen?.pen_number,
        loading,
        hasData: !!pen
    });

    // És a komponens használata előtt inicializáld:

    // Data loading effects
    useEffect(() => {
        fetchPenDetails();
    }, [penId]);

    // CSERÉLD LE ERRE:
    useEffect(() => {
        if (pen?.id) {
            fetchAnimalsInPen();
        }
    }, [pen?.id, pen?.current_function?.metadata, pen?.current_function?.id]);

    // Összes karám betöltése
    useEffect(() => {
        const fetchAllPens = async () => {
            try {
                const { data: pens, error } = await supabase
                    .from('pens')
                    .select('id, pen_number, pen_type, capacity, location')
                    .order('pen_number');

                if (error) {
                    console.error('❌ Karamok betöltési hiba:', error);
                } else {
                    const formattedPens = pens?.map(pen => ({
                        id: pen.id,
                        pen_number: pen.pen_number,
                        pen_type: pen.pen_type || 'outdoor',
                        capacity: pen.capacity || 30,
                        location: pen.location || 'Ismeretlen',
                        animal_count: 0
                    })) || [];

                    setAllPens(formattedPens);
                    console.log('✅ Összes karám betöltve:', formattedPens.length);
                }
            } catch (error) {
                console.error('❌ Karamok fetch hiba:', error);
            }
        };

        fetchAllPens();
    }, []);

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
        birth_location,
        pairing_date,
        current_weight,
        last_weight_measured_at,
        vv_date,
        pregnancy_status,
        expected_birth_date,
        name
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

    // JAVÍTOTT deletePeriod funkció - page.tsx-ben cseréld le

    const deletePeriod = async (periodId: string, functionType: string, isActive: boolean) => {
        const confirmMessage = isActive
            ? `🚨 AKTÍV ${functionType.toUpperCase()} periódus törlése?\n\nEz visszaállítja a karamot ÜRES állapotba!\n\n⚠️ FIGYELEM: Az állatokat is el fogja távolítani a karámból!\n\nBiztosan folytatod?`
            : `🗑️ ${functionType.toUpperCase()} periódus törlése?\n\nEz a művelet nem vonható vissza!\n\n⚠️ Ha vannak hozzárendelt állatok, azokat is eltávolítja!\n\nBiztosan törlöd?`;

        if (!confirm(confirmMessage)) return;

        try {
            console.log('🗑️ Periódus törlése és assignments szinkronizálás...', periodId);

            // 1. ✅ ASSIGNMENTS LEZÁRÁSA ELŐBB
            if (isActive) {
                console.log('🔒 Aktív periódus assignments lezárása...');

                const { error: assignmentsError } = await supabase
                    .from('animal_pen_assignments')
                    .update({ removed_at: new Date().toISOString() })
                    .eq('pen_id', pen?.id)
                    .is('removed_at', null);

                if (assignmentsError) {
                    console.error('❌ Assignments lezárási hiba:', assignmentsError);
                    alert('❌ Hiba az állatok eltávolításakor: ' + assignmentsError.message);
                    return;
                }

                console.log('✅ Assignments lezárva');
            }

            // 2. ✅ PERIÓDUS TÖRLÉSE
            const { error } = await supabase
                .from('pen_functions')
                .delete()
                .eq('id', periodId);

            if (error) throw error;

            console.log('✅ Periódus sikeresen törölve');

            // 3. ✅ KONZISZTENCIA ELLENŐRZÉS - árva assignments keresése
            console.log('🔍 Árva assignments ellenőrzése...');
            const { data: orphanedAssignments, error: orphanError } = await supabase
                .from('animal_pen_assignments')
                .select('id, animal_id, assigned_at')
                .eq('pen_id', pen?.id)
                .is('removed_at', null);

            if (!orphanError && orphanedAssignments && orphanedAssignments.length > 0) {
                console.log('🚨 Árva assignments találva:', orphanedAssignments.length);

                // Automatikus javítás
                const { error: cleanupError } = await supabase
                    .from('animal_pen_assignments')
                    .update({ removed_at: new Date().toISOString() })
                    .in('id', orphanedAssignments.map(a => a.id));

                if (cleanupError) {
                    console.error('❌ Árva assignments cleanup hiba:', cleanupError);
                } else {
                    console.log('✅ Árva assignments megtisztítva:', orphanedAssignments.length);
                }
            }

            // 4. ✅ SIKERÜZENET
            const resultMessage = isActive
                ? '✅ Aktív periódus törölve!\n\n🔄 A karám most ÜRES állapotba került\n🐄 Az állatok eltávolítva'
                : '✅ Periódus sikeresen törölve!';

            alert(resultMessage);

            if (isActive) {
                // Teljes oldal újratöltés aktív periódus törlésekor
                setTimeout(() => window.location.reload(), 1000);
            } else {
                // Lista frissítése régi periódus törlésekor
                fetchFullPenHistory();
            }

        } catch (error) {
            console.error('❌ Törlési hiba:', error);
            alert('❌ Hiba a törlés során: ' + (error instanceof Error ? error.message : 'Ismeretlen hiba'));
        }
    };

    // Periódus szerkesztése - ÚJ FUNKCIÓ  
    const editPeriod = async (period: any) => {
        console.log('✏️ Periódus szerkesztése...', period);

        // Edit módban megnyitjuk a Function Manager-t
        setEditingPeriod(period);
        setShowFunctionManager(true);
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
        return ColorHelpers.getPenFunctionColor(functionType as any);
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

    // Excel Export funkció - INTELLIGENS HÁREM DÁTUM LOGIKA
    const exportToExcel = async () => {
        try {
            console.log('📊 Excel export kezdése...', {
                penNumber: pen?.pen_number,
                functionType: pen?.current_function?.function_type,
                animalCount: filteredAnimals.length
            });

            // ⭐ ÚJ: Supabase import intelligens hárem dátum lekérdezéshez
            const { createClient } = await import('@supabase/supabase-js');
            const supabase = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            );

            // Funkció-specifikus oszlopok meghatározása
            const functionType = pen?.current_function?.function_type || 'üres';
            let data: any[] = [];

            if (functionType === 'hárem') {
                // ⭐ INTELLIGENS HÁREM EXPORT - ÁLLAT-SPECIFIKUS DÁTUMOK
                console.log('🐄💕 Hárem export - intelligens dátum lekérdezés...');

                // Minden állathoz lekérdezzük a mozgatási történetet
                const animalsWithHaremData = await Promise.all(
                    filteredAnimals.map(async (animal) => {
                        try {
                            // ⭐ ÁLLAT-SPECIFIKUS HÁREM KEZDET KERESÉSE
                            const { data: movements, error } = await supabase
                                .from('animal_movements')
                                .select('moved_at, function_type, movement_reason')
                                .eq('animal_id', animal.id)
                                .eq('function_type', 'hárem')
                                .order('moved_at', { ascending: true }); // Legkorábbi hárem mozgatás

                            let animalHaremStart = null;

                            if (!error && movements && movements.length > 0) {
                                // Legkorábbi hárem mozgatás dátuma
                                animalHaremStart = movements[0].moved_at;
                                console.log(`🔍 ${animal.enar} hárem kezdete mozgatásból:`, animalHaremStart);
                            } else {
                                // Fallback: karám funkció kezdete vagy assignment dátum
                                const assignment = animal.assigned_at;
                                const penFunctionStart = pen?.current_function?.metadata?.parozas_kezdete;

                                animalHaremStart = assignment || penFunctionStart;
                                console.log(`🔄 ${animal.enar} hárem kezdete fallback:`, animalHaremStart);
                            }

                            // VV esedékesség számítása (hárem kezdet + 75 nap)
                            let vvEsedekesseg = '-';
                            if (animalHaremStart) {
                                const haremDate = new Date(animalHaremStart);
                                const vvDate = new Date(haremDate);
                                vvDate.setDate(vvDate.getDate() + VV_CONSTANTS.DAYS_AFTER_PAIRING);
                                vvEsedekesseg = vvDate.toLocaleDateString('hu-HU');
                            }

                            return {
                                ...animal,
                                calculatedHaremStart: animalHaremStart,
                                calculatedVVDate: vvEsedekesseg
                            };

                        } catch (error) {
                            console.error(`❌ Hiba ${animal.enar} adatainál:`, error);
                            return {
                                ...animal,
                                calculatedHaremStart: null,
                                calculatedVVDate: '-'
                            };
                        }
                    })
                );

                // Excel adatok generálása állat-specifikus dátumokkal
                data = animalsWithHaremData.map(animal => ({
                    'ENAR': animal.enar,
                    'NÉV': (() => {
                        // Tenyészbika név logika (változatlan)
                        if (animal.kategoria === 'tenyészbika') {
                            const bulls = pen?.current_function?.metadata?.bulls;
                            if (bulls && Array.isArray(bulls)) {
                                const bull = bulls.find((b: any) => b.enar === animal.enar);
                                return bull?.name || '-';
                            }
                            if (pen?.current_function?.metadata?.tenyeszbika_enar === animal.enar) {
                                return pen?.current_function?.metadata?.tenyeszbika_name || '-';
                            }
                        }
                        return '-';
                    })(),
                    // ⭐ INTELLIGENS HÁREM KEZDETE - ÁLLAT-SPECIFIKUS!
                    'HÁREM KEZDETE': animal.calculatedHaremStart ?
                        new Date(animal.calculatedHaremStart).toLocaleDateString('hu-HU') : '-',
                    // ⭐ INTELLIGENS VV TERVEZETT - ÁLLAT-SPECIFIKUS SZÁMÍTÁS!
                    'VV TERVEZETT': (() => {
                        const ageMonths = calculateAgeInMonths(animal.szuletesi_datum);
                        if (ageMonths < 24) return 'Még fiatal';
                        return animal.calculatedVVDate;
                    })(),
                    'VV EREDMÉNY': '-', // TODO: VV eredmények táblából
                    'VÁRHATÓ ELLÉS': '-', // TODO: VV eredmények alapján számolva
                    'FELJEGYZÉS': animal.assignment_reason || '-'
                }));

                console.log('✅ Intelligens hárem export adatok generálva:', data.length, 'állat');

            } else if (functionType === 'bölcsi') {
                // BÖLCSI EXPORT (változatlan)
                data = filteredAnimals.map(animal => ({
                    'ENAR': animal.enar,
                    'SZÜLETÉSI DÁTUM': new Date(animal.szuletesi_datum).toLocaleDateString('hu-HU'),
                    '12 HÓNAPOS EKKOR': calculateTargetDate(animal.szuletesi_datum, 12),
                    'FELJEGYZÉS': animal.assignment_reason || '-'
                }));
            } else if (functionType === 'óvi') {
                // ÓVI EXPORT (változatlan)
                data = filteredAnimals.map(animal => ({
                    'ENAR': animal.enar,
                    'SZÜLETÉSI DÁTUM': new Date(animal.szuletesi_datum).toLocaleDateString('hu-HU'),
                    '18 HÓNAPOS EKKOR': calculateTargetDate(animal.szuletesi_datum, 18),
                    '24 HÓNAPOS EKKOR': calculateTargetDate(animal.szuletesi_datum, 24),
                    'FELJEGYZÉS': animal.assignment_reason || '-'
                }));
            } else {
                // ÁLTALÁNOS EXPORT (változatlan)
                data = filteredAnimals.map(animal => ({
                    'ENAR': animal.enar,
                    'KATEGÓRIA': animal.kategoria.replace('_', ' '),
                    'SZÜLETÉSI DÁTUM': new Date(animal.szuletesi_datum).toLocaleDateString('hu-HU'),
                    'ÉLETKOR': calculateAge(animal.szuletesi_datum),
                    'SZÁRMAZÁS': animal.birth_location === 'nálunk' ? 'Nálunk' :
                        animal.birth_location === 'vásárolt' ? 'Vásárolt' : 'Ismeretlen',
                    'FELJEGYZÉS': animal.assignment_reason || '-'
                }));
            }

            // Excel fájl létrehozása (változatlan)
            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();

            // Fájlnév generálása
            const today = new Date().toISOString().split('T')[0];
            const sheetName = `Karám_${pen?.pen_number}_${functionType}`;
            const fileName = `${sheetName}_${today}.xlsx`;

            XLSX.utils.book_append_sheet(wb, ws, sheetName);
            XLSX.writeFile(wb, fileName);

            console.log('✅ Excel export sikeres:', fileName);

            // ⭐ SIKERES ÜZENET INTELLIGENS INFORMÁCIÓKKAL
            const successMessage = functionType === 'hárem'
                ? `✅ Intelligens Hárem Excel export sikeres!\n\nFájl: ${fileName}\nÁllatok: ${data.length}\n\n🎯 Funkció: Állat-specifikus hárem kezdetek használva\n📅 VV dátumok: Egyedi számítások alapján`
                : `✅ Excel export sikeres!\n\nFájl: ${fileName}\nÁllatok: ${data.length}`;

            alert(successMessage);

        } catch (error) {
            console.error('❌ Excel export hiba:', error);
            alert('❌ Hiba történt az export során: ' + (error instanceof Error ? error.message : 'Ismeretlen hiba'));
        }
    };

    const exportPenHistory = async () => {
        try {
            console.log('📊 Karámtörténet export kezdése...', {
                penId: pen?.id,
                penNumber: pen?.pen_number
            });

            // 1. Történeti periódusok lekérdezése
            const { data: periodsData, error: periodsError } = await supabase
                .from('pen_history_periods')
                .select('*')
                .eq('pen_id', pen?.id)
                .order('start_date', { ascending: false });

            if (periodsError) {
                console.error('❌ Periódusok lekérdezési hiba:', periodsError);
            }

            // 2. Állat események lekérdezése
            const { data: eventsData, error: eventsError } = await supabase
                .from('animal_events')
                .select(`
                event_date,
                event_type,
                reason,
                notes,
                created_at,
                animals (
                    enar,
                    kategoria,
                    ivar
                )
            `)
                .order('event_date', { ascending: false })
                .limit(1000);

            if (eventsError) {
                console.error('❌ Események lekérdezési hiba:', eventsError);
            }

            // 3. Mozgatási adatok lekérdezése
            const { data: movementsData, error: movementsError } = await supabase
                .from('animal_pen_assignments')
                .select(`
                assigned_at,
                removed_at,
                assignment_reason,
                animals (
                    enar,
                    kategoria,
                    ivar
                ),
                pens (
                    pen_number
                )
            `)
                .eq('pen_id', pen?.id)
                .order('assigned_at', { ascending: false })
                .limit(1000);

            if (movementsError) {
                console.error('❌ Mozgatások lekérdezési hiba:', movementsError);
            }

            // EXCEL ADATOK FORMÁZÁSA

            // 1. Történeti periódusok worksheet
            const periodsExportData = periodsData?.map((period: any) => {
                const startDate = new Date(period.start_date).toLocaleDateString('hu-HU');
                const endDate = period.end_date ? new Date(period.end_date).toLocaleDateString('hu-HU') : 'Folyamatban';
                const duration = period.end_date
                    ? Math.ceil((new Date(period.end_date).getTime() - new Date(period.start_date).getTime()) / (1000 * 60 * 60 * 24))
                    : Math.ceil((new Date().getTime() - new Date(period.start_date).getTime()) / (1000 * 60 * 60 * 24));

                return {
                    'Kezdet': startDate,
                    'Vég': endDate,
                    'Időtartam (nap)': duration,
                    'Funkció': period.function_type,
                    'Állatok száma': period.animals_snapshot?.length || 0,
                    'Tenyészbikák': period.metadata?.bulls?.map((b: any) => b.name).join(', ') || '-',
                    'Rögzítés': period.historical ? 'Kézi' : 'Automatikus',
                    'Megjegyzések': period.notes || '-'
                };
            }) || [];

            // 2. Események worksheet
            const eventsExportData = eventsData?.map((event: any) => {
                return {
                    'Dátum': new Date(event.event_date).toLocaleDateString('hu-HU'),
                    'Esemény': event.event_type === 'function_change' ? 'Funkció váltás' :
                        event.event_type === 'pen_movement' ? 'Mozgatás' :
                            event.event_type === 'pen_assignment' ? 'Bekerülés' :
                                event.event_type === 'health_event' ? 'Egészségügyi esemény' :
                                    event.event_type,
                    'ENAR': event.animals?.enar || '-',
                    'Kategória': event.animals?.kategoria || '-',
                    'Indoklás': event.reason || '-',
                    'Részletek': event.notes || '-'
                };
            }) || [];

            // 3. Mozgatások worksheet
            const movementsExportData = movementsData?.map((movement: any) => {
                const assignedDate = new Date(movement.assigned_at).toLocaleDateString('hu-HU');
                const removedDate = movement.removed_at ? new Date(movement.removed_at).toLocaleDateString('hu-HU') : 'Jelenleg itt';
                const daysInPen = movement.removed_at
                    ? Math.ceil((new Date(movement.removed_at).getTime() - new Date(movement.assigned_at).getTime()) / (1000 * 60 * 60 * 24))
                    : Math.ceil((new Date().getTime() - new Date(movement.assigned_at).getTime()) / (1000 * 60 * 60 * 24));

                return {
                    'ENAR': movement.animals?.enar || '-',
                    'Kategória': movement.animals?.kategoria || '-',
                    'Bekerülés': assignedDate,
                    'Távozás': removedDate,
                    'Napok karámban': daysInPen,
                    'Indoklás': movement.assignment_reason || '-'
                };
            }) || [];

            // EXCEL FÁJL LÉTREHOZÁSA
            const wb = XLSX.utils.book_new();

            // Worksheets hozzáadása
            if (periodsExportData.length > 0) {
                const periodsWS = XLSX.utils.json_to_sheet(periodsExportData);
                XLSX.utils.book_append_sheet(wb, periodsWS, 'Történeti Periódusok');
            }

            if (eventsExportData.length > 0) {
                const eventsWS = XLSX.utils.json_to_sheet(eventsExportData);
                XLSX.utils.book_append_sheet(wb, eventsWS, 'Események');
            }

            if (movementsExportData.length > 0) {
                const movementsWS = XLSX.utils.json_to_sheet(movementsExportData);
                XLSX.utils.book_append_sheet(wb, movementsWS, 'Mozgatások');
            }

            // Összefoglaló worksheet
            const summaryData = [
                { 'Adat típus': 'Történeti periódusok', 'Rekordok száma': periodsExportData.length },
                { 'Adat típus': 'Események', 'Rekordok száma': eventsExportData.length },
                { 'Adat típus': 'Mozgatások', 'Rekordok száma': movementsExportData.length },
                { 'Adat típus': 'Export dátuma', 'Rekordok száma': new Date().toLocaleDateString('hu-HU') },
                { 'Adat típus': 'Karám', 'Rekordok száma': `Karám ${pen?.pen_number}` }
            ];
            const summaryWS = XLSX.utils.json_to_sheet(summaryData);
            XLSX.utils.book_append_sheet(wb, summaryWS, 'Összefoglaló');

            // Fájl mentése
            const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
            const fileName = `Karam_${pen?.pen_number}_tortenet_${timestamp}.xlsx`;

            XLSX.writeFile(wb, fileName);

            console.log('✅ Karámtörténet export sikeres:', fileName);

            // Sikeres üzenet
            alert(`✅ Karámtörténet export sikeres!

📊 Adatok:
• Történeti periódusok: ${periodsExportData.length} db
• Események: ${eventsExportData.length} db  
• Mozgatások: ${movementsExportData.length} db

📁 Fájl: ${fileName}`);

        } catch (error) {
            console.error('❌ Karámtörténet export hiba:', error);
            alert('❌ Hiba történt a karámtörténet export során: ' + (error instanceof Error ? error.message : 'Ismeretlen hiba'));
        }
    };

    // Segédfunkciók (változatlanok)
    const calculateTargetDate = (birthDate: string, targetMonths: number): string => {
        const birth = new Date(birthDate);
        const target = new Date(birth);
        target.setMonth(target.getMonth() + targetMonths);
        return target.toLocaleDateString('hu-HU');
    };

    const calculateAgeInMonths = (birthDate: string): number => {
        const birth = new Date(birthDate);
        const now = new Date();
        return Math.floor((now.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
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
                            <AdminEszkozok />  {/* ← ÚJ: Diszkrét admin dropdown */}
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
                    {(pen.current_function?.function_type === 'hárem' || pen.current_function?.function_type === 'vemhes') && (
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
                        penNumber={pen.pen_number}
                        alerts={penSpecificAlerts as any}
                        animalPenMap={animalPenMap}
                        showAnimalAlerts={true}
                        maxDisplayed={5}
                        className="mt-6"
                    />
                    {/* Univerzális Karám Történet Gomb */}
                    <div className="mt-6">
                        <button
                            style={{ display: 'none' }}
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

            {/* ÚJ Tab Navigation - HÁREM TAB-BAL */}
            <div className="flex border-b mb-6">
                <button
                    onClick={() => setActiveTab('animals')}
                    className={`px-4 py-2 font-medium ${activeTab === 'animals' ? 'border-b-2 border-green-500 text-green-600' : 'text-gray-500'}`}
                >
                    🐄 Állatok ({filteredAnimals.length})
                </button>

                <button
                    onClick={() => setActiveTab('events')}
                    className={`px-4 py-2 font-medium ${activeTab === 'events' ? 'border-b-2 border-green-500 text-green-600' : 'text-gray-500'}`}
                >
                    🎯 Karám Események
                </button>

                {/* CONDITIONAL HÁREM TAB - csak hárem karámoknál */}
                {(pen.current_function?.function_type === 'hárem' || pen.current_function?.function_type === 'vemhes') && (
                    <button
                        onClick={() => setActiveTab('harem')}
                        className={`px-4 py-2 font-medium ${activeTab === 'harem' ? 'border-b-2 border-pink-500 text-pink-600' : 'text-gray-500'}`}
                    >
                        {pen.current_function?.function_type === 'hárem' ? '💕 Hárem Dashboard' : '🐄💕 Vemhes Dashboard'}
                    </button>
                )}

                <button
                    onClick={() => setActiveTab('timeline')}
                    className={`px-4 py-2 font-medium ${activeTab === 'timeline' ? 'border-b-2 border-green-500 text-green-600' : 'text-gray-500'}`}
                >
                    📅 Karám Történet
                </button>
            </div>

            {/* Tab Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

                {/* Állatok Tab */}
                {activeTab === 'animals' && (
                    <>
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
                                <button
                                    onClick={() => setShowAddAnimalsPanel(true)}
                                    className="bg-green-600 hover:bg-green-700 text-white font-medium px-3 py-2 rounded-lg transition-colors inline-flex items-center text-sm ml-3"
                                >
                                    <span className="mr-1">➕</span>
                                    Hozzáadás
                                </button>
                                {selectedAnimals.length > 0 && (
                                    <button
                                        onClick={() => setShowMovementPanel(true)}
                                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-3 py-2 rounded-lg transition-colors inline-flex items-center text-sm ml-2"
                                    >
                                        <span className="mr-1">🔄</span>
                                        Mozgatás ({selectedAnimals.length})
                                    </button>
                                )}
                                <button
                                    onClick={exportToExcel}
                                    className="bg-white hover:bg-gray-50 text-gray-700 font-medium px-4 py-2 rounded-lg border border-gray-300 transition-colors inline-flex items-center"
                                >
                                    <span className="mr-2">📥</span>
                                    Export
                                </button>
                                <button
                                    onClick={exportPenHistory}
                                    className="bg-white hover:bg-gray-50 text-gray-700 font-medium px-4 py-2 rounded-lg border border-gray-300 transition-colors inline-flex items-center"
                                >
                                    <span className="mr-2">📥</span>
                                    Történet Export
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
                    </>
                )}

 // ✅ ÚJ - dinamikus komponens:
                {activeTab === 'events' && (
                    <PenEventsTab
                        penId={pen.id}
                        penNumber={pen.pen_number}
                        penFunction={pen.current_function?.function_type}
                        animals={filteredAnimals}
                    // onDataChange prop elhagyva
                    />
                )}

                {/* ÚJ HÁREM TAB CONTENT */}
                {activeTab === 'harem' && (pen.current_function?.function_type === 'hárem' || pen.current_function?.function_type === 'vemhes') && (
                    <HaremDashboard
                        penId={pen.id}
                        penNumber={pen.pen_number}
                        penFunction={pen.current_function.function_type}
                    />
                )}

                {/* Timeline Tab - ÚJ KARÁMTÖRTÉNET KÁRTYA RENDSZER */}
                {activeTab === 'timeline' && (
                    <PenHistoryTab
                        penId={pen.id}
                        penNumber={pen.pen_number}
                        onDataChange={() => {
                            console.log('🔄 Karámtörténet adatok változtak');
                            fetchPenDetails();
                            fetchAnimalsInPen();
                        }}
                    />
                )}
            </div>

            {/* Movement Panel Modal */}
            <AnimalMovementPanel
                isOpen={showMovementPanel}
                onClose={() => setShowMovementPanel(false)}
                selectedAnimals={selectedAnimals}
                animals={filteredAnimals}
                availablePens={allPens}
                currentPenId={penId}

                // ⭐ CSAK AZ onMove FUNKCIÓ FRISSÍTÉSE - METADATA TÁMOGATÁSSAL
                // Keresd meg ezt a részt a fájlban (787. sor környékén) és cseréld le:

                onMove={async (targetPenId, reason, notes, isHistorical, moveDate, functionType, metadata) => {
                    try {
                        console.log('🔄 JAVÍTOTT állatok mozgatása:', {
                            from: penId,
                            to: targetPenId,
                            animals: selectedAnimals,
                            reason
                        });

                        // Dátum kezelés
                        const actualMoveDate = isHistorical && moveDate ? moveDate : new Date().toISOString();

                        // 🔥 KRITIKUS JAVÍTÁS: BATCH MOZGATÁS TRANSACTION-nel

                        // 1. ✅ ELŐTTE: Duplikáció ellenőrzése
                        console.log('🔍 Duplikáció ellenőrzése...');
                        const { data: existingAssignments, error: checkError } = await supabase
                            .from('animal_pen_assignments')
                            .select('animal_id, pen_id')
                            .in('animal_id', selectedAnimals)
                            .eq('pen_id', targetPenId)
                            .is('removed_at', null);

                        if (checkError) {
                            console.error('❌ Duplikáció ellenőrzési hiba:', checkError);
                            throw new Error('Duplikáció ellenőrzési hiba: ' + checkError.message);
                        }

                        const alreadyInTarget = existingAssignments?.map(a => a.animal_id) || [];
                        const animalsToMove = selectedAnimals.filter(id => !alreadyInTarget.includes(id));

                        if (alreadyInTarget.length > 0) {
                            console.log('ℹ️ Már a célkarámban lévő állatok:', alreadyInTarget);
                        }

                        if (animalsToMove.length === 0) {
                            alert('ℹ️ Minden kiválasztott állat már a célkarámban van!');
                            setShowMovementPanel(false);
                            return;
                        }

                        // 2. ✅ RÉGI HOZZÁRENDELÉSEK LEZÁRÁSA - csak a mozgatandó állatokra
                        if (!isHistorical && animalsToMove.length > 0) {
                            console.log('🔒 Régi hozzárendelések lezárása...', animalsToMove);

                            const { error: removeError } = await supabase
                                .from('animal_pen_assignments')
                                .update({ removed_at: actualMoveDate })
                                .in('animal_id', animalsToMove)
                                .is('removed_at', null);

                            if (removeError) {
                                console.error('❌ Régi hozzárendelések lezárási hiba:', removeError);
                                throw new Error('Régi hozzárendelések lezárása sikertelen: ' + removeError.message);
                            }

                            console.log('✅ Régi hozzárendelések lezárva:', animalsToMove.length);
                        }

                        // 3. ✅ VÁRAKOZÁS hogy a lezárás érvényesüljön
                        await new Promise(resolve => setTimeout(resolve, 200));

                        // 4. ✅ ÚJ HOZZÁRENDELÉSEK LÉTREHOZÁSA - csak a mozgatandó állatokra
                        if (!isHistorical && animalsToMove.length > 0) {
                            console.log('➕ Új hozzárendelések létrehozása...', animalsToMove);

                            const newAssignments = animalsToMove.map(animalId => ({
                                animal_id: animalId,
                                pen_id: targetPenId,
                                assigned_at: actualMoveDate,
                                assignment_reason: reason,
                                notes: notes || null
                            }));

                            const { error: assignError } = await supabase
                                .from('animal_pen_assignments')
                                .insert(newAssignments);

                            if (assignError) {
                                console.error('❌ Új hozzárendelések létrehozási hiba:', assignError);
                                throw new Error('Új hozzárendelések létrehozása sikertelen: ' + assignError.message);
                            }

                            console.log('✅ Új hozzárendelések létrehozva:', animalsToMove.length);
                        }

                        // 5. ✅ VÉGSŐ DUPLIKÁCIÓ ELLENŐRZÉS
                        console.log('🔍 Végső duplikáció ellenőrzése...');
                        for (const animalId of animalsToMove) {
                            const { data: finalCheck, error: finalError } = await supabase
                                .from('animal_pen_assignments')
                                .select('id, pen_id')
                                .eq('animal_id', animalId)
                                .is('removed_at', null);

                            if (finalError) {
                                console.warn('⚠️ Végső ellenőrzési hiba:', animalId, finalError);
                                continue;
                            }

                            if (finalCheck && finalCheck.length > 1) {
                                console.error('🚨 DUPLIKÁCIÓ DETEKTÁLVA az állatnál:', animalId, finalCheck);

                                // Csak a célkarámban lévőt hagyjuk meg, a többit lezárjuk
                                const duplicateIds = finalCheck
                                    .filter(a => a.pen_id !== targetPenId)
                                    .map(a => a.id);

                                if (duplicateIds.length > 0) {
                                    await supabase
                                        .from('animal_pen_assignments')
                                        .update({ removed_at: actualMoveDate })
                                        .in('id', duplicateIds);

                                    console.log('🧹 Duplikátumok eltávolítva az állatnál:', animalId, duplicateIds);
                                }
                            }
                        }

                        // 6. ✅ EGYSÉGES ESEMÉNY RÖGZÍTÉS
                        const events = selectedAnimals.map(animalId => ({
                            animal_id: animalId,
                            event_type: 'pen_movement',
                            event_date: actualMoveDate.split('T')[0],
                            event_time: actualMoveDate.split('T')[1]?.substring(0, 8) || '12:00:00',
                            pen_id: targetPenId,
                            previous_pen_id: penId,
                            pen_function: functionType || null,
                            function_metadata: metadata || null,
                            reason: reason,
                            notes: notes || null,
                            is_historical: isHistorical || false
                        }));

                        const { error: eventError } = await supabase
                            .from('animal_events')
                            .insert(events);

                        if (eventError) {
                            console.warn('⚠️ Esemény mentése sikertelen:', eventError.message);
                        } else {
                            console.log('✅ Események mentve animal_events táblába:', events.length);
                        }

                        // 7. ✅ SIKERÜZENET
                        const movedCount = animalsToMove.length;
                        const alreadyThereCount = alreadyInTarget.length;

                        let successMessage = `✅ Mozgatás befejezve!\n\n`;
                        if (movedCount > 0) {
                            successMessage += `🔄 Áthelyezve: ${movedCount} állat\n`;
                        }
                        if (alreadyThereCount > 0) {
                            successMessage += `ℹ️ Már ott volt: ${alreadyThereCount} állat\n`;
                        }
                        successMessage += `📍 Célkarám: ${targetPenId}\n`;
                        successMessage += `📝 Indoklás: ${reason}`;

                        if (functionType === 'hárem' && metadata) {
                            successMessage += `\n\n🐄💕 HÁREM ADATOK:`;
                            if (metadata.tenyeszbika_name) {
                                successMessage += `\n🐂 Tenyészbika: ${metadata.tenyeszbika_name}`;
                            }
                            if (metadata.pairing_start_date) {
                                successMessage += `\n💕 Párzási kezdet: ${new Date(metadata.pairing_start_date).toLocaleDateString('hu-HU')}`;
                            }
                        }

                        if (isHistorical) {
                            successMessage += `\n\n📚 Történeti mozgatás - állatok jelenlegi karámja nem változott`;
                        }

                        alert(successMessage);

                        setShowMovementPanel(false);
                        setSelectedAnimals([]);

                        // Csak nem történeti mozgatás esetén frissítjük az oldalt
                        if (!isHistorical) {
                            setTimeout(() => {
                                window.location.reload();
                            }, 1000);
                        }

                    } catch (error) {
                        console.error('❌ JAVÍTOTT mozgatási hiba:', error);
                        const errorMessage = error instanceof Error ? error.message : 'Ismeretlen hiba';
                        alert(`❌ Mozgatási hiba: ${errorMessage}`);
                    }
                }}
            />

            {/* ÚJ: Add Animals Panel */}
            <AnimalMovementPanel
                isOpen={showAddAnimalsPanel}
                onClose={() => setShowAddAnimalsPanel(false)}
                selectedAnimals={[]}
                animals={[]}
                availablePens={allPens}
                currentPenId={penId}
                isAddMode={true}
                selectedAnimalsForAdd={selectedAnimalsForAdd}
                setSelectedAnimalsForAdd={setSelectedAnimalsForAdd}
                onMove={(targetPenId, reason, notes) => {
                    alert(`Állatok hozzáadása a karámhoz!`);
                    setShowAddAnimalsPanel(false);
                }}
            />

            <PenFunctionManager
                isOpen={showFunctionManager}
                onClose={() => {
                    setShowFunctionManager(false);
                    setEditingPeriod(null); // Reset edit state
                }}
                pen={pen}
                editMode={!!editingPeriod}        // ÚJ - edit mód ha van editingPeriod
                editPeriod={editingPeriod}        // ÚJ - szerkesztendő periódus
                onPeriodUpdate={(periodId: any, newData: any) => {  // ÚJ - update callback
                    console.log('✅ Periódus frissítve:', periodId, newData);
                    fetchFullPenHistory(); // Lista frissítése
                }}
                onFunctionChange={async (newFunction: any, metadata: any, notes: any) => {
                    // ... eredeti kód változatlan marad ...
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
                                function_type: newFunction,
                                start_date: new Date().toISOString(),
                                metadata: metadata,
                                notes: notes
                            });

                        setShowFunctionManager(false);
                        setEditingPeriod(null); // Reset edit state
                        alert('Funkció sikeresen megváltoztatva!');

                        window.location.reload();
                    } catch (error) {
                        console.error('Hiba:', error);
                        alert('Hiba történt a funkció váltáskor!');
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
                                    style={{ display: 'none' }}
                                    onClick={() => setShowHaremHistory(true)}
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

                                                                    {/* SZERKESZTÉS GOMB */}
                                                                    <button
                                                                        onClick={() => editPeriod(period)}
                                                                        className="px-2 py-1 rounded text-xs font-medium transition-colors bg-blue-100 hover:bg-blue-200 text-blue-700 border border-blue-300 mr-2"
                                                                        title="Hárem periódus szerkesztése"
                                                                    >
                                                                        ✏️ Szerkesztés
                                                                    </button>

                                                                    {/* TÖRLÉS GOMB */}
                                                                    <button
                                                                        onClick={() => deletePeriod(
                                                                            period.id,
                                                                            'hárem',
                                                                            !period.end_date || period.end_date === null || period.end_date === ''
                                                                        )}
                                                                        className={`px-2 py-1 rounded text-xs font-medium transition-colors ${(!period.end_date || period.end_date === null || period.end_date === '')
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
                                                                        className={`px-2 py-1 rounded text-xs font-medium transition-colors ${(!period.end_date || period.end_date === null || period.end_date === '')
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