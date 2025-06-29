// src/app/dashboard/pens/add/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface NewPenData {
  pen_number: string;
  pen_type: 'outdoor' | 'barn' | 'birthing';
  capacity: number;
  location: string;
}

export default function AddPenPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<NewPenData>({
    pen_number: '',
    pen_type: 'outdoor',
    capacity: 20,
    location: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('🏠 Új karám létrehozása:', formData);

      // 1. Karám létrehozása
      const { data: newPen, error: penError } = await supabase
        .from('pens')
        .insert({
          pen_number: formData.pen_number,
          pen_type: formData.pen_type,
          capacity: formData.capacity,
          location: formData.location
        })
        .select()
        .single();

      if (penError) {
        throw penError;
      }

      console.log('✅ Karám létrehozva:', newPen);

      // 2. Alapértelmezett "üres" funkció hozzáadása
      const { error: functionError } = await supabase
        .from('pen_functions')
        .insert({
          pen_id: newPen.id,
          function_type: 'üres',
          start_date: new Date().toISOString(),
          end_date: null,
          metadata: {},
          notes: 'Újonnan létrehozott karám'
        });

      if (functionError) {
        console.warn('⚠️ Funkció létrehozási hiba:', functionError);
        // Ne állítsuk le a folyamatot emiatt
      }

      alert(`✅ Karám "${formData.pen_number}" sikeresen létrehozva!`);
      
      // Visszairányítás a karamok listájához
      router.push('/dashboard/pens');

    } catch (error) {
      console.error('💥 Karám létrehozási hiba:', error);
      alert('❌ Hiba történt: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof NewPenData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link
                href="/dashboard/pens"
                className="mr-4 p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 inline-flex items-center"
              >
                <span className="mr-1">⬅️</span>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <span className="text-3xl mr-3">➕</span>
                Új Karám Hozzáadása
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow-sm rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <span className="text-xl mr-2">📋</span>
              Karám Adatok
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Add meg az új karám alapvető információit.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-4 space-y-6">
            {/* Karám száma */}
            <div>
              <label htmlFor="pen_number" className="block text-sm font-medium text-gray-700 mb-2">
                <span className="text-lg mr-2">🏠</span>
                Karám száma *
              </label>
              <input
                type="text"
                id="pen_number"
                required
                value={formData.pen_number}
                onChange={(e) => handleInputChange('pen_number', e.target.value)}
                placeholder="pl. 15, E2, Új-1"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
              />
            </div>

            {/* Karám típusa */}
            <div>
              <label htmlFor="pen_type" className="block text-sm font-medium text-gray-700 mb-2">
                <span className="text-lg mr-2">🏗️</span>
                Karám típusa *
              </label>
              <select
                id="pen_type"
                required
                value={formData.pen_type}
                onChange={(e) => handleInputChange('pen_type', e.target.value as 'outdoor' | 'barn' | 'birthing')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors bg-white"
              >
                <option value="outdoor">🌤️ Kültéri</option>
                <option value="barn">🏠 Istálló</option>
                <option value="birthing">🍼 Ellető</option>
              </select>
            </div>

            {/* Kapacitás */}
            <div>
              <label htmlFor="capacity" className="block text-sm font-medium text-gray-700 mb-2">
                <span className="text-lg mr-2">👥</span>
                Kapacitás (állatok száma) *
              </label>
              <input
                type="number"
                id="capacity"
                required
                min="1"
                max="100"
                value={formData.capacity}
                onChange={(e) => handleInputChange('capacity', parseInt(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
              />
            </div>

            {/* Helye */}
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                <span className="text-lg mr-2">📍</span>
                Helye *
              </label>
              <input
                type="text"
                id="location"
                required
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="pl. Bal oldal, Jobb oldal, Ellető istálló"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
              />
            </div>

            {/* Gombok */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
              <Link
                href="/dashboard/pens"
                className="bg-white hover:bg-gray-50 text-gray-700 font-medium px-6 py-3 rounded-lg border border-gray-300 transition-colors inline-flex items-center"
              >
                <span className="mr-2">❌</span>
                Mégse
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-3 rounded-lg transition-colors disabled:bg-gray-400 inline-flex items-center"
              >
                <span className="mr-2">➕</span>
                {loading ? 'Létrehozás...' : 'Karám Létrehozása'}
              </button>
            </div>
          </form>
        </div>

        {/* Info panel */}
        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-sm font-medium text-green-800 mb-3 flex items-center">
            <span className="text-lg mr-2">💡</span>
            Tudnivalók:
          </h3>
          <ul className="text-sm text-green-700 space-y-2">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              Az új karám alapértelmezetten "üres" funkcióval jön létre
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              A funkciót később a Funkció Kezelés gombbal változtathatod
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              A karám száma egyedi kell legyen
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              Az állatokat a karám létrehozása után tudod hozzáadni
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}