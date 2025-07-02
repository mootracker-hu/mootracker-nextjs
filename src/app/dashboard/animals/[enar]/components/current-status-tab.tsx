import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Calendar,
  Clock,
  AlertCircle,
  FileText,
  TrendingUp,
  Activity
} from 'lucide-react';
import AnimalMovementPanel from '../../../pens/components/animal-movement-panel';

interface CurrentStatusTabProps {
  animal: any;
}

const CurrentStatusTab: React.FC<CurrentStatusTabProps> = ({ animal }) => {
  const [loading, setLoading] = useState(false);
  // Állat mozgatás modal állapotok
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [allPens, setAllPens] = useState<any[]>([]);
  // ✅ ÚJ: Animal movements state
  const [animalMovements, setAnimalMovements] = useState<any[]>([]);

  // Karamok betöltése
  useEffect(() => {
    const fetchPens = async () => {
      try {
        // Supabase import szükséges
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        const { data: pens, error } = await supabase
          .from('pens')
          .select(`
            id,
            pen_number,
            pen_type,
            capacity,
            location
          `)
          .order('pen_number');

        if (error) {
          console.error('Hiba a karamok betöltésekor:', error);
          return;
        }

        // Karám formázás az AnimalMovementPanel-nek
        const formattedPens = (pens || []).map(pen => ({
          ...pen,
          animal_count: 0, // TODO: valódi állat szám lekérdezése
          current_function: null // TODO: aktuális funkció lekérdezése
        }));

        setAllPens(formattedPens);
        console.log('Betöltött karamok:', formattedPens);

        // 🔍 DEBUG: Ellenőrizzük az animal_pen_assignments táblát
        const { data: assignments, error: assignError } = await supabase
          .from('animal_pen_assignments')
          .select(`
            *,
            pens (
              pen_number,
              location
            )
          `)
          .eq('animal_id', animal?.id)
          .order('assigned_at', { ascending: false });

        console.log('🔍 DEBUG: Animal pen assignments:', assignments);
        console.log('🔍 DEBUG: Assignment query error:', assignError);

        // 🔍 DEBUG: Ellenőrizzük az animal_movements táblát is
        const { data: movements, error: moveError } = await supabase
          .from('animal_movements')
          .select(`
            *,
            from_pen:pens!from_pen_id (
              pen_number,
              location
            ),
            to_pen:pens!to_pen_id (
              pen_number,
              location
            )
          `)
          .eq('animal_id', animal?.id)
          .order('moved_at', { ascending: false });

        console.log('🔍 DEBUG: Animal movements:', movements);
        console.log('🔍 DEBUG: Movement query error:', moveError);

        // ✅ Movements adatok mentése state-be
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

  // Jelenlegi karám lekérése az animal adatból
  const getCurrentPen = () => {
    const assignment = animal?.animal_pen_assignments?.find(
      (a: any) => a.removed_at === null
    );
    return assignment?.pens;
  };

  // Karamban töltött idő számítása
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

  // Mozgatási ok fordítása magyarra
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

  // Életkor számítása
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

  const currentPen = getCurrentPen();
  const timeInPen = getTimeInPen();
  const age = getAge();

  return (
    <div className="space-y-6">
      {/* Jelenlegi állapot összefoglaló */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Jelenlegi karám */}
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

        {/* Karamban töltött idő */}
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

        {/* Kategória */}
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

        {/* Életkor */}
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
      <div className="bg-white border border-gray-200 rounded-lg p-6">
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
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${animal?.statusz === 'aktív' ? 'bg-green-100 text-green-800' :
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
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${animal.birth_location === 'nálunk' ? 'bg-green-100 text-green-800' :
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

      {/* Karámtörténet - JAVÍTOTT: animal_movements + animal_pen_assignments */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
          Karámtörténet
        </h3>

        <div className="space-y-4">
          {(() => {
            // ✅ KOMBINÁLT KARÁMTÖRTÉNET: assignments + movements
            const assignments = (animal?.animal_pen_assignments || []).map((item: any) => ({
              ...item,
              type: 'assignment',
              display_date: item.assigned_at,
              pen_info: item.pens,
              reason: item.assignment_reason
            }));

            const movements = animalMovements.map((item: any) => ({
              ...item,
              type: 'movement',
              display_date: item.moved_at,
              pen_info: item.to_pen, // Célkarám információ
              reason: item.movement_reason
            }));

            // Minden elemet együtt rendezünk dátum szerint
            const allHistoryItems = [...assignments, ...movements]
              .sort((a: any, b: any) => new Date(b.display_date).getTime() - new Date(a.display_date).getTime());

            console.log('📊 Kombinált karámtörténet:', allHistoryItems);

            if (allHistoryItems.length > 0) {
              return allHistoryItems.map((item: any, index: number) => (
                <div key={`${item.type}-${item.id}-${index}`} className="relative">
                  {/* Timeline vonal */}
                  {index < allHistoryItems.length - 1 && (
                    <div className="absolute left-6 top-12 w-0.5 h-full bg-gray-200"></div>
                  )}

                  <div className="flex items-start space-x-4">
                    {/* Timeline pont */}
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        {item.type === 'movement' ? '🔄' : (item.removed_at ? '🔄' : '📍')}
                      </div>
                    </div>

                    {/* Tartalom */}
                    <div className="flex-grow pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-grow">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium text-gray-900">
                              📍 {item.pen_info?.pen_number || 'Ismeretlen karám'}
                              {item.type === 'movement' ? ' (mozgatás)' : 
                               item.removed_at ? ' (elhagyta)' : ' (jelenlegi)'}
                            </span>
                            
                            {/* Státusz badge */}
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              item.type === 'movement' ? 'bg-purple-100 text-purple-800' :
                              item.removed_at ? 'bg-gray-100 text-gray-800' : 'bg-green-100 text-green-800'
                            }`}>
                              {item.type === 'movement' ? 'Mozgatás' :
                               item.removed_at ? 'Korábbi' : 'Aktív'}
                            </span>
                            
                            {/* Történeti jelzés */}
                            {item.notes && item.notes.includes('[📚 Történeti]') && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                📚 Történeti
                              </span>
                            )}
                          </div>

                          <div className="text-sm text-gray-600 mb-1">
                            <Calendar className="h-4 w-4 inline mr-1" />
                            {formatDate(item.display_date)}
                            {item.removed_at && (
                              <span> - {formatDate(item.removed_at)}</span>
                            )}
                            <span className="ml-2 text-blue-600 font-medium">
                              ({(() => {
                                const start = new Date(item.display_date);
                                const end = item.removed_at ? new Date(item.removed_at) : new Date();
                                const diffDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

                                if (diffDays === 0) return 'ma';
                                if (diffDays === 1) return '1 nap';
                                if (diffDays < 30) return `${diffDays} nap`;
                                if (diffDays < 365) return `${Math.floor(diffDays / 30)} hó`;
                                return `${Math.floor(diffDays / 365)} év`;
                              })()})
                            </span>
                          </div>

                          {item.reason && (
                            <div className="text-sm text-gray-700">
                              <span className="font-medium">Ok:</span> {translateReason(item.reason)}
                            </div>
                          )}

                          {item.notes && (
                            <div className="text-sm text-gray-700 flex items-start mt-1">
                              <FileText className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
                              {item.notes}
                            </div>
                          )}
                        </div>

                        {/* Szerkesztés/Törlés gombok */}
                        <div className="flex space-x-2 ml-4">
                          <button
                            onClick={() => {
                              alert(`🔧 Szerkesztés funkció hamarosan!\n\nTípus: ${item.type}\nKarám: ${item.pen_info?.pen_number}\nDátum: ${formatDate(item.display_date)}\nOk: ${item.reason || 'Nincs megadva'}`);
                            }}
                            className="text-blue-600 hover:text-blue-800 text-sm px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                            title="Szerkesztés"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={async () => {
                              if (confirm(`🗑️ Biztosan törölni szeretnéd?\n\nTípus: ${item.type}\nKarám: ${item.pen_info?.pen_number}\nDátum: ${formatDate(item.display_date)}`)) {
                                try {
                                  console.log('🗑️ Törlés kezdése:', item);
                                  
                                  const { createClient } = await import('@supabase/supabase-js');
                                  const supabase = createClient(
                                    process.env.NEXT_PUBLIC_SUPABASE_URL!,
                                    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
                                  );

                                  // Törlés a megfelelő táblából
                                  const tableName = item.type === 'assignment' ? 'animal_pen_assignments' : 'animal_movements';
                                  
                                  console.log(`🗑️ Törlés táblából: ${tableName}, ID: ${item.id}`);
                                  
                                  const { error: deleteError } = await supabase
                                    .from(tableName)
                                    .delete()
                                    .eq('id', item.id);

                                  if (deleteError) {
                                    console.error('❌ Törlési hiba:', deleteError);
                                    alert(`❌ Hiba a törlés során!\n${deleteError.message}`);
                                    return;
                                  }

                                  console.log('✅ Törlés sikeres!');
                                  alert('✅ Karámtörténet bejegyzés sikeresen törölve!');
                                  
                                  // Frissítés az adatok újratöltésével
                                  window.location.reload();

                                } catch (error) {
                                  console.error('❌ Váratlan hiba:', error);
                                  alert('❌ Váratlan hiba történt!');
                                }
                              }
                            }}
                            className="text-red-600 hover:text-red-800 text-sm px-2 py-1 rounded hover:bg-red-50 transition-colors"
                            title="Törlés"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ));
            } else {
              return (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <p>Nincs rögzített karámtörténet</p>
                </div>
              );
            }
          })()}
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
            onClick={() => {
              console.log('🔄 Mozgatás gomb megnyomva!');
              console.log('📊 availablePens:', allPens.length, 'karám');
              console.log('🐄 Animal ID:', animal?.id);
              setShowMoveModal(true);
              console.log('✅ showMoveModal = true');
            }}
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

      {/* Animal Movement Modal - JAVÍTOTT PARAMÉTEREK + DEBUG */}
      {showMoveModal && (
        <div>
          <h1 className="text-red-500 text-xl font-bold mb-4">🔧 DEBUG: Modal megnyílt!</h1>
          <p>showMoveModal: {showMoveModal.toString()}</p>
          <p>availablePens length: {allPens.length}</p>
          <p>currentPenId: {animal?.animal_pen_assignments?.find((a: any) => a.removed_at === null)?.pen_id || 'NINCS'}</p>
          
        <AnimalMovementPanel
          isOpen={showMoveModal}
          onClose={() => {
            console.log('❌ Modal bezárása...');
            setShowMoveModal(false);
          }}
          selectedAnimals={[animal?.id]}
          animals={[animal]}
          availablePens={allPens}
          currentPenId={animal?.animal_pen_assignments?.find((a: any) => a.removed_at === null)?.pen_id || ''}
          onMove={async (targetPenId: string, reason: string, notes: string, isHistorical?: boolean, moveDate?: string) => {
            try {
              console.log('🔍 onMove paraméterek (HELYES SORREND):', {
                targetPenId,
                reason, 
                notes,
                isHistorical, // ← 4. paraméter (mint az interface-ben)
                moveDate      // ← 5. paraméter (mint az interface-ben)
              });

              // KRITIKUS DEBUG INFORMÁCIÓK
              console.log('🔍 isHistorical értéke:', isHistorical, typeof isHistorical);
              console.log('🔍 moveDate értéke:', moveDate, typeof moveDate);
              
              // Supabase import
              const { createClient } = await import('@supabase/supabase-js');
              const supabase = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
              );

              // JAVÍTOTT DÁTUM KEZELÉS
              let moveDateTime;
              
              if (isHistorical === true && moveDate) {
                // TÖRTÉNETI: Megadott dátum használata
                const historicalDate = new Date(moveDate);
                
                // Ellenőrizzük hogy valid dátum-e
                if (isNaN(historicalDate.getTime())) {
                  console.error('❌ Hibás történeti dátum:', moveDate);
                  alert('❌ Hibás dátum formátum!');
                  return;
                }
                
                // ISO string generálása 12:00 órával (timezone problémák elkerülésére)
                moveDateTime = historicalDate.toISOString().split('T')[0] + 'T12:00:00.000Z';
                
                console.log('📚 TÖRTÉNETI mozgatás:', {
                  inputDate: moveDate,
                  parsedDate: historicalDate,
                  finalDateTime: moveDateTime
                });
                
              } else {
                // MAI: Jelenlegi időpont
                moveDateTime = new Date().toISOString();
                console.log('📅 MAI mozgatás:', moveDateTime);
              }

              console.log('🕛 Végső moveDateTime:', moveDateTime);

              // 1. Mozgatási rekord létrehozása (audit trail)
              const movementRecord = {
                animal_id: animal?.id,
                from_pen_id: animal?.animal_pen_assignments?.find((a: any) => a.removed_at === null)?.pen_id || null,
                to_pen_id: targetPenId,
                moved_at: moveDateTime,
                movement_reason: reason,
                notes: `${isHistorical ? '[📚 Történeti] ' : ''}${notes}`,
              };

              console.log('💾 Mozgatási rekord:', movementRecord);

              const { error: movementError } = await supabase
                .from('animal_movements')
                .insert(movementRecord);

              if (movementError) {
                console.error('❌ Mozgatási rekord hiba:', movementError);
                alert('❌ Hiba a mozgatási rekord mentésekor!');
                return;
              }

              // 2. Csak NEM történeti mozgásnál frissítjük a jelenlegi hozzárendelést
              if (isHistorical !== true) {
                console.log('📝 Jelenlegi hozzárendelés frissítése (nem történeti)...');
                
                // Jelenlegi hozzárendelés lezárása
                const { error: closeError } = await supabase
                  .from('animal_pen_assignments')
                  .update({ removed_at: moveDateTime })
                  .eq('animal_id', animal?.id)
                  .is('removed_at', null);

                if (closeError) {
                  console.error('❌ Hozzárendelés lezárás hiba:', closeError);
                }

                // Új hozzárendelés létrehozása
                const newAssignment = {
                  animal_id: animal?.id,
                  pen_id: targetPenId,
                  assigned_at: moveDateTime,
                  assignment_reason: reason,
                  notes: notes
                };

                console.log('💾 Új hozzárendelés:', newAssignment);

                const { error: assignError } = await supabase
                  .from('animal_pen_assignments')
                  .insert(newAssignment);

                if (assignError) {
                  console.error('❌ Új hozzárendelés hiba:', assignError);
                  alert('❌ Hiba az új karám hozzárendelésekor!');
                  return;
                }
              } else {
                console.log('📚 Történeti mozgatás - jelenlegi hozzárendelés nem módosul');
              }

              // SIKER!
              const successMessage = isHistorical 
                ? `✅ Történeti mozgatás sikeresen rögzítve!\n📚 Dátum: ${moveDate}\nÁllat: ${animal?.enar}\nCélkarám: ${targetPenId}`
                : `✅ Mozgatás sikeresen rögzítve!\n📅 Mai dátum\nÁllat: ${animal?.enar}\nCélkarám: ${targetPenId}`;
              
              console.log('✅ Mozgatás sikeresen mentve!');
              alert(successMessage);
              setShowMoveModal(false);

              // Oldal frissítése (új karám megjelenítése)
              window.location.reload();

            } catch (error) {
              console.error('❌ Általános hiba a mozgatáskor:', error);
              alert('❌ Váratlan hiba történt a mozgatáskor!');
            }
          }}
        />
        </div>
      )}
    </div>
  );
};

export default CurrentStatusTab;