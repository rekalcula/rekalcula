'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { IconCalendar, IconDocument, IconTrash } from './Icons'
import PaymentMethodBadge from './PaymentMethodBadge'
import ConfirmDialog from './ConfirmDialog'

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

export default function InvoicesListWithSelection({ invoicesByDate, sortedDates }: InvoicesListWithSelectionProps) {
  const router = useRouter()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [deleting, setDeleting] = useState(false)
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('all')
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  // Obtener todos los IDs
  const allIds = sortedDates.flatMap(date => invoicesByDate[date].map(inv => inv.id))

  // Filtrar facturas por forma de pago
  const filteredInvoicesByDate: { [key: string]: Invoice[] } = {}
  const filteredSortedDates: string[] = []

  sortedDates.forEach(date => {
    const filteredInvoices = invoicesByDate[date].filter(invoice => {
      if (paymentMethodFilter === 'all') return true
      return invoice.payment_method === paymentMethodFilter
    })
    
    if (filteredInvoices.length > 0) {
      filteredInvoicesByDate[date] = filteredInvoices
      filteredSortedDates.push(date)
    }
  })

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

    // Mostrar modal de confirmación personalizado
    setShowConfirmDialog(true)
  }

  const confirmDelete = async () => {
    setShowConfirmDialog(false)
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

  const cancelDelete = () => {
    setShowConfirmDialog(false)
  }

  return (
    <>
      {/* ========== FILTRO DE FORMA DE PAGO (estilo oscuro) ========== */}
      <div className="bg-[#1a1a1a] rounded-xl border border-[#404040] p-6 mb-6">
        <label className="block text-gray-400 text-sm font-medium mb-3">
          Filtrar por forma de pago:
        </label>
        <select
          value={paymentMethodFilter}
          onChange={(e) => setPaymentMethodFilter(e.target.value)}
          className="w-full md:w-auto px-4 py-2 bg-[#262626] text-white border border-[#404040] rounded-lg focus:outline-none focus:border-[#d98c21] transition-colors"
        >
          <option value="all"> Todas las formas de pago</option>
          <option value="cash"> Efectivo</option>
          <option value="card"> Tarjeta</option>
          <option value="transfer"> Transferencia</option>
          <option value="promissory_note"> Pagaré</option>
          <option value="direct_debit"> Domiciliación</option>
          <option value="credit_30"> Crédito 30 días</option>
          <option value="credit_60"> Crédito 60 días</option>
          <option value="credit_90"> Crédito 90 días</option>
        </select>
      </div>
      {/* ============================================================== */}

      {/* Barra de selección (estilo oscuro) */}
      {allIds.length > 0 && (
        <div className="bg-[#1a1a1a] rounded-xl border border-[#404040] p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedIds.length === allIds.length && allIds.length > 0}
                onChange={toggleSelectAll}
                className="w-5 h-5 rounded border-[#404040] text-[#d98c21] focus:ring-[#d98c21] bg-[#262626]"
              />
              <span className="text-white font-medium">
                {selectedIds.length === allIds.length ? 'Deseleccionar todo' : 'Seleccionar todo'}
              </span>
            </label>
            {selectedIds.length > 0 && (
              <span className="text-sm text-gray-400">
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

      {/* Lista de facturas (estilo oscuro) */}
      <div className="space-y-6">
        {filteredSortedDates.length === 0 ? (
          <div className="bg-[#1a1a1a] rounded-xl border border-[#404040] p-12 text-center">
            <IconDocument size={48} color="#666" className="mx-auto mb-2" />
            <p className="text-gray-400 mb-2">
              {paymentMethodFilter === 'all' 
                ? 'No hay facturas registradas' 
                : 'No hay facturas con esta forma de pago'}
            </p>
            {paymentMethodFilter !== 'all' && (
              <button
                onClick={() => setPaymentMethodFilter('all')}
                className="text-[#d98c21] hover:text-[#e09b35] font-medium"
              >
                Ver todas las facturas →
              </button>
            )}
            {paymentMethodFilter === 'all' && (
              <Link
                href="/dashboard/upload"
                className="mt-4 inline-block text-[#d98c21] hover:text-[#e09b35] font-medium"
              >
                Subir primera factura →
              </Link>
            )}
          </div>
        ) : (
          filteredSortedDates.map((date) => {
            const dateInvoices = filteredInvoicesByDate[date]
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
              <div key={date} className="bg-[#1a1a1a] rounded-xl border border-[#404040] overflow-hidden">
                {/* Cabecera de fecha (estilo oscuro) */}
                <div className="px-6 py-4 bg-[#0d0d0d] border-b border-[#404040] flex justify-between items-center">
                  <h3 className="font-semibold text-white capitalize flex items-center gap-2">
                    <IconCalendar size={20} color="#d98c21" />
                    {formattedDate}
                  </h3>
                  <span className="text-red-400 font-semibold">
                    €{dateTotal.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                {/* Facturas del día */}
                <div className="divide-y divide-[#404040]">
                  {dateInvoices.map((invoice: any) => (
                    <div key={invoice.id} className="flex items-center hover:bg-[#262626] transition-colors">
                      {/* Checkbox */}
                      <div className="pl-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(invoice.id)}
                          onChange={() => toggleSelect(invoice.id)}
                          className="w-5 h-5 rounded border-[#404040] text-[#d98c21] focus:ring-[#d98c21] bg-[#262626]"
                        />
                      </div>

                      {/* Contenido */}
                      <Link
                        href={`/dashboard/invoices/${invoice.id}`}
                        className="flex-1 px-6 py-4"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                invoice.category === 'Productos'
                                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                  : invoice.category === 'Servicios'
                                  ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                                  : 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                              }`}>
                                {invoice.category || 'Sin categoria'}
                              </span>

                              {/* Badge de forma de pago */}
                              <PaymentMethodBadge 
                                method={invoice.payment_method || 'transfer'} 
                                size="sm" 
                              />
                            </div>

                            <p className="font-medium text-white mt-2">
                              {invoice.supplier || 'Proveedor desconocido'}
                            </p>

                            {invoice.items && invoice.items.length > 0 && (
                              <p className="text-sm text-gray-400 mt-1">
                                {invoice.items.length} item{invoice.items.length > 1 ? 's' : ''}
                              </p>
                            )}
                          </div>

                          <div className="text-right ml-4">
                            <p className="text-lg font-bold text-white">
                              €{invoice.total_amount?.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
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

      {/* Modal de confirmación de eliminación */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        title="Confirmar eliminación"
        message={`¿Estás seguro de que quieres eliminar ${selectedIds.length} factura${selectedIds.length > 1 ? 's' : ''}? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
      />
    </>
  )
}