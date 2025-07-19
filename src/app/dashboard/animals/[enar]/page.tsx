'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { Animal } from '@/types/animal-types'; // Feltételezve, hogy a típusok egy külön fájlban vannak

// --- ÚJ: A TAB-KOMPONENSEK IMPORTÁLÁSA ---
// Ezeket a fájlokat fogjuk létrehozni a components/tabs/ mappában
import SzaporitasTab from './components/tabs/SzaporitasTab';
import EllesTab from './components/tabs/EllesTab';
import DetailsTab from './components/tabs/DetailsTab';
import FamilyTab from './components/tabs/FamilyTab';
import EventLogTab from './components/tabs/EventLogTab';
import HybridAnimalPenHistory from '@/components/HybridAnimalPenHistory';

// --- GLOBÁLIS SEGÉDFÜGGVÉNYEK ---
const calculateAge = (birthDate: string) => {
  const birth = new Date(birthDate);
  const now = new Date();
  const diffMs = now.getTime() - birth.getTime();
  const years = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 365.25));
  const months = Math.floor((diffMs % (1000 * 60 * 60 * 24 * 365.25)) / (1000 * 60 * 60 * 24 * 30.44));
  if (years > 0) return `${years} év ${months} hó`;
  return `${months} hónap`;
};

const getShortId = (enar: string) => {
  if (!enar) return '';
  const numbers = enar.replace(/\D/g, '');
  return numbers.slice(-5);
};


export default function AnimalDetailPage() {
  const router = useRouter();

  // --- KÖZPONTI ÁLLAPOTKEZELÉS (STATE) ---
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [editedAnimal, setEditedAnimal] = useState<Animal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('reszletek');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentPen, setCurrentPen] = useState<string | null>(null);
  
  // --- KÖZPONTI ADATKEZELŐ FÜGGVÉNYEK ---

  const fetchAnimal = async (enar: string) => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔍 Searching for animal with ENAR:', enar);
      const { data: animalData, error: supabaseError } = await supabase.from('animals').select(`*, animal_pen_assignments!left(id,pen_id,assigned_at,removed_at,assignment_reason,notes,pens(id,pen_number,location,pen_type))`).eq('enar', enar).single();
      if (supabaseError) {
        console.error('❌ Supabase error:', supabaseError);
        if (supabaseError.code === 'PGRST116') setError(`Állat nem található: ${enar}`);
        else setError(`Adatbázis hiba: ${supabaseError.message}`);
        return;
      }
      if (!animalData) {
        setError(`Nincs állat ezzel az ENAR-ral: ${enar}`);
        return;
      }
      console.log('✅ Állat alapadatok betöltve:', animalData);
      let enhancedAnimal = { ...animalData };
      if (animalData.father_enar) {
        console.log('✅ Közvetlen apa adatok már jelen vannak.');
      } else if (animalData.anya_enar) {
        console.log('🔍 Apa adatok keresése az anya alapján:', animalData.anya_enar);
        const { data: birthData } = await supabase.from('births').select(`father_enar, father_name, father_kplsz, uncertain_paternity, possible_fathers`).eq('mother_enar', animalData.anya_enar).order('birth_date', { ascending: false }).limit(1);
        if (birthData && birthData.length > 0 && birthData[0].father_enar) {
            enhancedAnimal = { ...enhancedAnimal, ...birthData[0], father_source: 'birth_record' };
            console.log('✅ Apa adatok hozzáadva ellési rekordból.');
        } else {
            const { data: vvData } = await supabase.from('vv_results').select(`father_enar, father_name, father_kplsz, uncertain_paternity, possible_fathers`).eq('animal_enar', animalData.anya_enar).eq('pregnancy_status', 'vemhes').order('vv_date', { ascending: false }).limit(1);
            if(vvData && vvData.length > 0 && vvData[0].father_enar) {
                enhancedAnimal = { ...enhancedAnimal, ...vvData[0], father_source: 'vv_record' };
                console.log('✅ Apa adatok hozzáadva VV rekordból.');
            }
        }
      }
      console.log('🏁 Végső állat objektum:', enhancedAnimal);
      setAnimal(enhancedAnimal);
      setEditedAnimal(enhancedAnimal);
    } catch (err) {
      console.error('❌ Fetch error:', err);
      setError('Hiba történt az adatok betöltése során');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editedAnimal || !animal) return;
    try {
      setSaving(true);
      const { error } = await supabase.from('animals').update({
        name: editedAnimal.name,
        kategoria: editedAnimal.kategoria,
        ivar: editedAnimal.ivar,
        statusz: editedAnimal.statusz,
        breed: editedAnimal.breed,
        birth_location: editedAnimal.birth_location,
        szuletesi_datum: editedAnimal.szuletesi_datum,
        bekerules_datum: editedAnimal.bekerules_datum,
        anya_enar: editedAnimal.anya_enar,
        kplsz: editedAnimal.kplsz,
        notes: editedAnimal.notes
      }).eq('enar', animal.enar);

      if (error) throw error;
      alert('✅ Állat adatok sikeresen mentve!');
      setIsEditing(false);
      await fetchAnimal(animal.enar);
    } catch (error: any) {
      console.error('❌ Mentési hiba:', error);
      alert(`❌ Hiba történt a mentés során: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const fetchCurrentPen = async () => {
    if (!animal?.id) return;
    try {
      const { data: periodData, error } = await supabase
        .from('pen_history_periods')
        .select(`pens(pen_number)`)
        .contains('animal_ids', [animal.id])
        .is('end_date', null)
        .single();
      if (error) console.log("Nem a history period-ban van");
      if (periodData) {
        // @ts-ignore
        setCurrentPen(periodData.pens.pen_number);
        return;
      }
      
      const { data: assignmentData } = await supabase
        .from('animal_pen_assignments')
        .select(`pens(pen_number)`)
        .eq('animal_id', animal.id)
        .is('removed_at', null)
        .single();
      
      // @ts-ignore
      if (assignmentData) setCurrentPen(assignmentData.pens.pen_number);
      else setCurrentPen('Nincs hozzárendelve');

    } catch (error) {
      console.error('❌ Hiba a jelenlegi karám meghatározásában:', error);
      setCurrentPen('Hiba történt');
    }
  };
  
  const updateField = (field: keyof Animal, value: any) => {
    if (editedAnimal === null) return;
    setEditedAnimal({ ...editedAnimal, [field]: value });
  };
  
  const forceUpdate = () => {
    if(animal?.enar) fetchAnimal(animal.enar);
  }

  // --- ADATBETÖLTÉS (LIFECYCLE HOOKS) ---
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      const parts = pathname.split('/');
      const enar = decodeURIComponent(parts[parts.length - 1]);
      if (enar && enar !== '[enar]') {
        fetchAnimal(enar);
      } else {
        setLoading(false);
        setError("Nincs ENAR azonosító az URL-ben.");
      }
    }
  }, []);

  useEffect(() => {
    if (animal?.id) {
      fetchCurrentPen();
    }
  }, [animal?.id]);

  // --- RENDERELÉS ---
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Adatok betöltése...</p>
        </div>
      </div>
    );
  }

  if (error || !animal || !editedAnimal) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">🐄</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Hiba történt</h1>
          <p className="text-gray-600 mb-4">{error || 'Ismeretlen hiba'}</p>
          <button onClick={() => router.back()} className="bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-3 rounded-lg">
            ⬅️ Vissza
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'reszletek', name: '📋 Részletek' },
    { id: 'szaporitas', name: '🔬 Szaporítás' },
    { id: 'elles', name: '🐄 Ellés' },
    { id: 'karam-tortenelem', name: '📚 Karám Történelem' },
    { id: 'csalad', name: '🐄💕🐂 Család' },
    { id: 'esemenynaplo', name: '📊 Eseménynapló' },
    { id: 'egeszseg', name: '❤️ Egészség' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'reszletek':
        return <DetailsTab 
                  animal={animal} 
                  editedAnimal={editedAnimal} 
                  isEditing={isEditing} 
                  updateField={updateField}
                  currentPen={currentPen}
                  fetchCurrentPen={fetchCurrentPen}
                  calculateAge={calculateAge}
                  getShortId={getShortId}
                />;
      case 'csalad':
        return <FamilyTab
                  animal={animal}
                  isEditing={isEditing}
                  updateField={updateField}
                  onUpdate={forceUpdate}
                />;
      case 'szaporitas':
        return <SzaporitasTab animal={animal} />;
      case 'elles':
        return <EllesTab animal={animal} />;
      case 'karam-tortenelem':
        return (
          <div className="p-6 bg-white rounded-lg shadow-sm border">
            <HybridAnimalPenHistory 
              animalEnar={animal.enar}
              animalId={animal.id.toString()}
            />
          </div>
        );
      case 'esemenynaplo':
        return <EventLogTab animal={animal} onUpdate={forceUpdate} />;
      default:
        return (
            <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
                <div className="text-gray-400 text-6xl mb-4">🚧</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Fejlesztés alatt</h3>
                <p className="text-gray-500">Ez a funkció hamarosan elérhető lesz.</p>
            </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600 p-2 transition-colors">
                ⬅️
              </button>
              <div className="flex items-center">
                <span className="text-4xl mr-4">🐄</span>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{animal.enar}</h1>
                  <p className="mt-2 text-gray-600">#{getShortId(animal.enar)} • {animal.kategoria}</p>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              {isEditing && (
                <button onClick={() => { setEditedAnimal(animal); setIsEditing(false); }} className="bg-white hover:bg-gray-50 text-gray-700 font-medium px-6 py-3 rounded-lg border border-gray-300 transition-colors inline-flex items-center">
                  <span className="mr-2">❌</span> Mégse
                </button>
              )}
              <button onClick={isEditing ? handleSave : () => setIsEditing(true)} disabled={saving} className="bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-3 rounded-lg transition-colors disabled:opacity-50 inline-flex items-center">
                {saving ? (<> <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div> Mentés... </> ) : isEditing ? (<> <span className="mr-2">💾</span> Mentés </> ) : (<> <span className="mr-2">✏️</span> Szerkesztés </>)}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center px-6 py-4 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${activeTab === tab.id ? 'border-green-500 text-green-600 bg-green-50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                {tab.name}
              </button>
            ))}
          </div>
        </div>
        
        <div>
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
// Automatikus élesítés tesztje