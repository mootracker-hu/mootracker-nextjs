// Enhanced Alert Action Panel - Modern Colors - Teljes frissített verzió
// ✅ KÉK → VIOLET, ZÖLD → EMERALD színfrissítés

import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, 
  Clock, 
  CheckCircle2, 
  Calendar,
  AlertTriangle,
  FileText
} from 'lucide-react';

interface EnhancedAlertActionPanelProps {
  alert: any;
  onCreateTask: (alert: any, taskData: any) => Promise<void>;
  onSnoozeAlert: (alertId: string, duration: string) => Promise<void>;
  onResolveAlert: (alertId: string, reason?: string) => Promise<void>;
}

export const EnhancedAlertActionPanel: React.FC<EnhancedAlertActionPanelProps> = ({
  alert,
  onCreateTask,
  onSnoozeAlert,
  onResolveAlert
}) => {
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showResolveForm, setShowResolveForm] = useState(false);
  const [taskData, setTaskData] = useState({
    title: '',
    due_date: '',
    action_required: '',
    notes: '',
    priority: 'kozepes' as any
  });
  const [resolveNotes, setResolveNotes] = useState('');

  // 🎯 INTELLIGENS TASK ADATOK ELŐKITÖLTÉSE
  useEffect(() => {
    if (showTaskForm) {
      const suggestions = getTaskSuggestions(alert.type);
      
      setTaskData({
        title: suggestions.title.replace('{enar}', alert.animal?.enar || 'N/A'),
        due_date: suggestions.due_date,
        action_required: suggestions.actions.join('\n• '),
        notes: `Alert-ből generált feladat: ${alert.description}`,
        priority: suggestions.priority
      });
    }
  }, [showTaskForm, alert]);

  // 📋 TASK SUGGESTIONS LOGIC
  const getTaskSuggestions = (alertType: string) => {
    const today = new Date();
    
    const suggestions: Record<string, any> = {
      'valasztas_ideje': {
        title: '{enar} - Borjú választás (6 hónapos)',
        due_date: new Date(today.getTime() + (7 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
        actions: [
          'Kollégákkal egyeztetés választási időpontról',
          'Cél karám kiválasztása (♀→bölcsi, ♂→hízóbika)', 
          'Borjú leválasztása anyjáról',
          'Karám áthelyezés végrehajtása'
        ],
        priority: 'magas'
      },
      'vakcinazas_esedékes': {
        title: '{enar} - 15 napos borjú kezelések',
        due_date: new Date(today.getTime() + (3 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
        actions: [
          'BoviPast vakcina beadása',
          'Szarvtalanítás elvégzése',
          'Fülszám felhelyezése',
          'Egészségügyi állapot felmérése'
        ],
        priority: 'kritikus'
      },
      'vemhessegvizsgalat': {
        title: '{enar} - Vemhességvizsgálat (75 nap háremben)',
        due_date: new Date(today.getTime() + (3 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
        actions: [
          'Állatorvos értesítése és időpont egyeztetése',
          'VV vizsgálat előkészítése',
          'Ultrahangos vizsgálat elvégzése',
          'VV eredmény rögzítése a rendszerben'
        ],
        priority: 'magas'
      },
      'rcc_vakcina_esedékes': {
        title: '{enar} - RCC vakcina (ellés előtt 6 hét)',
        due_date: new Date(today.getTime() + (2 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
        actions: [
          'RCC vakcina beszerzése',
          'Állatorvos értesítése',
          'Vakcina beadása vemhes állatnak',
          'Vakcinázás dokumentálása'
        ],
        priority: 'kritikus'
      },
      'elles_kesesben': {
        title: '{enar} - TÚLHORDÁS - Azonnali beavatkozás',
        due_date: today.toISOString().split('T')[0], // MA!
        actions: [
          'AZONNALI állatorvosi vizsgálat',
          'Ultrahang magzatvizsgálat',
          'Császármetszés mérlegelése',
          'Intenzív megfigyelés és monitoring'
        ],
        priority: 'surgos'
      }
    };

    return suggestions[alertType] || {
      title: '{enar} - ' + alert.title,
      due_date: new Date(today.getTime() + (7 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
      actions: [alert.action_required || 'Szükséges intézkedés végrehajtása'],
      priority: 'kozepes'
    };
  };

  // 📋 TASK LÉTREHOZÁS
  const handleCreateTask = async () => {
    try {
      await onCreateTask(alert, {
        title: taskData.title,
        description: taskData.notes,
        priority: taskData.priority,
        category: getTaskCategory(alert.type),
        due_date: new Date(taskData.due_date).toISOString(),
        action_required: taskData.action_required,
        alert_id: alert.id,
        animal_id: alert.animal_id,
        status: 'fuggőben'
      });
      
      setShowTaskForm(false);
      console.log('✅ Task sikeresen létrehozva alert-ből');
    } catch (error) {
      console.error('❌ Task létrehozási hiba:', error);
      alert('Hiba történt a feladat létrehozása során!');
    }
  };

  // 📂 TASK KATEGÓRIA MAPPING
  const getTaskCategory = (alertType: string) => {
    const mapping: Record<string, string> = {
      'valasztas_ideje': 'mozgatas',
      'vakcinazas_esedékes': 'vakcinazas',
      'vemhessegvizsgalat': 'tenyesztes',
      'rcc_vakcina_esedékes': 'vakcinazas',
      'bovipast_vakcina_esedékes': 'vakcinazas',
      'elles_kesesben': 'egeszsegugy',
      'piaci_lehetoseg': 'ertekesites'
    };
    return mapping[alertType] || 'altalanos';
  };

  // ⏰ SNOOZE FUNKCIÓ
  const handleSnooze = async (duration: string) => {
    try {
      await onSnoozeAlert(alert.id, duration);
      console.log(`⏰ Alert snooze-olva: ${duration}`);
    } catch (error) {
      console.error('❌ Snooze hiba:', error);
      alert('Hiba történt a halasztás során!');
    }
  };

  // ✅ RESOLVE FUNKCIÓ
  const handleResolve = async () => {
    try {
      await onResolveAlert(alert.id, resolveNotes);
      setShowResolveForm(false);
      setResolveNotes('');
      console.log('✅ Alert feloldva');
    } catch (error) {
      console.error('❌ Resolve hiba:', error);
      alert('Hiba történt a feloldás során!');
    }
  };

  // 🎨 MODERN PRIORITY COLOR MAPPING - FRISSÍTETT!
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'surgos': return 'bg-red-600 text-white';
      case 'kritikus': return 'bg-rose-500 text-white';
      case 'magas': return 'bg-amber-500 text-white';
      case 'kozepes': return 'bg-cyan-500 text-white';
      default: return 'bg-slate-500 text-white';
    }
  };

  return (
    <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
      {/* 📋 ALERT INFORMÁCIÓ */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <span className="text-sm font-medium text-gray-900">Műveletek</span>
        </div>
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(alert.priority)}`}>
          {alert.priority.charAt(0).toUpperCase() + alert.priority.slice(1)}
        </span>
      </div>

      {/* 🎯 MAIN ACTION BUTTONS */}
      {!showTaskForm && !showResolveForm && (
        <div className="space-y-2">
          {/* Task létrehozás gomb - ✅ KÉK → VIOLET */}
          <button
            onClick={() => setShowTaskForm(true)}
            disabled={!!alert.related_task_id}
            className={`w-full flex items-center justify-center gap-2 p-3 rounded-lg text-sm font-medium transition-colors ${
              alert.related_task_id 
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                : 'bg-violet-600 text-white hover:bg-violet-700 cursor-pointer shadow-sm'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            {alert.related_task_id ? 'Feladat már létrehozva' : 'Feladat létrehozása'}
          </button>

          {/* Snooze gombok - ✅ SÁRGA → AMBER */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleSnooze('1d')}
              className="flex items-center justify-center gap-1 p-2 bg-amber-100 text-amber-800 rounded text-xs hover:bg-amber-200 transition-colors cursor-pointer"
            >
              <Clock className="w-3 h-3" />
              1 nap
            </button>
            <button
              onClick={() => handleSnooze('3d')}
              className="flex items-center justify-center gap-1 p-2 bg-amber-100 text-amber-800 rounded text-xs hover:bg-amber-200 transition-colors cursor-pointer"
            >
              <Clock className="w-3 h-3" />
              3 nap
            </button>
            <button
              onClick={() => handleSnooze('1w')}
              className="flex items-center justify-center gap-1 p-2 bg-amber-100 text-amber-800 rounded text-xs hover:bg-amber-200 transition-colors cursor-pointer"
            >
              <Clock className="w-3 h-3" />
              1 hét
            </button>
          </div>

          {/* Resolve gomb - ✅ ZÖLD → EMERALD */}
          <button
            onClick={() => setShowResolveForm(true)}
            className="w-full flex items-center justify-center gap-2 p-2 bg-emerald-600 text-white rounded text-sm hover:bg-emerald-700 transition-colors cursor-pointer shadow-sm"
          >
            <CheckCircle2 className="w-4 h-4" />
            Megoldva jelölése
          </button>
        </div>
      )}

      {/* 📋 TASK LÉTREHOZÁS FORM - ✅ KÉK → VIOLET */}
      {showTaskForm && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-4 h-4 text-violet-600" />
            <h4 className="text-sm font-medium text-violet-900">Új feladat létrehozása</h4>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Feladat címe
            </label>
            <input
              type="text"
              value={taskData.title}
              onChange={(e) => setTaskData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-violet-500 focus:outline-none"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Határidő
              </label>
              <input
                type="date"
                value={taskData.due_date}
                onChange={(e) => setTaskData(prev => ({ ...prev, due_date: e.target.value }))}
                className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-violet-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Prioritás
              </label>
              <select
                value={taskData.priority}
                onChange={(e) => setTaskData(prev => ({ ...prev, priority: e.target.value as any }))}
                className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-violet-500 focus:outline-none"
              >
                <option value="alacsony">Alacsony</option>
                <option value="kozepes">Közepes</option>
                <option value="magas">Magas</option>
                <option value="kritikus">Kritikus</option>
                <option value="surgos">Sürgős</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Szükséges intézkedések
            </label>
            <textarea
              value={taskData.action_required}
              onChange={(e) => setTaskData(prev => ({ ...prev, action_required: e.target.value }))}
              className="w-full p-2 text-sm border border-gray-300 rounded h-20 focus:ring-2 focus:ring-violet-500 focus:outline-none"
              placeholder="Mit kell tenni..."
            />
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Megjegyzések
            </label>
            <textarea
              value={taskData.notes}
              onChange={(e) => setTaskData(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full p-2 text-sm border border-gray-300 rounded h-16 focus:ring-2 focus:ring-violet-500 focus:outline-none"
              placeholder="További részletek, koordinációs információk..."
            />
          </div>
          
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleCreateTask}
              className="flex-1 px-3 py-2 bg-violet-600 text-white text-sm rounded hover:bg-violet-700 cursor-pointer transition-colors shadow-sm"
            >
              ✅ Feladat létrehozása
            </button>
            <button
              onClick={() => setShowTaskForm(false)}
              className="px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50 cursor-pointer transition-colors"
            >
              Mégse
            </button>
          </div>
        </div>
      )}

      {/* ✅ RESOLVE FORM - ✅ ZÖLD → EMERALD */}
      {showResolveForm && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <h4 className="text-sm font-medium text-emerald-900">Riasztás feloldása</h4>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Feloldás oka / Megjegyzés
            </label>
            <textarea
              value={resolveNotes}
              onChange={(e) => setResolveNotes(e.target.value)}
              className="w-full p-2 text-sm border border-gray-300 rounded h-16 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              placeholder="Miért lett megoldva? Mi történt? (opcionális)"
            />
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handleResolve}
              className="flex-1 px-3 py-2 bg-emerald-600 text-white text-sm rounded hover:bg-emerald-700 cursor-pointer transition-colors shadow-sm"
            >
              ✅ Megoldva
            </button>
            <button
              onClick={() => setShowResolveForm(false)}
              className="px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50 cursor-pointer transition-colors"
            >
              Mégse
            </button>
          </div>
        </div>
      )}
    </div>
  );
};