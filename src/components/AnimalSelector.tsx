// src/components/AnimalSelector.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, User, Calendar, MapPin, AlertCircle } from 'lucide-react';
import { displayEnar } from '@/constants/enar-formatter'; // ✅ HOZZÁADVA!

interface Animal {
  id: number;
  enar: string;
  szuletesi_datum: string;
  ivar: string;
  kategoria: string;
  statusz: string;
  jelenlegi_karam?: string;
  anya_enar?: string;
  apa_enar?: string;
  birth_location?: 'nálunk' | 'vásárolt' | 'ismeretlen';
  name?: string;
}

interface AnimalSelectorProps {
  penId?: string;
  selected: number[];
  onChange: (selected: number[]) => void;
  multiSelect?: boolean;
  currentOnly?: boolean; // Csak jelenleg karámban lévők
  includeSoldAnimals?: boolean; // ÚJ: Eladott állatok is megjelenjenek-e
  label?: string;
  placeholder?: string;
  maxHeight?: string;
}

const AnimalSelector: React.FC<AnimalSelectorProps> = ({
  penId,
  selected,
  onChange,
  multiSelect = true,
  currentOnly = false,
  includeSoldAnimals = false, // ÚJ prop
  label = "Állatok kiválasztása",
  placeholder = "Keresés ENAR, kategória alapján...",
  maxHeight = "max-h-64"
}) => {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  // 🔍 Állatok betöltése
  useEffect(() => {
    loadAnimals();
  }, [penId, currentOnly, includeSoldAnimals]); // includeSoldAnimals hozzáadva a dependency-khez

  const loadAnimals = async () => {
    console.log('🔍 loadAnimals called with:', { penId, currentOnly, includeSoldAnimals });
    try {
      setLoading(true);
      setError(null);
      
      let query = supabase
        .from('animals')
        .select('id, enar, szuletesi_datum, ivar, kategoria, statusz, jelenlegi_karam, anya_enar, apa_enar, birth_location, name'); // ← KONKRÉT OSZLOPOK!

      // MÓDOSÍTOTT LOGIKA: státusz szűrés az includeSoldAnimals alapján
      if (includeSoldAnimals) {
        // Ha eladott állatokat is akarunk, akkor minden állatot lekérdezünk (aktív + eladott + elhullott)
        query = query.in('statusz', ['aktív', 'eladott', 'elhullott']);
        console.log('🐄 Loading ACTIVE + SOLD + DECEASED animals');
      } else {
        // Alapértelmezett: csak aktív állatok
        query = query.eq('statusz', 'aktív');
        console.log('🐄 Loading ACTIVE animals only');
      }

      query = query.order('enar');

      console.log('🔍 Before pen filtering');

      // JAVÍTOTT LOGIKA: csak akkor szűrjünk karám alapján, ha MINDKETTŐ igaz
      if (penId && currentOnly && penId !== undefined) {
        console.log('🚨 PEN FILTERING ACTIVATED!', { penId, currentOnly });
        // Jelenleg karámban lévő állatok lekérdezése
        const { data: assignments, error: assignError } = await supabase
          .from('animal_pen_assignments')
          .select('animal_id')
          .eq('pen_id', penId)
          .is('removed_at', null);

        if (assignError) throw assignError;

        const animalIds = assignments?.map(a => a.animal_id) || [];
        
        if (animalIds.length === 0) {
          setAnimals([]);
          setLoading(false);
          return;
        }

        query = query.in('id', animalIds);
      } else {
        console.log('✅ NO PEN FILTERING - loading all animals');
      }

      console.log('🔍 Executing query...');
      const { data, error } = await query;
      console.log('📊 Query result:', { 
        data: data?.length || 0, 
        error: error?.message || 'none',
        first_animal: data?.[0]?.enar || 'none',
        sold_count: data?.filter(a => a.statusz === 'eladott').length || 0
      });

      if (error) throw error;

      setAnimals(data || []);
    } catch (err: any) {
      console.error('❌ Állatok betöltési hiba:', err);
      setError('Nem sikerült betölteni az állatok listáját');
    } finally {
      setLoading(false);
    }
  };

  // 🔍 Szűrt állatok
  const filteredAnimals = animals.filter(animal =>
    animal.enar?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    animal.kategoria?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 📊 Statisztikák az eladott és elhullott állatokról
  const activeAnimalsCount = filteredAnimals.filter(a => a.statusz === 'aktív').length;
  const soldAnimalsCount = filteredAnimals.filter(a => a.statusz === 'eladott').length;
  const deceasedAnimalsCount = filteredAnimals.filter(a => a.statusz === 'elhullott').length;

  // 📝 Állat kiválasztása/eltávolítása
  const toggleAnimal = (animalId: number) => {
    if (multiSelect) {
      if (selected.includes(animalId)) {
        onChange(selected.filter(id => id !== animalId));
      } else {
        onChange([...selected, animalId]);
      }
    } else {
      onChange(selected.includes(animalId) ? [] : [animalId]);
    }
  };

  // 🎯 Mind kiválasztása
  const selectAll = () => {
    onChange(filteredAnimals.map(animal => animal.id));
  };

  // 🧹 Kiválasztás törlése
  const clearSelection = () => {
    onChange([]);
  };

  // 📅 Életkor számítás
  const calculateAge = (birthDate: string): string => {
    const birth = new Date(birthDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - birth.getTime());
    const diffMonths = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30.44));
    
    if (diffMonths < 12) {
      return `${diffMonths} hó`;
    } else {
      const years = Math.floor(diffMonths / 12);
      const months = diffMonths % 12;
      return `${years} év ${months > 0 ? months + ' hó' : ''}`;
    }
  };

  // 🎨 Kategória emoji
  const getCategoryEmoji = (kategoria: string): string => {
    const emojiMap: { [key: string]: string } = {
      'nőivarú_borjú': '🐮',
      'szűz_üsző': '🐄',
      'háremben_lévő_üsző': '🐄💕',
      'vemhes_üsző': '🐄💖',
      'üres_üsző': '🐄🚫',
      'csíra': '🐄⚠️',
      'tehén': '🐄🍼',
      'hímivarú_borjú': '🐂',
      'hízóbika': '🐂',
      'tenyészbika': '🐂'
    };
    return emojiMap[kategoria] || '❓';
  };

  // 🎨 Származás badge színe
  const getOriginBadgeColor = (birthLocation: string) => {
    switch (birthLocation) {
      case 'nálunk':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'vásárolt':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-4">
      {/* 📋 Label és statisztikák */}
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {includeSoldAnimals && (
            <span className="ml-2 text-xs text-blue-600 font-normal">
              (eladott és elhullott állatok is)
            </span>
          )}
        </label>
        <div className="text-sm text-gray-500">
          {selected.length} / {filteredAnimals.length} kiválasztva
          {includeSoldAnimals && (soldAnimalsCount > 0 || deceasedAnimalsCount > 0) && (
            <span className="ml-2 text-xs">
              ({activeAnimalsCount} aktív
              {soldAnimalsCount > 0 && `, ${soldAnimalsCount} eladott`}
              {deceasedAnimalsCount > 0 && `, ${deceasedAnimalsCount} elhullott`})
            </span>
          )}
        </div>
      </div>

      {/* 🔍 Keresés */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <input
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
        />
      </div>

      {/* ⚙️ Tömeges műveletek */}
      {multiSelect && filteredAnimals.length > 0 && (
        <div className="flex items-center justify-between text-sm">
          <button
            type="button"
            onClick={selectAll}
            className="text-blue-600 hover:text-blue-800"
          >
            Mind kiválaszt ({filteredAnimals.length})
          </button>
          {selected.length > 0 && (
            <button
              type="button"
              onClick={clearSelection}
              className="text-red-600 hover:text-red-800"
            >
              Kiválasztás törlése
            </button>
          )}
        </div>
      )}

      {/* 📊 Loading állapot */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
          <span className="ml-2 text-gray-600">Állatok betöltése...</span>
        </div>
      )}

      {/* ❌ Hiba állapot */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600 text-sm">{error}</p>
          <button
            onClick={loadAnimals}
            className="mt-2 text-red-700 underline text-sm hover:text-red-900"
          >
            Újrapróbálás
          </button>
        </div>
      )}

      {/* 📋 Állatok lista */}
      {!loading && !error && (
        <div className={`border border-gray-300 rounded-md ${maxHeight} overflow-y-auto`}>
          {filteredAnimals.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <User className="mx-auto h-8 w-8 text-gray-400 mb-2" />
              <p>Nincsenek elérhető állatok</p>
              {searchTerm && (
                <p className="text-sm">Próbálj más keresési feltételt</p>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredAnimals.map((animal) => (
                <div
                  key={animal.id}
                  className={`p-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                    selected.includes(animal.id) ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                  } ${
                    animal.statusz === 'eladott' ? 'bg-red-50' : animal.statusz === 'elhullott' ? 'bg-gray-50' : ''
                  }`}
                  onClick={() => toggleAnimal(animal.id)}
                >
                  <div className="flex items-center justify-between">
                    {/* 📋 Állat alapadatok */}
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={selected.includes(animal.id)}
                        onChange={() => toggleAnimal(animal.id)}
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                        onClick={(e) => e.stopPropagation()}
                      />
                      
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-900">
                            {/* ✅ JAVÍTVA: displayEnar használata! */}
                            {displayEnar(animal.enar)}
                            {animal.name && ` - ${animal.name}`}
                          </span>
                          <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                            {animal.ivar}
                          </span>
                          {/* ÚJ: Eladott és elhullott badge */}
                          {animal.statusz === 'eladott' && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Eladott
                            </span>
                          )}
                          {animal.statusz === 'elhullott' && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Elhullott
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                          <span className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {calculateAge(animal.szuletesi_datum)}
                          </span>
                          
                          {animal.birth_location && (
                            <span className={`px-2 py-0.5 rounded-full text-xs border ${getOriginBadgeColor(animal.birth_location)}`}>
                              {animal.birth_location === 'nálunk' ? '🏠 Nálunk' :
                               animal.birth_location === 'vásárolt' ? '🛒 Vásárolt' : '❓ Ismeretlen'}
                            </span>
                          )}
                        </div>

                        {/* Eladott és elhullott állatoknál egyszerű jelzés - részletes adatok nélkül */}
                        {animal.statusz === 'eladott' && (
                          <div className="mt-2 text-xs text-red-600">
                            📦 Ez az állat eladásra került
                          </div>
                        )}
                        {animal.statusz === 'elhullott' && (
                          <div className="mt-2 text-xs text-gray-600">
                            💀 Ez az állat elhullott
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 🎯 Kategória badge */}
                    <div className="flex items-center space-x-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {getCategoryEmoji(animal.kategoria)} {animal.kategoria.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  {/* 🐄💕🐂Család információk (ha van) */}
                  {(animal.anya_enar || animal.apa_enar) && (
                    <div className="mt-2 text-xs text-gray-500">
                      {animal.anya_enar && (
                        <span className="mr-3">
                          {/* ✅ JAVÍTVA: displayEnar használata anyánál is! */}
                          🐄 Anya: {displayEnar(animal.anya_enar)}
                        </span>
                      )}
                      {animal.apa_enar && (
                        <span>
                          {/* ✅ JAVÍTVA: displayEnar használata apánál is! */}
                          🐂 Apa: {displayEnar(animal.apa_enar)}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 📊 Kiválasztott állatok összesítő */}
      {selected.length > 0 && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-green-800 text-sm font-medium">
            {selected.length} állat kiválasztva
          </p>
          <p className="text-green-600 text-xs mt-1">
            {multiSelect ? 'További állatok hozzáadhatók' : 'Egy állat kiválasztva'}
          </p>
        </div>
      )}
    </div>
  );
};

export default AnimalSelector;