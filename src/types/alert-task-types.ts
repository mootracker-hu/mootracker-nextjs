// src/types/alert-task-types.ts
// MooTracker Alert & Task típusok - Tiszta verzió

// ============================================
// ALAPVETŐ TÍPUSOK
// ============================================

export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type AlertPriority = 'low' | 'medium' | 'high' | 'critical' | 'urgent';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type TaskCategory = 'general' | 'health' | 'vaccination' | 'breeding' | 'movement' | 'maintenance';
export type AlertType = 'vaccination_due' | 'weaning_time' | 'pen_change_needed' | 'breeding_reminder' | 'market_opportunity' | 'pregnancy_check' | 'birth_approaching';

// ============================================
// TASK INTERFACE
// ============================================

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  category: TaskCategory;
  created_at: string;
  updated_at: string;
  
  // Opcionális mezők
  due_date?: string;
  animal_id?: number;
  pen_id?: string;
  action_required?: string;
  alert_id?: string;
  notes?: string;
  completed_at?: string;
  
  // Állat kapcsolódás (opcionális)
  animal?: {
    id: number;
    enar: string;
  };
}

// ============================================
// ALERT INTERFACE  
// ============================================

export interface Alert {
  id: string;
  type: AlertType;
  priority: AlertPriority;
  title: string;
  description: string;
  animal_id: number;
  created_at: string;
  
  // Opcionális mezők
  due_date?: string;
  resolved_at?: string;
  snoozed_until?: string;
  is_resolved: boolean;
  is_snoozed: boolean;
  action_required?: string;
  related_task_id?: string;
  
  // Állat kapcsolódás
  animal: {
    id: number;
    enar: string;
  };
  
  // Metaadatok
  suggested_actions?: string[];
  can_create_task?: boolean;
  can_postpone?: boolean;
  metadata?: {
    animal_age_days?: number;
    rule_type?: string;
  };
}

// ============================================
// REQUEST/RESPONSE TÍPUSOK
// ============================================

export interface CreateTaskRequest {
  title: string;
  description: string;
  priority: TaskPriority;
  category: TaskCategory;
  due_date?: string;
  animal_id?: number;
  pen_id?: string;
  action_required?: string;
  alert_id?: string;
  status?: TaskStatus;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  category?: TaskCategory;
  due_date?: string;
  action_required?: string;
  notes?: string;
  completed_at?: string;
}

// ============================================
// FILTER ÉS STATS TÍPUSOK
// ============================================

export interface TaskFilters {
  status?: TaskStatus[];
  priority?: TaskPriority[];
  category?: TaskCategory[];
  animal_id?: number;
  pen_id?: string;
  search?: string;
}

export interface AlertStats {
  total: number;
  active: number;
  resolved: number;
  snoozed: number;
  overdue: number;
  critical: number;
  urgent: number;
  high: number;
  medium: number;
  low: number;
}

// ============================================
// HOOK RETURN TÍPUSOK
// ============================================

export interface UseTasksReturn {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  createTask: (data: CreateTaskRequest) => Promise<Task>;
  updateTask: (id: string, data: UpdateTaskRequest) => Promise<Task>;
  deleteTask: (id: string) => Promise<void>;
  completeTask: (id: string, notes?: string) => Promise<Task>;
  bulkUpdateStatus: (taskIds: string[], status: TaskStatus) => Promise<void>;
  bulkDelete: (taskIds: string[]) => Promise<void>;
  filteredTasks: Task[];
  filters: TaskFilters;
  setFilters: (filters: TaskFilters) => void;
  sortBy: (field: keyof Task, direction: 'asc' | 'desc') => void;
  taskStats: {
    total: number;
    pending: number;
    in_progress: number;
    completed: number;
    overdue: number;
    critical: number;
  };
  createTaskFromAlert: (alert: Alert) => Promise<Task>;
}

export interface UseAlertsReturn {
  alerts: Alert[];
  loading: boolean;
  error: string | null;
  alertStats: AlertStats;
  alertsByPriority: Record<AlertPriority, Alert[]>;
  alertsByType: Record<AlertType, Alert[]>;
  alertsByAnimal: Record<string, Alert[]>;
  refreshAlerts: () => Promise<void>;
  resolveAlert: (alertId: string) => Promise<void>;
  snoozeAlert: (alertId: string, until: string) => Promise<void>;
  createTaskFromAlert: (alert: Alert, taskData?: Partial<CreateTaskRequest>) => Promise<string>;
}

// ============================================
// EGYÉB TÍPUSOK
// ============================================

export interface Animal {
  id: number;
  enar: string;
  kategoria: string;
  ivar: string;
  statusz: string;
  szuletesi_datum: string;
}

export interface AlertRule {
  type: AlertType;
  priority: AlertPriority;
  title: string;
  description: string;
  checkCondition: (animal: Animal) => boolean;
  daysFromBirth?: number;
  suggestedActions: string[];
  canCreateTask: boolean;
  canPostpone: boolean;
}

export interface DailyTaskSchedule {
  urgent: Alert[];
  today: Alert[];
  thisWeek: Alert[];
  later: Alert[];
}
// types/alert-task-types.ts végére add hozzá:
export const ALERT_TYPE_LABELS: Record<AlertType, string> = {
  vaccination_due: 'Vakcinázás',
  weaning_time: 'Választás',
  pen_change_needed: 'Karám váltás',
  breeding_reminder: 'Tenyésztés',
  market_opportunity: 'Értékesítés',
  pregnancy_check: 'Vemhességvizsgálat',
  birth_approaching: 'Ellés közeleg'
};