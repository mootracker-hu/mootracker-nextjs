'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Animal } from '@/types/animal-types';
import { recordAnimalEvent, ALERT_EVENT_TYPES } from '@/lib/alerts/MagyarAlertEngine';

interface EventLogTabProps {
  animal: Animal;
  onUpdate: () => void; // A fő oldal frissítéséhez
}

const EventLogTab: React.FC<EventLogTabProps> = ({ animal, onUpdate }) => {
  // ✅ VÁLASZTÁS STATE-EK (meglévő)
  const [weaningDate, setWeaningDate] = useState('');
  const [weaningNotes, setWeaningNotes] = useState('');
  const [savingWeaning, setSavingWeaning] = useState(false);
  const [deletingWeaning, setDeletingWeaning] = useState(false);

  // 🆕 ABRAK ELVÉTEL STATE-EK
  const [feedDate, setFeedDate] = useState('');
  const [feedNotes, setFeedNotes] = useState('');
  const [savingFeed, setSavingFeed] = useState(false);

  // 🆕 ÉRTÉKESÍTÉS STATE-EK
  const [saleDate, setSaleDate] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [buyerName, setBuyerName] = useState('');
  const [saleNotes, setSaleNotes] = useState('');
  const [savingSale, setSavingSale] = useState(false);

  // ✅ VÁLASZTÁS MENTÉS (meglévő logika)
  const handleWeaningSubmit = async () => {
    if (!weaningDate || !animal) return;

    try {
      setSavingWeaning(true);
      
      // 1. Animal events táblába rögzítés (ÚJ!)
      await recordAnimalEvent(
        supabase,
        animal.id,
        ALERT_EVENT_TYPES.WEANING_COMPLETED,
        weaningNotes || 'Problémamentes választás'
      );

      // 2. Notes frissítés (régi logika megtartva)
      const currentNotes = animal.notes || '';
      const weaningEntry = `\n📅 VÁLASZTÁS - ${weaningDate}: ${weaningNotes || 'Problémamentes választás'}`;
      const updatedNotes = currentNotes + weaningEntry;

      const { error } = await supabase
        .from('animals')
        .update({ notes: updatedNotes, weaning_date: weaningDate })
        .eq('id', animal.id);

      if (error) throw error;

      alert('✅ Választás sikeresen rögzítve!');
      setWeaningDate('');
      setWeaningNotes('');
      onUpdate();
    } catch (error: any) {
      console.error('Választás mentési hiba:', error);
      alert(`❌ Hiba történt: ${error.message}`);
    } finally {
      setSavingWeaning(false);
    }
  };

  // 🆕 ABRAK ELVÉTEL MENTÉS
  const handleFeedSubmit = async () => {
    if (!feedDate || !animal) return;

    try {
      setSavingFeed(true);
      
      // 1. Animal events táblába rögzítés
      await recordAnimalEvent(
        supabase,
        animal.id,
        ALERT_EVENT_TYPES.FEED_WITHDRAWN,
        feedNotes || 'Abrak elvéve vemhes állatnál'
      );

      // 2. Notes frissítés
      const currentNotes = animal.notes || '';
      const feedEntry = `\n🥗 ABRAK ELVÉTEL - ${feedDate}: ${feedNotes || 'Abrak elvéve vemhes állatnál'}`;
      const updatedNotes = currentNotes + feedEntry;

      const { error } = await supabase
        .from('animals')
        .update({ notes: updatedNotes })
        .eq('id', animal.id);

      if (error) throw error;

      alert('✅ Abrak elvétel sikeresen rögzítve!');
      setFeedDate('');
      setFeedNotes('');
      onUpdate();
    } catch (error: any) {
      console.error('Abrak elvétel mentési hiba:', error);
      alert(`❌ Hiba történt: ${error.message}`);
    } finally {
      setSavingFeed(false);
    }
  };

  // 🆕 ÉRTÉKESÍTÉS MENTÉS
  const handleSaleSubmit = async () => {
    if (!saleDate || !animal) return;

    try {
      setSavingSale(true);
      
      // 1. Animal events táblába rögzítés
      const saleInfo = `Vevő: ${buyerName || 'Nem megadott'}, Ár: ${salePrice || 'Nem megadott'} Ft. ${saleNotes || ''}`;
      await recordAnimalEvent(
        supabase,
         animal.id,
        ALERT_EVENT_TYPES.ANIMAL_SOLD,
        saleInfo
      );

      // 2. Notes frissítés
      const currentNotes = animal.notes || '';
      const saleEntry = `\n💰 ÉRTÉKESÍTÉS - ${saleDate}: Vevő: ${buyerName || 'Nem megadott'}, Ár: ${salePrice || 'Nem megadott'} Ft${saleNotes ? `, ${saleNotes}` : ''}`;
      const updatedNotes = currentNotes + saleEntry;

      // 3. Állat státusz frissítése "eladva"-ra
      const { error } = await supabase
        .from('animals')
        .update({ 
          notes: updatedNotes,
          statusz: 'eladott'
        })
        .eq('id', animal.id);

      if (error) throw error;

      alert('✅ Értékesítés sikeresen rögzítve! Az állat státusza "eladott"-ra változott.');
      setSaleDate('');
      setSalePrice('');
      setBuyerName('');
      setSaleNotes('');
      onUpdate();
    } catch (error: any) {
      console.error('Értékesítés mentési hiba:', error);
      alert(`❌ Hiba történt: ${error.message}`);
    } finally {
      setSavingSale(false);
    }
  };

  // ✅ VÁLASZTÁS TÖRLÉS (meglévő logika)
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
  
  // ✅ ESEMÉNY SZŰRÉS (kibővítve)
  const weaningEntries = animal.notes?.split('\n').filter(line => line.includes('📅 VÁLASZTÁS')) || [];
  const feedEntries = animal.notes?.split('\n').filter(line => line.includes('🥗 ABRAK ELVÉTEL')) || [];
  const saleEntries = animal.notes?.split('\n').filter(line => line.includes('💰 ÉRTÉKESÍTÉS')) || [];
  const allEntries = animal.notes?.split('\n').filter(line => 
    line.includes('📅 VÁLASZTÁS') || 
    line.includes('🥗 ABRAK ELVÉTEL') || 
    line.includes('💰 ÉRTÉKESÍTÉS')
  ) || [];

  return (
    <div className="space-y-6">
      
      {/* ✅ VÁLASZTÁS SZEKCIÓ (meglévő) */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📅 Választás Rögzítése</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Választás dátuma:</label>
            <input 
              type="date" 
              value={weaningDate} 
              onChange={(e) => setWeaningDate(e.target.value)} 
              className="w-full p-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Megjegyzés (opcionális):</label>
            <input 
              type="text" 
              value={weaningNotes} 
              onChange={(e) => setWeaningNotes(e.target.value)} 
              placeholder="pl. BoviPast beadva" 
              className="w-full p-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={handleWeaningSubmit} 
            disabled={savingWeaning || !weaningDate} 
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 inline-flex items-center"
          >
            {savingWeaning && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>}
            Mentés
          </button>
          {weaningEntries.length > 0 && (
            <button 
              onClick={handleDeleteLastWeaning} 
              disabled={deletingWeaning} 
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 disabled:opacity-50 inline-flex items-center"
            >
              {deletingWeaning && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>}
              Utolsó törlése
            </button>
          )}
        </div>
      </div>

      {/* 🆕 ABRAK ELVÉTEL SZEKCIÓ */}
      {animal.pregnancy_status === 'vemhes' && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🥗 Abrak Elvétel Rögzítése</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Abrak elvétel dátuma:</label>
              <input 
                type="date" 
                value={feedDate} 
                onChange={(e) => setFeedDate(e.target.value)} 
                className="w-full p-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Megjegyzés (opcionális):</label>
              <input 
                type="text" 
                value={feedNotes} 
                onChange={(e) => setFeedNotes(e.target.value)} 
                placeholder="pl. Teljes abrak megvonás" 
                className="w-full p-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
          <button 
            onClick={handleFeedSubmit} 
            disabled={savingFeed || !feedDate} 
            className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 disabled:opacity-50 inline-flex items-center"
          >
            {savingFeed && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>}
            Abrak Elvétel Rögzítése
          </button>
        </div>
      )}

      {/* 🆕 ÉRTÉKESÍTÉS SZEKCIÓ */}
      {animal.statusz === 'aktív' && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">💰 Értékesítés Rögzítése</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Értékesítés dátuma:</label>
              <input 
                type="date" 
                value={saleDate} 
                onChange={(e) => setSaleDate(e.target.value)} 
                className="w-full p-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Vevő neve (opcionális):</label>
              <input 
                type="text" 
                value={buyerName} 
                onChange={(e) => setBuyerName(e.target.value)} 
                placeholder="pl. Kovács János" 
                className="w-full p-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Ár (Ft, opcionális):</label>
              <input 
                type="number" 
                value={salePrice} 
                onChange={(e) => setSalePrice(e.target.value)} 
                placeholder="pl. 350000" 
                className="w-full p-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Megjegyzés (opcionális):</label>
              <input 
                type="text" 
                value={saleNotes} 
                onChange={(e) => setSaleNotes(e.target.value)} 
                placeholder="pl. Vásáron értékesítve" 
                className="w-full p-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
          <button 
            onClick={handleSaleSubmit} 
            disabled={savingSale || !saleDate} 
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 inline-flex items-center"
          >
            {savingSale && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>}
            Értékesítés Rögzítése
          </button>
        </div>
      )}

      {/* ✅ ESEMÉNYTÖRTÉNET SZEKCIÓ (kibővítve) */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Eseménytörténet</h3>
        {allEntries.length > 0 ? (
          <div className="space-y-2">
            {allEntries.map((entry, index) => {
              let borderColor = 'border-gray-400';
              if (entry.includes('📅 VÁLASZTÁS')) borderColor = 'border-green-400';
              if (entry.includes('🥗 ABRAK ELVÉTEL')) borderColor = 'border-orange-400';
              if (entry.includes('💰 ÉRTÉKESÍTÉS')) borderColor = 'border-blue-400';
              
              return (
                <div key={index} className={`text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border-l-4 ${borderColor}`}>
                  {entry.trim()}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-500">Nincs még rögzített esemény.</p>
        )}
      </div>
    </div>
  );
};

export default EventLogTab;