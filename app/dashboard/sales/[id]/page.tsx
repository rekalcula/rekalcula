// app/dashboard/sales/[id]/page.tsx
// CORREGIDO: 2026-01-10 - Usar subtotal como base imponible
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import DashboardNav from '@/components/DashboardNav'
import DeleteSaleButton from '@/components/DeleteSaleButton'
import InvoiceImageViewer from '@/components/InvoiceImageViewer'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function SaleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/sign-in')
  }

  const { id } = await params

  const { data: sale, error } = await supabase
    .from('sales')
    .select('*, sale_items(*)')
    .eq('id', id)
    .eq('user_id', userId)
    .single()

  if (error || !sale) {
    redirect('/dashboard/sales')
  }

  const formattedDate = sale.sale_date
    ? new Date(sale.sale_date).toLocaleDateString('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    : 'No especificada'

  const createdAt = new Date(sale.created_at).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  const getFileName = (url: string) => {
    if (!url) return 'ticket'
    const parts = url.split('/')
    return parts[parts.length - 1] || 'ticket'
  }

  // ========================================
  // ⭐ CÁLCULO CONTABLE CORREGIDO
  // La base imponible está en SUBTOTAL, no en total
  // ========================================
  const taxAmount = sale.tax_amount || 0
  const hasVatBreakdown = taxAmount > 0
  
  // ⭐ CORRECCIÓN: Usar subtotal como base imponible
  const baseAmount = sale.subtotal || sale.total
  const grossTotal = sale.gross_total || sale.total

  return (
    <>
      <DashboardNav />
      <div className="min-h-screen bg-[#262626]">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <Link
            href="/dashboard/sales"
            className="text-[#ACACAC] hover:text-white font-medium text-xl mb-4 inline-block"
          >
            ← Volver a ventas
          </Link>

          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    sale.source === 'ticket'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {sale.source === 'ticket' ? 'Ticket' : 'Manual'}
                  </span>
                  {sale.payment_method && sale.payment_method !== 'desconocido' && (
                    <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                      {sale.payment_method}
                    </span>
                  )}
                </div>

                {sale.notes && (
                  <>
                    <p className="text-sm text-gray-500">Negocio</p>
                    <p className="text-xl font-bold text-gray-900 mb-4">
                      {sale.notes.replace('Negocio: ', '')}
                    </p>
                  </>
                )}

                {/* ⭐ SECCIÓN CONTABLE - Usa baseAmount (subtotal) */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-green-700 font-medium">Base Imponible (Contable)</p>
                  <p className="text-3xl font-bold text-green-600">
                    €{baseAmount?.toFixed(2) || '0.00'}
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Este es el importe que se contabiliza (sin IVA)
                  </p>
                </div>

                {hasVatBreakdown && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-gray-500 font-medium mb-2">Desglose fiscal:</p>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Base imponible:</span>
                        <span className="font-medium">€{baseAmount?.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">IVA:</span>
                        <span className="font-medium">€{taxAmount?.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-gray-300">
                        <span className="text-gray-700 font-medium">Total bruto (con IVA):</span>
                        <span className="font-bold">€{grossTotal?.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Fecha de Venta</p>
                    <p className="font-medium text-gray-900 capitalize">{formattedDate}</p>
                  </div>
                  {sale.sale_time && (
                    <div>
                      <p className="text-sm text-gray-500">Hora</p>
                      <p className="font-medium text-gray-900">{sale.sale_time.slice(0, 5)}</p>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-gray-500">Fecha de Registro</p>
                  <p className="font-medium text-gray-900">{createdAt}</p>
                </div>
              </div>

              {sale.sale_items && sale.sale_items.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">
                    Articulos / Servicios
                  </h2>
                  <div className="space-y-4">
                    {sale.sale_items.map((item: any, index: number) => (
                      <div key={index} className="flex justify-between items-start py-3 border-b last:border-0">
                        <div>
                          <p className="font-medium text-gray-900">{item.product_name}</p>
                          <p className="text-sm text-gray-500">
                            Cantidad: {item.quantity} x €{item.unit_price?.toFixed(2) || '0.00'}
                          </p>
                        </div>
                        <p className="font-semibold text-gray-900">
                          €{item.total?.toFixed(2) || '0.00'}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 pt-4 border-t">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-500">Base imponible</span>
                      <span className="text-gray-900">€{baseAmount?.toFixed(2)}</span>
                    </div>
                    {hasVatBreakdown && (
                      <>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-500">IVA</span>
                          <span className="text-gray-900">€{taxAmount?.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-500">Total bruto</span>
                          <span className="text-gray-900">€{grossTotal?.toFixed(2)}</span>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between font-bold text-lg pt-2 border-t">
                      <span className="text-green-700">Importe contable</span>
                      <span className="text-green-600">€{baseAmount?.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-6">
              {sale.file_url && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">Ticket</h2>
                  <InvoiceImageViewer
                    filePath={sale.file_url}
                    fileName={getFileName(sale.file_url)}
                    bucket="sales-tickets"
                  />
                </div>
              )}

              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Acciones</h2>
                <DeleteSaleButton saleId={id} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}