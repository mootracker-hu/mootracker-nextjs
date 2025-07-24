// src/app/dashboard/calves/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { CalfWithDetails } from '@/types/calf-types';
import EarTagModal from '@/components/ear-tag-modal';
import { CALF_CONSTANTS } from '@/constants/business';

export default function CalvesPage() {
    const [calves, setCalves] = useState<CalfWithDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [availablePens, setAvailablePens] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [selectedCalf, setSelectedCalf] = useState<CalfWithDetails | null>(null);
    const [isEarTagModalOpen, setIsEarTagModalOpen] = useState(false);
    const [selectedCalfDetails, setSelectedCalfDetails] = useState<CalfWithDetails | null>(null);
    const [motherEnarFilter, setMotherEnarFilter] = useState('');
    const [isDeathModalOpen, setIsDeathModalOpen] = useState(false);
    const [dyingCalf, setDyingCalf] = useState<CalfWithDetails | null>(null);
    const [deathFormData, setDeathFormData] = useState({
        death_date: new Date().toISOString().split('T')[0],
        death_reason: '',
        death_notes: ''
    });

    const supabase = createClient();

    useEffect(() => {
        fetchCalves();
        fetchAvailablePens();
    }, []);

    const fetchCalves = async () => {
        try {
            setLoading(true);
            console.log('🐮 Fetching calves with VV data (CSAK ÉLŐ BORJAK)...');
            console.log('🔧 Debug: motherEnarFilter value:', motherEnarFilter);

            // 1. LÉPÉS: Borjak + születési adatok
            const { data: calvesData, error: calvesError } = await supabase
                .from('calves')
                .select(`
                    *,
                    planned_enar,
                    birth:births!inner(
                        id,
                        mother_enar,
                        birth_date,
                        birth_type,
                        historical
                    )
                `)
                .is('enar', null) // Csak fülszám nélküli borjak
                .eq('is_alive', true) // 🆕 CSAK ÉLŐ BORJAK!
                .order('created_at', { ascending: false });

            if (calvesError) {
                console.error('❌ Error fetching calves:', calvesError);
                setError(calvesError.message);
                return;
            }

            console.log('✅ Calves data (step 1):', calvesData);

            // 2. LÉPÉS: VV eredmények hozzáadása
            const calvesWithVV = await Promise.all(
                (calvesData || []).map(async (calf) => {
                    try {
                        // VV eredmények lekérdezése az anya ENAR alapján
                        const { data: vvData, error: vvError } = await supabase
                            .from('vv_results')
                            .select(`
                                father_enar,
                                father_name,
                                father_kplsz,
                                possible_fathers,
                                vv_date,
                                pregnancy_status
                            `)
                            .eq('animal_enar', calf.birth.mother_enar)
                            .eq('pregnancy_status', 'vemhes')
                            .order('vv_date', { ascending: false })
                            .limit(1); // Legutóbbi pozitív VV

                        if (vvError) {
                            console.warn(`⚠️ VV lekérdezés hiba ${calf.birth.mother_enar}:`, vvError);
                            // ✅ NE ÁLLJON LE A HIBA MIATT - folytasd calf nélkül VV adatok nélkül
                            return {
                                ...calf,
                                vv_result: null
                            };
                        }

                        console.log(`🔍 VV data for ${calf.birth.mother_enar}:`, vvData);

                        return {
                            ...calf,
                            vv_result: vvData?.[0] || null // Legutóbbi VV eredmény
                        };
                    } catch (error) {
                        console.warn(`⚠️ VV fetch error for ${calf.temp_id}:`, error);
                        return calf;
                    }
                })
            );

            console.log('✅ Final calves with VV data:', calvesWithVV);
            setCalves(calvesWithVV);

        } catch (err) {
            console.error('❌ Unexpected error:', err);
            setError('Váratlan hiba történt');
        } finally {
            setLoading(false);
        }
    };

    const handleEarTagSuccess = () => {
        setIsEarTagModalOpen(false);
        setSelectedCalf(null);
        fetchCalves(); // Frissítjük a listát
    };

    const calculateAge = (birthDate: string) => {
        const birth = new Date(birthDate);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - birth.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const getGenderDisplay = (gender: string) => {
        return gender === 'male' ? '🐂 Bika' : '🐄 Üsző';
    };

    const getProtocolStatus = (birthDate: string) => {
        const age = calculateAge(birthDate);
        // ✅ ÚJ - konstans használat:
if (age <= CALF_CONSTANTS.PROTOCOL_DEADLINE_DAYS) {
    return {
        status: 'pending',
        message: `${CALF_CONSTANTS.PROTOCOL_DEADLINE_DAYS - age} nap múlva: BoviPast + fülszám`,  // ← ÚJ
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    };
} else {
    return {
        status: 'overdue',
        message: `${age - CALF_CONSTANTS.PROTOCOL_DEADLINE_DAYS} napja túllépte: Sürgős protokoll!`,  // ← ÚJ
        color: 'bg-red-100 text-red-800 border-red-200'
    };
}
    };

    const fetchAvailablePens = async () => {
        try {
            const { data, error } = await supabase
                .from('pens')
                .select('id, pen_number, location')
                .order('pen_number');

            if (error) throw error;
            setAvailablePens(data || []);
        } catch (error) {
            console.error('Hiba a karamok betöltésekor:', error);
        }
    };

    // 🆕 MODERN MODAL MEGNYITÁSA
    const handleCalfDeath = async (calf: CalfWithDetails) => {
        setDyingCalf(calf);
        setDeathFormData({
            death_date: new Date().toISOString().split('T')[0],
            death_reason: '',
            death_notes: ''
        });
        setIsDeathModalOpen(true);
    };

    // 🆕 ELPUSZTULÁS VÉGREHAJTÁSA
    const executeCalfDeath = async () => {
        if (!dyingCalf) return;

        try {
            console.log('💀 Borjú elpusztulás rögzítése:', dyingCalf.temp_id);

            const { error: calfError } = await supabase
                .from('calves')
                .update({ 
                    is_alive: false,
                    updated_at: new Date().toISOString()
                })
                .eq('id', dyingCalf.id);

            if (calfError) throw calfError;

            // 🆕 ELLÉSI REKORD FRISSÍTÉSE - KÉSŐBB ELPUSZTULT JELÖLÉS
        if (dyingCalf.birth?.id) {
            const { error: birthUpdateError } = await supabase
                .from('births')
                .update({ 
                    calf_died_later: true,
                    calf_death_date: deathFormData.death_date,
                    calf_death_reason: deathFormData.death_reason,
                    calf_death_notes: deathFormData.death_notes,
                    updated_at: new Date().toISOString()
                })
                .eq('id', dyingCalf.birth.id);

            if (birthUpdateError) {
                console.error('⚠️ Birth update hiba:', birthUpdateError);
                // Folytatjuk, mert a fő művelet (calf update) sikerült
            } else {
                console.log('✅ Ellési rekord frissítve: később elpusztult');
            }
        }

            // Anya kategória visszaállítás
            const motherEnar = dyingCalf.birth?.mother_enar;
            if (motherEnar) {
                await handleMotherCategoryReset(motherEnar);
            }

            // Modal bezárása és UI frissítés
            setIsDeathModalOpen(false);
            setDyingCalf(null);
            fetchCalves();
            
            alert(`✅ ${dyingCalf.temp_id} borjú elpusztulása rögzítve!`);

        } catch (error) {
            console.error('❌ Hiba:', error);
            alert('❌ Hiba történt!');
        }
    };

    // 🆕 ANYA KATEGÓRIA VISSZAÁLLÍTÁS (BORJÚ HALÁLA UTÁN)
    const handleMotherCategoryReset = async (motherEnar: string) => {
        try {
            console.log('🔄 Anya kategória ellenőrzés halott borjú után:', motherEnar);

            // Ellenőrizzük: van-e még élő borja ennek az anyának
            const { data: livingCalves, error: calvesError } = await supabase
                .from('calves')
                .select('id, birth_id')
                .eq('is_alive', true)
                .is('enar', null);

            if (calvesError) {
                console.error('❌ Élő borjak lekérdezése sikertelen:', calvesError);
                return;
            }

            // Lekérjük az anya adatait
            const { data: mother, error: motherError } = await supabase
                .from('animals')
                .select('kategoria, has_given_birth')
                .eq('enar', motherEnar)
                .single();

            if (motherError || !mother) {
                console.error('❌ Anya adatok lekérdezése sikertelen:', motherError);
                return;
            }

            // Ellenőrizzük az anya elléseit
            const { data: births, error: birthsError } = await supabase
                .from('births')
                .select('id')
                .eq('mother_enar', motherEnar);

            if (birthsError) {
                console.error('❌ Ellések lekérdezése sikertelen:', birthsError);
                return;
            }

            // Van-e élő borja ennek az anyának?
            const hasLivingCalfFromThisMother = livingCalves?.some(calf => 
                births?.some(birth => birth.id === calf.birth_id)
            );

            if (!hasLivingCalfFromThisMother && mother.kategoria === 'tehén' && !mother.has_given_birth) {
                // Ha nincs élő borja és még sosem ellett "hivatalosan", visszaáll szűz üszőre
                const { error: updateError } = await supabase
                    .from('animals')
                    .update({ kategoria: 'szűz_üsző' })
                    .eq('enar', motherEnar);

                if (!updateError) {
                    console.log('🔄 Anya kategória visszaállítva: tehén → szűz_üsző');
                }
            }

        } catch (error) {
            console.error('❌ Anya kategória visszaállítás hiba:', error);
        }
    };

    const handlePenChange = async (calfId: string, newPenId: string) => {
        try {
            console.log('🏠 Karám váltás:', calfId, 'to', newPenId);

            const { error } = await supabase
                .from('calves')
                .update({ current_pen_id: newPenId || null })
                .eq('id', calfId);

            if (error) throw error;

            fetchCalves();
            alert('✅ Borjú karámba helyezve!');

        } catch (error) {
            console.error('❌ Hiba:', error);
            alert('❌ Hiba történt!');
        }
    };

    // ✅ JAVÍTOTT APA MEGJELENÍTŐ FÜGGVÉNY
    const getFatherDisplay = (calf: any) => {
        const vv = calf.vv_result;
        if (!vv) return '❓ Ismeretlen';

        console.log('🔍 getFatherDisplay VV data for', calf.temp_id, ':', vv);

        // ✅ POSSIBLE FATHERS ARRAY ELLENŐRZÉS
        if (vv.possible_fathers && Array.isArray(vv.possible_fathers) && vv.possible_fathers.length > 1) {
            console.log('🤷‍♂️ Multiple fathers found:', vv.possible_fathers);
            return `🤷‍♂️ ${vv.possible_fathers.length} lehetséges apa`;
        }

        // ✅ EGYÉRTELMŰ APA VAGY ELSŐ APA A LISTÁBÓL
        let fatherName = vv.father_name;
        let fatherEnar = vv.father_enar;

        // Ha nincs közvetlen father_name, nézd meg a possible_fathers első elemét
        if (!fatherName && vv.possible_fathers && vv.possible_fathers.length > 0) {
            const firstFather = vv.possible_fathers[0];
            fatherName = firstFather.name || firstFather.father_name;
            fatherEnar = firstFather.enar || firstFather.father_enar;
        }

        if (fatherName && fatherEnar) {
            return `🐂 ${fatherName} (${fatherEnar})`;
        } else if (fatherEnar) {
            return `🐂 ${fatherEnar}`;
        } else if (fatherName) {
            return `🐂 ${fatherName}`;
        }

        return '❓ Nincs adat';
    };

    // ✅ TELJES MULTIPLE FATHERS RÉSZLETES MEGJELENÍTŐ FÜGGVÉNY
    const getDetailedFatherDisplay = (calf: any) => {
        const vv = calf.vv_result;
        if (!vv) return null;

        console.log('🔍 getDetailedFatherDisplay VV data:', vv);

        // ✅ POSSIBLE FATHERS ARRAY KEZELÉSE
        if (vv.possible_fathers && Array.isArray(vv.possible_fathers) && vv.possible_fathers.length > 0) {
            return vv.possible_fathers.map((father: any, index: number) => (
                <div key={`father-${index}`} className="bg-white p-2 rounded border mb-1">
                    🐂 {father.name || father.father_name || 'Névtelen'} 
                    {father.enar || father.father_enar ? ` (${father.enar || father.father_enar})` : ''}
                    {father.kplsz || father.father_kplsz ? ` - KPLSZ: ${father.kplsz || father.father_kplsz}` : ''}
                </div>
            ));
        }

        // ✅ EGYÉRTELMŰ APA ESETÉN
        return (
            <div className="bg-white p-2 rounded border">
                🐂 {vv.father_name || 'Névtelen'} 
                {vv.father_enar ? ` (${vv.father_enar})` : ''}
                {vv.father_kplsz ? ` - KPLSZ: ${vv.father_kplsz}` : ''}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="p-6">
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Borjak betöltése...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h3 className="text-red-800 font-medium">Hiba történt</h3>
                    <p className="text-red-600 mt-1">{error}</p>
                    <button
                        onClick={fetchCalves}
                        className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                        Újrapróbálás
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl font-bold text-gray-900">🐮 Borjak</h1>
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                        {calves.length} fülszám nélküli borjú
                    </span>
                </div>
                <p className="text-gray-600">
                    Fülszám nélküli borjak kezelése és 15 napos protokoll követése
                </p>

                {/* Anya ENAR szűrő */}
                <div className="mt-4">
                    <input
                        type="text"
                        placeholder="🔍 Keresés anya ENAR szerint (pl. HU 30223 4479 8)"
                        value={motherEnarFilter}
                        onChange={(e) => setMotherEnarFilter(e.target.value)}
                        className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">📅</span>
                        <h3 className="font-medium text-gray-900">Összes borjú</h3>
                    </div>
                    <p className="text-2xl font-bold text-green-600">{calves.length}</p>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">⏰</span>
                        <h3 className="font-medium text-gray-900">Protokoll esedékes</h3>
                    </div>
                    <p className="text-2xl font-bold text-yellow-600">
                        {calves.filter(calf => calculateAge(calf.birth?.birth_date || '') <= 15).length}
                    </p>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">🚨</span>
                        <h3 className="font-medium text-gray-900">Túllépett</h3>
                    </div>
                    <p className="text-2xl font-bold text-red-600">
                        {calves.filter(calf => calculateAge(calf.birth?.birth_date || '') > 15).length}
                    </p>
                </div>
            </div>

            {/* Calves Table */}
            {calves.filter(calf =>
                motherEnarFilter === '' ||
                calf.birth?.mother_enar?.toLowerCase().includes(motherEnarFilter.toLowerCase())
            ).length === 0 ? (
                <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                    <div className="text-6xl mb-4">🐮</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {motherEnarFilter ? 'Nincs találat a szűrésre' : 'Nincsenek fülszám nélküli borjak'}
                    </h3>
                    <p className="text-gray-600">
                        {motherEnarFilter ?
                            'Próbáld meg módosítani a keresési feltételt.' :
                            'Minden borjú megkapta a fülszámát, vagy még nem születtek új borjak.'
                        }
                    </p>
                </div>
            ) : (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Temp ID
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Anya
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Apa
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Születés
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Életkor
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Ivar
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Státusz
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Tervezett ENAR
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Protokoll státusz
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Karám
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Műveletek
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {calves.filter(calf =>
                                    motherEnarFilter === '' ||
                                    calf.birth?.mother_enar?.toLowerCase().includes(motherEnarFilter.toLowerCase())
                                ).map((calf, index) => {
                                    const age = calculateAge(calf.birth?.birth_date || '');
                                    const protocol = getProtocolStatus(calf.birth?.birth_date || '');

                                    return (
                                        <tr key={`calf-${calf.id || index}`} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {calf.temp_id}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                    {calf.birth?.mother_enar}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                    {getFatherDisplay(calf)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                    {calf.birth?.birth_date ? new Date(calf.birth.birth_date).toLocaleDateString('hu-HU') : '-'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                    {age} nap
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                    {getGenderDisplay(calf.gender)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
    {calf.is_alive ? (
        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 border-green-200">
            ✅ Aktív
        </span>
    ) : (
        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600 border-gray-200">
            ⏸️ Inaktív
        </span>
    )}
</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm">
                                                    {calf.planned_enar ? (
                                                        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 border-blue-200">
                                                            📝 {calf.planned_enar}
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 border-gray-200">
                                                            ⏳ Nincs tervezve
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${protocol.color}`}>
                                                    {protocol.message}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <select
                                                    className="text-sm border border-gray-300 rounded px-2 py-1"
                                                    value={calf.current_pen_id || ''}
                                                    onChange={(e) => handlePenChange(calf.id, e.target.value)}
                                                >
                                                    <option value="">Nincs karám</option>
                                                    {availablePens.map(pen => (
                                                        <option key={pen.id} value={pen.id}>
                                                            {pen.pen_number} - {pen.location}
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>

                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
    <div className="flex items-center gap-2">
        <button
            className="inline-flex items-center gap-1 text-xs text-green-600 hover:text-green-700 hover:bg-green-50 px-2 py-1 rounded-md transition-colors"
            onClick={() => {
                setSelectedCalf(calf);
                setIsEarTagModalOpen(true);
            }}
            title="Fülszám kezelése"
        >
            🏷️ <span className="hidden sm:inline">Fülszám</span>
        </button>
        
        <button
            className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-orange-600 hover:bg-orange-50 px-2 py-1 rounded-md transition-colors"
            onClick={() => handleCalfDeath(calf)}
            title="Borjú státuszának frissítése"
        >
            🔄 <span className="hidden sm:inline">Státusz frissítés</span>
        </button>
        
        <button
            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 py-1 rounded-md transition-colors"
            onClick={() => setSelectedCalfDetails(calf)}
            title="Részletek megtekintése"
        >
            👁️ <span className="hidden sm:inline">Részletek</span>
        </button>
    </div>
</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* EarTag Modal */}
            {selectedCalf && (
                <EarTagModal
                    isOpen={isEarTagModalOpen}
                    onClose={() => {
                        setIsEarTagModalOpen(false);
                        setSelectedCalf(null);
                    }}
                    calf={selectedCalf}
                    onSuccess={handleEarTagSuccess}
                />
            )}

            {/* Borjú Részletek Modal */}
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
                                                    `${calculateAge(selectedCalfDetails.birth.birth_date)} nap` :
                                                    '-'
                                                }
                                            </div>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">Státusz:</span>
                                            <div className="font-medium">
                                                {selectedCalfDetails.is_alive ? (
                                                    <span className="inline-flex items-center px-2 py-1 text-sm font-medium rounded-full bg-green-100 text-green-800 border-green-200">
                                                        ✅ Élő
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2 py-1 text-sm font-medium rounded-full bg-red-100 text-red-800 border-red-200">
                                                        💀 Elpusztult
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">Típus:</span>
                                            <div className="font-medium">
                                                {selectedCalfDetails.birth?.historical ? '📚 Történeti' : '🆕 Új ellés'}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* ✅ JAVÍTOTT VV EREDMÉNY RÉSZLETEK - MULTIPLE FATHERS TÁMOGATÁSSAL */}
                                {selectedCalfDetails.vv_result && (
                                    <div className="bg-blue-50 p-4 rounded-lg">
                                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                                            <span className="mr-2">🔬</span>
                                            VV Eredmény Részletek
                                        </h4>
                                        <div className="text-sm space-y-2">
                                            {/* ✅ POSSIBLE FATHERS ARRAY MEGJELENÍTÉS */}
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
                                                // ✅ EGYÉRTELMŰ APA VAGY ELSŐ APA
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
                                                    {(selectedCalfDetails.vv_result.father_kplsz || 
                                                      (selectedCalfDetails.vv_result.possible_fathers && selectedCalfDetails.vv_result.possible_fathers[0]?.kplsz)) && (
                                                        <div>
                                                            <span className="text-gray-600">KPLSZ:</span>
                                                            <div className="font-medium">
                                                                {selectedCalfDetails.vv_result.father_kplsz || 
                                                                 selectedCalfDetails.vv_result.possible_fathers?.[0]?.kplsz ||
                                                                 selectedCalfDetails.vv_result.possible_fathers?.[0]?.father_kplsz}
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
                                    <button
                                        onClick={async () => {
                                            const plannedEnar = prompt(
                                                'Add meg a tervezett ENAR számot:',
                                                selectedCalfDetails.planned_enar || 'HU '
                                            );
                                            if (plannedEnar) {
                                                try {
                                                    const { error } = await supabase
                                                        .from('calves')
                                                        .update({ planned_enar: plannedEnar })
                                                        .eq('temp_id', selectedCalfDetails.temp_id);

                                                    if (error) {
                                                        alert('❌ Hiba történt a mentés során!');
                                                    } else {
                                                        alert('✅ Tervezett ENAR sikeresen mentve!');
                                                        fetchCalves(); // UI frissítése
                                                        setSelectedCalfDetails(null); // Modal bezárása
                                                    }
                                                } catch (err) {
                                                    alert('❌ Váratlan hiba történt!');
                                                }
                                            }
                                        }}
                                        className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-3 py-2 rounded transition-colors"
                                    >
                                        📝 {selectedCalfDetails.planned_enar ? 'ENAR módosítása' : 'ENAR tervezése'}
                                    </button>
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
                                        setSelectedCalf(selectedCalfDetails);
                                        setSelectedCalfDetails(null);
                                        setIsEarTagModalOpen(true);
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
           {/* 🆕 Modern Státusz Frissítés Modal */}
            {isDeathModalOpen && dyingCalf && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl border max-w-md w-full mx-4">
                        <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-6 rounded-t-lg border-b">
    <div className="flex items-center gap-3">
        <span className="text-2xl">🔄</span>
        <h3 className="text-xl font-bold text-orange-900">Borjú Státusz Frissítése</h3>
    </div>
    <p className="text-orange-700 mt-2">
        {dyingCalf.temp_id} • Anya: {dyingCalf.birth?.mother_enar}
    </p>
</div>

                        <div className="p-6 space-y-4">
                            {/* Dátum */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
    📅 Státusz változás dátuma *
</label>
                                <input
                                    type="date"
                                    value={deathFormData.death_date}
                                    onChange={(e) => setDeathFormData(prev => ({...prev, death_date: e.target.value}))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                    required
                                />
                            </div>

                            {/* Ok */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
    ⚠️ Státusz változás oka *
</label>
                                <select
                                    value={deathFormData.death_reason}
                                    onChange={(e) => setDeathFormData(prev => ({...prev, death_reason: e.target.value}))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                    required
                                >
                                    <option value="">Válassz okot...</option>
                                    <option value="Betegség">🦠 Betegség</option>
                                    <option value="Baleset">💥 Baleset</option>
                                    <option value="Születési rendellenesség">🧬 Születési rendellenesség</option>
                                    <option value="Gyengeség">😵 Gyengeség</option>
                                    <option value="Ismeretlen">❓ Ismeretlen</option>
                                    <option value="Egyéb">📝 Egyéb</option>
                                </select>
                            </div>

                            {/* Megjegyzés */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    📝 Megjegyzések
                                </label>
                                <textarea
                                    value={deathFormData.death_notes}
                                    onChange={(e) => setDeathFormData(prev => ({...prev, death_notes: e.target.value}))}
                                    placeholder="További részletek a státusz változásról..."
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                                />
                            </div>

                            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
    <div className="flex items-start gap-2">
        <span className="text-orange-600 text-lg">⚠️</span>
        <div className="text-orange-800 text-sm">
            <p className="font-medium">Figyelem!</p>
            <p>Ez a művelet visszavonhatatlan. A borjú eltűnik a listából és az anya kategóriája visszaállhat.</p>
        </div>
    </div>
</div>
                        </div>

                        {/* Gombok */}
                        <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setIsDeathModalOpen(false);
                                    setDyingCalf(null);
                                }}
                                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                ❌ Mégsem
                            </button>
                            <button
    onClick={executeCalfDeath}
    disabled={!deathFormData.death_date || !deathFormData.death_reason}
    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
>
    🔄 Státusz frissítése
</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}