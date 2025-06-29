import React from 'react';

// Riasztás típus definíciója (ez megegyezik a hook-ban használttal)
interface PenAlert {
  id: string;
  penId: string;
  penType: string;
  alertType: 'calf_15days' | 'calf_6months' | 'age_limit' | 'vaccination' | 'cleaning';
  title: string;
  message: string;
  priority: 1 | 2 | 3 | 4;
  dueDate: string;
  animalCount: number;
}

// Widget props
interface PenAlertsWidgetProps {
   penId: string;
  alerts: PenAlert[];
  className?: string;
}

export function PenAlertsWidget({ penId, alerts, className = '' }: PenAlertsWidgetProps) {
  // Csak az adott karámhoz tartozó riasztások
  const penAlerts = alerts; 

  // Ha nincsenek riasztások, ne jelenítsen meg semmit
  if (penAlerts.length === 0) {
    return null;
  }

  // Prioritás alapján színek és emoji ikonok - DESIGN SYSTEM COLORS
  const getPriorityStyle = (priority: number) => {
    switch (priority) {
      case 4: // Kritikus - piros (design system red-500)
        return {
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-800',
          iconColor: 'text-red-600',
          emoji: '🚨' // Kritikus riasztás
        };
      case 3: // Magas - narancs (design system orange-500)
        return {
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          textColor: 'text-orange-800',
          iconColor: 'text-orange-600',
          emoji: '⚠️' // Figyelmeztetés
        };
      case 2: // Közepes - sárga 
        return {
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          textColor: 'text-yellow-800',
          iconColor: 'text-yellow-600',
          emoji: '⏰' // Időzített feladat
        };
      case 1: // Alacsony - teal (design system teal-500)
        return {
          bgColor: 'bg-teal-50',
          borderColor: 'border-teal-200',
          textColor: 'text-teal-800',
          iconColor: 'text-teal-600',
          emoji: '💡' // Info/javaslat
        };
      default:
        return {
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          textColor: 'text-gray-800',
          iconColor: 'text-gray-600',
          emoji: '❓' // Ismeretlen
        };
    }
  };

  // Riasztás típus alapján specifikus emoji ikonok
  const getAlertTypeEmoji = (alertType: string) => {
    switch (alertType) {
      case 'calf_15days':
        return '🍼'; // 15 napos borjú kezelések
      case 'calf_6months':
        return '🐄'; // 6 hónapos leválasztás
      case 'age_limit':
        return '👥'; // Korhatár túllépés
      case 'vaccination':
        return '💉'; // Vakcinálás
      case 'cleaning':
        return '🧹'; // Takarítás
      default:
        return '📋'; // Általános feladat
    }
  };

  const getPriorityValue = (priority: any) => {
    if (typeof priority === 'string') {
      const order: { [key: string]: number } = { 'surgos': 5, 'kritikus': 4, 'magas': 3, 'kozepes': 2, 'alacsony': 1 };
      return order[priority] || 0;
    }
    return priority as number || 0;
  };

  // Legmagasabb prioritású riasztás kiválasztása megjelenítéshez
  const topAlert = penAlerts.reduce((prev, current) => {
    return getPriorityValue(current.priority) > getPriorityValue(prev.priority) ? current : prev;
  });

  const style = getPriorityStyle(topAlert.priority);
  const typeEmoji = getAlertTypeEmoji(topAlert.alertType);

  return (
    <div className={`${style.bgColor} ${style.borderColor} border rounded-lg p-4 mt-3 ${className}`}>
      <div className="flex items-start gap-3">
        {/* Prioritás emoji ikon */}
        <div className="flex-shrink-0">
          <span className="text-lg">{style.emoji}</span>
        </div>
        
        {/* Tartalom */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm">{typeEmoji}</span>
            <p className={`text-sm font-medium ${style.textColor}`}>
              {topAlert.title}
            </p>
            {penAlerts.length > 1 && (
              <span className={`text-xs px-2 py-1 rounded-full bg-white ${style.textColor} border font-medium`}>
                +{penAlerts.length - 1} további
              </span>
            )}
          </div>
          
          <p className={`text-sm ${style.textColor} opacity-90 mb-2`}>
            {topAlert.message}
          </p>
          
          {/* Ha több riasztás van, mutassuk az összeset */}
          {penAlerts.length > 1 && (
            <div className="mt-3 space-y-2">
              {penAlerts.slice(1).map((alert, index) => (
                <div key={alert.id} className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    (alert.priority === 4 || (alert.priority as any) === 'kritikus' || (alert.priority as any) === 'surgos') ? 'bg-red-500' :
                    (alert.priority === 3 || (alert.priority as any) === 'magas') ? 'bg-orange-500' :
                    (alert.priority === 2 || (alert.priority as any) === 'kozepes') ? 'bg-yellow-500' : 'bg-teal-500'
                  }`} />
                  <span className="text-xs mr-2">{getAlertTypeEmoji(alert.alertType)}</span>
                  <p className={`text-sm ${style.textColor} opacity-75`}>
                    {alert.message}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Riasztások száma és információk */}
      {penAlerts.length > 0 && (
        <div className="flex justify-between items-center mt-3 pt-3 border-t border-opacity-30">
          <span className={`text-sm ${style.textColor} opacity-75 font-medium`}>
            {topAlert.animalCount > 0 && (
              <span className="inline-flex items-center gap-1">
                <span>🐄</span>
                {topAlert.animalCount} állat érintett
              </span>
            )}
          </span>
          <span className={`text-sm font-medium ${style.textColor} inline-flex items-center gap-1`}>
            <span>🎯</span>
            Prioritás: {topAlert.priority}/4
          </span>
        </div>
      )}
    </div>
  );
}

// Riasztások összesítő widget (dashboard tetejére) - DESIGN SYSTEM MODERNIZED
interface AlertsSummaryProps {
  alerts: PenAlert[];
  className?: string;
}

// AlertsSummary - JAVÍTOTT DESIGN és színek - DESIGN SYSTEM COMPLIANT
export function AlertsSummary({ alerts, className = '' }: AlertsSummaryProps) {
  const criticalCount = alerts.filter(alert => 
    alert.priority === 4 || (alert.priority as any) === 'kritikus' || (alert.priority as any) === 'surgos'
  ).length;

  const highCount = alerts.filter(alert => 
    alert.priority === 3 || (alert.priority as any) === 'magas'
  ).length;

  const mediumCount = alerts.filter(alert => 
    alert.priority === 2 || (alert.priority as any) === 'kozepes'
  ).length;

  const lowCount = alerts.filter(alert => 
    alert.priority === 1 || (alert.priority as any) === 'alacsony'
  ).length;

  if (alerts.length === 0) {
    return (
      <div className={`bg-green-50 border border-green-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">✅</span>
          <div>
            <h3 className="text-sm font-medium text-green-800">Minden rendben!</h3>
            <p className="text-sm text-green-700">Jelenleg nincsenek aktív riasztások.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2">
          <span className="text-xl">🚨</span>
          Aktív Riasztások
        </h3>
        <span className="text-2xl font-bold text-gray-900 bg-gray-100 px-3 py-1 rounded-lg">
          {alerts.length}
        </span>
      </div>
      
      {/* JAVÍTOTT DESIGN - Körök a design system szerint */}
      <div className="flex items-center justify-center gap-6">
        
        {/* Összes - PRIMARY ZÖLD (design system) */}
        <div className="text-center">
          <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-2">
            <div className="text-center text-white">
              <div className="text-lg font-bold">{alerts.length}</div>
              <div className="text-xs">Összes</div>
            </div>
          </div>
        </div>

        {/* Aktív - LIGHT GREEN (design system) */}
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2 border-2 border-green-200">
            <div className="text-center text-green-800">
              <div className="text-lg font-bold">{alerts.length}</div>
              <div className="text-xs">Aktív</div>
            </div>
          </div>
        </div>
        
        {/* Kritikus - DANGER RED (design system) */}
        <div className="text-center">
          <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-2">
            <div className="text-center text-white">
              <div className="text-lg font-bold">{criticalCount}</div>
              <div className="text-xs">Kritikus</div>
            </div>
          </div>
        </div>
        
        {/* Magas - WARNING ORANGE (design system) */}
        <div className="text-center">
          <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-2">
            <div className="text-center text-white">
              <div className="text-lg font-bold">{highCount}</div>
              <div className="text-xs">Magas</div>
            </div>
          </div>
        </div>
        
        {/* Lejárt/Alacsony - INFO TEAL (design system) */}
        <div className="text-center">
          <div className="w-16 h-16 bg-teal-500 rounded-full flex items-center justify-center mx-auto mb-2">
            <div className="text-center text-white">
              <div className="text-lg font-bold">{lowCount}</div>
              <div className="text-xs">Lejárt</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}