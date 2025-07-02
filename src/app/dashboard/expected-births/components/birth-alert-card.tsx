'use client';

import { ExpectedBirth, getAlertColor, getAlertIcon } from '@/types/expected-births-types';

interface BirthAlertCardProps {
  birth: ExpectedBirth;
  onClick?: () => void;
}

const BirthAlertCard: React.FC<BirthAlertCardProps> = ({ birth, onClick }) => {
  const alertColor = getAlertColor(birth.alert_level);
  const alertIcon = getAlertIcon(birth.alert_level);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('hu-HU');
  };

  const getDaysText = (days: number) => {
    if (days < 0) {
      return `${Math.abs(days)} nappal túllépte!`;
    } else if (days === 0) {
      return 'MA esedékes!';
    } else if (days === 1) {
      return '1 nap múlva';
    } else {
      return `${days} nap múlva`;
    }
  };

  return (
    <div 
      className={`p-4 rounded-lg border-2 cursor-pointer hover:shadow-md transition-all ${alertColor} ${
        onClick ? 'hover:scale-105' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{alertIcon}</span>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-medium text-lg">{birth.enar}</span>
              {birth.name && (
                <span className="text-sm font-medium">- {birth.name}</span>
              )}
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <span className="px-2 py-1 bg-white rounded-full text-xs font-medium">
                {birth.kategoria}
              </span>
              {birth.pen_number && (
                <span className="text-xs">
                  🏠 Karám: {birth.pen_number}
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="text-right">
          <div className="font-bold text-lg">
            📅 {formatDate(birth.expected_birth_date)}
          </div>
          <div className="text-sm font-medium">
            {getDaysText(birth.days_remaining)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BirthAlertCard;