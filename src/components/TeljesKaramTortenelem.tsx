// src/components/TeljesKaramTortenelem.tsx - JAVÍTOTT ÉS TISZTÍTOTT VERZIÓ
'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { syncHaremData, createHistoricalSnapshot } from '@/lib/utils/haremSync';
import AnimalSelector from '@/components/AnimalSelector';

// 🔹 INTERFACES
interface KombinaltEsemeny {
    id: string;
    animal_id: number;
    datum: string;
    idopont: string;
    tipus: 'event' | 'movement';
    forrás: 'animal_events' | 'animal_movements';
    from_pen?: string;
    to_pen: string;
    ok: string;
    funkci?: string;
    megjegyzes?: string;
    metadata?: any;
    function_metadata?: any;
    pen_number?: string;
    pen_location?: string;
    animal_enar?: string;
    animal_kategoria?: string;
    animal_pregnancy_status?: string;
}

interface TenyeszBika {
    id: string;
    name: string;
    enar: string;
    kplsz?: string;
    active: boolean;
}

interface FormData {
    datum: string;
    idopont: string;
    esemenyTipus: 'pen_assignment' | 'pen_movement' | 'function_change' | 'breeding' | 'pregnancy' | 'birth' | 'medical' | 'quarantine' | 'culling' | 'breeding_entry' | 'harem_entry' | 'other';
    funkci: string;
    kivalasztottBikak: string[];
    hovaPen: string;
    megjegyzes: string;
    torteneti: boolean;
    haremKezdete?: string;
    selectedAnimals: number[];
}

interface TeljesKaramTortenelemProps {
    penId?: string;
    animalId?: number;
    penNumber?: string;
    penLocation?: string;
    onDataChange?: () => void;
    mode?: 'pen' | 'animal' | 'view-only';
}

// 🔹 MAIN COMPONENT
const TeljesKaramTortenelem: React.FC<TeljesKaramTortenelemProps> = ({
    penId,
    animalId,
    penNumber = 'Ismeretlen',
    penLocation = '',
    onDataChange,
    mode = 'pen'
}) => {
    // 🔹 STATE MANAGEMENT
    const [kombinaltEsemenyek, setKombinaltEsemenyek] = useState<KombinaltEsemeny[]>([]);
    const [availableBulls, setAvailableBulls] = useState<TenyeszBika[]>([]);
    const [availablePens, setAvailablePens] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    // ✅ Pagination és szűrés state-ek
    const [currentPage, setCurrentPage] = useState(1);
    const [eventsPerPage] = useState(20); // 20 esemény/oldal
    const [eventFilter, setEventFilter] = useState<'all' | 'harem' | 'movement'>('all');
    const [editingEvent, setEditingEvent] = useState<KombinaltEsemeny | null>(null);
    const [formData, setFormData] = useState<FormData>({
        datum: new Date().toISOString().split('T')[0],
        idopont: '12:00',
        esemenyTipus: 'function_change',
        funkci: 'hárem',
        kivalasztottBikak: [],
        hovaPen: '',
        megjegyzes: '',
        torteneti: false,
        selectedAnimals: [],
    });

    // 🔹 LOAD DATA ON MOUNT
    useEffect(() => {
        loadAllData();
    }, [penId, animalId]);

    // 🔹 COMPREHENSIVE DATA LOADING
    const loadAllData = async () => {
        try {
            setLoading(true);
            setError(null);

            console.log('🔄 Teljes adatbetöltés kezdése...', {
                penId,
                animalId,
                mode
            });

            // KRITIKUS DEBUG: Ha nincs animalId, ne futassunk semmit!
            if (!animalId && mode === 'animal') {
                console.error('❌ HIBA: animalId hiányzik animal módban!');
                setError('Animal ID hiányzik!');
                setLoading(false);
                return;
            }

            await Promise.all([
                loadEvents(),
                loadBulls(),
                loadPens()
            ]);

            setLoading(false);
        } catch (error) {
            console.error('💥 Teljes adatbetöltési hiba:', error);
            setError((error as Error).message);
            setLoading(false);
        }
    };

    // 🔹 LOAD EVENTS (JAVÍTOTT!)
    const loadEvents = async () => {
        try {
            const kombinalt: KombinaltEsemeny[] = [];

            // 🔥 Animal events betöltése - EGYSZERŰSÍTETT LEKÉRDEZÉS
            let eventsQuery = supabase
                .from('animal_events')
                .select('*')  // Csak az events tábla mezői
                .order('event_date', { ascending: false });

            // KRITIKUS DEBUG: Karám szűrés
            if (penId) {
                console.log('🔍 Karám szűrés aktív, penId:', penId);
                eventsQuery = eventsQuery.eq('pen_id', penId);
            }
            if (animalId) {
                console.log('🔍 Állat szűrés aktív, animalId:', animalId);
                eventsQuery = eventsQuery.eq('animal_id', animalId);
            }

            const { data: events, error: eventsError } = await eventsQuery;

            console.log('📊 Animal events lekérdezés eredménye (egyszerűsített):', {
                penId,
                animalId,
                eventsCount: events?.length || 0,
                error: eventsError?.message || 'nincs',
                sampleEvent: events?.[0] // Első esemény debug-hoz
            });

            if (!eventsError && events) {
                // KÜLÖN lekérdezések az állat és karám nevekhez
                const animalIds = [...new Set(events.map(e => e.animal_id).filter(Boolean))];
                const penIds = [...new Set(events.map(e => e.pen_id).filter(Boolean))];

                // Állat nevek ÉS KATEGÓRIÁK betöltése
                let animalNames: { [key: number]: any } = {};
                if (animalIds.length > 0) {
                    const { data: animalsData } = await supabase
                        .from('animals')
                        .select('id, enar, kategoria, pregnancy_status')  // ← BŐVÍTÉS!
                        .in('id', animalIds);

                    if (animalsData) {
                        animalNames = animalsData.reduce((acc: { [key: number]: any }, animal: any) => {
                            acc[animal.id] = {
                                enar: animal.enar,
                                kategoria: animal.kategoria,
                                pregnancy_status: animal.pregnancy_status
                            };
                            return acc;
                        }, {});
                    }
                }

                // Karám nevek betöltése
                let penNames: { [key: string]: { pen_number: string, location: string } } = {};
                if (penIds.length > 0) {
                    const { data: pensData } = await supabase
                        .from('pens')
                        .select('id, pen_number, location')
                        .in('id', penIds);

                    if (pensData) {
                        penNames = pensData.reduce((acc: { [key: string]: any }, pen: any) => {
                            acc[pen.id] = { pen_number: pen.pen_number, location: pen.location };
                            return acc;
                        }, {});
                    }
                }

                events.forEach(event => {
                    kombinalt.push({
                        id: `event_${event.id}`,
                        animal_id: event.animal_id,
                        datum: event.event_date,
                        idopont: event.event_time || '12:00',
                        tipus: 'event',
                        forrás: 'animal_events',
                        from_pen: event.previous_pen_id,
                        to_pen: event.pen_id,
                        ok: event.reason || event.event_type || 'Esemény',
                        funkci: event.pen_function,
                        megjegyzes: event.notes,
                        metadata: event.function_metadata,
                        function_metadata: event.function_metadata,
                        pen_number: penNames[event.pen_id]?.pen_number || `Karám ID: ${event.pen_id}`,
                        pen_location: penNames[event.pen_id]?.location || '',
                        animal_enar: animalNames[event.animal_id]?.enar || `ID: ${event.animal_id}`,
                        animal_kategoria: animalNames[event.animal_id]?.kategoria || 'unknown',
                        animal_pregnancy_status: animalNames[event.animal_id]?.pregnancy_status || null
                    });
                });
            }

            // 🔥 Animal movements betöltése - TELJES METADATA TÁMOGATÁSSAL!
            let movementsQuery = supabase
                .from('animal_movements')
                .select(`
          *,
          function_metadata,
          animals!inner(enar)
        `)
                .order('moved_at', { ascending: false });

            // KRITIKUS DEBUG: Movements szűrés
            if (penId) {
                console.log('🔍 Movements karám szűrés, penId:', penId);
                movementsQuery = movementsQuery.or(`from_pen_id.eq.${penId},to_pen_id.eq.${penId}`);
            }
            if (animalId) {
                console.log('🔍 Movements állat szűrés, animalId:', animalId);
                movementsQuery = movementsQuery.eq('animal_id', animalId);
            }

            const { data: movements, error: movementsError } = await movementsQuery;

            console.log('📊 Animal movements lekérdezés eredménye:', {
                penId,
                animalId,
                movementsCount: movements?.length || 0,
                error: movementsError?.message || 'nincs',
                movements: movements?.slice(0, 3) // Első 3 mozgatás debug-hoz
            });

            if (!movementsError && movements) {
                // Karám nevek betöltése a movements-hez
                const penIds = [...new Set(movements.map(m => m.to_pen_id).filter(Boolean))];
                let penNames: { [key: string]: string } = {};

                if (penIds.length > 0) {
                    const { data: pensData } = await supabase
                        .from('pens')
                        .select('id, pen_number')
                        .in('id', penIds);

                    if (pensData) {
                        penNames = pensData.reduce((acc: { [key: string]: string }, pen: any) => {
                            acc[pen.id] = pen.pen_number;
                            return acc;
                        }, {});
                    }
                }

                movements.forEach(movement => {
                    kombinalt.push({
                        id: `movement_${movement.id}`,
                        animal_id: movement.animal_id,
                        datum: movement.moved_at.split('T')[0],
                        idopont: movement.moved_at.split('T')[1]?.substring(0, 5) || '12:00',
                        tipus: 'movement',
                        forrás: 'animal_movements',
                        from_pen: movement.from_pen_id,
                        to_pen: movement.to_pen_id,
                        ok: movement.movement_reason || movement.function_type || 'Mozgatás',
                        funkci: movement.function_type,
                        megjegyzes: movement.notes,
                        metadata: movement.function_metadata,
                        function_metadata: movement.function_metadata,
                        pen_number: penNames[movement.to_pen_id] || `Karám ID: ${movement.to_pen_id}`,
                        pen_location: '',
                        animal_enar: movement.animals?.enar
                    });
                });
            }

            // DUPLIKÁTUM SZŰRÉS - JAVÍTOTT VERZIÓ
            const uniqueEvents = new Map();
            kombinalt.forEach(event => {
                // 🔥 PONTOSABB KULCS - állat + dátum + idő + esemény részletek
                const uniqueKey = `${event.animal_id}_${event.datum}_${event.idopont}_${event.ok}`;

                if (!uniqueEvents.has(uniqueKey)) {
                    uniqueEvents.set(uniqueKey, event);
                } else {
                    const existing = uniqueEvents.get(uniqueKey);

                    // 🔥 INTELLIGENS PRIORITÁS
                    // 1. animal_events prioritást élvez movements-hez képest
                    if (event.forrás === 'animal_events' && existing.forrás === 'animal_movements') {
                        uniqueEvents.set(uniqueKey, event);
                        console.log('🔄 Duplikátum felülírva (events > movements):', uniqueKey);
                    }
                    // 2. Újabb esemény prioritást élvez régebbivel szemben
                    else if (event.forrás === existing.forrás) {
                        const eventId = parseInt(event.id.replace('event_', '').replace('movement_', ''));
                        const existingId = parseInt(existing.id.replace('event_', '').replace('movement_', ''));

                        if (eventId > existingId) {
                            uniqueEvents.set(uniqueKey, event);
                            console.log('🔄 Duplikátum felülírva (újabb esemény):', uniqueKey);
                        } else {
                            console.log('🚫 Duplikátum eldobva (régebbi esemény):', uniqueKey);
                        }
                    }
                    // 3. Movements eldobása ha events van
                    else {
                        console.log('🚫 Duplikátum eldobva (movements < events):', uniqueKey);
                    }
                }
            });

            const finalEvents = Array.from(uniqueEvents.values());

            console.log('✅ DUPLIKÁTUM SZŰRÉS EREDMÉNYE:', {
                totalEvents: kombinalt.length,
                uniqueEvents: finalEvents.length,
                duplicatesRemoved: kombinalt.length - finalEvents.length
            });


            // Időrendi rendezés - LEGFRISSEBB ELSŐ!
            finalEvents.sort((a, b) => {
                const dateA = new Date(`${a.datum}T${a.idopont}`);
                const dateB = new Date(`${b.datum}T${b.idopont}`);
                return dateB.getTime() - dateA.getTime();
            });

            // 🔬 VV EREDMÉNYEK BETÖLTÉSE HÁREM ESEMÉNYEKHEZ
            await loadVVResults(kombinalt);

            setKombinaltEsemenyek(kombinalt);

            console.log('✅ FINAL KOMBINÁLT ESEMÉNYEK:', {
                totalEvents: kombinalt.length,
                penId,
                animalId,
                mode,
                sampleEvents: kombinalt.slice(0, 2).map(e => ({
                    id: e.id,
                    datum: e.datum,
                    animal_enar: e.animal_enar,
                    pen_number: e.pen_number,
                    funkci: e.funkci
                }))
            });

            // Jelenlegi karám frissítése
            updateCurrentPen(kombinalt);

        } catch (error) {
            console.error('❌ Események betöltési hiba:', error);
        }
    };

    // ✅ Szűrt és paginated események
    const filteredEvents = kombinaltEsemenyek.filter(event => {
        if (eventFilter === 'all') return true;
        if (eventFilter === 'harem') return event.funkci === 'hárem';
        if (eventFilter === 'movement') return event.tipus === 'movement';
        return true;
    });

    const totalPages = Math.ceil(filteredEvents.length / eventsPerPage);
    const startIndex = (currentPage - 1) * eventsPerPage;
    const currentEvents = filteredEvents.slice(startIndex, startIndex + eventsPerPage);

    console.log('📊 Pagination info:', {
        total: kombinaltEsemenyek.length,
        filtered: filteredEvents.length,
        currentPage,
        totalPages,
        showing: currentEvents.length
    });

    // 🔬 VV EREDMÉNYEK BETÖLTÉSE
    const loadVVResults = async (events: KombinaltEsemeny[]) => {
        if (!animalId) return;

        try {
            // Először megkeressük az állat ENAR-ját
            const { data: animalData, error: animalError } = await supabase
                .from('animals')
                .select('enar')
                .eq('id', animalId)
                .single();

            if (animalError || !animalData) {
                console.log('❌ Állat ENAR nem található:', animalError);
                return;
            }

            const animalEnar = animalData.enar as string;
            console.log('🐄 Állat ENAR:', animalEnar);

            // VV eredmények lekérdezése ENAR alapján
            const { data: vvResults, error } = await supabase
                .from('vv_results')
                .select('vv_date, pregnancy_status, vv_result_days, animal_enar')
                .eq('animal_enar', animalEnar)
                .order('vv_date', { ascending: false });

            if (error || !vvResults) {
                console.log('❌ VV eredmények nem találhatók:', error);
                return;
            }

            console.log('📊 VV eredmények betöltve:', vvResults);

            // VV eredmények hozzárendelése a hárem eseményekhez
            events.forEach(event => {
                if (event.funkci === 'hárem') {
                    // Hárem kezdete - metadata-ból vagy esemény dátumából
                    const haremKezdete = event.function_metadata?.pairing_start_date ?
                        new Date(event.function_metadata.pairing_start_date) :
                        new Date(event.datum);

                    console.log(`🔍 Hárem esemény ${event.datum}, hárem kezdete: ${haremKezdete.toISOString().split('T')[0]}`);

                    // Hárem kezdete után első VV eredmény keresése
                    const relevantVV = vvResults.find((vv: any) => {
                        const vvDate = new Date(vv.vv_date);
                        const isAfterStart = vvDate >= haremKezdete;
                        console.log(`  VV ${vv.vv_date}: ${isAfterStart ? 'RELEVÁNS' : 'korábbi'} (${vv.pregnancy_status})`);
                        return isAfterStart;
                    });

                    if (relevantVV) {
                        console.log(`✅ VV eredmény találva: ${relevantVV.vv_date} - ${relevantVV.pregnancy_status}`);
                        // VV eredmény hozzáadása a metadata-hoz
                        if (!event.function_metadata) event.function_metadata = {};
                        event.function_metadata.vv_result = {
                            date: relevantVV.vv_date,
                            status: relevantVV.pregnancy_status,
                            days: relevantVV.vv_result_days
                        };
                    } else {
                        console.log('❌ Nincs releváns VV eredmény ehhez a háremhez');
                    }
                }
            });

        } catch (error) {
            console.error('❌ VV eredmények betöltési hiba:', error);
        }
    };

    // 🔹 UPDATE CURRENT PEN
    const updateCurrentPen = async (events: KombinaltEsemeny[]) => {
        // KARÁM MÓDBAN: Nem frissítjük az állat jelenlegi karám mezőjét
        // mert az végtelen loop-ot okoz a szülő komponens újratöltésével

        if (events.length > 0 && mode === 'animal' && animalId) {
            // CSAK ÁLLAT MÓDBAN frissítjük az állat jelenlegi karám mezőjét
            const latestEvent = events[0];

            try {
                const { error } = await supabase
                    .from('animals')
                    .update({
                        jelenlegi_karam: latestEvent.pen_number
                    })
                    .eq('id', animalId);

                if (!error && onDataChange) {
                    console.log('✅ Állat jelenlegi karám frissítve (állat mód):', latestEvent.animal_enar, '→', latestEvent.pen_number);
                    onDataChange();
                }
            } catch (error) {
                console.warn('⚠️ Állat jelenlegi karám frissítési exception:', error);
            }
        }

        // KARÁM MÓDBAN: Nincs szülő frissítés - elkerüljük a loop-ot
        console.log('ℹ️ updateCurrentPen befejezve, mode:', mode, 'events:', events.length);
    };

    // 🔍 ÁLLAT AKTUÁLIS STÁTUSZ DETEKTÁLÁS
    const getCurrentAnimalStatus = async (animalId: number) => {
        try {
            // 1. Legfrissebb VV eredmény lekérdezése
            const { data: animalData } = await supabase
                .from('animals')
                .select('enar, pregnancy_status')
                .eq('id', animalId)
                .single();

            if (!animalData) return 'unknown';

            // 2. Manual override ellenőrzés
            if (animalData.pregnancy_status === 'vemhes' || animalData.pregnancy_status === 'pregnant') {
                return 'vemhes';
            }

            // 3. Legfrissebb VV eredmény
            const { data: vvResults } = await supabase
                .from('vv_results')
                .select('vv_date, pregnancy_status')
                .eq('animal_enar', animalData.enar)
                .order('vv_date', { ascending: false })
                .limit(1);

            if (vvResults && vvResults.length > 0) {
                const latestVV = vvResults[0];
                return latestVV.pregnancy_status || 'unknown';
            }

            return 'no_vv';
        } catch (error) {
            console.error('❌ Állat státusz detektálási hiba:', error);
            return 'unknown';
        }
    };

    // 🔹 LOAD BULLS
    const loadBulls = async () => {
        try {
            const { data, error } = await supabase
                .from('bulls')
                .select('id, name, enar, kplsz, active')
                .eq('active', true)
                .order('name');

            if (error) {
                // Fallback - tenyészbikák az animals táblából
                const { data: animalBulls } = await supabase
                    .from('animals')
                    .select('id, enar, kategoria')
                    .eq('kategoria', 'tenyészbika')
                    .order('enar');

                const processedBulls: TenyeszBika[] = (animalBulls || []).map(bull => ({
                    id: bull.id.toString(),
                    name: bull.enar.split(' ').pop() || 'Névtelen',
                    enar: bull.enar,
                    active: true
                }));

                setAvailableBulls(processedBulls);
                return;
            }

            setAvailableBulls(data || []);
        } catch (error) {
            console.error('❌ Bikák betöltése hiba:', error);
        }
    };

    // 🔹 LOAD PENS
    const loadPens = async () => {
        try {
            const { data, error } = await supabase
                .from('pens')
                .select('id, pen_number, location, pen_type')
                .order('pen_number');

            if (error) throw error;
            setAvailablePens(data || []);
        } catch (error) {
            console.error('❌ Karamok betöltése hiba:', error);
        }
    };

    // 🔹 EVENT HANDLERS
    const openModal = (event?: KombinaltEsemeny) => {
        if (event) {
            setEditingEvent(event);
            setFormData({
                datum: event.datum,
                idopont: event.idopont,
                esemenyTipus: 'function_change',
                funkci: event.funkci || 'hárem',
                kivalasztottBikak: event.function_metadata?.bulls?.map((b: any) => b.id) || [],
                hovaPen: event.to_pen,
                megjegyzes: event.megjegyzes || '',
                torteneti: false,
                haremKezdete: event.function_metadata?.pairing_start_date || event.datum,
                selectedAnimals: [] // ÜRES MARAD szerkesztésnél!
            });
        } else {
            setEditingEvent(null);
            setFormData({
                ...formData,
                hovaPen: penId || '',
                haremKezdete: undefined,
                selectedAnimals: [] // ÜRES MARAD!
            });
        }
        setShowModal(true);
    };

    // 🔹 SAVE FUNKCIÓ
    const handleSave = async () => {
        try {
            // Validáció
            if (!formData.datum || !formData.funkci) {
                alert('⚠️ Dátum és funkció kötelező!');
                return;
            }

            // INTELLIGENS ÁLLAT VALIDÁCIÓ
            if (mode === 'pen' && !editingEvent && formData.selectedAnimals.length === 0) {
                alert('⚠️ Karám módban válassz ki legalább egy állatot, akire vonatkozik ez az esemény!');
                return;
            }

            if (mode === 'animal' && !animalId) {
                alert('⚠️ Állat ID hiányzik!');
                return;
            }

            let metadata = {};

// ⭐ HÁREM METADATA - HIBRID LOGIKA!
if (formData.funkci === 'hárem' && formData.kivalasztottBikak.length > 0) {
    console.log('💕 Hárem esemény - hibrid snapshot logika');

    const haremKezdete = formData.haremKezdete || formData.datum;
    const vvDatum = new Date(haremKezdete);
    vvDatum.setDate(vvDatum.getDate() + 75);

    const selectedBulls = availableBulls.filter(bika =>
        formData.kivalasztottBikak.includes(bika.id)
    );

    // 🔥 KRITIKUS DÖNTÉS: Történeti vs Aktív esemény
    if (formData.torteneti) {
        // ✅ TÖRTÉNETI ESEMÉNY - TELJES SNAPSHOT KÉSZÍTÉSE
        console.log('📚 Történeti hárem esemény - teljes snapshot készítés');
        
        try {
            // Kiválasztott állatok adatainak lekérdezése
            let specificAnimals: any[] = [];
            if (formData.selectedAnimals.length > 0) {
                const { data: selectedAnimalsData } = await supabase
                    .from('animals')
                    .select('enar, kategoria, ivar')
                    .in('id', formData.selectedAnimals);
                
                specificAnimals = selectedAnimalsData || [];
            }

            // Történeti snapshot készítése
            const fullSnapshot = await createHistoricalSnapshot(
                formData.hovaPen,
                selectedBulls,
                haremKezdete,
                vvDatum.toISOString().split('T')[0],
                specificAnimals
            );

            metadata = {
                ...fullSnapshot,
                historical_entry: true,
                created_via: 'manual_historical_event',
                snapshot_date: formData.datum
            };

            console.log('✅ Történeti hárem snapshot elkészítve:', {
                bulls: fullSnapshot?.bulls?.length || 0,
                females: (fullSnapshot as any)?.females?.length || 0,
                total: (fullSnapshot as any)?.total_animals || 0
            });

        } catch (snapshotError) {
            console.warn('⚠️ Történeti snapshot hiba, egyszerű metadata használata:', snapshotError);
            
            // Fallback egyszerű metadata
            metadata = {
                bulls: selectedBulls.map(bika => ({
                    id: bika.id,
                    name: bika.name,
                    enar: bika.enar,
                    kplsz: bika.kplsz
                })),
                pairing_start_date: haremKezdete,
                expected_vv_date: vvDatum.toISOString().split('T')[0],
                breeding_method: 'natural',
                historical_entry: true,
                created_via: 'manual_event_fallback'
            };
        }

    } else {
        // ✅ AKTÍV ESEMÉNY - EGYSZERŰ METADATA (duplikáció elkerülése)
        console.log('🔄 Aktív hárem esemény - egyszerű metadata');
        
        metadata = {
            bulls: selectedBulls.map(bika => ({
                id: bika.id,
                name: bika.name,
                enar: bika.enar,
                kplsz: bika.kplsz
            })),
            pairing_start_date: haremKezdete,
            expected_vv_date: vvDatum.toISOString().split('T')[0],
            breeding_method: 'natural',
            historical_entry: false,
            created_via: 'manual_active_event'
        };
    }
}

            if (editingEvent) {
                // SZERKESZTÉS - UPDATE
                const realId = editingEvent.id.replace('event_', '').replace('movement_', '');

                if (editingEvent.forrás === 'animal_events') {
                    const updateData: any = {
                        event_date: formData.datum,
                        event_time: formData.idopont,
                        pen_function: formData.funkci,
                        pen_id: formData.hovaPen,  // ← KRITIKUS! Ez hiányzott!
                        reason: translateReason(formData.esemenyTipus),
                        notes: formData.megjegyzes
                    };

                    if (formData.funkci === 'hárem') {
                        updateData.function_metadata = metadata;
                    }

                    console.log('🔄 UPDATE adatok:', updateData);

                    const { error } = await supabase
                        .from('animal_events')
                        .update(updateData)
                        .eq('id', realId);

                    if (error) throw error;

                } else {
                    const moveDateTime = `${formData.datum}T${formData.idopont}:00`;
                    const updateData: any = {
                        moved_at: moveDateTime,
                        to_pen_id: formData.hovaPen,  // ← KRITIKUS! Ez hiányzott!
                        function_type: formData.funkci,
                        movement_reason: translateReason(formData.esemenyTipus),
                        notes: formData.megjegyzes
                    };

                    if (formData.funkci === 'hárem') {
                        updateData.function_metadata = metadata;
                    }

                    console.log('🔄 MOVEMENT UPDATE adatok:', updateData);

                    const { error } = await supabase
                        .from('animal_movements')
                        .update(updateData)
                        .eq('id', realId);

                    if (error) throw error;
                }

            } else {
                // ÚJ ESEMÉNY - INSERT (KARÁM MÓDBAN TÖBB ÁLLATTAL!)
                if (mode === 'pen' && formData.selectedAnimals.length > 0) {
                    // KARÁM MÓDBAN: Minden kiválasztott állathoz külön esemény
                    const events = formData.selectedAnimals.map(selectedAnimalId => ({
                        animal_id: selectedAnimalId,  // ← Kiválasztott állat ID-ja
                        event_type: formData.esemenyTipus,
                        event_date: formData.datum,
                        event_time: formData.idopont,
                        pen_id: formData.hovaPen,
                        pen_function: formData.funkci,
                        function_metadata: metadata,
                        reason: translateReason(formData.esemenyTipus),
                        notes: formData.megjegyzes,
                        is_historical: formData.torteneti
                    }));

                    const { error } = await supabase.from('animal_events').insert(events);
                    if (error) throw error;

                } else if (mode === 'animal' && animalId) {
                    // ÁLLAT MÓDBAN: Egy esemény az adott állathoz
                    const { error } = await supabase.from('animal_events').insert({
                        animal_id: animalId,
                        event_type: formData.esemenyTipus,
                        event_date: formData.datum,
                        event_time: formData.idopont,
                        pen_id: formData.hovaPen,
                        pen_function: formData.funkci,
                        function_metadata: metadata,
                        reason: translateReason(formData.esemenyTipus),
                        notes: formData.megjegyzes,
                        is_historical: formData.torteneti
                    });

                    if (error) throw error;
                } else {
                    throw new Error('Nincs állat kiválasztva vagy állat ID megadva!');
                }
            }

            // A handleSave funkció végén, az események mentése UTÁN add hozzá:

            // 🔥 ÚJ: FIZIKAI KARÁM HOZZÁRENDELÉS
            if (!editingEvent && !formData.torteneti) {
                // Csak új, nem történeti eseményeknél frissítjük a fizikai hozzárendelést

                const animalsToUpdate = mode === 'pen' && formData.selectedAnimals.length > 0
                    ? formData.selectedAnimals
                    : animalId ? [animalId] : [];

                if (animalsToUpdate.length > 0) {
                    // 1. RÉGI HOZZÁRENDELÉSEK LEZÁRÁSA
                    const { error: removeError } = await supabase
                        .from('animal_pen_assignments')
                        .update({ removed_at: new Date().toISOString() })
                        .in('animal_id', animalsToUpdate)
                        .is('removed_at', null);

                    if (removeError) {
                        console.warn('⚠️ Régi hozzárendelések lezárása hiba:', removeError);
                    }

                    // 2. ÚJ HOZZÁRENDELÉSEK LÉTREHOZÁSA
                    const newAssignments = animalsToUpdate.map(animalId => ({
                        animal_id: animalId,
                        pen_id: formData.hovaPen,
                        assigned_at: `${formData.datum}T${formData.idopont}:00`,
                        assignment_reason: translateReason(formData.esemenyTipus)
                    }));

                    const { error: assignError } = await supabase
                        .from('animal_pen_assignments')
                        .insert(newAssignments);

                    if (assignError) {
                        console.warn('⚠️ Új hozzárendelések létrehozása hiba:', assignError);
                    } else {
                        console.log('✅ Fizikai karám hozzárendelések frissítve:', newAssignments.length, 'állat');
                    }
                }
            }

            // ⭐ SZINKRONIZÁCIÓ LOGIKA - HIBRID
if (formData.funkci === 'hárem' && !editingEvent) {
    if (formData.torteneti) {
        // TÖRTÉNETI: Nincs szinkronizáció (nem zavarja a jelenlegi állapotot)
        console.log('📚 Történeti hárem esemény - szinkronizáció kihagyva');
    } else {
        // AKTÍV: Szinkronizáció szükséges
        console.log('🔄 Aktív hárem szinkronizáció indítása...');
        
        setTimeout(async () => {
            const syncResult = await syncHaremData(formData.hovaPen);
            if (syncResult.success) {
                console.log('✅ Hárem szinkronizáció sikeres:', syncResult.message);
            }
        }, 1000);
    }
}

// ✅ FOKOZOTT FRISSÍTÉS - MINDEN ÚJRATÖLTÉSE
alert(`✅ Esemény sikeresen ${editingEvent ? 'frissítve' : 'rögzítve'}!`);

            // Modal bezárása
            setShowModal(false);
            setEditingEvent(null);

            // 🔥 ÚJ - SZÜLŐ KOMPONENS AZONNALI FRISSÍTÉSE
            if (onDataChange) {
                console.log('🔄 Szülő komponens frissítése...');
                onDataChange(); // ← Ez fogja frissíteni a karám állat listáját
            }

            // 🔥 EXTRA - OLDAL ÚJRATÖLTÉS HA KARÁM MÓDBAN VAGYUNK
            if (mode === 'pen') {
                console.log('🔄 Karám oldal teljes frissítése...');
                setTimeout(() => {
                    window.location.reload(); // ← Brutális, de biztosan működik
                }, 1000);
            }

            // TELJES adatok újratöltése kényszerített módon
            console.log('🔄 TELJES adatok újratöltése kényszerítve...');

            // 1. Komponens state reset
            setKombinaltEsemenyek([]);

            // 2. Kis késleltetés és teljes újratöltés
            setTimeout(async () => {
                await loadAllData(); // Teljes újratöltés
                console.log('✅ Teljes újratöltés befejezve');
            }, 200);

            // 3. Szülő komponens értesítése
            if (onDataChange) {
                setTimeout(() => {
                    onDataChange();
                }, 300);
            }

        } catch (error) {
            console.error('❌ Mentési hiba:', error);
            alert('❌ Hiba történt a mentés során: ' + (error as Error).message);
        }
    };

    const handleDelete = async (event: KombinaltEsemeny) => {
        if (!confirm(`⚠️ Biztosan törölni akarod ezt az eseményt?\n\nDátum: ${formatHungarianDate(event.datum)}\nÁllat: ${event.animal_enar}\nFunkció: ${event.funkci}\n\n⚠️ Ez törli az eseményt ÉS a fizikai karám hozzárendelést is!`)) {
            return;
        }

        try {
            const tableName = event.forrás === 'animal_events' ? 'animal_events' : 'animal_movements';
            const realId = event.id.replace('event_', '').replace('movement_', '');

            console.log('🗑️ Törlés megkezdése:', {
                tableName,
                realId,
                animal_id: event.animal_id,
                pen_id: event.to_pen,
                mode
            });

            // 1. ✅ ESEMÉNY TÖRLÉSE (eredeti)
            const { error: eventError } = await supabase
                .from(tableName)
                .delete()
                .eq('id', realId);

            if (eventError) throw eventError;
            console.log('✅ Esemény sikeresen törölve az adatbázisból');

            // 2. 🔥 KRITIKUS - FIZIKAI KARÁM HOZZÁRENDELÉS TÖRLÉSE
            // Ez a legutóbbi hozzárendelést keresve törli!
            const { error: assignmentError } = await supabase
                .from('animal_pen_assignments')
                .update({
                    removed_at: new Date().toISOString(),
                    notes: `Törölve esemény törlése miatt: ${formatHungarianDate(event.datum)}`
                })
                .eq('animal_id', event.animal_id)
                .eq('pen_id', event.to_pen)
                .is('removed_at', null)
                .order('assigned_at', { ascending: false })
                .limit(1);

            if (assignmentError) {
                console.warn('⚠️ Fizikai hozzárendelés törlése hiba:', assignmentError);
            } else {
                console.log('✅ Fizikai karám hozzárendelés is törölve');

                // 🔥 ÚJ - ANIMALS TÁBLA FRISSÍTÉSE (TypeScript safe)
                const { data: currentAssignment } = await supabase
                    .from('animal_pen_assignments')
                    .select(`
            pen_id,
            pens!inner(pen_number)
        `)
                    .eq('animal_id', event.animal_id)
                    .is('removed_at', null)
                    .order('assigned_at', { ascending: false })
                    .limit(1);

                let newKaram: string | null = null;

                if (currentAssignment && currentAssignment.length > 0) {
                    const assignment = currentAssignment[0] as any; // Explicit any cast
                    newKaram = assignment.pens?.pen_number || null;
                }

                await supabase
                    .from('animals')
                    .update({ jelenlegi_karam: newKaram })
                    .eq('id', event.animal_id);

                console.log('✅ Animals tábla frissítve:', newKaram);
            }

            // 3. 🔥 KORÁBBI KARÁM VISSZAÁLLÍTÁSA - JAVÍTOTT LOGIKA
            const { data: previousAssignments } = await supabase
                .from('animal_pen_assignments')
                .select('*')
                .eq('animal_id', event.animal_id)
                .not('removed_at', 'is', null)  // Törölt hozzárendelések
                .order('removed_at', { ascending: false })  // Legutóbb törölt
                .limit(1);

            if (previousAssignments && previousAssignments.length > 0) {
                const previousAssignment = previousAssignments[0];

                // Új hozzárendelés létrehozása a korábbi karám alapján
                const { error: restoreError } = await supabase
                    .from('animal_pen_assignments')
                    .insert({
                        animal_id: event.animal_id,
                        pen_id: previousAssignment.pen_id,
                        assigned_at: new Date().toISOString(),
                        assignment_reason: `Visszaállítva esemény törlése miatt`,
                        notes: `Visszaállítva korábbi karámba: ${previousAssignment.pen_id}`
                    });

                if (restoreError) {
                    console.warn('⚠️ Korábbi karám visszaállítása hiba:', restoreError);
                } else {
                    console.log('✅ Állat visszaállítva korábbi karámba');

                    // 🔥 ÚJ - ANIMALS TÁBLA FRISSÍTÉSE IS!
                    const { data: penData } = await supabase
                        .from('pens')
                        .select('pen_number')
                        .eq('id', previousAssignment.pen_id)
                        .single();

                    if (penData) {
                        await supabase
                            .from('animals')
                            .update({ jelenlegi_karam: penData.pen_number })
                            .eq('id', event.animal_id);
                        console.log('✅ Animals tábla is frissítve korábbi karámmal:', penData.pen_number);
                    }
                }
            } else {
                console.log('⚠️ Nincs korábbi karám - állat "szabadon" marad');
            }

            alert('✅ Esemény ÉS fizikai karám hozzárendelés sikeresen törölve!');

            // 4. 🔥 FOKOZOTT FRISSÍTÉS - MINDEN LEHETSÉGES MÓRÓN!
            console.log('🔄 Teljes frissítés indítása...');

            // A. Helyi adatok frissítése
            await loadAllData();

            // B. Szülő komponens frissítése (karám oldal)
            if (onDataChange) {
                console.log('🔄 Szülő komponens frissítése...');
                setTimeout(() => {
                    onDataChange();
                }, 100);
            }

            // C. BRUTÁLIS MEGOLDÁS - Ha karám módban vagyunk, oldal újratöltés
            if (mode === 'pen') {
                console.log('🔄 Karám oldal erőltetett frissítése...');
                setTimeout(() => {
                    console.log('🔄 Oldal újratöltés...');
                    window.location.reload();
                }, 1500);
            }

        } catch (error) {
            console.error('❌ Törlési hiba:', error);
            alert('❌ Hiba történt a törlés során: ' + (error as Error).message);
        }
    };

    // 🔹 UTILITY FUNCTIONS
    const formatHungarianDate = (dateString: string): string => {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('hu-HU', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });
        } catch {
            return dateString;
        }
    };

    const napokEltelte = (dateString: string): string => {
        try {
            const date = new Date(dateString);
            const now = new Date();
            const diffTime = now.getTime() - date.getTime();
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 0) return 'Ma';
            if (diffDays === 1) return 'Tegnap';
            if (diffDays > 0) return `${diffDays} napja`;
            return `${Math.abs(diffDays)} nap múlva`;
        } catch {
            return '-';
        }
    };

    const getFunkciEmoji = (funkci: string | undefined, tipus: string): string => {
        const emojiMap: { [key: string]: string } = {
            'bölcsi': '🐮',
            'óvi': '🐄',
            'hárem': '🐄💕',
            'vemhes': '🐄💖',
            'ellető': '🐄🍼',
            'tehén': '🐄🍼',
            'hízóbika': '🐂',
            'üres': '⭕',
            'pen_movement': '🔄',
            'pen_assignment': '📍',
            'function_change': '⚙️',
            'breeding': '🐄💕',
            'pregnancy': '🐄💖',
            'birth': '🍼',
            'medical': '🏥',
            'quarantine': '🚨',
            'culling': '❌',
            'breeding_entry': '🐄💕',
            'harem_entry': '🐄💕',
            'other': '📝'
        };
        return emojiMap[funkci || tipus] || '📝';
    };

    const translateReason = (reason: string): string => {
        const translations: { [key: string]: string } = {
            'breeding': 'Tenyésztés',
            'pregnancy': 'Vemhesség',
            'birth': 'Ellés',
            'medical': 'Orvosi kezelés',
            'quarantine': 'Karantén',
            'culling': 'Selejtezés',
            'breeding_entry': 'Tenyésztésbe állítás',
            'harem_entry': 'Hárembe helyezés',
            'other': 'Egyéb',
            'weaning': 'Választás',
            'sale': 'Értékesítés',
            'death': 'Elhullás',
            'pen_movement': 'Karám váltás',
            'pen_assignment': 'Karám hozzárendelés',
            'function_change': 'Funkció váltás'
        };
        return translations[reason] || reason;
    };

    // 🔹 LOADING STATE
    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                <span className="ml-3 text-gray-600">Karám történelem betöltése...</span>
            </div>
        );
    }

    // 🔹 ERROR STATE
    if (error) {
        return (
            <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
                <h3 className="text-lg font-medium text-red-800 mb-2">❌ Betöltési hiba</h3>
                <p className="text-red-600 text-sm mb-4">{error}</p>
                <button
                    onClick={loadAllData}
                    className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 text-sm"
                >
                    🔄 Újrapróbálás
                </button>
            </div>
        );
    }

    // 🔹 MAIN RENDER
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">
                    📚 {mode === 'pen' ? `Karám ${penNumber} Történelem` : 'Állat Karám Történelem'}
                </h2>
                <div className="flex items-center space-x-4">
                    <div className="text-sm text-gray-500">
                        {kombinaltEsemenyek.length} esemény
                    </div>
                    {mode !== 'view-only' && (
                        <>
                            <button
                                onClick={() => openModal()}
                                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                            >
                                ➕ Új Esemény
                            </button>
                            <button
                                onClick={() => loadAllData()}
                                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                            >
                                🔄 Frissítés
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* ✅ Szűrő és pagination vezérlők */}
            <div className="flex justify-between items-center mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex gap-2">
                    <button
                        onClick={() => {
                            setEventFilter('all');
                            setCurrentPage(1);
                        }}
                        className={`px-3 py-2 rounded-lg font-medium transition-colors ${eventFilter === 'all'
                            ? 'bg-blue-500 text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-100'
                            }`}
                    >
                        🏠 Összes ({kombinaltEsemenyek.length})
                    </button>
                    <button
                        onClick={() => {
                            setEventFilter('harem');
                            setCurrentPage(1);
                        }}
                        className={`px-3 py-2 rounded-lg font-medium transition-colors ${eventFilter === 'harem'
                            ? 'bg-pink-500 text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-100'
                            }`}
                    >
                        💕 Hárem ({kombinaltEsemenyek.filter(e => e.funkci === 'hárem').length})
                    </button>
                    <button
                        onClick={() => {
                            setEventFilter('movement');
                            setCurrentPage(1);
                        }}
                        className={`px-3 py-2 rounded-lg font-medium transition-colors ${eventFilter === 'movement'
                            ? 'bg-green-500 text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-100'
                            }`}
                    >
                        🔄 Mozgatások ({kombinaltEsemenyek.filter(e => e.tipus === 'movement').length})
                    </button>
                </div>

                {/* Pagination vezérlők */}
                <div className="flex gap-2 items-center">
                    <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 bg-white text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                    >
                        ⬅️ Előző
                    </button>
                    <span className="px-3 py-1 bg-white rounded-lg text-gray-700 font-medium">
                        {currentPage} / {totalPages}
                    </span>
                    <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 bg-white text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                    >
                        Következő ➡️
                    </button>
                </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{filteredEvents.length}</div>
                    <div className="text-sm text-blue-600">Szűrt események</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{kombinaltEsemenyek.filter(e => e.tipus === 'movement').length}</div>
                    <div className="text-sm text-green-600">Mozgatások</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{kombinaltEsemenyek.filter(e => e.funkci === 'hárem').length}</div>
                    <div className="text-sm text-purple-600">Hárem események</div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">{kombinaltEsemenyek.length > 0 ? kombinaltEsemenyek[0].pen_number || 'N/A' : 'N/A'}</div>
                    <div className="text-sm text-orange-600">Jelenlegi karám</div>
                </div>
            </div>

            {/* Events Timeline */}
            <div className="space-y-4">
                {kombinaltEsemenyek.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                        <div className="text-6xl mb-4">📝</div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Még nincs rögzített történelem</h3>
                        <p className="text-gray-600 mb-4">
                            Ez az {mode === 'pen' ? 'karám' : 'állat'} még nem rendelkezik esemény történettel.
                        </p>
                        {mode !== 'view-only' && (
                            <button
                                onClick={() => openModal()}
                                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                            >
                                ➕ Első esemény rögzítése
                            </button>
                        )}
                    </div>
                ) : (
                    currentEvents.map((esemeny, index) => (
                        <div key={esemeny.id} className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between">
                                <div className="flex items-start space-x-4 flex-1">
                                    <div className="text-3xl">
                                        {getFunkciEmoji(esemeny.funkci, esemeny.tipus)}
                                    </div>
                                    <div className="flex-1">
                                        {/* 🤍 KARÁM IDŐSZAK INFO - FŐSOR HELYÉN */}
                                        <div className="flex items-center space-x-3 mb-2">
                                            {(() => {
                                                const nextEvent = mode === 'animal'
                                                    ? kombinaltEsemenyek[index - 1]  // Állat mód: következő esemény a listában (EREDETI)
                                                    : kombinaltEsemenyek.find((e, i) =>  // Karám mód: ugyanannak az állatnak következő eseménye
                                                        i < index && e.animal_id === esemeny.animal_id
                                                    );
                                                if (nextEvent) {
                                                    const karamVege = new Date(nextEvent.datum);
                                                    karamVege.setDate(karamVege.getDate() - 1);
                                                    const karamKezdete = new Date(esemeny.datum);
                                                    const diffTime = karamVege.getTime() - karamKezdete.getTime();
                                                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                                    return (
                                                        <span className="font-medium text-lg">
                                                            📅 {formatHungarianDate(esemeny.datum)} - {formatHungarianDate(karamVege.toISOString().split('T')[0])} ({diffDays} nap)
                                                        </span>
                                                    );
                                                } else {
                                                    // JAVÍTOTT LOGIKA: Csak akkor "Folyamatban", ha tényleg ez az állat jelenlegi karámja!
                                                    const karamKezdete = new Date(esemeny.datum);
                                                    const ma = new Date();
                                                    const diffTime = ma.getTime() - karamKezdete.getTime();
                                                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                                                    // KARÁM MÓDBAN: Nem biztos hogy "Folyamatban" - lehet már máshol van az állat
                                                    if (mode === 'pen') {
                                                        return (
                                                            <span className="font-medium text-lg">
                                                                📅 {formatHungarianDate(esemeny.datum)} - <span className="text-blue-600">Utolsó esemény</span> ({diffDays} napja)
                                                            </span>
                                                        );
                                                    } else {
                                                        // ÁLLAT MÓDBAN: Folyamatban, mert ez az állat jelenlegi karámja
                                                        return (
                                                            <span className="font-medium text-lg">
                                                                📅 {formatHungarianDate(esemeny.datum)} - <span className="text-green-600">Folyamatban</span> ({diffDays} nap)
                                                            </span>
                                                        );
                                                    }
                                                }
                                            })()}
                                            <span className="text-sm text-gray-500">
                                                ({napokEltelte(esemeny.datum)})
                                            </span>
                                            <span className={`text-xs px-2 py-1 rounded ${esemeny.tipus === 'event' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                                                }`}>
                                                {esemeny.forrás}
                                            </span>
                                            {index === 0 && mode !== 'pen' && (
                                                <span className="text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-800">
                                                    ⭐ Jelenlegi
                                                </span>
                                            )}
                                        </div>

                                        <div className="space-y-1 text-sm">
                                            {mode !== 'animal' && (
                                                <p><strong>🐄 Állat:</strong> {esemeny.animal_enar || `ID: ${esemeny.animal_id}`}</p>
                                            )}
                                            <p><strong>🏠 Karám:</strong> {esemeny.pen_number || `ID: ${esemeny.to_pen}`} {esemeny.pen_location && `(${esemeny.pen_location})`}</p>
                                            {esemeny.funkci && (
                                                <p><strong>⚙️ Funkció:</strong> <span className="font-medium text-purple-600">{esemeny.funkci}</span></p>
                                            )}
                                            <p><strong>📋 Ok:</strong> {translateReason(esemeny.ok)}</p>
                                            <p><strong>🕐 Időpont:</strong> {esemeny.idopont}</p>
                                            {esemeny.megjegyzes && (
                                                <p><strong>📝 Megjegyzés:</strong> {esemeny.megjegyzes}</p>
                                            )}
                                        </div>

                                        {/* 🔥 HÁREM METADATA MEGJELENÍTÉS - KOMPLEX VERZIÓ! */}
                                        {(esemeny.funkci === 'hárem' ||
                                            esemeny.ok?.toLowerCase().includes('breeding') ||
                                            esemeny.ok?.toLowerCase().includes('tenyészté')) && (
                                                <div className="mt-3 p-3 bg-pink-50 border border-pink-200 rounded">
                                                    <h4 className="font-medium text-pink-800 mb-2">💕 Hárem Információk</h4>
                                                    <div className="text-sm space-y-1">
                                                        {esemeny.function_metadata?.bulls && esemeny.function_metadata.bulls.length > 0 ? (
                                                            <>
                                                                <p><strong>🐂 Tenyészbikák:</strong> {esemeny.function_metadata.bulls.map((b: any) => `${b.name} (${b.enar})`).join(', ')}</p>

                                                                {esemeny.function_metadata.pairing_start_date && (
                                                                    <p><strong>📅 Hárem kezdete:</strong> {formatHungarianDate(esemeny.function_metadata.pairing_start_date)}</p>
                                                                )}

                                                                {/* KOMPLEX VV ÉS ÁLLAT STÁTUSZ LOGIKA */}
                                                                {(() => {
                                                                    const vvResult = esemeny.function_metadata.vv_result;
                                                                    const haremKezdete = new Date(esemeny.function_metadata.pairing_start_date || esemeny.datum);

                                                                    // Állat aktuális státusz - ezt később dynamic-ra cseréljük
                                                                    // 🔥 TENYÉSZBIKA KIZÁRÁS
                                                                    const isThisAnimalABull = esemeny.function_metadata?.bulls?.some((bull: any) =>
                                                                        bull.enar === esemeny.animal_enar
                                                                    );

                                                                    const currentAnimalStatus: string = (() => {
                                                                        if (isThisAnimalABull) return 'tenyészbika';

                                                                        // Valódi állat státusz az adatbázisból
                                                                        if (esemeny.animal_pregnancy_status === 'vemhes') return 'vemhes';
                                                                        if (esemeny.animal_pregnancy_status === 'empty') return 'üres';

                                                                        return 'unknown';
                                                                    })();
                                                                    if (!vvResult) {
                                                                        // Nincs VV eredmény EHHEZ a háremhez
                                                                        const ma = new Date();
                                                                        const diffTime = ma.getTime() - haremKezdete.getTime();
                                                                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                                                                        return (
                                                                            <>
                                                                                <p><strong>📅 Hárem vége:</strong> <span className="text-orange-600">VV eredmény várható</span></p>
                                                                                <p><strong>📅 Háremben töltött idő:</strong> {diffDays} nap (folyamatban)</p>

                                                                                {/* KOMPLEX ÁLLAT STÁTUSZ */}
                                                                                {currentAnimalStatus === 'tenyészbika' ? (
                                                                                    <>
                                                                                        <p><strong>🐂 Tenyészbika:</strong> <span className="text-blue-600">Aktív a háremben</span></p>
                                                                                        <p><strong>📋 Funkció:</strong> <span className="text-purple-600">Tenyésztő szerep</span></p>
                                                                                    </>
                                                                                ) : currentAnimalStatus === 'vemhes' ? (
                                                                                    <>
                                                                                        <p><strong>🐄 Állat egyedi státusz:</strong> <span className="text-green-600">✅ Vemhes (korábbi VV alapján)</span></p>
                                                                                        <p><strong>🔬 VV szükséges:</strong> <span className="text-gray-600">NINCS (már vemhes)</span></p>
                                                                                        <p><strong>📋 Hárem szerep:</strong> <span className="text-blue-600">Biztonsági tenyésztés + dominancia stabilizálás</span></p>
                                                                                    </>
                                                                                ) : currentAnimalStatus === 'üres' ? (
                                                                                    <>
                                                                                        <p><strong>🐄 Állat egyedi státusz:</strong> <span className="text-orange-600">❌ Üres (utolsó VV negatív)</span></p>
                                                                                        <p><strong>🔬 VV szükséges:</strong> <span className="text-orange-600">IGEN - új ciklus indítása</span></p>
                                                                                        <p><strong>📋 Hárem szerep:</strong> <span className="text-orange-600">Aktív tenyésztés - VV időzítés fontos</span></p>
                                                                                    </>
                                                                                ) : (
                                                                                    <>
                                                                                        <p><strong>🐄 Állat egyedi státusz:</strong> <span className="text-gray-600">❓ Ismeretlen (nincs VV)</span></p>
                                                                                        <p><strong>🔬 VV szükséges:</strong> <span className="text-red-600">IGEN - állapot meghatározás</span></p>
                                                                                        <p><strong>📋 Hárem szerep:</strong> <span className="text-red-600">VV sürgős - 75 nap után!</span></p>
                                                                                    </>
                                                                                )}
                                                                            </>
                                                                        );
                                                                    } else if (vvResult.status === 'pregnant' || vvResult.status === 'vemhes') {
                                                                        // Pozitív VV - hárem lezárult
                                                                        const vvDate = new Date(vvResult.date);
                                                                        const diffTime = vvDate.getTime() - haremKezdete.getTime();
                                                                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                                                                        return (
                                                                            <>
                                                                                <p><strong>📅 Hárem vége:</strong> {formatHungarianDate(vvResult.date)} (VV pozitív)</p>
                                                                                <p><strong>📅 Háremben töltött idő:</strong> {diffDays} nap</p>
                                                                                <p><strong>🔬 VV eredmény:</strong> <span className="text-green-600">✅ Vemhes ({formatHungarianDate(vvResult.date)})</span></p>
                                                                                <p><strong>🐄 Állat státusz:</strong> <span className="text-green-600">✅ Vemhes - tenyésztési cél elérve</span></p>
                                                                                <p><strong>📋 Hárem eredmény:</strong> <span className="text-green-600">SIKERES - várható ellés ~285 nap</span></p>
                                                                            </>
                                                                        );
                                                                    } else if (vvResult.status === 'empty' || vvResult.status === 'üres') {
                                                                        // Negatív VV - hárem folytatódhat
                                                                        const ma = new Date();
                                                                        const diffTime = ma.getTime() - haremKezdete.getTime();
                                                                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                                                                        return (
                                                                            <>
                                                                                <p><strong>📅 Hárem vége:</strong> <span className="text-blue-600">Folytatódik (VV negatív)</span></p>
                                                                                <p><strong>📅 Háremben töltött idő:</strong> {diffDays} nap + folytatás</p>
                                                                                <p><strong>🔬 VV eredmény:</strong> <span className="text-orange-600">❌ Üres ({formatHungarianDate(vvResult.date)}) - új ciklus</span></p>
                                                                                <p><strong>🐄 Állat státusz:</strong> <span className="text-orange-600">❌ Üres - újra tenyésztés szükséges</span></p>
                                                                                <p><strong>📋 Következő lépés:</strong> <span className="text-blue-600">Új VV 75 nap múlva vagy bika váltás</span></p>
                                                                            </>
                                                                        );
                                                                    } else if (vvResult.status === 'csira' || vvResult.status === 'cyst') {
                                                                        // Csíra - selejtezés
                                                                        const vvDate = new Date(vvResult.date);
                                                                        const diffTime = vvDate.getTime() - haremKezdete.getTime();
                                                                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                                                                        return (
                                                                            <>
                                                                                <p><strong>📅 Hárem vége:</strong> {formatHungarianDate(vvResult.date)} (selejtezés)</p>
                                                                                <p><strong>📅 Háremben töltött idő:</strong> {diffDays} nap</p>
                                                                                <p><strong>🔬 VV eredmény:</strong> <span className="text-red-600">⚠️ Csíra ({formatHungarianDate(vvResult.date)}) - selejtezendő</span></p>
                                                                                <p><strong>🐄 Állat státusz:</strong> <span className="text-red-600">⚠️ Selejtezendő - tenyésztésre alkalmatlan</span></p>
                                                                                <p><strong>📋 Következő lépés:</strong> <span className="text-red-600">Értékesítés vagy hústermelés</span></p>
                                                                            </>
                                                                        );
                                                                    }
                                                                })()}

                                                                <p><strong>🎯 Párzási módszer:</strong> {esemeny.function_metadata.breeding_method === 'natural' ? 'Természetes' : 'Mesterséges'}</p>
                                                            </>
                                                        ) : (
                                                            <div className="text-gray-600">
                                                                <p>📝 Hárem esemény - részletek nem rögzítettek</p>
                                                                <p className="text-xs">Szerkeszd az eseményt a hárem információk hozzáadásához</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                    </div>
                                </div>

                                {/* Action buttons */}
                                {mode !== 'view-only' && (
                                    <div className="flex space-x-2 ml-4">
                                        <button
                                            onClick={() => openModal(esemeny)}
                                            className="text-blue-600 hover:text-blue-800 p-2 rounded hover:bg-blue-50"
                                            title="Szerkesztés"
                                        >
                                            ✏️
                                        </button>
                                        <button
                                            onClick={() => handleDelete(esemeny)}
                                            className="text-red-600 hover:text-red-800 p-2 rounded hover:bg-red-50"
                                            title="Törlés"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-bold mb-4">
                            {editingEvent ? '✏️ Esemény Szerkesztése' : '➕ Új Karám Esemény'}
                        </h3>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Dátum *</label>
                                <input
                                    type="date"
                                    value={formData.datum}
                                    onChange={(e) => setFormData({ ...formData, datum: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-md focus:ring-green-500 focus:border-green-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Időpont</label>
                                <input
                                    type="time"
                                    value={formData.idopont}
                                    onChange={(e) => setFormData({ ...formData, idopont: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-md focus:ring-green-500 focus:border-green-500"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Karám funkció *</label>
                                <select
                                    value={formData.funkci}
                                    onChange={(e) => setFormData({ ...formData, funkci: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-md focus:ring-green-500 focus:border-green-500"
                                >
                                    <option value="bölcsi">🐮 Bölcsi</option>
                                    <option value="óvi">🐄 Óvi</option>
                                    <option value="hárem">🐄💕 Hárem</option>
                                    <option value="vemhes">🐄💖 Vemhes</option>
                                    <option value="ellető">🐄🍼 Ellető</option>
                                    <option value="tehén">🐄🍼 Tehén</option>
                                    <option value="hízóbika">🐂 Hízóbika</option>
                                    <option value="üres">⭕ Üres</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Esemény oka *</label>
                                <select
                                    value={formData.esemenyTipus}
                                    onChange={(e) => setFormData({ ...formData, esemenyTipus: e.target.value as any })}
                                    className="w-full px-3 py-2 border rounded-md focus:ring-green-500 focus:border-green-500"
                                >
                                    <option value="pen_assignment">📍 Karám hozzárendelés</option>
                                    <option value="pen_movement">🔄 Karám váltás</option>
                                    <option value="function_change">⚙️ Funkció váltás</option>
                                    <option value="breeding">🐄💕 Tenyésztés</option>
                                    <option value="harem_entry">🐄💕 Hárembe helyezés</option>
                                    <option value="breeding_entry">🐄💕 Tenyésztésbe állítás</option>
                                    <option value="pregnancy">🐄💖 Vemhesség</option>
                                    <option value="birth">🍼 Ellés</option>
                                    <option value="medical">🏥 Orvosi kezelés</option>
                                    <option value="quarantine">🚨 Karantén</option>
                                    <option value="culling">❌ Selejtezés</option>
                                    <option value="other">📝 Egyéb</option>
                                </select>
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2">Célkarám *</label>
                            <select
                                value={formData.hovaPen}
                                onChange={(e) => setFormData({ ...formData, hovaPen: e.target.value })}
                                className="w-full px-3 py-2 border rounded-md focus:ring-green-500 focus:border-green-500"
                            >
                                <option value="">Válassz karamot...</option>
                                {availablePens.map(pen => (
                                    <option key={pen.id} value={pen.id}>
                                        {pen.pen_number} ({pen.location})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Hárem specifikus mezők */}
                        {formData.funkci === 'hárem' && (
                            <div className="mb-4 p-4 bg-pink-50 border border-pink-200 rounded">
                                <h4 className="font-medium text-pink-800 mb-3">💕 Hárem beállítások</h4>

                                {/* Hárem kezdet dátuma */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium mb-2">📅 Hárem kezdete (tenyészbika beállítás dátuma)</label>
                                    <input
                                        type="date"
                                        value={formData.haremKezdete || formData.datum}
                                        onChange={(e) => setFormData({ ...formData, haremKezdete: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-md focus:ring-pink-500 focus:border-pink-500"
                                    />
                                    <div className="mt-1 text-xs text-pink-600">
                                        Ez lehet eltérő a karám esemény dátumától, ha későbbi időpontban került be a tenyészbika
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">🐂 Tenyészbikák ({availableBulls.length} elérhető)</label>
                                    <div className="space-y-2 max-h-24 overflow-y-auto border rounded p-2 bg-white">
                                        {availableBulls.map(bika => (
                                            <div key={bika.id} className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    id={`bika-${bika.id}`}
                                                    checked={formData.kivalasztottBikak.includes(bika.id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setFormData({
                                                                ...formData,
                                                                kivalasztottBikak: [...formData.kivalasztottBikak, bika.id]
                                                            });
                                                        } else {
                                                            setFormData({
                                                                ...formData,
                                                                kivalasztottBikak: formData.kivalasztottBikak.filter(id => id !== bika.id)
                                                            });
                                                        }
                                                    }}
                                                    className="mr-3 h-4 w-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                                                />
                                                <label htmlFor={`bika-${bika.id}`} className="text-sm cursor-pointer">
                                                    <strong className="text-pink-900">{bika.name}</strong>
                                                    <span className="text-gray-600 ml-2">({bika.enar})</span>
                                                    {bika.kplsz && <span className="text-gray-500 text-xs ml-1">KPLSZ: {bika.kplsz}</span>}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-2 text-xs text-pink-600">
                                        {formData.kivalasztottBikak.length} tenyészbika kiválasztva
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 🐄 ÁLLAT VÁLASZTÁS - INTELLIGENS MEGJELENÍTÉS */}
                        {(mode === 'pen' && !editingEvent) ? (
                            // ÚJ ESEMÉNY KARÁM MÓDBAN - ÁLLAT VÁLASZTÁS SZÜKSÉGES
                            <div className="space-y-4 mb-4">
                                <div className="flex items-center space-x-2">
                                    <span className="text-lg">🐄</span>
                                    <h4 className="text-md font-medium text-gray-900">Érintett állatok kiválasztása</h4>
                                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                        Válassz az összes állatból
                                    </span>
                                </div>

                                <AnimalSelector
                                    key={`animal-selector-${showModal}-${Date.now()}`}
                                    penId={undefined}       // ← Nincs karám szűrés!
                                    selected={formData.selectedAnimals}
                                    onChange={(selected) => setFormData(prev => ({
                                        ...prev,
                                        selectedAnimals: selected
                                    }))}
                                    multiSelect={true}
                                    currentOnly={false}     // ← ÖSSZES állat betöltése!
                                    label="Elérhető állatok"
                                    placeholder="Keresés ENAR vagy kategória alapján..."
                                    maxHeight="max-h-48"
                                />

                                {formData.selectedAnimals.length > 0 && (
                                    <div className="text-sm text-green-600">
                                        ✅ {formData.selectedAnimals.length} állat kiválasztva az eseményhez
                                    </div>
                                )}

                                {formData.selectedAnimals.length === 0 && (
                                    <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded-lg">
                                        ℹ️ Nincs állat kiválasztva - esemény karám-szintre vonatkozik (pl. üres karám, funkció váltás)
                                    </div>
                                )}
                            </div>
                        ) : editingEvent ? (
                            // SZERKESZTÉS MÓDBAN - EGYSZERŰSÍTETT INFO
                            <div className="space-y-4 mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex items-center space-x-2">
                                    <span className="text-lg">✏️</span>
                                    <h4 className="text-md font-medium text-gray-900">Esemény szerkesztése</h4>
                                </div>
                                <div className="text-sm text-blue-800">
                                    <p>📝 Meglévő esemény módosítása - állat választás nem változtatható.</p>
                                    <p>🐄 Érintett állat: <strong>{editingEvent.animal_enar}</strong></p>
                                </div>
                            </div>
                        ) : (
                            // ÁLLAT MÓDBAN - NINCS VÁLASZTÁS SZÜKSÉGES  
                            <div className="space-y-4 mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                                <div className="flex items-center space-x-2">
                                    <span className="text-lg">🐄</span>
                                    <h4 className="text-md font-medium text-gray-900">Állat-specifikus esemény</h4>
                                </div>
                                <div className="text-sm text-green-800">
                                    <p>✅ Ez az esemény automatikusan erre az állatra vonatkozik.</p>
                                    <p>🎯 Nincs szükség további állat kiválasztásra.</p>
                                </div>
                            </div>
                        )}

                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2">📝 Megjegyzés</label>
                            <textarea
                                value={formData.megjegyzes}
                                onChange={(e) => setFormData({ ...formData, megjegyzes: e.target.value })}
                                rows={2}
                                className="w-full px-3 py-2 border rounded-md focus:ring-green-500 focus:border-green-500"
                                placeholder="Opcionális megjegyzés..."
                            />
                        </div>

                        <div className="mb-6">
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={formData.torteneti}
                                    onChange={(e) => setFormData({ ...formData, torteneti: e.target.checked })}
                                    className="mr-2 h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                                />
                                <span className="text-sm">📚 Történeti esemény (múltbeli dátum)</span>
                            </label>
                        </div>

                        <div className="flex justify-end gap-3 pt-6 border-t">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 text-gray-600 border rounded-md hover:bg-gray-50"
                            >
                                Mégse
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={
                                    !formData.datum ||
                                    !formData.funkci ||
                                    !formData.hovaPen ||
                                    (mode === 'pen' && !editingEvent && formData.selectedAnimals.length === 0)
                                }
                                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                💾 Mentés
                                {(mode === 'pen' && !editingEvent && formData.selectedAnimals.length === 0) && (
                                    <span className="ml-2 text-xs">(válassz állato(ka)t)</span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeljesKaramTortenelem;