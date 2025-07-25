// 📅 src/components/pen-history/EventTimeline.tsx
// Kiszervezett esemény timeline megjelenítés

'use client';

import React from 'react';

// Interfaces (TeljesKaramTortenelem-ből átmásolva)
interface KombinaltEsemeny {
  id: string;
  animal_id: number;
  datum: string;
  idopont: string;
  tipus: 'event' | 'movement';
  forrás: 'animal_events' | 'animal_movements';
  from_pen?: string;
  to_pen: string;
  ok: string;
  funkci?: string;
  megjegyzes?: string;
  metadata?: any;
  function_metadata?: any;
  pen_number?: string;
  pen_location?: string;
  animal_enar?: string;
  animal_kategoria?: string;
  animal_pregnancy_status?: string;
}

interface EventTimelineProps {
  events: KombinaltEsemeny[];
  mode: 'pen' | 'animal' | 'view-only';
  onEventEdit?: (event: KombinaltEsemeny) => void;
  onEventDelete?: (event: KombinaltEsemeny) => void;
  pagination?: {
    currentPage: number;
    eventsPerPage: number;
    onPageChange: (page: number) => void;
  };
  filters?: {
    eventFilter: 'all' | 'harem' | 'movement';
    onFilterChange: (filter: string) => void;
  };
}

interface EventCardProps {
  event: KombinaltEsemeny;
  mode: 'pen' | 'animal' | 'view-only';
  onEdit?: (event: KombinaltEsemeny) => void;
  onDelete?: (event: KombinaltEsemeny) => void;
  showPeriodInfo?: boolean;
  previousEvent?: KombinaltEsemeny;
  eventIndex: number;
}

// 🔧 UTILITY FUNCTIONS
const formatHungarianDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('hu-HU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  } catch {
    return dateString;
  }
};

const napokEltelte = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Ma';
    if (diffDays === 1) return 'Tegnap';
    if (diffDays > 0) return `${diffDays} napja`;
    return `${Math.abs(diffDays)} nap múlva`;
  } catch {
    return '-';
  }
};

const getFunkciEmoji = (funkci: string | undefined, tipus: string): string => {
  const emojiMap: { [key: string]: string } = {
    'bölcsi': '🐮',
    'óvi': '🐄',
    'hárem': '🐄💕',
    'vemhes': '🐄💖',
    'ellető': '🐄🍼',
    'tehén': '🐄🍼',
    'hízóbika': '🐂',
    'üres': '⭕',
    'pen_movement': '🔄',
    'pen_assignment': '📍',
    'function_change': '⚙️',
    'breeding': '🐄💕',
    'pregnancy': '🐄💖',
    'birth': '🍼',
    'medical': '🏥',
    'quarantine': '🚨',
    'culling': '❌',
    'breeding_entry': '🐄💕',
    'harem_entry': '🐄💕',
    'other': '📝'
  };
  return emojiMap[funkci || tipus] || '📝';
};

const translateReason = (reason: string): string => {
  const translations: { [key: string]: string } = {
    'breeding': 'Tenyésztés',
    'pregnancy': 'Vemhesség',
    'birth': 'Ellés',
    'medical': 'Orvosi kezelés',
    'quarantine': 'Karantén',
    'culling': 'Selejtezés',
    'breeding_entry': 'Tenyésztésbe állítás',
    'harem_entry': 'Hárembe helyezés',
    'other': 'Egyéb',
    'weaning': 'Választás',
    'sale': 'Értékesítés',
    'death': 'Elhullás',
    'pen_movement': 'Karám váltás',
    'pen_assignment': 'Karám hozzárendelés',
    'function_change': 'Funkció váltás'
  };
  return translations[reason] || reason;
};

// 🏠 EVENT CARD KOMPONENS
const EventCard: React.FC<EventCardProps> = ({
  event,
  mode,
  onEdit,
  onDelete,
  showPeriodInfo = true,
  previousEvent,
  eventIndex
}) => {
  // Karám időszak számítási logika
  const calculatePeriodInfo = () => {
    if (!showPeriodInfo) {
      const daysSince = Math.ceil(
        (new Date().getTime() - new Date(event.datum).getTime()) / (1000 * 60 * 60 * 24)
      );
      return `${formatHungarianDate(event.datum)} - Folyamatban (${daysSince} nap)`;
    }

    if (!previousEvent) {
      // JAVÍTOTT LOGIKA: Csak akkor "Folyamatban", ha tényleg ez az állat jelenlegi karámja!
      const karamKezdete = new Date(event.datum);
      const ma = new Date();
      const diffTime = ma.getTime() - karamKezdete.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (mode === 'pen') {
        return `${formatHungarianDate(event.datum)} - Utolsó esemény (${diffDays} napja)`;
      } else {
        return `${formatHungarianDate(event.datum)} - Folyamatban (${diffDays} nap)`;
      }
    }

    const periodEnd = new Date(previousEvent.datum);
    periodEnd.setDate(periodEnd.getDate() - 1);
    const periodStart = new Date(event.datum);
    const diffDays = Math.ceil(
      (periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)
    );

    return `${formatHungarianDate(event.datum)} - ${formatHungarianDate(periodEnd.toISOString().split('T')[0])} (${diffDays} nap)`;
  };

  return (
    <div className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4 flex-1">
          <div className="text-3xl">
            {getFunkciEmoji(event.funkci, event.tipus)}
          </div>
          
          <div className="flex-1">
            {/* Karám időszak info */}
            <div className="flex items-center space-x-3 mb-2">
              <span className="font-medium text-lg">
                📅 {calculatePeriodInfo()}
              </span>
              <span className="text-sm text-gray-500">
                ({napokEltelte(event.datum)})
              </span>
              <span className={`text-xs px-2 py-1 rounded ${
                event.tipus === 'event' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
              }`}>
                {event.forrás}
              </span>
              {eventIndex === 0 && mode !== 'pen' && (
                <span className="text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-800">
                  ⭐ Jelenlegi
                </span>
              )}
            </div>

            {/* Esemény részletek */}
            <div className="space-y-1 text-sm">
              {mode !== 'animal' && (
                <p><strong>🐄 Állat:</strong> {event.animal_enar || `ID: ${event.animal_id}`}</p>
              )}
              <p><strong>🏠 Karám:</strong> {event.pen_number || `ID: ${event.to_pen}`} {event.pen_location && `(${event.pen_location})`}</p>
              {event.funkci && (
                <p><strong>⚙️ Funkció:</strong> <span className="font-medium text-purple-600">{event.funkci}</span></p>
              )}
              <p><strong>📋 Ok:</strong> {translateReason(event.ok)}</p>
              <p><strong>🕐 Időpont:</strong> {event.idopont}</p>
              {event.megjegyzes && (
                <p><strong>📝 Megjegyzés:</strong> {event.megjegyzes}</p>
              )}
            </div>

            {/* 🔥 HÁREM METADATA MEGJELENÍTÉS */}
            {(event.funkci === 'hárem' ||
              event.ok?.toLowerCase().includes('breeding') ||
              event.ok?.toLowerCase().includes('tenyészté')) && (
                <HaremMetadataDisplay event={event} />
              )}
          </div>
        </div>

        {/* Action buttons */}
        {mode !== 'view-only' && (
          <div className="flex space-x-2 ml-4">
            <button
              onClick={() => onEdit?.(event)}
              className="text-blue-600 hover:text-blue-800 p-2 rounded hover:bg-blue-50"
              title="Szerkesztés"
            >
              ✏️
            </button>
            <button
              onClick={() => onDelete?.(event)}
              className="text-red-600 hover:text-red-800 p-2 rounded hover:bg-red-50"
              title="Törlés"
            >
              🗑️
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// 💕 HÁREM METADATA DISPLAY KOMPONENS
const HaremMetadataDisplay: React.FC<{ event: KombinaltEsemeny }> = ({ event }) => {
  const renderHaremInfo = () => {
    const metadata = event.function_metadata;
    
    if (!metadata?.bulls || metadata.bulls.length === 0) {
      return (
        <div className="text-gray-600">
          <p>📝 Hárem esemény - részletek nem rögzítettek</p>
          <p className="text-xs">Szerkeszd az eseményt a hárem információk hozzáadásához</p>
        </div>
      );
    }

    const vvResult = metadata.vv_result;
    const haremStart = new Date(metadata.pairing_start_date || event.datum);

    return (
      <div className="text-sm space-y-1">
        <p><strong>🐂 Tenyészbikák:</strong> {
          metadata.bulls.map((b: any) => `${b.name} (${b.enar})`).join(', ')
        }</p>

        {metadata.pairing_start_date && (
          <p><strong>📅 Hárem kezdete:</strong> {formatHungarianDate(metadata.pairing_start_date)}</p>
        )}

        {/* VV EREDMÉNY KOMPLEX LOGIKA */}
        <VVResultDisplay 
          vvResult={vvResult}
          haremStart={haremStart}
          currentAnimalStatus={event.animal_pregnancy_status}
          isAnimalBull={metadata.bulls.some((bull: any) => bull.enar === event.animal_enar)}
          event={event}
        />

        <p><strong>🎯 Párzási módszer:</strong> {
          metadata.breeding_method === 'natural' ? 'Természetes' : 'Mesterséges'
        }</p>
      </div>
    );
  };

  return (
    <div className="mt-3 p-3 bg-pink-50 border border-pink-200 rounded">
      <h4 className="font-medium text-pink-800 mb-2">💕 Hárem Információk</h4>
      {renderHaremInfo()}
    </div>
  );
};

// 🔬 VV RESULT DISPLAY KOMPONENS
const VVResultDisplay: React.FC<{
  vvResult: any;
  haremStart: Date;
  currentAnimalStatus: string | undefined;
  isAnimalBull: boolean;
  event: KombinaltEsemeny;
}> = ({ vvResult, haremStart, currentAnimalStatus, isAnimalBull, event }) => {
  
  if (!vvResult) {
    // Nincs VV eredmény EHHEZ a háremhez
    const ma = new Date();
    const diffTime = ma.getTime() - haremStart.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return (
      <>
        <p><strong>📅 Hárem vége:</strong> <span className="text-orange-600">VV eredmény várható</span></p>
        <p><strong>📅 Háremben töltött idő:</strong> {diffDays} nap (folyamatban)</p>

        {/* KOMPLEX ÁLLAT STÁTUSZ */}
        {isAnimalBull ? (
          <>
            <p><strong>🐂 Tenyészbika:</strong> <span className="text-blue-600">Aktív a háremben</span></p>
            <p><strong>📋 Funkció:</strong> <span className="text-purple-600">Tenyésztő szerep</span></p>
          </>
        ) : currentAnimalStatus === 'vemhes' ? (
          <>
            <p><strong>🐄 Állat egyedi státusz:</strong> <span className="text-green-600">✅ Vemhes (korábbi VV alapján)</span></p>
            <p><strong>🔬 VV szükséges:</strong> <span className="text-gray-600">NINCS (már vemhes)</span></p>
          </>
        ) : currentAnimalStatus === 'üres' ? (
          <>
            <p><strong>🐄 Állat egyedi státusz:</strong> <span className="text-orange-600">❌ Üres (utolsó VV negatív)</span></p>
            <p><strong>🔬 VV szükséges:</strong> <span className="text-orange-600">IGEN - új ciklus indítása</span></p>
          </>
        ) : (
          <>
            <p><strong>🐄 Állat egyedi státusz:</strong> <span className="text-gray-600">❓ Ismeretlen (nincs VV)</span></p>
            <p><strong>🔬 VV szükséges:</strong> <span className="text-red-600">IGEN - állapot meghatározás</span></p>
          </>
        )}
      </>
    );
  }

  // Van VV eredmény
  if (vvResult.status === 'pregnant' || vvResult.status === 'vemhes') {
    const vvDate = new Date(vvResult.date);
    const diffTime = vvDate.getTime() - haremStart.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return (
      <>
        <p><strong>📅 Hárem vége:</strong> {formatHungarianDate(vvResult.date)} (VV pozitív)</p>
        <p><strong>📅 Háremben töltött idő:</strong> {diffDays} nap</p>
        <p><strong>🔬 VV eredmény:</strong> <span className="text-green-600">✅ Vemhes ({formatHungarianDate(vvResult.date)})</span></p>
        <p><strong>📋 Hárem eredmény:</strong> <span className="text-green-600">SIKERES - várható ellés ~285 nap</span></p>
      </>
    );
  }

  return (
    <p><strong>🔬 VV eredmény:</strong> <span className="text-orange-600">❌ {vvResult.status} ({formatHungarianDate(vvResult.date)})</span></p>
  );
};

// 📄 PAGINATION CONTROLS
const PaginationControls: React.FC<{
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}> = ({ currentPage, totalPages, onPageChange }) => (
  <div className="flex gap-2 items-center">
    <button
      onClick={() => onPageChange(Math.max(1, currentPage - 1))}
      disabled={currentPage === 1}
      className="px-3 py-1 bg-white text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
    >
      ⬅️ Előző
    </button>
    <span className="px-3 py-1 bg-white rounded-lg text-gray-700 font-medium">
      {currentPage} / {totalPages}
    </span>
    <button
      onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
      disabled={currentPage === totalPages}
      className="px-3 py-1 bg-white text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
    >
      Következő ➡️
    </button>
  </div>
);

// 🎯 MAIN EVENT TIMELINE KOMPONENS
export const EventTimeline: React.FC<EventTimelineProps> = ({
  events,
  mode,
  onEventEdit,
  onEventDelete,
  pagination,
  filters
}) => {
  // Szűrés
  const filteredEvents = events.filter(event => {
    if (!filters?.eventFilter || filters.eventFilter === 'all') return true;
    if (filters.eventFilter === 'harem') return event.funkci === 'hárem';
    if (filters.eventFilter === 'movement') return event.tipus === 'movement';
    return true;
  });

  // Pagination
  const paginatedEvents = pagination 
    ? filteredEvents.slice(
        (pagination.currentPage - 1) * pagination.eventsPerPage,
        pagination.currentPage * pagination.eventsPerPage
      )
    : filteredEvents;

  const totalPages = pagination ? Math.ceil(filteredEvents.length / pagination.eventsPerPage) : 1;

  if (filteredEvents.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <div className="text-6xl mb-4">📝</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Még nincs rögzített történelem</h3>
        <p className="text-gray-600 mb-4">
          Ez az {mode === 'pen' ? 'karám' : 'állat'} még nem rendelkezik esemény történettel.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Pagination Controls felül */}
      {pagination && totalPages > 1 && (
        <div className="flex justify-center">
          <PaginationControls 
            currentPage={pagination.currentPage}
            totalPages={totalPages}
            onPageChange={pagination.onPageChange}
          />
        </div>
      )}

      {/* Event List */}
      {paginatedEvents.map((event, index) => (
        <EventCard 
          key={event.id}
          event={event}
          mode={mode}
          onEdit={onEventEdit}
          onDelete={onEventDelete}
          showPeriodInfo={true}
          previousEvent={paginatedEvents[index - 1]}
          eventIndex={index}
        />
      ))}

      {/* Pagination Controls alul */}
      {pagination && totalPages > 1 && (
        <div className="flex justify-center">
          <PaginationControls 
            currentPage={pagination.currentPage}
            totalPages={totalPages}
            onPageChange={pagination.onPageChange}
          />
        </div>
      )}
    </div>
  );
};

export default EventTimeline;