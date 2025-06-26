import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Calendar, 
  Clock, 
  AlertCircle, 
  FileText,
  TrendingUp,
  Activity
} from 'lucide-react';

interface CurrentStatusTabProps {
  animal: any;
}

const CurrentStatusTab: React.FC<CurrentStatusTabProps> = ({ animal }) => {
  const [loading, setLoading] = useState(false);

  // Jelenlegi karám lekérése az animal adatból
  const getCurrentPen = () => {
    const assignment = animal?.animal_pen_assignments?.find(
      (a: any) => a.removed_at === null
    );
    return assignment?.pens;
  };

  // Karamban töltött idő számítása
  const getTimeInPen = () => {
    const assignment = animal?.animal_pen_assignments?.find(
      (a: any) => a.removed_at === null
    );
    
    if (!assignment?.assigned_at) return 'Nincs adat';
    
    const assignedDate = new Date(assignment.assigned_at);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - assignedDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Ma';
    if (diffDays === 1) return '1 nap';
    return `${diffDays} nap`;
  };

  // Életkor számítása
  const getAge = () => {
    if (!animal?.szuletesi_datum) return 'Nincs adat';
    
    const birth = new Date(animal.szuletesi_datum);
    const today = new Date();
    const ageInMs = today.getTime() - birth.getTime();
    const ageInDays = Math.floor(ageInMs / (1000 * 60 * 60 * 24));
    const ageInMonths = Math.floor(ageInDays / 30);
    
    if (ageInMonths < 12) {
      return `${ageInMonths} hónap`;
    } else {
      const years = Math.floor(ageInMonths / 12);
      const months = ageInMonths % 12;
      return `${years} év ${months > 0 ? months + ' hó' : ''}`;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('hu-HU');
  };

  const currentPen = getCurrentPen();
  const timeInPen = getTimeInPen();
  const age = getAge();

  return (
    <div className="space-y-6">
      {/* Jelenlegi állapot összefoglaló */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Jelenlegi karám */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <MapPin className="h-5 w-5 text-blue-600 mr-2" />
            <div>
              <p className="text-sm font-medium text-blue-900">Jelenlegi karám</p>
              <p className="text-lg font-bold text-blue-700">
                {currentPen?.pen_number || 'Nincs karám'}
              </p>
              <p className="text-xs text-blue-600">{currentPen?.location || ''}</p>
            </div>
          </div>
        </div>

        {/* Karamban töltött idő */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <Clock className="h-5 w-5 text-green-600 mr-2" />
            <div>
              <p className="text-sm font-medium text-green-900">Karamban</p>
              <p className="text-lg font-bold text-green-700">{timeInPen}</p>
              <p className="text-xs text-green-600">
                {currentPen ? formatDate(animal?.animal_pen_assignments?.find((a: any) => a.removed_at === null)?.assigned_at) + ' óta' : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Kategória */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center">
            <Activity className="h-5 w-5 text-purple-600 mr-2" />
            <div>
              <p className="text-sm font-medium text-purple-900">Kategória</p>
              <p className="text-lg font-bold text-purple-700">{animal?.kategoria || 'Nincs adat'}</p>
              <p className="text-xs text-purple-600">Aktuális besorolás</p>
            </div>
          </div>
        </div>

        {/* Életkor */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center">
            <Calendar className="h-5 w-5 text-orange-600 mr-2" />
            <div>
              <p className="text-sm font-medium text-orange-900">Életkor</p>
              <p className="text-lg font-bold text-orange-700">{age}</p>
              <p className="text-xs text-orange-600">
                {animal?.szuletesi_datum ? formatDate(animal.szuletesi_datum) : ''}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Alapinformációk */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <FileText className="h-5 w-5 mr-2 text-gray-600" />
          Részletes információk
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">ENAR szám</label>
              <p className="text-sm text-gray-900 font-mono">{animal?.enar}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Ivar</label>
              <p className="text-sm text-gray-900">{animal?.ivar}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Státusz</label>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                animal?.statusz === 'aktív' ? 'bg-green-100 text-green-800' :
                animal?.statusz === 'eladott' ? 'bg-blue-100 text-blue-800' :
                animal?.statusz === 'elhullott' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {animal?.statusz}
              </span>
            </div>
          </div>
          
          <div className="space-y-4">
            {animal?.anya_enar && (
              <div>
                <label className="block text-sm font-medium text-gray-700">🐄 Anya ENAR</label>
                <p className="text-sm text-gray-900 font-mono">{animal.anya_enar}</p>
              </div>
            )}
            
            {animal?.apa_enar && (
              <div>
                <label className="block text-sm font-medium text-gray-700">🐂 Apa ENAR</label>
                <p className="text-sm text-gray-900 font-mono">{animal.apa_enar}</p>
              </div>
            )}
            
            {animal?.birth_location && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Származás</label>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  animal.birth_location === 'nálunk' ? 'bg-green-100 text-green-800' :
                  animal.birth_location === 'vásárolt' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {animal.birth_location === 'nálunk' ? '🏠 Nálunk született' :
                   animal.birth_location === 'vásárolt' ? '🛒 Vásárolt' : 
                   '❓ Ismeretlen'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Megjegyzések */}
      {animal?.notes && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FileText className="h-5 w-5 mr-2 text-yellow-600" />
            Megjegyzések
          </h3>
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-900">{animal.notes}</p>
          </div>
        </div>
      )}

      {/* Karámtörténet */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
          Karámtörténet
        </h3>
        
        <div className="space-y-4">
          {animal?.animal_pen_assignments && animal.animal_pen_assignments.length > 0 ? (
            animal.animal_pen_assignments
              .sort((a: any, b: any) => new Date(b.assigned_at).getTime() - new Date(a.assigned_at).getTime())
              .map((assignment: any, index: number) => (
                <div key={assignment.id || `assignment-${index}`} className="relative">
                  {/* Timeline vonal */}
                  {index < animal.animal_pen_assignments.length - 1 && (
                    <div className="absolute left-6 top-12 w-0.5 h-full bg-gray-200"></div>
                  )}
                  
                  <div className="flex items-start space-x-4">
                    {/* Timeline pont */}
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        {assignment.removed_at ? '🔄' : '📍'}
                      </div>
                    </div>

                    {/* Tartalom */}
                    <div className="flex-grow pb-4">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-gray-900">
                          📍 {assignment.pens?.pen_number || 'Ismeretlen karám'}
                          {assignment.removed_at ? ' (elhagyta)' : ' (jelenlegi)'}
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          assignment.removed_at ? 'bg-gray-100 text-gray-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {assignment.removed_at ? 'Korábbi' : 'Aktív'}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-1">
                        <Calendar className="h-4 w-4 inline mr-1" />
                        {formatDate(assignment.assigned_at)}
                        {assignment.removed_at && (
                          <span> - {formatDate(assignment.removed_at)}</span>
                        )}
                      </div>
                      
                      {assignment.assignment_reason && (
                        <div className="text-sm text-gray-700">
                          <span className="font-medium">Ok:</span> {assignment.assignment_reason}
                        </div>
                      )}
                      
                      {assignment.notes && (
                        <div className="text-sm text-gray-700 flex items-start mt-1">
                          <FileText className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
                          {assignment.notes}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <p>Nincs rögzített karámtörténet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CurrentStatusTab;