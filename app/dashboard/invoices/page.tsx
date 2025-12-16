import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import DashboardNav from '@/components/DashboardNav'
import Link from 'next/link'

export default async function InvoicesPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  // Obtener facturas ordenadas por fecha
  const { data: invoices } = await supabase
    .from('invoices')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(100)

  const totalGasto = (invoices || []).reduce(
    (sum, inv) => sum + (inv.total || 0),
    0
  )

  // Agrupar facturas por fecha
  const invoicesByDate = (invoices || []).reduce((acc, invoice) => {
    const date =
      invoice.date ||
      invoice.created_at?.split('T')[0] ||
      'sin-fecha'

    if (!acc[date]) {
      acc[date] = []
    }

    acc[date].push(invoice)
    return acc
  }, {} as Record<string, typeof invoices>)

  return (
    <>
      <DashboardNav />

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Facturas de Compra
              </h1>
              <p className="mt-2 text-gray-600">
                Gastos y facturas de proveedores
              </p>
            </div>

            <Link
              href="/dashboard/upload"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700"
            >
              📤 Subir Factura
            </Link>
          </div>

          {/* Resumen */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-500">Gasto Total</p>
                <p className="text-2xl font-bold text-red-600">
                  €{totalGasto.toFixed(2)}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Número de Facturas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {invoices?.length || 0}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  Promedio por Factura
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  €
                  {invoices && invoices.length > 0
                    ? (totalGasto / invoices.length).toFixed(2)
                    : '0.00'}
                </p>
              </div>
            </div>
          </div>

          {/* Lista de facturas */}
          <div className="space-y-6">
            {Object.keys(invoicesByDate).length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <span className="text-4xl block mb-2">📄</span>
                <p className="text-gray-500">
                  No hay facturas registradas
                </p>
                <Link
                  href="/dashboard/upload"
                  className="mt-4 inline-block text-blue-600 hover:text-blue-700 font-medium"
                >
                  Subir primera factura →
                </Link>
              </div>
            ) : (
              Object.entries(invoicesByDate).map(
                ([date, dateInvoices]) => {
                  const dateTotal = (dateInvoices || []).reduce(
                    (sum, inv) => sum + (inv.total || 0),
                    0
                  )

                  const formattedDate =
                    date !== 'sin-fecha'
                      ? new Date(date).toLocaleDateString('es-ES', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })
                      : 'Sin fecha'

                  return (
                    <div
                      key={date}
                      className="bg-white rounded-xl shadow-sm overflow-hidden"
                    >
                      {/* Cabecera de fecha */}
                      <div className="px-6 py-4 bg-gray-50 border-b flex justify-between items-center">
                        <h3 className="font-semibold text-gray-900 capitalize">
                          📅 {formattedDate}
                        </h3>
                        <span className="text-red-600 font-semibold">
                          €{dateTotal.toFixed(2)}
                        </span>
                      </div>

                      {/* Facturas del día */}
                      <div className="divide-y">
                        {(dateInvoices || []).map((invoice) => (
                          <Link
                            key={invoice.id}
                            href={`/dashboard/invoices/${invoice.id}`}
                            className="block px-6 py-4 hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium text-gray-900">
                                  {invoice.provider || 'Proveedor'}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {invoice.category || 'Sin categoría'}
                                </p>
                              </div>

                              <span className="font-semibold text-gray-900">
                                €{invoice.total?.toFixed(2)}
                              </span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )
                }
              )
            )}
          </div>
        </div>
      </div>
    </>
  )
}
