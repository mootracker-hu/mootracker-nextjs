// src/app/dashboard/pens/components/pen-function-manager.tsx
'use client';

import { useState } from 'react';
import { X, Settings, AlertTriangle, CheckCircle, Calendar, User } from 'lucide-react';

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
  function_type: 'bölcsi' | 'óvi' | 'hárem' | 'vemhes' | 'hízóbika' | 'ellető' | 'üres' | 'tehén';
  start_date: string;
  metadata: any;
  notes?: string;
}

interface PenFunctionManagerProps {
  isOpen: boolean;
  onClose: () => void;
  pen: Pen;
  onFunctionChange: (newFunction: string, metadata: any, notes: string) => void;
}

export default function PenFunctionManager({
  isOpen,
  onClose,
  pen,
  onFunctionChange
}: PenFunctionManagerProps) {
  const [newFunction, setNewFunction] = useState(pen.current_function?.function_type || '');
  const [notes, setNotes] = useState(pen.current_function?.notes || '');
  const [loading, setLoading] = useState(false);
  
  // Hárem specifikus mezők
  const [tenyeszbikaName, setTenyeszbikaName] = useState(pen.current_function?.metadata?.tenyeszbika_name || '');
  const [tenyeszbikaEnar, setTenyeszbikaEnar] = useState(pen.current_function?.metadata?.tenyeszbika_enar || '');
  const [parozasKezdete, setParozasKezdete] = useState(pen.current_function?.metadata?.parozas_kezdete || '');

  // Funkció típusok és leírásaik
  const functionTypes = [
    { value: 'bölcsi', label: '🐮 Bölcsi', description: '0-12 hónapos borjak nevelése' },
    { value: 'óvi', label: '🐄 Óvi', description: '12-24 hónapos üszők nevelése' },
    { value: 'hárem', label: '🐄💕 Hárem', description: 'Tenyésztésben lévő üszők/tehenek' },
    { value: 'vemhes', label: '🐄💖 Vemhes', description: 'Vemhes állatok ellésre várva' },
    { value: 'hízóbika', label: '🐂 Hízóbika', description: 'Hústermelés céljából tartott bikák' },
    { value: 'ellető', label: '🐄🍼 Ellető', description: 'Ellés körül lévő tehenek' },
    { value: 'tehén', label: '🐄🍼 Tehén', description: 'Borjával együtt tartott tehenek' },
    { value: 'üres', label: '⭕ Üres', description: 'Jelenleg nincs használatban' }
  ];

  // Ellető karamokra csak ellető és üres funkció
  const getAvailableFunctions = () => {
    if (pen.pen_type === 'birthing') {
      return functionTypes.filter(func => ['ellető', 'üres'].includes(func.value));
    }
    return functionTypes.filter(func => func.value !== 'ellető'); // Ellető csak ellető karamokban
  };

  // Dinamikus kapacitás számítás
  const calculateNewCapacity = (functionType: string): number => {
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
      default: return 25;
    }
  };

  // Kapacitás figyelmeztetés
  const getCapacityWarning = (): string | null => {
    if (!newFunction) return null;
    
    const newCapacity = calculateNewCapacity(newFunction);
    const currentAnimals = pen.animal_count;
    
    if (currentAnimals > newCapacity) {
      return `Figyelem: ${currentAnimals - newCapacity} állattal túllépi az új kapacitást! Állatok áthelyezése szükséges.`;
    }
    if (currentAnimals === newCapacity) {
      return 'A karám tele lesz az új funkcióval.';
    }
    return null;
  };

  // Funkció változtatás
  const handleFunctionChange = async () => {
    if (!newFunction) return;

    setLoading(true);
    try {
      const metadata: any = {};
      
      // Hárem specifikus metadata
      if (newFunction === 'hárem') {
        if (tenyeszbikaName) metadata.tenyeszbika_name = tenyeszbikaName;
        if (tenyeszbikaEnar) metadata.tenyeszbika_enar = tenyeszbikaEnar;
        if (parozasKezdete) metadata.parozas_kezdete = parozasKezdete;
      }

      await onFunctionChange(newFunction, metadata, notes);
      onClose();
    } catch (error) {
      console.error('Hiba a funkció váltáskor:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const availableFunctions = getAvailableFunctions();
  const capacityWarning = getCapacityWarning();
  const newCapacity = newFunction ? calculateNewCapacity(newFunction) : pen.capacity;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-0 border max-w-2xl shadow-lg rounded-lg bg-white">
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
        <div className="p-6">
          {/* Jelenlegi állapot */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-2">Jelenlegi Állapot:</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Funkció:</span>
                <p className="font-medium">{pen.current_function?.function_type || 'Nincs beállítva'}</p>
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
              <div className="grid grid-cols-1 gap-3">
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
                          onChange={(e) => setNewFunction(e.target.value)}
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
                    Kapacitás Figyelmeztetés
                  </div>
                  <div className={`text-sm ${
                    capacityWarning.includes('túllépi') ? 'text-red-700' : 'text-yellow-700'
                  }`}>
                    {capacityWarning}
                  </div>
                </div>
              </div>
            )}

            {/* Hárem specifikus mezők */}
            {newFunction === 'hárem' && (
              <div className="p-4 bg-pink-50 border border-pink-200 rounded-lg">
                <h4 className="font-medium text-pink-900 mb-4 flex items-center">
                  <User className="h-4 w-4 mr-2" />
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

            {/* Megjegyzések */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Megjegyzések:
              </label>
              <textarea 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-green-500 focus:border-green-500"
                rows={3}
                placeholder="Opcionális megjegyzés a funkció váltásról..."
              />
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