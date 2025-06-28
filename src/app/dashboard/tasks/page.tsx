'use client';

import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  CheckSquare, 
  Square, 
  Clock, 
  Calendar,
  Edit3,
  Trash2,
  Plus,
  Filter,
  RefreshCw,
  User,
  AlertCircle,
  CheckCircle2,
  ArrowUpRight,
  Settings,
  X,
  Eye
} from 'lucide-react';

// ✅ ÁLLAT-KÖZPONTÚ ALERTS HASZNÁLATA
import { useAlerts } from '@/hooks/useAlerts';
import { useTasks } from '@/hooks/useTasks';
import { Task, TaskPriority } from '@/types/alert-task-types';
import { supabase } from '@/lib/supabase';

const TasksPage = () => {
  // ✅ ÁLLAT ALERTS (helyes hook)
  const { 
    alerts: animalAlerts, 
    loading: animalAlertsLoading, 
    error: animalAlertsError,
    refreshAlerts,
    resolveAlert,
    createTaskFromAlert: createTaskFromAnimalAlert
  } = useAlerts();

  const { 
    tasks, 
    loading: tasksLoading, 
    createTask, 
    updateTask, 
    completeTask, 
    deleteTask, 
    taskStats 
  } = useTasks();

  // ✅ PROBLEM ALERTS (Supabase táblából) - Task problémák
  const [problemAlerts, setProblemAlerts] = useState<any[]>([]);
  const [problemAlertsLoading, setProblemAlertsLoading] = useState(true);

  // UI állapotok
  const [showNewTaskForm, setShowNewTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  
  const [newTaskData, setNewTaskData] = useState({
    title: '',
    description: '',
    priority: 'kozepes' as TaskPriority,
    action_required: '',
    due_date: ''
  });

  const [editTaskData, setEditTaskData] = useState({
    title: '',
    description: '',
    priority: 'kozepes' as TaskPriority,
    action_required: '',
    due_date: '',
    notes: ''
  });

  // ✅ PROBLEM ALERTS BETÖLTÉSE (Supabase)
  const loadProblemAlerts = async () => {
    try {
      setProblemAlertsLoading(true);
      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .eq('status', 'active')
        .eq('alert_type', 'task_problem')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Problem alerts loading error:', error);
        setProblemAlerts([]);
      } else {
        setProblemAlerts(data || []);
        console.log('✅ Problem alerts betöltve:', data?.length || 0);
      }
    } catch (error) {
      console.error('Problem alert loading error:', error);
      setProblemAlerts([]);
    } finally {
      setProblemAlertsLoading(false);
    }
  };

  // ✅ UNIFIED ALERTS KOMBINÁLÁSA
  const allAlerts = [
    ...(animalAlerts || []).map(alert => ({
      ...alert,
      source: 'animal',
      sourceLabel: 'Állat Alert'
    })),
    ...(problemAlerts || []).map(alert => ({
      ...alert,
      source: 'problem',
      sourceLabel: 'Probléma Alert'
    }))
  ];

  // ✅ LOADING STATE KOMBINÁLÁSA
  const alertsLoading = animalAlertsLoading || problemAlertsLoading;

  // ✅ COMPONENT MOUNT
  useEffect(() => {
    loadProblemAlerts();
  }, []);

  // ✅ DEBUG CONSOLE
  useEffect(() => {
    console.log('🔍 ALERTS DEBUG:', {
      animalAlerts: animalAlerts?.length || 0,
      problemAlerts: problemAlerts?.length || 0,
      totalAlerts: allAlerts.length,
      animalAlertsLoading,
      problemAlertsLoading,
      animalAlertsError
    });
  }, [animalAlerts, problemAlerts, animalAlertsLoading, problemAlertsLoading, animalAlertsError]);

  // 🔄 TASK STÁTUSZ VÁLTOZTATÁS
  const handleTaskStatusChange = async (taskId: string, currentStatus: string) => {
    try {
      if (currentStatus === 'fuggőben') {
        await updateTask(taskId, { status: 'folyamatban' });
      } else if (currentStatus === 'folyamatban') {
        await completeTask(taskId);
      } else if (currentStatus === 'befejezve') {
        await updateTask(taskId, { status: 'fuggőben' });
      }
    } catch (error) {
      console.error('Task státusz változtatási hiba:', error);
    }
  };

  // 📋 ALERT → TASK LÉTREHOZÁSA
  const handleCreateTaskFromAlert = async (alertId: string) => {
    const alert = allAlerts.find(a => a.id === alertId);
    if (!alert) return;

    try {
      if (alert.source === 'animal') {
        // ✅ ÁLLAT ALERT → TASK
        const taskId = await createTaskFromAnimalAlert(alert);
        
        const taskData = {
          title: alert.title,
          description: alert.description,
          priority: alert.priority === 'kritikus' ? 'kritikus' : 
                    alert.priority === 'magas' ? 'magas' : 
                    alert.priority === 'surgos' ? 'kritikus' :
                    'kozepes' as TaskPriority,
          category: 'altalanos' as any,
          action_required: alert.action_required || alert.description,
          due_date: alert.due_date || new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)).toISOString(),
          alert_id: alertId.toString(),
          animal_id: alert.animal_id
        };

        await createTask(taskData);
        
        // ✅ SUPABASE TASK-ALERT KAPCSOLAT MENTÉSE
        await supabase
          .from('task_alert_connections')
          .insert({
            task_id: parseInt(taskId.replace('task-', '')),
            alert_id: alertId,
            alert_type: 'animal',
            created_at: new Date().toISOString()
          });

        console.log(`✅ Task létrehozva animal alert-ből: ${alertId}`);
        await resolveAlert(alertId);
        
      } else if (alert.source === 'problem') {
        // ✅ PROBLEM ALERT → TASK
        const taskData = {
          title: alert.title.replace('PROBLÉMA: ', ''),
          description: alert.description,
          priority: alert.priority === 4 ? 'kritikus' : 
                    alert.priority === 3 ? 'magas' : 'kozepes' as TaskPriority,
          category: 'altalanos' as any,
          action_required: alert.action_required || alert.description,
          due_date: alert.due_date || new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)).toISOString(),
          alert_id: alertId.toString()
        };

        await createTask(taskData);
        
        // ✅ PROBLEM ALERT LEZÁRÁSA SUPABASE-BEN
        await supabase
          .from('alerts')
          .update({ status: 'resolved', resolved_at: new Date().toISOString() })
          .eq('id', alertId);

        await loadProblemAlerts();
        console.log(`✅ Task létrehozva problem alert-ből: ${alertId}`);
      }
    } catch (error) {
      console.error('Task létrehozási hiba:', error);
    }
  };

  // ⚠️ TASK → PROBLEM ALERT LÉTREHOZÁSA (Supabase)
  const handleCreateAlertFromTask = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const currentUrl = process.env.NODE_ENV === 'production' 
      ? 'https://mootracker-nextjs.vercel.app'
      : 'http://localhost:3000';
    
    const problemDescription = prompt(
      `Probléma jelentése: "${task.title}"\n\nMi a probléma? (pl. "Nem tudtam végrehajtani", "Állat beteg", "Hiányzik az eszköz")`,
      ""
    );

    if (!problemDescription || problemDescription.trim() === '') {
      return;
    }

    try {
      // ✅ SUPABASE-BE MENTÉS
      const alertData = {
        title: `PROBLÉMA: ${task.title}`,
        description: `Feladat végrehajtási probléma jelentve.\n\nEredeti feladat: "${task.title}"\nProbléma leírása: ${problemDescription}\n\nEredeti teendő: ${task.action_required || 'Nincs megadva'}`,
        alert_type: 'task_problem',
        priority: 4,
        status: 'active',
        animal_id: task.animal_id || null,
        pen_id: task.pen_id || null,
        related_task_id: parseInt(task.id),
        action_required: `Probléma megoldása: ${problemDescription}`,
        due_date: new Date(Date.now() + (1 * 24 * 60 * 60 * 1000)).toISOString(),
        metadata: {
          original_task_id: task.id,
          original_task_title: task.title,
          problem_description: problemDescription,
          reported_at: new Date().toISOString(),
          reporter: 'user'
        }
      };

      console.log('🔄 Problem alert mentése Supabase-be:', alertData);

      const { data: alertInsertData, error: alertError } = await supabase
        .from('alerts')
        .insert([alertData])
        .select('*')
        .single();

      if (alertError) {
        throw new Error(`Alert insert error: ${alertError.message}`);
      }

      console.log('✅ Problem alert sikeresen mentve Supabase-be:', alertInsertData);

      // ✅ TASK FRISSÍTÉSE
      await updateTask(taskId, {
        status: 'folyamatban',
        notes: `PROBLÉMA JELENTVE: ${problemDescription} (Alert ID: ${alertInsertData.id})`
      });

      // ✅ TASK-ALERT KAPCSOLAT MENTÉSE
      await supabase
        .from('task_alert_connections')
        .insert({
          task_id: parseInt(taskId),
          alert_id: alertInsertData.id.toString(),
          alert_type: 'problem',
          created_at: new Date().toISOString()
        });

      // ✅ FRISSÍTÉSEK
      await loadProblemAlerts();
      await refreshAlerts();

      alert(`✅ Probléma sikeresen mentve Supabase-be!\n\n🚨 Új kritikus alert:\n"${alertInsertData.title}"\n\n📋 Az alert megjelenik a riasztások közt.\n\n🔄 Feladat "folyamatban" státuszra változott.`);

    } catch (error) {
      console.error('❌ Problem alert mentési hiba:', error);
      const errorMessage = error instanceof Error ? error.message : 'Ismeretlen hiba történt';
      alert(`❌ Hiba történt az alert mentése során!\n\nHiba: ${errorMessage}\n\nPróbáld újra később.`);
    }
  };

  // ✏️ TASK SZERKESZTÉS
  const handleEditTask = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      setEditTaskData({
        title: task.title,
        description: task.description || '',
        priority: task.priority,
        action_required: task.action_required || '',
        due_date: task.due_date ? task.due_date.split('T')[0] : '',
        notes: task.notes || ''
      });
      setEditingTask(task);
    }
  };

  // 👁️ ALERT MEGTEKINTÉS
  const handleViewAlert = (alertId: string) => {
    const alert = allAlerts.find(a => a.id === alertId);
    if (alert) {
      setSelectedAlert(alert);
    }
  };

  // 👁️ TASK MEGTEKINTÉS
  const handleViewTask = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      setSelectedTask(task);
    }
  };

  // ✅ SZERKESZTETT TASK MENTÉSE (Supabase)
  const handleSaveEditedTask = async () => {
    if (!editingTask) return;

    try {
      await updateTask(editingTask.id, {
        title: editTaskData.title,
        description: editTaskData.description,
        priority: editTaskData.priority,
        action_required: editTaskData.action_required,
        due_date: editTaskData.due_date ? new Date(editTaskData.due_date).toISOString() : undefined,
        notes: editTaskData.notes
      });

      // ✅ TASK MÓDOSÍTÁS LOG MENTÉSE SUPABASE-BE
      await supabase
        .from('task_modifications')
        .insert({
          task_id: parseInt(editingTask.id),
          modification_type: 'edit',
          old_data: editingTask,
          new_data: editTaskData,
          modified_by: 'user',
          modified_at: new Date().toISOString()
        });

      setEditingTask(null);
      console.log('✅ Task sikeresen frissítve és mentve Supabase-be');
    } catch (error) {
      console.error('Task frissítési hiba:', error);
      alert('Hiba történt a task frissítése során!');
    }
  };

  // 📋 ÚJ TASK LÉTREHOZÁSA (Supabase)
  const handleCreateNewTask = async () => {
    if (!newTaskData.title || !newTaskData.action_required) {
      alert('Cím és teendő megadása kötelező!');
      return;
    }

    try {
      const taskData = {
        title: newTaskData.title,
        description: newTaskData.description,
        priority: newTaskData.priority,
        category: 'altalanos' as any,
        action_required: newTaskData.action_required,
        due_date: newTaskData.due_date ? new Date(newTaskData.due_date).toISOString() : 
                  new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)).toISOString()
      };

      await createTask(taskData);
      
      // ✅ MANUÁLIS TASK LÉTREHOZÁS LOG MENTÉSE SUPABASE-BE
      await supabase
        .from('manual_task_creations')
        .insert({
          task_data: taskData,
          created_by: 'user',
          created_at: new Date().toISOString(),
          source: 'manual_form'
        });
      
      setNewTaskData({
        title: '',
        description: '',
        priority: 'kozepes',
        action_required: '',
        due_date: ''
      });
      setShowNewTaskForm(false);
      
      console.log('✅ Új task sikeresen létrehozva és mentve Supabase-be');
    } catch (error) {
      console.error('Task létrehozási hiba:', error);
      alert('Hiba történt a task létrehozása során!');
    }
  };

  // 🗑️ TÖRLÉS KEZELÉSE (Supabase logging)
  const handleDelete = async (itemId: string, itemType: string) => {
    if (itemType === 'task') {
      if (confirm('Biztosan törölni szeretnéd ezt a feladatot?')) {
        try {
          // ✅ TÖRLÉS LOG MENTÉSE TÖRLÉS ELŐTT
          const taskToDelete = tasks.find(t => t.id === itemId);
          await supabase
            .from('task_deletions')
            .insert({
              task_id: parseInt(itemId),
              task_data: taskToDelete,
              deleted_by: 'user',
              deleted_at: new Date().toISOString(),
              reason: 'manual_deletion'
            });

          await deleteTask(itemId);
          console.log('✅ Task törölve és mentve Supabase-be');
        } catch (error) {
          console.error('Task törlési hiba:', error);
        }
      }
    } else if (itemType === 'alert') {
      const alert = allAlerts.find(a => a.id === itemId);
      if (confirm(`Biztosan lezárod ezt a riasztást: "${alert?.title}"?`)) {
        try {
          if (alert?.source === 'animal') {
            // ✅ ÁLLAT ALERT LEZÁRÁSA + LOG
            await resolveAlert(itemId);
            await supabase
              .from('alert_resolutions')
              .insert({
                alert_id: itemId,
                alert_type: 'animal',
                resolved_by: 'user',
                resolved_at: new Date().toISOString(),
                resolution_method: 'manual'
              });
          } else if (alert?.source === 'problem') {
            // ✅ PROBLEM ALERT LEZÁRÁSA + LOG
            await supabase
              .from('alerts')
              .update({ status: 'resolved', resolved_at: new Date().toISOString() })
              .eq('id', itemId);
            
            await supabase
              .from('alert_resolutions')
              .insert({
                alert_id: itemId,
                alert_type: 'problem',
                resolved_by: 'user',
                resolved_at: new Date().toISOString(),
                resolution_method: 'manual'
              });

            await loadProblemAlerts();
          }
          console.log('✅ Alert lezárva és mentve Supabase-be');
        } catch (error) {
          console.error('Alert lezárási hiba:', error);
        }
      }
    }
  };

  // 🎨 UI HELPER FUNKCIÓK
  const getPriorityColor = (priority: string | number) => {
    const priorityNum = typeof priority === 'string' ? 
      ({ 'kritikus': 4, 'surgos': 4, 'magas': 3, 'kozepes': 2, 'alacsony': 1 }[priority] || 2) : 
      priority;
    
    switch (priorityNum) {
      case 4: return 'bg-rose-100 text-rose-800 border-rose-200';
      case 3: return 'bg-amber-100 text-amber-800 border-amber-200';
      case 2: return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'befejezve': return 'bg-emerald-100 text-emerald-800';
      case 'folyamatban': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'befejezve': return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'folyamatban': return <Clock className="w-4 h-4 text-blue-600" />;
      default: return <Square className="w-4 h-4 text-gray-400" />;
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Nincs határidő';
    try {
      return new Date(dateString).toLocaleDateString('hu-HU');
    } catch {
      return 'Nincs határidő';
    }
  };

  const getDaysUntilDue = (dateString: string | undefined) => {
    if (!dateString) return null;
    try {
      const due = new Date(dateString);
      const today = new Date();
      const diffTime = due.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch {
      return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* 📊 HEADER */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Riasztások és Feladatok</h1>
            <p className="text-gray-600 mt-1">
              Állat-központú riasztás kezelés és feladat menedzsment - Minden mentés Supabase-be
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={async () => {
                console.log('🔍 DEBUG INFO:');
                console.log('Animal alerts:', animalAlerts?.length || 0);
                console.log('Problem alerts:', problemAlerts?.length || 0);
                console.log('Total alerts:', allAlerts.length);
                console.log('Tasks:', tasks.length);
                await refreshAlerts();
                await loadProblemAlerts();
              }}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Frissítés
            </button>
            <button
              onClick={() => setShowNewTaskForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Új Feladat
            </button>
          </div>
        </div>

        {/* 📊 STATS KÁRTYÁK */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Összes Riasztás</p>
                <p className="text-2xl font-bold text-orange-600">{allAlerts.length}</p>
                <p className="text-xs text-gray-500">Állat: {animalAlerts?.length || 0} | Probléma: {problemAlerts.length}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Függő Feladatok</p>
                <p className="text-2xl font-bold text-cyan-600">{taskStats?.fuggőben || 0}</p>
              </div>
              <CheckSquare className="w-8 h-8 text-cyan-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Folyamatban</p>
                <p className="text-2xl font-bold text-blue-600">{taskStats?.folyamatban || 0}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Befejezett</p>
                <p className="text-2xl font-bold text-emerald-600">{taskStats?.befejezve || 0}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
          </div>
        </div>
      </div>

      {/* 🚨 RIASZTÁSOK SZAKASZ - UNIFIED ALERTS */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="w-6 h-6 text-orange-600" />
          <h2 className="text-xl font-bold text-gray-900">Riasztások</h2>
          <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-sm font-medium">
            {allAlerts.length}
          </span>
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
            Állat: {animalAlerts?.length || 0}
          </span>
          <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">
            Probléma: {problemAlerts.length}
          </span>
        </div>

        <div className="space-y-3">
          {alertsLoading ? (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <RefreshCw className="w-6 h-6 animate-spin text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">Riasztások betöltése...</p>
            </div>
          ) : animalAlertsError ? (
            <div className="bg-red-100 rounded-lg border border-red-200 p-4">
              <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <span className="ml-2 text-red-800">Hiba: {animalAlertsError}</span>
              </div>
            </div>
          ) : allAlerts.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nincsenek aktív riasztások</h3>
              <p className="text-gray-600">Minden állat a megfelelő szakaszban van és nincsenek problémák!</p>
            </div>
          ) : (
            allAlerts.map((alert) => {
              const daysUntil = getDaysUntilDue(alert.due_date);
              const isOverdue = daysUntil !== null && daysUntil < 0;
              const isDueSoon = daysUntil !== null && daysUntil <= 3 && daysUntil >= 0;

              return (
                <div
                  key={`alert-${alert.source}-${alert.id}`}
                  className={`bg-white rounded-lg border transition-all hover:shadow-md ${
                    isOverdue ? 'border-red-300 bg-red-50' : 
                    isDueSoon ? 'border-amber-300 bg-amber-50' : 
                    'border-gray-200'
                  }`}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <AlertTriangle className="w-5 h-5 text-orange-500 mt-1" />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <h3 className="font-medium text-gray-900 truncate">{alert.title}</h3>
                            
                            <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(alert.priority)}`}>
                              {alert.priority === 'kritikus' || alert.priority === 4 ? 'Kritikus' : 
                               alert.priority === 'surgos' ? 'Sürgős' :
                               alert.priority === 'magas' || alert.priority === 3 ? 'Magas' : 
                               alert.priority === 'kozepes' || alert.priority === 2 ? 'Közepes' : 'Alacsony'}
                            </span>
                            
                            {alert.animal?.enar && (
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                {alert.animal.enar}
                              </span>
                            )}

                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              alert.source === 'animal' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {alert.sourceLabel}
                            </span>
                          </div>

                          <p className="text-sm text-gray-600 mb-2">{alert.description}</p>

                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(alert.due_date)}
                              {daysUntil !== null && (
                                <span className={`ml-1 ${isOverdue ? 'text-red-600' : isDueSoon ? 'text-amber-600' : ''}`}>
                                  ({daysUntil > 0 ? `${daysUntil} nap múlva` : 
                                    daysUntil === 0 ? 'Ma esedékes' : 
                                    `${Math.abs(daysUntil)} napja lejárt`})
                                </span>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 🛠️ ALERT ACTION BUTTONS */}
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => handleViewAlert(alert.id)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                          title="Részletek megtekintése"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleCreateTaskFromAlert(alert.id)}
                          className="p-2 text-violet-600 hover:bg-violet-100 rounded-lg transition-colors"
                          title="Feladat létrehozása"
                        >
                          <ArrowUpRight className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(alert.id, 'alert')}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          title="Riasztás lezárása"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 📋 FELADATOK SZAKASZ */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <CheckSquare className="w-6 h-6 text-cyan-600" />
          <h2 className="text-xl font-bold text-gray-900">Feladatok</h2>
          <span className="bg-cyan-100 text-cyan-800 px-2 py-1 rounded-full text-sm font-medium">
            {tasks.length}
          </span>
        </div>

        <div className="space-y-3">
          {tasksLoading ? (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <RefreshCw className="w-6 h-6 animate-spin text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">Feladatok betöltése...</p>
            </div>
          ) : tasks.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nincsenek feladatok</h3>
              <p className="text-gray-600">Hozz létre új feladatot az "Új Feladat" gombbal!</p>
            </div>
          ) : (
            tasks.map((task) => {
              const daysUntil = getDaysUntilDue(task.due_date);
              const isOverdue = daysUntil !== null && daysUntil < 0;
              const isDueSoon = daysUntil !== null && daysUntil <= 3 && daysUntil >= 0;

              return (
                <div
                  key={`task-${task.id}`}
                  className={`bg-white rounded-lg border transition-all hover:shadow-md ${
                    isOverdue ? 'border-red-300 bg-red-50' : 
                    isDueSoon ? 'border-amber-300 bg-amber-50' : 
                    'border-gray-200'
                  }`}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <button
                          onClick={() => handleTaskStatusChange(task.id, task.status)}
                          className="mt-1 hover:scale-110 transition-transform"
                        >
                          {getStatusIcon(task.status)}
                        </button>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <h3 className="font-medium text-gray-900 truncate">{task.title}</h3>
                            
                            <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(task.priority)}`}>
                              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                            </span>
                            
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}>
                              {task.status === 'befejezve' ? 'Befejezve' : 
                               task.status === 'folyamatban' ? 'Folyamatban' : 'Függő'}
                            </span>

                            {task.alert_id && (
                              <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">
                                Alert→Task
                              </span>
                            )}
                          </div>

                          <p className="text-sm text-gray-600 mb-2">{task.description}</p>

                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(task.due_date)}
                              {daysUntil !== null && (
                                <span className={`ml-1 ${isOverdue ? 'text-red-600' : isDueSoon ? 'text-amber-600' : ''}`}>
                                  ({daysUntil > 0 ? `${daysUntil} nap múlva` : 
                                    daysUntil === 0 ? 'Ma esedékes' : 
                                    `${Math.abs(daysUntil)} napja lejárt`})
                                </span>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 🛠️ TASK ACTION BUTTONS - 4 GOMB */}
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => handleViewTask(task.id)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                          title="Részletek megtekintése"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleCreateAlertFromTask(task.id)}
                          className="p-2 text-amber-600 hover:bg-amber-100 rounded-lg transition-colors"
                          title="Probléma jelentése"
                        >
                          <AlertCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditTask(task.id)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Szerkesztés"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(task.id, 'task')}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          title="Törlés"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 📋 ÚJ TASK FORM MODAL */}
      {showNewTaskForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Új feladat létrehozása</h3>
                <button
                  onClick={() => setShowNewTaskForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cím *</label>
                  <input
                    type="text"
                    value={newTaskData.title}
                    onChange={(e) => setNewTaskData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:outline-none"
                    placeholder="Feladat címe..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Leírás</label>
                  <textarea
                    value={newTaskData.description}
                    onChange={(e) => setNewTaskData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-lg h-20 focus:ring-2 focus:ring-violet-500 focus:outline-none"
                    placeholder="Részletes leírás..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teendő *</label>
                  <input
                    type="text"
                    value={newTaskData.action_required}
                    onChange={(e) => setNewTaskData(prev => ({ ...prev, action_required: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:outline-none"
                    placeholder="Mit kell tenni..."
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prioritás</label>
                    <select
                      value={newTaskData.priority}
                      onChange={(e) => setNewTaskData(prev => ({ ...prev, priority: e.target.value as TaskPriority }))}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:outline-none"
                    >
                      <option value="alacsony">Alacsony</option>
                      <option value="kozepes">Közepes</option>
                      <option value="magas">Magas</option>
                      <option value="kritikus">Kritikus</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Határidő</label>
                    <input
                      type="date"
                      value={newTaskData.due_date}
                      onChange={(e) => setNewTaskData(prev => ({ ...prev, due_date: e.target.value }))}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleCreateNewTask}
                  className="flex-1 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
                >
                  Létrehozás + Mentés Supabase-be
                </button>
                <button
                  onClick={() => setShowNewTaskForm(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Mégse
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ✏️ TASK SZERKESZTÉS MODAL */}
      {editingTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Feladat szerkesztése</h3>
                <button
                  onClick={() => setEditingTask(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cím *</label>
                  <input
                    type="text"
                    value={editTaskData.title}
                    onChange={(e) => setEditTaskData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:outline-none"
                    placeholder="Feladat címe..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Leírás</label>
                  <textarea
                    value={editTaskData.description}
                    onChange={(e) => setEditTaskData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-lg h-20 focus:ring-2 focus:ring-violet-500 focus:outline-none"
                    placeholder="Részletes leírás..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teendő *</label>
                  <input
                    type="text"
                    value={editTaskData.action_required}
                    onChange={(e) => setEditTaskData(prev => ({ ...prev, action_required: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:outline-none"
                    placeholder="Mit kell tenni..."
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prioritás</label>
                    <select
                      value={editTaskData.priority}
                      onChange={(e) => setEditTaskData(prev => ({ ...prev, priority: e.target.value as TaskPriority }))}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:outline-none"
                    >
                      <option value="alacsony">Alacsony</option>
                      <option value="kozepes">Közepes</option>
                      <option value="magas">Magas</option>
                      <option value="kritikus">Kritikus</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Határidő</label>
                    <input
                      type="date"
                      value={editTaskData.due_date}
                      onChange={(e) => setEditTaskData(prev => ({ ...prev, due_date: e.target.value }))}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Megjegyzések</label>
                  <textarea
                    value={editTaskData.notes}
                    onChange={(e) => setEditTaskData(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-lg h-16 focus:ring-2 focus:ring-violet-500 focus:outline-none"
                    placeholder="További megjegyzések..."
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleSaveEditedTask}
                  className="flex-1 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
                >
                  Mentés + Supabase Update
                </button>
                <button
                  onClick={() => setEditingTask(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Mégse
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 👁️ ALERT RÉSZLETEK MODAL */}
      {selectedAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Riasztás részletei</h3>
                <button
                  onClick={() => setSelectedAlert(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cím</label>
                  <p className="text-gray-900">{selectedAlert.title}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Leírás</label>
                  <p className="text-gray-900 whitespace-pre-wrap">{selectedAlert.description}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prioritás</label>
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(selectedAlert.priority)}`}>
                      {selectedAlert.priority === 'kritikus' || selectedAlert.priority === 4 ? 'Kritikus' : 
                       selectedAlert.priority === 'surgos' ? 'Sürgős' :
                       selectedAlert.priority === 'magas' || selectedAlert.priority === 3 ? 'Magas' : 
                       selectedAlert.priority === 'kozepes' || selectedAlert.priority === 2 ? 'Közepes' : 'Alacsony'}
                    </span>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Típus</label>
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                      selectedAlert.source === 'animal' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedAlert.sourceLabel}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Határidő</label>
                  <p className="text-gray-900">{formatDate(selectedAlert.due_date)}</p>
                </div>

                {selectedAlert.animal?.enar && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Érintett állat</label>
                    <p className="text-gray-900">{selectedAlert.animal.enar}</p>
                  </div>
                )}

                {selectedAlert.action_required && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Szükséges intézkedés</label>
                    <p className="text-gray-900">{selectedAlert.action_required}</p>
                  </div>
                )}
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    handleCreateTaskFromAlert(selectedAlert.id);
                    setSelectedAlert(null);
                  }}
                  className="flex-1 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
                >
                  Feladat létrehozása
                </button>
                <button
                  onClick={() => setSelectedAlert(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Bezárás
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 👁️ TASK RÉSZLETEK MODAL */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Feladat részletei</h3>
                <button
                  onClick={() => setSelectedTask(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cím</label>
                  <p className="text-gray-900">{selectedTask.title}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Leírás</label>
                  <p className="text-gray-900">{selectedTask.description || 'Nincs leírás'}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prioritás</label>
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(selectedTask.priority)}`}>
                      {selectedTask.priority.charAt(0).toUpperCase() + selectedTask.priority.slice(1)}
                    </span>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Státusz</label>
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedTask.status)}`}>
                      {selectedTask.status === 'befejezve' ? 'Befejezve' : 
                       selectedTask.status === 'folyamatban' ? 'Folyamatban' : 'Függő'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Határidő</label>
                  <p className="text-gray-900">{formatDate(selectedTask.due_date)}</p>
                </div>

                {selectedTask.action_required && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Teendő</label>
                    <p className="text-gray-900">{selectedTask.action_required}</p>
                  </div>
                )}

                {selectedTask.notes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Megjegyzések</label>
                    <p className="text-gray-900 whitespace-pre-wrap">{selectedTask.notes}</p>
                  </div>
                )}

                {selectedTask.alert_id && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kapcsolódó alert</label>
                    <p className="text-gray-900">Alert ID: {selectedTask.alert_id}</p>
                  </div>
                )}
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    handleEditTask(selectedTask.id);
                    setSelectedTask(null);
                  }}
                  className="flex-1 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
                >
                  Szerkesztés
                </button>
                <button
                  onClick={() => setSelectedTask(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Bezárás
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🔧 LOADING STATES */}
      {(alertsLoading || tasksLoading) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center gap-3">
            <RefreshCw className="w-5 h-5 animate-spin text-violet-600" />
            <span>Adatok betöltése Supabase-ből...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TasksPage;