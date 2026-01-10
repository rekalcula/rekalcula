'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { IconCalendar, IconDocument, IconTrash } from './Icons'

interface Sale {
  id: string
  sale_date: string | null
  total: number | null
  subtotal: number | null  // ⭐ AÑADIDO: campo subtotal
  source: string | null
  payment_method: string | null
  notes: string | null
  created_at: string
  sale_items: any[]
}

interface SalesListWithSelectionProps {
  initialSalesByDate: { [key: string]: Sale[] }
  initialSortedDates: string[]
  totalSales: number
  initialLoadedCount: number
  hasMore: boolean
  pageSize: number
}

export default function SalesListWithSelection({ 
  initialSalesByDate, 
  initialSortedDates,
  totalSales,
  initialLoadedCount,
  hasMore: initialHasMore,
  pageSize
}: SalesListWithSelectionProps) {
  const router = useRouter()
  const [salesByDate, setSalesByDate] = useState(initialSalesByDate)
  const [sortedDates, setSortedDates] = useState(initialSortedDates)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [deleting, setDeleting] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [loadedCount, setLoadedCount] = useState(initialLoadedCount)

  // Obtener todos los IDs de las ventas cargadas
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

  // Función para cargar más ventas
  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return

    setLoadingMore(true)
    const nextPage = currentPage + 1

    try {
      const response = await fetch(`/api/sales?page=${nextPage}&limit=${pageSize}`)
      
      if (!response.ok) {
        throw new Error('Error al cargar más ventas')
      }

      const data = await response.json()
      const newSales: Sale[] = data.sales

      if (newSales.length > 0) {
        // Agrupar nuevas ventas por fecha
        const newSalesByDate = { ...salesByDate }
        
        newSales.forEach((sale) => {
          const date = sale.sale_date || sale.created_at?.split('T')[0] || 'sin-fecha'
          if (!newSalesByDate[date]) {
            newSalesByDate[date] = []
          }
          // Evitar duplicados
          if (!newSalesByDate[date].some(s => s.id === sale.id)) {
            newSalesByDate[date].push(sale)
          }
        })

        // Reordenar las fechas
        const newSortedDates = Object.keys(newSalesByDate).sort((a, b) => {
          if (a === 'sin-fecha') return 1
          if (b === 'sin-fecha') return -1
          return new Date(b).getTime() - new Date(a).getTime()
        })

        setSalesByDate(newSalesByDate)
        setSortedDates(newSortedDates)
        setCurrentPage(nextPage)
        setHasMore(data.hasMore)
        setLoadedCount(prev => prev + newSales.length)
      } else {
        setHasMore(false)
      }
    } catch (error) {
      console.error('Error loading more sales:', error)
      alert('Error al cargar más ventas')
    } finally {
      setLoadingMore(false)
    }
  }

  // ⭐ HELPER: Obtener base imponible (subtotal o total como fallback)
  const getBaseAmount = (sale: Sale): number => {
    return sale.subtotal || sale.total || 0
  }

  return (
    <>
      {/* Barra de selección */}
      {allIds.length > 0 && (
        <div className="bg-gray-200 rounded-xl shadow-sm p-4 mb-6 flex items-center justify-between">
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
              className="bg-red-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <IconTrash size={18} />
              {deleting ? 'Eliminando...' : `Eliminar (${selectedIds.length})`}
            </button>
          )}
        </div>
      )}

      {/* Lista de ventas */}
      <div className="space-y-6">
        {sortedDates.length === 0 ? (
          <div className="bg-gray-200 rounded-xl shadow-sm p-12 text-center">
            <IconDocument size={48} color="#9CA3AF" className="mx-auto mb-2" />
            <p className="text-gray-500">No hay ventas registradas</p>
            <Link
              href="/dashboard/sales/upload"
              className="mt-4 inline-block text-green-600 hover:text-green-700 font-medium"
            >
              Subir primer ticket →
            </Link>
          </div>
        ) : (
          <>
            {sortedDates.map((date) => {
              const dateSales = salesByDate[date]
              // ⭐ CORRECCIÓN: Usar subtotal (base imponible) en vez de total
              const dateTotal = dateSales.reduce((sum: number, s: any) => sum + getBaseAmount(s), 0)
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
                              {/* ⭐ CORRECCIÓN: Mostrar base imponible (subtotal) */}
                              <p className="text-lg font-bold text-gray-900">
                                €{getBaseAmount(sale).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}

            {/* Botón Cargar más y contador */}
            <div className="mt-8 text-center space-y-4">
              {hasMore && (
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="bg-[#0d0d0d] text-white px-8 py-3 rounded-lg font-medium hover:bg-[#2d2d2d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingMore ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Cargando...
                    </span>
                  ) : (
                    `Cargar más ventas`
                  )}
                </button>
              )}
              
              <p className="text-gray-400 text-sm">
                Mostrando {loadedCount} de {totalSales} ventas
                {!hasMore && totalSales > 0 && ' (todas cargadas)'}
              </p>
            </div>
          </>
        )}
      </div>
    </>
  )
}