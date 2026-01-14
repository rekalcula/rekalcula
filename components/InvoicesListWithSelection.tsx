'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { IconCalendar, IconDocument, IconTrash } from './Icons'
import PaymentMethodBadge from './PaymentMethodBadge'  // ← NUEVO IMPORT

interface Invoice {
  id: string
  invoice_date: string | null
  total_amount: number | null
  supplier: string | null
  category: string | null
  created_at: string
  items: any[]
  payment_method: string | null
  payment_terms: string | null
  payment_status: string | null
  payment_due_date: string | null
}

interface InvoicesListWithSelectionProps {
  invoicesByDate: { [key: string]: Invoice[] }
  sortedDates: string[]
}

// Colores según estado de pago
const getPaymentStatusStyle = (status: string | null) => {
  switch (status) {
    case 'paid':
      return 'bg-green-100 text-green-700'
    case 'pending':
      return 'bg-yellow-100 text-yellow-700'
    case 'overdue':
      return 'bg-red-100 text-red-700'
    default:
      return 'bg-gray-100 text-gray-600'
  }
}

export default function InvoicesListWithSelection({ invoicesByDate, sortedDates }: InvoicesListWithSelectionProps) {
  const router = useRouter()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [deleting, setDeleting] = useState(false)

  // Obtener todos los IDs
  const allIds = sortedDates.flatMap(date => invoicesByDate[date].map(inv => inv.id))

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id)
        ? prev.filter(i => i !== id)
        : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === allIds.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(allIds)
    }
  }

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return

    if (!confirm(`¿Estas seguro de que quieres eliminar ${selectedIds.length} factura(s)?`)) {
      return
    }

    setDeleting(true)

    try {
      const response = await fetch(`/api/delete-invoice?ids=${selectedIds.join(',')}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Error al eliminar')
      }

      setSelectedIds([])
      router.refresh()
    } catch (error) {
      alert('Error al eliminar las facturas')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      {/* Barra de seleccion */}
      {allIds.length > 0 && (
        <div className="bg-gray-200 rounded-xl shadow-sm p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedIds.length === allIds.length && allIds.length > 0}
                onChange={toggleSelectAll}
                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-gray-700 font-medium">
                {selectedIds.length === allIds.length ? 'Deseleccionar todo' : 'Seleccionar todo'}
              </span>
            </label>
            {selectedIds.length > 0 && (
              <span className="text-sm text-gray-500">
                ({selectedIds.length} seleccionada{selectedIds.length > 1 ? 's' : ''})
              </span>
            )}
          </div>

          {selectedIds.length > 0 && (
            <button
              onClick={handleDeleteSelected}
              disabled={deleting}
              className="bg-red-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <IconTrash size={18} />
              {deleting ? 'Eliminando...' : `Eliminar (${selectedIds.length})`}
            </button>
          )}
        </div>
      )}

      {/* Lista de facturas */}
      <div className="space-y-6">
        {sortedDates.length === 0 ? (
          <div className="bg-gray-200 rounded-xl shadow-sm p-12 text-center">
            <IconDocument size={48} color="#9CA3AF" className="mx-auto mb-2" />
            <p className="text-gray-500">No hay facturas registradas</p>
            <Link
              href="/dashboard/upload"
              className="mt-4 inline-block text-blue-600 hover:text-blue-700 font-medium"
            >
              Subir primera factura →
            </Link>
          </div>
        ) : (
          sortedDates.map((date) => {
            const dateInvoices = invoicesByDate[date]
            const dateTotal = dateInvoices.reduce((sum: number, inv: any) => sum + (inv.total_amount || 0), 0)
            const formattedDate = date !== 'sin-fecha'
              ? new Date(date).toLocaleDateString('es-ES', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })
              : 'Sin fecha'

            return (
              <div key={date} className="bg-gray-200 rounded-xl shadow-sm overflow-hidden">
                {/* Cabecera de fecha */}
                <div className="px-6 py-4 bg-gray-50 border-b flex justify-between items-center">
                  <h3 className="font-semibold text-gray-900 capitalize flex items-center gap-2">
                    <IconCalendar size={20} color="#6B7280" />
                    {formattedDate}
                  </h3>
                  <span className="text-red-600 font-semibold">
                    €{dateTotal.toFixed(2)}
                  </span>
                </div>

                {/* Facturas del dia */}
                <div className="divide-y">
                  {dateInvoices.map((invoice: any) => (
                    <div key={invoice.id} className="flex items-center">
                      {/* Checkbox */}
                      <div className="pl-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(invoice.id)}
                          onChange={() => toggleSelect(invoice.id)}
                          className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </div>

                      {/* Contenido */}
                      <Link
                        href={`/dashboard/invoices/${invoice.id}`}
                        className="flex-1 px-6 py-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                invoice.category === 'Productos'
                                  ? 'bg-blue-100 text-blue-700'
                                  : invoice.category === 'Servicios'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-gray-100 text-gray-600'
                              }`}>
                                {invoice.category || 'Sin categoria'}
                              </span>

                              {/* ========== CAMBIO AQUÍ: Forma de pago con badge ========== */}
                              <PaymentMethodBadge 
                                method={invoice.payment_method || 'transfer'} 
                                size="sm" 
                              />
                              {/* ========================================================== */}
                            </div>

                            <p className="font-medium text-gray-900 mt-2">
                              {invoice.supplier || 'Proveedor desconocido'}
                            </p>

                            {invoice.items && invoice.items.length > 0 && (
                              <p className="text-sm text-gray-500 mt-1">
                                {invoice.items.length} item{invoice.items.length > 1 ? 's' : ''}
                              </p>
                            )}
                          </div>

                          <div className="text-right ml-4">
                            <p className="text-lg font-bold text-gray-900">
                              €{invoice.total_amount?.toFixed(2) || '0.00'}
                            </p>
                          </div>
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )
          })
        )}
      </div>
    </>
  )
}