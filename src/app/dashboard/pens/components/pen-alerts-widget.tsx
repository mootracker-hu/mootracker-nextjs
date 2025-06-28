import React from 'react';
import { AlertTriangle, Clock, CheckCircle2, AlertCircle, Baby, Users, Heart, Activity } from 'lucide-react';

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
  const penAlerts = alerts.filter(alert => alert.penId === penId);

  // Ha nincsenek riasztások, ne jelenítsen meg semmit
  if (penAlerts.length === 0) {
    return null;
  }

  // Prioritás alapján színek és ikonok
  const getPriorityStyle = (priority: number) => {
    switch (priority) {
      case 4: // Kritikus - piros
        return {
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-800',
          iconColor: 'text-red-600',
          icon: AlertTriangle
        };
      case 3: // Magas - narancs
        return {
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          textColor: 'text-orange-800',
          iconColor: 'text-orange-600',
          icon: AlertCircle
        };
      case 2: // Közepes - sárga
        return {
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          textColor: 'text-yellow-800',
          iconColor: 'text-yellow-600',
          icon: Clock
        };
      case 1: // Alacsony - kék
        return {
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-800',
          iconColor: 'text-blue-600',
          icon: CheckCircle2
        };
      default:
        return {
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          textColor: 'text-gray-800',
          iconColor: 'text-gray-600',
          icon: AlertCircle
        };
    }
  };

  // Riasztás típus alapján specifikus ikon
  const getAlertTypeIcon = (alertType: string) => {
    switch (alertType) {
      case 'calf_15days':
      case 'calf_6months':
        return Baby;
      case 'age_limit':
        return Users;
      case 'vaccination':
        return Activity;
      case 'cleaning':
        return CheckCircle2;
      default:
        return AlertCircle;
    }
  };

  // Legmagasabb prioritású riasztás kiválasztása megjelenítéshez
  const topAlert = penAlerts.reduce((prev, current) => {
  const getPriorityValue = (priority: any) => {
    if (typeof priority === 'string') {
      const order: { [key: string]: number } = { 'surgos': 5, 'kritikus': 4, 'magas': 3, 'kozepes': 2, 'alacsony': 1 };
      return order[priority] || 0;
    }
    return priority as number || 0;
  };
  
  return getPriorityValue(current.priority) > getPriorityValue(prev.priority) ? current : prev;
});

  const style = getPriorityStyle(topAlert.priority);
  const IconComponent = style.icon;
  const TypeIcon = getAlertTypeIcon(topAlert.alertType);

  return (
    <div className={`${style.bgColor} ${style.borderColor} border rounded-lg p-3 mt-3 ${className}`}>
      <div className="flex items-start gap-3">
        {/* Ikon */}
        <div className="flex-shrink-0">
          <IconComponent className={`w-4 h-4 ${style.iconColor}`} />
        </div>
        
        {/* Tartalom */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <TypeIcon className={`w-3 h-3 ${style.iconColor}`} />
            <p className={`text-xs font-medium ${style.textColor}`}>
              {topAlert.title}
            </p>
            {penAlerts.length > 1 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full bg-white ${style.textColor} border`}>
                +{penAlerts.length - 1}
              </span>
            )}
          </div>
          
          <p className={`text-xs ${style.textColor} opacity-90`}>
            {topAlert.message}
          </p>
          
          {/* Ha több riasztás van, mutassuk az összeset */}
          {penAlerts.length > 1 && (
            <div className="mt-2 space-y-1">
              {penAlerts.slice(1).map((alert, index) => (
                <div key={alert.id} className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    (alert.priority === 4 || (alert.priority as any) === 'kritikus' || (alert.priority as any) === 'surgos') ? 'bg-red-400' :
(alert.priority === 3 || (alert.priority as any) === 'magas') ? 'bg-orange-400' :
(alert.priority === 2 || (alert.priority as any) === 'kozepes') ? 'bg-yellow-400' : 'bg-blue-400'
                  }`} />
                  <p className={`text-xs ${style.textColor} opacity-75`}>
                    {alert.message}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Riasztások száma jobb alsó sarokban */}
      {penAlerts.length > 0 && (
        <div className="flex justify-between items-center mt-2">
          <span className={`text-xs ${style.textColor} opacity-75`}>
            {topAlert.animalCount > 0 && `${topAlert.animalCount} állat érintett`}
          </span>
          <span className={`text-xs font-medium ${style.textColor}`}>
            Prioritás: {topAlert.priority}/4
          </span>
        </div>
      )}
    </div>
  );
}

// Riasztások összesítő widget (dashboard tetejére)
interface AlertsSummaryProps {
  alerts: PenAlert[];
  className?: string;
}

export function AlertsSummary({ alerts, className = '' }: AlertsSummaryProps) {
  const criticalCount = alerts.filter(alert => alert.priority === 4).length;
  const highCount = alerts.filter(alert => alert.priority === 3).length;
  const mediumCount = alerts.filter(alert => alert.priority === 2).length;
  const lowCount = alerts.filter(alert => alert.priority === 1).length;

  if (alerts.length === 0) {
    return (
      <div className={`bg-green-50 border border-green-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          <div>
            <h3 className="text-sm font-medium text-green-800">Minden rendben!</h3>
            <p className="text-xs text-green-700">Jelenleg nincsenek aktív riasztások.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-orange-500" />
          Aktív Riasztások
        </h3>
        <span className="text-lg font-bold text-gray-900">
          {alerts.length}
        </span>
      </div>
      
      <div className="grid grid-cols-4 gap-3">
        {/* Kritikus */}
        <div className="text-center">
          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-1">
            <span className="text-sm font-bold text-red-700">{criticalCount}</span>
          </div>
          <p className="text-xs text-red-700 font-medium">Kritikus</p>
        </div>
        
        {/* Magas */}
        <div className="text-center">
          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-1">
            <span className="text-sm font-bold text-orange-700">{highCount}</span>
          </div>
          <p className="text-xs text-orange-700 font-medium">Magas</p>
        </div>
        
        {/* Közepes */}
        <div className="text-center">
          <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-1">
            <span className="text-sm font-bold text-yellow-700">{mediumCount}</span>
          </div>
          <p className="text-xs text-yellow-700 font-medium">Közepes</p>
        </div>
        
        {/* Alacsony */}
        <div className="text-center">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-1">
            <span className="text-sm font-bold text-blue-700">{lowCount}</span>
          </div>
          <p className="text-xs text-blue-700 font-medium">Alacsony</p>
        </div>
      </div>
    </div>
  );
}