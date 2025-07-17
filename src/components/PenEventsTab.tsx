'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface PenAnimal {
  id: number | string;  // Flexibilis típus
  enar: string;
  name?: string;
  ivar: string;
  kategoria: string;
  szuletesi_datum: string;
  current_weight?: number;
  last_weight_measured_at?: string;
  weight_measurement_count?: number;
  pregnancy_status?: string;
  expected_birth_date?: string;
  last_birth_date?: string;
  notes?: string;
}

interface PenEventsTabProps {
  penId: string;
  penNumber: string;
  penFunction?: string;
  animals: PenAnimal[];  // Animal helyett PenAnimal
  onDataChange?: () => void;
}

interface BulkAction {
  id: string;
  title: string;
  icon: string;
  description: string;
  color: string;
  enabled: boolean;
}

export default function PenEventsTab({
  penId,
  penNumber,
  penFunction,
  animals,
  onDataChange
}: PenEventsTabProps) {
  const [showBulkWeightModal, setShowBulkWeightModal] = useState(false);
  const [showBulkRCCModal, setShowBulkRCCModal] = useState(false);
  const [showBulkVVModal, setShowBulkVVModal] = useState(false);
  const [showBulkSaleModal, setShowBulkSaleModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Karámspecifikus műveletek meghatározása
  const getBulkActions = (): BulkAction[] => {
    const baseActions: BulkAction[] = [
      {
        id: 'weight',
        title: 'Bulk Súlymérés',
        icon: '⚖️',
        description: `${animals.length} állat súlyának mérése`,
        color: 'bg-purple-600 hover:bg-purple-700',
        enabled: animals.length > 0
      }
    ];

    switch(penFunction) {
      case 'hárem':
        return [
          ...baseActions,
          {
            id: 'rcc',
            title: 'RCC Vakcinázás',
            icon: '💉',
            description: 'Reprodukciós komplexum védőoltás',
            color: 'bg-blue-600 hover:bg-blue-700',
            enabled: animals.filter(a => a.ivar === 'nő').length > 0
          },
          {
            id: 'vv',
            title: 'Vemhességvizsgálat',
            icon: '🔬',
            description: 'VV eredmények rögzítése',
            color: 'bg-green-600 hover:bg-green-700',
            enabled: animals.filter(a => a.ivar === 'nő').length > 0
          }
        ];
      
      case 'vemhes':
        return [
          ...baseActions,
          {
            id: 'vv',
            title: 'VV Ellenőrzés',
            icon: '🔬',
            description: 'Vemhesség követése',
            color: 'bg-green-600 hover:bg-green-700',
            enabled: animals.length > 0
          },
          {
            id: 'protocol',
            title: '15 Napos Protokoll',
            icon: '📋',
            description: 'Ellés előkészítés',
            color: 'bg-orange-600 hover:bg-orange-700',
            enabled: animals.filter(a => a.expected_birth_date).length > 0
          }
        ];
      
      case 'hízóbika':
        return [
          ...baseActions,
          {
            id: 'sale',
            title: 'Értékesítés Előkészítés',
            icon: '💰',
            description: 'Értékesítésre jelölés',
            color: 'bg-yellow-600 hover:bg-yellow-700',
            enabled: animals.length > 0
          }
        ];
      
      case 'ellető':
        return [
          ...baseActions,
          {
            id: 'birth',
            title: 'Ellés Rögzítése',
            icon: '🍼',
            description: 'Újszülött borjak regisztrálása',
            color: 'bg-pink-600 hover:bg-pink-700',
            enabled: animals.filter(a => a.ivar === 'nő').length > 0
          }
        ];
      
      default:
        return baseActions;
    }
  };

  // Súly statisztikák számítása
  const getWeightStats = () => {
    const animalsWithWeight = animals.filter(a => a.current_weight);
    const totalWeight = animalsWithWeight.reduce((sum, a) => sum + (a.current_weight || 0), 0);
    const avgWeight = animalsWithWeight.length > 0 ? Math.round(totalWeight / animalsWithWeight.length) : 0;
    const minWeight = animalsWithWeight.length > 0 ? Math.min(...animalsWithWeight.map(a => a.current_weight || 0)) : 0;
    const maxWeight = animalsWithWeight.length > 0 ? Math.max(...animalsWithWeight.map(a => a.current_weight || 0)) : 0;

    return {
      total: animals.length,
      measured: animalsWithWeight.length,
      needWeighing: animals.length - animalsWithWeight.length,
      avgWeight,
      minWeight,
      maxWeight,
      totalWeight: Math.round(totalWeight)
    };
  };

  // Univerzális statisztikák - minden karámra
  const getPenStats = () => {
    const bulls = animals.filter(a => a.ivar === 'hím');
    const females = animals.filter(a => a.ivar === 'nő');
    const pregnant = animals.filter(a => a.pregnancy_status === 'vemhes');
    
    // Kategória összesítés
    const categories: Record<string, number> = {};
    animals.forEach(animal => {
      categories[animal.kategoria] = (categories[animal.kategoria] || 0) + 1;
    });
    
    // Életkor csoportok
    const now = new Date();
    const young = animals.filter(a => {
      const birthDate = new Date(a.szuletesi_datum);
      const ageMonths = (now.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
      return ageMonths < 12;
    });
    
    const adult = animals.filter(a => {
      const birthDate = new Date(a.szuletesi_datum);
      const ageMonths = (now.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
      return ageMonths >= 12;
    });

    return [
      { label: 'Összes állat', value: animals.length, icon: '🐄', color: 'text-gray-700' },
      { label: 'Hímivarok', value: bulls.length, icon: '🐂', color: 'text-blue-600' },
      { label: 'Nőivarok', value: females.length, icon: '🐄', color: 'text-pink-600' },
      { label: 'Fiatal (< 1 év)', value: young.length, icon: '🐮', color: 'text-green-600' },
      { label: 'Felnőtt (≥ 1 év)', value: adult.length, icon: '🐄', color: 'text-orange-600' },
      ...(pregnant.length > 0 ? [{ label: 'Vemhes', value: pregnant.length, icon: '🤰', color: 'text-purple-600' }] : [])
    ];
  };

  const bulkActions = getBulkActions();
  const weightStats = getWeightStats();
  const penStats = getPenStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 border border-green-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <span className="mr-3">🎯</span>
              Karám {penNumber} Események
            </h2>
            <p className="text-gray-600 mt-1">
              {penFunction ? `${penFunction.charAt(0).toUpperCase() + penFunction.slice(1)} karám` : 'Vegyes karám'} • {animals.length} állat
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-green-600">{animals.length}</div>
            <div className="text-sm text-gray-500">állat összesen</div>
          </div>
        </div>
      </div>

      {/* Súly Statisztikák */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
          <span className="mr-2">⚖️</span>
          Súlymérési Áttekintés
        </h3>
        
        {weightStats.measured === 0 ? (
          <div className="text-center py-4">
            <p className="text-blue-700 mb-3">📋 Egyetlen állatnak sincs súlymérési adata!</p>
            <button
              onClick={() => setShowBulkWeightModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
            >
              ⚖️ Összes Állat Súlymérése
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <p className="text-sm text-blue-600">Átlag súly</p>
              <p className="text-xl font-semibold text-blue-900">{weightStats.avgWeight} kg</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-blue-600">Tartomány</p>
              <p className="text-xl font-semibold text-blue-900">{weightStats.minWeight}-{weightStats.maxWeight} kg</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-blue-600">Mért állatok</p>
              <p className="text-xl font-semibold text-green-900">{weightStats.measured} db</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-blue-600">Mérésre vár</p>
              <p className="text-xl font-semibold text-red-900">{weightStats.needWeighing} db</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-blue-600">Összes súly</p>
              <p className="text-xl font-semibold text-blue-900">{weightStats.totalWeight} kg</p>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Műveletek */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <span className="mr-2">🚀</span>
          Bulk Műveletek
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bulkActions.map((action) => (
            <button
              key={action.id}
              onClick={() => {
                switch(action.id) {
                  case 'weight': setShowBulkWeightModal(true); break;
                  case 'rcc': setShowBulkRCCModal(true); break;
                  case 'vv': setShowBulkVVModal(true); break;
                  case 'sale': setShowBulkSaleModal(true); break;
                  default: alert(`${action.title} funkció fejlesztés alatt...`);
                }
              }}
              disabled={!action.enabled || loading}
              className={`${action.color} text-white p-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{action.icon}</span>
                <span className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded">
                  {animals.length} állat
                </span>
              </div>
              <h4 className="font-medium text-sm mb-1">{action.title}</h4>
              <p className="text-xs opacity-90">{action.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Univerzális Statisztikák - Alsó pozíció */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <span className="mr-2">📊</span>
          Állat Statisztikák
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {penStats.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg border border-gray-200 p-3">
              <div className="text-center">
                <div className="text-xl mb-1">{stat.icon}</div>
                <p className="text-xs font-medium text-gray-600 mb-1">{stat.label}</p>
                <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Kategória Megoszlás - Kisebb kártyák */}
      {animals.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="mr-2">🏷️</span>
            Kategória Megoszlás
          </h3>
          
          <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {(() => {
              const categories: Record<string, number> = {};
              animals.forEach(animal => {
                categories[animal.kategoria] = (categories[animal.kategoria] || 0) + 1;
              });
              
              return Object.entries(categories).map(([kategoria, count]) => (
                <div key={kategoria} className="bg-gray-50 border border-gray-200 p-3 rounded-lg text-center hover:bg-gray-100 transition-colors">
                  <h4 className="font-medium text-gray-900 text-xs mb-1 truncate" title={kategoria}>
                    {kategoria}
                  </h4>
                  <p className="text-xl font-bold text-blue-600">{count}</p>
                  <p className="text-xs text-gray-500">db</p>
                </div>
              ));
            })()}
          </div>
        </div>
      )}

      {/* Modal Placeholders - Later implementation */}
      {showBulkWeightModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">⚖️ Bulk Súlymérés</h3>
            <p className="text-gray-600 mb-4">
              {animals.length} állat súlymérése. Ez a funkció fejlesztés alatt áll.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowBulkWeightModal(false)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded"
              >
                Bezárás
              </button>
              <button
                onClick={() => {
                  alert('Súlymérés funkció implementálás alatt...');
                  setShowBulkWeightModal(false);
                }}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded"
              >
                Súlymérés
              </button>
            </div>
          </div>
        </div>
      )}

      {/* További modalok - RCC, VV, Sale */}
      {(showBulkRCCModal || showBulkVVModal || showBulkSaleModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">🚧 Fejlesztés Alatt</h3>
            <p className="text-gray-600 mb-4">
              Ez a funkció hamarosan elérhető lesz!
            </p>
            <button
              onClick={() => {
                setShowBulkRCCModal(false);
                setShowBulkVVModal(false);
                setShowBulkSaleModal(false);
              }}
              className="w-full bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded"
            >
              Bezárás
            </button>
          </div>
        </div>
      )}
    </div>
  );
}