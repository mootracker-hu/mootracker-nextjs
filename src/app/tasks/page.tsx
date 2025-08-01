// src/app/dashboard/tasks/page.tsx
'use client';

import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Calendar, 
  Plus,
  Filter,
  RefreshCw,
  AlertCircle,
  Edit,
  Trash2,
  Eye,
  Square
} from 'lucide-react';

import { useAlertsNew } from '@/hooks/useAlertsNew';
import { useTasks } from '@/hooks/useTasks';
import { 
  Alert, 
  AlertPriority, 
  AlertType,
  TaskStatus,
  TaskPriority,
  TaskCategory,
  CreateTaskRequest
} from '@/types/alert-task-types';

const TasksPage: React.FC = () => {
  // ============================================
  // HOOKS
  // ============================================
  
  const { 
  alerts, 
  loading: alertsLoading, 
  error: alertsError, 
  refreshAlerts,
  resolveAlert,
  createTaskFromAlert
} = useAlertsNew();

const alertStats = {
  aktiv: alerts.filter(a => !a.is_resolved).length,
  kritikus: alerts.filter(a => a.priority === 'kritikus').length
};

  const {
    tasks,
    loading: tasksLoading,
    error: tasksError,
    createTask,
    updateTask,
    deleteTask,
    completeTask,
    taskStats
  } = useTasks();

  // ============================================
  // STATE
  // ============================================
  
  const [filters, setFilters] = useState({
    priority: [] as AlertPriority[],
    type: [] as AlertType[],
    search: '',
    showResolved: false
  });
  
  const [showFilters, setShowFilters] = useState(false);
  const [showNewTaskForm, setShowNewTaskForm] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  
  const [newTaskData, setNewTaskData] = useState({
    title: '',
    description: '',
    priority: 'kozepes' as TaskPriority,
    category: 'altalanos' as TaskCategory,
    due_date: '',
    action_required: ''
  });

  // ============================================
  // COMPUTED VALUES
  // ============================================
  
  const filteredAlerts = React.useMemo(() => {
    let filtered = alerts.filter(alert => {
      if (!filters.showResolved && alert.is_resolved) return false;
      if (filters.priority.length > 0 && !filters.priority.includes(alert.priority)) return false;
      if (filters.type.length > 0 && !filters.type.includes(alert.type)) return false;
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        return alert.title.toLowerCase().includes(searchLower) ||
               alert.description.toLowerCase().includes(searchLower) ||
               (alert.animal?.enar || '').toLowerCase().includes(searchLower);
      }
      return true;
    });

    // Magyar prioritás szerinti rendezés
    filtered.sort((a, b) => {
      const priorityOrder: Record<AlertPriority, number> = { 
        'surgos': 5, 
        'kritikus': 4, 
        'magas': 3, 
        'kozepes': 2, 
        'alacsony': 1 
      };
      
      const aPriority = priorityOrder[a.priority] || 1;
      const bPriority = priorityOrder[b.priority] || 1;
      
      if (aPriority !== bPriority) return bPriority - aPriority;
      
      if (a.due_date && b.due_date) {
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      }
      
      return 0;
    });

    return filtered;
  }, [alerts, filters]);

  const recentTasks = tasks
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10);

  // ============================================
  // HELPER FUNCTIONS
  // ============================================
  
  const getPriorityColor = (priority: AlertPriority | TaskPriority) => {
    switch (priority) {
      case 'kritikus':
      case 'surgos': 
        return 'bg-red-100 text-red-800 border-red-200';
      case 'magas': 
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'kozepes': 
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'alacsony': 
        return 'bg-green-100 text-green-800 border-green-200';
      default: 
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityIcon = (priority: AlertPriority | TaskPriority) => {
    switch (priority) {
      case 'kritikus':
      case 'surgos': 
        return <AlertTriangle className="w-4 h-4" />;
      case 'magas': 
        return <AlertCircle className="w-4 h-4" />;
      case 'kozepes': 
        return <Clock className="w-4 h-4" />;
      case 'alacsony': 
        return <CheckCircle2 className="w-4 h-4" />;
      default: 
        return <Clock className="w-4 h-4" />;
    }
  };

  const getTaskStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case 'befejezve': 
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'folyamatban': 
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'fuggőben': 
        return <Square className="w-4 h-4 text-gray-400" />;
      default: 
        return <Square className="w-4 h-4 text-gray-400" />;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Nincs határidő';
    
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Ma';
    if (diffDays === 1) return 'Holnap';
    if (diffDays === -1) return 'Tegnap';
    if (diffDays < 0) return `${Math.abs(diffDays)} napja lejárt`;
    if (diffDays <= 7) return `${diffDays} nap múlva`;
    
    return date.toLocaleDateString('hu-HU');
  };

  const getPriorityLabel = (priority: AlertPriority | TaskPriority) => {
    const labels: Record<string, string> = {
      'kritikus': 'Kritikus',
      'surgos': 'Sürgős',
      'magas': 'Magas',
      'kozepes': 'Közepes',
      'alacsony': 'Alacsony'
    };
    return labels[priority] || priority;
  };

  const getStatusLabel = (status: TaskStatus) => {
    const labels: Record<TaskStatus, string> = {
      'befejezve': 'Befejezve',
      'folyamatban': 'Folyamatban',
      'fuggőben': 'Függőben',
      'torolve': 'Törölve'
    };
    return labels[status] || status;
  };

  // ============================================
  // EVENT HANDLERS
  // ============================================
  
  // ✅ JAVÍTOTT:
const handleCreateTaskFromAlert = async (alert: Alert) => {
  try {
    const taskId = await createTaskFromAlert(alert);
    console.log(`✅ Task létrehozva: ${taskId} alert-ből: ${alert.id}`);
  } catch (error) {
    console.error('Task létrehozási hiba:', error);
    window.alert('Hiba történt a task létrehozása során!');  // ← window.alert()
  }
};

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

  const handleDeleteTask = async (taskId: string) => {
    if (confirm('Biztosan törölni szeretnéd ezt a feladatot?')) {
      try {
        await deleteTask(taskId);
      } catch (error) {
        console.error('Task törlési hiba:', error);
      }
    }
  };

  // ============================================
  // LOADING STATES
  // ============================================
  
  if (alertsLoading || tasksLoading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-3 text-lg">Adatok betöltése...</span>
        </div>
      </div>
    );
  }

  if (alertsError || tasksError) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            <h3 className="ml-3 text-lg font-medium text-red-900">Hiba történt</h3>
          </div>
          <p className="mt-2 text-red-700">{alertsError || tasksError}</p>
          <button
            onClick={() => {
              refreshAlerts();
              window.location.reload();
            }}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Újrapróbálkozás
          </button>
        </div>
      </div>
    );
  }

  // ============================================
  // RENDER
  // ============================================
  
  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Riasztások és Feladatok</h1>
          <p className="text-gray-600 mt-1">
            {filteredAlerts.length} riasztás | {recentTasks.length} feladat
          </p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={refreshAlerts}
            disabled={alertsLoading}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${alertsLoading ? 'animate-spin' : ''}`} />
            Frissítés
          </button>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Filter className="w-4 h-4" />
            Szűrők
          </button>
          
          <button 
            onClick={() => setShowNewTaskForm(!showNewTaskForm)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Új feladat
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Aktív Riasztások</p>
              <p className="text-2xl font-bold text-gray-900">{alertStats?.aktiv || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Kritikus</p>
              <p className="text-2xl font-bold text-gray-900">{alertStats?.kritikus || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Square className="w-5 h-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Függő Feladatok</p>
              <p className="text-2xl font-bold text-gray-900">{taskStats?.fuggőben || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Folyamatban</p>
              <p className="text-2xl font-bold text-gray-900">{taskStats?.folyamatban || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Keresés</label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                placeholder="Cím, leírás, ENAR..."
                className="w-full p-2 border border-gray-300 rounded-lg"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Prioritás</label>
              <select
                multiple
                value={filters.priority}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  priority: Array.from(e.target.selectedOptions, option => option.value as AlertPriority)
                }))}
                className="w-full p-2 border border-gray-300 rounded-lg"
              >
                <option value="kritikus">Kritikus</option>
                <option value="surgos">Sürgős</option>
                <option value="magas">Magas</option>
                <option value="kozepes">Közepes</option>
                <option value="alacsony">Alacsony</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Beállítások</label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.showResolved}
                  onChange={(e) => setFilters(prev => ({ ...prev, showResolved: e.target.checked }))}
                  className="mr-2"
                />
                Befejezett riasztások mutatása
              </label>
            </div>
          </div>
        </div>
      )}

      {/* New Task Form */}
      {showNewTaskForm && (
        <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Új feladat hozzáadása</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cím *</label>
              <input
                type="text"
                value={newTaskData.title}
                onChange={(e) => setNewTaskData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-lg"
                placeholder="Feladat címe..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Prioritás</label>
              <select
                value={newTaskData.priority}
                onChange={(e) => setNewTaskData(prev => ({ ...prev, priority: e.target.value as TaskPriority }))}
                className="w-full p-2 border border-gray-300 rounded-lg"
              >
                <option value="alacsony">Alacsony</option>
                <option value="kozepes">Közepes</option>
                <option value="magas">Magas</option>
                <option value="kritikus">Kritikus</option>
              </select>
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Leírás</label>
              <textarea
                value={newTaskData.description}
                onChange={(e) => setNewTaskData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-lg h-20"
                placeholder="Feladat leírása..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Teendő *</label>
              <input
                type="text"
                value={newTaskData.action_required}
                onChange={(e) => setNewTaskData(prev => ({ ...prev, action_required: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-lg"
                placeholder="Mit kell csinálni..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Határidő</label>
              <input
                type="date"
                value={newTaskData.due_date ? newTaskData.due_date.split('T')[0] : ''}
                onChange={(e) => setNewTaskData(prev => ({ 
                  ...prev, 
                  due_date: e.target.value ? new Date(e.target.value).toISOString() : '' 
                }))}
                className="w-full p-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
          
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleCreateNewTask}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Létrehozás
            </button>
            <button
              onClick={() => setShowNewTaskForm(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Mégse
            </button>
          </div>
        </div>
      )}

      {/* Main Content - Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Alerts Column */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            Riasztások ({filteredAlerts.length})
          </h2>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredAlerts.map(alert => (
              <div 
                key={alert.id} 
                className={`p-3 rounded-lg border ${getPriorityColor(alert.priority)} hover:shadow-sm transition-shadow`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2 flex-1">
                    {getPriorityIcon(alert.priority)}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{alert.title}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        {alert.animal?.enar || 'N/A'}
                        {alert.due_date && ` • ${formatDate(alert.due_date)}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button 
                      className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200 transition-colors"
                      onClick={() => handleCreateTaskFromAlert(alert)}
                    >
                      Task
                    </button>
                    <button 
                      className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded hover:bg-green-200 transition-colors"
                      onClick={() => resolveAlert(alert.id)}
                    >
                      Befejez
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {filteredAlerts.length === 0 && (
            <div className="text-center py-8">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-2" />
              <p className="text-gray-600">Nincsenek aktív riasztások</p>
            </div>
          )}
        </div>

        {/* Tasks Column */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Square className="w-5 h-5 text-blue-500" />
            Feladatok ({recentTasks.length})
          </h2>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {recentTasks.map(task => (
              <div 
                key={task.id}
                className={`p-3 rounded-lg border ${getPriorityColor(task.priority)} hover:shadow-sm transition-shadow`}
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
                          {formatDate(task.due_date)}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          task.status === 'befejezve' ? 'bg-green-100 text-green-800' :
                          task.status === 'folyamatban' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
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
          
          {recentTasks.length === 0 && (
            <div className="text-center py-8">
              <Square className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-600">Nincsenek feladatok</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TasksPage;