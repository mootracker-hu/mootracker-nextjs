'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface FarmData {
  id: string;
  name: string;
  description: string;
  cegnev: string;
  szekhelycim: string;
  telephely_cim: string;
  cegjegyzekszam: string;
  adoszam: string;
  vezeto_tisztsegviselo: string;
  email_cim: string;
  telefon?: string;
  tartasi_hely_azonosito: string;
  tenyeszetkod: string;
  felir_regisztracio?: string;
  idozonas?: string;
}

export default function FarmSettingsPage() {
  const [farmData, setFarmData] = useState<FarmData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [editData, setEditData] = useState<Partial<FarmData>>({});

  const supabase = createClient();

  useEffect(() => {
    loadFarmData();
  }, []);

  const loadFarmData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('farms')
        .select('*')
        .single();

      if (error) throw error;
      setFarmData(data);
    } catch (error) {
      console.error('Error loading farm data:', error);
      setMessage({type: 'error', text: 'Hiba a gazdaság adatok betöltésekor'});
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (section: string) => {
    setEditingSection(section);
    setEditData(farmData || {});
  };

  const cancelEdit = () => {
    setEditingSection(null);
    setEditData({});
  };

  const saveSection = async () => {
    if (!farmData) return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from('farms')
        .update(editData)
        .eq('id', farmData.id);

      if (error) throw error;

      setFarmData({ ...farmData, ...editData });
      setEditingSection(null);
      setEditData({});
      setMessage({type: 'success', text: 'Adatok sikeresen mentve!'});
      
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error saving farm data:', error);
      setMessage({type: 'error', text: 'Hiba a mentés során'});
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof FarmData, value: string) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1,2,3,4].map(i => (
                <div key={i} className="bg-white rounded-lg shadow-sm border p-6">
                  <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!farmData) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="text-6xl mb-4">⚠️</div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Hiba történt</h3>
            <p className="mt-2 text-gray-600">Nem sikerült betölteni a gazdaság adatait.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <span className="text-4xl mr-4">⚙️</span>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gazdaság Beállítások</h1>
              <p className="mt-2 text-gray-600">Gazdaság adatainak kezelése és szerkesztése</p>
            </div>
          </div>
        </div>

        {/* Success/Error Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            <div className="flex items-center">
              <span className="text-xl mr-2">
                {message.type === 'success' ? '✅' : '❌'}
              </span>
              {message.text}
            </div>
          </div>
        )}

        {/* Settings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Céges Adatok */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">🏢</span>
                  <h2 className="text-lg font-semibold text-gray-900">Céges Adatok</h2>
                </div>
                {editingSection === 'company' ? (
                  <div className="flex space-x-2">
                    <button
                      onClick={saveSection}
                      disabled={saving}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      <span className="mr-2">💾</span>
                      Mentés
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                    >
                      <span className="mr-2">❌</span>
                      Mégse
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => startEdit('company')}
                    className="inline-flex items-center px-4 py-2 border border-green-600 text-sm font-medium rounded-lg text-green-600 bg-white hover:bg-green-50 transition-colors"
                  >
                    <span className="mr-2">✏️</span>
                    Szerkesztés
                  </button>
                )}
              </div>

              <div className="space-y-4">
                {/* Cégnév */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🏭 Cégnév
                  </label>
                  {editingSection === 'company' ? (
                    <input
                      type="text"
                      value={editData.cegnev || ''}
                      onChange={(e) => handleInputChange('cegnev', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                      placeholder="Gazdaság Kft."
                    />
                  ) : (
                    <p className="text-gray-900 py-2">{farmData.cegnev || 'Nincs megadva'}</p>
                  )}
                </div>

                {/* Cégjegyzékszám */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    📋 Cégjegyzékszám
                  </label>
                  {editingSection === 'company' ? (
                    <input
                      type="text"
                      value={editData.cegjegyzekszam || ''}
                      onChange={(e) => handleInputChange('cegjegyzekszam', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                      placeholder="01-01-123456"
                    />
                  ) : (
                    <p className="text-gray-900 py-2">{farmData.cegjegyzekszam || 'Nincs megadva'}</p>
                  )}
                </div>

                {/* Adószám */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    💰 Adószám
                  </label>
                  {editingSection === 'company' ? (
                    <input
                      type="text"
                      value={editData.adoszam || ''}
                      onChange={(e) => handleInputChange('adoszam', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                      placeholder="12345678-1-12"
                    />
                  ) : (
                    <p className="text-gray-900 py-2">{farmData.adoszam || 'Nincs megadva'}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Címek */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">📍</span>
                  <h2 className="text-lg font-semibold text-gray-900">Címek</h2>
                </div>
                {editingSection === 'address' ? (
                  <div className="flex space-x-2">
                    <button
                      onClick={saveSection}
                      disabled={saving}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      <span className="mr-2">💾</span>
                      Mentés
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                    >
                      <span className="mr-2">❌</span>
                      Mégse
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => startEdit('address')}
                    className="inline-flex items-center px-4 py-2 border border-green-600 text-sm font-medium rounded-lg text-green-600 bg-white hover:bg-green-50 transition-colors"
                  >
                    <span className="mr-2">✏️</span>
                    Szerkesztés
                  </button>
                )}
              </div>

              <div className="space-y-4">
                {/* Székhelycím */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🏛️ Székhelycím
                  </label>
                  {editingSection === 'address' ? (
                    <textarea
                      value={editData.szekhelycim || ''}
                      onChange={(e) => handleInputChange('szekhelycim', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors resize-none"
                      rows={2}
                      placeholder="Város, Megye"
                    />
                  ) : (
                    <p className="text-gray-900 py-2">{farmData.szekhelycim || 'Nincs megadva'}</p>
                  )}
                </div>

                {/* Telephely cím */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🏭 Telephely cím
                  </label>
                  {editingSection === 'address' ? (
                    <textarea
                      value={editData.telephely_cim || ''}
                      onChange={(e) => handleInputChange('telephely_cim', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors resize-none"
                      rows={2}
                      placeholder="Város, Megye"
                    />
                  ) : (
                    <p className="text-gray-900 py-2">{farmData.telephely_cim || 'Nincs megadva'}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Kapcsolattartási Adatok */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">📞</span>
                  <h2 className="text-lg font-semibold text-gray-900">Kapcsolattartási Adatok</h2>
                </div>
                {editingSection === 'contact' ? (
                  <div className="flex space-x-2">
                    <button
                      onClick={saveSection}
                      disabled={saving}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      <span className="mr-2">💾</span>
                      Mentés
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                    >
                      <span className="mr-2">❌</span>
                      Mégse
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => startEdit('contact')}
                    className="inline-flex items-center px-4 py-2 border border-green-600 text-sm font-medium rounded-lg text-green-600 bg-white hover:bg-green-50 transition-colors"
                  >
                    <span className="mr-2">✏️</span>
                    Szerkesztés
                  </button>
                )}
              </div>

              <div className="space-y-4">
                {/* Vezető tisztségviselő */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    👤 Vezető tisztségviselő
                  </label>
                  {editingSection === 'contact' ? (
                    <input
                      type="text"
                      value={editData.vezeto_tisztsegviselo || ''}
                      onChange={(e) => handleInputChange('vezeto_tisztsegviselo', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                      placeholder="Gazda Teljes Név"
                    />
                  ) : (
                    <p className="text-gray-900 py-2">{farmData.vezeto_tisztsegviselo || 'Nincs megadva'}</p>
                  )}
                </div>

                {/* Email cím */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    📧 Email cím
                  </label>
                  {editingSection === 'contact' ? (
                    <input
                      type="email"
                      value={editData.email_cim || ''}
                      onChange={(e) => handleInputChange('email_cim', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                      placeholder="gazda@farm.hu"
                    />
                  ) : (
                    <p className="text-gray-900 py-2">{farmData.email_cim || 'Nincs megadva'}</p>
                  )}
                </div>

                {/* Telefon */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    📱 Telefonszám
                  </label>
                  {editingSection === 'contact' ? (
                    <input
                      type="tel"
                      value={editData.telefon || ''}
                      onChange={(e) => handleInputChange('telefon', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                      placeholder="+36 30 123 4567"
                    />
                  ) : (
                    <p className="text-gray-900 py-2">{farmData.telefon || 'Nincs megadva'}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Hatósági Adatok */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">📜</span>
                  <h2 className="text-lg font-semibold text-gray-900">Hatósági Adatok</h2>
                </div>
                {editingSection === 'official' ? (
                  <div className="flex space-x-2">
                    <button
                      onClick={saveSection}
                      disabled={saving}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      <span className="mr-2">💾</span>
                      Mentés
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                    >
                      <span className="mr-2">❌</span>
                      Mégse
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => startEdit('official')}
                    className="inline-flex items-center px-4 py-2 border border-green-600 text-sm font-medium rounded-lg text-green-600 bg-white hover:bg-green-50 transition-colors"
                  >
                    <span className="mr-2">✏️</span>
                    Szerkesztés
                  </button>
                )}
              </div>

              <div className="space-y-4">
                {/* Tartási hely azonosító */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🏷️ Tartási hely azonosító
                  </label>
                  {editingSection === 'official' ? (
                    <input
                      type="text"
                      value={editData.tartasi_hely_azonosito || ''}
                      onChange={(e) => handleInputChange('tartasi_hely_azonosito', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                      placeholder="1234567890"
                    />
                  ) : (
                    <p className="text-gray-900 py-2">{farmData.tartasi_hely_azonosito || 'Nincs megadva'}</p>
                  )}
                </div>

                {/* Tenyészetkód */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🧬 Tenyészetkód
                  </label>
                  {editingSection === 'official' ? (
                    <input
                      type="text"
                      value={editData.tenyeszetkod || ''}
                      onChange={(e) => handleInputChange('tenyeszetkod', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                      placeholder="1234567"
                    />
                  ) : (
                    <p className="text-gray-900 py-2">{farmData.tenyeszetkod || 'Nincs megadva'}</p>
                  )}
                </div>

                {/* FELIR regisztráció */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    📋 FELIR regisztráció
                  </label>
                  {editingSection === 'official' ? (
                    <input
                      type="text"
                      value={editData.felir_regisztracio || ''}
                      onChange={(e) => handleInputChange('felir_regisztracio', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                      placeholder="FELIR-12345"
                    />
                  ) : (
                    <p className="text-gray-900 py-2">{farmData.felir_regisztracio || 'Nincs megadva'}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Info Footer */}
        <div className="mt-8 bg-green-50 rounded-lg p-6 border border-green-200">
          <div className="flex items-start">
            <span className="text-2xl mr-3">💡</span>
            <div>
              <h3 className="text-green-800 font-semibold mb-2">Tipp</h3>
              <p className="text-green-700 text-sm">
                Az adatok módosítása után automatikusan mentésre kerülnek. 
                A módosítások azonnal érvénybe lépnek az egész rendszerben.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}