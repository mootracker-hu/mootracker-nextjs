import React from 'react';
import { AGE_CONSTANTS, BusinessHelpers } from '@/constants/business';
import { ColorHelpers } from '@/constants/colors';

interface AgeCellProps {
  birthDate: string;
}

const AgeCell: React.FC<AgeCellProps> = ({ birthDate }) => {
  // ✅ ÚJ: BusinessHelpers és ColorHelpers használata
  const ageInMonths = BusinessHelpers.calculateAgeInMonths(birthDate);
  const colorClass = ColorHelpers.getAgeColor(ageInMonths);
  
  const formatAge = (months: number): string => {
    if (months < 12) {
      return `${months} hó`;
    } else {
      const years = Math.floor(months / 12);
      const remainingMonths = months % 12;
      if (remainingMonths === 0) {
        return `${years} év`;
      } else {
        return `${years}é ${remainingMonths}h`;
      }
    }
  };

  return (
    <span className={`font-medium ${colorClass}`}>
      {formatAge(ageInMonths)}
    </span>
  );
};

export default AgeCell;