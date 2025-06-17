// src/app/dashboard/animals/[enar]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  ArrowLeft, 
  Edit, 
  Calendar, 
  MapPin, 
  Users, 
  Heart, 
  Activity,
  FileText,
  Save,
  Check,
  X
} from 'lucide-react';

interface Animal {
  id: number;
  enar: string;
  szuletesi_datum: string;
  ivar: string;
  kategoria: string;
  jelenlegi_karam?: string;
  statusz: string;
  anya_enar?: string;
  apa_enar?: string;
  kplsz?: string;
  bekerules_datum: string;
  created_at: string;
}

export default function AnimalDetailPage() {
  const router = useRouter();
  
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [editedAnimal, setEditedAnimal] = useState<Animal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('reszletek');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // 🔧 Manual URL parsing (working solution)
  useEffect(() => {
    console.log('🔍 ENAR Extraction Starting...');
    
    if (typeof window !== 'undefined') {
      try {
        const pathname = window.location.pathname;
        console.log('Current pathname:', pathname);
        
        const pathParts = pathname.split('/');
        const lastPart = pathParts[pathParts.length - 1];
        
        if (lastPart && lastPart !== 'undefined' && lastPart.length > 0) {
          const decodedEnar = decodeURIComponent(lastPart);
          console.log('✅ Decoded ENAR:', decodedEnar);
          fetchAnimal(decodedEnar);
        } else {
          setError('ENAR nem található az URL-ben');
          setLoading(false);
        }
      } catch (err) {
        console.error('❌ ENAR decode error:', err);
        setError('Hibás ENAR formátum az URL-ben');
        setLoading(false);
      }
    }
  }, []);

  // 🐄 Fetch animal data
  const fetchAnimal = async (enar: string) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Searching for animal with ENAR:', enar);

      const { data, error: supabaseError } = await supabase
        .from('animals')
        .select('*')
        .eq('enar', enar)
        .single();

      if (supabaseError) {
        console.error('❌ Supabase error:', supabaseError);
        if (supabaseError.code === 'PGRST116') {
          setError(`Állat nem található: ${enar}`);
        } else {
          setError(`Adatbázis hiba: ${supabaseError.message}`);
        }
        return;
      }

      if (!data) {
        setError(`Nincs állat ezzel az ENAR-ral: ${enar}`);
        return;
      }

      console.log('✅ Animal loaded successfully:', data);
      setAnimal(data);
      setEditedAnimal(data);
    } catch (err) {
      console.error('❌ Fetch error:', err);
      setError('Hiba történt az adatok betöltése során');
    } finally {
      setLoading(false);
    }
  };

  // 💾 Save changes
  const handleSave = async () => {
    if (!editedAnimal || !animal) return;
    
    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('animals')
        .update({
          kategoria: editedAnimal.kategoria,
          ivar: editedAnimal.ivar,
          statusz: editedAnimal.statusz,
          jelenlegi_karam: editedAnimal.jelenlegi_karam,
          anya_enar: editedAnimal.anya_enar,
          apa_enar: editedAnimal.apa_enar,
          kplsz: editedAnimal.kplsz
        })
        .eq('enar', animal.enar);

      if (error) {
        console.error('Save error:', error);
        alert('Hiba a mentés során: ' + error.message);
        return;
      }

      setAnimal(editedAnimal);
      setIsEditing(false);
      console.log('✅ Changes saved successfully');
    } catch (err) {
      console.error('Save error:', err);
      alert('Hiba történt a mentés során');
    } finally {
      setSaving(false);
    }
  };

  // 📝 Update field
  const updateField = (field: keyof Animal, value: string) => {
    if (!editedAnimal) return;
    setEditedAnimal({
      ...editedAnimal,
      [field]: value
    });
  };

  // 📅 Calculate age
  const calculateAge = (birthDate: string) => {
    const birth = new Date(birthDate);
    const now = new Date();
    const diffMs = now.getTime() - birth.getTime();
    const years = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 365.25));
    const months = Math.floor((diffMs % (1000 * 60 * 60 * 24 * 365.25)) / (1000 * 60 * 60 * 24 * 30.44));
    
    if (years > 0) {
      return `${years} év ${months} hó`;
    }
    return `${months} hónap`;
  };

  // 🏷️ Get short ID
  const getShortId = (enar: string) => {
    const numbers = enar.replace(/\D/g, '');
    return numbers.slice(-5);
  };

  // 🎨 Category colors
  const getCategoryColor = (category: string) => {
    const colors = {
      'tehén': 'bg-green-100 text-green-800 border-green-200',
      'szűz_üsző': 'bg-blue-100 text-blue-800 border-blue-200',
      'vemhes_üsző': 'bg-purple-100 text-purple-800 border-purple-200',
      'nőivarú_borjú': 'bg-pink-100 text-pink-800 border-pink-200',
      'hímivarú_borjú': 'bg-orange-100 text-orange-800 border-orange-200',
      'hízóbika': 'bg-red-100 text-red-800 border-red-200',
      'tenyészbika': 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // 📊 Dropdown options
  const categoryOptions = [
    { value: 'tehén', label: 'Tehén' },
    { value: 'szűz_üsző', label: 'Szűz üsző' },
    { value: 'vemhes_üsző', label: 'Vemhes üsző' },
    { value: 'nőivarú_borjú', label: 'Nőivarú borjú' },
    { value: 'hímivarú_borjú', label: 'Hímivarú borjú' },
    { value: 'hízóbika', label: 'Hízóbika' },
    { value: 'tenyészbika', label: 'Tenyészbika' }
  ];

  const genderOptions = [
    { value: 'nő', label: 'Nő' },
    { value: 'hím', label: 'Hím' }
  ];

  const statusOptions = [
    { value: 'aktív', label: 'Aktív' },
    { value: 'eladott', label: 'Eladott' },
    { value: 'elhullott', label: 'Elhullott' },
    { value: 'karantén', label: 'Karantén' }
  ];

  const penOptions = [
    { value: '', label: 'Nincs megadva' },
    { value: 'Hárem #1', label: 'Hárem #1' },
    { value: 'Hárem #2', label: 'Hárem #2' },
    { value: 'Bölcsi #1', label: 'Bölcsi #1' },
    { value: 'Bölcsi #2', label: 'Bölcsi #2' },
    { value: 'Óvi #1', label: 'Óvi #1' },
    { value: 'Óvi #2', label: 'Óvi #2' },
    { value: 'Karám #1', label: 'Karám #1' },
    { value: 'Karám #2', label: 'Karám #2' },
    { value: 'Ellető istálló', label: 'Ellető istálló' }
  ];

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
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Vissza
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'reszletek', name: '📋 Részletek', icon: FileText },
    { id: 'szuletesi', name: '📅 Születési adatok', icon: Calendar },
    { id: 'helyzet', name: '📍 Jelenlegi helyzet', icon: MapPin },
    { id: 'csalad', name: '🐄💕🐂 Család', icon: Users },
    { id: 'egeszseg', name: '❤️ Egészség', icon: Heart },
    { id: 'esemenynaplo', name: '📊 Eseménynapló', icon: Activity }
  ];

return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {animal.enar}
                </h1>
                <p className="text-sm text-gray-500">
                  #{getShortId(animal.enar)} • {animal.kategoria}
                </p>
              </div>
            </div>
            
            <div className="flex space-x-3">
              {isEditing && (
                <button
                  onClick={() => {
                    setEditedAnimal(animal);
                    setIsEditing(false);
                  }}
                  className="flex items-center px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  <X className="h-4 w-4 mr-2" />
                  Mégse
                </button>
              )}
              <button
                onClick={isEditing ? handleSave : () => setIsEditing(true)}
                disabled={saving}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Mentés...
                  </>
                ) : isEditing ? (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Mentés
                  </>
                ) : (
                  <>
                    <Edit className="h-4 w-4 mr-2" />
                    Szerkesztés
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                <span className={`flex items-center px-3 py-4 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}>
                  <tab.icon className="h-4 w-4 mr-2" />
                  {tab.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 📋 Részletek Tab */}
        {activeTab === 'reszletek' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Alapadatok Kártya */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FileText className="h-5 w-5 mr-2 text-green-600" />
                Alapadatok
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ENAR azonosító
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={animal.enar}
                      disabled
                      className="flex-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-50 text-gray-500"
                    />
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      #{getShortId(animal.enar)}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kategória
                  </label>
                  {isEditing ? (
                    <select
                      value={editedAnimal.kategoria}
                      onChange={(e) => updateField('kategoria', e.target.value)}
                      className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      {categoryOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getCategoryColor(animal.kategoria)}`}>
                      {categoryOptions.find(opt => opt.value === animal.kategoria)?.label || animal.kategoria}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ivar
                  </label>
                  {isEditing ? (
                    <select
                      value={editedAnimal.ivar}
                      onChange={(e) => updateField('ivar', e.target.value)}
                      className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      {genderOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="flex items-center">
                      <span className="mr-2">{animal.ivar === 'nő' ? '♀️' : '♂️'}</span>
                      <span>{animal.ivar}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Életkor
                  </label>
                  <input
                    type="text"
                    value={calculateAge(animal.szuletesi_datum)}
                    disabled
                    className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-50 text-gray-500"
                  />
                </div>
              </div>
            </div>

            {/* Állapot Kártya */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Activity className="h-5 w-5 mr-2 text-blue-600" />
                Jelenlegi állapot
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Státusz
                  </label>
                  {isEditing ? (
                    <select
                      value={editedAnimal.statusz}
                      onChange={(e) => updateField('statusz', e.target.value)}
                      className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      {statusOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      animal.statusz === 'aktív' ? 'bg-green-100 text-green-800' :
                      animal.statusz === 'eladott' ? 'bg-blue-100 text-blue-800' :
                      animal.statusz === 'elhullott' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {statusOptions.find(opt => opt.value === animal.statusz)?.label || animal.statusz}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Jelenlegi karám
                  </label>
                  {isEditing ? (
                    <select
                      value={editedAnimal.jelenlegi_karam || ''}
                      onChange={(e) => updateField('jelenlegi_karam', e.target.value)}
                      className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      {penOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{animal.jelenlegi_karam || 'Nincs megadva'}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Születési dátum
                  </label>
                  <input
                    type="text"
                    value={animal.szuletesi_datum}
                    disabled
                    className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-50 text-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bekerülés dátuma
                  </label>
                  <input
                    type="text"
                    value={animal.bekerules_datum}
                    disabled
                    className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-50 text-gray-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 📅 Születési adatok Tab */}
        {activeTab === 'szuletesi' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-blue-600" />
              Születési adatok
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Születési dátum
                </label>
                <input
                  type="date"
                  value={animal.szuletesi_datum}
                  disabled={!isEditing}
                  className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm disabled:bg-gray-50 disabled:text-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bekerülés dátuma
                </label>
                <input
                  type="date"
                  value={animal.bekerules_datum}
                  disabled={!isEditing}
                  className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm disabled:bg-gray-50 disabled:text-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Életkor
                </label>
                <input
                  type="text"
                  value={calculateAge(animal.szuletesi_datum)}
                  disabled
                  className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-50 text-gray-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Család Tab */}
        {activeTab === 'csalad' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <span className="mr-2">🐄💕🐂</span>
              Szülők és családfa
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <span className="mr-2">🐄</span>
                  Anya ENAR
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedAnimal.anya_enar || ''}
                    onChange={(e) => updateField('anya_enar', e.target.value)}
                    placeholder="Pl. HU 30223 0444 9"
                    className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                ) : (
                  <div className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-50 text-gray-500">
                    {animal.anya_enar || 'Nincs megadva'}
                  </div>
                )}
              </div>

              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <span className="mr-2">🐂</span>
                  Apa ENAR
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedAnimal.apa_enar || ''}
                    onChange={(e) => updateField('apa_enar', e.target.value)}
                    placeholder="Pl. HU 30223 0444 9"
                    className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                ) : (
                  <div className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-50 text-gray-500">
                    {animal.apa_enar || 'Nincs megadva'}
                  </div>
                )}
              </div>

              {(animal.kplsz || isEditing) && (
                <div>
                  <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                    <span className="mr-2">📋</span>
                    KPLSZ szám
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedAnimal.kplsz || ''}
                      onChange={(e) => updateField('kplsz', e.target.value)}
                      placeholder="KPLSZ azonosító"
                      className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  ) : (
                    <div className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-50 text-gray-500">
                      {animal.kplsz || 'Nincs megadva'}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Placeholder tabs */}
        {['helyzet', 'egeszseg', 'esemenynaplo'].includes(activeTab) && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="text-gray-400 text-6xl mb-4">🐄</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Hamarosan elérhető
            </h3>
            <p className="text-gray-500">
              Ez a funkció még fejlesztés alatt áll
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
