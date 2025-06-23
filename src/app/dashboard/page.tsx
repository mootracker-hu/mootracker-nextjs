'use client';

import Link from 'next/link';
import { useState } from 'react';
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
import { useAlerts } from '@/hooks/useAlerts';
import { useTasks } from '@/hooks/useTasks';
import { CreateTaskRequest } from '@/types/alert-task-types';

export default function DashboardPage() {
  // Alert rendszer
  const { alerts, alertStats, loading: alertsLoading, error: alertsError, createTaskFromAlert } = useAlerts();

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
    priority: 'medium' as const,
    category: 'general' as const,
    due_date: '',
    action_required: ''
  });

  // Legutóbbi riasztások (top 5)
  const recentAlerts = alerts
    .filter(alert => !alert.is_resolved)
    .sort((a, b) => {
      const priorityOrder = { critical: 5, urgent: 4, high: 3, medium: 2, low: 1 };
      return (priorityOrder[b.priority] || 1) - (priorityOrder[a.priority] || 1);
    })
    .slice(0, 5);

  // Legutóbbi task-ok (top 5)
  const recentTasks = tasks
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  const getAlertIcon = (priority: string) => {
    switch (priority) {
      case 'critical': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'urgent': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'high': return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case 'medium': return <Clock className="w-4 h-4 text-yellow-600" />;
      default: return <CheckCircle2 className="w-4 h-4 text-green-600" />;
    }
  };

  const getAlertColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-50 border-red-200';
      case 'urgent': return 'bg-red-50 border-red-200';
      case 'high': return 'bg-orange-50 border-orange-200';
      case 'medium': return 'bg-yellow-50 border-yellow-200';
      default: return 'bg-green-50 border-green-200';
    }
  };

  const getTaskStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'in_progress': return <Clock className="w-4 h-4 text-yellow-600" />;
      default: return <Square className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTaskColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-50 border-red-200';
      case 'high': return 'bg-orange-50 border-orange-200';
      case 'medium': return 'bg-yellow-50 border-yellow-200';
      default: return 'bg-gray-50 border-gray-200';
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
        ...newTaskData,
        due_date: newTaskData.due_date || new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)).toISOString()
      };

      await createTask(taskData);

      // Form reset
      setNewTaskData({
        title: '',
        description: '',
        priority: 'medium',
        category: 'general',
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
  const handleTaskStatusChange = async (taskId: string, currentStatus: string) => {
    try {
      if (currentStatus === 'pending') {
        await updateTask(taskId, { status: 'in_progress' });
      } else if (currentStatus === 'in_progress') {
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
    pendingTasks: taskStats.pending + taskStats.in_progress
  };

  const quickActions = [
    {
      title: 'Riasztások és Feladatok',
      description: 'Aktív riasztások és teendők kezelése',
      href: '/dashboard/tasks',
      icon: AlertTriangle,
      color: 'bg-red-500 hover:bg-red-600'
    },
    {
      title: 'Új Állat Hozzáadása',
      description: 'Új állat rögzítése a rendszerben',
      href: '/dashboard/animals/add',
      icon: PlusCircle,
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      title: 'Karám Kezelés',
      description: 'Karamok és állatok áttekintése',
      href: '/dashboard/pens',
      icon: Home,
      color: 'bg-orange-500 hover:bg-orange-600'
    },
    {
      title: 'Állomány Áttekintés',
      description: 'Teljes állomány listázása és keresés',
      href: '/dashboard/animals',
      icon: Users,
      color: 'bg-purple-500 hover:bg-purple-600'
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

      {/* 🔘 KEREK GOMBOK - Alert Számlálók */}
      {!alertsLoading && !alertsError && (
        <div className="flex justify-center gap-4 mb-6">
          <div className="bg-blue-500 text-white rounded-full w-16 h-16 flex flex-col items-center justify-center">
            <div className="text-xl font-bold">{alertStats.total}</div>
            <div className="text-xs">Összes</div>
          </div>
          <div className="bg-green-500 text-white rounded-full w-16 h-16 flex flex-col items-center justify-center">
            <div className="text-xl font-bold">{alertStats.active}</div>
            <div className="text-xs">Aktív</div>
          </div>
          <div className="bg-red-500 text-white rounded-full w-16 h-16 flex flex-col items-center justify-center">
            <div className="text-xl font-bold">{alertStats.critical}</div>
            <div className="text-xs">Kritikus</div>
          </div>
          <div className="bg-orange-500 text-white rounded-full w-16 h-16 flex flex-col items-center justify-center">
            <div className="text-xl font-bold">{alertStats.high}</div>
            <div className="text-xs">Magas</div>
          </div>
          <div className="bg-purple-500 text-white rounded-full w-16 h-16 flex flex-col items-center justify-center">
            <div className="text-xl font-bold">{alertStats.overdue}</div>
            <div className="text-xs">Lejárt</div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Összes Állat</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalAnimals}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Aktív Állat</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeAnimals}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Heart className="h-8 w-8 text-pink-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Vemhes Tehén</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pregnantCows}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Calendar className="h-8 w-8 text-yellow-600" />
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

        {/* BAL OSZLOP - RIASZTÁSOK */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
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
                  className={`p-3 rounded-lg border ${getAlertColor(alert.priority)} hover:shadow-sm transition-shadow`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2 flex-1">
                      {getAlertIcon(alert.priority)}
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{alert.title}</p>
                        <p className="text-xs text-gray-600 mt-1">
                          {alert.animal.enar}
                          {alert.due_date && ` • ${new Date(alert.due_date).toLocaleDateString('hu-HU')}`}
                        </p>
                      </div>
                    </div>
                    <button
                      className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200 transition-colors"
                      onClick={() => handleCreateTaskFromAlert(alert)}
                      disabled={!!alert.related_task_id}
                    >
                      {alert.related_task_id ? 'Létrehozva' : 'Task'}
                    </button>
                  </div>
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
              <CheckSquare className="w-5 h-5 text-blue-500" />
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
                    onChange={(e) => setNewTaskData(prev => ({ ...prev, priority: e.target.value as any }))}
                    className="p-2 text-sm border border-gray-300 rounded"
                  >
                    <option value="low">Alacsony</option>
                    <option value="medium">Közepes</option>
                    <option value="high">Magas</option>
                    <option value="critical">Kritikus</option>
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
                          <span className={`text-xs px-2 py-0.5 rounded ${task.status === 'completed' ? 'bg-green-100 text-green-800' :
                              task.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                            }`}>
                            {task.status === 'pending' && 'Függő'}
                            {task.status === 'in_progress' && 'Folyamatban'}
                            {task.status === 'completed' && 'Kész'}
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

          {/* Új feladat hozzáadása gomb (ha nincs form) */}
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
              MooTracker v7.1 - Professzionális Karám Management és Alert rendszer aktív.
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