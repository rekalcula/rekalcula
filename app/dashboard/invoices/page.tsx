import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import DashboardNav from '@/components/DashboardNav'
import InvoicesListWithSelection from '@/components/InvoicesListWithSelection'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function InvoicesPage() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/sign-in')
  }

  // Obtener facturas con datos de pago
  const { data: invoices, error } = await supabase
    .from('invoices')
    .select('*, payment_method, payment_terms, payment_status, payment_due_date')
    .eq('user_id', userId)
    .order('invoice_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    console.error('Error fetching invoices:', error)
  }

  const invoiceList: any[] = invoices || []
  const totalGasto = invoiceList.reduce((sum, inv) => sum + (inv.total_amount || 0), 0)

  // Agrupar facturas por fecha
  const invoicesByDate: { [key: string]: any[] } = {}
  invoiceList.forEach((invoice) => {
    const date = invoice.invoice_date || invoice.created_at?.split('T')[0] || 'sin-fecha'
    if (!invoicesByDate[date]) {
      invoicesByDate[date] = []
    }
    invoicesByDate[date].push(invoice)
  })

  const sortedDates = Object.keys(invoicesByDate).sort((a, b) => {
    if (a === 'sin-fecha') return 1
    if (b === 'sin-fecha') return -1
    return new Date(b).getTime() - new Date(a).getTime()
  })

  return (
    <>
      <DashboardNav />
      <div className="min-h-screen bg-[#262626]">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Header responsive - Apilado en móvil, horizontal en desktop */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#d98c21]">Facturas de Compra</h1>
              <p className="mt-1 sm:mt-2 text-[#FFFCFF] text-base sm:text-[20px]">Gastos y facturas de proveedores</p>
            </div>
            <Link
              href="/dashboard/upload"
              className="bg-[#0d0d0d] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#2d2d2d] w-full sm:w-auto text-center"
            >
              + Subir Facturas
            </Link>
          </div>

          {/* Resumen */}
          <div className="bg-gray-200 rounded-xl shadow-sm p-6 mb-6">
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <p className="text-xl text-gray-500">Gasto Total</p>
                <p className="text-2xl font-bold text-red-600">€{totalGasto.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xl text-gray-500">Número de Facturas</p>
                <p className="text-2xl font-bold text-gray-900">{invoiceList.length}</p>
              </div>
              <div>
                <p className="text-xl text-gray-500">Promedio por Factura</p>
                <p className="text-2xl font-bold text-gray-900">
                  €{invoiceList.length > 0 ? (totalGasto / invoiceList.length).toFixed(2) : '0.00'}
                </p>
              </div>
            </div>
          </div>

          {/* Lista con selección */}
          <InvoicesListWithSelection
            invoicesByDate={invoicesByDate}
            sortedDates={sortedDates}
          />
        </div>
      </div>
    </>
  )
}