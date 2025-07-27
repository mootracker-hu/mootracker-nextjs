// src/components/PenHistoryCard.tsx
'use client';

import { useState } from 'react';
import { displayEnar } from '@/constants/enar-formatter';

interface Animal {
  id: number;
  enar: string;
  kategoria: string;
  ivar: string;
}

interface PenHistoryPeriod {
  id: string;
  pen_id: string;
  function_type: string;
  start_date: string;
  end_date: string | null;
  animals_snapshot: Animal[];
  metadata: any;
  notes?: string;
  historical: boolean;
  created_at: string;
}

interface PenHistoryCardProps {
  period: PenHistoryPeriod;
  onClick: () => void;
}

export default function PenHistoryCard({ period, onClick }: PenHistoryCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Funkció emoji és szín
  const getFunctionDisplay = (functionType: string) => {
    const displays = {
      'bölcsi': { emoji: '🐮', name: 'BÖLCSI PERIÓDUS', color: 'bg-blue-100 text-blue-800 border-blue-200' },
      'óvi': { emoji: '🐄', name: 'ÓVI PERIÓDUS', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
      'hárem': { emoji: '💕', name: 'HÁREM PERIÓDUS', color: 'bg-pink-100 text-pink-800 border-pink-200' },
      'vemhes': { emoji: '🐄💖', name: 'VEMHES PERIÓDUS', color: 'bg-rose-100 text-rose-800 border-rose-200' },
      'ellető': { emoji: '🐄🍼', name: 'ELLETŐ PERIÓDUS', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
      'tehén': { emoji: '🐄🍼', name: 'TEHÉN PERIÓDUS', color: 'bg-green-100 text-green-800 border-green-200' },
      'hízóbika': { emoji: '🐂', name: 'HÍZÓBIKA PERIÓDUS', color: 'bg-orange-100 text-orange-800 border-orange-200' },
      'üres': { emoji: '⭕', name: 'ÜRES PERIÓDUS', color: 'bg-gray-100 text-gray-800 border-gray-200' },
      'átmeneti': { emoji: '🔄', name: 'ÁTMENETI PERIÓDUS', color: 'bg-teal-100 text-teal-800 border-teal-200' },
      'kórház': { emoji: '🏥', name: 'KÓRHÁZ PERIÓDUS', color: 'bg-red-100 text-red-800 border-red-200' },
      'karantén': { emoji: '🔒', name: 'KARANTÉN PERIÓDUS', color: 'bg-amber-100 text-amber-800 border-amber-200' },
      'selejt': { emoji: '📦', name: 'SELEJT PERIÓDUS', color: 'bg-slate-100 text-slate-800 border-slate-200' }
    };

    return displays[functionType as keyof typeof displays] || {
      emoji: '❓',
      name: functionType.toUpperCase() + ' PERIÓDUS',
      color: 'bg-gray-100 text-gray-800 border-gray-200'
    };
  };

  // Időszak számítása
  const calculateDuration = () => {
    const start = new Date(period.start_date);
    const end = period.end_date ? new Date(period.end_date) : new Date();
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Állatok összesítése
  const getAnimalSummary = () => {
    const animals = period.animals_snapshot || [];
    const total = animals.length;

    if (period.function_type === 'hárem') {
      const bulls = animals.filter(a => a.kategoria === 'tenyészbika');
      const females = animals.filter(a => a.kategoria !== 'tenyészbika');
      return {
        total,
        bulls: bulls.length,
        females: females.length,
        summary: `${females.length} nőivar + ${bulls.length} hímivar`
      };
    }

    return {
      total,
      summary: `${total} állat`
    };
  };

  // Speciális információk - ✅ JAVÍTOTT VEMHES RÉSSZEL
  const getSpecialInfo = () => {
    const { metadata } = period;

    if (period.function_type === 'hárem') {
      // Tenyészbikák nevei FORMÁZOTT ENAR-ral
      if (metadata?.bulls && Array.isArray(metadata.bulls)) {
        const bullNames = metadata.bulls.map((bull: any) => {
          const formattedEnar = displayEnar(bull.enar);
          const name = bull.name || 'Névtelen';
          return `${formattedEnar} (${name})`;
        }).join(', ');
        return `🐂 Tenyészbikák: ${bullNames}`;
      } else if (metadata?.tenyeszbika_name) {
        return `🐂 Tenyészbika: ${metadata.tenyeszbika_name}`;
      }

      // Fogamzási ráta
      if (metadata?.pregnancy_rate) {
        return `📊 Fogamzási ráta: ${metadata.pregnancy_rate}%`;
      }
    }

    // ✅ JAVÍTOTT VEMHES RÉSZ - KATEGÓRIA BONTÁSSAL
    if (period.function_type === 'vemhes') {
      const animals = period.animals_snapshot || [];
      if (animals.length === 0) {
        return `📊 Nincs állat adat`;
      }

      // Kategória statisztika
      const categoryStats: Record<string, number> = {};
      animals.forEach(animal => {
        categoryStats[animal.kategoria] = (categoryStats[animal.kategoria] || 0) + 1;
      });

      // Kategóriák megjelenítése
      const categoryDisplay = Object.entries(categoryStats)
        .map(([kategoria, count]) => `${kategoria}: ${count} db`)
        .join(', ');

      return ` 🐮 ${categoryDisplay}`;
    }

    if (period.function_type === 'bölcsi') {
      return `🐮 Borjú nevelés`;
    }

    if (period.function_type === 'óvi') {
      return `🐄 Üsző fejlesztés`;
    }

    return null;
  };

  const display = getFunctionDisplay(period.function_type);
  const duration = calculateDuration();
  const animalSummary = getAnimalSummary();
  const specialInfo = getSpecialInfo();

  return (
    <div
      className={`
        bg-white rounded-lg border-2 p-4 cursor-pointer transition-all duration-200
        ${isHovered ? 'shadow-lg scale-105 border-green-300' : 'shadow-sm hover:shadow-md border-gray-200'}
        ${period.historical ? 'border-l-4 border-l-blue-400' : ''}
      `}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <span className="text-2xl mr-2">{display.emoji}</span>
          <h3 className="font-bold text-gray-800 text-sm">{display.name}</h3>
        </div>
        {period.historical && (
          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
            📚 Manual
          </span>
        )}
      </div>

      {/* Időszak */}
      <div className="mb-3">
        <div className="flex items-center text-sm text-gray-600 mb-1">
          <span className="mr-1">📅</span>
          <span>
            {new Date(period.start_date).toLocaleDateString('hu-HU')} - {' '}
            {period.end_date
              ? new Date(period.end_date).toLocaleDateString('hu-HU')
              : 'folyamatban'
            }
          </span>
        </div>
        <div className="text-xs text-gray-500">
          ({duration} nap{!period.end_date ? ' eddig' : ''})
        </div>
      </div>

      {/* Állatok */}
      <div className="mb-3">
        <div className="flex items-center text-sm text-gray-700 mb-1">
          <span className="mr-1">🐄</span>
          <span className="font-medium">{animalSummary.summary}</span>
        </div>
      </div>

      {/* Speciális info */}
      {specialInfo && (
        <div className="mb-3">
          <div className="text-sm text-gray-600">
            {specialInfo}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500 border-t pt-2">
        <span>
          {period.end_date ? '✅ Lezárva' : '🔄 Folyamatban'}
        </span>
        <span
          className="bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200 transition-colors"
        >
          📋 Részletek megtekintése
        </span>
      </div>
    </div>
  );
}