// src/app/dashboard/pens/components/pen-stats.tsx
'use client';

import { Home, Users, TrendingUp, AlertTriangle } from 'lucide-react';

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

interface PenStatsProps {
  pens: Pen[];
}

export default function PenStats({ pens }: PenStatsProps) {
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

  const getFunctionColor = (functionType: string): string => {
    const colorMap: { [key: string]: string } = {
      'bölcsi': 'bg-blue-100 text-blue-800 border-blue-200',
      'óvi': 'bg-green-100 text-green-800 border-green-200',
      'hárem': 'bg-pink-100 text-pink-800 border-pink-200',
      'vemhes': 'bg-purple-100 text-purple-800 border-purple-200',
      'hízóbika': 'bg-orange-100 text-orange-800 border-orange-200',
      'ellető': 'bg-red-100 text-red-800 border-red-200',
      'tehén': 'bg-green-100 text-green-800 border-green-200',
      'üres': 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colorMap[functionType] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // Statisztikák számítása
  const totalCapacity = pens.reduce((sum, pen) => sum + pen.capacity, 0);
  const totalAnimals = pens.reduce((sum, pen) => sum + pen.animal_count, 0);
  const utilizationPercentage = totalCapacity > 0 ? (totalAnimals / totalCapacity) * 100 : 0;

  // Funkció típusok statisztikái
  const functionStats = pens.reduce((stats, pen) => {
    const funcType = pen.current_function?.function_type || 'üres';
    stats[funcType] = (stats[funcType] || 0) + 1;
    return stats;
  }, {} as { [key: string]: number });

  // Riasztások számítása
  const alerts = pens.filter(pen => 
    pen.animal_count > pen.capacity || // Túlzsúfolt
    (pen.animal_count / pen.capacity > 0.9) // Majdnem tele
  ).length;

  return (
    <div className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Fő statisztikák */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center">
              <Home className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-600">Összes Karám</p>
                <p className="text-2xl font-bold text-blue-900">{pens.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-green-600">Állatok</p>
                <p className="text-2xl font-bold text-green-900">{totalAnimals} / {totalCapacity}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-yellow-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-yellow-600">Kihasználtság</p>
                <p className="text-2xl font-bold text-yellow-900">{utilizationPercentage.toFixed(1)}%</p>
              </div>
            </div>
          </div>
          
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-red-600">Riasztások</p>
                <p className="text-2xl font-bold text-red-900">{alerts}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Funkció statisztikák */}
        <div className="flex flex-wrap gap-2">
          {Object.entries(functionStats)
            .sort(([,a], [,b]) => b - a) // Csökkenő sorrendben
            .map(([funcType, count]) => (
            <div 
              key={funcType} 
              className={`px-3 py-1 rounded-full text-sm font-medium border ${getFunctionColor(funcType)}`}
            >
              {getFunctionEmoji(funcType)} {funcType}: {count}
            </div>
          ))}
        </div>

        {/* Extra metrikák */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <span className="text-gray-500">Átlag kapacitás/karám:</span>
            <span className="ml-2 font-medium">{(totalCapacity / pens.length).toFixed(1)} állat</span>
          </div>
          <div className="text-center">
            <span className="text-gray-500">Üres karamok:</span>
            <span className="ml-2 font-medium">{pens.filter(p => p.animal_count === 0).length} db</span>
          </div>
          <div className="text-center">
            <span className="text-gray-500">Tele karamok:</span>
            <span className="ml-2 font-medium">{pens.filter(p => p.animal_count >= p.capacity).length} db</span>
          </div>
        </div>
      </div>
    </div>
  );
}