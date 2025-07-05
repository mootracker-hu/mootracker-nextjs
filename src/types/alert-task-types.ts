// src/types/alert-task-types.ts
// MooTracker Alert & Task típusok - FRISSÍTETT VERZIÓ v8.1

// ============================================
// ALAPVETŐ TÍPUSOK
// ============================================

export type TaskPriority = 'alacsony' | 'kozepes' | 'magas' | 'kritikus';
export type AlertPriority = 'alacsony' | 'kozepes' | 'magas' | 'kritikus' | 'surgos';
export type TaskStatus = 'fuggőben' | 'folyamatban' | 'befejezve' | 'torolve';
export type TaskCategory = 'altalanos' | 'egeszsegugy' | 'vakcinazas' | 'tenyesztes' | 'mozgatas' | 'karbantartas' | 'gyogykezeles' | 'donteshez' | 'ertekesites';

// ✅ MAGYAR ALERT TÍPUSOK - VV PROTOKOLLAL KIEGÉSZÍTVE
export type AlertType = 
  | 'vakcinazas_esedékes'        // vaccination_due
  | 'valasztas_ideje'            // weaning_time  
  | 'karam_valtas_szukseges'     // pen_change_needed
  | 'tenyesztesi_emlekezeto'     // breeding_reminder
  | 'piaci_lehetoseg'            // market_opportunity
  | 'vemhessegvizsgalat'         // pregnancy_check
  | 'rcc_vakcina_esedékes'       // ✅ ÚJ - ellés előtt 6 hét
  | 'bovipast_vakcina_esedékes'  // ✅ ÚJ - ellés előtt 4 hét
  | 'abrak_elvetel_esedékes'     // ✅ ÚJ - ellés előtt 2 hét
  | 'elleto_karam_athelyezes'    // ✅ ÚJ - ellés előtt 1 hét
  | 'elles_kozeledik'            // birth_approaching
  | 'elles_kesesben'             // ✅ ÚJ - túlhordás
  | 'vemhessegvizsgalat_ismetles' // ✅ ÚJ - üres állat újra VV
  | 'selejtezesi_javaslat'       // ✅ ÚJ - csíra állat selejtezése;
  | 'kapacitas_tullepes'         // ← ÚJ
  | 'kapacitas_alulhasznaltsag'  // ← ÚJ
  | 'fulszam_idealis'            // ← ÚJ
  | 'fulszam_ajanlott'           // ← ÚJ
  | 'fulszam_surgos'            // ← ÚJ
  // ✅ ADD HOZZÁ EZEKET:
  | 'valasztas_idoszak_kezdete'
  | 'valasztas_ajanlott'
  | 'valasztas_surgos'
  | 'vv_idoszak_kezdete'
  | 'vv_ajanlott'
  | 'vv_surgos'
  | 'karam_valtas_ovi_kezdete'
  | 'karam_valtas_ovi_ajanlott'
  | 'karam_valtas_ovi_surgos'
  | 'tenyesztesi_emlekezeto_kezdete'
  | 'tenyesztesi_emlekezeto_ajanlott'
  | 'tenyesztesi_emlekezeto_surgos'
  | 'piaci_lehetoseg_kezdete'
  | 'piaci_lehetoseg_ajanlott'
  | 'piaci_lehetoseg_surgos';

// ✅ ÚJ KARÁM FUNKCIÓ TÍPUSOK
export type PenFunctionType = 
  | 'bölcsi'        // 0-12 hónapos borjak
  | 'óvi'           // 12-24 hónapos fiatalok  
  | 'hárem'         // Tenyésztés folyamatban
  | 'vemhes'        // Vemhes állatok
  | 'ellető'        // Ellés körül
  | 'tehén'         // Laktáló tehenek
  | 'hízóbika'      // Hústermelés
  | 'üres'          // Nincs használatban
  | 'átmeneti'      // ✅ ÚJ - Ideiglenes, döntés alatt
  | 'kórház'        // ✅ ÚJ - Kezelés alatt lévő állatok
  | 'karantén'      // ✅ ÚJ - Elkülönítés (új állatok, betegek)
  | 'selejt'        // ✅ ÚJ - Értékesítésre/vágásra várók;

// ✅ VV EREDMÉNY TÍPUSOK
export type PregnancyStatus = 'vemhes' | 'ures' | 'csira';

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
  animal_id?: string; 
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
  message: string;
  created_at: string;
  
  // Boolean flags
  dismissible: boolean;
  auto_resolve: boolean;
  is_resolved: boolean;
  is_snoozed: boolean;
  
  // Opcionális azonosítók
  animal_id?: string;              // ← string vagy undefined
  pen_id?: string;
  enar?: string;
  
  // Opcionális dátumok
  due_date?: string;
  resolved_at?: string;
  snoozed_until?: string;
  
  // Opcionális mezők
  action_required?: string;
  related_task_id?: string;
  
  // Állat kapcsolódás - OPCIONÁLIS
  animal?: {
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
    vv_date?: string;
    vv_result_days?: number;
    expected_birth_date?: string;
  };
}

// ============================================
// ÚJ KARÁM METADATA TÍPUSOK
// ============================================

export interface KorhazMetadata {
  treatment_type: 'vakcinazas' | 'gyogykezeles' | 'sebezes' | 'megfigyeles';
  treatment_start_date: string;
  expected_recovery_date?: string;
  veterinarian?: string;
  medication_schedule?: string[];
  return_pen_id?: string;      // Vissza ide megy gyógyulás után
  treatment_notes?: string;
}

export interface AtmenetiMetadata {
  reason: 'funkció_váltás_alatt' | 'besorolás_alatt' | 'vizsgálat_alatt';
  temporary_since: string;
  decision_deadline?: string;   // Meddig lehet itt
  target_function_candidates?: PenFunctionType[]; // Lehetséges célok
  decision_criteria?: string;
  notes?: string;
}

export interface KarantenMetadata {
  quarantine_reason: 'uj_allat' | 'betegseg_gryanuja' | 'kulso_fertozes';
  quarantine_start_date: string;
  expected_end_date?: string;
  health_checks?: string[];
  release_criteria?: string;
  notes?: string;
}

export interface SelejtMetadata {
  reason: 'reprodukcios_problema' | 'betegseg' | 'eletkor' | 'genetikai_hiba';
  planned_disposal: 'ertekesites' | 'vagas' | 'egyeb';
  market_price_info?: string;
  disposal_deadline?: string;
  notes?: string;
}

// ✅ KARÁM NOTES RENDSZER
export interface PenNotes {
  template: string;             // Karám típus alapértelmezett template
  custom_notes: string;         // Szabad szöveges megjegyzések
  last_updated: string;
  updated_by?: string;
  notes_history?: PreviousNote[];
}

export interface PreviousNote {
  period: string;               // "hárem (2024-01-15 - 2024-06-20)"
  function_type: PenFunctionType;
  notes: string;
  start_date: string;
  end_date: string;
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
  animal_id?: string;  
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

// ✅ VV EREDMÉNY RÖGZÍTÉSE
export interface VVResult {
  vv_date: string;                    // VV vizsgálat dátuma
  pregnancy_status: PregnancyStatus;  // 3 féle eredmény
  vv_result_days?: number;            // Csak vemhes esetén (pl. 45 nap)
  animal_enar: string;                // Melyik állat
  notes?: string;                     // Megjegyzések
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
  osszes: number;     // total → osszes
  aktiv: number;      // active → aktiv  
  megoldott: number;  // resolved → megoldott
  halasztott: number; // snoozed → halasztott
  lejart: number;     // overdue → lejart
  kritikus: number;   // critical → kritikus
  surgos: number;     // urgent → surgos
  magas: number;      // high → magas
  kozepes: number;    // medium → kozepes
  alacsony: number;   // low → alacsony
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
    osszes: number;
    fuggőben: number;
    folyamatban: number;
    befejezve: number;
    lejart: number;
    kritikus: number;
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
  // ✅ ÚJ VV MEZŐK
  pairing_date?: string;              // Párzási dátum
  vv_date?: string;                   // VV vizsgálat dátuma
  vv_result_days?: number;            // VV eredmény napokban
  pregnancy_status?: PregnancyStatus; // VV státusz
  expected_birth_date?: string;       // Várható ellési dátum
  notes?: string;                     // Állat megjegyzések
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
  surgos: Alert[];    // urgent → surgos
  ma: Alert[];        // today → ma
  ezen_a_heten: Alert[]; // thisWeek → ezen_a_heten
  kesobb: Alert[];    // later → kesobb
}

// ============================================
// MAGYAR LOKALIZÁCIÓ
// ============================================

export const ALERT_TYPE_LABELS: Record<AlertType, string> = {
  vakcinazas_esedékes: '💉 Vakcinázás',
  valasztas_ideje: '🐄 Választás',
  karam_valtas_szukseges: '🏠 Karám váltás',
  tenyesztesi_emlekezeto: '💕 Tenyésztés',
  piaci_lehetoseg: '💰 Értékesítés',
  vemhessegvizsgalat: '🔬 VV vizsgálat',
  rcc_vakcina_esedékes: '💉 RCC vakcina',
  bovipast_vakcina_esedékes: '💉 BoviPast vakcina',
  abrak_elvetel_esedékes: '🚫 Abrak elvétel',
  elleto_karam_athelyezes: '🏠➡️ Ellető karámba',
  elles_kozeledik: '🍼 Ellés közeledik',
  elles_kesesben: '🚨 TÚLHORDÁS',
  vemhessegvizsgalat_ismetles: '🔬 VV ismétlés',
  selejtezesi_javaslat: '📦 Selejtezés',
  kapacitas_tullepes: '🚨 Kapacitás túllépés',
  kapacitas_alulhasznaltsag: '📉 Alulhasználtság',
  fulszam_idealis: '🏷️ Fülszám (ideális)',
  fulszam_ajanlott: '🏷️ Fülszám (ajánlott)',
  fulszam_surgos: '🏷️ Fülszám (sürgős)',
  valasztas_idoszak_kezdete: '🐄 Választás (kezdet)',
  valasztas_ajanlott: '🐄 Választás (ajánlott)',
  valasztas_surgos: '🐄 Választás (sürgős)',
  vv_idoszak_kezdete: '🔬 VV (időszak kezdete)',
  vv_ajanlott: '🔬 VV (ajánlott)',
  vv_surgos: '🔬 VV (sürgős)',
  karam_valtas_ovi_kezdete: '🏠 Óvi karám (kezdet)',
  karam_valtas_ovi_ajanlott: '🏠 Óvi karám (ajánlott)',
  karam_valtas_ovi_surgos: '🏠 Óvi karám (sürgős)',
  tenyesztesi_emlekezeto_kezdete: '💕 Tenyésztés (kezdet)',
  tenyesztesi_emlekezeto_ajanlott: '💕 Tenyésztés (ajánlott)',
  tenyesztesi_emlekezeto_surgos: '💕 Tenyésztés (sürgős)',
  piaci_lehetoseg_kezdete: '💰 Értékesítés (kezdet)',
  piaci_lehetoseg_ajanlott: '💰 Értékesítés (ajánlott)',
  piaci_lehetoseg_surgos: '💰 Értékesítés (sürgős)'
};

export const PRIORITY_LABELS: Record<AlertPriority, string> = {
  kritikus: 'Kritikus',
  surgos: 'Sürgős', 
  magas: 'Magas',
  kozepes: 'Közepes',
  alacsony: 'Alacsony'
};

export const PEN_FUNCTION_LABELS: Record<PenFunctionType, string> = {
  bölcsi: '🐮 Bölcsi',
  óvi: '🐄 Óvi',
  hárem: '🐄💕 Hárem',
  vemhes: '🐄💖 Vemhes',
  ellető: '🐄🍼 Ellető',
  tehén: '🐄🍼 Tehén',
  hízóbika: '🐂 Hízóbika',
  üres: '⭕ Üres',
  átmeneti: '🔄 Átmeneti',
  kórház: '🏥 Kórház',
  karantén: '🔒 Karantén',
  selejt: '📦 Selejt'
};

// ✅ NOTES TEMPLATE RENDSZER
export const NOTES_TEMPLATES: Record<PenFunctionType, string> = {
  bölcsi: `Súlygyarapodás: ___kg/hét
Vakcinázási státusz: ___
Egészségi állapot: ___
Különleges igények: ___`,

  óvi: `Növekedési ütem: ___
Kondíció: ___
Tenyésztésre való alkalmasság: ___
Problémás állatok: ___`,

  hárem: `Tenyészbika: ___
Párzási aktivitás: ___
VV vizsgálatok: ___
Problémás állatok: ___`,

  vemhes: `Ellési dátumok: ___
RCC/BoviPast státusz: ___
Kondíció: ___
Speciális figyelés: ___`,

  ellető: `Ellések száma: ___
Komplikációk: ___
Újszülöttek állapota: ___
Segítség szükségessége: ___`,

  tehén: `Laktációs szakasz: ___
Borjak állapota: ___
Választási tervek: ___
Egészségügyi problémák: ___`,

  hízóbika: `Súlygyarapodás: ___kg/nap
Takarmány-átalakítás: ___
Értékesítési tervek: ___
Viselkedési problémák: ___`,

  üres: `Utolsó használat: ___
Tisztítás dátuma: ___
Karbantartási igények: ___
Következő felhasználás terve: ___`,

  átmeneti: `Ide kerülés oka: ___
Döntési határidő: ___
Lehetséges célkarám: ___
Szükséges vizsgálatok: ___`,

  kórház: `Kezelés típusa: ___
Gyógyszerek: ___
Állatorvos: ___
Gyógyulási előrehaladás: ___
Visszahelyezés tervezett dátuma: ___`,

  karantén: `Karantén oka: ___
Várható időtartam: ___
Egészségügyi ellenőrzések: ___
Feloldási kritériumok: ___`,

  selejt: `Selejtezés oka: ___
Értékesítési terv: ___
Piaci információk: ___
Deadline: ___`
};