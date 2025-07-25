// 🔄 src/components/pen-history/TeljesKaramTortenelem_v2.tsx
// Refaktorált verzió - moduláris és tisztított

'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { syncHaremData, createHistoricalSnapshot } from '@/lib/utils/haremSync';
import AnimalSelector from '@/components/AnimalSelector';
import EventTimeline from './EventTimeline';
import { BullAssignmentService, type TenyeszBika, type AssignmentResult } from '@/lib/services/BullAssignmentService';

// 🔹 INTERFACES (tisztított)
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

interface TeljesKaramTortenelem_v2_Props {
  penId?: string;
  animalId?: number;
  penNumber?: string;
  penLocation?: string;
  onDataChange?: () => void;
  mode?: 'pen' | 'animal' | 'view-only';
}

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

// 🎯 MAIN COMPONENT
const TeljesKaramTortenelem_v2: React.FC<TeljesKaramTortenelem_v2_Props> = ({
  penId,
  animalId,
  penNumber = 'Ismeretlen',
  penLocation = '',
  onDataChange,
  mode = 'pen'
}) => {
  // 🔹 STATE MANAGEMENT (egyszerűsített)
  const [kombinaltEsemenyek, setKombinaltEsemenyek] = useState<KombinaltEsemeny[]>([]);
  const [availableBulls, setAvailableBulls] = useState<TenyeszBika[]>([]);
  const [availablePens, setAvailablePens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal és form state
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<KombinaltEsemeny | null>(null);
  
  // Pagination és szűrés
  const [currentPage, setCurrentPage] = useState(1);
  const [eventsPerPage] = useState(20);
  const [eventFilter, setEventFilter] = useState<'all' | 'harem' | 'movement'>('all');
  
  // Form data
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

  // 🔹 EFFECT HOOKS
  useEffect(() => {
    loadAllData();
  }, [penId, animalId]);

  // 🔹 DATA LOADING (optimalizált)
  const loadAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!animalId && mode === 'animal') {
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
      console.error('💥 Adatbetöltési hiba:', error);
      setError((error as Error).message);
      setLoading(false);
    }
  };

  const loadEvents = async () => {
    try {
      const kombinalt: KombinaltEsemeny[] = [];

      // Animal events betöltése
      let eventsQuery = supabase
        .from('animal_events')
        .select('*')
        .order('event_date', { ascending: false });

      if (penId) {
        eventsQuery = eventsQuery.eq('pen_id', penId);
      }
      if (animalId) {
        eventsQuery = eventsQuery.eq('animal_id', animalId);
      }

      const { data: events, error: eventsError } = await eventsQuery;

      if (!eventsError && events) {
        // Batch lekérdezések a nevek/metaadatokhoz
        const animalIds = [...new Set(events.map(e => e.animal_id).filter(Boolean))];
        const penIds = [...new Set(events.map(e => e.pen_id).filter(Boolean))];

        // Állat nevek és kategóriák
        let animalNames: { [key: number]: any } = {};
        if (animalIds.length > 0) {
          const { data: animalsData } = await supabase
            .from('animals')
            .select('id, enar, kategoria, pregnancy_status')
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

        // Karám nevek
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

        // Events konvertálása
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

      // Animal movements betöltése
      let movementsQuery = supabase
        .from('animal_movements')
        .select(`
          *,
          function_metadata,
          animals!inner(enar)
        `)
        .order('moved_at', { ascending: false });

      if (penId) {
        movementsQuery = movementsQuery.or(`from_pen_id.eq.${penId},to_pen_id.eq.${penId}`);
      }
      if (animalId) {
        movementsQuery = movementsQuery.eq('animal_id', animalId);
      }

      const { data: movements, error: movementsError } = await movementsQuery;

      if (!movementsError && movements) {
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

      // Duplikátum szűrés és rendezés
      const uniqueEvents = new Map();
      kombinalt.forEach(event => {
        const uniqueKey = `${event.animal_id}_${event.datum}_${event.idopont}_${event.ok}`;
        if (!uniqueEvents.has(uniqueKey)) {
          uniqueEvents.set(uniqueKey, event);
        }
      });

      const finalEvents = Array.from(uniqueEvents.values());
      finalEvents.sort((a, b) => {
        const dateA = new Date(`${a.datum}T${a.idopont}`);
        const dateB = new Date(`${b.datum}T${b.idopont}`);
        return dateB.getTime() - dateA.getTime();
      });

      setKombinaltEsemenyek(finalEvents);

    } catch (error) {
      console.error('❌ Események betöltési hiba:', error);
    }
  };

  const loadBulls = async () => {
    try {
      const bulls = await BullAssignmentService.getAvailableBulls();
      setAvailableBulls(bulls);
    } catch (error) {
      console.error('❌ Bikák betöltése hiba:', error);
    }
  };

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

  // 🔹 EVENT HANDLERS (egyszerűsített)
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
        selectedAnimals: []
      });
    } else {
      setEditingEvent(null);
      setFormData({
        ...formData,
        hovaPen: penId || '',
        haremKezdete: undefined,
        selectedAnimals: []
      });
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      // Validáció
      if (!formData.datum || !formData.funkci) {
        alert('⚠️ Dátum és funkció kötelező!');
        return;
      }

      if (mode === 'pen' && !editingEvent && formData.selectedAnimals.length === 0) {
        alert('⚠️ Karám módban válassz ki legalább egy állatot!');
        return;
      }

      if (mode === 'animal' && !animalId) {
        alert('⚠️ Állat ID hiányzik!');
        return;
      }

      let metadata = {};

      // Hárem metadata kezelés
      if (formData.funkci === 'hárem' && formData.kivalasztottBikak.length > 0) {
        const haremKezdete = formData.haremKezdete || formData.datum;
        const vvDatum = new Date(haremKezdete);
        vvDatum.setDate(vvDatum.getDate() + 75);

        const selectedBulls = availableBulls.filter(bika =>
          formData.kivalasztottBikak.includes(bika.id)
        );

        if (formData.torteneti) {
          // Történeti snapshot
          try {
            let specificAnimals: any[] = [];
            if (formData.selectedAnimals.length > 0) {
              const { data: selectedAnimalsData } = await supabase
                .from('animals')
                .select('enar, kategoria, ivar')
                .in('id', formData.selectedAnimals);

              specificAnimals = selectedAnimalsData || [];
            }

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
              created_via: 'manual_historical_event_v2',
              snapshot_date: formData.datum
            };
          } catch (snapshotError) {
            console.warn('⚠️ Történeti snapshot hiba:', snapshotError);
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
              created_via: 'manual_event_fallback_v2'
            };
          }
        } else {
          // Aktív esemény
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
            created_via: 'manual_active_event_v2'
          };
        }

        // ✅ FIZIKAI JELENLÉT BIZTOSÍTÁSA (BullAssignmentService használata)
        if (!formData.torteneti && formData.kivalasztottBikak.length > 0) {
          try {
            const physicalResult = await BullAssignmentService.assignBullsToPen(
              selectedBulls,
              formData.hovaPen,
              false
            );

            if (physicalResult.success && physicalResult.addedBulls > 0) {
              console.log(`🐂 ${physicalResult.addedBulls} tenyészbika fizikailag hozzárendelve!`);
            }
          } catch (physicalError) {
            console.warn('⚠️ Fizikai jelenlét biztosítása hiba:', physicalError);
          }
        }
      }

      // Esemény mentése
      if (editingEvent) {
        // SZERKESZTÉS
        const realId = editingEvent.id.replace('event_', '').replace('movement_', '');

        if (editingEvent.forrás === 'animal_events') {
          const updateData: any = {
            event_date: formData.datum,
            event_time: formData.idopont,
            pen_function: formData.funkci,
            pen_id: formData.hovaPen,
            reason: translateReason(formData.esemenyTipus),
            notes: formData.megjegyzes
          };

          if (formData.funkci === 'hárem') {
            updateData.function_metadata = metadata;
          }

          const { error } = await supabase
            .from('animal_events')
            .update(updateData)
            .eq('id', realId);

          if (error) throw error;
        }
      } else {
        // ÚJ ESEMÉNY
        if (mode === 'pen' && formData.selectedAnimals.length > 0) {
          const events = formData.selectedAnimals.map(selectedAnimalId => ({
            animal_id: selectedAnimalId,
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
        }
      }

      // Szinkronizáció
      if (formData.funkci === 'hárem' && !editingEvent && !formData.torteneti) {
        setTimeout(async () => {
          const syncResult = await syncHaremData(formData.hovaPen);
          if (syncResult.success) {
            console.log('✅ Hárem szinkronizáció sikeres');
          }
        }, 1000);
      }

      alert(`✅ Esemény sikeresen ${editingEvent ? 'frissítve' : 'rögzítve'}!`);

      setShowModal(false);
      setEditingEvent(null);

      if (onDataChange) {
        onDataChange();
      }

      await loadAllData();

    } catch (error) {
      console.error('❌ Mentési hiba:', error);
      alert('❌ Hiba történt a mentés során: ' + (error as Error).message);
    }
  };

  const handleDelete = async (event: KombinaltEsemeny) => {
    if (!confirm(`⚠️ Biztosan törölni akarod ezt az eseményt?\n\nDátum: ${formatHungarianDate(event.datum)}\nÁllat: ${event.animal_enar}`)) {
      return;
    }

    try {
      const tableName = event.forrás === 'animal_events' ? 'animal_events' : 'animal_movements';
      const realId = event.id.replace('event_', '').replace('movement_', '');

      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', realId);

      if (error) throw error;

      await loadAllData();

      if (onDataChange) {
        setTimeout(() => {
          onDataChange();
        }, 100);
      }

    } catch (error) {
      console.error('❌ Törlési hiba:', error);
      alert('❌ Hiba történt a törlés során: ' + (error as Error).message);
    }
  };

  // 🔹 LOADING & ERROR STATES
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        <span className="ml-3 text-gray-600">Karám történelem betöltése...</span>
      </div>
    );
  }

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
          <span className="text-sm font-normal text-blue-600 ml-2">[V2 - Refaktorált]</span>
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

      {/* Szűrő és pagination vezérlők */}
      <div className="flex justify-between items-center mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex gap-2">
          <button
            onClick={() => {
              setEventFilter('all');
              setCurrentPage(1);
            }}
            className={`px-3 py-2 rounded-lg font-medium transition-colors ${
              eventFilter === 'all'
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
            className={`px-3 py-2 rounded-lg font-medium transition-colors ${
              eventFilter === 'harem'
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
            className={`px-3 py-2 rounded-lg font-medium transition-colors ${
              eventFilter === 'movement'
                ? 'bg-green-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            🔄 Mozgatások ({kombinaltEsemenyek.filter(e => e.tipus === 'movement').length})
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{kombinaltEsemenyek.length}</div>
          <div className="text-sm text-blue-600">Összes esemény</div>
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

      {/* 🎯 MAIN EVENT TIMELINE (kiszervezett komponens) */}
      <EventTimeline
        events={kombinaltEsemenyek}
        mode={mode}
        onEventEdit={openModal}
        onEventDelete={handleDelete}
        pagination={{
          currentPage,
          eventsPerPage,
          onPageChange: setCurrentPage
        }}
        filters={{
          eventFilter,
          onFilterChange: (filter: string) => setEventFilter(filter as 'all' | 'harem' | 'movement')
        }}
      />

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">
              {editingEvent ? '✏️ Esemény Szerkesztése' : '➕ Új Karám Esemény'}
              <span className="text-sm font-normal text-blue-600 ml-2">[V2]</span>
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
                <h4 className="font-medium text-pink-800 mb-3">💕 Hárem beállítások [V2]</h4>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">📅 Hárem kezdete</label>
                  <input
                    type="date"
                    value={formData.haremKezdete || formData.datum}
                    onChange={(e) => setFormData({ ...formData, haremKezdete: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md focus:ring-pink-500 focus:border-pink-500"
                  />
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
                            const isChecked = e.target.checked;
                            if (isChecked) {
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

            {/* Állat választás (pen módban) */}
            {(mode === 'pen' && !editingEvent) && (
              <div className="space-y-4 mb-4">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">🐄</span>
                  <h4 className="text-md font-medium text-gray-900">Érintett állatok kiválasztása [V2]</h4>
                </div>

                <AnimalSelector
                  key={`animal-selector-v2-${showModal}-${Date.now()}`}
                  penId={undefined}
                  selected={formData.selectedAnimals}
                  onChange={(selected) => setFormData(prev => ({
                    ...prev,
                    selectedAnimals: selected
                  }))}
                  multiSelect={true}
                  currentOnly={false}
                  label="Elérhető állatok"
                  placeholder="Keresés ENAR vagy kategória alapján..."
                  maxHeight="max-h-48"
                />

                {formData.selectedAnimals.length > 0 && (
                  <div className="text-sm text-green-600">
                    ✅ {formData.selectedAnimals.length} állat kiválasztva az eseményhez
                  </div>
                )}
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
                💾 Mentés [V2]
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeljesKaramTortenelem_v2;