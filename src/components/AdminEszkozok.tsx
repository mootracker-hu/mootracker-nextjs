'use client';

import React, { useState } from 'react';
import { penSyncManager } from '@/lib/utils/penSyncManager';

export function AdminEszkozok() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<string>('');

  const handleKarámRendszerezés = async () => {
    if (!confirm('Karám hozzárendelések rendszerezése?\n\n• Duplikációk javítása\n• Adatkonzisztencia ellenőrzése')) return;

    setIsLoading(true);
    setLastResult('');

    try {
      const result = await penSyncManager.fixAllDuplicateAssignments();
      const message = result.success 
        ? `Rendszerezés kész: ${result.message}`
        : `Hiba: ${result.message}`;
      
      setLastResult(message);
      
      // Toast-szerű visszajelzés
      if (result.success) {
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 text-sm';
        toast.textContent = `✅ ${result.message}`;
        document.body.appendChild(toast);
        
        setTimeout(() => {
          document.body.removeChild(toast);
        }, 3000);
      }
      
      setIsOpen(false);
    } catch (error) {
      setLastResult(`Rendszerezési hiba: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative inline-block">
      {/* Szuper diszkrét trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-gray-400 hover:text-gray-600 p-1 rounded transition-colors duration-200"
        title="Admin eszközök"
      >
        <span className="text-xs">⚙️</span>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <>
          {/* Háttér overlay - kattintásra bezár */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu */}
          <div className="absolute right-0 top-8 bg-white rounded-md shadow-lg border border-gray-200 py-2 z-20 min-w-64">
            <div className="px-3 py-1 text-xs font-medium text-gray-500 border-b border-gray-100 mb-1">
              Admin Eszközök
            </div>
            
            <button
              onClick={handleKarámRendszerezés}
              disabled={isLoading}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <span className="mr-3">🔧</span>
              <div>
                <div className="font-medium">Karám Rendszerezés</div>
                <div className="text-xs text-gray-500">Duplikációk és inkonzisztenciák javítása</div>
              </div>
              {isLoading && <span className="ml-auto animate-spin">⚙️</span>}
            </button>

            <button
              onClick={() => {
                alert('📊 Karám statisztikák\n\nEz a funkció hamarosan elérhető lesz!');
                setIsOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
            >
              <span className="mr-3">📊</span>
              <div>
                <div className="font-medium">Karám Statisztikák</div>
                <div className="text-xs text-gray-500">Részletes adatelemzés és jelentések</div>
              </div>
            </button>

            <button
              onClick={() => {
                alert('🔍 Adatintegritás Ellenőrzés\n\nEz a funkció hamarosan elérhető lesz!');
                setIsOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
            >
              <span className="mr-3">🔍</span>
              <div>
                <div className="font-medium">Adatintegritás</div>
                <div className="text-xs text-gray-500">Teljes rendszer ellenőrzése</div>
              </div>
            </button>
          </div>
        </>
      )}
    </div>
  );
}