// Fragmento para añadir a components/admin/AdminDashboard.tsx
// PASO 1: Importar el nuevo componente al inicio del archivo

import TypographyManager from './TypographyManager'

// PASO 2: Añadir 'typography' al useState de activeTab
// Busca esta línea y reemplázala:
const [activeTab, setActiveTab] = useState<'users' | 'plans' | 'packages' | 'trial' | 'costs' | 'typography'>('users')

// PASO 3: Añadir el botón de la pestaña Tipografía
// Busca la sección de botones de pestañas y añade este botón:

<button
  onClick={() => setActiveTab('typography')}
  className={`px-4 py-2 rounded-lg font-medium transition ${
    activeTab === 'typography'
      ? 'bg-[#D98C21] text-black'
      : 'bg-[#333] text-gray-300 hover:bg-[#444]'
  }`}
>
  Tipografía
</button>

// PASO 4: Añadir el renderizado condicional
// Busca donde están los otros {activeTab === 'X' && ...} y añade:

{activeTab === 'typography' && <TypographyManager />}


// ============================================
// VERSIÓN COMPLETA DEL FRAGMENTO DE PESTAÑAS
// ============================================
// Reemplaza toda la sección de pestañas por esto:

{/* Pestañas de navegación */}
<div className="flex gap-2 mb-6 overflow-x-auto">
  <button
    onClick={() => setActiveTab('users')}
    className={`px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
      activeTab === 'users'
        ? 'bg-[#D98C21] text-black'
        : 'bg-[#333] text-gray-300 hover:bg-[#444]'
    }`}
  >
    Usuarios
  </button>
  <button
    onClick={() => setActiveTab('plans')}
    className={`px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
      activeTab === 'plans'
        ? 'bg-[#D98C21] text-black'
        : 'bg-[#333] text-gray-300 hover:bg-[#444]'
    }`}
  >
    Planes
  </button>
  <button
    onClick={() => setActiveTab('packages')}
    className={`px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
      activeTab === 'packages'
        ? 'bg-[#D98C21] text-black'
        : 'bg-[#333] text-gray-300 hover:bg-[#444]'
    }`}
  >
    Paquetes Extra
  </button>
  <button
    onClick={() => setActiveTab('trial')}
    className={`px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
      activeTab === 'trial'
        ? 'bg-[#D98C21] text-black'
        : 'bg-[#333] text-gray-300 hover:bg-[#444]'
    }`}
  >
    Trial
  </button>
  <button
    onClick={() => setActiveTab('costs')}
    className={`px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
      activeTab === 'costs'
        ? 'bg-[#D98C21] text-black'
        : 'bg-[#333] text-gray-300 hover:bg-[#444]'
    }`}
  >
    Análisis Costos
  </button>
  <button
    onClick={() => setActiveTab('typography')}
    className={`px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
      activeTab === 'typography'
        ? 'bg-[#D98C21] text-black'
        : 'bg-[#333] text-gray-300 hover:bg-[#444]'
    }`}
  >
    Tipografía
  </button>
</div>

{/* Contenido de las pestañas */}
{activeTab === 'users' && <UsersManager />}
{activeTab === 'plans' && <PlansManager />}
{activeTab === 'packages' && <PackagesManager />}
{activeTab === 'trial' && <TrialManager />}
{activeTab === 'costs' && <CostAnalyzer />}
{activeTab === 'typography' && <TypographyManager />}
