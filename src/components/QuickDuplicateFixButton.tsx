'use client';

import React, { useState } from 'react';
import { penSyncManager } from '@/lib/utils/penSyncManager';

export function QuickDuplicateFixButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  const handleFix = async () => {
    if (!confirm('Javítod a dupla assignment-eket?')) return;

    setIsLoading(true);
    setResult('');

    try {
      const syncResult = await penSyncManager.fixAllDuplicateAssignments();
      setResult(syncResult.success ? `✅ ${syncResult.message}` : `❌ ${syncResult.message}`);
    } catch (error) {
      setResult(`❌ Hiba: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
      <h3 className="font-bold text-red-800 mb-2">🚨 Dupla Assignment Javító</h3>
      <p className="text-sm text-gray-600 mb-3">
        Olyan állatok javítása, akiknek több aktív karám assignment-jük van.
      </p>
      
      <button
        onClick={handleFix}
        disabled={isLoading}
        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
      >
        {isLoading ? '🔄 Javítás...' : '🔧 Dupla Assignments Javítása'}
      </button>

      {result && (
        <div className="mt-3 p-2 rounded text-sm bg-gray-100">
          {result}
        </div>
      )}
    </div>
  );
}