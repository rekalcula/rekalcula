'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Sale {
  id: string
  sale_date: string | null
  total: number | null
  source: string | null
  payment_method: string | null
  notes: string | null
  created_at: string
  sale_items: any[]
}

interface SalesListWithSelectionProps {
  salesByDate: { [key: string]: Sale[] }
  sortedDates: string[]
}

export default function SalesListWithSelection({ salesByDate, sortedDates }: SalesListWithSelectionProps) {
  const router = useRouter()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [deleting, setDeleting] = useState(false)

  // Obtener todos los IDs
  const allIds = sortedDates.flatMap(date => salesByDate[date].map(s => s.id))

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
    
    if (!confirm(`¿Estás seguro de que quieres eliminar ${selectedIds.length} venta(s)?`)) {
      return
    }

    setDeleting(true)

    try {
      const response = await fetch(`/api/sales?ids=${selectedIds.join(',')}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Error al eliminar')
      }

      setSelectedIds([])
      router.refresh()
    } catch (error) {
      alert('Error al eliminar las ventas')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      {/* Barra de selección */}
      {allIds.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedIds.length === allIds.length && allIds.length > 0}
                onChange={toggleSelectAll}
                className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <span className="text-gray-700 font-medium">
                {selectedIds.length === allIds.length ? 'Deseleccionar todo' : 'Seleccionar todo'}
              </span>
            </label>
            {selectedIds.length > 0 && (
              <span className="text-sm text-gray-500">
                ({selectedIds.length} seleccionado{selectedIds.length > 1 ? 's' : ''})
              </span>
            )}
          </div>
          
          {selectedIds.length > 0 && (
            <button
              onClick={handleDeleteSelected}
              disabled={deleting}
              className="bg-red-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              {deleting ? 'Eliminando...' : `🗑 Eliminar (${selectedIds.length})`}
            </button>
          )}
        </div>
      )}

      {/* Lista de ventas */}
      <div className="space-y-6">
        {sortedDates.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <span className="text-4xl block mb-2">🧾</span>
            <p className="text-gray-500">No hay ventas registradas</p>
            <Link
              href="/dashboard/sales/upload"
              className="mt-4 inline-block text-green-600 hover:text-green-700 font-medium"
            >
              Subir primer ticket →
            </Link>
          </div>
        ) : (
          sortedDates.map((date) => {
            const dateSales = salesByDate[date]
            const dateTotal = dateSales.reduce((sum: number, s: any) => sum + (s.total || 0), 0)
            const formattedDate = date !== 'sin-fecha'
              ? new Date(date).toLocaleDateString('es-ES', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })
              : 'Sin fecha'

            return (
              <div key={date} className="bg-white rounded-xl shadow-sm overflow-hidden">
                {/* Cabecera de fecha */}
                <div className="px-6 py-4 bg-gray-50 border-b flex justify-between items-center">
                  <h3 className="font-semibold text-gray-900 capitalize">
                    📅 {formattedDate}
                  </h3>
                  <span className="text-green-600 font-semibold">
                    €{dateTotal.toFixed(2)}
                  </span>
                </div>

                {/* Ventas del día */}
                <div className="divide-y">
                  {dateSales.map((sale: any) => (
                    <div key={sale.id} className="flex items-center">
                      {/* Checkbox */}
                      <div className="pl-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(sale.id)}
                          onChange={() => toggleSelect(sale.id)}
                          className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                      </div>
                      
                      {/* Contenido */}
                      <Link 
                        href={`/dashboard/sales/${sale.id}`}
                        className="flex-1 px-6 py-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
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
                            
                            <p className="font-medium text-gray-900 mt-2">
                              {sale.notes?.replace('Negocio: ', '') || 'Venta'}
                            </p>
                            
                            {sale.sale_items && sale.sale_items.length > 0 && (
                              <p className="text-sm text-gray-500 mt-1">
                                {sale.sale_items.length} item{sale.sale_items.length > 1 ? 's' : ''}
                              </p>
                            )}
                          </div>
                          
                          <div className="text-right ml-4">
                            <p className="text-lg font-bold text-gray-900">
                              €{sale.total?.toFixed(2) || '0.00'}
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