'use client'

import { useEffect } from 'react'
import { IconTrash } from './Icons'

interface ConfirmDialogProps {
  isOpen: boolean
  onConfirm: () => void
  onCancel: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
}

export default function ConfirmDialog({
  isOpen,
  onConfirm,
  onCancel,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger'
}: ConfirmDialogProps) {
  // Bloquear scroll del body cuando el modal está abierto
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

  // Cerrar con tecla ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel()
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onCancel])

  if (!isOpen) return null

  const variantStyles = {
    danger: {
      icon: <IconTrash size={24} color="#ef4444" />,
      iconBg: 'bg-red-500/20',
      iconBorder: 'border-red-500/30',
      confirmButton: 'bg-red-500 hover:bg-red-600 focus:ring-red-500'
    },
    warning: {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="#f59e0b">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      iconBg: 'bg-amber-500/20',
      iconBorder: 'border-amber-500/30',
      confirmButton: 'bg-amber-500 hover:bg-amber-600 focus:ring-amber-500'
    },
    info: {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="#3b82f6">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      iconBg: 'bg-blue-500/20',
      iconBorder: 'border-blue-500/30',
      confirmButton: 'bg-blue-500 hover:bg-blue-600 focus:ring-blue-500'
    }
  }

  const styles = variantStyles[variant]

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fadeIn">
      {/* Overlay con blur */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
        aria-hidden="true"
      />
      
      {/* Modal */}
      <div 
        className="relative bg-[#1a1a1a] border border-[#404040] rounded-2xl shadow-2xl max-w-md w-full animate-scaleIn"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby="dialog-description"
      >
        {/* Contenido */}
        <div className="p-6 sm:p-8">
          {/* Icono */}
          <div className={`mx-auto w-14 h-14 rounded-full ${styles.iconBg} border ${styles.iconBorder} flex items-center justify-center mb-4`}>
            {styles.icon}
          </div>

          {/* Título */}
          <h3 
            id="dialog-title"
            className="text-xl sm:text-2xl font-bold text-white text-center mb-3"
          >
            {title}
          </h3>

          {/* Mensaje */}
          <p 
            id="dialog-description"
            className="text-gray-400 text-center text-sm sm:text-base leading-relaxed"
          >
            {message}
          </p>
        </div>

        {/* Botones */}
        <div className="border-t border-[#404040] p-4 sm:p-6 flex flex-col-reverse sm:flex-row gap-3 sm:gap-4">
          {/* Cancelar */}
          <button
            onClick={onCancel}
            className="flex-1 px-6 py-3 bg-[#262626] hover:bg-[#333333] text-white rounded-lg font-medium transition-all duration-200 border border-[#404040] focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-[#1a1a1a]"
          >
            {cancelText}
          </button>

          {/* Confirmar */}
          <button
            onClick={onConfirm}
            className={`flex-1 px-6 py-3 ${styles.confirmButton} text-white rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#1a1a1a] shadow-lg`}
          >
            {confirmText}
          </button>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        .animate-scaleIn {
          animation: scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </div>
  )
}