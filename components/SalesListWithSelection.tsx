'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { IconCalendar, IconDocument, IconTrash } from './Icons'
import ConfirmDialog from './ConfirmDialog'

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
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  // Detectar scroll para mostrar botón "Volver arriba"
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Función para scroll suave hacia arriba
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

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

    // Mostrar modal de confirmación personalizado
    setShowConfirmDialog(true)
  }

  const confirmDelete = async () => {
    setShowConfirmDialog(false)
    setDeleting(true)

    try {
      const response = await fetch(`/api/sales?ids=${selectedIds.join(',')}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Error al eliminar')
      }

      // ⭐ CORRECCIÓN: Después de eliminar, recargar datos desde el inicio
      // Resetear estado de paginación y recargar primera página
      const reloadResponse = await fetch(`/api/sales?page=1&limit=${pageSize}`)
      
      if (reloadResponse.ok) {
        const reloadData = await reloadResponse.json()
        const newSales: Sale[] = reloadData.sales
        
        // Reconstruir salesByDate desde cero
        const newSalesByDate: { [key: string]: Sale[] } = {}
        newSales.forEach((sale) => {
          const date = sale.sale_date || sale.created_at?.split('T')[0] || 'sin-fecha'
          if (!newSalesByDate[date]) {
            newSalesByDate[date] = []
          }
          newSalesByDate[date].push(sale)
        })

        const newSortedDates = Object.keys(newSalesByDate).sort((a, b) => {
          if (a === 'sin-fecha') return 1
          if (b === 'sin-fecha') return -1
          return new Date(b).getTime() - new Date(a).getTime()
        })

        // Actualizar todo el estado
        setSalesByDate(newSalesByDate)
        setSortedDates(newSortedDates)
        setCurrentPage(1)
        setHasMore(reloadData.hasMore)
        setLoadedCount(newSales.length)
      }

      setSelectedIds([])
      router.refresh() // Actualizar metadata del server component
    } catch (error) {
      alert('Error al eliminar las ventas')
    } finally {
      setDeleting(false)
    }
  }

  const cancelDelete = () => {
    setShowConfirmDialog(false)
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
          <div className="bg-[#1a1a1a] rounded-xl border border-[#404040] p-12 text-center">
            <IconDocument size={48} color="#666" className="mx-auto mb-2" />
            <p className="text-gray-400">No hay ventas registradas</p>
            <Link
              href="/dashboard/sales/upload"
              className="mt-4 inline-block text-[#d98c21] hover:text-[#e09b35] font-medium"
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
                <div key={date} className="bg-[#1a1a1a] rounded-xl border border-[#404040] overflow-hidden">
                  {/* Cabecera de fecha */}
                  <div className="px-6 py-4 bg-[#0d0d0d] border-b border-[#404040] flex justify-between items-center">
                    <h3 className="font-semibold text-white capitalize flex items-center gap-2">
                      <IconCalendar size={20} color="#d98c21" />
                      {formattedDate}
                    </h3>
                    <span className="text-green-400 font-semibold">
                      €{dateTotal.toFixed(2)}
                    </span>
                  </div>

                  {/* Ventas del día */}
                  <div className="divide-y divide-[#404040]">
                    {dateSales.map((sale: any) => (
                      <div key={sale.id} className="flex items-center hover:bg-[#262626] transition-colors">
                        {/* Checkbox */}
                        <div className="pl-4">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(sale.id)}
                            onChange={() => toggleSelect(sale.id)}
                            className="w-5 h-5 rounded border-[#404040] text-[#d98c21] focus:ring-[#d98c21] bg-[#262626]"
                          />
                        </div>

                        {/* Contenido */}
                        <Link
                          href={`/dashboard/sales/${sale.id}`}
                          className="flex-1 px-6 py-4"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  sale.source === 'ticket'
                                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                    : 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                                }`}>
                                  {sale.source === 'ticket' ? 'Ticket' : 'Manual'}
                                </span>
                                {sale.payment_method && sale.payment_method !== 'desconocido' && (
                                  <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-300 border border-green-500/30">
                                    {sale.payment_method}
                                  </span>
                                )}
                              </div>

                              <p className="font-medium text-white mt-2">
                                {sale.notes?.replace('Negocio: ', '') || 'Venta'}
                              </p>

                              {sale.sale_items && sale.sale_items.length > 0 && (
                                <p className="text-sm text-gray-400 mt-1">
                                  {sale.sale_items.length} item{sale.sale_items.length > 1 ? 's' : ''}
                                </p>
                              )}
                            </div>

                            <div className="text-right ml-4">
                              {/* ⭐ CORRECCIÓN: Mostrar base imponible (subtotal) */}
                              <p className="text-lg font-bold text-white">
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

      {/* Modal de confirmación de eliminación */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        title="Confirmar eliminación"
        message={`¿Estás seguro de que quieres eliminar ${selectedIds.length} venta${selectedIds.length > 1 ? 's' : ''}? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
      />

      {/* Botón flotante "Volver arriba" */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 bg-[#d98c21] hover:bg-[#e09b35] text-white p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110 z-50"
          aria-label="Volver arriba"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 10l7-7m0 0l7 7m-7-7v18"
            />
          </svg>
        </button>
      )}
    </>
  )
}