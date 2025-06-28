// src/hooks/useTasks.ts
// MooTracker Task rendszer - JAVÍTOTT VERZIÓ - ID és Mentési Problémák Megoldva

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Task, 
  CreateTaskRequest,
  UpdateTaskRequest,
  TaskFilters,
  UseTasksReturn,
  TaskStatus,
  TaskPriority,
  Alert
} from '@/types/alert-task-types';

// ============================================
// 🔄 MAPPING FUNCTIONS - DB ↔ APP (UGYANAZ)
// ============================================

const mapDbStatusToApp = (dbStatus: string): TaskStatus => {
  const mapping: Record<string, TaskStatus> = {
    'pending': 'fuggőben',
    'in_progress': 'folyamatban',
    'completed': 'befejezve',
    'deleted': 'torolve',
    'fuggőben': 'fuggőben',
    'folyamatban': 'folyamatban',
    'befejezve': 'befejezve',
    'torolve': 'torolve'
  };
  return mapping[dbStatus] || 'fuggőben';
};

const mapAppStatusToDb = (appStatus: TaskStatus): string => {
  const mapping: Record<TaskStatus, string> = {
    'fuggőben': 'pending',
    'folyamatban': 'in_progress',
    'befejezve': 'completed',
    'torolve': 'deleted'
  };
  return mapping[appStatus] || 'pending';
};

const mapDbPriorityToApp = (dbPriority: number | string): TaskPriority => {
  const priority = typeof dbPriority === 'string' ? parseInt(dbPriority) : dbPriority;
  const mapping: Record<number, TaskPriority> = {
    1: 'alacsony',
    2: 'kozepes',
    3: 'magas',
    4: 'kritikus'
  };
  return mapping[priority] || 'kozepes';
};

const mapAppPriorityToDb = (appPriority: TaskPriority): number => {
  const mapping: Record<TaskPriority, number> = {
    'alacsony': 1,
    'kozepes': 2,
    'magas': 3,
    'kritikus': 4
  };
  return mapping[appPriority] || 2;
};

const mapDbTaskToApp = (dbTask: any): Task => {
  return {
    id: dbTask.id.toString(), // ✅ JAVÍTÁS: Mindig string ID
    title: dbTask.title || '',
    description: dbTask.description || '',
    priority: mapDbPriorityToApp(dbTask.priority),
    status: mapDbStatusToApp(dbTask.status),
    category: dbTask.category || 'altalanos',
    created_at: dbTask.created_at,
    updated_at: dbTask.updated_at,
    due_date: dbTask.due_date,
    animal_id: dbTask.animal_id,
    pen_id: dbTask.pen_id,
    action_required: dbTask.action_required,
    alert_id: dbTask.alert_id,
    notes: dbTask.notes,
    completed_at: dbTask.completed_at,
    animal: dbTask.animal_id ? { 
      id: dbTask.animal_id, 
      enar: dbTask.animal?.enar || `Animal-${dbTask.animal_id}` 
    } : undefined
  };
};

// ============================================
// 🎯 MOCK ADATOK
// ============================================

const INITIAL_MOCK_TASKS: Task[] = [
  {
    id: '1',
    title: 'HU9120 vemhességvizsgálat',
    description: 'Párzás után 75 nappal VV vizsgálat szükséges',
    priority: 'magas',
    status: 'fuggőben',
    category: 'tenyesztes',
    due_date: '2025-06-25T10:00:00.000Z',
    animal_id: 1,
    animal: { id: 1, enar: 'HU9120' },
    action_required: 'Állatorvos meghívása VV-ra',
    alert_id: 'alert-breeding-1',
    created_at: new Date(Date.now() - (1 * 24 * 60 * 60 * 1000)).toISOString(),
    updated_at: new Date(Date.now() - (1 * 24 * 60 * 60 * 1000)).toISOString()
  }
];

// ============================================
// 🪝 MAIN HOOK
// ============================================

export const useTasks = (): UseTasksReturn => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<TaskFilters>({});

  // ✅ TASKS BETÖLTÉSE
  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 Tasks betöltése kezdődik...');

      // ✅ 1. Supabase próba ELŐSZÖR
      try {
        const { data, error: supabaseError } = await supabase
          .from('tasks')
          .select('*')
          .order('created_at', { ascending: false });

        if (supabaseError) {
          throw new Error(`Supabase error: ${supabaseError.message}`);
        }

        if (data && data.length > 0) {
          const mappedTasks = data.map(dbTask => mapDbTaskToApp(dbTask));
          setTasks(mappedTasks);
          
          // ✅ Supabase adatok localStorage-ba mentése
          localStorage.setItem('mootracker_tasks', JSON.stringify(mappedTasks));
          
          console.log('✅ Tasks betöltve Supabase-ből:', mappedTasks.length);
          console.log('🔍 Első task ID típusa:', typeof mappedTasks[0]?.id, mappedTasks[0]?.id);
          return; // ✅ Kilépés, ha Supabase működik
        }
      } catch (supabaseError) {
        console.warn('⚠️ Supabase nem elérhető:', supabaseError);
      }

      // ✅ 2. localStorage fallback
      const localTasks = localStorage.getItem('mootracker_tasks');
      if (localTasks) {
        try {
          const parsedTasks = JSON.parse(localTasks);
          if (parsedTasks.length > 0) {
            setTasks(parsedTasks);
            console.log('✅ Tasks betöltve localStorage-ból:', parsedTasks.length);
            return;
          }
        } catch (parseError) {
          console.warn('localStorage parse hiba:', parseError);
        }
      }

      // ✅ 3. Mock adatok utolsó esély
      setTasks(INITIAL_MOCK_TASKS);
      console.log('✅ Mock tasks betöltve');

    } catch (err) {
      console.error('Task loading error:', err);
      setError('Hiba a task-ok betöltése során');
      setTasks(INITIAL_MOCK_TASKS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // ✅ TASK LÉTREHOZÁSA - JAVÍTOTT ID ÉS TÍPUS KEZELÉS
  const createTask = useCallback(async (data: CreateTaskRequest): Promise<Task> => {
    console.log('🔄 Task létrehozás indítva:', data.title);

    // ✅ 1. SUPABASE INSERT ELŐSZÖR (hogy megkapjuk a valós ID-t)
    let dbTaskId: string;
    let fullTaskData: any = null;
    
    try {
      const dbTaskData = {
        title: data.title,
        description: data.description || '',
        priority: mapAppPriorityToDb(data.priority),
        status: mapAppStatusToDb(data.status || 'fuggőben'),
        // category: data.category, // ❌ TÖRÖLVE - nincs ilyen oszlop
        due_date: data.due_date || null,
        animal_id: data.animal_id || null,
        pen_id: data.pen_id || null,
        action_required: data.action_required || null,
        alert_id: data.alert_id || null
      };

      console.log('🔄 Supabase insert adatok:', dbTaskData);

      const { data: insertedData, error: insertError } = await supabase
        .from('tasks')
        .insert([dbTaskData])
        .select('*')  // ✅ JAVÍTÁS: teljes rekord lekérése
        .single();

      if (insertError) {
        throw new Error(`Insert error: ${insertError.message}`);
      }

      if (!insertedData || !insertedData.id) {
        throw new Error('No data returned from insert');
      }

      // ✅ JAVÍTÁS: Proper ID kezelés
      dbTaskId = insertedData.id.toString();
      fullTaskData = insertedData;
      console.log('✅ Task mentve Supabase-be, teljes adat:', fullTaskData);

    } catch (supabaseError) {
      console.warn('⚠️ Supabase insert hiba:', supabaseError);
      // ✅ Fallback: időbélyeg alapú ID
      dbTaskId = `fallback_${Date.now()}`;
      console.log('🔄 Fallback ID használata:', dbTaskId);
    }

    // ✅ 2. App Task object létrehozása
    const newTask: Task = {
      id: dbTaskId, // ✅ Mindig string
      title: data.title,
      description: data.description || '',
      priority: data.priority,
      status: data.status || 'fuggőben',
      category: data.category,
      due_date: data.due_date,
      animal_id: data.animal_id,
      pen_id: data.pen_id,
      action_required: data.action_required,
      alert_id: data.alert_id,
      created_at: fullTaskData?.created_at || new Date().toISOString(),
      updated_at: fullTaskData?.updated_at || new Date().toISOString()
    };

    console.log('✅ Új task object létrehozva:', newTask);

    // ✅ 3. State frissítése
    setTasks(prevTasks => {
      const updatedTasks = [newTask, ...prevTasks];
      
      // ✅ localStorage mentés debug-gal
      try {
        localStorage.setItem('mootracker_tasks', JSON.stringify(updatedTasks));
        console.log('✅ localStorage frissítve, task count:', updatedTasks.length);
      } catch (localStorageError) {
        console.error('❌ localStorage mentési hiba:', localStorageError);
      }
      
      return updatedTasks;
    });

    return newTask;
  }, []);

  // ✅ TASK FRISSÍTÉSE
  const updateTask = useCallback(async (id: string, data: UpdateTaskRequest): Promise<Task> => {
    console.log('🔄 Task frissítés:', id, data);

    let updatedTask: Task | null = null;

    // ✅ 1. State frissítése
    setTasks(prevTasks => {
      const newTasks = prevTasks.map(task => {
        if (task.id === id) {
          updatedTask = { ...task, ...data, updated_at: new Date().toISOString() };
          return updatedTask;
        }
        return task;
      });
      localStorage.setItem('mootracker_tasks', JSON.stringify(newTasks));
      return newTasks;
    });

    // ✅ 2. Supabase szinkronizálás
    if (updatedTask) {
      try {
        const dbUpdateData: any = {};
        
        if (data.title) dbUpdateData.title = data.title;
        if (data.description !== undefined) dbUpdateData.description = data.description;
        if (data.priority) dbUpdateData.priority = mapAppPriorityToDb(data.priority);
        if (data.status) dbUpdateData.status = mapAppStatusToDb(data.status);
        // if (data.category) dbUpdateData.category = data.category; // ❌ TÖRÖLVE
        if (data.due_date !== undefined) dbUpdateData.due_date = data.due_date;
        if (data.action_required !== undefined) dbUpdateData.action_required = data.action_required;
        if (data.notes !== undefined) dbUpdateData.notes = data.notes;
        if (data.completed_at !== undefined) dbUpdateData.completed_at = data.completed_at;

        const { error: updateError } = await supabase
          .from('tasks')
          .update(dbUpdateData)
          .eq('id', id);

        if (updateError) {
          console.warn('Supabase update hiba:', updateError.message);
        } else {
          console.log('✅ Task frissítve Supabase-ben');
        }
      } catch (supabaseError) {
        console.log('Supabase update sikertelen');
      }
    }

    return updatedTask!;
  }, []);

  // ✅ TASK TÖRLÉSE
  const deleteTask = useCallback(async (id: string): Promise<void> => {
    console.log('🗑️ Task törlése:', id);

    // ✅ 1. State frissítése
    setTasks(prevTasks => {
      const newTasks = prevTasks.filter(task => task.id !== id);
      localStorage.setItem('mootracker_tasks', JSON.stringify(newTasks));
      return newTasks;
    });

    // ✅ 2. Supabase szinkronizálás
    try {
      const { error: deleteError } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.warn('Supabase delete hiba:', deleteError.message);
      } else {
        console.log('✅ Task törölve Supabase-ből');
      }
    } catch (supabaseError) {
      console.log('Supabase delete sikertelen');
    }
  }, []);

  // ✅ TASK BEFEJEZÉSE
  const completeTask = useCallback(async (id: string, notes?: string): Promise<Task> => {
    return updateTask(id, {
      status: 'befejezve',
      completed_at: new Date().toISOString(),
      notes: notes
    });
  }, [updateTask]);

  // Bulk műveletek
  const bulkUpdateStatus = useCallback(async (taskIds: string[], status: TaskStatus): Promise<void> => {
    for (const taskId of taskIds) {
      await updateTask(taskId, { status });
    }
  }, [updateTask]);

  const bulkDelete = useCallback(async (taskIds: string[]): Promise<void> => {
    for (const taskId of taskIds) {
      await deleteTask(taskId);
    }
  }, [deleteTask]);

  // Alert-ből task létrehozása
  const createTaskFromAlert = useCallback(async (alert: Alert): Promise<Task> => {
    const taskData: CreateTaskRequest = {
      title: alert.title,
      description: alert.description,
      priority: alert.priority as TaskPriority,
      category: 'altalanos',
      due_date: alert.due_date || new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)).toISOString(),
      animal_id: alert.animal_id,
      action_required: alert.action_required,
      alert_id: alert.id,
      status: 'fuggőben'
    };

    const task = await createTask(taskData);
    console.log('✅ Task létrehozva alert-ből:', task.id);
    return task;
  }, [createTask]);

  // Szűrt task-ok
  const filteredTasks = tasks.filter(task => {
    if (filters.status && filters.status.length > 0 && !filters.status.includes(task.status)) return false;
    if (filters.priority && filters.priority.length > 0 && !filters.priority.includes(task.priority)) return false;
    if (filters.category && filters.category.length > 0 && !filters.category.includes(task.category)) return false;
    if (filters.animal_id && task.animal_id !== filters.animal_id) return false;
    if (filters.pen_id && task.pen_id !== filters.pen_id) return false;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return task.title.toLowerCase().includes(searchLower) ||
             (task.description || '').toLowerCase().includes(searchLower);
    }
    return true;
  });

  // Rendezés
  const sortBy = useCallback((field: keyof Task, direction: 'asc' | 'desc') => {
    setTasks(prev => [...prev].sort((a, b) => {
      const aValue = a[field];
      const bValue = b[field];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return direction === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      return 0;
    }));
  }, []);

  // ✅ MAGYAR STATISTIKÁK
  const taskStats = {
    osszes: tasks.length,
    fuggőben: tasks.filter(t => t.status === 'fuggőben').length,
    folyamatban: tasks.filter(t => t.status === 'folyamatban').length,
    befejezve: tasks.filter(t => t.status === 'befejezve').length,
    lejart: tasks.filter(t => 
      t.due_date && 
      new Date(t.due_date) < new Date() && 
      t.status !== 'befejezve'
    ).length,
    kritikus: tasks.filter(t => t.priority === 'kritikus').length
  };

  return {
    tasks: filteredTasks,
    loading,
    error,
    createTask,
    updateTask,
    deleteTask,
    completeTask,
    bulkUpdateStatus,
    bulkDelete,
    filteredTasks,
    filters,
    setFilters,
    sortBy,
    taskStats,
    createTaskFromAlert
  };
};