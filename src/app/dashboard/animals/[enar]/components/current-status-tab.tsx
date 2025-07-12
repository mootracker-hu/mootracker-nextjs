import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Calendar,
  Clock,
  AlertCircle,
  FileText,
  TrendingUp,
  Activity,
  Edit3,
  Trash2
} from 'lucide-react';
import AnimalMovementPanel from '../../../pens/components/animal-movement-panel';
import UnifiedEventManager from '@/components/UnifiedEventManager';

interface CurrentStatusTabProps {
  animal: any;
}

// 📝 SZERKESZTÉSI MODAL INTERFACE
interface EditMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  movementData: any;
  onSave: (updatedData: any) => Promise<void>;
}

// 📝 SZERKESZTÉSI MODAL KOMPONENS
const EditMovementModal: React.FC<EditMovementModalProps> = ({ isOpen, onClose, movementData, onSave }) => {
  const [formData, setFormData] = useState({
    movement_reason: '',
    function_type: '',
    notes: '',
    moved_at: '',
    removed_at: '', // ⭐ ÚJ: Záró dátum
    target_pen_id: '' // ⭐ ÚJ: Célkarám ID
  });
  const [availablePens, setAvailablePens] = useState<any[]>([]);

  // ⭐ Karamok betöltése a szerkesztési modal-hoz
  useEffect(() => {
    const fetchPensForEdit = async () => {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        const { data: pens, error } = await supabase
          .from('pens')
          .select('id, pen_number, location')
          .order('pen_number');

        if (!error && pens) {
          setAvailablePens(pens);
        }
      } catch (error) {
        console.error('Hiba karamok betöltésekor:', error);
      }
    };

    if (isOpen) {
      fetchPensForEdit();
    }
  }, [isOpen]);

  useEffect(() => {
    if (movementData) {
      console.log('📝 TELJES movementData objektum:', JSON.stringify(movementData, null, 2));
      
      // ⭐ BIZTONSÁGOS ID KINYERÉS
      let targetPenId = '';
      
      if (movementData.type === 'movement') {
        // Movement esetén: to_pen_id vagy to_pen.id
        targetPenId = movementData.to_pen_id || movementData.to_pen?.id || '';
      } else if (movementData.type === 'assignment') {
        // Assignment esetén: pen_id vagy pens.id
        targetPenId = movementData.pen_id || movementData.pens?.id || movementData.pen_info?.id || '';
      }
      
      console.log('🎯 Kinyert targetPenId:', targetPenId, typeof targetPenId);
      
      setFormData({
        movement_reason: movementData.reason || '',
        function_type: movementData.function_type || '',
        notes: movementData.notes?.replace('[📚 Történeti] ', '') || '',
        moved_at: movementData.display_date ? movementData.display_date.split('T')[0] : '',
        removed_at: movementData.removed_at ? movementData.removed_at.split('T')[0] : '',
        target_pen_id: targetPenId // ⭐ BIZTONSÁGOS ÉRTÉK
      });
      
      console.log('📋 Form adatok beállítva:', {
        movement_reason: movementData.reason || '',
        function_type: movementData.function_type || '',
        target_pen_id: targetPenId,
        moved_at: movementData.display_date ? movementData.display_date.split('T')[0] : '',
        removed_at: movementData.removed_at ? movementData.removed_at.split('T')[0] : ''
      });
    }
  }, [movementData]);

  if (!isOpen) return null;

  const translateReason = (reason: string): string => {
    const reasonMap: { [key: string]: string } = {
      'age_separation': '🎂 Életkor alapú válogatás',
      'breeding': '💕 Tenyésztésbe állítás',
      'pregnancy': '🐄💖 Vemhesség',
      'birthing': '🍼 Ellés előkészítés',
      'health': '🏥 Egészségügyi ok',
      'capacity': '📊 Kapacitás optimalizálás',
      'function_change': '🔄 Karám funkció váltás',
      'other': '❓ Egyéb'
    };
    return reasonMap[reason] || reason;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="w-full">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  ✏️ Karámtörténet Szerkesztése
                </h3>

                <div className="space-y-4">
                  {/* Dátum */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      📅 {movementData?.type === 'assignment' ? 'Hozzárendelés dátuma' : 'Mozgatás dátuma'}
                    </label>
                    <input
                      type="date"
                      value={formData.moved_at}
                      onChange={(e) => setFormData({...formData, moved_at: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                    />
                  </div>

                  {/* ⭐ ÚJ: KARÁM VÁLASZTÁS */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      🏠 Karám
                    </label>
                    <select
                      value={formData.target_pen_id}
                      onChange={(e) => setFormData({...formData, target_pen_id: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="">Válassz karamot...</option>
                      {availablePens.map(pen => (
                        <option key={pen.id} value={pen.id}>
                          {pen.pen_number} - {pen.location}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Mozgatás oka */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      🎯 {movementData?.type === 'assignment' ? 'Hozzárendelés oka' : 'Mozgatás oka'}
                    </label>
                    <select
                      value={formData.movement_reason}
                      onChange={(e) => setFormData({...formData, movement_reason: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="">Válassz okot...</option>
                      <option value="age_separation">🎂 Életkor alapú válogatás</option>
                      <option value="breeding">💕 Tenyésztésbe állítás</option>
                      <option value="pregnancy">🐄💖 Vemhesség</option>
                      <option value="birthing">🍼 Ellés előkészítés</option>
                      <option value="health">🏥 Egészségügyi ok</option>
                      <option value="capacity">📊 Kapacitás optimalizálás</option>
                      <option value="function_change">🔄 Karám funkció váltás</option>
                      <option value="other">❓ Egyéb</option>
                    </select>
                  </div>

                  {/* ⭐ ÚJ: KARÁM FUNKCIÓ MEZŐ - csak movement-ekhez */}
                  {movementData?.type === 'movement' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        🏠 Karám funkció (célkarámban)
                      </label>
                      <select
                        value={formData.function_type}
                        onChange={(e) => setFormData({...formData, function_type: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                      >
                        <option value="">Válassz funkciót...</option>
                        <option value="bölcsi">🐮 Bölcsi (0-12 hónapos borjak)</option>
                        <option value="óvi">🐄 Óvi (12-24 hónapos üszők)</option>
                        <option value="hárem">💕 Hárem (tenyésztésben lévő állatok)</option>
                        <option value="vemhes">🤰 Vemhes (vemhes állatok)</option>
                        <option value="ellető">🍼 Ellető (ellés körüli állatok)</option>
                        <option value="tehén">🐄🍼 Tehén (borjas tehenek)</option>
                        <option value="hízóbika">🐂 Hízóbika (hústermelés)</option>
                        <option value="üres">⭕ Üres karám</option>
                        <option value="kórház">🏥 Kórház (beteg állatok)</option>
                        <option value="karantén">🔒 Karantén (megfigyelés)</option>
                      </select>
                    </div>
                  )}

                  {/* ⭐ ÚJ: ZÁRÓ DÁTUM - csak assignment-ekhez */}
                  {movementData?.type === 'assignment' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        📅 Záró dátum (mikor hagyta el a karamot)
                      </label>
                      <input
                        type="date"
                        value={formData.removed_at}
                        onChange={(e) => setFormData({...formData, removed_at: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Hagyd üresen, ha az állat még mindig ebben a karámban van
                      </p>
                    </div>
                  )}

                  {/* Megjegyzés */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      📝 Megjegyzés
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                      placeholder="Kiegészítő információk..."
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={async () => {
                try {
                  await onSave(formData);
                  onClose();
                } catch (error) {
                  console.error('Szerkesztési hiba:', error);
                }
              }}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm"
            >
              💾 Mentés
            </button>
            <button
              type="button"
              onClick={onClose}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              ❌ Mégse
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const CurrentStatusTab: React.FC<CurrentStatusTabProps> = ({ animal }) => {
  const [loading, setLoading] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [allPens, setAllPens] = useState<any[]>([]);
  const [animalMovements, setAnimalMovements] = useState<any[]>([]);
  
  // ⭐ ÚJ: SZERKESZTÉSI MODAL STATE
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMovement, setEditingMovement] = useState<any>(null);

  // Karamok és mozgatások betöltése
  useEffect(() => {
    const fetchPens = async () => {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        // Karamok betöltése
        const { data: pens, error } = await supabase
          .from('pens')
          .select('id, pen_number, pen_type, capacity, location')
          .order('pen_number');

        if (error) {
          console.error('Hiba a karamok betöltésekor:', error);
          return;
        }

        const formattedPens = (pens || []).map(pen => ({
          ...pen,
          animal_count: 0,
          current_function: null
        }));

        setAllPens(formattedPens);

        // Mozgatások betöltése (funkció mezővel együtt!)
        const { data: movements, error: moveError } = await supabase
          .from('animal_movements')
          .select(`
            *,
            from_pen:pens!from_pen_id (pen_number, location),
            to_pen:pens!to_pen_id (pen_number, location)
          `)
          .eq('animal_id', animal?.id)
          .order('moved_at', { ascending: false });

        if (!moveError && movements) {
          setAnimalMovements(movements);
        }

      } catch (error) {
        console.error('Hiba a karamok betöltésekor:', error);
      }
    };

    if (animal?.id) {
      fetchPens();
    }
  }, [animal?.id]);

  // Helper funkciók
  const getCurrentPen = () => {
    const assignment = animal?.animal_pen_assignments?.find(
      (a: any) => a.removed_at === null
    );
    return assignment?.pens;
  };

  const getTimeInPen = () => {
    const assignment = animal?.animal_pen_assignments?.find(
      (a: any) => a.removed_at === null
    );

    if (!assignment?.assigned_at) return 'Nincs adat';

    const assignedDate = new Date(assignment.assigned_at);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - assignedDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Ma';
    if (diffDays === 1) return '1 nap';
    return `${diffDays} nap`;
  };

  const translateReason = (reason: string): string => {
    const reasonMap: { [key: string]: string } = {
      'age_separation': '🎂 Életkor alapú válogatás',
      'breeding': '💕 Tenyésztésbe állítás',
      'pregnancy': '🐄💖 Vemhesség',
      'birthing': '🍼 Ellés előkészítés',
      'health': '🏥 Egészségügyi ok',
      'capacity': '📊 Kapacitás optimalizálás',
      'function_change': '🔄 Karám funkció váltás',
      'other': '❓ Egyéb'
    };
    return reasonMap[reason] || reason;
  };

  const translateFunction = (functionType: string): string => {
    const functionMap: { [key: string]: string } = {
      'bölcsi': '🐮 Bölcsi',
      'óvi': '🐄 Óvi',
      'hárem': '💕 Hárem',
      'vemhes': '🤰 Vemhes',
      'ellető': '🍼 Ellető',
      'tehén': '🐄🍼 Tehén',
      'hízóbika': '🐂 Hízóbika',
      'üres': '⭕ Üres',
      'kórház': '🏥 Kórház',
      'karantén': '🔒 Karantén'
    };
    return functionMap[functionType] || functionType;
  };

  const getAge = () => {
    if (!animal?.szuletesi_datum) return 'Nincs adat';

    const birth = new Date(animal.szuletesi_datum);
    const today = new Date();
    const ageInMs = today.getTime() - birth.getTime();
    const ageInDays = Math.floor(ageInMs / (1000 * 60 * 60 * 24));
    const ageInMonths = Math.floor(ageInDays / 30);

    if (ageInMonths < 12) {
      return `${ageInMonths} hónap`;
    } else {
      const years = Math.floor(ageInMonths / 12);
      const months = ageInMonths % 12;
      return `${years} év ${months > 0 ? months + ' hó' : ''}`;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('hu-HU');
  };

  // ⭐ ÚJ: SZERKESZTÉS MENTÉS FUNKCIÓ
  const handleEditSave = async (updatedData: any) => {
    try {
      console.log('💾 SZERKESZTÉS INDÍTÁSA:', {
        editingMovement: editingMovement,
        updatedData: updatedData
      });

      // ⭐ KRITIKUS VALIDÁCIÓ
      if (!updatedData.target_pen_id || updatedData.target_pen_id.trim() === '' || updatedData.target_pen_id === 'undefined') {
        console.error('❌ HIBÁS TARGET_PEN_ID:', updatedData.target_pen_id);
        alert('❌ Kérlek válassz érvényes karamot! A karám mező nem lehet üres.');
        return;
      }

      if (!editingMovement?.id) {
        console.error('❌ HIÁNYZÓ EDITING MOVEMENT ID');
        alert('❌ Hiba: nem található a szerkesztendő rekord ID-ja');
        return;
      }

      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const tableName = editingMovement.type === 'assignment' ? 'animal_pen_assignments' : 'animal_movements';
      
      // Dátum formázás
      const moveDateTime = updatedData.moved_at ? 
        new Date(updatedData.moved_at + 'T12:00:00.000Z').toISOString() : 
        editingMovement.display_date;

      const removedDateTime = updatedData.removed_at ? 
        new Date(updatedData.removed_at + 'T12:00:00.000Z').toISOString() : 
        null;

      let updateData: any = {};

      if (editingMovement.type === 'assignment') {
        // ⭐ ASSIGNMENT FRISSÍTÉS
        updateData = {
          pen_id: updatedData.target_pen_id, // ⭐ KÖTELEZŐ KARÁM ID
          assigned_at: moveDateTime,
          assignment_reason: updatedData.movement_reason || null,
          notes: updatedData.notes || null,
          removed_at: removedDateTime
        };
      } else {
        // ⭐ MOVEMENT FRISSÍTÉS  
        updateData = {
          to_pen_id: updatedData.target_pen_id, // ⭐ KÖTELEZŐ KARÁM ID
          moved_at: moveDateTime,
          movement_reason: updatedData.movement_reason || null,
          function_type: updatedData.function_type || null,
          notes: updatedData.notes || null
        };
      }

      console.log('💾 FINAL UPDATE DATA:', {
        tableName,
        recordId: editingMovement.id,
        updateData
      });

      const { error: updateError } = await supabase
        .from(tableName)
        .update(updateData)
        .eq('id', editingMovement.id);

      if (updateError) {
        console.error('❌ SUPABASE FRISSÍTÉSI HIBA:', updateError);
        alert(`❌ Adatbázis hiba!\n\nTábla: ${tableName}\nHiba: ${updateError.message}\n\nKérlek ellenőrizd a karám választást.`);
        return;
      }

      console.log('✅ SIKERES FRISSÍTÉS!');
      alert('✅ Karámtörténet sikeresen frissítve!');
      window.location.reload();

    } catch (error) {
      console.error('❌ ÁLTALÁNOS HIBA:', error);
      alert(`❌ Váratlan hiba történt!\n\n${error instanceof Error ? error.message : 'Ismeretlen hiba'}`);
    }
  };

  const currentPen = getCurrentPen();
  const timeInPen = getTimeInPen();
  const age = getAge();

  return (
    <div className="space-y-6">
      {/* Jelenlegi állapot összefoglaló */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <MapPin className="h-5 w-5 text-blue-600 mr-2" />
            <div>
              <p className="text-sm font-medium text-blue-900">Jelenlegi karám</p>
              <p className="text-lg font-bold text-blue-700">
                {currentPen?.pen_number || 'Nincs karám'}
              </p>
              <p className="text-xs text-blue-600">{currentPen?.location || ''}</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <Clock className="h-5 w-5 text-green-600 mr-2" />
            <div>
              <p className="text-sm font-medium text-green-900">Karamban</p>
              <p className="text-lg font-bold text-green-700">{timeInPen}</p>
              <p className="text-xs text-green-600">
                {currentPen ? formatDate(animal?.animal_pen_assignments?.find((a: any) => a.removed_at === null)?.assigned_at) + ' óta' : ''}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center">
            <Activity className="h-5 w-5 text-purple-600 mr-2" />
            <div>
              <p className="text-sm font-medium text-purple-900">Kategória</p>
              <p className="text-lg font-bold text-purple-700">{animal?.kategoria || 'Nincs adat'}</p>
              <p className="text-xs text-purple-600">Aktuális besorolás</p>
            </div>
          </div>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center">
            <Calendar className="h-5 w-5 text-orange-600 mr-2" />
            <div>
              <p className="text-sm font-medium text-orange-900">Életkor</p>
              <p className="text-lg font-bold text-orange-700">{age}</p>
              <p className="text-xs text-orange-600">
                {animal?.szuletesi_datum ? formatDate(animal.szuletesi_datum) : ''}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Alapinformációk */}
      <div className="bg-white border border-gray-200 rounded-lg p-6" style={{display: 'none'}}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <FileText className="h-5 w-5 mr-2 text-gray-600" />
          Részletes információk
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">ENAR szám</label>
              <p className="text-sm text-gray-900 font-mono">{animal?.enar}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Ivar</label>
              <p className="text-sm text-gray-900">{animal?.ivar}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Státusz</label>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                animal?.statusz === 'aktív' ? 'bg-green-100 text-green-800' :
                animal?.statusz === 'eladott' ? 'bg-blue-100 text-blue-800' :
                animal?.statusz === 'elhullott' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {animal?.statusz}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {animal?.anya_enar && (
              <div>
                <label className="block text-sm font-medium text-gray-700">🐄 Anya ENAR</label>
                <p className="text-sm text-gray-900 font-mono">{animal.anya_enar}</p>
              </div>
            )}

            {animal?.apa_enar && (
              <div>
                <label className="block text-sm font-medium text-gray-700">🐂 Apa ENAR</label>
                <p className="text-sm text-gray-900 font-mono">{animal.apa_enar}</p>
              </div>
            )}

            {animal?.birth_location && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Származás</label>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  animal.birth_location === 'nálunk' ? 'bg-green-100 text-green-800' :
                  animal.birth_location === 'vásárolt' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {animal.birth_location === 'nálunk' ? '🏠 Nálunk született' :
                    animal.birth_location === 'vásárolt' ? '🛒 Vásárolt' :
                    '❓ Ismeretlen'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Megjegyzések */}
      {animal?.notes && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FileText className="h-5 w-5 mr-2 text-yellow-600" />
            Megjegyzések
          </h3>
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-900">{animal.notes}</p>
          </div>
        </div>
      )}

      {/* ⭐ ÚJ: EGYSÉGES KARÁMTÖRTÉNET & ESEMÉNYEK */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <span className="mr-2">📋</span>
            Teljes Karámtörténet & Események
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Komplett életútvonal: mozgatások, funkció váltások, hárem időszakok, történeti rögzítések
          </p>
        </div>
        
        <div className="p-6">
          <UnifiedEventManager 
            mode="animal" 
            animalId={animal.id}
            animalEnar={animal.enar}
            allowEdit={true}
            maxHeight="500px"
          />
        </div>
      </div>

      {/* Karám mozgatás gomb */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <MapPin className="h-5 w-5 mr-2 text-blue-600" />
            Karám mozgatás
          </h3>
          <button
            onClick={() => setShowMoveModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
          >
            <span className="mr-2">🔄</span>
            Mozgatás
          </button>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Állat áthelyezése másik karámba jelenlegi vagy történeti dátummal
        </p>
      </div>

      {/* AnimalMovementPanel - A funkcióval bővítve */}
      {showMoveModal && (
        <AnimalMovementPanel
          isOpen={showMoveModal}
          onClose={() => setShowMoveModal(false)}
          selectedAnimals={[animal?.id]}
          animals={[animal]}
          availablePens={allPens}
          currentPenId={animal?.animal_pen_assignments?.find((a: any) => a.removed_at === null)?.pen_id || ''}
          onMove={async (targetPenId: string, reason: string, notes: string, isHistorical?: boolean, moveDate?: string, functionType?: string) => {
            try {
              const { createClient } = await import('@supabase/supabase-js');
              const supabase = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
              );

              let moveDateTime;
              
              if (isHistorical === true && moveDate) {
                const historicalDate = new Date(moveDate);
                if (isNaN(historicalDate.getTime())) {
                  alert('❌ Hibás dátum formátum!');
                  return;
                }
                moveDateTime = historicalDate.toISOString().split('T')[0] + 'T12:00:00.000Z';
              } else {
                moveDateTime = new Date().toISOString();
              }

              // ⭐ MOZGATÁSI REKORD FUNKCIÓ MEZŐVEL
              const movementRecord = {
                animal_id: animal?.id,
                from_pen_id: animal?.animal_pen_assignments?.find((a: any) => a.removed_at === null)?.pen_id || null,
                to_pen_id: targetPenId,
                moved_at: moveDateTime,
                movement_reason: reason,
                function_type: functionType, // ⭐ ÚJ MEZŐ!
                notes: `${isHistorical ? '[📚 Történeti] ' : ''}${notes}`,
              };

              const { error: movementError } = await supabase
                .from('animal_movements')
                .insert(movementRecord);

              if (movementError) {
                alert('❌ Hiba a mozgatási rekord mentésekor!');
                return;
              }

              if (isHistorical !== true) {
                // Jelenlegi hozzárendelés frissítése
                const { error: closeError } = await supabase
                  .from('animal_pen_assignments')
                  .update({ removed_at: moveDateTime })
                  .eq('animal_id', animal?.id)
                  .is('removed_at', null);

                const newAssignment = {
                  animal_id: animal?.id,
                  pen_id: targetPenId,
                  assigned_at: moveDateTime,
                  assignment_reason: reason,
                  notes: notes
                };

                const { error: assignError } = await supabase
                  .from('animal_pen_assignments')
                  .insert(newAssignment);

                if (assignError) {
                  alert('❌ Hiba az új karám hozzárendelésekor!');
                  return;
                }
              }

              const successMessage = isHistorical 
                ? `✅ Történeti mozgatás sikeresen rögzítve!\n📚 Dátum: ${moveDate}\n🏠 Funkció: ${functionType ? translateFunction(functionType) : 'Nincs megadva'}`
                : `✅ Mozgatás sikeresen rögzítve!\n📅 Mai dátum\n🏠 Funkció: ${functionType ? translateFunction(functionType) : 'Nincs megadva'}`;
              
              alert(successMessage);
              setShowMoveModal(false);
              window.location.reload();

            } catch (error) {
              console.error('❌ Általános hiba a mozgatáskor:', error);
              alert('❌ Váratlan hiba történt a mozgatáskor!');
            }
          }}
        />
      )}

      {/* ⭐ ÚJ: SZERKESZTÉSI MODAL */}
      <EditMovementModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        movementData={editingMovement}
        onSave={handleEditSave}
      />
    </div>
  );
};

export default CurrentStatusTab;