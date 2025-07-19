'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Animal } from '@/types/animal-types';

interface EventLogTabProps {
  animal: Animal;
  onUpdate: () => void; // A fő oldal frissítéséhez
}

const EventLogTab: React.FC<EventLogTabProps> = ({ animal, onUpdate }) => {
  const [weaningDate, setWeaningDate] = useState('');
  const [weaningNotes, setWeaningNotes] = useState('');
  const [savingWeaning, setSavingWeaning] = useState(false);
  const [deletingWeaning, setDeletingWeaning] = useState(false);

  const handleWeaningSubmit = async () => {
    if (!weaningDate || !animal) return;

    try {
      setSavingWeaning(true);
      // A meglévő jegyzeteket megőrizzük, és hozzáadjuk az újat
      const currentNotes = animal.notes || '';
      const weaningEntry = `\n📅 VÁLASZTÁS - ${weaningDate}: ${weaningNotes || 'Problémamentes választás'}`;
      const updatedNotes = currentNotes + weaningEntry;

      const { error } = await supabase
        .from('animals')
        .update({ notes: updatedNotes, weaning_date: weaningDate }) // A dedikált mezőt is frissítjük
        .eq('id', animal.id);

      if (error) throw error;

      alert('✅ Választás sikeresen rögzítve!');
      setWeaningDate('');
      setWeaningNotes('');
      onUpdate(); // Frissítjük a fő komponenst
    } catch (error: any) {
      console.error('Választás mentési hiba:', error);
      alert(`❌ Hiba történt: ${error.message}`);
    } finally {
      setSavingWeaning(false);
    }
  };

  const handleDeleteLastWeaning = async () => {
    if (!animal?.notes || !animal.notes.includes('📅 VÁLASZTÁS')) {
      alert('Nincs törölhető választási bejegyzés.');
      return;
    }
    if (!confirm('Biztosan törölni szeretnéd az UTOLSÓ választási bejegyzést?')) {
      return;
    }
    try {
      setDeletingWeaning(true);
      const lines = animal.notes.split('\n');
      const lastIndex = lines.map(line => line.includes('📅 VÁLASZTÁS')).lastIndexOf(true);
      
      if(lastIndex === -1) return;

      lines.splice(lastIndex, 1);
      const updatedNotes = lines.join('\n').trim();

      // Frissítjük a `weaning_date`-t is az utolsó megmaradt választás dátumára, vagy null-ra
      const remainingWeaningLines = lines.filter(line => line.includes('📅 VÁLASZTÁS'));
      const newLastWeaningDate = remainingWeaningLines.length > 0
          ? remainingWeaningLines[remainingWeaningLines.length - 1].split(' - ')[1]?.split(':')[0]?.trim()
          : null;

      const { error } = await supabase
        .from('animals')
        .update({ notes: updatedNotes, weaning_date: newLastWeaningDate })
        .eq('id', animal.id);

      if (error) throw error;

      alert('✅ Az utolsó választási bejegyzés sikeresen törölve!');
      onUpdate();
    } catch (error: any) {
      console.error('Választás törlési hiba:', error);
      alert(`❌ Hiba történt: ${error.message}`);
    } finally {
      setDeletingWeaning(false);
    }
  };
  
  const weaningEntries = animal.notes?.split('\n').filter(line => line.includes('📅 VÁLASZTÁS')) || [];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📅 Választás Rögzítése</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Választás dátuma:</label>
            <input type="date" value={weaningDate} onChange={(e) => setWeaningDate(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg"/>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Megjegyzés (opcionális):</label>
            <input type="text" value={weaningNotes} onChange={(e) => setWeaningNotes(e.target.value)} placeholder="pl. BoviPast beadva" className="w-full p-2 border border-gray-300 rounded-lg"/>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={handleWeaningSubmit} disabled={savingWeaning || !weaningDate} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 inline-flex items-center">
            {savingWeaning && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>}
            Mentés
          </button>
          {weaningEntries.length > 0 && (
              <button onClick={handleDeleteLastWeaning} disabled={deletingWeaning} className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 disabled:opacity-50 inline-flex items-center">
                {deletingWeaning && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>}
                Utolsó törlése
              </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Eseménytörténet</h3>
        {weaningEntries.length > 0 ? (
          <div className="space-y-2">
            {weaningEntries.map((entry, index) => (
              <div key={index} className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border-l-4 border-green-400">
                {entry.trim()}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">Nincs még rögzített választási esemény.</p>
        )}
        {/* Itt jelenhetne meg a jövőben a többi esemény is */}
      </div>
    </div>
  );
};

export default EventLogTab;