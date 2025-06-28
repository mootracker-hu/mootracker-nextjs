// src/lib/data/PenQueries.ts
// Clean Data Layer for Pen Management - Compatible with MagyarAlertEngine types

import { supabase } from '@/lib/supabase';
import { Animal, PenInfo } from '@/lib/alerts/MagyarAlertEngine';

// ============================================
// ADDITIONAL TYPES (not in MagyarAlertEngine)
// ============================================

export interface PenWithAnimals extends PenInfo {
  animals: Animal[];
}

export interface PenFunction {
  id: string;
  pen_id: string;
  function_name: string;
  start_date: string;
  end_date?: string;
  metadata?: Record<string, any>;
  notes?: string;
}

// ============================================
// SIMPLE CACHE SYSTEM
// ============================================

const cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

function setCache(key: string, data: any, ttlMinutes: number = 5): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttl: ttlMinutes * 60 * 1000
  });
}

function getCache<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  
  if (Date.now() - entry.timestamp > entry.ttl) {
    cache.delete(key);
    return null;
  }
  
  return entry.data as T;
}

// ============================================
// DATA MAPPING FUNCTIONS
// ============================================

function mapToPenInfo(row: any): PenInfo {
  return {
    id: row.id,
    name: `Karám ${row.pen_number}`,
    pen_number: row.pen_number,
    pen_type: row.pen_type || 'outdoor',
    capacity: row.capacity || 0,
    location: row.location,
    current_count: 0 // Will be set separately
  };
}

function mapToAnimal(row: any): Animal {
  return {
    id: row.id?.toString() || '',
    enar: row.enar || '',
    szuletesi_datum: row.szuletesi_datum || '',
    ivar: row.ivar === 'nő' ? 'nő' : 'hím',
    kategoria: row.kategoria || '',
    statusz: row.statusz || 'aktív',
    pairing_date: row.pairing_date,
    vv_date: row.vv_date,
    vv_result_days: row.vv_result_days,
    pregnancy_status: row.pregnancy_status,
    expected_birth_date: row.expected_birth_date,
    kplsz: row.kplsz_szam,
    anya_enar: row.anya_enar,
    apa_enar: row.apa_enar,
    has_given_birth: row.has_given_birth,
    last_birth_date: row.last_birth_date,
    notes: row.notes,
    birth_location: row.birth_location,
    breed: row.breed,
    acquisition_date: row.acquisition_date,
    pen_id: row.pen_id
  };
}

// ============================================
// CORE QUERY FUNCTIONS
// ============================================

/**
 * Get all pens
 */
export async function getAllPens(): Promise<PenInfo[]> {
  const cacheKey = 'all_pens';
  const cached = getCache<PenInfo[]>(cacheKey);
  if (cached) {
    console.log('📦 Cache hit: getAllPens');
    return cached;
  }

  try {
    console.log('🔄 Fetching all pens...');
    
    const { data, error } = await supabase
      .from('pens')
      .select('id, pen_number, pen_type, capacity, location')
      .order('pen_number');

    if (error) {
      console.error('❌ Error fetching pens:', error);
      throw error;
    }

    const pens = (data || []).map(mapToPenInfo);
    setCache(cacheKey, pens, 3);
    
    console.log(`✅ Fetched ${pens.length} pens`);
    return pens;

  } catch (error) {
    console.error('❌ getAllPens error:', error);
    return [];
  }
}

/**
 * Get all animals
 */
export async function getAllAnimalsWithPens(): Promise<Animal[]> {
  const cacheKey = 'animals_with_pens';
  const cached = getCache<Animal[]>(cacheKey);
  if (cached) {
    console.log('📦 Cache hit: getAllAnimalsWithPens');
    return cached;
  }

  try {
    console.log('🔄 Fetching animals...');
    
    const { data: animalsData, error } = await supabase
      .from('animals')
      .select(`
        id, enar, szuletesi_datum, ivar, kategoria, statusz,
        pairing_date, vv_date, vv_result_days, pregnancy_status, expected_birth_date,
        kplsz_szam, anya_enar, apa_enar, has_given_birth, last_birth_date,
        notes, birth_location, breed, acquisition_date
      `)
      .eq('statusz', 'aktív')
      .order('enar');

    if (error) {
      console.error('❌ Error fetching animals:', error);
      throw error;
    }

    // Get pen assignments
    const { data: assignments } = await supabase
      .from('animal_pen_assignments')
      .select('animal_id, pen_id')
      .is('removed_at', null);

    // Create animal-pen mapping
    const animalPenMap = new Map<number, string>();
    if (assignments) {
      assignments.forEach(a => animalPenMap.set(a.animal_id, a.pen_id));
    }

    // Map animals with pen assignments
    const animals = (animalsData || []).map(row => {
      const animal = mapToAnimal(row);
      animal.pen_id = animalPenMap.get(row.id);
      return animal;
    });

    setCache(cacheKey, animals, 5);
    
    console.log(`✅ Fetched ${animals.length} animals`);
    return animals;

  } catch (error) {
    console.error('❌ getAllAnimalsWithPens error:', error);
    return [];
  }
}

/**
 * Get pens with current counts
 */
export async function getPensWithCounts(): Promise<PenInfo[]> {
  const cacheKey = 'pens_with_counts';
  const cached = getCache<PenInfo[]>(cacheKey);
  if (cached) {
    console.log('📦 Cache hit: getPensWithCounts');
    return cached;
  }

  try {
    console.log('🔄 Fetching pens with counts...');
    
    // Get basic pens
    const pens = await getAllPens();
    
    // Get animal counts
    const { data: assignments } = await supabase
      .from('animal_pen_assignments')
      .select('pen_id')
      .is('removed_at', null);

    // Count animals per pen
    const counts = new Map<string, number>();
    if (assignments) {
      assignments.forEach(a => {
        counts.set(a.pen_id, (counts.get(a.pen_id) || 0) + 1);
      });
    }

    // Add counts to pens
    const pensWithCounts = pens.map(pen => ({
      ...pen,
      current_count: counts.get(pen.id) || 0
    }));

    setCache(cacheKey, pensWithCounts, 3);
    
    console.log(`✅ Fetched ${pensWithCounts.length} pens with counts`);
    return pensWithCounts;

  } catch (error) {
    console.error('❌ getPensWithCounts error:', error);
    return [];
  }
}

/**
 * Get pen with animals
 */
export async function getPenWithAnimals(penId: string): Promise<PenWithAnimals | null> {
  const cacheKey = `pen_animals_${penId}`;
  const cached = getCache<PenWithAnimals>(cacheKey);
  if (cached) {
    console.log(`📦 Cache hit: getPenWithAnimals(${penId})`);
    return cached;
  }

  try {
    console.log(`🔄 Fetching pen ${penId} with animals...`);
    
    // Get pen info
    const { data: penData, error: penError } = await supabase
      .from('pens')
      .select('*')
      .eq('id', penId)
      .single();

    if (penError || !penData) {
      console.log(`❌ Pen ${penId} not found`);
      return null;
    }

    // Get animals in pen
    const { data: assignments } = await supabase
      .from('animal_pen_assignments')
      .select(`
        animals!inner(
          id, enar, szuletesi_datum, ivar, kategoria, statusz,
          pairing_date, vv_date, vv_result_days, pregnancy_status, expected_birth_date,
          kplsz_szam, anya_enar, apa_enar, has_given_birth, last_birth_date,
          notes, birth_location, breed, acquisition_date
        )
      `)
      .eq('pen_id', penId)
      .is('removed_at', null);

    const animals: Animal[] = assignments ? 
      assignments.map(a => {
        const animal = mapToAnimal(a.animals);
        animal.pen_id = penId;
        return animal;
      }) : [];

    const result: PenWithAnimals = {
      ...mapToPenInfo(penData),
      current_count: animals.length,
      animals
    };

    setCache(cacheKey, result, 2);
    
    console.log(`✅ Fetched pen ${penId} with ${animals.length} animals`);
    return result;

  } catch (error) {
    console.error(`❌ getPenWithAnimals(${penId}) error:`, error);
    return null;
  }
}

/**
 * Assign animal to pen
 */
export async function assignAnimalToPen(
  animalId: number,
  penId: string,
  reason?: string
): Promise<boolean> {
  try {
    console.log(`🔄 Assigning animal ${animalId} to pen ${penId}...`);
    
    // Remove existing assignments
    await supabase
      .from('animal_pen_assignments')
      .update({ removed_at: new Date().toISOString() })
      .eq('animal_id', animalId)
      .is('removed_at', null);

    // Create new assignment
    const { error } = await supabase
      .from('animal_pen_assignments')
      .insert({
        animal_id: animalId,
        pen_id: penId,
        assigned_at: new Date().toISOString(),
        assignment_reason: reason || 'Manual assignment'
      });

    if (error) {
      console.error('❌ Assignment error:', error);
      return false;
    }

    // Clear cache
    clearCache();
    
    console.log(`✅ Animal ${animalId} assigned to pen ${penId}`);
    return true;

  } catch (error) {
    console.error('❌ assignAnimalToPen error:', error);
    return false;
  }
}

/**
 * Remove animal from pen
 */
export async function removeAnimalFromPen(animalId: number): Promise<boolean> {
  try {
    console.log(`🔄 Removing animal ${animalId} from pen...`);
    
    const { error } = await supabase
      .from('animal_pen_assignments')
      .update({ removed_at: new Date().toISOString() })
      .eq('animal_id', animalId)
      .is('removed_at', null);

    if (error) {
      console.error('❌ Removal error:', error);
      return false;
    }

    // Clear cache
    clearCache();
    
    console.log(`✅ Animal ${animalId} removed from pen`);
    return true;

  } catch (error) {
    console.error('❌ removeAnimalFromPen error:', error);
    return false;
  }
}

/**
 * Clear all cache
 */
export function clearCache(): void {
  cache.clear();
  console.log('🗑️ Cache cleared');
}

// ============================================
// EXPORTS
// ============================================

export default {
  getAllPens,
  getAllAnimalsWithPens,
  getPensWithCounts,
  getPenWithAnimals,
  assignAnimalToPen,
  removeAnimalFromPen,
  clearCache
};