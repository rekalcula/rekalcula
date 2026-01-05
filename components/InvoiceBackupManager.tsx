// components/InvoiceBackupManager.tsx
'use client'

import { useState, useEffect } from 'react'
import { Archive, Trash2, AlertTriangle, Clock, HardDrive, RefreshCw } from 'lucide-react'

interface BackupStats {
  total_backups: number
  oldest_backup?: string
  newest_backup?: string
  days_until_delete: number
  total_size_mb?: number
}

export default function InvoiceBackupManager() {
  const [stats, setStats] = useState<BackupStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [error, setError] = useState<string>('')
  const [successMessage, setSuccessMessage] = useState<string>('')

  // Cargar estadísticas al montar
  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      setIsLoading(true)
      setError('')
      
      const response = await fetch('/api/invoice-backups?action=stats')
      const data = await response.json()

      if (data.success) {
        setStats(data.stats)
      } else {
        setError('Error al cargar estadísticas')
      }
    } catch (err) {
      console.error('Error loading backup stats:', err)
      setError('Error al cargar estadísticas')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteAll = async () => {
    try {
      setIsDeleting(true)
      setError('')
      setSuccessMessage('')

      const response = await fetch('/api/invoice-backups?all=true', {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        setSuccessMessage(data.message || 'Backups eliminados correctamente')
        setShowConfirmDialog(false)
        
        // Recargar estadísticas
        await loadStats()
      } else {
        setError(data.error || 'Error al eliminar backups')
      }
    } catch (err) {
      console.error('Error deleting backups:', err)
      setError('Error al eliminar backups')
    } finally {
      setIsDeleting(false)
    }
  }

  // Si está cargando
  if (isLoading) {
    return (
      <div className="bg-[#262626] border border-gray-700 rounded-xl p-6">
        <div className="flex items-center gap-4">
          <div className="animate-spin">
            <RefreshCw className="w-6 h-6 text-[#d98c21]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white mb-1">
              Cargando información de backups...
            </h3>
            <p className="text-sm text-gray-400">
              Obteniendo datos de tus backups temporales
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Si no hay backups
  if (stats && stats.total_backups === 0) {
    return (
      <div className="bg-[#262626] border border-gray-700 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-green-600/20 rounded-lg">
            <Archive className="w-6 h-6 text-green-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-2">
              Sin backups temporales
            </h3>
            <p className="text-gray-300 text-sm">
              No tienes backups temporales almacenados. Los datos personales de proveedores 
              en tus facturas ya han sido eliminados o nunca se guardaron.
            </p>
            <p className="text-gray-400 text-xs mt-2">
              ✓ Tus análisis económicos continúan funcionando normalmente
            </p>
          </div>
        </div>
      </div>
    )
  }

  const daysText = stats?.days_until_delete === 1 
    ? '1 día' 
    : `${stats?.days_until_delete || 0} días`

  return (
    <div className="space-y-4">
      {/* Panel principal */}
      <div className="bg-[#262626] border border-yellow-600 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-yellow-600/20 rounded-lg">
            <Archive className="w-6 h-6 text-yellow-400" />
          </div>
          
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-2">
              Backup de Datos Originales
            </h3>
            
            <p className="text-gray-300 text-sm mb-4">
              Mantenemos un backup temporal de tus facturas originales (incluyendo nombres 
              de proveedores, direcciones, etc.) para que puedas consultarlos si lo necesitas.
            </p>
            
            {/* Estadísticas */}
            <div className="bg-[#1a1a1a] rounded-lg p-4 mb-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-400">Facturas en backup:</span>
                </div>
                <span className="text-white font-medium">
                  {stats?.total_backups || 0} factura{stats?.total_backups !== 1 ? 's' : ''}
                </span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-400">Auto-eliminación en:</span>
                </div>
                <span className={`font-medium ${
                  (stats?.days_until_delete || 0) <= 7 
                    ? 'text-red-400' 
                    : 'text-yellow-400'
                }`}>
                  {daysText}
                </span>
              </div>

              {stats?.total_size_mb && stats.total_size_mb > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-400">Tamaño aprox:</span>
                  </div>
                  <span className="text-white font-medium">
                    {stats.total_size_mb.toFixed(2)} MB
                  </span>
                </div>
              )}
            </div>
            
            {/* Botón de eliminación */}
            <button
              onClick={() => setShowConfirmDialog(true)}
              disabled={isDeleting}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-4 h-4" />
              {isDeleting ? 'Eliminando...' : 'Eliminar backups permanentemente'}
            </button>
            
            {/* Información adicional */}
            <p className="text-xs text-gray-500 mt-3">
              ℹ️ Tus análisis económicos NO se verán afectados. Solo se eliminarán 
              los datos personales de proveedores guardados en el backup temporal.
            </p>
          </div>
        </div>
      </div>

      {/* Mensajes de éxito/error */}
      {successMessage && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
          <p className="text-green-400 text-sm">✓ {successMessage}</p>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <p className="text-red-400 text-sm">✗ {error}</p>
        </div>
      )}

      {/* Dialog de confirmación */}
      {showConfirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#1a1a1a] border border-red-600 rounded-2xl max-w-md w-full p-6">
            {/* Header */}
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-red-600/20 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">
                  ¿Eliminar todos los backups?
                </h3>
                <p className="text-gray-300 text-sm">
                  Esta acción es <strong>permanente e irreversible</strong>. 
                  Se eliminarán todos los datos originales de proveedores guardados.
                </p>
              </div>
            </div>

            {/* Información */}
            <div className="bg-[#262626] rounded-lg p-4 mb-4 space-y-2 text-sm">
              <p className="text-white">
                <strong>Se eliminará:</strong>
              </p>
              <ul className="text-gray-400 space-y-1 ml-4">
                <li>• Nombres de proveedores</li>
                <li>• Direcciones y datos de contacto</li>
                <li>• NIFs/CIFs de terceros</li>
                <li>• Detalles originales de items</li>
              </ul>
              <p className="text-green-400 mt-3">
                <strong>Se conservará:</strong>
              </p>
              <ul className="text-gray-400 space-y-1 ml-4">
                <li>• Importes y fechas</li>
                <li>• Categorías fiscales</li>
                <li>• Análisis económicos</li>
                <li>• Todos tus reportes</li>
              </ul>
            </div>

            {/* Botones */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmDialog(false)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteAll}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition disabled:opacity-50"
              >
                {isDeleting ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}