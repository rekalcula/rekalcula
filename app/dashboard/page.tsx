import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import ExpenseChart from '@/components/ExpenseChart'
import TemporalComparison from '@/components/TemporalComparison'
import AlertsPanel from '@/components/AlertsPanel'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function DashboardPage() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/sign-in')
  }

  // Obtener facturas del usuario
  const { data: invoices, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  const totalInvoices = invoices?.length || 0
  const totalAmount = invoices?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0
  const avgAmount = totalInvoices > 0 ? totalAmount / totalInvoices : 0

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 bg-[#262626] min-h-screen">
      <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#d98c21]">Dashboard
        </h1>
          <p className="mt-2 text-[#FFFCFF] text-[20px]">
          Resumen de tus gastos empresariales
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-200 rounded-lg shadow p-6">
          <div className="text-xl text-gray-500">Total Facturas</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">
            {totalInvoices}
          </div>
        </div>

        <div className="bg-gray-200 rounded-lg shadow p-6">
          <div className="text-xl text-gray-500">Gasto Total</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">
            {totalAmount.toFixed(2)}€
          </div>
        </div>

        <div className="bg-gray-200 rounded-lg shadow p-6">
          <div className="text-xl text-gray-500">Promedio por Factura</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">
            {avgAmount.toFixed(2)}€
          </div>
        </div>
      </div>

      {/* Alertas de Gastos */}
      {invoices && invoices.length > 0 && (
        <div className="mb-8">
          <AlertsPanel invoices={invoices} />
        </div>
      )}

      {/* Gráficas de Distribución */}
      {invoices && invoices.length > 0 && (
        <div className="mb-8">
          <ExpenseChart invoices={invoices} />
        </div>
      )}

      {/* Comparativas Temporales */}
      {invoices && invoices.length > 0 && (
        <div className="mb-8">
          <TemporalComparison invoices={invoices} />
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          href="/dashboard/upload"
          className="bg-gray-200 rounded-lg shadow p-8 hover:shadow-lg transition-shadow cursor-pointer group"
        >
          <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">📤</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Subir Factura
          </h3>
          <p className="text-gray-600">
            Analiza una nueva factura con IA
          </p>
        </Link>

        <Link
          href="/dashboard/invoices"
          className="bg-gray-200 rounded-lg shadow p-8 hover:shadow-lg transition-shadow cursor-pointer group"
        >
          <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">📁</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Mis Facturas
          </h3>
          <p className="text-gray-600">
            Ver todas las facturas guardadas
          </p>
        </Link>
      </div>
    </div>
  )
}
