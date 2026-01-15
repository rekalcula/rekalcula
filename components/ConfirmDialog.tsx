'use client'

import { useEffect } from 'react'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose?: () => void
  onCancel?: () => void  // Alias de onClose
  onConfirm: () => void
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
  confirmButtonClass?: string
  variant?: 'danger' | 'warning' | 'info'  // Variante visual
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onCancel,
  onConfirm,
  title = '¿Confirmar acción?',
  message = '¿Estás seguro de que quieres continuar?',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  confirmButtonClass,
  variant = 'danger'
}: ConfirmDialogProps) {
  
  // onCancel es un alias de onClose
  const handleClose = onCancel || onClose || (() => {})
  
  // Determinar estilo del botón según variant si no se proporciona confirmButtonClass
  const getConfirmButtonClass = () => {
    if (confirmButtonClass) return confirmButtonClass
    
    switch (variant) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-700'
      case 'warning':
        return 'bg-orange-600 hover:bg-orange-700'
      case 'info':
        return 'bg-blue-600 hover:bg-blue-700'
      default:
        return 'bg-red-600 hover:bg-red-700'
    }
  }
  
  // Cerrar con ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose()
      }
    }
    
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, handleClose])

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
    handleClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
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

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={handleConfirm}
              className={`flex-1 px-4 py-2.5 text-white rounded-lg font-medium transition-colors ${getConfirmButtonClass()}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}