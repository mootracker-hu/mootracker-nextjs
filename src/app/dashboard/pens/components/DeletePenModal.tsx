// src/components/DeletePenModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { useDeletePen } from '@/hooks/useDeletePen';

interface Pen {
  id: string;
  pen_number: string;
  pen_type: 'outdoor' | 'barn' | 'birthing';
  capacity: number;
  location?: string;
  current_function?: {
    function_type: string;
  };
  animal_count: number;
}

interface DeletePenModalProps {
  pen: Pen | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void; // Refresh callback
}

export default function DeletePenModal({ pen, isOpen, onClose, onSuccess }: DeletePenModalProps) {
  const { deletePen, checkDeletionPossibility, loading } = useDeletePen();
  const [canDelete, setCanDelete] = useState<boolean | null>(null);
  const [blockers, setBlockers] = useState<string[]>([]);
  const [confirmText, setConfirmText] = useState('');
  const [step, setStep] = useState<'check' | 'confirm' | 'deleting'>('check');

  // Reset modal state when opened
  useEffect(() => {
    if (isOpen && pen) {
      setStep('check');
      setCanDelete(null);
      setBlockers([]);
      setConfirmText('');
      checkPenDeletion();
    }
  }, [isOpen, pen]);

  const checkPenDeletion = async () => {
    if (!pen) return;

    console.log('🔍 Karám törlési ellenőrzés:', pen.pen_number);
    
    const result = await checkDeletionPossibility(pen);
    setCanDelete(result.canDelete || false);
    setBlockers(result.blockers || []);
    
    if (result.canDelete) {
      setStep('confirm');
    }
  };

  const handleDelete = async () => {
    if (!pen || confirmText !== pen.pen_number) return;

    setStep('deleting');
    
    const result = await deletePen(pen);
    
    if (result.success) {
      alert(`✅ ${result.message}`);
      onSuccess(); // Refresh the pens list
      onClose();
    } else {
      alert(`❌ ${result.message}`);
      setStep('confirm'); // Back to confirm step
    }
  };

  const handleClose = () => {
    if (step !== 'deleting') {
      onClose();
    }
  };

  if (!isOpen || !pen) {
    return null;
  }

  return (
  <div 
    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    onClick={(e) => {
      e.stopPropagation();
      if (e.target === e.currentTarget) {
        handleClose();
      }
    }}
  >
    <div 
      className="bg-white rounded-lg max-w-md w-full shadow-xl"
      onClick={(e) => e.stopPropagation()}
    >
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <span className="text-2xl mr-3">🗑️</span>
              Karám Törlése
            </h3>
            {step !== 'deleting' && (
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ❌
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          
          {/* Karám információk */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <h4 className="font-medium text-gray-900 mb-2 flex items-center">
              <span className="text-xl mr-2">🏠</span>
              Karám {pen.pen_number}
            </h4>
            <div className="text-sm text-gray-600 space-y-1">
              <div className="flex justify-between">
                <span>📍 Helye:</span>
                <span>{pen.location || 'Nincs megadva'}</span>
              </div>
              <div className="flex justify-between">
                <span>🐄 Állatok:</span>
                <span>{pen.animal_count} / {pen.capacity}</span>
              </div>
              <div className="flex justify-between">
                <span>⚙️ Funkció:</span>
                <span>{pen.current_function?.function_type || 'üres'}</span>
              </div>
            </div>
          </div>

          {/* STEP 1: Ellenőrzés */}
          {step === 'check' && (
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Törlési feltételek ellenőrzése...</p>
            </div>
          )}

          {/* STEP 2: Blokkolók megjelenítése */}
          {step === 'check' && canDelete === false && (
            <div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-red-800 mb-2 flex items-center">
                  <span className="text-xl mr-2">🚫</span>
                  A karám nem törölhető
                </h4>
                <p className="text-sm text-red-700 mb-3">
                  A következő problémákat kell megoldani törlés előtt:
                </p>
                <ul className="text-sm text-red-700 space-y-1">
                  {blockers.map((blocker, index) => (
                    <li key={index} className="flex items-start">
                      <span className="mr-2">•</span>
                      {blocker}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2 flex items-center">
                  <span className="text-xl mr-2">💡</span>
                  Javasolt lépések:
                </h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Helyezd át az állatokat másik karámba</li>
                  <li>• Állítsd a funkciót "üres"-re</li>
                  <li>• Fejezd be a függő karám történeti periódusokat</li>
                </ul>
              </div>
            </div>
          )}

          {/* STEP 3: Megerősítés */}
          {step === 'confirm' && (
            <div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-red-800 mb-2 flex items-center">
                  <span className="text-xl mr-2">⚠️</span>
                  Figyelmeztetés
                </h4>
                <p className="text-sm text-red-700">
                  A karám törlése <strong>véglegesen eltávolítja</strong> a karámot és 
                  az összes kapcsolódó adatot (funkciók, történet). Ez a művelet <strong>nem vonható vissza</strong>!
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Megerősítéshez írd be a karám számát: <strong>{pen.pen_number}</strong>
                </label>
                <input
  type="text"
  value={confirmText}
  onChange={(e) => setConfirmText(e.target.value)}
  onClick={(e) => e.stopPropagation()}
                  placeholder={pen.pen_number}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  disabled={loading}
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-xs text-yellow-700">
                  💡 <strong>Tipp:</strong> Ha meggondolod magad, használd a "Mégse" gombot.
                </p>
              </div>
            </div>
          )}

          {/* STEP 4: Törlés folyamatban */}
          {step === 'deleting' && (
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Karám törlése folyamatban...</p>
              <p className="text-sm text-gray-500 mt-2">Kérjük várj, amíg befejeződik...</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end space-x-3">
          
          {/* Mégse gomb */}
          {step !== 'deleting' && (
            <button
              onClick={handleClose}
              className="bg-white hover:bg-gray-50 text-gray-700 font-medium px-4 py-2 rounded-lg border border-gray-300 transition-colors inline-flex items-center"
            >
              <span className="mr-2">❌</span>
              Mégse
            </button>
          )}

          {/* Újra ellenőrzés gomb */}
          {step === 'check' && canDelete === false && (
            <button
              onClick={checkPenDeletion}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-colors inline-flex items-center disabled:bg-gray-400"
            >
              <span className="mr-2">🔄</span>
              Újra ellenőrzés
            </button>
          )}

          {/* Törlés gomb */}
          {step === 'confirm' && (
            <button
              onClick={handleDelete}
              disabled={loading || confirmText !== pen.pen_number}
              className="bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2 rounded-lg transition-colors inline-flex items-center disabled:bg-gray-400"
            >
              <span className="mr-2">🗑️</span>
              {loading ? 'Törlés...' : 'Karám Törlése'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}