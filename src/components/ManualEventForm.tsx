// 🐄 ManualEventForm.tsx - Manual Történeti Esemény Rögzítő
// Lokáció: src/components/ManualEventForm.tsx

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface ManualEventFormProps {
    animalId: string | number;
    animalEnar: string;
    onClose: () => void;
    onSuccess: () => void;
}

interface Pen {
    id: string;
    pen_number: string;
    pen_type: string;
}

interface TenyeszBika {
    id: number;
    enar: string;
    name: string;
}

export default function ManualEventForm({ animalId, animalEnar, onClose, onSuccess }: ManualEventFormProps) {
    // Form states
    const [eventType, setEventType] = useState<'pen_movement' | 'function_change' | 'pen_assignment'>('pen_movement');
    const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);
    const [eventTime, setEventTime] = useState('12:00');
    const [selectedPen, setSelectedPen] = useState('');
    const [previousPen, setPreviousPen] = useState('');
    const [functionType, setFunctionType] = useState('hárem');
    const [selectedBulls, setSelectedBulls] = useState<string[]>([]);
    const [reason, setReason] = useState('');
    const [notes, setNotes] = useState('');
    const [isHistorical, setIsHistorical] = useState(true);

    // Data states
    const [pens, setPens] = useState<Pen[]>([]);
    const [bulls, setBulls] = useState<TenyeszBika[]>([]);
    const [loading, setLoading] = useState(false);

    // Load data
    useEffect(() => {
        loadPensAndBulls();
    }, []);

    const loadPensAndBulls = async () => {
        try {
            // Load pens
            const { data: pensData, error: pensError } = await supabase
                .from('pens')
                .select('id, pen_number, pen_type')
                .order('pen_number');

            if (pensError) throw pensError;
            setPens(pensData || []);

            // Load tenyészbikák
            const { data: bullsData, error: bullsError } = await supabase
                .from('animals')
                .select('id, enar, name')
                .eq('kategoria', 'tenyészbika')
                .order('enar');

            if (bullsError) throw bullsError;
            setBulls(bullsData || []);

        } catch (error) {
            console.error('❌ Hiba az adatok betöltésekor:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPen) {
            alert('Kérlek válassz karámot!');
            return;
        }

        setLoading(true);

        try {
            // Prepare event data
            const eventData = {
                animal_id: Number(animalId),
                event_type: eventType,
                event_date: eventDate,
                event_time: eventTime + ':00',
                pen_id: selectedPen,
                previous_pen_id: previousPen || null,
                pen_function: eventType === 'function_change' ? functionType : null,
                function_metadata: eventType === 'function_change' && selectedBulls.length > 0 ? {
                    bulls: selectedBulls.map(bullId => {
                        const bull = bulls.find(b => b.id.toString() === bullId);
                        return {
                            id: Number(bullId),
                            enar: bull?.enar || '',
                            name: bull?.name || ''
                        };
                    })
                } : null,
                reason: reason || null,
                notes: notes || null,
                is_historical: isHistorical
            };

            console.log('💾 Mentés alatt:', eventData);

            // Insert into animal_events
            const { error: eventError } = await supabase
                .from('animal_events')
                .insert([eventData]);

            if (eventError) throw eventError;

            // Ha mozgatás vagy karám hozzárendelés, akkor physical assignment is
            if (eventType === 'pen_movement' || eventType === 'pen_assignment') {
                // Remove previous assignment
                await supabase
                    .from('animal_pen_assignments')
                    .update({ removed_at: new Date().toISOString() })
                    .eq('animal_id', animalId)
                    .is('removed_at', null);

                // Add new assignment
                const { error: assignmentError } = await supabase
                    .from('animal_pen_assignments')
                    .insert([{
                        animal_id: Number(animalId),
                        pen_id: selectedPen,
                        assigned_at: `${eventDate}T${eventTime}:00`,
                        assignment_reason: reason || `Manual ${eventType}`,
                        notes: notes
                    }]);

                if (assignmentError) throw assignmentError;
            }

            console.log('✅ Esemény sikeresen mentve!');
            alert('✅ Új történeti esemény sikeresen rögzítve!');
            onSuccess();
            onClose();

        } catch (error) {
            console.error('❌ Hiba az esemény mentésekor:', error);
            alert('❌ Hiba történt az esemény mentésekor!');
        } finally {
            setLoading(false);
        }
    };

    const getEventTypeLabel = (type: string) => {
        switch (type) {
            case 'pen_movement': return '🔄 Mozgatás';
            case 'function_change': return '📋 Funkció váltás';
            case 'pen_assignment': return '📍 Bekerülés';
            default: return type;
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
                <h3 className="text-lg font-bold mb-4">📝 Új Történeti Esemény - {animalEnar}</h3>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Esemény típus */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Esemény típusa *
                        </label>
                        <select
                            value={eventType}
                            onChange={(e) => setEventType(e.target.value as any)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                            <option value="pen_movement">🔄 Mozgatás (karám → karám)</option>
                            <option value="function_change">📋 Funkció váltás (hárem, vemhes, stb.)</option>
                            <option value="pen_assignment">📍 Bekerülés (új karámba)</option>
                        </select>
                    </div>

                    {/* Dátum és idő */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Dátum *
                            </label>
                            <input
                                type="date"
                                value={eventDate}
                                onChange={(e) => setEventDate(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Idő
                            </label>
                            <input
                                type="time"
                                value={eventTime}
                                onChange={(e) => setEventTime(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                        </div>
                    </div>

                    {/* Mozgatásnál előző karám */}
                    {eventType === 'pen_movement' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Honnan (előző karám)
                            </label>
                            <select
                                value={previousPen}
                                onChange={(e) => setPreviousPen(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            >
                                <option value="">-- Válassz karámot --</option>
                                {pens.map(pen => (
                                    <option key={pen.id} value={pen.id}>
                                        Karám {pen.pen_number}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Célkarám */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {eventType === 'pen_movement' ? 'Hová (célkarám) *' : 'Karám *'}
                        </label>
                        <select
                            value={selectedPen}
                            onChange={(e) => setSelectedPen(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            required
                        >
                            <option value="">-- Válassz karámot --</option>
                            {pens.map(pen => (
                                <option key={pen.id} value={pen.id}>
                                    Karám {pen.pen_number} ({pen.pen_type})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Funkció váltásnál funkció típus */}
                    {eventType === 'function_change' && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Új funkció *
                                </label>
                                <select
                                    value={functionType}
                                    onChange={(e) => setFunctionType(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                >
                                    <option value="hárem">💕 Hárem</option>
                                    <option value="vemhes">💖 Vemhes</option>
                                    <option value="ellető">🍼 Ellető</option>
                                    <option value="óvi">🐄 Óvi</option>
                                    <option value="bölcsi">🐮 Bölcsi</option>
                                    <option value="hízóbika">🐂 Hízóbika</option>
                                    <option value="üres">⭕ Üres</option>
                                </select>
                            </div>

                            {/* Hárem funkciónál tenyészbika választás */}
                            {functionType === 'hárem' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Tenyészbikák
                                    </label>
                                    <div className="space-y-2 max-h-32 overflow-y-auto">
                                        {bulls.map(bull => (
                                            <label key={bull.id} className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedBulls.includes(bull.id.toString())}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedBulls([...selectedBulls, bull.id.toString()]);
                                                        } else {
                                                            setSelectedBulls(selectedBulls.filter(id => id !== bull.id.toString()));
                                                        }
                                                    }}
                                                    className="mr-2"
                                                />
                                                <span className="text-sm">🐂 {bull.enar} - {bull.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* Indoklás */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Rövid indoklás
                        </label>
                        <input
                            type="text"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="pl. VV pozitív, korcsoportos áthelyezés..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                    </div>

                    {/* Részletes jegyzet */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Részletes megjegyzés
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                            placeholder="Részletes leírás az eseményről..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                    </div>

                    {/* Történeti checkbox */}
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="historical"
                            checked={isHistorical}
                            onChange={(e) => setIsHistorical(e.target.checked)}
                            className="mr-2"
                        />
                        <label htmlFor="historical" className="text-sm text-gray-700">
                            📚 Történeti esemény (múltbeli rögzítés)
                        </label>
                    </div>

                    {/* Gombok */}
                    <div className="flex gap-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded-lg transition-colors"
                            disabled={loading}
                        >
                            Mégse
                        </button>
                        <button
                            type="submit"
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                            disabled={loading}
                        >
                            {loading ? '⏳' : '💾'} {loading ? 'Mentés...' : 'Esemény mentése'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}