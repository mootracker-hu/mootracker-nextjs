// src/components/HybridAnimalPenHistory.tsx - FEJLESZTETT VERZIÓ
'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { usePenHistorySync } from '@/lib/penHistorySync';
import { displayEnar, formatEnarInput, isValidEnar } from '@/constants/enar-formatter';

interface HybridTimelineItem {
    id: string;
    type: 'new_period' | 'legacy_movement' | 'legacy_event';
    date: string;
    endDate?: string;
    penNumber?: string;
    penId?: string;
    functionType?: string;
    title: string;
    description: string;
    icon: string;
    color: string;
    metadata?: any;
    animals?: any[];
    isCurrentPen?: boolean;
    // ✅ ÚJ: Részletes mozgatási adatok
    movementDetails?: {
        fromPen?: string;
        toPen?: string;
        reason?: string;
        assignedBy?: string;
        notes?: string;
        totalAnimalsInPeriod?: number;
        animalPosition?: number;
        periodDuration?: string;
        bullsInPeriod?: any[];
        vvResults?: any[];
        previousFunction?: string;
        nextFunction?: string;
    };
}

interface Props {
    animalEnar: string;
    animalId: string | number;
}

// ✅ ÚJ: Fejlett dátum input komponens
const EnhancedDateInput: React.FC<{
    value: string;
    onChange: (value: string) => void;
    className?: string;
    placeholder?: string;
}> = ({ value, onChange, className = '', placeholder = 'YYYY-MM-DD' }) => {
    const yearRef = useRef<HTMLInputElement>(null);
    const monthRef = useRef<HTMLInputElement>(null);
    const dayRef = useRef<HTMLInputElement>(null);

    const [year, month, day] = value.split('-');

    const handleYearChange = (newYear: string) => {
        if (newYear.length <= 4 && /^\d*$/.test(newYear)) {
            const updatedDate = `${newYear.padStart(4, '0')}-${month || '01'}-${day || '01'}`;
            onChange(updatedDate);

            if (newYear.length === 4) {
                monthRef.current?.focus();
            }
        }
    };

    const handleMonthChange = (newMonth: string) => {
        if (newMonth.length <= 2 && /^\d*$/.test(newMonth)) {
            const monthNum = Math.min(12, Math.max(1, parseInt(newMonth) || 1));
            const updatedDate = `${year || new Date().getFullYear()}-${monthNum.toString().padStart(2, '0')}-${day || '01'}`;
            onChange(updatedDate);

            if (newMonth.length === 2) {
                dayRef.current?.focus();
            }
        }
    };

    const handleDayChange = (newDay: string) => {
        if (newDay.length <= 2 && /^\d*$/.test(newDay)) {
            const dayNum = Math.min(31, Math.max(1, parseInt(newDay) || 1));
            const updatedDate = `${year || new Date().getFullYear()}-${month || '01'}-${dayNum.toString().padStart(2, '0')}`;
            onChange(updatedDate);
        }
    };

    return (
        <div className={`flex items-center space-x-1 ${className}`}>
            <input
                ref={yearRef}
                type="text"
                value={year || ''}
                onChange={(e) => handleYearChange(e.target.value)}
                placeholder="YYYY"
                maxLength={4}
                className="w-16 px-2 py-1 text-center border rounded focus:ring-2 focus:ring-blue-500"
            />
            <span>-</span>
            <input
                ref={monthRef}
                type="text"
                value={month || ''}
                onChange={(e) => handleMonthChange(e.target.value)}
                placeholder="MM"
                maxLength={2}
                className="w-12 px-2 py-1 text-center border rounded focus:ring-2 focus:ring-blue-500"
            />
            <span>-</span>
            <input
                ref={dayRef}
                type="text"
                value={day || ''}
                onChange={(e) => handleDayChange(e.target.value)}
                placeholder="DD"
                maxLength={2}
                className="w-12 px-2 py-1 text-center border rounded focus:ring-2 focus:ring-blue-500"
            />
        </div>
    );
};

const HybridAnimalPenHistory: React.FC<Props> = ({ animalEnar, animalId }) => {
    const [timeline, setTimeline] = useState<HybridTimelineItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'all' | 'cards_only' | 'legacy_only'>('all');
    const [selectedItem, setSelectedItem] = useState<HybridTimelineItem | null>(null);

    const animalIdString = animalId.toString();

    console.log('🔥 HIBRID KOMPONENS BETÖLTŐDÖTT:', displayEnar(animalEnar), 'ID:', animalIdString);

    const loadHybridTimeline = async () => {
        try {
            setLoading(true);
            console.log(`🔍 Loading enhanced hybrid timeline for animal: ${displayEnar(animalEnar)}`);

            const items: HybridTimelineItem[] = [];

            // 1. ÚJ KÁRTYA RENDSZER ADATOK - BŐVÍTETT METADATA-VAL
            if (viewMode === 'all' || viewMode === 'cards_only') {
                const { data: allPeriods, error: periodsError } = await supabase
                    .from('pen_history_periods')
                    .select(`
                        *,
                        pens!inner(pen_number, location)
                    `)
                    .order('start_date', { ascending: false });

                if (periodsError) {
                    console.error('Error loading periods:', periodsError);
                } else {
                    const filteredPeriods = allPeriods?.filter(period => {
                        const animals = period.animals_snapshot as any[] || [];
                        return animals.some(animal =>
                            animal.enar === animalEnar ||
                            animal.id === animalIdString ||
                            (typeof animal === 'string' && animal === animalEnar)
                        );
                    }) || [];

                    // ✅ BŐVÍTETT METADATA GYŰJTÉS
                    const { data: vvResults } = await supabase
                        .from('vv_results')
                        .select('*')
                        .eq('animal_enar', animalEnar)
                        .order('created_at', { ascending: false });

                    const penIds = [...new Set(filteredPeriods.map(p => p.pen_id))];
                    const { data: haremHistory } = await supabase
                        .from('pen_harem_history')
                        .select('*')
                        .in('pen_id', penIds);

                    // ✅ MOZGATÁSI RÉSZLETEK GYŰJTÉSE
                    const { data: animalMovements } = await supabase
                        .from('animal_pen_assignments')
                        .select(`
                            *,
                            pens!inner(pen_number, location)
                        `)
                        .eq('animal_id', animalIdString)
                        .order('assigned_at', { ascending: false });

                    filteredPeriods.forEach((period, index) => {
                        const pen = period.pens as any;
                        const functionColor = getFunctionColor(period.function_type);
                        const functionIcon = getFunctionIcon(period.function_type);

                        // ✅ SPECIÁLIS MOZGATÁSI RÉSZLETEK KISZÁMÍTÁSA
                        const periodAnimals = period.animals_snapshot as any[] || [];
                        const animalInPeriod = periodAnimals.find(a =>
                            a.enar === animalEnar || a.id === animalIdString
                        );

                        const relatedMovement = animalMovements?.find(m =>
                            new Date(m.assigned_at).toDateString() === new Date(period.start_date).toDateString()
                        );

                        const previousPeriod = filteredPeriods[index + 1];
                        const nextPeriod = filteredPeriods[index - 1];

                        // VV eredmények szűrése erre a periódusra
                        const periodVVResults = vvResults?.filter(vv => {
                            const vvDate = new Date(vv.vv_date);
                            const startDate = new Date(period.start_date);
                            const endDate = period.end_date ? new Date(period.end_date) : new Date();
                            return vvDate >= startDate && vvDate <= endDate;
                        }) || [];

                        const periodHarem = haremHistory?.find(h =>
                            h.pen_id === period.pen_id &&
                            new Date(h.start_date) <= new Date(period.start_date) &&
                            (!h.end_date || new Date(h.end_date) >= new Date(period.start_date))
                        );

                        // Tenyészbika információk
                        let description = `${period.function_type.toUpperCase()} periódus`;
                        let extraInfo = '';

                        // Bulls információ metadata-ból vagy hárem history-ból
                        const bulls = period.metadata?.bulls || periodHarem?.bulls || [];

                        if (period.function_type === 'hárem' && bulls.length > 0) {
                            const bullNames = bulls.map((b: any) => `${b.name || b.enar}`).join(', ');
                            extraInfo += ` • 🐂 ${bullNames}`;

                            if (periodVVResults.length > 0) {
                                const latestVV = periodVVResults[0];
                                if (latestVV.pregnancy_status === 'vemhes') {
                                    extraInfo += ` • ✅ VV: ${latestVV.vv_result_days} nap`;
                                    if (latestVV.father_name) {
                                        extraInfo += ` (${latestVV.father_name})`;
                                    }
                                } else {
                                    extraInfo += ` • ❌ VV: negatív`;
                                }
                            }
                        }

                        const duration = period.end_date
                            ? calculateDuration(period.start_date, period.end_date)
                            : 'folyamatban';

                        // ✅ RÉSZLETES MOZGATÁSI ADATOK
                        const movementDetails = {
                            fromPen: previousPeriod ? (previousPeriod.pens as any)?.pen_number : 'Új bekerülés',
                            toPen: pen?.pen_number,
                            reason: relatedMovement?.assignment_reason || period.metadata?.entry_reason || 'Automatikus periódus',
                            assignedBy: relatedMovement?.created_by || 'Rendszer',
                            notes: relatedMovement?.notes || period.metadata?.notes || '',
                            totalAnimalsInPeriod: periodAnimals.length,
                            animalPosition: periodAnimals.findIndex(a => a.enar === animalEnar || a.id === animalIdString) + 1,
                            periodDuration: duration,
                            bullsInPeriod: bulls,
                            vvResults: periodVVResults,
                            previousFunction: previousPeriod?.function_type,
                            nextFunction: nextPeriod?.function_type
                        };

                        items.push({
                            id: `period-${period.id}`,
                            type: 'new_period',
                            date: period.start_date,
                            endDate: period.end_date,
                            penNumber: pen?.pen_number,
                            penId: period.pen_id,
                            functionType: period.function_type,
                            title: `🏠 Karám ${pen?.pen_number || 'N/A'}`,
                            description: `${description}${extraInfo} (${duration})`,
                            icon: functionIcon,
                            color: functionColor,
                            metadata: {
                                ...period.metadata,
                                vvResults: periodVVResults,
                                haremInfo: periodHarem,
                                animalCount: periodAnimals.length,
                                periodType: period.historical ? 'Történeti' : 'Automatikus'
                            },
                            animals: period.animals_snapshot,
                            isCurrentPen: !period.end_date,
                            movementDetails // ✅ ÚJ!
                        });
                    });
                }
            }

            // 2. RÉGI MOZGATÁSI ADATOK - BŐVÍTETT INFORMÁCIÓKKAL
            if (viewMode === 'all' || viewMode === 'legacy_only') {
                try {
                    const { data: movements, error: movementsError } = await supabase
                        .from('animal_movements')
                        .select(`
                            *,
                            animals!inner(enar)
                        `)
                        .eq('animal_id', animalIdString)
                        .order('moved_at', { ascending: false });

                    if (movementsError) {
                        console.error('Error loading movements:', movementsError);
                    } else if (movements && movements.length > 0) {
                        const movementPenIds = [...new Set([
                            ...movements.map(m => m.to_pen_id),
                            ...movements.map(m => m.from_pen_id)
                        ].filter(Boolean))];

                        const { data: movementPenNumbers } = await supabase
                            .from('pens')
                            .select('id, pen_number, location')
                            .in('id', movementPenIds);

                        const movementPenLookup = Object.fromEntries(
                            movementPenNumbers?.map(p => [p.id, { pen_number: p.pen_number, location: p.location }]) || []
                        );

                        movements.forEach(movement => {
                            const isConflicting = items.some(item =>
                                item.type === 'new_period' &&
                                isDateInRange(movement.moved_at, item.date, item.endDate)
                            );

                            if (!isConflicting) {
                                const toPenInfo = movementPenLookup[movement.to_pen_id];
                                const fromPenInfo = movementPenLookup[movement.from_pen_id];

                                // ✅ BŐVÍTETT MOZGATÁSI RÉSZLETEK
                                const movementDetails = {
                                    fromPen: fromPenInfo?.pen_number || 'Ismeretlen',
                                    toPen: toPenInfo?.pen_number || 'Ismeretlen',
                                    reason: translateMovementReason(movement.movement_reason) || 'Állatmozgatás',
                                    assignedBy: movement.moved_by || 'Ismeretlen',
                                    notes: movement.notes || '',
                                    totalAnimalsInPeriod: 1, // Legacy movements általában egyedi
                                    animalPosition: 1,
                                    periodDuration: 'Legacy mozgatás',
                                    bullsInPeriod: movement.function_metadata?.bulls || [],
                                    vvResults: [],
                                    previousFunction: movement.function_metadata?.previous_function,
                                    nextFunction: movement.function_type
                                };

                                items.push({
                                    id: `movement-${movement.id}`,
                                    type: 'legacy_movement',
                                    date: movement.moved_at,
                                    penNumber: toPenInfo?.pen_number || 'N/A',
                                    penId: movement.to_pen_id,
                                    title: `🔄 Mozgatás: ${fromPenInfo?.pen_number || 'N/A'} → ${toPenInfo?.pen_number || 'N/A'}`,
                                    description: translateMovementReason(movement.movement_reason) || 'Állatmozgatás',
                                    icon: '🔄',
                                    color: 'bg-blue-100 border-blue-300 text-blue-800',
                                    metadata: {
                                        originalMovement: movement,
                                        penLocations: {
                                            from: fromPenInfo?.location,
                                            to: toPenInfo?.location
                                        }
                                    },
                                    movementDetails // ✅ ÚJ!
                                });
                            }
                        });
                    }
                } catch (error) {
                    console.error('Error loading movements:', error);
                }
            }

            // 3. RÉGI ESEMÉNYEK - BŐVÍTETT INFORMÁCIÓKKAL  
            if (viewMode === 'all' || viewMode === 'legacy_only') {
                try {
                    const { data: events, error: eventsError } = await supabase
                        .from('animal_events')
                        .select('*')
                        .eq('animal_id', animalIdString)
                        .order('event_date', { ascending: false });

                    if (eventsError) {
                        console.error('Error loading events:', eventsError);
                    } else if (events && events.length > 0) {
                        // Events-hez pen számok lekérdezése
                        const eventPenIds = [...new Set([
                            ...events.map(e => e.pen_id),
                            ...events.map(e => e.previous_pen_id)
                        ].filter(Boolean))];

                        const { data: eventPenNumbers } = await supabase
                            .from('pens')
                            .select('id, pen_number, location')
                            .in('id', eventPenIds);

                        const eventPenLookup = Object.fromEntries(
                            eventPenNumbers?.map(p => [p.id, { pen_number: p.pen_number, location: p.location }]) || []
                        );

                        events.forEach(event => {
                            const isConflicting = items.some(item =>
                                item.type === 'new_period' &&
                                isDateInRange(event.event_date, item.date, item.endDate)
                            );

                            if (!isConflicting) {
                                const penInfo = eventPenLookup[event.pen_id];
                                const previousPenInfo = eventPenLookup[event.previous_pen_id];

                                // ✅ ESEMÉNY RÉSZLETEK
                                const movementDetails = {
                                    fromPen: previousPenInfo?.pen_number || 'Ismeretlen',
                                    toPen: penInfo?.pen_number || 'Ismeretlen',
                                    reason: translateEventReason(event.reason) || translateEventReason(event.notes) || 'Esemény',
                                    assignedBy: event.created_by || 'Ismeretlen',
                                    notes: event.notes || '',
                                    totalAnimalsInPeriod: 1,
                                    animalPosition: 1,
                                    periodDuration: 'Esemény',
                                    bullsInPeriod: event.function_metadata?.bulls || [],
                                    vvResults: [],
                                    previousFunction: event.function_metadata?.previous_function,
                                    nextFunction: event.pen_function
                                };

                                if (event.event_type === 'pen_movement' || event.event_type === 'pen_assignment') {
                                    const title = event.event_type === 'pen_movement'
                                        ? `🔄 Mozgatás: Karám ${previousPenInfo?.pen_number || 'N/A'} → Karám ${penInfo?.pen_number || 'N/A'}`
                                        : `📍 Bekerülés: Karám ${penInfo?.pen_number || 'N/A'}`;

                                    items.push({
                                        id: `event-movement-${event.id}`,
                                        type: 'legacy_movement',
                                        date: event.event_date,
                                        penNumber: penInfo?.pen_number || 'N/A',
                                        penId: event.pen_id,
                                        title: title,
                                        description: translateEventReason(event.reason) || translateEventReason(event.notes) || 'Állatmozgatás',
                                        icon: '🔄',
                                        color: 'bg-blue-100 border-blue-300 text-blue-800',
                                        metadata: {
                                            originalEvent: event,
                                            penLocations: {
                                                from: previousPenInfo?.location,
                                                to: penInfo?.location
                                            }
                                        },
                                        movementDetails // ✅ ÚJ!
                                    });
                                } else {
                                    items.push({
                                        id: `event-${event.id}`,
                                        type: 'legacy_event',
                                        date: event.event_date,
                                        penNumber: penInfo?.pen_number || 'N/A',
                                        penId: event.pen_id,
                                        title: `📋 ${translateEventType(event.event_type)}`,
                                        description: translateEventReason(event.notes) || translateEventReason(event.reason) || 'Esemény',
                                        icon: getEventIcon(event.event_type),
                                        color: 'bg-purple-100 border-purple-300 text-purple-800',
                                        metadata: {
                                            originalEvent: event
                                        },
                                        movementDetails // ✅ ÚJ!
                                    });
                                }
                            }
                        });
                    }
                } catch (error) {
                    console.error('Error loading events:', error);
                }
            }

            // 4. KRONOLÓGIAI RENDEZÉS
            items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            setTimeline(items);
            console.log(`✅ Loaded ${items.length} enhanced hybrid timeline items`);

        } catch (error) {
            console.error('❌ Error loading enhanced hybrid timeline:', error);
        } finally {
            setLoading(false);
        }
    };

    // Real-time sync hook
    const { lastSync } = usePenHistorySync(undefined, animalIdString, loadHybridTimeline);

    useEffect(() => {
        loadHybridTimeline();
    }, [animalEnar, animalIdString, viewMode]);

    // Utility functions
    const translateEventType = (eventType: string): string => {
        const translations: { [key: string]: string } = {
            'function_change': 'Funkció váltás',
            'pen_movement': 'Karám mozgatás',
            'pen_assignment': 'Karám hozzárendelés',
            'birth': 'Születés',
            'health': 'Egészségügyi esemény',
            'breeding': 'Tenyésztési esemény',
            'movement': 'Mozgatás',
            'treatment': 'Kezelés',
            'vaccination': 'Oltás',
            'checkup': 'Ellenőrzés'
        };
        return translations[eventType] || eventType;
    };

    const translateEventReason = (reason: string | null): string => {
        if (!reason) return '';

        const reasonTranslations: { [key: string]: string } = {
            'breeding': 'Tenyésztési célból',
            'other': 'Egyéb okból',
            'health': 'Egészségügyi okból',
            'feeding': 'Takarmányozási okból',
            'treatment': 'Kezelés miatt',
            'quarantine': 'Karantén miatt',
            'separation': 'Elkülönítés miatt',
            'grouping': 'Csoportosítás miatt'
        };

        return reasonTranslations[reason.toLowerCase()] || reason;
    };

    const translateMovementReason = (reason: string | null): string => {
        if (!reason) return '';

        const movementReasons: { [key: string]: string } = {
            'breeding': 'Tenyésztési célból',
            'other': 'Egyéb okból',
            'health': 'Egészségügyi okból',
            'feeding': 'Takarmányozási okból',
            'treatment': 'Kezelés miatt',
            'quarantine': 'Karantén miatt'
        };

        return movementReasons[reason.toLowerCase()] || reason;
    };

    const getFunctionColor = (functionType: string): string => {
        const colors: { [key: string]: string } = {
            'hárem': 'bg-green-100 border-green-300 text-green-800',
            'bölcsi': 'bg-orange-100 border-orange-300 text-orange-800',
            'óvi': 'bg-purple-100 border-purple-300 text-purple-800',
            'vemhes': 'bg-pink-100 border-pink-300 text-pink-800',
            'kórház': 'bg-red-100 border-red-300 text-red-800'
        };
        return colors[functionType] || 'bg-blue-100 border-blue-300 text-blue-800';
    };

    const getFunctionIcon = (functionType: string): string => {
        const icons: { [key: string]: string } = {
            'hárem': '💕',
            'bölcsi': '🐮',
            'óvi': '🐄',
            'vemhes': '🐄💖',
            'kórház': '🏥'
        };
        return icons[functionType] || '📍';
    };

    const getEventIcon = (eventType: string): string => {
        const icons: { [key: string]: string } = {
            'birth': '🐄',
            'health': '❤️',
            'breeding': '💕',
            'movement': '🔄',
            'treatment': '💊',
            'function_change': '📋',
            'pen_movement': '🏠',
            'pen_assignment': '📍'
        };
        return icons[eventType] || '📋';
    };

    const isDateInRange = (date: string, startDate: string, endDate?: string): boolean => {
        const d = new Date(date);
        const start = new Date(startDate);
        const end = endDate ? new Date(endDate) : new Date();
        return d >= start && d <= end;
    };

    const calculateDuration = (startDate: string, endDate: string): string => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        return `${days} nap`;
    };

    const formatDate = (dateString: string): string => {
        return new Date(dateString).toLocaleDateString('hu-HU');
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Karám történet betöltése...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-lg border">
                <h3 className="text-lg font-semibold mb-2">📚 {displayEnar(animalEnar)} Karám Történet</h3>
                <p className="text-sm text-gray-600 mb-3">
                    Hibrid nézet: új kártya rendszer + régi mozgatási adatok
                </p>

                {/* View Mode Filter */}
                <div className="flex gap-2">
                    <button
                        onClick={() => setViewMode('all')}
                        className={`px-3 py-1 rounded text-sm ${viewMode === 'all'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white border border-gray-300'}`}
                    >
                        🔄 Hibrid nézet
                    </button>
                    <button
                        onClick={() => setViewMode('cards_only')}
                        className={`px-3 py-1 rounded text-sm ${viewMode === 'cards_only'
                            ? 'bg-green-600 text-white'
                            : 'bg-white border border-gray-300'}`}
                    >
                        🆕 Csak kártyák
                    </button>
                    <button
                        onClick={() => setViewMode('legacy_only')}
                        className={`px-3 py-1 rounded text-sm ${viewMode === 'legacy_only'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white border border-gray-300'}`}
                    >
                        📊 Csak régi adatok
                    </button>
                </div>
            </div>

            <h2 className="text-xl font-bold text-gray-900 mb-6">
                📚 Karám Történelem - {displayEnar(animalEnar)}
            </h2>

            {/* Statistics */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-white p-3 rounded-lg border text-center">
                    <div className="text-2xl font-bold text-blue-600">
                        {timeline.filter(item => item.type === 'new_period').length}
                    </div>
                    <div className="text-sm text-gray-600">Kártya periódus</div>
                </div>
                <div className="bg-white p-3 rounded-lg border text-center">
                    <div className="text-2xl font-bold text-green-600">
                        {timeline.filter(item => item.type === 'legacy_movement').length}
                    </div>
                    <div className="text-sm text-gray-600">Mozgatás</div>
                </div>
                <div className="bg-white p-3 rounded-lg border text-center">
                    <div className="text-2xl font-bold text-purple-600">
                        {timeline.filter(item => item.type === 'legacy_event').length}
                    </div>
                    <div className="text-sm text-gray-600">Esemény</div>
                </div>
            </div>

            {/* Timeline */}
            {timeline.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <span className="text-6xl mb-4 block">📚</span>
                    <h3 className="text-lg font-semibold mb-2">Még nincs karám történet</h3>
                    <p className="text-gray-600">
                        Ez az állat még nem szerepel karám periódusokban vagy mozgatásokban.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {timeline.map((item, index) => (
                        <div key={item.id} className="relative">
                            {/* Timeline connection line */}
                            {index < timeline.length - 1 && (
                                <div className="absolute left-6 top-12 h-6 w-0.5 bg-gray-300"></div>
                            )}

                            {/* Timeline card */}
                            <div
                                className={`
                                    flex items-start space-x-4 p-4 rounded-lg border-2 cursor-pointer
                                    transition-all duration-200 hover:shadow-md
                                    ${item.color}
                                    ${item.isCurrentPen ? 'ring-2 ring-blue-400' : ''}
                                `}
                                onClick={() => setSelectedItem(item)}
                            >
                                {/* Icon */}
                                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white flex items-center justify-center text-xl border-2 border-current">
                                    {item.icon}
                                </div>

                                {/* Content */}
                                <div className="flex-grow min-w-0">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-semibold text-sm">{item.title}</h4>
                                        <div className="flex items-center gap-2 text-xs">
                                            {item.type === 'new_period' && (
                                                <span className="bg-green-200 text-green-800 px-2 py-1 rounded">
                                                    🆕 {item.metadata?.periodType || 'Új rendszer'}
                                                </span>
                                            )}
                                            {item.type.startsWith('legacy') && (
                                                <span className="bg-blue-200 text-blue-800 px-2 py-1 rounded">
                                                    📊 Régi adat
                                                </span>
                                            )}
                                            {item.isCurrentPen && (
                                                <span className="bg-blue-200 text-blue-800 px-2 py-1 rounded">
                                                    📍 Jelenlegi
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-700 mt-1">{item.description}</p>

                                    {/* ✅ ÚJ: Mozgatási előnézet */}
                                    {item.movementDetails && (
                                        <div className="mt-2 text-xs text-gray-600 space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span>🔄 {item.movementDetails.fromPen} → {item.movementDetails.toPen}</span>
                                                <span>•</span>
                                                <span>👥 {item.movementDetails.animalPosition}/{item.movementDetails.totalAnimalsInPeriod} állat</span>
                                            </div>
                                            {item.movementDetails.reason && (
                                                <div>📋 {item.movementDetails.reason}</div>
                                            )}
                                        </div>
                                    )}

                                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-600">
                                        <span>📅 {formatDate(item.date)}</span>
                                        {item.endDate && (
                                            <span>→ {formatDate(item.endDate)}</span>
                                        )}
                                        {item.penNumber && (
                                            <span>🏠 Karám {item.penNumber}</span>
                                        )}
                                    </div>
                                </div>

                                {/* Click indicator */}
                                <div className="text-gray-400">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Enhanced Details Modal */}
            {selectedItem && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold">
                                    {selectedItem.icon} {selectedItem.title}
                                </h3>
                                <button
                                    onClick={() => setSelectedItem(null)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* ✅ ÚJ: Részletes mozgatási információk */}
                            {selectedItem.movementDetails && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    {/* Mozgatási részletek */}
                                    <div className="bg-blue-50 p-4 rounded-lg">
                                        <h4 className="font-semibold text-blue-800 mb-3">🔄 Mozgatási részletek</h4>
                                        <div className="space-y-2 text-sm">
                                            <div><strong>Honnan:</strong> Karám {selectedItem.movementDetails.fromPen}</div>
                                            <div><strong>Hová:</strong> Karám {selectedItem.movementDetails.toPen}</div>
                                            <div><strong>Indok:</strong> {selectedItem.movementDetails.reason}</div>
                                            <div><strong>Végrehajtó:</strong> {selectedItem.movementDetails.assignedBy}</div>
                                            <div><strong>Időtartam:</strong> {selectedItem.movementDetails.periodDuration}</div>
                                            {selectedItem.movementDetails.notes && (
                                                <div><strong>Megjegyzés:</strong> {selectedItem.movementDetails.notes}</div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Periódus részletek */}
                                    <div className="bg-green-50 p-4 rounded-lg">
                                        <h4 className="font-semibold text-green-800 mb-3">📊 Periódus részletek</h4>
                                        <div className="space-y-2 text-sm">
                                            <div><strong>Állatok száma:</strong> {selectedItem.movementDetails.totalAnimalsInPeriod}</div>
                                            <div><strong>Pozíció:</strong> {selectedItem.movementDetails.animalPosition}. állat</div>
                                            {selectedItem.movementDetails.previousFunction && (
                                                <div><strong>Előző funkció:</strong> {selectedItem.movementDetails.previousFunction}</div>
                                            )}
                                            {selectedItem.movementDetails.nextFunction && (
                                                <div><strong>Következő funkció:</strong> {selectedItem.movementDetails.nextFunction}</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Időszak</label>
                                    <p className="text-sm text-gray-600">
                                        {formatDate(selectedItem.date)}
                                        {selectedItem.endDate && ` - ${formatDate(selectedItem.endDate)}`}
                                    </p>
                                </div>

                                {selectedItem.functionType && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">Karám funkció</label>
                                        <p className="text-sm text-gray-600">{selectedItem.functionType}</p>
                                    </div>
                                )}

                                <div>
                                    <label className="text-sm font-medium text-gray-700">Leírás</label>
                                    <p className="text-sm text-gray-600">{selectedItem.description}</p>
                                </div>

                                {/* ✅ ÚJ: Tenyészbikák részletes megjelenítése */}
                                {selectedItem.movementDetails?.bullsInPeriod && selectedItem.movementDetails.bullsInPeriod.length > 0 && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">
                                            🐂 Tenyészbikák ({selectedItem.movementDetails.bullsInPeriod.length})
                                        </label>
                                        <div className="grid grid-cols-2 gap-2 mt-2">
                                            {selectedItem.movementDetails.bullsInPeriod.map((bull: any, index: number) => (
                                                <div key={index} className="text-xs p-2 bg-pink-50 rounded border">
                                                    <div className="font-semibold">{bull.name || 'Névtelen'}</div>
                                                    <div className="text-gray-600">{displayEnar(bull.enar)}</div>
                                                    {bull.kplsz && <div className="text-gray-500">KPLSZ: {bull.kplsz}</div>}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* ✅ ÚJ: VV eredmények megjelenítése */}
                                {selectedItem.movementDetails?.vvResults && selectedItem.movementDetails.vvResults.length > 0 && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">
                                            🔬 VV eredmények ({selectedItem.movementDetails.vvResults.length})
                                        </label>
                                        <div className="space-y-2 mt-2">
                                            {selectedItem.movementDetails.vvResults.map((vv: any, index: number) => (
                                                <div key={index} className={`text-xs p-2 rounded border ${vv.pregnancy_status === 'vemhes' ? 'bg-green-50' : 'bg-orange-50'
                                                    }`}>
                                                    <div className="flex justify-between">
                                                        <span className="font-semibold">
                                                            {vv.pregnancy_status === 'vemhes' ? '✅ Vemhes' : '❌ Üres'}
                                                        </span>
                                                        <span>{formatDate(vv.vv_date)}</span>
                                                    </div>
                                                    {vv.vv_result_days && (
                                                        <div>Napok: {vv.vv_result_days}</div>
                                                    )}
                                                    {vv.father_name && (
                                                        <div>Apa: {vv.father_name}</div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {selectedItem.animals && selectedItem.animals.length > 0 && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">
                                            Társak ebben a periódusban ({selectedItem.animals.length})
                                        </label>
                                        <div className="grid grid-cols-2 gap-2 mt-2">
                                            {selectedItem.animals.slice(0, 10).map((animal: any, index: number) => (
                                                <div key={index} className="text-xs p-2 bg-gray-50 rounded">
                                                    {displayEnar(animal.enar || animal.id)} {animal.nev && `(${animal.nev})`}
                                                </div>
                                            ))}
                                            {selectedItem.animals.length > 10 && (
                                                <div className="text-xs p-2 bg-gray-100 rounded text-center col-span-2">
                                                    ... és még {selectedItem.animals.length - 10} állat
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {selectedItem.metadata && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">További információk</label>
                                        <div className="space-y-2 mt-2">
                                            {selectedItem.metadata.animalCount && (
                                                <div className="text-sm">
                                                    <span className="font-medium">🐄 Állatok száma:</span> {selectedItem.metadata.animalCount}
                                                </div>
                                            )}
                                            {selectedItem.metadata.periodType && (
                                                <div className="text-sm">
                                                    <span className="font-medium">📝 Típus:</span> {selectedItem.metadata.periodType}
                                                </div>
                                            )}
                                            {selectedItem.metadata.entry_date && (
                                                <div className="text-sm">
                                                    <span className="font-medium">📅 Rögzítve:</span> {formatDate(selectedItem.metadata.entry_date)}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HybridAnimalPenHistory;