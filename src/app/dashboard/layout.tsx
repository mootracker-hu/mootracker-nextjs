'use client';

import { useRouter, usePathname } from 'next/navigation';
import { ReactNode, useState } from 'react';
import { Users } from 'lucide-react'

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
  { 
    name: 'Dashboard', 
    href: '/dashboard', 
    icon: '📊',
    current: pathname === '/dashboard'
  },
  { 
    name: 'Állatok', 
    href: '/dashboard/animals', 
    icon: '🐄',
    current: pathname.startsWith('/dashboard/animals')
  },
  { 
    name: 'Borjak', 
    href: '/dashboard/calves', 
    icon: '🐮',
    current: pathname.startsWith('/dashboard/calves')
  },
  { 
    name: 'Tenyészbikák', 
    href: '/dashboard/bulls', 
    icon: '🐂',
    current: pathname.startsWith('/dashboard/bulls')
  },
  { 
    name: 'Karamok', 
    href: '/dashboard/pens', 
    icon: '🏠',
    current: pathname.startsWith('/dashboard/pens')
  },
  { 
    name: 'Várható ellések', 
    href: '/dashboard/expected-births', 
    icon: '🐮',
    current: pathname.startsWith('/dashboard/expected-births')
  },
  { 
    name: 'Feladatok', 
    href: '/dashboard/tasks', 
    icon: '📋',
    current: pathname.startsWith('/dashboard/tasks')
  },
  { 
    name: 'Csapat', 
    href: '/dashboard/team', 
    icon: '👥',
    current: pathname.startsWith('/dashboard/team')
  },
  { 
    name: 'Import/Export', 
    href: '/dashboard/import-export', 
    icon: '📁',
    current: pathname.startsWith('/dashboard/import-export')
  },
  { 
    name: 'Beállítások', 
    href: '/dashboard/settings/farm', 
    icon: '⚙️',
    current: pathname.startsWith('/dashboard/settings')
  },
];

  const handleLogout = () => {
    router.push('/');
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 flex z-40 lg:hidden ${sidebarOpen ? '' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <span className="sr-only">Close sidebar</span>
              <span className="text-white text-xl">✕</span>
            </button>
          </div>
          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <div className="flex-shrink-0 flex items-center px-4">
              <div className="bg-green-600 p-2 rounded-lg mr-3">
                <span className="text-white text-xl">🐄</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900">MooTracker</h1>
            </div>
            <nav className="mt-5 px-2 space-y-1">
              {navigation.map((item) => (
                <button
                  key={item.name}
                  onClick={() => {
                    router.push(item.href);
                    setSidebarOpen(false);
                  }}
                  className={`w-full text-left group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${isActive(item.href)
                    ? 'bg-green-100 text-green-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                >
                  <span className="mr-3 text-lg">{item.icon}</span>
                  {item.name}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
            <div className={`${sidebarOpen ? 'lg:flex' : 'lg:hidden'} hidden lg:flex-shrink-0 transition-all duration-300`}>
        <div className="flex flex-col w-64">
          <div className="flex flex-col h-0 flex-1 bg-white border-r border-gray-200">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <div className="flex items-center flex-shrink-0 px-4">
                <div className="bg-green-600 p-2 rounded-lg mr-3">
                  <span className="text-white text-xl">🐄</span>
                </div>
                <h1 className="text-xl font-bold text-gray-900">MooTracker</h1>
              </div>
              <nav className="mt-5 flex-1 px-2 space-y-1">
                {navigation.map((item) => (
                  <button
                    key={item.name}
                    onClick={() => router.push(item.href)}
                    className={`w-full text-left group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${isActive(item.href)
                      ? 'bg-green-100 text-green-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                  >
                    <span className="mr-3 text-lg">{item.icon}</span>
                    {item.name}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className={`flex flex-col w-0 flex-1 overflow-hidden transition-all duration-300 ${sidebarOpen ? '' : 'lg:ml-0'}`}>
        {/* Top bar */}
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow-sm border-b border-gray-200">
          <button
            className="px-4 border-r border-gray-200 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-green-500"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <span className="sr-only">Open sidebar</span>
            <span className="text-xl">☰</span>
          </button>
          <div className="flex-1 px-4 flex justify-between items-center">
            <div className="flex-1 flex items-center space-x-4">
              {/* Logo */}
              <div className="flex items-center">
                <div className="bg-green-600 p-1.5 rounded-lg mr-2">
                  <span className="text-white text-lg">🐄</span>
                </div>
                <h1 className="text-lg font-bold text-gray-900 hidden sm:block">MooTracker</h1>
              </div>
              
              {/* Breadcrumb navigation */}
              <nav className="flex" aria-label="Breadcrumb">
                <ol className="flex items-center space-x-2 text-sm">
                  <li>
                    <button
                      onClick={() => router.push('/dashboard')}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      Dashboard
                    </button>
                  </li>
                  {pathname !== '/dashboard' && (
                    <>
                      <span className="text-gray-400">/</span>
                      <li>
                        <span className="text-gray-900 font-medium">
                          {navigation.find(item => pathname.startsWith(item.href) && item.href !== '/dashboard')?.name || 'Oldal'}
                        </span>
                      </li>
                    </>
                  )}
                </ol>
              </nav>
            </div>
            <div className="ml-4 flex items-center md:ml-6">
              <span className="text-sm text-gray-600 mr-4">Demo Felhasználó</span>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
              >
                Kijelentkezés
              </button>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          {children}
        </main>
      </div>
    </div>
  );
}
