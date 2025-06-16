'use client';
import { supabase } from '@/lib/supabase'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const router = useRouter();

  const stats = {
    totalAnimals: 298,
    activePens: 12,
    urgentTasks: 5,
    healthChecks: 3,
  };

  const urgentTasks = [
    {
      id: 1,
      title: 'IBR vakcina esedékes',
      description: '12 állat - Karám #3',
      dueDate: '2025-06-13',
      priority: 'high',
    },
    {
      id: 2,
      title: 'Vemhességvizsgálat',
      description: 'HU002004 - 3 hete háremben',
      dueDate: '2025-06-14',
      priority: 'medium',
    },
    {
      id: 3,
      title: 'Abrak elvétel',
      description: 'Vemhes állatok - 2.5 hó előtt',
      dueDate: '2025-06-15',
      priority: 'high',
    },
  ];

  const recentAnimals = [
    { enar: 'HU004001', category: 'Hízóbika', age: '14 hó', pen: 'Karám #1', status: 'active' },
    { enar: 'HU002004', category: 'Vemhes üsző', age: '26 hó', pen: 'Hárem #2', status: 'pregnant' },
    { enar: 'HU003021', category: 'Tehén', age: '5 év', pen: 'Karám #4', status: 'active' },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pregnant': return 'bg-blue-100 text-blue-800';
      case 'sick': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // ✅ Navigation handlers - most ezek működnek!
  const navigateToAnimals = () => {
    router.push('/dashboard/animals');
  };

  const navigateToNewAnimal = () => {
    router.push('/dashboard/animals/new');
  };

  const navigateToAnimalDetails = (enar: string) => {
    router.push(`/dashboard/animals/${enar}`);
  };

  const navigateToTasks = () => {
    router.push('/dashboard/tasks');
  };

  const navigateToSearch = () => {
    router.push('/dashboard/animals?search=true');
  };

  const handleTaskClick = (taskId: number) => {
    router.push(`/dashboard/tasks?highlight=${taskId}`);
  };
// Supabase connection test
useEffect(() => {
  const testConnection = async () => {
    console.log('Testing Supabase connection...')
    const { data, error } = await supabase.from('animals').select('*').limit(1)
    console.log('Supabase result:', { data, error })
  }
  testConnection()
}, [])
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h2>
        <p className="text-gray-600">Telep áttekintés és sürgős feladatok</p>
      </div>

      {/* Stats Grid - most ezek kattinthatóak! */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div 
          onClick={navigateToAnimals}
          className="bg-white p-6 rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
        >
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <span className="text-2xl">🐄</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Összes állat</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalAnimals}</p>
            </div>
          </div>
        </div>

        <div 
          onClick={() => router.push('/dashboard/pens')}
          className="bg-white p-6 rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
        >
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <span className="text-2xl">🏠</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Aktív karámok</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activePens}</p>
            </div>
          </div>
        </div>

        <div 
          onClick={navigateToTasks}
          className="bg-white p-6 rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
        >
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-lg">
              <span className="text-2xl">⚠️</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Sürgős feladatok</p>
              <p className="text-2xl font-bold text-gray-900">{stats.urgentTasks}</p>
            </div>
          </div>
        </div>

        <div 
          onClick={() => router.push('/dashboard/health')}
          className="bg-white p-6 rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
        >
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <span className="text-2xl">💊</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Egészségügyi</p>
              <p className="text-2xl font-bold text-gray-900">{stats.healthChecks}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Urgent Tasks - most kattinthatóak! */}
        <div className="bg-white rounded-lg shadow-lg">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center">
              <span className="mr-2">⏰</span>
              Sürgős Feladatok
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {urgentTasks.map((task) => (
                <div 
                  key={task.id} 
                  onClick={() => handleTaskClick(task.id)}
                  className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-1">
                        {task.title}
                      </h4>
                      <p className="text-sm text-gray-600 mb-2">
                        {task.description}
                      </p>
                      <div className="flex items-center text-sm text-gray-500">
                        <span>📅 {task.dueDate}</span>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-md border ${getPriorityColor(task.priority)}`}>
                      {task.priority === 'high' ? 'Sürgős' : 
                       task.priority === 'medium' ? 'Közepes' : 'Alacsony'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Animals - most kattinthatóak! */}
        <div className="bg-white rounded-lg shadow-lg">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center">
              <span className="mr-2">🐄</span>
              Legutóbb Módosított Állatok
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentAnimals.map((animal) => (
                <div 
                  key={animal.enar} 
                  onClick={() => navigateToAnimalDetails(animal.enar)}
                  className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {animal.enar}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {animal.category} • {animal.age}
                      </p>
                      <p className="text-sm text-gray-500">
                        📍 {animal.pen}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-md ${getStatusColor(animal.status)}`}>
                      {animal.status === 'active' ? 'Aktív' : 
                       animal.status === 'pregnant' ? 'Vemhes' : 'Beteg'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <button 
              onClick={navigateToAnimals}
              className="w-full mt-4 text-sm text-green-600 hover:text-green-700 font-medium hover:bg-green-50 py-2 rounded transition-colors"
            >
              Összes állat megtekintése →
            </button>
          </div>
        </div>
      </div>

      {/* Quick Actions - most működnek! */}
      <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          Gyors Műveletek
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={navigateToNewAnimal}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors text-center"
          >
            <span className="text-2xl block mb-2">➕</span>
            <p className="text-sm font-medium text-gray-600">Új állat hozzáadása</p>
          </button>
          
          <button 
            onClick={navigateToSearch}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors text-center"
          >
            <span className="text-2xl block mb-2">🔍</span>
            <p className="text-sm font-medium text-gray-600">Állat keresése</p>
          </button>
          
          <button 
            onClick={navigateToTasks}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors text-center"
          >
            <span className="text-2xl block mb-2">✅</span>
            <p className="text-sm font-medium text-gray-600">Feladat elvégzése</p>
          </button>
        </div>
      </div>
    </div>
  );
}
