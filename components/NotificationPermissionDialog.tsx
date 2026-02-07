'use client'

import { useEffect } from 'react'
import { Bell, ShieldCheck, Zap, TrendingUp } from 'lucide-react'

interface NotificationPermissionDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
}

export default function NotificationPermissionDialog({
  isOpen,
  onClose,
  onConfirm
}: NotificationPermissionDialogProps) {
  
  // Cerrar con ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // Prevenir scroll del body cuando el modal está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop - mismo estilo que ConfirmDialog */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal - mismo estilo que ConfirmDialog */}
      <div className="relative bg-[#1a1a1a] rounded-xl shadow-2xl max-w-md w-full mx-4 border border-gray-800">
        <div className="p-6 space-y-4">
          {/* Header con icono */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#FFFCFF]">
                Activar notificaciones
              </h3>
            </div>
          </div>

          {/* Contenido */}
          <div className="space-y-3">
            <p className="text-[#ACACAC]">
              ¿Quieres recibir alertas importantes sobre tu negocio? Las notificaciones te avisarán sobre:
            </p>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-3 text-sm text-[#ACACAC]">
                <TrendingUp className="w-4 h-4 text-orange-400 flex-shrink-0" />
                <span>Análisis de negocio completados</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-[#ACACAC]">
                <ShieldCheck className="w-4 h-4 text-orange-400 flex-shrink-0" />
                <span>Alertas de productos importantes</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-[#ACACAC]">
                <Zap className="w-4 h-4 text-orange-400 flex-shrink-0" />
                <span>Recordatorios financieros</span>
              </div>
            </div>
            
            <p className="text-[#ACACAC] text-sm mt-3 bg-gray-800 p-3 rounded-lg">
              <strong className="text-[#FFFCFF]">Nota:</strong> Después de aceptar, tu navegador te pedirá confirmación final.
            </p>
          </div>

          {/* Actions - mismo estilo que ConfirmDialog */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
            >
              Ahora no
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors"
            >
              Activar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}