'use client';

import Link from 'next/link';
import { useState } from 'react';
import { EnhancedAlertActionPanel } from '@/components/EnhancedAlertActionPanel';
import {
  Users,
  FileSpreadsheet,
  Home,
  TrendingUp,
  Calendar,
  Heart,
  Settings,
  PlusCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  CheckSquare,
  Square,
  MoreHorizontal,
  Edit,
  Trash2
} from 'lucide-react';

// Alert és Task rendszer
import { usePenAlerts } from '@/app/dashboard/pens/hooks/usePenAlerts';
import { useTasks } from '@/hooks/useTasks';
import { CreateTaskRequest, TaskPriority, TaskCategory, TaskStatus } from '@/types/alert-task-types';

export default function DashboardPage() {
  // Alert rendszer - Pen Alerts használata
  const { alerts, loading: alertsLoading, error: alertsError } = usePenAlerts();

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
    kritikus: alerts?.filter(a => a.priority === 4)?.length || 0,
    magas: alerts?.filter(a => a.priority === 3)?.length || 0,
    kozepes: alerts?.filter(a => a.priority === 2)?.length || 0,
    alacsony: alerts?.filter(a => a.priority === 1)?.length || 0,
    lejart: alerts?.filter(a => a.dueDate && new Date(a.dueDate) < new Date())?.length || 0
  };

  // ✅ PEN ALERTS FORMÁTUM ÁTALAKÍTÁSA DASHBOARD FORMÁTUMRA
  const recentAlerts = (alerts || [])
    .filter((penAlert: any) => {
      // ❌ Üres karám riasztások kiszűrése
      return penAlert.alertType !== 'pen_empty' &&
        penAlert.alertType !== 'pen_underutilized' &&
        penAlert.alertType !== 'cleaning';
    })
    .map(penAlert => ({
      id: penAlert.id,
      type: penAlert.alertType,
      priority: penAlert.priority === 4 ? 'kritikus' :
        penAlert.priority === 3 ? 'magas' :
          penAlert.priority === 2 ? 'kozepes' : 'alacsony',
      title: penAlert.title,
      description: penAlert.message,
      due_date: penAlert.dueDate,
      is_resolved: false,
      animal: {
        enar: penAlert.affectedAnimals?.[0] || 'N/A'
      },
      penNumber: penAlert.penNumber,
      animalCount: penAlert.animalCount,
      related_task_id: undefined
    }))
    .slice(0, 5);

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
      'maintenance_due': 'Karbantartás esedékes'
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

  const getAlertIcon = (priority: string) => {
    switch (priority) {
      case 'kritikus': return <AlertTriangle className="w-4 h-4 text-rose-600" />;
      case 'surgos': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'magas': return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case 'kozepes': return <Clock className="w-4 h-4 text-yellow-600" />;
      default: return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
    }
  };

  const getAlertColor = (priority: string) => {
    switch (priority) {
      case 'kritikus': return 'bg-rose-50 border-rose-200 hover:bg-rose-100';
      case 'surgos': return 'bg-red-50 border-red-200 hover:bg-red-100';
      case 'magas': return 'bg-amber-50 border-amber-200 hover:bg-amber-100';
      case 'kozepes': return 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100';
      default: return 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100';
    }
  };

  const getTaskStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case 'befejezve': return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'folyamatban': return <Clock className="w-4 h-4 text-yellow-600" />;
      default: return <Square className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTaskColor = (priority: TaskPriority) => {
    switch (priority) {
      case 'kritikus': return 'bg-rose-50 border-rose-200 hover:bg-rose-100';
      case 'magas': return 'bg-amber-50 border-amber-200 hover:bg-amber-100';
      case 'kozepes': return 'bg-cyan-50 border-cyan-200 hover:bg-cyan-100';
      default: return 'bg-slate-50 border-slate-200 hover:bg-slate-100';
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
      title: 'Riasztások és Feladatok',
      description: 'Aktív riasztások és teendők kezelése',
      href: '/dashboard/tasks',
      icon: AlertTriangle,
      color: 'bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700'
    },
    {
      title: 'Új Állat Hozzáadása',
      description: 'Új állat rögzítése a rendszerben',
      href: '/dashboard/animals/add',
      icon: PlusCircle,
      color: 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700'
    },
    {
      title: 'Karám Kezelés',
      description: 'Karamok és állatok áttekintése',
      href: '/dashboard/pens',
      icon: Home,
      color: 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700'
    },
    {
      title: 'Állomány Áttekintés',
      description: 'Teljes állomány listázása és keresés',
      href: '/dashboard/animals',
      icon: Users,
      color: 'bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700'
    }
  ];

  return (
    <div className="space-y-6 px-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          MooTracker - Szarvasmarha Management Rendszer
        </p>
      </div>

      {/* 🔘 KEREK GOMBOK - MAGYAR Alert Számlálók */}
      {!alertsLoading && !alertsError && (
        <div className="flex justify-center gap-4 mb-6">
          {/* Összes - Deep Blue → Vibrant Purple */}
          <div className="bg-purple-600 text-white rounded-full w-16 h-16 flex flex-col items-center justify-center shadow-lg">
            <div className="text-xl font-bold">{alertStats.osszes}</div>
            <div className="text-xs">Összes</div>
          </div>
          {/* Aktív - Green → Emerald */}
          <div className="bg-emerald-500 text-white rounded-full w-16 h-16 flex flex-col items-center justify-center shadow-lg">
            <div className="text-xl font-bold">{alertStats.aktiv}</div>
            <div className="text-xs">Aktív</div>
          </div>
          {/* Kritikus - Red → Rose */}
          <div className="bg-rose-500 text-white rounded-full w-16 h-16 flex flex-col items-center justify-center shadow-lg">
            <div className="text-xl font-bold">{alertStats.kritikus}</div>
            <div className="text-xs">Kritikus</div>
          </div>
          {/* Magas - Orange → Amber */}
          <div className="bg-amber-500 text-white rounded-full w-16 h-16 flex flex-col items-center justify-center shadow-lg">
            <div className="text-xl font-bold">{alertStats.magas}</div>
            <div className="text-xs">Magas</div>
          </div>
          {/* Lejárt - Purple → Indigo */}
          <div className="bg-indigo-500 text-white rounded-full w-16 h-16 flex flex-col items-center justify-center shadow-lg">
            <div className="text-xl font-bold">{alertStats.lejart}</div>
            <div className="text-xs">Lejárt</div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Összes Állat - Green → Teal */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-teal-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Összes Állat</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalAnimals}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="h-8 w-8 text-cyan-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Aktív Állat</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeAnimals}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Heart className="h-8 w-8 text-rose-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Vemhes Tehén</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pregnantCows}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Calendar className="h-8 w-8 text-violet-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Aktív Feladat</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingTasks}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Gyors Műveletek</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.title}
              href={action.href}
              className={`${action.color} text-white rounded-lg p-4 transition-colors duration-200`}
            >
              <div className="flex items-center space-x-3">
                <action.icon className="h-6 w-6" />
                <div>
                  <h3 className="font-medium">{action.title}</h3>
                  <p className="text-sm opacity-90 mt-1">{action.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* 📋 KÉTOSZLOPOS LAYOUT - Riasztások és Feladatok */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* BAL OSZLOP - RIASZTÁSOK (PEN ALERTS) */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Riasztások
            </h2>
            <Link
              href="/dashboard/tasks"
              className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm"
            >
              Összes <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {alertsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Betöltés...</span>
            </div>
          ) : alertsError ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <span className="ml-2 text-red-800 text-sm">Hiba: {alertsError}</span>
              </div>
            </div>
          ) : recentAlerts.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {recentAlerts.map(alert => (
                <div
                  key={alert.id}
                  className={`rounded-lg border ${getAlertColor(alert.priority)} hover:shadow-sm transition-shadow`}
                >
                  {/* ✅ ALERT TARTALOM */}
                  <div className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-2 flex-1">
                        {getAlertIcon(alert.priority)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${alert.priority === 'kritikus' ? 'bg-rose-100 text-rose-800' :
                              alert.priority === 'surgos' ? 'bg-red-100 text-red-800' :
                                alert.priority === 'magas' ? 'bg-amber-100 text-amber-800' :
                                  alert.priority === 'kozepes' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-emerald-100 text-emerald-800'
                              }`}>
                              {getPriorityLabel(alert.priority)}
                            </span>

                            {alert.penNumber && (
                              <span className="text-xs text-gray-500">
                                Karám: {alert.penNumber}
                              </span>
                            )}
                            {alert.animalCount && (
                              <span className="text-xs text-gray-500">
                                {alert.animalCount} állat
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-medium text-gray-900">
                            {getAlertTypeLabel(alert.type)}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            {alert.description}
                            {alert.due_date && ` • ${new Date(alert.due_date).toLocaleDateString('hu-HU')}`}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ✅ ENHANCED ALERT ACTION PANEL */}
                  <EnhancedAlertActionPanel
                    alert={alert}
                    onCreateTask={handleCreateTaskFromAlert}
                    onSnoozeAlert={snoozeAlert}
                    onResolveAlert={resolveAlert}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-2" />
              <p className="text-gray-600">Nincsenek aktív riasztások</p>
            </div>
          )}
        </div>

        {/* JOBB OSZLOP - FELADATOK */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-violet-500" />
              Feladatok
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => setShowNewTaskForm(!showNewTaskForm)}
                className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm"
              >
                <PlusCircle className="w-4 h-4" />
                Új
              </button>
              <Link
                href="/dashboard/tasks"
                className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm"
              >
                Összes <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Új feladat form */}
          {showNewTaskForm && (
            <div className="mb-4 p-4 bg-gray-50 rounded-lg border">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Új feladat hozzáadása</h3>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Feladat címe..."
                  value={newTaskData.title}
                  onChange={(e) => setNewTaskData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full p-2 text-sm border border-gray-300 rounded"
                />
                <textarea
                  placeholder="Leírás..."
                  value={newTaskData.description}
                  onChange={(e) => setNewTaskData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full p-2 text-sm border border-gray-300 rounded h-16"
                />
                <input
                  type="text"
                  placeholder="Teendő..."
                  value={newTaskData.action_required}
                  onChange={(e) => setNewTaskData(prev => ({ ...prev, action_required: e.target.value }))}
                  className="w-full p-2 text-sm border border-gray-300 rounded"
                />
                <div className="flex gap-2">
                  <select
                    value={newTaskData.priority}
                    onChange={(e) => setNewTaskData(prev => ({ ...prev, priority: e.target.value as TaskPriority }))}
                    className="p-2 text-sm border border-gray-300 rounded"
                  >
                    <option value="alacsony">Alacsony</option>
                    <option value="kozepes">Közepes</option>
                    <option value="magas">Magas</option>
                    <option value="kritikus">Kritikus</option>
                  </select>
                  <input
                    type="date"
                    value={newTaskData.due_date ? newTaskData.due_date.split('T')[0] : ''}
                    onChange={(e) => setNewTaskData(prev => ({ ...prev, due_date: e.target.value ? new Date(e.target.value).toISOString() : '' }))}
                    className="p-2 text-sm border border-gray-300 rounded"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleCreateNewTask}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Létrehozás
                  </button>
                  <button
                    onClick={() => setShowNewTaskForm(false)}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                  >
                    Mégse
                  </button>
                </div>
              </div>
            </div>
          )}

          {tasksLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Betöltés...</span>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {recentTasks.map(task => (
                <div
                  key={task.id}
                  className={`p-3 rounded-lg border ${getTaskColor(task.priority)} hover:shadow-sm transition-shadow`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2 flex-1">
                      <button
                        onClick={() => handleTaskStatusChange(task.id, task.status)}
                        className="mt-0.5"
                      >
                        {getTaskStatusIcon(task.status)}
                      </button>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{task.title}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-gray-600">
                            {task.due_date ? new Date(task.due_date).toLocaleDateString('hu-HU') : 'Nincs határidő'}
                          </span>
                          {task.alert_id && (
                            <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                              Auto
                            </span>
                          )}
                          <span className={`text-xs px-2 py-0.5 rounded-full ${task.status === 'befejezve' ? 'bg-emerald-100 text-emerald-800' :
                            task.status === 'folyamatban' ? 'bg-amber-100 text-amber-800' :
                              'bg-slate-100 text-slate-800'
                            }`}>
                            {getStatusLabel(task.status)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button className="text-xs text-gray-500 hover:text-gray-700 p-1">
                        <Edit className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="text-xs text-gray-500 hover:text-red-600 p-1"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Új feladat hozzáadása gomb */}
          {!showNewTaskForm && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={() => setShowNewTaskForm(true)}
                className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
              >
                <PlusCircle className="w-5 h-5" />
                Új feladat hozzáadása
              </button>
            </div>
          )}
        </div>
      </div>

      {/* System Status */}
      <div className="bg-green-50 rounded-lg p-6 border border-green-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-medium text-green-900">
              Rendszer Állapot: Működőképes
            </h3>
            <p className="text-green-700 mt-1">
              MooTracker v8.3 - Pen Alerts rendszer aktív Enhanced Action Panel-lel.
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-4 flex gap-2">
            <Link
              href="/dashboard/animals"
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
            >
              Állomány →
            </Link>
            <Link
              href="/dashboard/pens"
              className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition-colors"
            >
              Karamok →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}