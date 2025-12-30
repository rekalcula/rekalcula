import { auth } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import DashboardNav from '@/components/DashboardNav'
import DeleteInvoiceButton from '@/components/DeleteInvoiceButton'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/sign-in')
  }

  // Await params - IMPORTANTE para Next.js 15+
  const { id } = await params

  // Obtener la factura especí­fica
  const { data: invoice, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single()

  if (error || !invoice) {
    notFound()
  }

  return (
    <>
      <DashboardNav />
      <div className="min-h-screen bg-[#262626]">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/dashboard/invoices"
              className="text-[#ACACAC] hover:text-white font-medium mb-4 inline-block"
            >
              ← Volver a la lista
            </Link>
            <h1 className="text-3xl font-bold text-[#D98C21]">
              Detalle de Factura
            </h1>
            <p className="mt-2 text-gray-600">
              {invoice.file_name}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Columna izquierda - Información básica */}
            <div className="space-y-6">
              {/* Datos principales */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Información General
                </h2>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-gray-500">Proveedor</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {invoice.supplier || 'No especificado'}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-500">Total</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {invoice.total_amount ? `${invoice.total_amount.toFixed(2)}€
` : '-'}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-500">Fecha de Factura</div>
                    <div className="text-lg text-gray-900">
                      {invoice.invoice_date 
                        ? new Date(invoice.invoice_date).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })
                        : 'No especificada'}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-500">Categoría</div>
                    <div>
                      <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                        {invoice.category || 'Sin Categoría'}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-500">Fecha de Subida</div>
                    <div className="text-sm text-gray-900">
                      {new Date(invoice.created_at).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Items */}
              {invoice.items && invoice.items.length > 0 && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Artículos/ Servicios
                  </h2>
                  <div className="space-y-3">
                    {invoice.items.map((item: any, index: number) => (
                      <div key={index} className="border-b border-gray-200 pb-3 last:border-0">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium text-gray-900">
                              {item.description}
                            </div>
                            <div className="text-sm text-gray-500">
                              Cantidad: {item.quantity} X — {item.unit_price?.toFixed(2)}€

                            </div>
                          </div>
                          <div className="font-semibold text-gray-900">
                            {item.total?.toFixed(2)}€

                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Análisis */}
              {invoice.analysis && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Análisis IA
                  </h2>
                  
                  {invoice.analysis.insights && invoice.analysis.insights.length > 0 && (
                    <div className="mb-6">
                      <h3 className="font-semibold text-gray-900 mb-2">Insights</h3>
                      <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                        {invoice.analysis.insights.map((insight: string, index: number) => (
                          <li key={index}>{insight}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {invoice.analysis.savings_opportunities && invoice.analysis.savings_opportunities.length > 0 && (
                    <div className="mb-6">
                      <h3 className="font-semibold text-gray-900 mb-2">Oportunidades de Ahorro</h3>
                      <ul className="list-disc list-inside space-y-1 text-sm text-green-700">
                        {invoice.analysis.savings_opportunities.map((opp: string, index: number) => (
                          <li key={index}>{opp}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {invoice.analysis.recommendations && invoice.analysis.recommendations.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Recomendaciones</h3>
                      <ul className="list-disc list-inside space-y-1 text-sm text-blue-700">
                        {invoice.analysis.recommendations.map((rec: string, index: number) => (
                          <li key={index}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Columna derecha - Imagen de la factura */}
            <div className="lg:sticky lg:top-8">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Archivo Original
                </h2>
                <div className="relative">
                  <img
                    src={invoice.file_url}
                    alt={invoice.file_name}
                    className="w-full rounded-lg border border-gray-200"
                  />
                </div>
                <div className="mt-4 space-y-3">
                  <a
                    href={invoice.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full text-center bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Abrir en nueva pestaña
                  </a>
                  
                  <DeleteInvoiceButton invoiceId={Number(id)} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}