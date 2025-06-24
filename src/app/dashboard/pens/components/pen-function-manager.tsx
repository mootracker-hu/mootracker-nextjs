// src/app/dashboard/pens/components/pen-function-manager.tsx
'use client';

import { useState } from 'react';
import { X, Settings, AlertTriangle, CheckCircle, Calendar, User, Heart, Clock, Shield, Package } from 'lucide-react';
import { PenFunctionType, PEN_FUNCTION_LABELS, NOTES_TEMPLATES, KorhazMetadata, AtmenetiMetadata, KarantenMetadata, SelejtMetadata } from '@/types/alert-task-types';

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
  id: string;
  function_type: PenFunctionType;
  start_date: string;
  metadata: any;
  notes?: string;
}

interface PenFunctionManagerProps {
  isOpen: boolean;
  onClose: () => void;
  pen: Pen;
  onFunctionChange: (newFunction: PenFunctionType, metadata: any, notes: string) => void;
}

export default function PenFunctionManager({
  isOpen,
  onClose,
  pen,
  onFunctionChange
}: PenFunctionManagerProps) {
  const [newFunction, setNewFunction] = useState<PenFunctionType>(pen.current_function?.function_type || 'üres');
  const [notes, setNotes] = useState(pen.current_function?.notes || '');
  const [customNotes, setCustomNotes] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Hárem specifikus mezők
  const [tenyeszbikaName, setTenyeszbikaName] = useState(pen.current_function?.metadata?.tenyeszbika_name || '');
  const [tenyeszbikaEnar, setTenyeszbikaEnar] = useState(pen.current_function?.metadata?.tenyeszbika_enar || '');
  const [parozasKezdete, setParozasKezdete] = useState(pen.current_function?.metadata?.parozas_kezdete || '');

  // Kórház specifikus mezők
  const [treatmentType, setTreatmentType] = useState<KorhazMetadata['treatment_type']>('megfigyeles');
  const [veterinarian, setVeterinarian] = useState('');
  const [expectedRecovery, setExpectedRecovery] = useState('');
  const [returnPenId, setReturnPenId] = useState('');

  // Átmeneti specifikus mezők
  const [atmenetiReason, setAtmenetiReason] = useState<AtmenetiMetadata['reason']>('besorolás_alatt');
  const [decisionDeadline, setDecisionDeadline] = useState('');
  const [decisionCriteria, setDecisionCriteria] = useState('');

  // Karantén specifikus mezők
  const [quarantineReason, setQuarantineReason] = useState<KarantenMetadata['quarantine_reason']>('uj_allat');
  const [expectedEndDate, setExpectedEndDate] = useState('');
  const [releaseCriteria, setReleaseCriteria] = useState('');

  // Selejt specifikus mezők
  const [selejtReason, setSelejtReason] = useState<SelejtMetadata['reason']>('reprodukcios_problema');
  const [plannedDisposal, setPlannedDisposal] = useState<SelejtMetadata['planned_disposal']>('ertekesites');
  const [disposalDeadline, setDisposalDeadline] = useState('');

  // ✅ BŐVÍTETT FUNKCIÓ TÍPUSOK
  const functionTypes = [
    { value: 'bölcsi' as PenFunctionType, label: '🐮 Bölcsi', description: '0-12 hónapos borjak nevelése', color: 'blue' },
    { value: 'óvi' as PenFunctionType, label: '🐄 Óvi', description: '12-24 hónapos üszők nevelése', color: 'green' },
    { value: 'hárem' as PenFunctionType, label: '🐄💕 Hárem', description: 'Tenyésztésben lévő üszők/tehenek', color: 'pink' },
    { value: 'vemhes' as PenFunctionType, label: '🐄💖 Vemhes', description: 'Vemhes állatok ellésre várva', color: 'purple' },
    { value: 'hízóbika' as PenFunctionType, label: '🐂 Hízóbika', description: 'Hústermelés céljából tartott bikák', color: 'orange' },
    { value: 'ellető' as PenFunctionType, label: '🐄🍼 Ellető', description: 'Ellés körül lévő tehenek', color: 'red' },
    { value: 'tehén' as PenFunctionType, label: '🐄🍼 Tehén', description: 'Borjával együtt tartott tehenek', color: 'yellow' },
    { value: 'üres' as PenFunctionType, label: '⭕ Üres', description: 'Jelenleg nincs használatban', color: 'gray' },
    
    // ✅ ÚJ KARÁM TÍPUSOK
    { value: 'átmeneti' as PenFunctionType, label: '🔄 Átmeneti', description: 'Ideiglenes elhelyezés, döntés alatt', color: 'indigo' },
    { value: 'kórház' as PenFunctionType, label: '🏥 Kórház', description: 'Kezelés alatt lévő állatok', color: 'red' },
    { value: 'karantén' as PenFunctionType, label: '🔒 Karantén', description: 'Elkülönített állatok', color: 'yellow' },
    { value: 'selejt' as PenFunctionType, label: '📦 Selejt', description: 'Értékesítésre/vágásra váró állatok', color: 'slate' }
  ];

  // Ellető karamokra csak ellető és üres funkció
  const getAvailableFunctions = () => {
    if (pen.pen_type === 'birthing') {
      return functionTypes.filter(func => ['ellető', 'üres', 'kórház'].includes(func.value));
    }
    // Ellető csak ellető karamokban, de kórház bárhol lehet
    return functionTypes.filter(func => func.value !== 'ellető');
  };

  // ✅ RUGALMAS KAPACITÁS SZÁMÍTÁS
  const calculateNewCapacity = (functionType: PenFunctionType): number => {
    // Ellető istálló kapacitások
    if (pen.pen_number.startsWith('E')) {
      if (['E1', 'E2', 'E7', 'E8'].includes(pen.pen_number)) return 25;
      return 2; // EB boxok: 1 mama + 1 borjú = 2 kapacitás
    }
    
    // Külső karamok funkció-alapú kapacitása
    const isLargePen = ['14', '15'].includes(pen.pen_number);
    const isContainerPen = ['12A', '12B'].includes(pen.pen_number);
    
    if (isLargePen) return 50;
    if (isContainerPen) return 15;
    
    // Standard karamok funkció szerint
    switch (functionType) {
      case 'hárem': return 27; // 25 nőivar + 2 tenyészbika
      case 'vemhes': return 30;
      case 'tehén': return 40; // 20 tehén + borjak + 2 tenyészbika
      case 'bölcsi': return 25;
      case 'óvi': return 25;
      case 'hízóbika': return 20;
      
      // ✅ ÚJ TÍPUSOK - RUGALMAS KAPACITÁS
      case 'kórház': return Math.min(5, pen.capacity); // Max 5, de alkalmazkodik
      case 'átmeneti': return pen.capacity; // Rugalmas, eredeti kapacitás
      case 'karantén': return Math.min(10, pen.capacity); // Max 10 elkülönítésre
      case 'selejt': return pen.capacity; // Rugalmas
      
      default: return 25;
    }
  };

  // Kapacitás figyelmeztetés
  const getCapacityWarning = (): string | null => {
    if (!newFunction) return null;
    
    const newCapacity = calculateNewCapacity(newFunction);
    const currentAnimals = pen.animal_count;
    
    // Speciális üzenetek az új típusokhoz
    if (newFunction === 'kórház' && currentAnimals > 5) {
      return 'Kórház karám: Maximum 5 állat ajánlott intenzív megfigyeléshez.';
    }
    
    if (newFunction === 'átmeneti') {
      return 'Átmeneti karám: Rugalmas kapacitás, időben korlátozott használat.';
    }
    
    if (currentAnimals > newCapacity) {
      return `Figyelem: ${currentAnimals - newCapacity} állattal túllépi az új kapacitást! Állatok áthelyezése szükséges.`;
    }
    if (currentAnimals === newCapacity) {
      return 'A karám tele lesz az új funkcióval.';
    }
    return null;
  };

  // ✅ METADATA ÖSSZEÁLLÍTÁSA
  const buildMetadata = (): any => {
    const baseMetadata: any = {};
    
    switch (newFunction) {
      case 'hárem':
        if (tenyeszbikaName) baseMetadata.tenyeszbika_name = tenyeszbikaName;
        if (tenyeszbikaEnar) baseMetadata.tenyeszbika_enar = tenyeszbikaEnar;
        if (parozasKezdete) baseMetadata.parozas_kezdete = parozasKezdete;
        break;
        
      case 'kórház':
        const korhazMeta: KorhazMetadata = {
          treatment_type: treatmentType,
          treatment_start_date: new Date().toISOString(),
          expected_recovery_date: expectedRecovery || undefined,
          veterinarian: veterinarian || undefined,
          return_pen_id: returnPenId || undefined,
          treatment_notes: customNotes || undefined
        };
        Object.assign(baseMetadata, korhazMeta);
        break;
        
      case 'átmeneti':
        const atmenetiMeta: AtmenetiMetadata = {
          reason: atmenetiReason,
          temporary_since: new Date().toISOString(),
          decision_deadline: decisionDeadline || undefined,
          decision_criteria: decisionCriteria || undefined,
          notes: customNotes || undefined
        };
        Object.assign(baseMetadata, atmenetiMeta);
        break;
        
      case 'karantén':
        const karantenMeta: KarantenMetadata = {
          quarantine_reason: quarantineReason,
          quarantine_start_date: new Date().toISOString(),
          expected_end_date: expectedEndDate || undefined,
          release_criteria: releaseCriteria || undefined,
          notes: customNotes || undefined
        };
        Object.assign(baseMetadata, karantenMeta);
        break;
        
      case 'selejt':
        const selejtMeta: SelejtMetadata = {
          reason: selejtReason,
          planned_disposal: plannedDisposal,
          disposal_deadline: disposalDeadline || undefined,
          notes: customNotes || undefined
        };
        Object.assign(baseMetadata, selejtMeta);
        break;
    }
    
    return baseMetadata;
  };

  // Funkció változtatás
  const handleFunctionChange = async () => {
    if (!newFunction) return;

    setLoading(true);
    try {
      const metadata = buildMetadata();
      const finalNotes = notes + (customNotes ? `\n\n${customNotes}` : '');
      
      await onFunctionChange(newFunction, metadata, finalNotes);
      onClose();
    } catch (error) {
      console.error('Hiba a funkció váltáskor:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const availableFunctions = functionTypes;
  const capacityWarning = getCapacityWarning();
  const newCapacity = newFunction ? calculateNewCapacity(newFunction) : pen.capacity;
  const selectedTemplate = NOTES_TEMPLATES[newFunction];

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-0 border max-w-4xl shadow-lg rounded-lg bg-white">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <Settings className="h-6 w-6 text-green-600 mr-3" />
            <h3 className="text-lg font-medium text-gray-900">
              Karám {pen.pen_number} - Funkció Kezelés
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[80vh] overflow-y-auto">
          {/* Jelenlegi állapot */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-2">Jelenlegi Állapot:</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Funkció:</span>
                <p className="font-medium">{PEN_FUNCTION_LABELS[pen.current_function?.function_type || 'üres']}</p>
              </div>
              <div>
                <span className="text-gray-600">Kapacitás:</span>
                <p className="font-medium">{pen.animal_count}/{pen.capacity} állat</p>
              </div>
              <div>
                <span className="text-gray-600">Funkció kezdete:</span>
                <p className="font-medium">
                  {pen.current_function?.start_date ? 
                    new Date(pen.current_function.start_date).toLocaleDateString('hu-HU') : 
                    'Nincs adat'
                  }
                </p>
              </div>
              <div>
                <span className="text-gray-600">Lokáció:</span>
                <p className="font-medium">{pen.location}</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Új funkció választás */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Új funkció: *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {availableFunctions.map(funcType => (
                  <label key={funcType.value} className="cursor-pointer">
                    <div className={`p-4 border rounded-lg transition-colors ${
                      newFunction === funcType.value 
                        ? 'border-green-500 bg-green-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}>
                      <div className="flex items-center">
                        <input
                          type="radio"
                          name="function"
                          value={funcType.value}
                          checked={newFunction === funcType.value}
                          onChange={(e) => setNewFunction(e.target.value as PenFunctionType)}
                          className="h-4 w-4 text-green-600 border-gray-300 focus:ring-green-500"
                        />
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">{funcType.label}</div>
                          <div className="text-xs text-gray-500">{funcType.description}</div>
                          {newFunction === funcType.value && (
                            <div className="text-xs text-green-600 mt-1">
                              Új kapacitás: {newCapacity} állat
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Kapacitás figyelmeztetés */}
            {capacityWarning && (
              <div className={`p-4 rounded-lg flex items-start ${
                capacityWarning.includes('túllépi') ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'
              }`}>
                <AlertTriangle className={`h-5 w-5 mt-0.5 mr-3 ${
                  capacityWarning.includes('túllépi') ? 'text-red-600' : 'text-yellow-600'
                }`} />
                <div>
                  <div className={`text-sm font-medium ${
                    capacityWarning.includes('túllépi') ? 'text-red-800' : 'text-yellow-800'
                  }`}>
                    Kapacitás Információ
                  </div>
                  <div className={`text-sm ${
                    capacityWarning.includes('túllépi') ? 'text-red-700' : 'text-yellow-700'
                  }`}>
                    {capacityWarning}
                  </div>
                </div>
              </div>
            )}

            {/* ✅ FUNKCIÓ-SPECIFIKUS BEÁLLÍTÁSOK */}
            
            {/* Hárem specifikus mezők */}
            {newFunction === 'hárem' && (
              <div className="p-4 bg-pink-50 border border-pink-200 rounded-lg">
                <h4 className="font-medium text-pink-900 mb-4 flex items-center">
                  <Heart className="h-4 w-4 mr-2" />
                  Hárem Beállítások
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-pink-700 mb-1">
                      Tenyészbika neve:
                    </label>
                    <input
                      type="text"
                      value={tenyeszbikaName}
                      onChange={(e) => setTenyeszbikaName(e.target.value)}
                      className="w-full border border-pink-300 rounded-md px-3 py-2 focus:ring-pink-500 focus:border-pink-500"
                      placeholder="pl. Buksi"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-pink-700 mb-1">
                      Tenyészbika ENAR:
                    </label>
                    <input
                      type="text"
                      value={tenyeszbikaEnar}
                      onChange={(e) => setTenyeszbikaEnar(e.target.value)}
                      className="w-full border border-pink-300 rounded-md px-3 py-2 focus:ring-pink-500 focus:border-pink-500"
                      placeholder="HU 12345 6789 0"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-pink-700 mb-1">
                      Párzás kezdete:
                    </label>
                    <input
                      type="date"
                      value={parozasKezdete}
                      onChange={(e) => setParozasKezdete(e.target.value)}
                      className="w-full border border-pink-300 rounded-md px-3 py-2 focus:ring-pink-500 focus:border-pink-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Kórház specifikus mezők */}
            {newFunction === 'kórház' && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="font-medium text-red-900 mb-4 flex items-center">
                  <Heart className="h-4 w-4 mr-2" />
                  Kórház Beállítások
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-red-700 mb-1">
                      Kezelés típusa:
                    </label>
                    <select
                      value={treatmentType}
                      onChange={(e) => setTreatmentType(e.target.value as KorhazMetadata['treatment_type'])}
                      className="w-full border border-red-300 rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500"
                    >
                      <option value="megfigyeles">Megfigyelés</option>
                      <option value="gyogykezeles">Gyógykezelés</option>
                      <option value="vakcinazas">Vakcinázás</option>
                      <option value="sebezes">Sebészet</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-red-700 mb-1">
                      Állatorvos:
                    </label>
                    <input
                      type="text"
                      value={veterinarian}
                      onChange={(e) => setVeterinarian(e.target.value)}
                      className="w-full border border-red-300 rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="Dr. Nagy Péter"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-red-700 mb-1">
                      Várható gyógyulás:
                    </label>
                    <input
                      type="date"
                      value={expectedRecovery}
                      onChange={(e) => setExpectedRecovery(e.target.value)}
                      className="w-full border border-red-300 rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-red-700 mb-1">
                      Visszahelyezés karám ID:
                    </label>
                    <input
                      type="text"
                      value={returnPenId}
                      onChange={(e) => setReturnPenId(e.target.value)}
                      className="w-full border border-red-300 rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="Eredeti karám ID"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Átmeneti specifikus mezők */}
            {newFunction === 'átmeneti' && (
              <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                <h4 className="font-medium text-indigo-900 mb-4 flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  Átmeneti Beállítások
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-indigo-700 mb-1">
                      Ide kerülés oka:
                    </label>
                    <select
                      value={atmenetiReason}
                      onChange={(e) => setAtmenetiReason(e.target.value as AtmenetiMetadata['reason'])}
                      className="w-full border border-indigo-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="besorolás_alatt">Besorolás alatt</option>
                      <option value="funkció_váltás_alatt">Funkció váltás alatt</option>
                      <option value="vizsgálat_alatt">Vizsgálat alatt</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-indigo-700 mb-1">
                      Döntési határidő:
                    </label>
                    <input
                      type="date"
                      value={decisionDeadline}
                      onChange={(e) => setDecisionDeadline(e.target.value)}
                      className="w-full border border-indigo-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-indigo-700 mb-1">
                      Döntési kritériumok:
                    </label>
                    <input
                      type="text"
                      value={decisionCriteria}
                      onChange={(e) => setDecisionCriteria(e.target.value)}
                      className="w-full border border-indigo-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="VV eredmény, egészségügyi vizsgálat, stb."
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Notes Template + Szabad szöveg */}
            <div className="space-y-4">
              {/* Template preview */}
              {selectedTemplate && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">📝 Javasolt mezők ({PEN_FUNCTION_LABELS[newFunction]}):</h4>
                  <pre className="text-sm text-blue-800 whitespace-pre-wrap font-mono bg-white p-3 rounded border">
                    {selectedTemplate}
                  </pre>
                </div>
              )}

              {/* Szabad megjegyzések */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Egyedi megjegyzések:
                </label>
                <textarea 
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-green-500 focus:border-green-500"
                  rows={4}
                  placeholder="Írj ide bármilyen megjegyzést, megfigyelést a karámmal kapcsolatban..."
                />
              </div>

              {/* Általános megjegyzések */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Funkció váltási megjegyzés:
                </label>
                <textarea 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-green-500 focus:border-green-500"
                  rows={2}
                  placeholder="Megjegyzés a funkció váltásról..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-4 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
          >
            Mégse
          </button>
          <button
            onClick={handleFunctionChange}
            disabled={!newFunction || newFunction === pen.current_function?.function_type || loading}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Mentés...
              </>
            ) : (
              <>
                <Settings className="h-4 w-4 mr-2" />
                Funkció Váltása
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}