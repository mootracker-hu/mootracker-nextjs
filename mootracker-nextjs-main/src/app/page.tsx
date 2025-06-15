export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-8">
      <div className="max-w-4xl mx-auto text-center">
        {/* Header */}
        <div className="mb-12">
          <div className="flex justify-center mb-6">
            <div className="bg-green-600 p-4 rounded-full shadow-lg">
              <span className="text-white text-4xl">🐄</span>
            </div>
          </div>
          <h1 className="text-6xl font-bold text-gray-900 mb-4">
            MooTracker
          </h1>
          <p className="text-xl text-green-700 font-medium mb-4">
            Professzionális Telepirányító Rendszer
          </p>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Modern webes alkalmazás 298 állat nyilvántartására, automatikus feladatkezeléssel és időzített emlékeztetőkkel.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-3xl mb-2">📊</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">298</h3>
            <p className="text-gray-600">Nyilvántartott állat</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-3xl mb-2">🏠</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">12</h3>
            <p className="text-gray-600">Aktív karám</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-3xl mb-2">⚡</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">24/7</h3>
            <p className="text-gray-600">Automatikus monitoring</p>
          </div>
        </div>

        {/* Features */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            Főbb Funkciók
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            <div className="flex items-start space-x-3">
              <span className="text-2xl">🔍</span>
              <div>
                <h3 className="font-semibold text-gray-900">Intelligens Keresés</h3>
                <p className="text-gray-600">ENAR alapú gyors keresés és szűrés</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <span className="text-2xl">📱</span>
              <div>
                <h3 className="font-semibold text-gray-900">Mobil Optimalizált</h3>
                <p className="text-gray-600">Tablet és telefon barát felület</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <span className="text-2xl">💉</span>
              <div>
                <h3 className="font-semibold text-gray-900">Egészségügyi Nyilvántartás</h3>
                <p className="text-gray-600">Vakcinák, kezelések, emlékeztetők</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <span className="text-2xl">📊</span>
              <div>
                <h3 className="font-semibold text-gray-900">Excel Integráció</h3>
                <p className="text-gray-600">Import/export funkcionalitás</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <div>
          <a href="/login" className="bg-green-600 hover:bg-green-700 text-white text-xl font-semibold px-8 py-4 rounded-lg shadow-lg transition-colors inline-block">
            🚀 Belépés a Rendszerbe
          </a>
          <p className="text-sm text-gray-500 mt-4">
            Next.js 15 + TypeScript + Tailwind CSS
          </p>
        </div>
      </div>
    </div>
  );
} 
