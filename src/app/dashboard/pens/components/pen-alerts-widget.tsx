// src/components/pen-alerts-widget.tsx
// ✅ JAVÍTOTT VERZIÓ - Állat és Karám Riasztások Megjelenítése

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

// ✅ RIASZTÁS TÍPUS DEFINÍCIÓJA - bővített verzió
interface PenAlert {
  id: string;
  penId?: string;
  pen_id?: string;
  animal_id?: string;
  enar?: string;
  alertType: string;
  type: string;
  title: string;
  message: string;
  priority: 1 | 2 | 3 | 4 | 'surgos' | 'kritikus' | 'magas' | 'kozepes' | 'alacsony';
  dueDate?: string;
  due_date?: string;
  animalCount?: number;
  is_resolved?: boolean;
  is_snoozed?: boolean;
}

// Widget props
interface PenAlertsWidgetProps {
  penId: string;
  penNumber?: string;
  alerts: PenAlert[];
  animalPenMap?: Record<string, string>;
  className?: string;
  showAnimalAlerts?: boolean;
  maxDisplayed?: number;
  // 🆕 ÚJ PROPS
  onAlertClick?: (alert: PenAlert) => void;
  onRefresh?: () => void;
  interactive?: boolean;
}

export function PenAlertsWidget({ 
  penId, 
  penNumber,
  alerts, 
  animalPenMap = {},
  className = '',
  showAnimalAlerts = true,
  maxDisplayed = 5,
  onAlertClick,
  onRefresh,
  interactive = true
}: PenAlertsWidgetProps) {
  
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  
  // ✅ JAVÍTOTT SZŰRÉS - Karám és Állat riasztások
  const getRelevantAlerts = (): PenAlert[] => {
    const relevantAlerts = alerts.filter(alert => {
      // Skip resolved/snoozed alerts
      if (alert.is_resolved || alert.is_snoozed) {
        return false;
      }

      // 1. Direkt karám riasztások (pen_id match)
      if (alert.pen_id === penId || alert.penId === penId) {
        console.log('🎯 Direct pen alert found:', alert.title);
        return true;
      }

      // 2. Pen number alapján (ha van)
      if (penNumber && (alert.pen_id === penNumber || alert.penId === penNumber)) {
        console.log('🎯 Pen number alert found:', alert.title);
        return true;
      }

      // 3. Állat riasztások (ha a karámban van az állat)
      if (showAnimalAlerts && alert.animal_id) {
        const animalPenNumber = animalPenMap[alert.animal_id];
        
        // Ellenőrizzük pen_number vs penId
        if (animalPenNumber === penNumber || animalPenNumber === penId) {
          console.log('🐄 Animal alert in pen:', alert.title, 'Animal:', alert.enar);
          return true;
        }
      }

      return false;
    });

    console.log(`🔍 Relevant alerts for pen ${penId}/${penNumber}:`, relevantAlerts.length);
return relevantAlerts;  // ✅ NINCS LIMITÁLÁS!
  };

  const penAlerts = getRelevantAlerts();

// 🆕 RIASZTÁS KATTINTÁS KEZELÉSE
const handleAlertClick = (alert: PenAlert, event: React.MouseEvent) => {
  event.preventDefault();
  event.stopPropagation();

  console.log('🖱️ Alert clicked:', alert.title);

  // Custom click handler ha van
  if (onAlertClick) {
    onAlertClick(alert);
    return;
  }

  // Default viselkedés: állat oldalra navigálás vagy részletek megjelenítése
  if (alert.animal_id && alert.enar) {
    console.log('🐄 Navigating to animal:', alert.enar);
    router.push(`/dashboard/animals/${alert.enar}`);
  } else if (alert.pen_id || alert.penId) {
    console.log('🏠 Showing pen details for alert:', alert.title);
    // Riasztás részletek modal vagy expanded view
    setExpanded(true);
  }
};

// 🆕 REFRESH GOMB KEZELÉSE
const handleRefresh = (event: React.MouseEvent) => {
  event.preventDefault();
  event.stopPropagation();
  
  console.log('🔄 Manual refresh requested');
  if (onRefresh) {
    onRefresh();
  }
};

  // Ha nincsenek riasztások, pozitív üzenetet mutatunk
if (penAlerts.length === 0) {
  return (
    <div className={`bg-green-50 border border-green-200 rounded-lg p-3 mt-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">✅</span>
          <p className="text-sm font-medium text-green-800">Minden rendben!</p>
        </div>
        {interactive && onRefresh && (
          <button
            onClick={handleRefresh}
            className="text-green-600 hover:text-green-800 text-xs p-1 rounded hover:bg-green-100"
            title="Riasztások frissítése"
          >
            🔄
          </button>
        )}
      </div>
      <p className="text-xs text-green-700 mt-1">Nincsenek aktív riasztások ehhez a karámhoz.</p>
    </div>
  );
}

  // ✅ PRIORITÁS KEZELÉS - JAVÍTOTT VERZIÓ
  const getPriorityValue = (priority: any): number => {
    if (typeof priority === 'string') {
      const order: { [key: string]: number } = { 
        'surgos': 5, 
        'kritikus': 4, 
        'magas': 3, 
        'kozepes': 2, 
        'alacsony': 1 
      };
      return order[priority] || 0;
    }
    return priority as number || 0;
  };

  // Prioritás alapján színek és emoji ikonok
  const getPriorityStyle = (priority: any) => {
    const priorityValue = getPriorityValue(priority);
    
    switch (priorityValue) {
      case 5: // Sürgős
      case 4: // Kritikus
        return {
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-800',
          iconColor: 'text-red-600',
          emoji: '🚨'
        };
      case 3: // Magas
        return {
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          textColor: 'text-orange-800',
          iconColor: 'text-orange-600',
          emoji: '⚠️'
        };
      case 2: // Közepes
        return {
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          textColor: 'text-yellow-800',
          iconColor: 'text-yellow-600',
          emoji: '⏰'
        };
      case 1: // Alacsony
        return {
          bgColor: 'bg-teal-50',
          borderColor: 'border-teal-200',
          textColor: 'text-teal-800',
          iconColor: 'text-teal-600',
          emoji: '💡'
        };
      default:
        return {
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          textColor: 'text-gray-800',
          iconColor: 'text-gray-600',
          emoji: '❓'
        };
    }
  };

  // Riasztás típus alapján specifikus emoji ikonok
  const getAlertTypeEmoji = (alertType: string) => {
    // Egyesített type és alertType kezelés
    const type = alertType || '';
    
    switch (type) {
      case 'fulszamozas':
      case 'calf_15days':
        return '🍼';
      case 'valasztas':
      case 'calf_6months':
        return '🐄';
      case 'ovi_karam':
      case 'age_limit':
        return '👥';
      case 'harem_karam':
        return '💕';
      case 'vv_vizsgalat':
        return '🔬';
      case 'vaccination':
        return '💉';
      case 'cleaning':
        return '🧹';
      case 'ertekesites':
        return '📦';
      default:
        return '📋';
    }
  };

  // ✅ LEGMAGASABB PRIORITÁSÚ RIASZTÁS KIVÁLASZTÁSA
  const topAlert = penAlerts.reduce((prev, current) => {
    return getPriorityValue(current.priority) > getPriorityValue(prev.priority) ? current : prev;
  });

  const style = getPriorityStyle(topAlert.priority);
  const typeEmoji = getAlertTypeEmoji(topAlert.type || topAlert.alertType);

  // ✅ PRIORITÁS SZÍN HELPER
  const getPriorityColor = (priority: any): string => {
    const priorityValue = getPriorityValue(priority);
    
    if (priorityValue >= 4) return 'bg-red-500';
    if (priorityValue === 3) return 'bg-orange-500';
    if (priorityValue === 2) return 'bg-yellow-500';
    return 'bg-teal-500';
  };

  return (
  <div className={`${style.bgColor} ${style.borderColor} border rounded-lg p-4 mt-3 ${className} ${interactive ? 'transition-all hover:shadow-md' : ''}`}>
    
    {/* 🆕 HEADER - Refresh gombbal */}
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-2">
        <span className="text-lg">{style.emoji}</span>
        <h4 className={`text-sm font-medium ${style.textColor}`}>
          🚨 Karám Riasztások ({penAlerts.length})
        </h4>
      </div>
      
      {interactive && (
        <div className="flex items-center gap-1">
          {onRefresh && (
            <button
              onClick={handleRefresh}
              className={`${style.textColor} hover:opacity-80 text-xs p-1 rounded transition-opacity`}
              title="Riasztások frissítése"
            >
              🔄
            </button>
          )}
          
          {penAlerts.length > 1 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className={`${style.textColor} hover:opacity-80 text-xs p-1 rounded transition-opacity`}
              title={expanded ? 'Összecsukás' : 'Összes megjelenítése'}
            >
              {expanded ? '➖' : '➕'}
            </button>
          )}
        </div>
      )}
    </div>

    {/* 🆕 FŐ RIASZTÁS - KATTINTHATÓ */}
    <div 
      className={`${interactive ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''}`}
      onClick={interactive ? (e) => handleAlertClick(topAlert, e) : undefined}
    >
      <div className="flex items-start gap-3">
        <span className="text-sm">{typeEmoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className={`text-sm font-medium ${style.textColor}`}>
              {topAlert.title}
            </p>
            
            {/* 🆕 ÁLLAT BADGE - KATTINTHATÓ */}
            {topAlert.animal_id && topAlert.enar && (
              <span 
                className={`text-xs px-2 py-1 rounded-full bg-white ${style.textColor} border font-mono ${interactive ? 'hover:bg-gray-50 cursor-pointer' : ''}`}
                onClick={interactive ? (e) => {
                  e.stopPropagation();
                  router.push(`/dashboard/animals/${topAlert.enar}`);
                } : undefined}
                title={`${topAlert.enar} állat részletei`}
              >
                🐄 {topAlert.enar}
              </span>
            )}
            
            {penAlerts.length > 1 && (
  <button 
    onClick={(e) => {
      e.stopPropagation(); // Ne triggelje a szülő kattintást
      setExpanded(!expanded); // Kibontás/összecsukás
    }}
    className={`text-xs px-2 py-1 rounded-full bg-white ${style.textColor} border font-medium hover:bg-gray-50 cursor-pointer transition-colors`}
    title={expanded ? 'Összecsukás' : 'További riasztások megjelenítése'}
  >
    {expanded ? '➖' : '➕'} {penAlerts.length - 1} további
  </button>
)}
          </div>
          
          <p className={`text-sm ${style.textColor} opacity-90`}>
            {topAlert.message}
          </p>
        </div>
      </div>
    </div>
    
    {/* 🆕 TOVÁBBI RIASZTÁSOK - EXPANDÁLHATÓ */}
    {expanded && penAlerts.length > 1 && (
      <div className="mt-3 pt-3 border-t border-opacity-30 space-y-2">
        {penAlerts.slice(1).map((alert) => (
          <div 
            key={alert.id}
            className={`flex items-center gap-2 p-2 rounded ${interactive ? 'hover:bg-white hover:bg-opacity-50 cursor-pointer transition-colors' : ''}`}
            onClick={interactive ? (e) => handleAlertClick(alert, e) : undefined}
          >
            <div className={`w-2 h-2 rounded-full ${getPriorityValue(alert.priority) >= 4 ? 'bg-red-500' : getPriorityValue(alert.priority) === 3 ? 'bg-orange-500' : 'bg-yellow-500'}`} />
            <span className="text-xs">{getAlertTypeEmoji(alert.type || alert.alertType)}</span>
            <div className="flex-1">
              <p className={`text-sm ${style.textColor} opacity-75`}>
                {alert.message}
              </p>
              {alert.animal_id && alert.enar && (
                <span className={`text-xs font-mono ${style.textColor} opacity-60`}>
                  🐄 {alert.enar}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    )}
    
    {/* 🆕 FOOTER - Típus és statisztika információ */}
    <div className="flex justify-between items-center mt-3 pt-3 border-t border-opacity-30">
      <div className="flex items-center space-x-3">
        {/* Állat vs karám riasztás jelzés */}
        <span className={`text-xs ${style.textColor} opacity-60`}>
          {topAlert.animal_id ? '🐄 Állat' : '🏠 Karám'} riasztás
        </span>
        
        {/* Debug info fejlesztői módban */}
        {process.env.NODE_ENV === 'development' && (
          <span className={`text-xs ${style.textColor} opacity-40`}>
            Map: {Object.keys(animalPenMap).length}
          </span>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        {interactive && (
          <span className={`text-xs ${style.textColor} opacity-60`}>
            🖱️ Kattintható
          </span>
        )}
        <span className={`text-sm font-medium ${style.textColor}`}>
          🎯 {penAlerts.length}
        </span>
      </div>
    </div>
  </div>
);
}

// ============================================
// ✅ RIASZTÁSOK ÖSSZESÍTŐ WIDGET - JAVÍTOTT
// ============================================

interface AlertsSummaryProps {
  alerts: PenAlert[];
  className?: string;
}

export function AlertsSummary({ alerts, className = '' }: AlertsSummaryProps) {
  // Csak aktív riasztások számítása
  const activeAlerts = alerts.filter(alert => !alert.is_resolved && !alert.is_snoozed);
  
  const getPriorityValue = (priority: any): number => {
    if (typeof priority === 'string') {
      const order: { [key: string]: number } = { 
        'surgos': 5, 
        'kritikus': 4, 
        'magas': 3, 
        'kozepes': 2, 
        'alacsony': 1 
      };
      return order[priority] || 0;
    }
    return priority as number || 0;
  };

  const criticalCount = activeAlerts.filter(alert => {
    const priority = getPriorityValue(alert.priority);
    return priority >= 4;
  }).length;

  const highCount = activeAlerts.filter(alert => 
    getPriorityValue(alert.priority) === 3
  ).length;

  const mediumCount = activeAlerts.filter(alert => 
    getPriorityValue(alert.priority) === 2
  ).length;

  const lowCount = activeAlerts.filter(alert => 
    getPriorityValue(alert.priority) === 1
  ).length;

  if (activeAlerts.length === 0) {
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
          {activeAlerts.length}
        </span>
      </div>
      
      {/* ✅ JAVÍTOTT STATISZTIKA KÖRÖK */}
      <div className="flex items-center justify-center gap-6">
        
        {/* Összes */}
        <div className="text-center">
          <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-2">
            <div className="text-center text-white">
              <div className="text-lg font-bold">{activeAlerts.length}</div>
              <div className="text-xs">Összes</div>
            </div>
          </div>
        </div>

        {/* Kritikus */}
        <div className="text-center">
          <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-2">
            <div className="text-center text-white">
              <div className="text-lg font-bold">{criticalCount}</div>
              <div className="text-xs">Kritikus</div>
            </div>
          </div>
        </div>
        
        {/* Magas */}
        <div className="text-center">
          <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-2">
            <div className="text-center text-white">
              <div className="text-lg font-bold">{highCount}</div>
              <div className="text-xs">Magas</div>
            </div>
          </div>
        </div>
        
        {/* Közepes */}
        <div className="text-center">
          <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-2">
            <div className="text-center text-white">
              <div className="text-lg font-bold">{mediumCount}</div>
              <div className="text-xs">Közepes</div>
            </div>
          </div>
        </div>
        
        {/* Alacsony */}
        <div className="text-center">
          <div className="w-16 h-16 bg-teal-500 rounded-full flex items-center justify-center mx-auto mb-2">
            <div className="text-center text-white">
              <div className="text-lg font-bold">{lowCount}</div>
              <div className="text-xs">Alacsony</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* ✅ ÚJ: Debug információ (fejlesztési módban) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-2 bg-gray-50 rounded text-xs text-gray-500">
          <p>Debug: {alerts.length} total, {activeAlerts.length} active</p>
          <p>Animal alerts: {alerts.filter(a => a.animal_id).length}</p>
          <p>Pen alerts: {alerts.filter(a => a.pen_id && !a.animal_id).length}</p>
        </div>
      )}
    </div>
  );
}