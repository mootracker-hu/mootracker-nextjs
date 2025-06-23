// src/hooks/useTasks.ts
// MooTracker Task rendszer - Végső clean verzió

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

// Mock adatok
const INITIAL_MOCK_TASKS: Task[] = [
  {
    id: 'mock-1',
    title: 'HU9120 vemhességvizsgálat',
    description: 'Párzás után 75 nappal VV vizsgálat szükséges',
    priority: 'high',
    status: 'pending',
    category: 'breeding',
    due_date: '2025-06-25T10:00:00.000Z',
    animal_id: 1,
    animal: { id: 1, enar: 'HU9120' },
    action_required: 'Állatorvos meghívása VV-ra',
    alert_id: 'alert-breeding-1',
    created_at: new Date(Date.now() - (1 * 24 * 60 * 60 * 1000)).toISOString(),
    updated_at: new Date(Date.now() - (1 * 24 * 60 * 60 * 1000)).toISOString()
  }
];

export const useTasks = (): UseTasksReturn => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<TaskFilters>({});

  // Priority mapping
  const mapPriorityToNumber = (priority: TaskPriority): number => {
    switch (priority) {
      case 'low': return 1;
      case 'medium': return 2;
      case 'high': return 3;
      case 'critical': return 4;
      default: return 2;
    }
  };

  // Task-ok betöltése
  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // localStorage-ból betöltés
      const localTasks = localStorage.getItem('mootracker_tasks');
      if (localTasks) {
        try {
          const parsedTasks = JSON.parse(localTasks);
          setTasks(parsedTasks);
          console.log('✅ Tasks betöltve localStorage-ból:', parsedTasks.length);
        } catch (parseError) {
          console.warn('localStorage parse hiba:', parseError);
        }
      }

      // Supabase próba (opcionális)
      try {
        const { data: supabaseTasks } = await supabase
          .from('tasks')
          .select('*')
          .order('created_at', { ascending: false });

        if (supabaseTasks && supabaseTasks.length > 0) {
          setTasks(supabaseTasks);
          console.log('✅ Tasks betöltve Supabase-ből:', supabaseTasks.length);
        }
      } catch (supabaseError) {
        console.log('Supabase nem elérhető, localStorage használata');
      }

      // Ha semmi sincs, mock adatok
      if (!localTasks || JSON.parse(localTasks).length === 0) {
        setTasks(INITIAL_MOCK_TASKS);
      }
    } catch (err) {
      console.error('Task loading error:', err);
      setTasks(INITIAL_MOCK_TASKS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Task létrehozása - FUNCTIONAL UPDATE!
  const createTask = useCallback(async (data: CreateTaskRequest): Promise<Task> => {
    const newTask: Task = {
      id: `local-${Date.now()}`,
      title: data.title,
      description: data.description,
      priority: data.priority,
      status: data.status || 'pending',
      category: data.category,
      due_date: data.due_date,
      animal_id: data.animal_id,
      pen_id: data.pen_id,
      action_required: data.action_required,
      alert_id: data.alert_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('🔄 Task létrehozás:', newTask.title);

    // FUNCTIONAL UPDATE - localStorage mentéssel
    setTasks(prevTasks => {
      const updatedTasks = [newTask, ...prevTasks];
      localStorage.setItem('mootracker_tasks', JSON.stringify(updatedTasks));
      console.log('✅ Task mentve localStorage-ba:', updatedTasks.length);
      return updatedTasks;
    });

    // Supabase próba (opcionális)
    try {
      await supabase.from('tasks').insert([{
        title: newTask.title,
        description: newTask.description,
        priority: mapPriorityToNumber(newTask.priority),
        status: newTask.status,
        due_date: newTask.due_date,
        animal_id: newTask.animal_id,
        pen_id: newTask.pen_id,
        action_required: newTask.action_required,
        alert_id: newTask.alert_id
      }]);
      console.log('✅ Task szinkronizálva Supabase-be');
    } catch (supabaseError) {
      console.log('Supabase szinkronizálás sikertelen (normális)');
    }

    return newTask;
  }, []);

  // Task frissítése
  const updateTask = useCallback(async (id: string, data: UpdateTaskRequest): Promise<Task> => {
    let updatedTask: Task | null = null;

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

    return updatedTask!;
  }, []);

  // Task törlése
  const deleteTask = useCallback(async (id: string): Promise<void> => {
    setTasks(prevTasks => {
      const newTasks = prevTasks.filter(task => task.id !== id);
      localStorage.setItem('mootracker_tasks', JSON.stringify(newTasks));
      return newTasks;
    });
  }, []);

  // Task befejezése
  const completeTask = useCallback(async (id: string, notes?: string): Promise<Task> => {
    return updateTask(id, {
      status: 'completed',
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
      category: 'general',
      due_date: alert.due_date || new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)).toISOString(),
      animal_id: alert.animal_id,
      action_required: alert.action_required,
      alert_id: alert.id,
      status: 'pending'
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
             task.description.toLowerCase().includes(searchLower);
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

  // Statistikák
  const taskStats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    overdue: tasks.filter(t => 
      t.due_date && 
      new Date(t.due_date) < new Date() && 
      t.status !== 'completed'
    ).length,
    critical: tasks.filter(t => t.priority === 'critical').length
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