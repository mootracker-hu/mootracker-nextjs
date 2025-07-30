// src/app/dashboard/pens/components/animal-movement-panel.tsx
'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { createAutomaticPeriodSnapshot } from '@/lib/penHistorySync';
import { recordAnimalEvent, ALERT_EVENT_TYPES } from '@/lib/alerts/MagyarAlertEngine';
import { displayEnar } from '@/constants/enar-formatter';
import AnimalSelector from '@/components/AnimalSelector';

interface Animal {
  id: number;
  enar: string;
  kategoria: string;
}

interface Pen {
  id: string;
  pen_number: string;
  pen_type: 'outdoor' | 'barn' | 'birthing';
  capacity: number;
  location?: string;
  current_function?: PenFunction;
  animal_count: number;
}

interface PenFunction {
  function_type: 'bölcsi' | 'óvi' | 'hárem' | 'vemhes' | 'hízóbika' | 'ellető' | 'üres' | 'tehén';
}

interface TenyeszbikaOption {
  enar: string;
  kplsz: string;
  name: string;
}

interface AnimalMovementPanelProps {
  isOpen: boolean;
  onClose: () => void;
  selectedAnimals: number[];
  animals: Animal[];
  availablePens: Pen[];
  currentPenId: string;
  isAddMode?: boolean; // ÚJ!
  selectedAnimalsForAdd?: number[]; // ÚJ!
  setSelectedAnimalsForAdd?: (animals: number[]) => void; // ÚJ!
  onMove: (targetPenId: string, reason: string, notes: string, isHistorical?: boolean, moveDate?: string, functionType?: string, metadata?: any) => void;
}

export default function AnimalMovementPanel({
  isOpen,
  onClose,
  selectedAnimals,
  animals,
  availablePens,
  currentPenId,
  isAddMode = false, // ÚJ!
  selectedAnimalsForAdd = [], // ÚJ!
  setSelectedAnimalsForAdd = () => { }, // ÚJ!
  onMove
}: AnimalMovementPanelProps) {
  const [targetPenId, setTargetPenId] = useState('');
  const [movementReason, setMovementReason] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [isHistorical, setIsHistorical] = useState(false);
  const [historicalDate, setHistoricalDate] = useState('');
  const [functionType, setFunctionType] = useState('');

  // Hárem state változók
  const [availableBulls, setAvailableBulls] = useState<TenyeszbikaOption[]>([]);
  const [selectedBulls, setSelectedBulls] = useState<string[]>([]);
  const [paringStartDate, setPairingStartDate] = useState('');
  const [expectedVVDate, setExpectedVVDate] = useState('');

  // ⭐ ÚJ: HÁREM MÓDBAN JELENLEGI KARÁM IS VÁLASZTHATÓ
  const [isHaremMode, setIsHaremMode] = useState(false);

  // Tenyészbikák betöltése
  useEffect(() => {
    const fetchBulls = async () => {
      try {
        const { data, error } = await supabase
          .from('animals')
          .select('enar, kplsz, name')
          .eq('kategoria', 'tenyészbika')
          .eq('statusz', 'aktív')
          .order('name');

        if (error) {
          console.error('Tenyészbikák betöltési hiba:', error);
        } else {
          console.log('✅ Tenyészbikák betöltve:', data);
          setAvailableBulls(data || []);
        }
      } catch (error) {
        console.error('Tenyészbikák fetch hiba:', error);
      }
    };

    if (isOpen) {
      fetchBulls();
    }
  }, [isOpen]);

  // ⭐ ÚJ: HÁREM MÓD AUTOMATIKUS BEKAPCSOLÁSA
  useEffect(() => {
    if (functionType === 'hárem') {
      setIsHaremMode(true);
      // Ha hárem funkciót választ, automatikusan jelenlegi karám legyen a cél
      if (!targetPenId && currentPenId) {
        setTargetPenId(currentPenId);
      }
    } else {
      setIsHaremMode(false);
    }
  }, [functionType, currentPenId]);

  // VV dátum automatikus számítás
  useEffect(() => {
    if (paringStartDate && functionType === 'hárem') {
      const startDate = new Date(paringStartDate);
      const vvDate = new Date(startDate);
      vvDate.setDate(vvDate.getDate() + 75);
      setExpectedVVDate(vvDate.toISOString().split('T')[0]);
    } else {
      setExpectedVVDate('');
    }
  }, [paringStartDate, functionType]);

  // Kiválasztott állatok adatai
  const selectedAnimalData = animals.filter(animal => selectedAnimals.includes(animal.id));

  // ⭐ JAVÍTOTT: Karamok szűrése - hárem módban jelenlegi karám is elérhető
  const filteredPens = availablePens.filter(pen => {
    if (isHaremMode) {
      // Hárem módban minden karám elérhető (beleértve a jelenlegi)
      return true;
    } else {
      // Normál mozgatásnál kizárjuk a jelenlegi karamot
      return pen.id !== currentPenId;
    }
  });

  console.log('📋 Karamok szűrés:', {
    isHaremMode,
    currentPenId,
    allPens: availablePens.length,
    filteredPens: filteredPens.length
  });

  // Funkció emoji
  const getFunctionEmoji = (functionType: string): string => {
    const emojiMap: { [key: string]: string } = {
      'bölcsi': '🐮',
      'óvi': '🐄',
      'hárem': '🐄💕',
      'vemhes': '🐄💖',
      'hízóbika': '🐂',
      'ellető': '🐄🍼',
      'tehén': '🐄🍼',
      'üres': '⭕'
    };
    return emojiMap[functionType] || '❓';
  };

  // Kapacitás ellenőrzés
  const getCapacityWarning = (pen: Pen): string | null => {
    // Ha ugyanabban a karámban vagyunk (hárem beállítás), nincs kapacitás probléma
    if (pen.id === currentPenId && isHaremMode) {
      return null;
    }

    const remainingCapacity = pen.capacity - pen.animal_count;
    if (remainingCapacity < selectedAnimals.length) {
      return `Figyelem: ${selectedAnimals.length - remainingCapacity} állattal túllépi a kapacitást!`;
    }
    if (remainingCapacity === selectedAnimals.length) {
      return 'A karám tele lesz ezekkel az állatokkal.';
    }
    return null;
  };

  // Mozgatás végrehajtása
  const handleMove = async () => {
    if (!targetPenId || !movementReason) return;
    if (isHistorical && !historicalDate) return;

    // Hárem validáció
    if (functionType === 'hárem' && (selectedBulls.length === 0 || !paringStartDate)) {
      alert('⚠️ Hárem funkció esetén kötelező legalább 1 tenyészbika és párzási kezdet megadása!');
      return;
    }

    setLoading(true);
    try {
      console.log('🔧 AnimalMovementPanel handleMove hívás:', {
        targetPenId,
        movementReason,
        notes,
        isHistorical,
        historicalDate,
        functionType,
        selectedBulls,
        paringStartDate,
        expectedVVDate,
        isHaremMode
      });

      // Dátum formázás
      const moveDate = isHistorical ? historicalDate : new Date().toISOString().split('T')[0];

      // Metadata készítése hárem esetén
      let metadata = null;
      if (functionType === 'hárem') {
        const bullsData = selectedBulls.map(enar => {
          const bullData = availableBulls.find(bull => bull.enar === enar);
          return {
            enar: enar,
            name: bullData?.name || '',
            kplsz: bullData?.kplsz || ''
          };
        });

        metadata = {
          bulls: bullsData,
          bull_count: selectedBulls.length,
          pairing_start_date: paringStartDate,
          expected_vv_date: expectedVVDate,
          pairing_method: 'natural'
        };
      }

      await onMove(targetPenId, movementReason, notes, isHistorical, moveDate, functionType, metadata);

      // ✅ ÚJ: AUTOMATIKUS ESEMÉNY RÖGZÍTÉS
      if (!isHistorical && functionType) {
        try {
          let eventType: string | null = null;

          // Esemény típus meghatározása
          if (functionType === 'óvi') {
            eventType = ALERT_EVENT_TYPES.MOVED_TO_OVI_PEN;
          } else if (functionType === 'hárem') {
            eventType = ALERT_EVENT_TYPES.MOVED_TO_HAREM_PEN;
          } else if (functionType === 'ellető') {
            eventType = ALERT_EVENT_TYPES.MOVED_TO_BIRTHING_PEN;
          }

          // Ha van releváns esemény típus, rögzítjük minden állathoz
          if (eventType) {
            for (const animalId of selectedAnimals) {
              await recordAnimalEvent(
                supabase,
                animalId,
                eventType,
                `Karám mozgatás: ${movementReason}. ${notes || ''}`
              );
            }
            console.log(`✅ ${selectedAnimals.length} állat ${functionType} eseménye rögzítve`);
          }
        } catch (eventError) {
          console.error('❌ Esemény rögzítés hiba:', eventError);
        }
      }

      // ✅ ÚJ: Automatikus snapshot állat mozgatás után
      if (!isHistorical) {
        try {
          console.log('📸 Automatikus snapshot generálás állat mozgatás után...');
          await createAutomaticPeriodSnapshot(targetPenId, 'animals_moved', 'állat_mozgatás');

          // Ha más karámból érkeztek állatok, ott is snapshot
          if (currentPenId !== targetPenId) {
            await createAutomaticPeriodSnapshot(currentPenId, 'animals_moved', 'állat_mozgatás');
          }

          console.log('✅ Állat mozgatás snapshot elkészítve');
        } catch (snapshotError) {
          console.error('❌ Állat mozgatás snapshot hiba:', snapshotError);
        }
      } else {
        console.log('📚 Történeti mozgatás - snapshot kihagyva');
      }

      // ✅ ÚJ: AUTOMATIKUS PERIÓDUS LEZÁRÁS ÉS ÚJ INDÍTÁS
      if (!isHistorical && !isHaremMode) {
        try {
          console.log('🔄 Automatikus periódus kezelés indítása...');

          // 1. FORRÁSKARAM: Állatok eltávolítása miatti periódus lezárás
          if (currentPenId !== targetPenId) {
            await closeCurrentPeriodAndStartNew(currentPenId, 'animals_removed', selectedAnimals, moveDate);
          }

          // 2. CÉLKARAM: Állatok hozzáadása miatti periódus kezelés
          await closeCurrentPeriodAndStartNew(targetPenId, 'animals_added', selectedAnimals, moveDate, functionType, metadata);

          console.log('✅ Automatikus periódus kezelés befejezve');
        } catch (periodError) {
          console.error('❌ Automatikus periódus kezelés hiba:', periodError);
          // Ne állítsuk le a mozgatást emiatt, csak logolunk
        }
      }

      // Reset form
      setTargetPenId('');
      setMovementReason('');
      setNotes('');
      setIsHistorical(false);
      setHistoricalDate('');
      setFunctionType('');
      setSelectedBulls([]);
      setPairingStartDate('');
      setExpectedVVDate('');
      setIsHaremMode(false);

      onClose();
    } catch (error) {
      console.error('Hiba a mozgatáskor:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-0 border max-w-2xl shadow-lg rounded-lg bg-white">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <span className="text-2xl mr-3">{isHaremMode ? '💕' : '🔄'}</span>
            <h3 className="text-lg font-medium text-gray-900">
              {isHaremMode ? 'Hárem Beállítása' : 'Állatok Mozgatása'} ({selectedAnimals.length} állat)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <span className="text-xl">❌</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Kiválasztott állatok összesítése */}
          {isAddMode ? (
            /* AnimalSelector hozzáadás módban */
            <div className="mb-6">
              <AnimalSelector
                selected={selectedAnimalsForAdd}
                onChange={setSelectedAnimalsForAdd}
                multiSelect={true}
                currentOnly={false}
                includeSoldAnimals={false}
                label="🐄 Válassz állatokat a karámhoz:"
                placeholder="Keresés ENAR, kategória alapján..."
                maxHeight="max-h-60"
              />
            </div>
          ) : (
            /* Eredeti zöld sáv normál módban */
            <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-medium text-green-900 mb-3 flex items-center">
                <span className="text-lg mr-2">🐄</span>
                {isHaremMode ? 'Hárembe állítandó állatok:' : 'Mozgatandó állatok:'}
              </h4>
              <div className="flex flex-wrap gap-2">
                {selectedAnimalData.slice(0, 10).map(animal => (
                  <span key={animal.id} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                    {displayEnar(animal.enar)}
                  </span>
                ))}
                {selectedAnimalData.length > 10 && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    +{selectedAnimalData.length - 10} további
                  </span>
                )}
              </div>
            </div>
          )}
          <div className="space-y-6">
            {/* Karám funkció - ELŐRE HELYEZVE! */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <span className="text-lg mr-2">🏠</span>
                Karám funkció: *
              </label>
              <select
                value={functionType}
                onChange={(e) => setFunctionType(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors bg-white"
                required
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
              <p className="mt-1 text-xs text-gray-500">
                ℹ️ {isHaremMode ? 'Hárem funkció kiválasztva - jelenlegi karám funkciója módosul' : 'Milyen funkcióban lesz az állat a célkarámban'}
              </p>
            </div>

            {/* Célkarám választás */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <span className="text-lg mr-2">🎯</span>
                {isHaremMode ? 'Karám (jelenlegi funkció módosítása):' : 'Célkarám:'} *
              </label>
              <select
                value={targetPenId}
                onChange={(e) => setTargetPenId(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors bg-white"
                required
              >
                <option value="">Válassz karamot...</option>
                {filteredPens.map(pen => (
                  <option key={pen.id} value={pen.id}>
                    {getFunctionEmoji(pen.current_function?.function_type || 'üres')}
                    {pen.pen_number} - {pen.location}
                    {pen.id === currentPenId ? ' (JELENLEGI)' : ''}
                    ({pen.animal_count}/{pen.capacity})
                    {pen.current_function?.function_type && ` - ${pen.current_function.function_type}`}
                  </option>
                ))}
              </select>

              <p className="mt-1 text-xs text-gray-500">
                📊 {filteredPens.length} karám elérhető
                {isHaremMode ? ' (jelenlegi karám is választható hárem beállításhoz)' : ' (jelenlegi karám kizárva)'}
              </p>

              {/* Kapacitás figyelmeztetés */}
              {targetPenId && (() => {
                const selectedPen = filteredPens.find(p => p.id === targetPenId);
                if (selectedPen) {
                  const warning = getCapacityWarning(selectedPen);
                  if (warning) {
                    return (
                      <div className={`mt-2 p-3 rounded-lg flex items-start ${warning.includes('túllépi') ? 'bg-red-50 border border-red-200' : 'bg-orange-50 border border-orange-200'
                        }`}>
                        <span className="text-lg mt-0.5 mr-2">
                          {warning.includes('túllépi') ? '🚨' : '⚠️'}
                        </span>
                        <span className={`text-sm ${warning.includes('túllépi') ? 'text-red-800' : 'text-orange-800'
                          }`}>
                          {warning}
                        </span>
                      </div>
                    );
                  } else if (!isHaremMode || selectedPen.id !== currentPenId) {
                    return (
                      <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start">
                        <span className="text-lg mt-0.5 mr-2">✅</span>
                        <span className="text-sm text-green-800">
                          Elegendő hely van a karamban ({selectedPen.capacity - selectedPen.animal_count} szabad hely).
                        </span>
                      </div>
                    );
                  }
                }
                return null;
              })()}
            </div>

            {/* Mozgatás oka */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <span className="text-lg mr-2">❓</span>
                {isHaremMode ? 'Hárem beállítás oka:' : 'Mozgatás oka:'} *
              </label>
              <select
                value={movementReason}
                onChange={(e) => setMovementReason(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors bg-white"
                required
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

            {/* Hárem specifikus mezők */}
            {functionType === 'hárem' && (
              <div className="bg-pink-50 p-4 rounded-lg border border-pink-200">
                <h4 className="text-lg font-medium text-pink-900 mb-4 flex items-center">
                  💕 Hárem Specifikus Adatok
                </h4>

                <div className="space-y-4">
                  {/* Tenyészbika multi-select */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      🐂 Tenyészbika(k) kiválasztása: *
                    </label>

                    {/* Kiválasztott bikák megjelenítése */}
                    {selectedBulls.length > 0 && (
                      <div className="mb-3 p-3 bg-white rounded border border-pink-300">
                        <p className="text-sm font-medium text-pink-800 mb-2">
                          Kiválasztott bikák ({selectedBulls.length}):
                        </p>
                        <div className="space-y-1">
                          {selectedBulls.map((enar) => {
                            const bullData = availableBulls.find(bull => bull.enar === enar);
                            return (
                              <div key={enar} className="flex items-center justify-between bg-pink-50 p-2 rounded">
                                <span className="text-sm">
                                  🐂 {bullData?.name || 'Ismeretlen'} - {enar}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setSelectedBulls(prev => prev.filter(e => e !== enar))}
                                  className="text-red-500 hover:text-red-700 text-sm px-2 py-1"
                                >
                                  ❌
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Új bika hozzáadása */}
                    <select
                      value=""
                      onChange={(e) => {
                        if (e.target.value && !selectedBulls.includes(e.target.value)) {
                          setSelectedBulls(prev => [...prev, e.target.value]);
                        }
                      }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors bg-white"
                    >
                      <option value="">+ Válassz tenyészbikát hozzáadáshoz...</option>
                      {availableBulls
                        .filter(bull => !selectedBulls.includes(bull.enar))
                        .map((bull) => (
                          <option key={bull.enar} value={bull.enar}>
                            🐂 {bull.name} - {bull.enar} (KPLSZ: {bull.kplsz})
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Párzási időszak kezdete */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      💕 Párzási időszak kezdete: *
                    </label>
                    <input
                      type="date"
                      value={paringStartDate}
                      onChange={(e) => setPairingStartDate(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors bg-white"
                      max={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>

                  {/* VV tervezett (automatikus) */}
                  {expectedVVDate && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        🔍 VV vizsgálat tervezett időpontja:
                      </label>
                      <input
                        type="date"
                        value={expectedVVDate}
                        disabled
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                      />
                      <p className="mt-1 text-xs text-blue-600">
                        ✨ Automatikusan számítva: párzási kezdet + 75 nap
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Dátum és történeti mezők - csak ha NEM hárem mód */}
            {!isHaremMode && (
              <>
                {/* Mozgatás dátuma */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <span className="text-lg mr-2">📅</span>
                    Mozgatás dátuma:
                  </label>
                  <input
                    type="date"
                    value={historicalDate}
                    onChange={(e) => setHistoricalDate(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors bg-white"
                    max={new Date().toISOString().split('T')[0]}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Hagyd üresen a mai dátumhoz, vagy adj meg korábbi dátumot
                  </p>
                </div>

                {/* Történeti mozgatás */}
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isHistorical}
                      onChange={(e) => setIsHistorical(e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-blue-900 flex items-center">
                      <span className="text-lg mr-2">📚</span>
                      Történeti állat mozgatás
                    </span>
                  </label>

                  <div className="mt-3 ml-7 text-xs text-blue-700 bg-blue-100 p-3 rounded border-l-4 border-blue-400">
                    <div className="font-medium mb-1">ℹ️ Mit jelent ez?</div>
                    <div className="space-y-1">
                      <div>• <strong>Fizikai mozgatás:</strong> Az állatok ténylegesen átkerülnek a másik karámba</div>
                      <div>• <strong>Múltbéli dátum:</strong> A mozgatás a megadott korábbi dátummal lesz rögzítve</div>
                      <div>• <strong>Jelenlegi állapot:</strong> Az állatok jelenleg a célkarámban lesznek</div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-blue-300 text-blue-600">
                      <strong>Példa:</strong> "Múlt héten elfelejtettem rögzíteni, hogy 3 állatot áttettem a 2-es karámba"
                    </div>
                  </div>

                  <div className="mt-2 ml-7 text-xs text-gray-600">
                    💡 <strong>Tipp:</strong> Ha csak dokumentálni szeretnél (fizikai mozgatás nélkül), használd a <strong>Karám Történet</strong> funkciót
                  </div>
                </div>
              </>
            )}

            {/* Megjegyzés */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <span className="text-lg mr-2">📝</span>
                Megjegyzés:
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                rows={3}
                placeholder="Opcionális megjegyzés..."
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-4 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={loading}
            className="bg-white hover:bg-gray-50 text-gray-700 font-medium px-6 py-3 rounded-lg border border-gray-300 transition-colors disabled:opacity-50 inline-flex items-center"
          >
            <span className="mr-2">❌</span>
            Mégse
          </button>
          <button
            onClick={handleMove}
            disabled={!targetPenId || !movementReason || loading || (functionType === 'hárem' && (selectedBulls.length === 0 || !paringStartDate))}
            className="bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {isHaremMode ? 'Hárem beállítás...' : 'Mozgatás...'}
              </>
            ) : (
              <>
                <span className="mr-2">{isHaremMode ? '💕' : '🔄'}</span>
                {isHaremMode ? 'Hárem Beállítása' : (isHistorical ? '📚 Történeti Mozgatás' : ' Mozgatás Végrehajtása')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
// ✅ ÚJ FÜGGVÉNY: Automatikus periódus lezárás és új indítás
const closeCurrentPeriodAndStartNew = async (
  penId: string,
  changeType: 'animals_added' | 'animals_removed',
  affectedAnimals: number[],
  eventDate: string,
  newFunctionType?: string,
  newMetadata?: any
) => {
  try {
    // 1. Jelenlegi aktív periódus lekérdezése
    const { data: currentPeriod, error: periodError } = await supabase
      .from('pen_history_periods')
      .select('*')
      .eq('pen_id', penId)
      .is('end_date', null)
      .order('start_date', { ascending: false })
      .limit(1)
      .single();

    if (periodError && periodError.code !== 'PGRST116') {
      throw periodError;
    }

    // 2. Ha van aktív periódus, lezárjuk
    if (currentPeriod) {
      const endDate = new Date(eventDate);
      endDate.setHours(23, 59, 59); // Nap vége

      const { error: closeError } = await supabase
        .from('pen_history_periods')
        .update({
          end_date: endDate.toISOString().split('T')[0],
          metadata: {
            ...currentPeriod.metadata,
            closed_reason: changeType,
            closed_automatically: true,
            affected_animals: affectedAnimals.length,
            closure_date: new Date().toISOString()
          }
        })
        .eq('id', currentPeriod.id);

      if (closeError) throw closeError;

      console.log(`✅ Periódus lezárva: ${currentPeriod.function_type} (${currentPeriod.id})`);
    }

    // 3. Új periódus indítása (ha van új funkció vagy maradnak állatok)
    if (changeType === 'animals_added' || (changeType === 'animals_removed' && await hasRemainingAnimals(penId, affectedAnimals))) {
      const startDate = new Date(eventDate);
      startDate.setHours(0, 0, 0); // Nap eleje

      // Jelenlegi állatok lekérdezése a karámban (a mozgatás után)
      const { data: currentAnimals, error: animalsError } = await supabase
        .from('animal_pen_assignments')
        .select(`
          animal_id,
          animals:animal_id (
            id, enar, kategoria, ivar, statusz, szuletesi_datum
          )
        `)
        .eq('pen_id', penId)
        .is('removed_at', null);

      if (animalsError) throw animalsError;

      const animalsSnapshot = currentAnimals?.map(assignment => assignment.animals).filter(Boolean) || [];

      // Funkció típus meghatározása
      const functionType = newFunctionType || determineFunctionType(animalsSnapshot);

      // Metadata összeállítása
      const periodMetadata = {
        auto_created: true,
        created_reason: changeType,
        animal_count: animalsSnapshot.length,
        creation_date: new Date().toISOString(),
        ...(newMetadata || {})
      };

      // Új periódus létrehozása
      const { error: createError } = await supabase
        .from('pen_history_periods')
        .insert({
          pen_id: penId,
          function_type: functionType,
          start_date: startDate.toISOString().split('T')[0],
          end_date: null, // Folyamatban
          animals_snapshot: animalsSnapshot,
          metadata: periodMetadata,
          historical: false,
          notes: `Automatikusan létrehozva állat mozgatás miatt (${changeType})`
        });

      if (createError) throw createError;

      console.log(`✅ Új periódus indítva: ${functionType} (${animalsSnapshot.length} állat)`);
    }

  } catch (error) {
    console.error(`❌ Periódus kezelés hiba (${penId}):`, error);
    throw error;
  }
};

// ✅ SEGÉD FÜGGVÉNY: Vannak-e még állatok a karámban
const hasRemainingAnimals = async (penId: string, removedAnimals: number[]): Promise<boolean> => {
  const { data, error } = await supabase
    .from('animal_pen_assignments')
    .select('animal_id')
    .eq('pen_id', penId)
    .is('removed_at', null)
    .not('animal_id', 'in', `(${removedAnimals.join(',')})`);

  if (error) {
    console.error('Maradó állatok ellenőrzés hiba:', error);
    return false;
  }

  return (data?.length || 0) > 0;
};

// ✅ SEGÉD FÜGGVÉNY: Funkció típus automatikus meghatározása
const determineFunctionType = (animals: any[]): string => {
  if (animals.length === 0) return 'üres';

  const categories = animals.map(a => a.kategoria);
  const hasBulls = categories.includes('tenyészbika');
  const hasFemales = categories.some(cat => cat !== 'tenyészbika');

  // Logika a kategóriák alapján
  if (hasBulls && hasFemales) {
    return 'hárem'; // Bikák + nőivarok = hárem
  }

  const avgAge = animals.reduce((sum, animal) => {
    const birthDate = new Date(animal.szuletesi_datum);
    const ageMonths = (Date.now() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
    return sum + ageMonths;
  }, 0) / animals.length;

  if (avgAge < 12) return 'bölcsi';     // 0-12 hónap
  if (avgAge < 24) return 'óvi';        // 12-24 hónap
  if (hasBulls) return 'hízóbika';      // Csak bikák

  return 'tehén'; // Default felnőtt nőivarok
};