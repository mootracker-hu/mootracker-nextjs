import React from 'react';

/**
 * WeightCell - Shared komponens a súlymérés megjelenítésére
 * 
 * Használati helyek:
 * - pen-specific-animal-table.tsx (9 táblázat típus)
 * - animals/page.tsx (állatok lista)
 * - calves/page.tsx (borjak lista)
 * 
 * Előnyök:
 * - Egységes megjelenés minden táblázatban
 * - Centralizált logika a súly megjelenítéshez
 * - Egyszerű karbantartás
 */

interface WeightCellProps {
  /** Az állat jelenlegi súlya kg-ban */
  weight?: number | null;
  /** Az utolsó mérés dátuma ISO string formátumban */
  lastMeasured?: string | null;
  /** Extra CSS osztályok a külső div-hez */
  className?: string;
  /** Kompakt megjelenítés kisebb táblázatokhoz */
  compact?: boolean;
}

export const WeightCell: React.FC<WeightCellProps> = ({ 
  weight, 
  lastMeasured, 
  className = "",
  compact = false 
}) => {
  // Ha nincs súlymérés
  if (!weight) {
    return (
      <div className={`text-orange-600 font-medium ${className}`}>
        {compact ? '❌' : 'Nincs mérés'}
      </div>
    );
  }

  // Ha van súlymérés
  return (
    <div className={className}>
      <div className="font-medium text-green-600">
        {weight} kg
      </div>
      {!compact && (
        <div className="text-xs text-gray-500">
          {lastMeasured ? 
            new Date(lastMeasured).toLocaleDateString('hu-HU') : 
            'Dátum ismeretlen'
          }
        </div>
      )}
    </div>
  );
};

/**
 * Használati példák:
 * 
 * // Alap használat
 * <WeightCell 
 *   weight={animal.current_weight} 
 *   lastMeasured={animal.last_weight_measured_at} 
 * />
 * 
 * // Kompakt verzió
 * <WeightCell 
 *   weight={animal.current_weight} 
 *   lastMeasured={animal.last_weight_measured_at}
 *   compact={true}
 * />
 * 
 * // Extra CSS osztályokkal
 * <WeightCell 
 *   weight={animal.current_weight} 
 *   lastMeasured={animal.last_weight_measured_at}
 *   className="text-center"
 * />
 */