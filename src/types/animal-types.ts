// Ez a fájl definiálja, hogy milyen adatokat tárolunk egy-egy állatról vagy apáról.
// Ez a mi központi "szótárunk", ami most már 100%-ban megegyezik a Supabase adatbázis szerkezetével.

export interface Father {
  enar: string;
  name: string;
  kplsz: string;
}

export interface Animal {
  // --- KÖTELEZŐ ADATBÁZIS MEZŐK ---
  id: number;                          // data_type: bigint, is_nullable: NO
  created_at: string;                  // data_type: timestamp with time zone, is_nullable: NO
  enar: string;                        // data_type: text, is_nullable: NO
  szuletesi_datum: string;             // data_type: date, is_nullable: NO
  ivar: 'nő' | 'hím';                  // data_type: text, is_nullable: NO

  // --- OPCIONÁLIS ADATBÁZIS MEZŐK (lehetnek üresek) ---
  kategoria: string | null;            // data_type: text, is_nullable: YES
  jelenlegi_karam: string | null;      // data_type: text, is_nullable: YES
  statusz: 'aktív' | 'eladott' | 'elhullott' | 'karantén' | null; // data_type: text, is_nullable: YES
  anya_enar: string | null;            // data_type: text, is_nullable: YES (Újabb verzió: mother_enar)
  apa_enar: string | null;             // data_type: text, is_nullable: YES (LEGACY - helyette a father_enar van)
  kplsz: string | null;                // data_type: text, is_nullable: YES
  bekerules_datum: string | null;      // data_type: date, is_nullable: YES
  birth_location: 'nálunk' | 'vásárolt' | 'ismeretlen' | null; // data_type: character varying, is_nullable: YES
  has_given_birth: boolean | null;     // data_type: boolean, is_nullable: YES
  last_birth_date: string | null;      // data_type: date, is_nullable: YES
  pregnancy_status: string | null;     // data_type: text, is_nullable: YES
  last_pregnancy_check: string | null; // data_type: date, is_nullable: YES
  breed: string | null;                // data_type: text, is_nullable: YES
  farm_code: string | null;            // data_type: text, is_nullable: YES
  acquisition_date: string | null;     // data_type: date, is_nullable: YES
  pairing_date: string | null;         // data_type: date, is_nullable: YES
  vv_date: string | null;              // data_type: date, is_nullable: YES
  vv_result_days: number | null;       // data_type: integer, is_nullable: YES
  expected_birth_date: string | null;  // data_type: date, is_nullable: YES
  notes: string | null;                // data_type: text, is_nullable: YES
  name: string | null;                 // data_type: text, is_nullable: YES
  user_id: string | null;              // data_type: uuid, is_nullable: YES
  farm_id: string | null;              // data_type: uuid, is_nullable: YES
  kikerulesi_datum: string | null;     // data_type: date, is_nullable: YES
  elhullas_datum: string | null;       // data_type: date, is_nullable: YES
  vagas_datum: string | null;          // data_type: date, is_nullable: YES
  szarmazasi_tenyeszet: string | null; // data_type: text, is_nullable: YES
  celtenyeszet: string | null;        // data_type: text, is_nullable: YES
  apa_kplsz: string | null;            // data_type: text, is_nullable: YES (LEGACY - helyette father_kplsz)
  mother_enar: string | null;          // data_type: text, is_nullable: YES
  father_enar: string | null;          // data_type: text, is_nullable: YES
  father_kplsz: string | null;         // data_type: text, is_nullable: YES
  father_name: string | null;          // data_type: text, is_nullable: YES
  birth_id: string | null;             // data_type: uuid, is_nullable: YES
  temp_id: string | null;              // data_type: text, is_nullable: YES
  exit_reason: string | null;          // data_type: text, is_nullable: YES
  weaning_date: string | null;         // data_type: date, is_nullable: YES
  uncertain_paternity: boolean | null; // data_type: boolean, is_nullable: YES
  possible_fathers: Father[] | null;   // data_type: jsonb, is_nullable: YES
  current_weight: number | null;       // data_type: numeric, is_nullable: YES
  last_weight_measured_at: string | null; // data_type: timestamp with time zone, is_nullable: YES
  weight_measurement_count: number | null; // data_type: integer, is_nullable: YES

  // --- DINAMIKUS MEZŐ (A program adja hozzá, nincs az adatbázisban) ---
  father_source?: 'birth_record' | 'vv_record' | 'legacy' | 'manual' | 'not_applicable' | 'unknown' | null;
}