import ExportButtons from '@/components/ExportButtons'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import InvoicesList from '@/components/InvoicesList'
import DashboardNav from '@/components/DashboardNav'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function InvoicesPage() {
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

  if (error) {
    console.error('Error cargando facturas:', error)
  }

  return (
    <>
      <DashboardNav />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Mis Facturas
              </h1>
              <p className="mt-2 text-gray-600">
                Gestiona y analiza todas tus facturas
              </p>
            </div>
            
            <ExportButtons invoices={invoices || []} />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-500">Total Facturas</div>
              <div className="text-3xl font-bold text-gray-900 mt-2">
                {invoices?.length || 0}
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-500">Gasto Total</div>
              <div className="text-3xl font-bold text-gray-900 mt-2">
                {invoices?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0).toFixed(2)}€
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-500">Promedio</div>
              <div className="text-3xl font-bold text-gray-900 mt-2">
                {invoices?.length 
                  ? (invoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) / invoices.length).toFixed(2)
                  : 0}€
              </div>
            </div>
          </div>

          {/* Lista de facturas */}
          <InvoicesList invoices={invoices || []} />
        </div>
      </div>
    </>
  )
}