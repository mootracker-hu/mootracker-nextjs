'use client';

import { useState } from 'react';
import BirthsByDate from './components/births-by-date';
import BirthsByPen from './components/births-by-pen';

export default function ExpectedBirthsPage() {
  const [activeTab, setActiveTab] = useState<'date' | 'pen'>('date');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fejléc */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-2">
                  <span>🐄🍼</span>
                  <span>Várható Ellések</span>
                </h1>
                <p className="mt-2 text-gray-600">
                  Vemhes állatok ellési dátumainak nyomon követése
                </p>
              </div>
              
              {/* Frissítés gomb */}
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                🔄 Frissítés
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tab navigáció */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('date')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'date'
                  ? 'border-green-600 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <span>📅</span>
                <span>Dátum szerint</span>
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('pen')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'pen'
                  ? 'border-green-600 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <span>🏠</span>
                <span>Karám szerint</span>
              </div>
            </button>
          </nav>
        </div>
      </div>

      {/* Tartalom terület */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'date' ? <BirthsByDate /> : <BirthsByPen />}
      </main>
    </div>
  );
}