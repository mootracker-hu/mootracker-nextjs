import Link from 'next/link';
import { 
  Users, 
  FileSpreadsheet, 
  Home,
  TrendingUp,
  Calendar,
  Heart,
  Settings,
  PlusCircle
} from 'lucide-react';

export default function DashboardPage() {
  // Mock stats - later fetch from Supabase
  const stats = {
    totalAnimals: 251,
    activeAnimals: 251,
    pregnantCows: 28,
    pendingTasks: 12
  };

  const quickActions = [
    {
      title: 'Új Állat Hozzáadása',
      description: 'Új állat rögzítése a rendszerben',
      href: '/dashboard/animals/new',
      icon: PlusCircle,
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      title: 'Excel Import',
      description: 'Állatok tömeges importálása Excel fájlból',
      href: '/dashboard/import-export',
      icon: FileSpreadsheet,
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      title: 'Állomány Áttekintés',
      description: 'Teljes állomány listázása és keresés',
      href: '/dashboard/animals',
      icon: Users,
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      title: 'Karám Kezelés',
      description: 'Karámok és állatok mozgatása (hamarosan)',
      href: '/dashboard/pens',
      icon: Home,
      color: 'bg-gray-400'
    }
  ];

  const recentActivity = [
    { time: '3 óra', action: 'Rendszer helyreállítás', count: 'Sikeres' },
    { time: '1 nap', action: 'Excel import befejezve', count: '251 állat' },
    { time: '2 nap', action: 'Adatbázis szinkronizálás', count: 'Aktív' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Húsmarha telep kezelési áttekintő
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Összes Állat</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalAnimals}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Aktív Állat</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeAnimals}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Heart className="h-8 w-8 text-pink-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Vemhes Tehén</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pregnantCows}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Calendar className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Feladat</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingTasks}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Gyors Műveletek</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.title}
              href={action.href}
              className={`${action.color} text-white rounded-lg p-4 transition-colors duration-200`}
            >
              <div className="flex items-center space-x-3">
                <action.icon className="h-6 w-6" />
                <div>
                  <h3 className="font-medium">{action.title}</h3>
                  <p className="text-sm opacity-90 mt-1">{action.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Legutóbbi Tevékenységek</h2>
          <div className="space-y-3">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                  <p className="text-xs text-gray-500">{activity.time} ezelőtt</p>
                </div>
                <span className="text-sm font-medium text-green-600">
                  {activity.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Rendszer Állapot</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Adatbázis kapcsolat</span>
              <span className="flex items-center text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Aktív
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Supabase szinkronizáció</span>
              <span className="flex items-center text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Online
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Állomány</span>
              <span className="text-sm font-medium text-gray-900">251 állat</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Rendszer verzió</span>
              <span className="text-sm font-medium text-gray-900">v4.1-stable</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recovery Notice */}
      <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-medium text-blue-900">
              Rendszer helyreállítva
            </h3>
            <p className="text-blue-700 mt-1">
              A stabil alapfunkciók visszaállítva. Karám Management és finomítások újrafejlesztés alatt.
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-4">
            <Link
              href="/dashboard/animals"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Állomány →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
