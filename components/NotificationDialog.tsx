'use client'

import { useEffect } from 'react'

interface NotificationDialogProps {
  isOpen: boolean
  onClose: () => void
  title: string
  message: string
  type?: 'success' | 'error' | 'info' | 'warning'
  buttonText?: string
}

export default function NotificationDialog({
  isOpen,
  onClose,
  title,
  message,
  type = 'info',
  buttonText = 'Aceptar'
}: NotificationDialogProps) {
  
  // Determinar estilo del botón según type
  const getButtonClass = () => {
    switch (type) {
      case 'success':
        return 'bg-green-600 hover:bg-green-700'
      case 'error':
        return 'bg-red-600 hover:bg-red-700'
      case 'warning':
        return 'bg-orange-600 hover:bg-orange-700'
      case 'info':
        return 'bg-blue-600 hover:bg-blue-700'
      default:
        return 'bg-blue-600 hover:bg-blue-700'
    }
  }
  
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-[#1a1a1a] rounded-xl shadow-2xl max-w-md w-full mx-4 border border-gray-800">
        <div className="p-6 space-y-4">
          {/* Header */}
          <div>
            <h3 className="text-xl font-bold text-[#FFFCFF]">
              {title}
            </h3>
            <p className="text-[#ACACAC] mt-2">
              {message}
            </p>
          </div>

          {/* Action Button */}
          <div className="flex pt-2">
            <button
              onClick={onClose}
              className={`w-full px-4 py-2.5 text-white rounded-lg font-medium transition-colors ${getButtonClass()}`}
            >
              {buttonText}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}