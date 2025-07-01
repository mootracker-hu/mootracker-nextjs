// Birth Module TypeScript Types
// File: src/types/birth-types.ts

export type FatherType = 'natural' | 'artificial_own' | 'artificial_external';

export type BirthType = 
  | 'easy_no_help'           // Könnyű, segítség nélkül
  | 'easy_with_help'         // Könnyű, segítséggel  
  | 'difficult_help'         // Nehéz, segítséggel
  | 'difficult_vet';         // Nehéz, állatorvosi beavatkozással

export type BirthOutcome = 
  | 'successful'             // Sikeres ellés
  | 'stillborn'              // Halva születés
  | 'miscarriage';           // Vetélés

export type CalfGender = 'male' | 'female';

// Father option for uncertain paternity cases
export interface FatherOption {
  enar?: string;
  kplsz?: string;
  name?: string;
}

// Individual calf data within a birth
export interface CalfData {
  calf_number: number;       // 1 vagy 2 (iker esetén)
  gender: CalfGender;
  is_alive: boolean;
  birth_weight?: number;
  temp_id?: string;          // Auto-generated: "33456/1", "33456/2"
}

// Birth form data structure
export interface BirthFormData {
  // Alapadatok
  birth_date: string;        // YYYY-MM-DD format
  birth_time?: string;       // HH:MM format
  historical: boolean;       // Történeti ellés flag
  
  // Apaság adatok
  father_type: FatherType;
  uncertain_paternity: boolean;
  father_enar?: string;
  father_kplsz?: string; 
  father_name?: string;
  possible_fathers?: FatherOption[];
  
  // Ellési adatok
  birth_type: BirthType;
  birth_outcome: BirthOutcome;
  mother_survived: boolean;
  complications?: string;
  attendant_person?: string;
  notes?: string;
  mother_notes: string;  // ← ÚJ MEZŐ!
  
  // Borjú adatok (1-2 db)
  calf_count: 1 | 2;
  calves: CalfData[];
}

// Database birth record
export interface Birth {
  id: string;
  mother_enar: string;
  
  // Apaság
  father_enar?: string;
  father_kplsz?: string;
  father_name?: string;
  father_type: FatherType;
  uncertain_paternity: boolean;
  possible_fathers?: FatherOption[];
  
  // Ellés
  birth_date: string;
  birth_time?: string;
  birth_type: BirthType;
  birth_outcome: BirthOutcome;
  mother_survived: boolean;
  complications?: string;
  attendant_person?: string;
  notes?: string;
  historical: boolean;
  
  // Metadata
  created_at: string;
  updated_at: string;
  user_id: string;
  farm_id: string;
}

// Database calf record
export interface Calf {
  id: string;
  birth_id: string;
  calf_number: number;
  temp_id: string;
  gender: CalfGender;
  is_alive: boolean;
  birth_weight?: number;
  enar?: string;             // Official ENAR when assigned
  ear_tag_date?: string;     // Date when ENAR was assigned
  current_pen_id?: string;   // Karám where the calf is located
  
  // Apaság (copied from birth)
  father_enar?: string;
  father_kplsz?: string;
  father_name?: string;
  father_type?: FatherType;
  uncertain_paternity?: boolean;
  possible_fathers?: FatherOption[];
  
  created_at: string;
  updated_at: string;
}

// Combined birth with calves for display
export interface BirthWithCalves extends Birth {
  calves: Calf[];
}

export interface BirthFormProps {
  motherEnar: string;
  onSuccess?: (birth: Birth) => void;
  onCancel?: () => void;
  prefillFromVV?: {
    expectedBirthDate?: string;
    fatherData?: {
      enar?: string;
      kplsz?: string;
      name?: string;
      type?: FatherType;
      possibleFathers?: FatherOption[];
    };
  };
}

// Constants for form options
export const BIRTH_TYPE_OPTIONS = [
  { value: 'easy_no_help', label: '🟢 Könnyű, segítség nélkül' },
  { value: 'easy_with_help', label: '🟡 Könnyű, segítséggel' },
  { value: 'difficult_help', label: '🟠 Nehéz, segítséggel' },
  { value: 'difficult_vet', label: '🔴 Nehéz, állatorvosi beavatkozással' }
] as const;

export const BIRTH_OUTCOME_OPTIONS = [
  { value: 'successful', label: '✅ Sikeres ellés' },
  { value: 'stillborn', label: '💀 Halva születés' },
  { value: 'miscarriage', label: '⚠️ Vetélés' }
] as const;

export const FATHER_TYPE_OPTIONS = [
  { value: 'natural', label: '🐂 Természetes fedeztetés' },
  { value: 'artificial_own', label: '🧪 Mesterséges - saját bika' },
  { value: 'artificial_external', label: '🚛 Mesterséges - külső bika' }
] as const;

export const CALF_GENDER_OPTIONS = [
  { value: 'male', label: '🐂 Bika' },
  { value: 'female', label: '🐄 Üsző' }
] as const;