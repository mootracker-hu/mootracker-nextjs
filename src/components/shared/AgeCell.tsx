// ==================================================
// 📁 src/components/shared/AgeCell.tsx
// 🎯 Egységes életkor megjelenítő komponens - duplikáció csökkentés
// ==================================================
import React from 'react';

interface AgeCellProps {
    birthDate?: string;
    className?: string;
}

export const AgeCell: React.FC<AgeCellProps> = ({ birthDate, className = '' }) => {
    if (!birthDate) {
        return <span className="text-gray-400">-</span>;
    }

    try {
        const birth = new Date(birthDate);
        const today = new Date();
        
        // Validálás: helyes dátum?
        if (isNaN(birth.getTime())) {
            return <span className="text-gray-400">-</span>;
        }

        // ✅ EREDETI LOGIKA MEGTARTVA: 30.44 napos hónapok
        const ageInMonths = Math.floor((today.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
        
        // Negatív kor esetén (jövőbeli dátum)
        if (ageInMonths < 0) {
            return <span className="text-gray-400">-</span>;
        }

        // 12 hónapnál fiatalabb borjak - kék színezés
        if (ageInMonths < 12) {
            return (
                <div className={`font-medium text-blue-600 ${className}`}>
                    {ageInMonths} hónap
                </div>
            );
        }

        // 12+ hónapos állatok - év és hónap formátum
        const years = Math.floor(ageInMonths / 12);
        const remainingMonths = ageInMonths % 12;
        
        if (remainingMonths === 0) {
            return (
                <div className={`font-medium text-gray-700 ${className}`}>
                    {years} év
                </div>
            );
        }

        return (
            <div className={`font-medium text-gray-700 ${className}`}>
                {years} év {remainingMonths} hónap
            </div>
        );
    } catch (error) {
        return <span className="text-gray-400">-</span>;
    }
};