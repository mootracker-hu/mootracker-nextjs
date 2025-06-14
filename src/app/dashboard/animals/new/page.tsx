'use client';

import { useRouter } from 'next/navigation';

export default function NewAnimalPage() {
  const router = useRouter();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center">
          <button
            onClick={() => router.back()}
            className="mr-4 text-gray-400 hover:text-gray-600"
          >
            ← Vissza
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Új állat hozzáadása</h1>
            <p className="mt-1 text-sm text-gray-500">
              Állat adatlap kitöltése
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-8">
        <div className="text-center">
          <div className="text-6xl mb-4">🐄</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Új állat hozzáadása
          </h3>
          <p className="text-gray-600 mb-6">
            Ez az oldal jelenleg fejlesztés alatt áll.
          </p>
          
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">🚀 Következő fejlesztési lépések:</h4>
              <ul className="text-sm text-blue-800 text-left space-y-1">
                <li>• ENAR szám validáció (HU + 10 számjegy)</li>
                <li>• Születési dátum → automatikus kategória kalkuláció</li>
                <li>• Szülők kiválasztása dropdown-ból</li>
                <li>• Karám hozzárendelés</li>
                <li>• Fotó feltöltés lehetőség</li>
                <li>• Form validáció és mentés</li>
              </ul>
            </div>

            <button
              onClick={() => router.push('/dashboard/animals')}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
            >
              📋 Vissza az állomány listához
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
