// Várható ellések típus definíciók
export interface ExpectedBirth {
  enar: string;
  name: string | null;
  kategoria: string;
  expected_birth_date: string;
  pregnancy_status: string;
  pen_number: string | null;
  pen_type: string | null;
  days_remaining: number;
  alert_level: 'overdue' | 'critical' | 'upcoming' | 'distant';
}

export interface PenBirths {
  pen_id: string;
  pen_number: string;
  pen_type: string;
  capacity: number;
  pregnant_count: number;
  earliest_birth: string;
  animals: ExpectedBirth[];
}

export const getAlertLevel = (daysRemaining: number): ExpectedBirth['alert_level'] => {
  if (daysRemaining < 0) return 'overdue';
  if (daysRemaining <= 7) return 'critical';
  if (daysRemaining <= 30) return 'upcoming';
  return 'distant';
};

export const getAlertColor = (alertLevel: ExpectedBirth['alert_level']): string => {
  switch (alertLevel) {
    case 'overdue': return 'bg-red-50 border-red-500 text-red-800';
    case 'critical': return 'bg-orange-50 border-orange-500 text-orange-800'; 
    case 'upcoming': return 'bg-yellow-50 border-yellow-500 text-yellow-800';
    case 'distant': return 'bg-green-50 border-green-600 text-green-800';
    default: return 'bg-gray-50 border-gray-300 text-gray-800';
  }
};

export const getAlertIcon = (alertLevel: ExpectedBirth['alert_level']): string => {
  switch (alertLevel) {
    case 'overdue': return '🚨'; // Sürgős riasztás
    case 'critical': return '⚠️'; // Figyelmeztetés  
    case 'upcoming': return '📅'; // Közelgő dátum
    case 'distant': return '🐄'; // Vemhes tehén
    default: return '🐮'; // Általános tehén
  }
};