// src/components/HybridAnimalPenHistory.tsx
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { usePenHistorySync } from '@/lib/penHistorySync';


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
}

interface Props {
    animalEnar: string;
    animalId: string | number; // string vagy number típus elfogadása
}

const HybridAnimalPenHistory: React.FC<Props> = ({ animalEnar, animalId }) => {
    const [timeline, setTimeline] = useState<HybridTimelineItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'all' | 'cards_only' | 'legacy_only'>('all');
    const [selectedItem, setSelectedItem] = useState<HybridTimelineItem | null>(null);

    // animalId string konverzió
    const animalIdString = animalId.toString();

    // 🔥 TESZT KONZOL ÜZENET
    console.log('🔥 HIBRID KOMPONENS BETÖLTŐDÖTT:', animalEnar, 'ID:', animalIdString);

    const loadHybridTimeline = async () => {
        try {
            setLoading(true);
            console.log(`🔍 Loading hybrid timeline for animal: ${animalEnar}`);

            const items: HybridTimelineItem[] = [];

            // 1. ÚJ KÁRTYA RENDSZER ADATOK - EGYSZERŰBB MEGKÖZELÍTÉS
            if (viewMode === 'all' || viewMode === 'cards_only') {
                // Először minden periódust lekérdezünk, majd JavaScriptben szűrünk
                const { data: allPeriods, error: periodsError } = await supabase
                    .from('pen_history_periods')
                    .select(`
            *,
            pens!inner(pen_number)
          `)
                    .order('start_date', { ascending: false });

                if (periodsError) {
                    console.error('Error loading periods:', periodsError);
                } else {
                    // JavaScript szűrés az állat ENAR alapján
                    const filteredPeriods = allPeriods?.filter(period => {
                        const animals = period.animals_snapshot as any[] || [];
                        return animals.some(animal =>
                            animal.enar === animalEnar ||
                            animal.id === animalIdString ||
                            (typeof animal === 'string' && animal === animalEnar)
                        );
                    }) || [];

                    // VV eredmények lekérdezése az állathoz
                    const { data: vvResults } = await supabase
                        .from('vv_results')
                        .select('*')
                        .eq('animal_enar', animalEnar)
                        .order('created_at', { ascending: false });

                    // Hárem history lekérdezése a releváns karámokhoz
                    const penIds = [...new Set(filteredPeriods.map(p => p.pen_id))];
                    const { data: haremHistory } = await supabase
                        .from('pen_harem_history')
                        .select('*')
                        .in('pen_id', penIds);

                    filteredPeriods.forEach(period => {
                        const pen = period.pens as any;
                        const functionColor = getFunctionColor(period.function_type);
                        const functionIcon = getFunctionIcon(period.function_type);

                        // Időszak alapú VV és hárem adatok
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

                        // Tenyészbika információk kiemelése hárem esetén
                        let description = `${period.function_type.toUpperCase()} periódus`;
                        let extraInfo = '';

                        if (period.function_type === 'hárem') {
                            // Hárem specifikus adatok
                            if (periodHarem && periodHarem.bulls) {
                                const bulls = periodHarem.bulls as any[];
                                const bullNames = bulls.map(b => b.name || b.enar).join(', ');
                                extraInfo += ` • 🐂 ${bullNames}`;
                            }

                            // VV eredmények hozzáadása
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
                                haremInfo: periodHarem
                            },
                            animals: period.animals_snapshot,
                            isCurrentPen: !period.end_date
                        });
                    });
                }
            }

            // 2. RÉGI MOZGATÁSI ADATOK (egyszerűbb lekérdezés)
            if (viewMode === 'all' || viewMode === 'legacy_only') {
                try {
                    const { data: movements, error: movementsError } = await supabase
                        .from('animal_movements')
                        .select('*')
                        .eq('animal_id', animalIdString)
                        .order('moved_at', { ascending: false });

                    if (movementsError) {
                        console.error('Error loading movements:', movementsError);
                    } else if (movements && movements.length > 0) {
                        // Pen információk külön lekérdezése ha szükséges
                        movements.forEach(movement => {
                            const isConflicting = items.some(item =>
                                item.type === 'new_period' &&
                                isDateInRange(movement.moved_at, item.date, item.endDate)
                            );

                            if (!isConflicting) {
                                items.push({
                                    id: `movement-${movement.id}`,
                                    type: 'legacy_movement',
                                    date: movement.moved_at,
                                    penNumber: `${movement.to_pen_id}`, // Egyszerű megjelenítés
                                    penId: movement.to_pen_id,
                                    title: `Mozgatás`,
                                    description: movement.movement_reason || 'Állatmozgatás',
                                    icon: '🔄',
                                    color: 'bg-blue-100 border-blue-300 text-blue-800'
                                });
                            }
                        });
                    }
                } catch (error) {
                    console.error('Error loading movements:', error);
                }
            }

            // 3. RÉGI ESEMÉNYEK (egyszerűbb lekérdezés)
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
                        // VV eredmények előre lekérdezése az összes function_change eseményhez
                        const functionChangeEvents = events.filter(e => e.event_type === 'function_change');
                        const vvPromises = functionChangeEvents.map(async (event) => {
                            const eventDate = new Date(event.event_date);
                            const thirtyDaysBefore = new Date(eventDate.getTime() - 30 * 24 * 60 * 60 * 1000);
                            const thirtyDaysAfter = new Date(eventDate.getTime() + 30 * 24 * 60 * 60 * 1000);

                            const { data: nearbyVVResults } = await supabase
                                .from('vv_results')
                                .select('*')
                                .eq('animal_enar', animalEnar)
                                .gte('vv_date', thirtyDaysBefore.toISOString().split('T')[0])
                                .lte('vv_date', thirtyDaysAfter.toISOString().split('T')[0])
                                .order('vv_date', { ascending: false });

                            return {
                                eventId: event.id,
                                vvResults: nearbyVVResults || []
                            };
                        });

                        const allVVResults = await Promise.all(vvPromises);
                        const vvLookup = Object.fromEntries(
                            allVVResults.map(r => [r.eventId, r.vvResults])
                        );
                        // Events-hez pen számok lekérdezése (current + previous)
                        const eventPenIds = [...new Set([
                            ...events.map(e => e.pen_id),
                            ...events.map(e => e.previous_pen_id)
                        ].filter(Boolean))];

                        const { data: eventPenNumbers } = await supabase
                            .from('pens')
                            .select('id, pen_number')
                            .in('id', eventPenIds);

                        const eventPenLookup = Object.fromEntries(
                            eventPenNumbers?.map(p => [p.id, p.pen_number]) || []
                        );

                        events.forEach(event => {
                            const isConflicting = items.some(item =>
                                item.type === 'new_period' &&
                                isDateInRange(event.event_date, item.date, item.endDate)
                            );

                            if (!isConflicting) {
                                const penNumber = event.pen_id ? eventPenLookup[event.pen_id] || 'N/A' : 'N/A';
                                const previousPenNumber = event.previous_pen_id ? eventPenLookup[event.previous_pen_id] || 'N/A' : null;

                                // VV eredmények hozzáadása function_change eseményekhez
                                let extraEventInfo = '';
                                if (event.event_type === 'function_change') {
                                    const nearbyVVResults = vvLookup[event.id] || [];

                                    if (nearbyVVResults.length > 0) {
                                        const vv = nearbyVVResults[0];
                                        if (vv.pregnancy_status === 'vemhes') {
                                            // Possible fathers lekérése
                                            const possibleFathers = vv.possible_fathers as any[] || [];
                                            const fatherNames = possibleFathers.length > 0
                                                ? possibleFathers.map(f => f.name).join(', ')
                                                : vv.father_name;

                                            const vvDate = new Date(vv.vv_date).toLocaleDateString('hu-HU');
                                            extraEventInfo = ` • ✅ VV: ${vv.vv_result_days} nap (${fatherNames}) - ${vvDate}`;
                                        } else {
                                            const vvDate = new Date(vv.vv_date).toLocaleDateString('hu-HU');
                                            extraEventInfo = ` • ❌ VV: negatív - ${vvDate}`;
                                        }
                                    }
                                    // ✨ ÚJ: Hárem tenyészbika információk hozzáadása
                                    if (event.function_metadata && event.function_metadata.bulls) {
                                        const bulls = event.function_metadata.bulls as any[];
                                        const bullNames = bulls.map(b => b.name).join(', ');
                                        extraEventInfo += ` • 🐂 Hárem: ${bullNames}`;
                                    }
                                }

                                // Mozgatás típusú események külön kezelése
                                if (event.event_type === 'pen_movement' || event.event_type === 'pen_assignment') {
                                    const title = event.event_type === 'pen_movement'
                                        ? `🔄 Mozgatás: ${previousPenNumber || 'N/A'} → ${penNumber}`
                                        : `📍 Bekerülés: Karám ${penNumber}`;

                                    items.push({
                                        id: `event-movement-${event.id}`,
                                        type: 'legacy_movement', // Mozgatásként kezeljük
                                        date: event.event_date,
                                        penNumber: penNumber,
                                        penId: event.pen_id,
                                        title: title,
                                        description: event.reason || event.notes || 'Állatmozgatás',
                                        icon: '🔄',
                                        color: 'bg-blue-100 border-blue-300 text-blue-800'
                                    });
                                } else {
                                    // Egyéb események (function_change, stb.)
                                    items.push({
                                        id: `event-${event.id}`,
                                        type: 'legacy_event',
                                        date: event.event_date,
                                        penNumber: penNumber,
                                        penId: event.pen_id,
                                        title: `📋 ${translateEventType(event.event_type)}`,
                                        description: `${event.notes || event.reason || 'Esemény'}${extraEventInfo}`,
                                        icon: getEventIcon(event.event_type),
                                        color: 'bg-purple-100 border-purple-300 text-purple-800'
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
            console.log(`✅ Loaded ${items.length} hybrid timeline items`);

        } catch (error) {
            console.error('❌ Error loading hybrid timeline:', error);
        } finally {
            setLoading(false);
        }
    };

    // 🔄 Real-time sync hook - a loadHybridTimeline függvény után
    const { lastSync } = usePenHistorySync(undefined, animalIdString, loadHybridTimeline);

    useEffect(() => {
        loadHybridTimeline();
    }, [animalEnar, animalIdString, viewMode]);

    const getFunctionColor = (functionType: string): string => {
        const colors: { [key: string]: string } = {
            'hárem': 'bg-green-100 border-green-300 text-green-800',
            'bölcsi': 'bg-orange-100 border-orange-300 text-orange-800',
            'óvi': 'bg-purple-100 border-purple-300 text-purple-800',
            'vemhes': 'bg-pink-100 border-pink-300 text-pink-800',
            'kórház': 'bg-red-100 border-red-300 text-red-800',
            'hízóbika': 'bg-yellow-100 border-yellow-300 text-yellow-800',
            'száraz': 'bg-gray-100 border-gray-300 text-gray-800'
        };
        return colors[functionType] || 'bg-blue-100 border-blue-300 text-blue-800';
    };

    const getFunctionIcon = (functionType: string): string => {
        const icons: { [key: string]: string } = {
            'hárem': '💕',
            'bölcsi': '🐮',
            'óvi': '🐄',
            'vemhes': '🐄💖',
            'kórház': '🏥',
            'hízóbika': '🥩',
            'száraz': '☀️'
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

    const getPenNumber = async (penId: string): Promise<string> => {
        try {
            const { data } = await supabase
                .from('pens')
                .select('pen_number')
                .eq('id', penId)
                .single();
            return data?.pen_number || 'N/A';
        } catch {
            return 'N/A';
        }
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
                <h3 className="text-lg font-semibold mb-2">📚 {animalEnar} Karám Történet</h3>
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
                📚 Karám Történelem - {animalEnar}
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
                                                    🆕 Új rendszer
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

            {/* Details Modal */}
            {selectedItem && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
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

                                {selectedItem.animals && selectedItem.animals.length > 0 && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">
                                            Társak ebben a periódusban ({selectedItem.animals.length})
                                        </label>
                                        <div className="grid grid-cols-2 gap-2 mt-2">
                                            {selectedItem.animals.slice(0, 10).map((animal: any, index: number) => (
                                                <div key={index} className="text-xs p-2 bg-gray-50 rounded">
                                                    {animal.enar || animal.id} {animal.nev && `(${animal.nev})`}
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
                                            {selectedItem.metadata.animal_count && (
                                                <div className="text-sm">
                                                    <span className="font-medium">🐄 Állatok száma:</span> {selectedItem.metadata.animal_count}
                                                </div>
                                            )}
                                            {selectedItem.metadata.manual_entry && (
                                                <div className="text-sm">
                                                    <span className="font-medium">📝 Rögzítés típusa:</span> Kézi rögzítés
                                                </div>
                                            )}
                                            {selectedItem.metadata.entry_date && (
                                                <div className="text-sm">
                                                    <span className="font-medium">📅 Rögzítve:</span> {new Date(selectedItem.metadata.entry_date).toLocaleDateString('hu-HU')}
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