// 🎯 EGYSÉGES TÖRTÉNET KEZELŐ - JAVÍTOTT TENYÉSZBIKA BETÖLTÉS
// src/components/UnifiedEventManager.tsx

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Edit3, Trash2, Calendar, MapPin, Users, FileText } from 'lucide-react';

// 📊 INTERFACES
interface AnimalEvent {
  id: string;
  animal_id: number;
  event_type: 'pen_assignment' | 'pen_movement' | 'function_change' | 'breeding_start' | 'breeding_end' | 'vv_check' | 'birth' | 'health_event';
  event_date: string;
  event_time: string;
  pen_id?: string;
  previous_pen_id?: string;
  pen_function?: string;
  function_metadata: any;
  reason?: string;
  notes?: string;
  is_historical: boolean;
  created_at: string;
  // Relations
  animals?: { enar: string; kategoria: string };
  pens?: { pen_number: string; location: string };
  previous_pen?: { pen_number: string; location: string };
}

interface UnifiedEventProps {
  mode: 'animal' | 'pen' | 'view-only';
  animalId?: number;
  animalEnar?: string;
  penId?: string;
  allowEdit?: boolean;
  maxHeight?: string;
}

interface EventFormData {
  event_type: string;
  event_date: string;
  event_time: string;
  pen_id: string;
  previous_pen_id: string;
  pen_function: string;
  reason: string;
  notes: string;
  is_historical: boolean;
  // Hárem specifikus
  bulls: Array<{ enar: string; name: string; kplsz: string; id?: string }>;
  pairing_start_date: string;
  expected_vv_date: string;
  breeding_method: string;
}

const UnifiedEventManager: React.FC<UnifiedEventProps> = ({ 
  mode, 
  animalId, 
  animalEnar,
  penId, 
  allowEdit = true,
  maxHeight = "500px"
}) => {
  // STATE MANAGEMENT
  const [events, setEvents] = useState<AnimalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<AnimalEvent | null>(null);
  const [availablePens, setAvailablePens] = useState<any[]>([]);
  const [availableBulls, setAvailableBulls] = useState<any[]>([]);
  const [bullsLoading, setBullsLoading] = useState(false);
  
  // FORM STATE
  const [formData, setFormData] = useState<EventFormData>({
    event_type: 'pen_movement',
    event_date: new Date().toISOString().split('T')[0],
    event_time: '12:00',
    pen_id: '',
    previous_pen_id: '',
    pen_function: '',
    reason: '',
    notes: '',
    is_historical: false,
    bulls: [],
    pairing_start_date: '',
    expected_vv_date: '',
    breeding_method: 'natural'
  });

  // EFFECTS
  useEffect(() => {
    fetchEvents();
    fetchAvailablePens();
  }, [animalId, penId, mode]);

  // VV DÁTUM AUTOMATIKUS SZÁMÍTÁS
  useEffect(() => {
    if (formData.pairing_start_date) {
      const pairingDate = new Date(formData.pairing_start_date);
      pairingDate.setDate(pairingDate.getDate() + 75); // 75 nap múlva
      setFormData(prev => ({
        ...prev,
        expected_vv_date: pairingDate.toISOString().split('T')[0]
      }));
    }
  }, [formData.pairing_start_date]);

  // 📋 OK FORDÍTÁS MAGYAR MEGJELENÍTÉSHEZ
  const translateReason = (reason: string): string => {
    const reasonMap: { [key: string]: string } = {
      'age_separation': '🎂 Életkor alapú váltás',
      'breeding': '💕 Tenyésztésbe állítás', 
      'pregnancy': '🤰 Vemhesség',
      'birthing': '🍼 Ellés előkészítés',
      'health': '🏥 Egészségügyi ok',
      'capacity': '📊 Kapacitás probléma',
      'function_change': '🔄 Funkció váltás',
      'management': '📋 Gazdálkodási döntés',
      'seasonal': '🌅 Szezonális váltás',
      'grouping': '👥 Csoportosítás',
      'maintenance': '🔧 Karám karbantartás',
      'veterinary': '👨‍⚕️ Állatorvosi utasítás',
      'feeding': '🌾 Takarmányozási ok',
      'safety': '⚠️ Biztonsági ok',
      'other': '❓ Egyéb ok'
    };
    
    return reasonMap[reason] || reason; // Ha nincs fordítás, eredeti
  };

  // 📊 JAVÍTOTT ADATOK BETÖLTÉSE
  const fetchEvents = async () => {
    try {
      setLoading(true);
      
      console.log('🔍 FetchEvents indítása:', { mode, animalId, penId });
      
      let query = supabase
        .from('animal_events')
        .select(`
          id,
          animal_id,
          event_type,
          event_date,
          event_time,
          pen_id,
          previous_pen_id,
          pen_function,
          function_metadata,
          reason,
          notes,
          is_historical,
          created_at,
          animals!animal_id(enar, kategoria),
          current_pen:pens!pen_id(pen_number, location),
          previous_pen:pens!previous_pen_id(pen_number, location)
        `)
        .order('event_date', { ascending: false })
        .order('created_at', { ascending: false });

      // Szűrés mód szerint  
      if (mode === 'animal' && animalId) {
        console.log('🐄 Szűrés állatra:', animalId);
        query = query.eq('animal_id', animalId);
      } else if (mode === 'pen' && penId) {
        console.log('🏠 Szűrés karámra:', penId);
        query = query.eq('pen_id', penId);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('❌ Query hiba részletek:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        
        // Ha a tábla nem létezik, üres listát adunk vissza
        if (error.code === '42P01') {
          console.warn('⚠️ animal_events tábla nem található - üres lista');
          setEvents([]);
          return;
        }
        
        throw error;
      }
      
      console.log(`✅ ${mode} események betöltve:`, data?.length || 0, data);
      
      // ⭐ ADATOK NORMALIZÁLÁSA a komponens számára
      const normalizedEvents = (data || []).map((event: any) => ({
        ...event,
        animals: event.animals,
        pens: event.current_pen,
        previous_pen: event.previous_pen
      }));
      
      setEvents(normalizedEvents);
      
    } catch (error) {
      console.error('❌ FetchEvents hiba:', error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  // 🐂 JAVÍTOTT TENYÉSZBIKA ÉS KARÁM BETÖLTÉS
  const fetchAvailablePens = async () => {
    try {
      console.log('🏠 Karamok és tenyészbikák betöltése...');
      setBullsLoading(true);
      
      // KARAMOK BETÖLTÉSE
      const { data: pensData, error: pensError } = await supabase
        .from('pens')
        .select('id, pen_number, location, pen_type')
        .order('pen_number');
      
      if (pensError) {
        console.error('❌ Karamok betöltési hiba:', pensError);
      } else {
        console.log('✅ Karamok betöltve:', pensData?.length, pensData);
        setAvailablePens(pensData || []);
      }

      // 🐂 TENYÉSZBIKÁK BETÖLTÉSE - KÜLÖN BULLS TÁBLA
      console.log('🐂 Tenyészbikák betöltése a bulls táblából...');
      
      // ⭐ HELYES TÁBLÁBÓL: bulls (nem animals!)
      const { data: bullsData, error: bullsError } = await supabase
        .from('bulls')
        .select('id, name, enar, kplsz, active, notes')
        .eq('active', true)
        .order('name');

      console.log('🐂 Bulls tábla eredménye:', {
        count: bullsData?.length || 0,
        error: bullsError,
        data: bullsData
      });

      if (bullsError) {
        console.error('❌ Bulls tábla betöltési hiba:', bullsError);
        setAvailableBulls([]);
      } else {
        console.log('✅ Bulls tábla betöltve:', bullsData?.length, bullsData);
        
        // ⭐ BULLS TÁBLA FORMÁZÁSA (már jó oszlopnevek)
        const formattedBulls = (bullsData || []).map((bull: any) => ({
          id: bull.id,
          enar: bull.enar || 'Nincs ENAR',
          name: bull.name || 'Névtelen tenyészbika',
          kplsz: bull.kplsz || 'Nincs KPLSZ',
          active: bull.active,
          notes: bull.notes
        }));
        
        console.log('🐂 Formázott bikák a bulls táblából:', formattedBulls);
        setAvailableBulls(formattedBulls);
      }
      
    } catch (error) {
      console.error('❌ Karamok/bikák betöltési hiba:', error);
      setAvailablePens([]);
      setAvailableBulls([]);
    } finally {
      setBullsLoading(false);
    }
  };

  const getEventTitle = (event: AnimalEvent) => {
    switch (event.event_type) {
      case 'pen_assignment':
        return `📍 Karám hozzárendelés - ${event.pens?.pen_number}`;
      case 'pen_movement':
        return `🔄 Mozgatás: ${event.previous_pen?.pen_number || '?'} → ${event.pens?.pen_number}`;
      case 'function_change':
        return `🏠 Funkció váltás - ${event.pen_function}`;
      case 'breeding_start':
        return `💕 Hárem kezdete - ${event.pens?.pen_number}`;
      case 'breeding_end':
        return `🏁 Hárem vége - ${event.pens?.pen_number}`;
      case 'vv_check':
        return `🔍 VV vizsgálat`;
      case 'birth':
        return `🍼 Ellés`;
      case 'health_event':
        return `🏥 Egészségügyi esemény`;
      default:
        return `📋 ${event.event_type}`;
    }
  };

  const getEventColor = (event: AnimalEvent) => {
    if (event.is_historical) return 'bg-blue-50 border-blue-200';
    
    switch (event.event_type) {
      case 'breeding_start':
      case 'breeding_end':
        return 'bg-pink-50 border-pink-200';
      case 'pen_movement':
        return 'bg-green-50 border-green-200';
      case 'function_change':
        return 'bg-yellow-50 border-yellow-200';
      case 'vv_check':
        return 'bg-purple-50 border-purple-200';
      case 'birth':
        return 'bg-orange-50 border-orange-200';
      case 'health_event':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  // 💾 CRUD MŰVELETEK
  const openEditModal = (event?: AnimalEvent) => {
    if (event) {
      setEditingEvent(event);
      setFormData({
        event_type: event.event_type,
        event_date: event.event_date,
        event_time: event.event_time,
        pen_id: event.pen_id || '',
        previous_pen_id: event.previous_pen_id || '',
        pen_function: event.pen_function || '',
        reason: event.reason || '',
        notes: event.notes || '',
        is_historical: event.is_historical,
        bulls: event.function_metadata?.bulls || [],
        pairing_start_date: event.function_metadata?.pairing_start_date || '',
        expected_vv_date: event.function_metadata?.expected_vv_date || '',
        breeding_method: event.function_metadata?.breeding_method || 'natural'
      });
    } else {
      setEditingEvent(null);
      setFormData({
        event_type: 'pen_movement',
        event_date: new Date().toISOString().split('T')[0],
        event_time: '12:00',
        pen_id: '',
        previous_pen_id: '',
        pen_function: '',
        reason: '',
        notes: '',
        is_historical: false,
        bulls: [],
        pairing_start_date: '',
        expected_vv_date: '',
        breeding_method: 'natural'
      });
    }
    setShowEditModal(true);
  };

  const handleSave = async () => {
    try {
      // ⭐ HÁREM METADATA ÖSSZEÁLLÍTÁSA
      let metadata: any = {};
      
      if (formData.pen_function === 'hárem' || formData.event_type === 'breeding_start') {
        metadata = {
          bulls: formData.bulls,
          pairing_start_date: formData.pairing_start_date,
          expected_vv_date: formData.expected_vv_date,
          breeding_method: formData.breeding_method
        };
        
        console.log('💕 Hárem metadata összeállítva:', metadata);
      }

      const eventData = {
        animal_id: animalId,
        event_type: formData.event_type,
        event_date: formData.event_date,
        event_time: formData.event_time,
        pen_id: formData.pen_id || null,
        previous_pen_id: formData.previous_pen_id || null,
        pen_function: formData.pen_function || null,
        function_metadata: metadata,
        reason: formData.reason || null,
        notes: formData.notes || null,
        is_historical: formData.is_historical
      };

      console.log('💾 Mentendő esemény adatok:', eventData);

      if (editingEvent) {
        // Frissítés
        const { error } = await supabase
          .from('animal_events')
          .update(eventData)
          .eq('id', editingEvent.id);
        
        if (error) throw error;
        
        alert('✅ Esemény sikeresen frissítve!');
      } else {
        // Új létrehozás
        const { error } = await supabase
          .from('animal_events')
          .insert(eventData);
        
        if (error) throw error;
        
        alert('✅ Új esemény sikeresen rögzítve!');
      }

      setShowEditModal(false);
      setEditingEvent(null);
      fetchEvents();
      
    } catch (error) {
      console.error('❌ Esemény mentési hiba:', error);
      alert('❌ Hiba történt az esemény mentésekor!');
    }
  };

  const handleDelete = async (event: AnimalEvent) => {
    if (!confirm(`🗑️ Biztosan törölni akarod ezt az eseményt?\n\n${getEventTitle(event)}\nDátum: ${event.event_date}`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('animal_events')
        .delete()
        .eq('id', event.id);
      
      if (error) throw error;
      
      alert('✅ Esemény sikeresen törölve!');
      fetchEvents();
      
    } catch (error) {
      console.error('❌ Esemény törlési hiba:', error);
      alert('❌ Hiba történt az esemény törlésekor!');
    }
  };

  // 🎯 RENDERING
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        <span className="ml-3 text-gray-600">Események betöltése...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* FEJLÉC */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center">
          {mode === 'animal' && (
            <>📋 Állat Karámtörténete ({events.length})</>
          )}
          {mode === 'pen' && (
            <>🏠 Karám Eseménytörténete ({events.length})</>
          )}
          {mode === 'view-only' && (
            <>👁️ Történet ({events.length})</>
          )}
          {animalEnar && (
            <span className="ml-2 text-sm text-gray-600 font-mono">{animalEnar}</span>
          )}
        </h3>

        {allowEdit && mode !== 'view-only' && (
          <button
            onClick={() => openEditModal()}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center text-sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Új Esemény
          </button>
        )}
      </div>

      {/* ESEMÉNYEK LISTÁJA */}
      <div 
        className="space-y-3 overflow-y-auto"
        style={{ maxHeight }}
      >
        {events.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">📋</div>
            <p>Még nincsenek rögzített események</p>
            {allowEdit && (
              <button
                onClick={() => openEditModal()}
                className="mt-3 text-green-600 hover:text-green-800 text-sm"
              >
                ➕ Első esemény rögzítése
              </button>
            )}
          </div>
        ) : (
          events.map((event) => (
            <div 
              key={event.id} 
              className={`border rounded-lg p-4 ${getEventColor(event)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Esemény cím */}
                  <div className="flex items-center mb-2">
                    <span className="text-xl mr-2">
                      {(() => {
                        switch (event.event_type) {
                          case 'pen_assignment': return '📍';
                          case 'pen_movement': return '🔄';
                          case 'function_change': 
                            return event.pen_function === 'hárem' ? '💕' : 
                                   event.pen_function === 'vemhes' ? '🤰' : '🔄';
                          case 'breeding_start': return '💕';
                          case 'breeding_end': return '🏁';
                          case 'vv_check': return '🔍';
                          case 'birth': return '🍼';
                          case 'health_event': return '🏥';
                          default: return '📋';
                        }
                      })()}
                    </span>
                    <h4 className="font-medium text-gray-900">
                      {getEventTitle(event)}
                    </h4>
                    {event.is_historical && (
                      <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                        📚 Történeti
                      </span>
                    )}
                  </div>

                  {/* Részletek */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      {new Date(event.event_date).toLocaleDateString('hu-HU')} {event.event_time}
                    </div>
                    
                    {mode === 'pen' && event.animals && (
                      <div className="flex items-center text-gray-600">
                        <Users className="h-4 w-4 mr-2" />
                        {event.animals.enar} ({event.animals.kategoria})
                      </div>
                    )}
                    
                    {event.pens && (
                      <div className="flex items-center text-gray-600">
                        <MapPin className="h-4 w-4 mr-2" />
                        {event.pens.pen_number} ({event.pens.location})
                      </div>
                    )}
                    
                    {event.reason && (
                      <div className="flex items-center text-gray-600">
                        <FileText className="h-4 w-4 mr-2" />
                        {translateReason(event.reason)}
                      </div>
                    )}
                  </div>

                  {/* Hárem specifikus adatok */}
                  {(event.pen_function === 'hárem' || event.event_type === 'breeding_start') && 
                   event.function_metadata && Object.keys(event.function_metadata).length > 0 && (
                    <div className="mt-3 p-3 bg-white bg-opacity-60 rounded border border-pink-300">
                      <h5 className="font-medium text-pink-900 mb-2">💕 Hárem Adatok:</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        {event.function_metadata.bulls && event.function_metadata.bulls.length > 0 && (
                          <div>
                            <span className="text-pink-700">🐂 Tenyészbikák:</span>
                            <div className="ml-4">
                              {event.function_metadata.bulls.map((bull: any, i: number) => (
                                <div key={i} className="text-gray-700">
                                  {bull.name} ({bull.enar})
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {event.function_metadata.pairing_start_date && (
                          <div>
                            <span className="text-pink-700">💕 Párzási kezdet:</span>
                            <span className="ml-2 text-gray-700">
                              {new Date(event.function_metadata.pairing_start_date).toLocaleDateString('hu-HU')}
                            </span>
                          </div>
                        )}
                        {event.function_metadata.expected_vv_date && (
                          <div>
                            <span className="text-pink-700">🔍 VV tervezett:</span>
                            <span className="ml-2 text-gray-700">
                              {new Date(event.function_metadata.expected_vv_date).toLocaleDateString('hu-HU')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Megjegyzés */}
                  {event.notes && (
                    <div className="mt-2 text-sm text-gray-600 italic">
                      💬 {event.notes}
                    </div>
                  )}
                </div>

                {/* Műveletek */}
                {allowEdit && mode !== 'view-only' && (
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => openEditModal(event)}
                      className="p-2 text-gray-400 hover:text-blue-600 rounded"
                      title="Szerkesztés"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(event)}
                      className="p-2 text-gray-400 hover:text-red-600 rounded"
                      title="Törlés"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* SZERKESZTŐ MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">
              {editingEvent ? '✏️ Esemény Szerkesztése' : '➕ Új Esemény Rögzítése'}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Esemény típus */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Esemény típusa:</label>
                <select
                  value={formData.event_type}
                  onChange={(e) => setFormData({...formData, event_type: e.target.value})}
                  className="w-full p-3 border rounded-lg"
                >
                  <option value="pen_assignment">📍 Karám hozzárendelés</option>
                  <option value="pen_movement">🔄 Karám mozgatás</option>
                  <option value="function_change">🏠 Funkció váltás</option>
                  <option value="breeding_start">💕 Hárem kezdete</option>
                  <option value="breeding_end">🏁 Hárem vége</option>
                  <option value="vv_check">🔍 VV vizsgálat</option>
                  <option value="birth">🍼 Ellés</option>
                  <option value="health_event">🏥 Egészségügyi esemény</option>
                </select>
              </div>

              {/* Dátum és idő */}
              <div>
                <label className="block text-sm font-medium mb-2">Dátum:</label>
                <input
                  type="date"
                  value={formData.event_date}
                  onChange={(e) => setFormData({...formData, event_date: e.target.value})}
                  className="w-full p-3 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Időpont:</label>
                <input
                  type="time"
                  value={formData.event_time}
                  onChange={(e) => setFormData({...formData, event_time: e.target.value})}
                  className="w-full p-3 border rounded-lg"
                />
              </div>

              {/* Karám választás */}
              <div>
                <label className="block text-sm font-medium mb-2">Karám:</label>
                <select
                  value={formData.pen_id}
                  onChange={(e) => setFormData({...formData, pen_id: e.target.value})}
                  className="w-full p-3 border rounded-lg"
                >
                  <option value="">Válassz karamot...</option>
                  {availablePens.map(pen => (
                    <option key={pen.id} value={pen.id}>
                      {pen.pen_number} - {pen.location}
                    </option>
                  ))}
                </select>
              </div>

              {/* Előző karám (mozgatásnál) */}
              {formData.event_type === 'pen_movement' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Honnan:</label>
                  <select
                    value={formData.previous_pen_id}
                    onChange={(e) => setFormData({...formData, previous_pen_id: e.target.value})}
                    className="w-full p-3 border rounded-lg"
                  >
                    <option value="">Válassz karamot...</option>
                    {availablePens.map(pen => (
                      <option key={pen.id} value={pen.id}>
                        {pen.pen_number} - {pen.location}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Funkció (ha funkció váltás vagy hárem) */}
              {(formData.event_type === 'function_change' || formData.event_type === 'breeding_start') && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Funkció:</label>
                  <select
                    value={formData.pen_function}
                    onChange={(e) => setFormData({...formData, pen_function: e.target.value})}
                    className="w-full p-3 border rounded-lg"
                  >
                    <option value="">Válassz funkciót...</option>
                    <option value="bölcsi">🐮 Bölcsi</option>
                    <option value="óvi">🐄 Óvi</option>
                    <option value="hárem">💕 Hárem</option>
                    <option value="vemhes">🤰 Vemhes</option>
                    <option value="ellető">🍼 Ellető</option>
                    <option value="tehén">🐄🍼 Tehén</option>
                    <option value="hízóbika">🐂 Hízóbika</option>
                    <option value="üres">⭕ Üres</option>
                  </select>
                </div>
              )}

              {/* ⭐ HÁREM SPECIFIKUS MEZŐK - MINDIG MEGJELENÍTÉS TESZTELÉSHEZ */}
              {(formData.pen_function === 'hárem' || formData.event_type === 'breeding_start' || true) && (
                <div className="md:col-span-2 bg-pink-50 p-4 rounded-lg border border-pink-200">
                  <h4 className="font-medium text-pink-900 mb-4">💕 Hárem Specifikus Adatok</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* 🐂 JAVÍTOTT TENYÉSZBIKA VÁLASZTÁS */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-2">
                        🐂 Tenyészbikák ({availableBulls.length} elérhető):
                      </label>
                      
                      {bullsLoading ? (
                        <div className="flex items-center justify-center p-4 border rounded bg-white">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-pink-600 mr-2"></div>
                          <span className="text-sm text-gray-600">Tenyészbikák betöltése...</span>
                        </div>
                      ) : availableBulls.length > 0 ? (
                        <div className="space-y-2 max-h-32 overflow-y-auto border rounded p-3 bg-white">
                          {availableBulls.map((bull, index) => (
                            <div key={`bull-${bull.id}-${index}`} className="flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                id={`bull-checkbox-${bull.id}-${index}`}
                                checked={formData.bulls.some(b => b.enar === bull.enar)}
                                onChange={(e) => {
                                  console.log('🐂 Checkbox változás:', bull.name, e.target.checked);
                                  
                                  if (e.target.checked) {
                                    setFormData(prev => ({
                                      ...prev,
                                      bulls: [...prev.bulls, {
                                        id: bull.id,
                                        enar: bull.enar,
                                        name: bull.name,
                                        kplsz: bull.kplsz
                                      }]
                                    }));
                                  } else {
                                    setFormData(prev => ({
                                      ...prev,
                                      bulls: prev.bulls.filter(b => b.enar !== bull.enar)
                                    }));
                                  }
                                }}
                                className="mr-3 h-4 w-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                              />
                              <label 
                                htmlFor={`bull-checkbox-${bull.id}-${index}`}
                                className="text-sm cursor-pointer flex-1"
                              >
                                <strong className="text-pink-900">{bull.name}</strong>
                                <span className="text-gray-600 ml-2">({bull.enar})</span>
                                {bull.kplsz && bull.kplsz !== 'Nincs KPLSZ' && (
                                  <span className="text-gray-500 text-xs ml-1">KPLSZ: {bull.kplsz}</span>
                                )}
                              </label>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 border rounded bg-gray-50 text-center">
                          <p className="text-sm text-gray-600 mb-2">🐂 Nem található tenyészbika az adatbázisban</p>
                          <p className="text-xs text-gray-500">
                            Ellenőrizd, hogy a bulls táblában vannak-e aktív tenyészbikák.
                          </p>
                        </div>
                      )}

                      {/* KIVÁLASZTOTT BIKÁK MEGJELENÍTÉSE */}
                      {formData.bulls.length > 0 && (
                        <div className="mt-3 p-2 bg-pink-100 rounded border border-pink-300">
                          <p className="text-sm font-medium text-pink-900 mb-1">
                            ✅ Kiválasztott tenyészbikák ({formData.bulls.length}):
                          </p>
                          <div className="space-y-1">
                            {formData.bulls.map((bull, i) => (
                              <div key={i} className="text-sm text-pink-800">
                                🐂 {bull.name} ({bull.enar})
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Párzási időszak */}
                    <div>
                      <label className="block text-sm font-medium mb-2">💕 Párzási kezdet:</label>
                      <input
                        type="date"
                        value={formData.pairing_start_date}
                        onChange={(e) => setFormData({...formData, pairing_start_date: e.target.value})}
                        className="w-full p-2 border rounded"
                      />
                    </div>

                    {/* VV tervezett (automatikus) */}
                    <div>
                      <label className="block text-sm font-medium mb-2">🔍 VV tervezett:</label>
                      <input
                        type="date"
                        value={formData.expected_vv_date}
                        disabled
                        className="w-full p-2 border rounded bg-gray-50"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Automatikusan számítva: párzási kezdet + 75 nap
                      </p>
                    </div>

                    {/* Párzási módszer */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-2">🔬 Párzási módszer:</label>
                      <select
                        value={formData.breeding_method}
                        onChange={(e) => setFormData({...formData, breeding_method: e.target.value})}
                        className="w-full p-2 border rounded"
                      >
                        <option value="natural">🐂 Természetes fedeztetés</option>
                        <option value="ai">🧪 Mesterséges termékenyítés</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Ok */}
              <div>
                <label className="block text-sm font-medium mb-2">Ok:</label>
                <select
                  value={formData.reason}
                  onChange={(e) => setFormData({...formData, reason: e.target.value})}
                  className="w-full p-3 border rounded-lg"
                >
                  <option value="">Válassz okot...</option>
                  <option value="age_separation">🎂 Életkor alapú váltás</option>
                  <option value="breeding">💕 Tenyésztésbe állítás</option>
                  <option value="pregnancy">🤰 Vemhesség</option>
                  <option value="birthing">🍼 Ellés előkészítés</option>
                  <option value="health">🏥 Egészségügyi ok</option>
                  <option value="capacity">📊 Kapacitás probléma</option>
                  <option value="function_change">🔄 Funkció váltás</option>
                  <option value="management">📋 Gazdálkodási döntés</option>
                  <option value="seasonal">🌅 Szezonális váltás</option>
                  <option value="grouping">👥 Csoportosítás</option>
                  <option value="maintenance">🔧 Karám karbantartás</option>
                  <option value="veterinary">👨‍⚕️ Állatorvosi utasítás</option>
                  <option value="feeding">🌾 Takarmányozási ok</option>
                  <option value="safety">⚠️ Biztonsági ok</option>
                  <option value="other">❓ Egyéb ok</option>
                </select>
              </div>

              {/* Történeti checkbox */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_historical}
                  onChange={(e) => setFormData({...formData, is_historical: e.target.checked})}
                  className="mr-2"
                  id="historical"
                />
                <label htmlFor="historical" className="text-sm">
                  📚 Történeti esemény (múltbeli rögzítés)
                </label>
              </div>

              {/* Megjegyzés */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Megjegyzés:</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows={3}
                  className="w-full p-3 border rounded-lg"
                  placeholder="Opcionális megjegyzés az eseményhez..."
                />
              </div>
            </div>

            {/* Modal gombok */}
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
              >
                ❌ Mégse
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                💾 Mentés
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnifiedEventManager;