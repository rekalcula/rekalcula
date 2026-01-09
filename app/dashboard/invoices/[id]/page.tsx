import { auth } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import DeleteInvoiceButton from '@/components/DeleteInvoiceButton'
import Link from 'next/link'
import InvoiceImageViewer from '@/components/InvoiceImageViewer'
import PaymentStatusManager from '@/components/PaymentStatusManager'

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

  const { id } = await params

  const { data: invoice, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single()

  if (error || !invoice) {
    notFound()
  }

  // Obtener datos del proveedor desde el backup (si existe)
  const { data: backup } = await supabase
    .from('invoice_backups')
    .select('original_data')
    .eq('invoice_id', id)
    .single()

  const supplierName = backup?.original_data?.supplier_name || invoice.supplier || 'No especificado'

  // Mapeo de métodos de pago para mostrar
  const paymentMethodLabels: Record<string, string> = {
    cash: 'Efectivo',
    transfer: 'Transferencia',
    card: 'Tarjeta',
    check: 'Cheque',
    deferred: 'Aplazado'
  }

  // Mapeo de plazos de pago
  const paymentTermsLabels: Record<string, string> = {
    immediate: 'Inmediato',
    '30_days': '30 días',
    '45_days': '45 días',
    '60_days': '60 días',
    '90_days': '90 días',
    custom: 'Personalizado'
  }

  // Mapeo de estados de pago
  const paymentStatusLabels: Record<string, { label: string; color: string }> = {
    paid: { label: 'Pagado', color: 'bg-green-100 text-green-800' },
    pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
    overdue: { label: 'Vencido', color: 'bg-red-100 text-red-800' }
  }

  // Determinar si está vencida
  const isOverdue = invoice.payment_status === 'pending' && 
    invoice.payment_due_date && 
    new Date(invoice.payment_due_date) < new Date()

  const currentStatus = isOverdue ? 'overdue' : (invoice.payment_status || 'pending')

  // ========================================
  // CORRECCIÓN: Verificar si tiene forma de pago configurada
  // La forma de pago está configurada si:
  // - payment_confirmed es true, O
  // - payment_method tiene un valor asignado
  // ========================================
  const hasPaymentConfigured = invoice.payment_confirmed === true || 
                                (invoice.payment_method && invoice.payment_method.trim() !== '')

  return (
    <div className="min-h-screen bg-[#262626]">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Link
            href="/dashboard/invoices"
            className="text-[#ACACAC] hover:text-white font-medium text-xl mb-4 inline-block"
          >
            ← Volver a la lista
          </Link>
          <h1 className="text-3xl font-bold text-[#D98C21]">
            Detalle de Factura
          </h1>
          <p className="mt-2 text-white">
            {invoice.file_name}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            {/* Información General */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Informacion General
              </h2>
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-gray-500">Proveedor</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {supplierName}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-500">Total</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {invoice.total_amount ? `${invoice.total_amount.toFixed(2)} EUR` : '-'}
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
                  <div className="text-sm text-gray-500">Categoria</div>
                  <div>
                    <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      {invoice.category || 'Sin Categoria'}
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

            {/* ========================================
                ESTADO DE PAGO - CORREGIDO
                Ahora usa hasPaymentConfigured
                ======================================== */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Estado de Pago
              </h2>

              {hasPaymentConfigured ? (
                // ✅ Forma de pago confirmada
                <div className="space-y-4">
                  {/* Indicador de forma de pago confirmada */}
                  <div className="flex items-center gap-2 text-green-600 mb-4">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">Forma de pago confirmada</span>
                  </div>

                  {/* Información del método de pago */}
                  <div>
                    <div className="text-sm text-gray-500">Forma de pago</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {paymentMethodLabels[invoice.payment_method] || invoice.payment_method || 'No especificado'}
                    </div>
                  </div>

                  {invoice.payment_terms && (
                    <div>
                      <div className="text-sm text-gray-500">Plazo de pago</div>
                      <div className="text-lg font-semibold text-gray-900">
                        {paymentTermsLabels[invoice.payment_terms] || invoice.payment_terms}
                      </div>
                    </div>
                  )}

                  {invoice.payment_due_date && (
                    <div>
                      <div className="text-sm text-gray-500">Fecha de vencimiento</div>
                      <div className="text-lg font-semibold text-gray-900">
                        {new Date(invoice.payment_due_date).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </div>
                    </div>
                  )}

                  {/* ========================================
                      ESTADO DE PAGO ACTUAL
                      ======================================== */}
                  <div className="pt-4 border-t">
                    <div className="text-sm text-gray-500 mb-2">Estado del pago</div>
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${paymentStatusLabels[currentStatus]?.color || 'bg-gray-100 text-gray-800'}`}>
                        {currentStatus === 'paid' && (
                          <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                        {currentStatus === 'pending' && (
                          <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                          </svg>
                        )}
                        {currentStatus === 'overdue' && (
                          <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        )}
                        {paymentStatusLabels[currentStatus]?.label || 'Pendiente'}
                      </span>

                      {/* Fecha de pago si está pagada */}
                      {invoice.payment_status === 'paid' && invoice.actual_payment_date && (
                        <span className="text-sm text-gray-500">
                          Pagado el {new Date(invoice.actual_payment_date).toLocaleDateString('es-ES')}
                        </span>
                      )}
                    </div>

                    {/* Botón para marcar como pagado si está pendiente */}
                    {invoice.payment_status !== 'paid' && (
                      <div className="mt-4">
                        <PaymentStatusManager 
                          invoiceId={invoice.id} 
                          currentStatus={invoice.payment_status}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                // ❌ Forma de pago NO confirmada - Mostrar advertencia
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <h3 className="font-semibold text-yellow-800">Forma de pago no confirmada</h3>
                      <p className="text-sm text-yellow-700 mt-1">
                        Esta factura no tiene forma de pago asignada. Los análisis de cash flow pueden no ser precisos.
                      </p>
                      <Link 
                        href={`/dashboard/invoices/${invoice.id}/edit`}
                        className="inline-flex items-center mt-3 px-4 py-2 bg-yellow-600 text-white rounded-lg text-sm font-medium hover:bg-yellow-700 transition-colors"
                      >
                        Configurar forma de pago
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Artículos/Servicios */}
            {invoice.items && invoice.items.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Articulos / Servicios
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
                            Cantidad: {item.quantity} x {item.unit_price?.toFixed(2)} EUR
                          </div>
                        </div>
                        <div className="font-semibold text-gray-900">
                          {item.total?.toFixed(2)} EUR
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Análisis IA */}
            {invoice.analysis && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Analisis IA
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

          {/* Columna derecha - Archivo original */}
          <div className="lg:sticky lg:top-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Archivo Original
              </h2>
              <InvoiceImageViewer 
                filePath={invoice.file_url} 
                fileName={invoice.file_name}
              />
              <div className="mt-4">
                <DeleteInvoiceButton invoiceId={Number(id)} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}