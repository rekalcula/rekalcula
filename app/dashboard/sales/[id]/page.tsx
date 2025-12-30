import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import DashboardNav from '@/components/DashboardNav'
import DeleteSaleButton from '@/components/DeleteSaleButton'
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

  // Obtener la venta con sus items
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

  return (
    <>
      <DashboardNav />
      <div className="min-h-screen bg-[#262626]">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Botón volver */}
          <Link
            href="/dashboard/sales"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6 text-xl"
          >
            ← Volver a ventas
          </Link>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Columna izquierda - Detalles */}
            <div className="space-y-6">
              {/* Info principal */}
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

                <p className="text-sm text-gray-500">Total</p>
                <p className="text-3xl font-bold text-green-600 mb-4">
                  €{sale.total?.toFixed(2) || '0.00'}
                </p>

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

              {/* Items */}
              {sale.sale_items && sale.sale_items.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">
                    Artículos / Servicios
                  </h2>
                  <div className="space-y-4">
                    {sale.sale_items.map((item: any, index: number) => (
                      <div key={index} className="flex justify-between items-start py-3 border-b last:border-0">
                        <div>
                          <p className="font-medium text-gray-900">{item.product_name}</p>
                          <p className="text-sm text-gray-500">
                            Cantidad: {item.quantity} × €{item.unit_price?.toFixed(2) || '0.00'}
                          </p>
                        </div>
                        <p className="font-semibold text-gray-900">
                          €{item.total?.toFixed(2) || '0.00'}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Resumen */}
                  <div className="mt-4 pt-4 border-t">
                    {sale.subtotal && sale.subtotal !== sale.total && (
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-500">Subtotal</span>
                        <span className="text-gray-900">€{sale.subtotal?.toFixed(2)}</span>
                      </div>
                    )}
                    {sale.tax_amount > 0 && (
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-500">IVA</span>
                        <span className="text-gray-900">€{sale.tax_amount?.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span className="text-green-600">€{sale.total?.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Columna derecha - Imagen y Acciones */}
            <div className="space-y-6">
              {/* Imagen del ticket */}
              {sale.file_url && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">Ticket</h2>
                  <div className="rounded-lg overflow-hidden border">
                    <img 
                      src={sale.file_url} 
                      alt="Ticket de venta"
                      className="w-full h-auto"
                    />
                  </div>
                </div>
              )}

              {/* Acciones */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Acciones</h2>
                <div className="space-y-3">
                  {sale.file_url && (
                    <a
                      href={sale.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full text-center bg-blue-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                      Abrir en nueva pestaña
                    </a>
                  )}
                  <DeleteSaleButton saleId={id} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}