'use client';

import Link from 'next/link';
import { useState } from 'react';
import { EnhancedAlertActionPanel } from '@/components/EnhancedAlertActionPanel';

// Alert és Task rendszer
import { useAlertsNew } from '@/hooks/useAlertsNew';
import { useTasks } from '@/hooks/useTasks';
import { CreateTaskRequest, TaskPriority, TaskCategory, TaskStatus } from '@/types/alert-task-types';

export default function DashboardPage() {
  // Alert rendszer - Pen Alerts használata
  const { alerts, loading: alertsLoading, error: alertsError } = useAlertsNew();

  // Console debug
  console.log('🔍 DASHBOARD PEN ALERTS DEBUG:', {
    alerts,
    alertsLength: alerts?.length || 0,
    alertsLoading,
    alertsError
  });

  // Task rendszer
  const {
    tasks,
    loading: tasksLoading,
    error: tasksError,
    createTask,
    updateTask,
    completeTask,
    deleteTask,
    taskStats
  } = useTasks();

  // UI állapotok
  const [showNewTaskForm, setShowNewTaskForm] = useState(false);
  const [newTaskData, setNewTaskData] = useState({
    title: '',
    description: '',
    priority: 'kozepes' as TaskPriority,
    category: 'altalanos' as TaskCategory,
    due_date: '',
    action_required: ''
  });

  // ✅ PEN ALERTS ALAPÚ ALERT STATS SZÁMÍTÁS
  const alertStats = {
    osszes: alerts?.length || 0,
    aktiv: alerts?.length || 0,
    kritikus: alerts?.filter(a => a.priority === 'kritikus' || a.priority === 'surgos')?.length || 0,
    magas: alerts?.filter(a => a.priority === 'magas')?.length || 0,
    kozepes: alerts?.filter(a => a.priority === 'kozepes')?.length || 0,
    alacsony: alerts?.filter(a => a.priority === 'alacsony')?.length || 0,
    lejart: alerts?.filter(a => a.due_date && new Date(a.due_date) < new Date())?.length || 0
  };

  // ✅ PEN ALERTS FORMÁTUM ÁTALAKÍTÁSA DASHBOARD FORMÁTUMRA - TOP 4 KRITIKUS
  const recentAlerts = (alerts || [])
    .filter((alert: any) => {
      return alert.type !== 'urez_karam' &&
        alert.type !== 'alulhasznaltsag' &&
        alert.type !== 'takaritas';
    })
    .sort((a: any, b: any) => {
      const priorityOrder: { [key: string]: number } = { 
        'surgos': 5, 'kritikus': 4, 'magas': 3, 'kozepes': 2, 'alacsony': 1 
      };
      return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
    })
    .slice(0, 4) // TOP 4 legfontosabb
    .map(alert => ({
      id: alert.id,
      type: alert.type,
      priority: alert.priority,
      title: alert.title,
      description: alert.description,
      due_date: alert.due_date,
      is_resolved: false,
      animal: {
        enar: alert.animal_id || 'N/A'
      },
      penNumber: 'N/A',
      animalCount: 0,
      related_task_id: undefined
    }));

  // Legutóbbi task-ok (top 5)
  const recentTasks = tasks
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  // ✅ IDEIGLENESI SNOOZE ÉS RESOLVE FUNKCIÓK
  const snoozeAlert = async (alertId: string, duration: string) => {
    console.log(`⏰ Alert snooze: ${alertId} for ${duration}`);
    alert(`Riasztás halasztva ${duration}-re!`);
  };

  const resolveAlert = async (alertId: string, reason?: string) => {
    console.log(`✅ Alert resolved: ${alertId}`, reason ? `Reason: ${reason}` : '');
    alert('Riasztás megoldva!');
  };

  // ✅ CREATETASKFROMALERT FUNKCIÓ - PEN ALERTS KOMPATIBILIS
  const createTaskFromAlert = async (alert: any): Promise<string> => {
    try {
      const taskId = `task-${Date.now()}`;

      console.log('Creating task from pen alert:', {
        alertId: alert.id,
        taskId,
        penNumber: alert.penNumber,
        animalCount: alert.animalCount
      });

      // Task létrehozás a useTasks hook-kal
      const taskData: CreateTaskRequest = {
        title: alert.title,
        description: `${alert.description} (Karám: ${alert.penNumber}, Érintett állatok: ${alert.animalCount})`,
        priority: alert.priority as TaskPriority,
        category: 'karam' as TaskCategory,
        action_required: alert.description,
        due_date: alert.due_date || new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)).toISOString(),
        alert_id: alert.id
      };

      await createTask(taskData);

      return taskId;
    } catch (error) {
      console.error('Task creation error:', error);
      throw error;
    }
  };

  // 🇭🇺 MAGYAR ALERT LOKALIZÁCIÓ - PEN ALERTS KOMPATIBILIS
  const getAlertTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      'calf_6months': 'Borjú választás szükséges',
      'pen_overcrowded': 'Karám túlzsúfolt',
      'pen_empty': 'Karám üres',
      'function_change_needed': 'Funkció váltás szükséges',
      'capacity_warning': 'Kapacitás figyelmeztetés',
      'maintenance_due': 'Karbantartás esedékes',
      'valasztas_ideje': '6 hónapos borjú választás'
    };
    return labels[type] || type;
  };

  const getPriorityLabel = (priority: string): string => {
    const labels: Record<string, string> = {
      'alacsony': 'Alacsony',
      'kozepes': 'Közepes',
      'magas': 'Magas',
      'kritikus': 'Kritikus',
      'surgos': 'Sürgős'
    };
    return labels[priority] || priority;
  };

  const getStatusLabel = (status: TaskStatus): string => {
    const labels: Record<TaskStatus, string> = {
      'fuggőben': 'Függőben',
      'folyamatban': 'Folyamatban',
      'befejezve': 'Befejezve',
      'torolve': 'Törölve'
    };
    return labels[status] || status;
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'kritikus':
      case 'surgos':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'magas':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'kozepes':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getTaskStatusBadge = (status: string) => {
    switch (status) {
      case 'befejezve':
        return 'bg-green-100 text-green-800';
      case 'folyamatban':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Alert-ből task létrehozása
  const handleCreateTaskFromAlert = async (alert: any) => {
    try {
      const taskId = await createTaskFromAlert(alert);
      console.log(`Task létrehozva: ${taskId} alert-ből: ${alert.id}`);
    } catch (error) {
      console.error('Task létrehozási hiba:', error);
    }
  };

  // Új task létrehozása
  const handleCreateNewTask = async () => {
    if (!newTaskData.title || !newTaskData.action_required) {
      alert('Cím és teendő megadása kötelező!');
      return;
    }

    try {
      const taskData: CreateTaskRequest = {
        title: newTaskData.title,
        description: newTaskData.description,
        priority: newTaskData.priority,
        category: newTaskData.category,
        action_required: newTaskData.action_required,
        due_date: newTaskData.due_date || new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)).toISOString()
      };

      await createTask(taskData);

      // Form reset
      setNewTaskData({
        title: '',
        description: '',
        priority: 'kozepes',
        category: 'altalanos',
        due_date: '',
        action_required: ''
      });
      setShowNewTaskForm(false);
    } catch (error) {
      console.error('Task létrehozási hiba:', error);
      alert('Hiba történt a task létrehozása során!');
    }
  };

  // Task státusz váltás
  const handleTaskStatusChange = async (taskId: string, currentStatus: TaskStatus) => {
    try {
      if (currentStatus === 'fuggőben') {
        await updateTask(taskId, { status: 'folyamatban' });
      } else if (currentStatus === 'folyamatban') {
        await completeTask(taskId);
      }
    } catch (error) {
      console.error('Task státusz változtatási hiba:', error);
    }
  };

  // Task törlése
  const handleDeleteTask = async (taskId: string) => {
    if (confirm('Biztosan törölni szeretnéd ezt a feladatot?')) {
      try {
        await deleteTask(taskId);
      } catch (error) {
        console.error('Task törlési hiba:', error);
      }
    }
  };

  const stats = {
    totalAnimals: 251,
    activeAnimals: 251,
    pregnantCows: 28,
    pendingTasks: (taskStats?.fuggőben || 0) + (taskStats?.folyamatban || 0)
  };

  const quickActions = [
  {
    title: 'Új Állat Hozzáadása',
    description: 'Új állat rögzítése a rendszerben',
    href: '/dashboard/animals/add',
    emoji: '🐄',
    color: 'bg-green-600 hover:bg-green-700 hover:shadow-lg hover:scale-105'
  },
  {
    title: 'Karám Kezelés',
    description: 'Karamok és állatok áttekintése',
    href: '/dashboard/pens',
    emoji: '🏠',
    color: 'bg-orange-500 hover:bg-orange-600 hover:shadow-lg hover:scale-105'
  },
  {
    title: 'Riasztások Kezelése',
    description: 'Aktív riasztások és teendők',
    href: '/dashboard/tasks',
    emoji: '🚨',
    color: 'bg-red-500 hover:bg-red-600 hover:shadow-lg hover:scale-105'
  },
  {
    title: 'Állomány Áttekintés',
    description: 'Teljes állomány listázása',
    href: '/dashboard/animals',
    emoji: '📊',
    color: 'bg-teal-500 hover:bg-teal-600 hover:shadow-lg hover:scale-105'
  }
];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header - DESIGN SYSTEM */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <span className="text-4xl mr-4">📊</span>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="mt-2 text-gray-600">MooTracker - Szarvasmarha Management Rendszer</p>
            </div>
          </div>
        </div>

        {/* Alert Statistics - DESIGN SYSTEM SZÍNEK */}
        {!alertsLoading && !alertsError && (
          <div className="flex justify-center gap-6 mb-8">
  <div className="bg-green-600 text-white rounded-full w-16 h-16 flex flex-col items-center justify-center shadow-sm">
    <div className="text-xl font-bold">{alertStats.osszes}</div>
    <div className="text-xs">Összes</div>
  </div>
  <div className="bg-green-100 text-green-800 border-2 border-green-200 rounded-full w-16 h-16 flex flex-col items-center justify-center">
    <div className="text-xl font-bold">{alertStats.aktiv}</div>
    <div className="text-xs">Aktív</div>
  </div>
  <div className="bg-red-500 text-white rounded-full w-16 h-16 flex flex-col items-center justify-center shadow-sm">
    <div className="text-xl font-bold">{alertStats.kritikus}</div>
    <div className="text-xs">Kritikus</div>
  </div>
  <div className="bg-orange-500 text-white rounded-full w-16 h-16 flex flex-col items-center justify-center shadow-sm">
    <div className="text-xl font-bold">{alertStats.magas}</div>
    <div className="text-xs">Magas</div>
  </div>
  <div className="bg-teal-500 text-white rounded-full w-16 h-16 flex flex-col items-center justify-center shadow-sm">
    <div className="text-xl font-bold">{alertStats.lejart}</div>
    <div className="text-xs">Lejárt</div>
  </div>
</div>
        )}

        {/* Stats Cards - EMOJI IKONOK + DESIGN SYSTEM */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
  <div className="bg-white rounded-lg shadow-sm border p-4">
    <div className="flex items-center">
      <span className="text-2xl mr-3">🐄</span>
      <div>
        <p className="text-sm font-medium text-gray-600 mb-1">Összes Állat</p>
        <p className="text-2xl font-bold text-gray-900">{stats.totalAnimals}</p>
      </div>
    </div>
  </div>

  <div className="bg-white rounded-lg shadow-sm border p-4">
    <div className="flex items-center">
      <span className="text-2xl mr-3">✅</span>
      <div>
        <p className="text-sm font-medium text-gray-600 mb-1">Aktív Állat</p>
        <p className="text-2xl font-bold text-gray-900">{stats.activeAnimals}</p>
      </div>
    </div>
  </div>

  <div className="bg-white rounded-lg shadow-sm border p-4">
    <div className="flex items-center">
      <span className="text-2xl mr-3">🐄🍼</span>
      <div>
        <p className="text-sm font-medium text-gray-600 mb-1">Vemhes Tehén</p>
        <p className="text-2xl font-bold text-gray-900">{stats.pregnantCows}</p>
      </div>
    </div>
  </div>

  <div className="bg-white rounded-lg shadow-sm border p-4">
    <div className="flex items-center">
      <span className="text-2xl mr-3">📋</span>
      <div>
        <p className="text-sm font-medium text-gray-600 mb-1">Aktív Feladat</p>
        <p className="text-2xl font-bold text-gray-900">{stats.pendingTasks}</p>
      </div>
    </div>
  </div>
</div>

        {/* Quick Actions - ZÖLD SZÍNVILÁG + EMOJI */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex items-center mb-4">
            <span className="text-2xl mr-3">🚀</span>
            <h2 className="text-lg font-semibold text-gray-900">Gyors Műveletek</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
           {quickActions.map((action) => (
  <Link
    key={action.title}
    href={action.href}
    className={`${action.color} text-white rounded-lg p-4 transition-all duration-300 transform inline-flex items-center shadow-md`}
  >
    <span className="text-2xl mr-3">{action.emoji}</span>
    <div>
      <h3 className="font-medium">{action.title}</h3>
      <p className="text-sm opacity-90 mt-1">{action.description}</p>
    </div>
  </Link>
))}
          </div>
        </div>

        {/* RIASZTÁSOK ÉS FELADATOK - KOMPAKT DESIGN */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

          {/* RIASZTÁSOK - KOMPAKT KÁRTYA NÉZET */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <span className="text-2xl mr-3">🚨</span>
                <h2 className="text-lg font-semibold text-gray-900">Kritikus Riasztások</h2>
              </div>
              <Link
                href="/dashboard/tasks"
                className="bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-lg transition-colors text-sm inline-flex items-center"
              >
                <span className="mr-1">📋</span>
                Összes riasztás
              </Link>
            </div>

            {alertsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                <span className="ml-2 text-gray-600">Betöltés...</span>
              </div>
            ) : alertsError ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <span className="text-xl mr-2">⚠️</span>
                  <span className="text-red-800 text-sm">Hiba: {alertsError}</span>
                </div>
              </div>
            ) : recentAlerts.length > 0 ? (
              <div className="space-y-4">
                {recentAlerts.map(alert => (
                  <div key={alert.id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getPriorityBadge(alert.priority)}`}>
                            {alert.priority === 'kritikus' || alert.priority === 'surgos' ? '🔴 Kritikus' : 
                             alert.priority === 'magas' ? '🟠 Magas' : '🟡 Közepes'}
                          </span>
                          {alert.due_date && (
                            <span className="text-xs text-gray-500">
                              📅 {new Date(alert.due_date).toLocaleDateString('hu-HU')}
                            </span>
                          )}
                        </div>
                        <h3 className="font-medium text-gray-900 mb-1">{getAlertTypeLabel(alert.type)}</h3>
                        <p className="text-sm text-gray-600">{alert.description}</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleCreateTaskFromAlert(alert)}
                        className="bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-lg transition-colors text-sm inline-flex items-center"
                      >
                        <span className="mr-1">📋</span>
                        Feladat létrehozása
                      </button>
                      <button 
                        onClick={() => snoozeAlert(alert.id, '1 nap')}
                        className="bg-teal-500 hover:bg-teal-600 text-white font-medium px-4 py-2 rounded-lg transition-colors text-sm inline-flex items-center"
                      >
                        <span className="mr-1">⏰</span>
                        Halasztás
                      </button>
                      <button 
                        onClick={() => resolveAlert(alert.id, 'Megoldva')}
                        className="bg-white hover:bg-gray-50 text-gray-700 font-medium px-4 py-2 rounded-lg border border-gray-300 transition-colors text-sm inline-flex items-center"
                      >
                        <span className="mr-1">✅</span>
                        Megoldva
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <span className="text-4xl mb-2 block">✅</span>
                <p className="text-gray-600">Nincsenek aktív riasztások</p>
              </div>
            )}
          </div>

          {/* FELADATOK - MODERNIZÁLT NÉZET */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <span className="text-2xl mr-3">📋</span>
                <h2 className="text-lg font-semibold text-gray-900">Aktív Feladatok</h2>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowNewTaskForm(!showNewTaskForm)}
                  className="bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-lg transition-colors text-sm inline-flex items-center"
                >
                  <span className="mr-1">➕</span>
                  Új feladat
                </button>
                <Link
                  href="/dashboard/tasks"
                  className="bg-white hover:bg-gray-50 text-gray-700 font-medium px-4 py-2 rounded-lg border border-gray-300 transition-colors text-sm inline-flex items-center"
                >
                  <span className="mr-1">📊</span>
                  Összes
                </Link>
              </div>
            </div>

            {/* Új feladat form - DESIGN SYSTEM FORM STANDARDS */}
            {showNewTaskForm && (
              <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center mb-3">
                  <span className="text-xl mr-2">💾</span>
                  <h3 className="text-sm font-medium text-gray-900">Új feladat hozzáadása</h3>
                </div>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="🏷️ Feladat címe..."
                    value={newTaskData.title}
                    onChange={(e) => setNewTaskData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                  />
                  <textarea
                    placeholder="📝 Részletes leírás..."
                    value={newTaskData.description}
                    onChange={(e) => setNewTaskData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors resize-none"
                    rows={3}
                  />
                  <input
                    type="text"
                    placeholder="⚡ Teendő..."
                    value={newTaskData.action_required}
                    onChange={(e) => setNewTaskData(prev => ({ ...prev, action_required: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <select 
                      value={newTaskData.priority}
                      onChange={(e) => setNewTaskData(prev => ({ ...prev, priority: e.target.value as TaskPriority }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors bg-white"
                    >
                      <option value="alacsony">🟢 Alacsony</option>
                      <option value="kozepes">🟡 Közepes</option>
                      <option value="magas">🟠 Magas</option>
                      <option value="kritikus">🔴 Kritikus</option>
                    </select>
                    <input
                      type="date"
                      value={newTaskData.due_date ? newTaskData.due_date.split('T')[0] : ''}
                      onChange={(e) => setNewTaskData(prev => ({ ...prev, due_date: e.target.value ? new Date(e.target.value).toISOString() : '' }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={handleCreateNewTask}
                      className="bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-3 rounded-lg transition-colors inline-flex items-center"
                    >
                      <span className="mr-2">💾</span>
                      Mentés
                    </button>
                    <button
                      onClick={() => setShowNewTaskForm(false)}
                      className="bg-white hover:bg-gray-50 text-gray-700 font-medium px-6 py-3 rounded-lg border border-gray-300 transition-colors inline-flex items-center"
                    >
                      <span className="mr-2">❌</span>
                      Mégse
                    </button>
                  </div>
                </div>
              </div>
            )}

            {tasksLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                <span className="ml-2 text-gray-600">Betöltés...</span>
              </div>
            ) : (
              <div className="space-y-3">
                {recentTasks.map(task => (
                  <div key={task.id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => handleTaskStatusChange(task.id, task.status)}
                          className="text-2xl hover:scale-110 transition-transform"
                        >
                          {task.status === 'befejezve' ? '✅' : task.status === 'folyamatban' ? '🔄' : '⏳'}
                        </button>
                        <div>
                          <h3 className="font-medium text-gray-900">{task.title}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTaskStatusBadge(task.status)}`}>
                              {task.status === 'befejezve' ? '✅ Kész' : task.status === 'folyamatban' ? '🔄 Folyamatban' : '⏳ Várakozik'}
                            </span>
                            <span className="text-xs text-gray-500">
                              📅 {task.due_date ? new Date(task.due_date).toLocaleDateString('hu-HU') : 'Nincs határidő'}
                            </span>
                            {task.alert_id && (
                              <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">
                                🚨 Auto
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button className="text-gray-400 hover:text-green-600 p-2 transition-colors">
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="text-gray-400 hover:text-red-600 p-2 transition-colors"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!showNewTaskForm && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowNewTaskForm(true)}
                  className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-green-400 hover:text-green-600 transition-colors"
                >
                  <span className="text-xl">➕</span>
                  Új feladat hozzáadása
                </button>
              </div>
            )}
          </div>
        </div>

        {/* System Status - ZÖLD SZÍNVILÁG */}
        <div className="bg-green-50 rounded-lg p-6 border border-green-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-2xl mr-3">✅</span>
              <div>
                <h3 className="text-lg font-medium text-green-900">
                  Rendszer Állapot: Működőképes
                </h3>
                <p className="text-green-700 mt-1">
                  MooTracker v8.4 - Modern Design System aktív, Emoji ikonok, Zöld színvilág
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Link
                href="/dashboard/animals"
                className="bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-3 rounded-lg transition-colors inline-flex items-center"
              >
                <span className="mr-2">🐄</span>
                Állomány
              </Link>
              <Link
                href="/dashboard/pens"
                className="bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-3 rounded-lg transition-colors inline-flex items-center"
              >
                <span className="mr-2">🏠</span>
                Karamok
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}