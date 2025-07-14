// src/hooks/useKaramTortenelemSync.ts
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

// 🔹 INTERFACES
interface AllatKaramAdatok {
  jelenlegiKaram: string;
  jelenllegiFunkci: string;
  karambaKerulesDatuma: string;
  utolsoMozgatas: string;
}

interface KaramEsemeny {
  id: string;
  animal_id: number;
  event_type: 'pen_assignment' | 'pen_movement' | 'function_change';
  event_date: string;
  event_time?: string;
  pen_id: string;
  previous_pen_id?: string;
  pen_function: string;
  function_metadata?: any;
  reason: string;
  notes?: string;
  is_historical: boolean;
  created_at: string;
  // Joined data
  pen_number?: string;
  pen_location?: string;
  animal_enar?: string;
}

interface MozgasiTortenelem {
  events: KaramEsemeny[];
  loading: boolean;
  error: string | null;
}

// 🔹 ÁLLAT KARÁM TÖRTÉNELEM HOOK
export const useAllatKaramTortenelem = (animalId: number) => {
  const [allatAdatok, setAllatAdatok] = useState<AllatKaramAdatok>({
    jelenlegiKaram: 'Nincs rögzítve',
    jelenllegiFunkci: 'ismeretlen',
    karambaKerulesDatuma: '-',
    utolsoMozgatas: '-'
  });
  const [mozgasiTortenelem, setMozgasiTortenelem] = useState<KaramEsemeny[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const frissitAllatAdatok = useCallback(async () => {
    if (!animalId) {
      setLoading(false);
      return;
    }

    try {
      console.log('🔄 Állat karám adatok frissítése:', animalId);
      setLoading(true);
      setError(null);

      // Legfrissebb karám adatok lekérdezése
      const { data: legutobbiEsemeny, error: eventError } = await supabase
        .from('animal_events')
        .select(`
          *,
          pens!inner(pen_number, location, pen_type)
        `)
        .eq('animal_id', animalId)
        .order('event_date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (eventError && eventError.code !== 'PGRST116') {
        throw eventError;
      }

      // Teljes történelem lekérdezése
      const { data: teljesTortenelem, error: historyError } = await supabase
        .from('animal_events')
        .select(`
          *,
          pens!inner(pen_number, location, pen_type)
        `)
        .eq('animal_id', animalId)
        .order('event_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (historyError) {
        throw historyError;
      }

      // Állat adatok frissítése
      if (legutobbiEsemeny) {
        setAllatAdatok({
          jelenlegiKaram: legutobbiEsemeny.pens?.pen_number || 'Nincs karám',
          jelenllegiFunkci: legutobbiEsemeny.pen_function || 'üres',
          karambaKerulesDatuma: legutobbiEsemeny.event_date || '-',
          utolsoMozgatas: legutobbiEsemeny.event_date || '-'
        });
      } else {
        setAllatAdatok({
          jelenlegiKaram: 'Nincs rögzítve',
          jelenllegiFunkci: 'ismeretlen',
          karambaKerulesDatuma: '-',
          utolsoMozgatas: '-'
        });
      }

      // Történelem frissítése
      const processedHistory: KaramEsemeny[] = (teljesTortenelem || []).map(event => ({
        id: event.id,
        animal_id: event.animal_id,
        event_type: event.event_type,
        event_date: event.event_date,
        event_time: event.event_time || '12:00',
        pen_id: event.pen_id,
        previous_pen_id: event.previous_pen_id,
        pen_function: event.pen_function || 'üres',
        function_metadata: event.function_metadata || {},
        reason: event.reason || 'Nincs megadva',
        notes: event.notes,
        is_historical: event.is_historical || false,
        created_at: event.created_at,
        pen_number: event.pens?.pen_number,
        pen_location: event.pens?.location,
        animal_enar: String(animalId) // Placeholder, ha nincs ENAR join
      }));

      setMozgasiTortenelem(processedHistory);
      setLoading(false);

      console.log('✅ Állat adatok frissítve:', {
        karam: legutobbiEsemeny?.pens?.pen_number,
        funkci: legutobbiEsemeny?.pen_function,
        tortenelemDb: teljesTortenelem?.length || 0
      });

    } catch (error) {
      console.error('❌ Állat adatok frissítési hiba:', error);
      setError((error as Error).message);
      setLoading(false);
    }
  }, [animalId]);

  useEffect(() => {
    frissitAllatAdatok();
  }, [frissitAllatAdatok]);

  return {
    allatAdatok,
    mozgasiTortenelem,
    loading,
    error,
    frissitAllatAdatok
  };
};

// 🔹 KARÁM TÖRTÉNELEM HOOK (karám oldalhoz)
export const useKaramTortenelem = (penId: string) => {
  const [esemenyek, setEsemenyek] = useState<KaramEsemeny[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const frissitKaramTortenelem = useCallback(async () => {
    if (!penId) {
      setLoading(false);
      return;
    }

    try {
      console.log('🔄 Karám történelem frissítése:', penId);
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('animal_events')
        .select(`
          *,
          animals!inner(enar, kategoria),
          pens!inner(pen_number, location)
        `)
        .eq('pen_id', penId)
        .order('event_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      const processedEvents: KaramEsemeny[] = (data || []).map(event => ({
        id: event.id,
        animal_id: event.animal_id,
        event_type: event.event_type,
        event_date: event.event_date,
        event_time: event.event_time || '12:00',
        pen_id: event.pen_id,
        previous_pen_id: event.previous_pen_id,
        pen_function: event.pen_function || 'üres',
        function_metadata: event.function_metadata || {},
        reason: event.reason || 'Nincs megadva',
        notes: event.notes,
        is_historical: event.is_historical || false,
        created_at: event.created_at,
        pen_number: event.pens?.pen_number,
        pen_location: event.pens?.location,
        animal_enar: event.animals?.enar
      }));

      setEsemenyek(processedEvents);
      setLoading(false);

      console.log('✅ Karám történelem frissítve:', {
        penId,
        esemenyekDb: data?.length || 0
      });

    } catch (error) {
      console.error('❌ Karám történelem frissítési hiba:', error);
      setError((error as Error).message);
      setLoading(false);
    }
  }, [penId]);

  useEffect(() => {
    frissitKaramTortenelem();
  }, [frissitKaramTortenelem]);

  return {
    esemenyek,
    loading,
    error,
    frissitKaramTortenelem
  };
};

// 🔹 UTILITY FUNCTIONS
export const formatHungarianDate = (dateString: string): string => {
  if (!dateString || dateString === '-') return '-';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('hu-HU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  } catch (error) {
    return dateString;
  }
};

export const napokEltelte = (dateString: string): string => {
  if (!dateString || dateString === '-') return '-';
  
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Ma';
    if (diffDays === 1) return 'Tegnap';
    if (diffDays > 0) return `${diffDays} napja`;
    return `${Math.abs(diffDays)} nap múlva`;
  } catch (error) {
    return '-';
  }
};

export const getFunkciEmoji = (funkci: string): string => {
  const emojiMap: { [key: string]: string } = {
    'bölcsi': '🐮',
    'óvi': '🐄',
    'hárem': '🐄💕',
    'vemhes': '🐄💖',
    'ellető': '🐄🍼',
    'tehén': '🐄🍼',
    'hízóbika': '🐂',
    'üres': '⭕',
    'átmeneti': '🔄',
    'kórház': '🏥',
    'karantén': '🔒',
    'selejt': '📦',
    'ismeretlen': '❓'
  };
  return emojiMap[funkci] || '❓';
};

// 🔹 REAL-TIME SUBSCRIPTIONS (opcionális)
export const useRealtimeKaramTortenelem = (animalId?: number, penId?: string) => {
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    console.log('🔔 Real-time subscription aktiválása...');

    const channel = supabase
      .channel('animal_events_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'animal_events',
          filter: animalId ? `animal_id=eq.${animalId}` : penId ? `pen_id=eq.${penId}` : undefined
        },
        (payload) => {
          console.log('🔔 Real-time változás:', payload);
          setLastUpdate(new Date());
        }
      )
      .subscribe();

    return () => {
      console.log('🔔 Real-time subscription leállítása');
      supabase.removeChannel(channel);
    };
  }, [animalId, penId]);

  return { lastUpdate };
};

export default {
  useAllatKaramTortenelem,
  useKaramTortenelem,
  formatHungarianDate,
  napokEltelte,
  getFunkciEmoji,
  useRealtimeKaramTortenelem
};