// src/app/dashboard/pens/components/pen-card.tsx
'use client';

import { useRouter } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';
import { PenAlertsWidget } from './pen-alerts-widget';
import { useAlertsNew } from '@/hooks/useAlertsNew';

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
  function_type: 'bölcsi' | 'óvi' | 'hárem' | 'vemhes' | 'hízóbika' | 'ellető' | 'üres' | 'tehén' | 'átmeneti' | 'kórház' | 'karantén' | 'selejt';
  start_date: string;
  metadata: any;
  notes?: string;
}

interface PenCardProps {
  pen: Pen;
}

export default function PenCard({ pen }: PenCardProps) {
  const { alerts, animalPenMap } = useAlertsNew();

// Állat alertek hozzárendelése ehhez a karámhoz
const penSpecificAlerts = alerts.filter(alert => {
  if (!pen?.id) return false;
  
  // 1. Karám-specifikus alertek
  if (alert.pen_id === pen.id) return true;
  
  // 2. Állat alertek - mapping alapján
  if (alert.animal_id && animalPenMap) {
  return animalPenMap[alert.animal_id] === pen.pen_number;
}
  
  return false;
});

console.log('FILTERED ALERTS for pen', pen.id, ':', penSpecificAlerts);

  const router = useRouter();

  // Funkció emoji és színek - ✅ VÉGLEGESEN JAVÍTOTT VERZIÓ
  const getFunctionEmoji = (functionType: string): string => {
    const emojiMap: { [key: string]: string } = {
      'bölcsi': '🐮',
      'óvi': '🐄',
      'hárem': '🐄💕',
      'vemhes': '🐄💖',
      'hízóbika': '🐂',
      'ellető': '🐄🍼',
      'tehén': '🐄🍼',
      'üres': '⭕',
      'átmeneti': '🔄',
      'kórház': '🏥',
      'karantén': '🔒',
      'selejt': '📦'
    };
    return emojiMap[functionType] || '❓';
  };

  // ✅ JAVÍTOTT SZÍNPALETTA - MINDEN FUNKCIÓ EGYSÉGESEN!
  const getFunctionColor = (functionType: string): string => {
    const colorMap = {
      // 🐮 BORJÚ FUNKCIÓK - Kék árnyalatok (fiatal állatok)
      'bölcsi': 'bg-blue-100 text-blue-800 border-blue-200',
      
      // 🐄 FEJLŐDÉSI FUNKCIÓK - Indigo (növekedés) ← JAVÍTVA!  
      'óvi': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      
      // 💕 TENYÉSZTÉSI FUNKCIÓK - Pink/Rose (KÜLÖNBÖZŐEK!)
      'hárem': 'bg-pink-100 text-pink-800 border-pink-200',
      'vemhes': 'bg-rose-100 text-rose-800 border-rose-200', // ← JAVÍTVA!
      
      // 🍼 ANYASÁG FUNKCIÓK - Zöld árnyalatok (természet/élet)
      'ellető': 'bg-emerald-100 text-emerald-800 border-emerald-200',
      'tehén': 'bg-green-100 text-green-800 border-green-200',
      
      // 🐂 HÍZÓBIKA - Narancs (erő/munka)
      'hízóbika': 'bg-orange-100 text-orange-800 border-orange-200',
      
      // ⭕ SPECIÁLIS FUNKCIÓK - ✅ ÖSSZES ÚJ TÍPUS HOZZÁADVA!
      'üres': 'bg-gray-100 text-gray-800 border-gray-200',
      'átmeneti': 'bg-teal-100 text-teal-800 border-teal-200',
      'kórház': 'bg-red-100 text-red-800 border-red-200',
      'karantén': 'bg-amber-100 text-amber-800 border-amber-200', // ← JAVÍTVA!
      'selejt': 'bg-slate-100 text-slate-800 border-slate-200'
    } as const;

    return colorMap[functionType as keyof typeof colorMap] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // Karám típus megjelenítés - EMOJI MODERNIZED
  const getPenTypeDisplay = (penType: string): string => {
    const typeMap: { [key: string]: string } = {
      'outdoor': '🏞️ Külső',
      'barn': '🏠 Istálló',
      'birthing': '🏥 Ellető'
    };
    return typeMap[penType] || penType;
  };

  // Kapacitás színek
  const getCapacityColor = (current: number, capacity: number): string => {
    const percentage = (current / capacity) * 100;
    if (percentage < 60) return 'text-green-600 bg-green-50';
    if (percentage < 80) return 'text-yellow-600 bg-yellow-50';
    if (percentage < 100) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  const handleClick = () => {
    router.push(`/dashboard/pens/${pen.id}`);
  };

  return (
    <div
      onClick={handleClick}
      className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
    >
      {/* Karám Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <span className="text-xl mr-2">🏠</span>
            {pen.pen_number}
          </h3>
          <span className="text-sm text-gray-500">{getPenTypeDisplay(pen.pen_type)}</span>
        </div>
        {pen.location && (
          <div className="flex items-center mt-1 text-sm text-gray-500">
            <span className="text-base mr-1">📍</span>
            {pen.location}
          </div>
        )}
      </div>

      {/* Funkció Information */}
      <div className="p-4">
        {pen.current_function ? (
          <div className={`mb-3 px-3 py-2 rounded-full text-sm font-medium border ${getFunctionColor(pen.current_function.function_type)}`}>
            {getFunctionEmoji(pen.current_function.function_type)} <span className="ml-1">{(pen.current_function.function_type || 'üres').charAt(0).toUpperCase() + (pen.current_function.function_type || 'üres').slice(1)}</span>
          </div>
        ) : (
          <div className="mb-3 px-3 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-600 border border-gray-200">
            ❓ Nincs funkció
          </div>
        )}

        {/* Kapacitás */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600 flex items-center">
            <span className="text-base mr-1">🐄</span>
            Kapacitás:
          </span>
          <span className={`text-sm font-medium px-2 py-1 rounded ${getCapacityColor(pen.animal_count, pen.capacity)}`}>
  {pen.animal_count} / {pen.capacity}
  {(pen as any).temp_calf_count > 0 && (
    <div className="text-xs text-orange-600 mt-1">
      🐮 +{(pen as any).temp_calf_count} temp borjú
    </div>
  )}
</span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
          <div
            className={`h-2 rounded-full transition-all ${pen.animal_count / pen.capacity > 0.8 ? 'bg-red-500' :
                pen.animal_count / pen.capacity > 0.6 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
            style={{ width: `${Math.min((pen.animal_count / pen.capacity) * 100, 100)}%` }}
          />
        </div>

        {/* Hárem extra info */}
        {pen.current_function?.function_type === 'hárem' && pen.current_function.metadata?.tenyeszbika_name && (
          <div className="text-xs text-gray-500 flex items-center">
            <span className="text-sm mr-1">🐂</span>
            Tenyészbika: {pen.current_function.metadata.tenyeszbika_name}
          </div>
        )}

        {/* Notes extra info */}
        {pen.current_function?.notes && (
          <div className="text-xs text-gray-500 mt-1 flex items-center">
            <span className="text-sm mr-1">📝</span>
            {pen.current_function.notes}
          </div>
        )}

        {/* Riasztások */}
        {pen.animal_count > pen.capacity && (
          <div className="mt-2 flex items-center text-red-600 text-xs">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Túlzsúfolt!
          </div>
        )}
        {/* ÚJ specializált riasztások widget */}
        <PenAlertsWidget
  penId={pen.id}
  alerts={penSpecificAlerts as any}
        />
      </div>
    </div>
  );
}