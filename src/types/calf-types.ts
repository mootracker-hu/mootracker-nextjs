// src/types/calf-types.ts

export interface Calf {
  id: string;
  birth_id: string;
  calf_number: number;
  temp_id: string;
  gender: 'male' | 'female';
  is_alive: boolean;
  birth_weight?: number;
  enar?: string;
  ear_tag_date?: string;
  current_pen_id?: string;
  planned_enar?: string;
  father_enar?: string;
  father_kplsz?: string;
  father_name?: string;
  father_type?: string;
  uncertain_paternity: boolean;
  possible_fathers?: any;
  created_at: string;
  updated_at: string;
}

// VV Result interface - KÜLÖN DEFINIÁLVA
export interface VVResult {
  father_enar?: string;
  father_name?: string;
  father_kplsz?: string;
  possible_fathers?: any[];
  vv_date?: string;
  pregnancy_status?: string;
}

export interface CalfWithDetails extends Calf {
  // Birth kapcsolat
  birth?: {
    id: string;
    mother_enar: string;
    birth_date: string;
    birth_type: string;
    historical: boolean;
  };

  // VV Result kapcsolat - ÚJ
  vv_result?: VVResult | null;
  
  // Mother kapcsolat
  mother?: {
    enar: string;
    name?: string;
    kategoria: string;
  };
  
  // Pen kapcsolat
  pen?: {
    id: string;
    pen_number: string;
    pen_type: string;
  };
}

export interface CalfFormData {
  enar: string;
  ear_tag_date: string;
}