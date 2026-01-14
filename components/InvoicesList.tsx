'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import InvoicesFilters, { FilterState } from './InvoicesFilters'
import PaymentMethodBadge from './PaymentMethodBadge'

interface Invoice {
  id: number
  created_at: string
  file_name: string
  file_url: string
  supplier: string | null
  total_amount: number | null
  invoice_date: string | null
  category: string | null
  payment_method?: string | null  // NUEVO
}

interface InvoicesListProps {
  invoices: Invoice[]
}

export default function InvoicesList({ invoices }: InvoicesListProps) {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    category: '',
    supplier: '',
    dateFrom: '',
    dateTo: '',
    minAmount: '',
    maxAmount: '',
    paymentMethod: '',  // NUEVO
  })

  // Extraer categorías únicas
  const categories = useMemo(() => {
    const cats = invoices
      .map(inv => inv.category)
      .filter((cat): cat is string => cat !== null)
    return Array.from(new Set(cats))
  }, [invoices])

  // Extraer proveedores únicos
  const suppliers = useMemo(() => {
    const sups = invoices
      .map(inv => inv.supplier)
      .filter((sup): sup is string => sup !== null)
    return Array.from(new Set(sups))
  }, [invoices])

  // Filtrar facturas
  const filteredInvoices = useMemo(() => {
    return invoices.filter(invoice => {
      // Búsqueda por texto
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        const matchesSearch = 
          invoice.file_name?.toLowerCase().includes(searchLower) ||
          invoice.supplier?.toLowerCase().includes(searchLower) ||
          invoice.category?.toLowerCase().includes(searchLower)
        if (!matchesSearch) return false
      }

      // Filtro por categoría
      if (filters.category && invoice.category !== filters.category) {
        return false
      }

      // Filtro por proveedor
      if (filters.supplier && invoice.supplier !== filters.supplier) {
        return false
      }

      // NUEVO: Filtro por forma de pago
      if (filters.paymentMethod && filters.paymentMethod !== 'all') {
        if (invoice.payment_method !== filters.paymentMethod) {
          return false
        }
      }

      // Filtro por monto mínimo
      if (filters.minAmount && invoice.total_amount) {
        if (invoice.total_amount < parseFloat(filters.minAmount)) {
          return false
        }
      }

      // Filtro por monto máximo
      if (filters.maxAmount && invoice.total_amount) {
        if (invoice.total_amount > parseFloat(filters.maxAmount)) {
          return false
        }
      }

      // Filtro por fecha desde
      if (filters.dateFrom && invoice.invoice_date) {
        if (new Date(invoice.invoice_date) < new Date(filters.dateFrom)) {
          return false
        }
      }

      // Filtro por fecha hasta
      if (filters.dateTo && invoice.invoice_date) {
        if (new Date(invoice.invoice_date) > new Date(filters.dateTo)) {
          return false
        }
      }

      return true
    })
  }, [invoices, filters])

  // Función para eliminar factura
  const handleDelete = async (invoiceId: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta factura? Esta acción no se puede deshacer.')) {
      return
    }

    try {
      const response = await fetch(`/api/delete-invoice?id=${invoiceId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Error al eliminar factura')
      }

      // Recargar la página para actualizar la lista
      window.location.reload()
    } catch (error) {
      console.error('Error:', error)
      alert('Error al eliminar la factura. Inténtalo de nuevo.')
    }
  }

  if (invoices.length === 0) {
    return (
      <div className="bg-gray-200 rounded-lg shadow p-12 text-center">
        <div className="text-6xl mb-4">📄</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          No hay facturas aún
        </h3>
        <p className="text-gray-600 mb-6">
          Sube tu primera factura para empezar a analizar tus gastos
        </p>
        <Link
          href="/dashboard/upload"
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          Subir Factura
        </Link>
      </div>
    )
  }

  return (
    <>
      {/* Filtros */}
      <InvoicesFilters
        onFilterChange={setFilters}
        categories={categories}
        suppliers={suppliers}
      />

      {/* Contador de resultados */}
      <div className="mb-4 text-sm text-gray-600">
        Mostrando {filteredInvoices.length} de {invoices.length} facturas
      </div>

      {/* Tabla */}
      <div className="bg-gray-200 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Proveedor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categoría
                </th>
                {/* NUEVA COLUMNA */}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Forma de Pago
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Archivo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-200 divide-y divide-gray-200">
              {filteredInvoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {invoice.invoice_date 
                      ? new Date(invoice.invoice_date).toLocaleDateString('es-ES')
                      : new Date(invoice.created_at).toLocaleDateString('es-ES')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {invoice.supplier || 'Sin proveedor'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                      {invoice.category || 'Sin categoría'}
                    </span>
                  </td>
                  {/* NUEVA CELDA CON BADGE */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <PaymentMethodBadge 
                      method={invoice.payment_method || 'transfer'} 
                      size="sm" 
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    {invoice.total_amount ? `${invoice.total_amount.toFixed(2)}€` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {invoice.file_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 space-x-3">
                    <Link
                      href={`/dashboard/invoices/${invoice.id}`}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Ver detalles
                    </Link>
                    <a
                      href={invoice.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-600 hover:text-gray-700 font-medium"
                    >
                      Ver archivo
                    </a>
                    <button
                      onClick={() => handleDelete(invoice.id)}
                      className="text-red-600 hover:text-red-700 font-medium"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mensaje si no hay resultados filtrados */}
        {filteredInvoices.length === 0 && (
          <div className="p-12 text-center">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No se encontraron facturas
            </h3>
            <p className="text-gray-600">
              Intenta ajustar los filtros para ver más resultados
            </p>
          </div>
        )}
      </div>
    </>
  )
}