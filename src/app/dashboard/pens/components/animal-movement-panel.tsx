// src/app/dashboard/pens/components/animal-movement-panel.tsx
'use client';

import { useState } from 'react';
import { X, Move, AlertTriangle, CheckCircle } from 'lucide-react';

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

interface AnimalMovementPanelProps {
  isOpen: boolean;
  onClose: () => void;
  selectedAnimals: number[];
  animals: Animal[];
  availablePens: Pen[];
  currentPenId: string;
  onMove: (targetPenId: string, reason: string, notes: string) => void;
}

export default function AnimalMovementPanel({
  isOpen,
  onClose,
  selectedAnimals,
  animals,
  availablePens,
  currentPenId,
  onMove
}: AnimalMovementPanelProps) {
  const [targetPenId, setTargetPenId] = useState('');
  const [movementReason, setMovementReason] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  // Kiválasztott állatok adatai
  const selectedAnimalData = animals.filter(animal => selectedAnimals.includes(animal.id));

  // Elérhető karamok (nem a jelenlegi)
  const filteredPens = availablePens.filter(pen => pen.id !== currentPenId);

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

    setLoading(true);
    try {
      await onMove(targetPenId, movementReason, notes);
      // Reset form
      setTargetPenId('');
      setMovementReason('');
      setNotes('');
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
            <Move className="h-6 w-6 text-blue-600 mr-3" />
            <h3 className="text-lg font-medium text-gray-900">
              Állatok Mozgatása ({selectedAnimals.length} állat)
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
          {/* Kiválasztott állatok összesítése */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-2">Mozgatandó állatok:</h4>
            <div className="flex flex-wrap gap-2">
              {selectedAnimalData.slice(0, 10).map(animal => (
                <span key={animal.id} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {animal.enar}
                </span>
              ))}
              {selectedAnimalData.length > 10 && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  +{selectedAnimalData.length - 10} további
                </span>
              )}
            </div>
          </div>

          <div className="space-y-6">
            {/* Célkarám választás */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Célkarám: *
              </label>
              <select 
                value={targetPenId}
                onChange={(e) => setTargetPenId(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-green-500 focus:border-green-500"
                required
              >
                <option value="">Válassz karamot...</option>
                {filteredPens.map(pen => (
                  <option key={pen.id} value={pen.id}>
                    {getFunctionEmoji(pen.current_function?.function_type || 'üres')} 
                    {pen.pen_number} - {pen.location} 
                    ({pen.animal_count}/{pen.capacity})
                    {pen.current_function?.function_type && ` - ${pen.current_function.function_type}`}
                  </option>
                ))}
              </select>
              
              {/* Kapacitás figyelmeztetés */}
              {targetPenId && (() => {
                const selectedPen = filteredPens.find(p => p.id === targetPenId);
                if (selectedPen) {
                  const warning = getCapacityWarning(selectedPen);
                  if (warning) {
                    return (
                      <div className={`mt-2 p-3 rounded-md flex items-start ${
                        warning.includes('túllépi') ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'
                      }`}>
                        <AlertTriangle className={`h-4 w-4 mt-0.5 mr-2 ${
                          warning.includes('túllépi') ? 'text-red-600' : 'text-yellow-600'
                        }`} />
                        <span className={`text-sm ${
                          warning.includes('túllépi') ? 'text-red-800' : 'text-yellow-800'
                        }`}>
                          {warning}
                        </span>
                      </div>
                    );
                  } else {
                    return (
                      <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md flex items-start">
                        <CheckCircle className="h-4 w-4 mt-0.5 mr-2 text-green-600" />
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mozgatás oka: *
              </label>
              <select 
                value={movementReason}
                onChange={(e) => setMovementReason(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-green-500 focus:border-green-500"
                required
              >
                <option value="">Válassz okot...</option>
                <option value="age_separation">🎂 Életkor alapú válogatás</option>
                <option value="breeding">💕 Tenyésztésbe állítás</option>
                <option value="pregnancy">🤰 Vemhesség</option>
                <option value="birthing">🍼 Ellés előkészítés</option>
                <option value="health">🏥 Egészségügyi ok</option>
                <option value="capacity">📊 Kapacitás optimalizálás</option>
                <option value="function_change">🔄 Karám funkció váltás</option>
                <option value="other">❓ Egyéb</option>
              </select>
            </div>

            {/* Megjegyzés */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Megjegyzés:
              </label>
              <textarea 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-green-500 focus:border-green-500"
                rows={3}
                placeholder="Opcionális megjegyzés a mozgatásról..."
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
            onClick={handleMove}
            disabled={!targetPenId || !movementReason || loading}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Mozgatás...
              </>
            ) : (
              <>
                <Move className="h-4 w-4 mr-2" />
                Mozgatás Végrehajtása
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}