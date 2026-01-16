// components/PaymentMethodModal.tsx
'use client'

import { useState, useEffect } from 'react'
import { AlertCircle, Calendar, CreditCard, Banknote, FileText, Building } from 'lucide-react'
import ConfirmDialog from './ConfirmDialog'

interface PaymentMethodModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (paymentData: PaymentData) => Promise<void>
  invoiceData: {
    supplierName: string
    totalAmount: number
    invoiceDate: string
  }
}

export interface PaymentData {
  paymentMethod: string
  paymentTerms: string
  paymentDueDate?: string
}

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Efectivo', icon: Banknote, description: 'Pago inmediato en efectivo' },
  { value: 'card', label: 'Tarjeta', icon: CreditCard, description: 'Pago inmediato con tarjeta' },
  { value: 'transfer', label: 'Transferencia', icon: FileText, description: 'Transferencia bancaria' },
  { value: 'direct_debit', label: 'Domiciliación', icon: Building, description: 'Domiciliación bancaria' },
  { value: 'check', label: 'Cheque', icon: FileText, description: 'Pago con cheque' },
  { value: 'deferred', label: 'Aplazado', icon: Calendar, description: 'Pago aplazado' }
]

const PAYMENT_TERMS = [
  { value: 'immediate', label: 'Inmediato', days: 0, description: 'Pago en el mismo día' },
  { value: '30_days', label: '30 días', days: 30, description: 'Pago a 30 días' },
  { value: '60_days', label: '60 días', days: 60, description: 'Pago a 60 días' },
  { value: '90_days', label: '90 días', days: 90, description: 'Pago a 90 días' },
  { value: 'custom', label: 'Personalizado', days: null, description: 'Especificar fecha' }
]

export default function PaymentMethodModal({
  isOpen,
  onClose,
  onConfirm,
  invoiceData
}: PaymentMethodModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<string>('')
  const [selectedTerms, setSelectedTerms] = useState<string>('')
  const [customDate, setCustomDate] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string>('')
  
  // ⭐ NUEVO: Estado para ConfirmDialog de cancelación
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  // Calcular fecha de vencimiento automática
  const calculateDueDate = (terms: string) => {
    const invoiceDate = new Date(invoiceData.invoiceDate)
    const term = PAYMENT_TERMS.find(t => t.value === terms)
    
    if (term && term.days !== null) {
      const dueDate = new Date(invoiceDate)
      dueDate.setDate(dueDate.getDate() + term.days)
      return dueDate.toISOString().split('T')[0]
    }
    
    return customDate || invoiceDate.toISOString().split('T')[0]
  }

  // Resetear cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      setSelectedMethod('')
      setSelectedTerms('')
      setCustomDate('')
      setError('')
      setShowCancelConfirm(false)
    }
  }, [isOpen])

  // Auto-seleccionar términos cuando se elige método
  useEffect(() => {
    if (selectedMethod === 'cash' || selectedMethod === 'card') {
      setSelectedTerms('immediate')
    } else if (selectedMethod && !selectedTerms) {
      setSelectedTerms('30_days')
    }
  }, [selectedMethod])

  const handleConfirm = async () => {
    // Validaciones
    if (!selectedMethod) {
      setError('Debes seleccionar una forma de pago')
      return
    }

    if (!selectedTerms) {
      setError('Debes seleccionar un plazo de pago')
      return
    }

    if (selectedTerms === 'custom' && !customDate) {
      setError('Debes especificar una fecha de vencimiento')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const paymentData: PaymentData = {
        paymentMethod: selectedMethod,
        paymentTerms: selectedTerms,
        paymentDueDate: calculateDueDate(selectedTerms)
      }

      await onConfirm(paymentData)
      // El modal se cierra desde el componente padre después de guardar
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al confirmar forma de pago')
      setIsSubmitting(false)
    }
  }

  // ⭐ NUEVO: Manejar intento de cerrar con ConfirmDialog
  const handleCancelAttempt = () => {
    if (isSubmitting) return
    setShowCancelConfirm(true)
  }

  // ⭐ NUEVO: Cancelar confirmado
  const handleCancelConfirmed = () => {
    setShowCancelConfirm(false)
    onClose()
  }

  if (!isOpen) return null

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
        <div className="bg-[#1a1a1a] border border-[#d98c21] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header - SIN botón X de cerrar */}
          <div className="sticky top-0 bg-[#1a1a1a] border-b border-[#d98c21]/30 p-6">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-6 h-6 text-[#d98c21]" />
              <h2 className="text-2xl font-bold text-white">
                Forma de pago requerida
              </h2>
            </div>
            <p className="text-gray-400 text-sm">
              <strong className="text-[#d98c21]">Paso obligatorio:</strong> Selecciona cómo pagaste o pagarás esta factura para que podamos calcular correctamente tu cash flow.
            </p>
          </div>

          {/* Información de la factura */}
          <div className="p-6 bg-[#262626] border-b border-[#d98c21]/20">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-400 mb-1">Proveedor</p>
                <p className="text-white font-medium">{invoiceData.supplierName}</p>
              </div>
              <div>
                <p className="text-gray-400 mb-1">Importe</p>
                <p className="text-[#d98c21] font-bold text-lg">
                  {formatAmount(invoiceData.totalAmount)}
                </p>
              </div>
              <div>
                <p className="text-gray-400 mb-1">Fecha factura</p>
                <p className="text-white font-medium">
                  {new Date(invoiceData.invoiceDate).toLocaleDateString('es-ES')}
                </p>
              </div>
            </div>
          </div>

          {/* Contenido */}
          <div className="p-6 space-y-6">
            {/* Selección de método de pago */}
            <div>
              <label className="block text-white font-medium mb-3">
                ¿Cómo pagaste/pagarás esta factura? <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {PAYMENT_METHODS.map((method) => {
                  const Icon = method.icon
                  return (
                    <button
                      key={method.value}
                      onClick={() => setSelectedMethod(method.value)}
                      disabled={isSubmitting}
                      className={`
                        p-4 rounded-lg border-2 transition text-left
                        ${selectedMethod === method.value
                          ? 'border-[#d98c21] bg-[#d98c21]/10'
                          : 'border-gray-700 hover:border-gray-600 bg-[#262626]'
                        }
                        disabled:opacity-50 disabled:cursor-not-allowed
                      `}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <Icon className={`w-5 h-5 ${
                          selectedMethod === method.value ? 'text-[#d98c21]' : 'text-gray-400'
                        }`} />
                        <span className="font-medium text-white">{method.label}</span>
                      </div>
                      <p className="text-sm text-gray-400">{method.description}</p>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Selección de plazo de pago */}
            {selectedMethod && (
              <div>
                <label className="block text-white font-medium mb-3">
                  Plazo de pago <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {PAYMENT_TERMS.map((term) => (
                    <button
                      key={term.value}
                      onClick={() => setSelectedTerms(term.value)}
                      disabled={
                        isSubmitting || 
                        ((selectedMethod === 'cash' || selectedMethod === 'card') && term.value !== 'immediate')
                      }
                      className={`
                        p-3 rounded-lg border-2 transition text-center
                        ${selectedTerms === term.value
                          ? 'border-[#d98c21] bg-[#d98c21]/10'
                          : 'border-gray-700 hover:border-gray-600 bg-[#262626]'
                        }
                        disabled:opacity-30 disabled:cursor-not-allowed
                      `}
                    >
                      <div className="font-medium text-white mb-1">{term.label}</div>
                      <div className="text-xs text-gray-400">{term.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Fecha personalizada */}
            {selectedTerms === 'custom' && (
              <div>
                <label className="block text-white font-medium mb-2">
                  Fecha de vencimiento <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  min={invoiceData.invoiceDate}
                  disabled={isSubmitting}
                  className="w-full px-4 py-3 bg-[#262626] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#d98c21] disabled:opacity-50"
                />
              </div>
            )}

            {/* Mensaje de error */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Información importante */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <p className="text-blue-300 text-sm">
                ℹ️ Esta información es necesaria para calcular tu flujo de caja (cash flow) y el resultado de tu empresa de forma precisa.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-[#1a1a1a] border-t border-[#d98c21]/30 p-6 flex gap-3">
            {/* Botón cancelar con ConfirmDialog */}
            <button
              onClick={handleCancelAttempt}
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition disabled:opacity-50"
            >
              Cancelar (no guardar)
            </button>
            
            {/* Botón confirmar */}
            <button
              onClick={handleConfirm}
              disabled={isSubmitting || !selectedMethod || !selectedTerms}
              className="flex-1 px-6 py-3 bg-[#d98c21] hover:bg-[#c17a1a] text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Guardando...' : 'Confirmar y guardar →'}
            </button>
          </div>
        </div>
      </div>

      {/* ⭐ ConfirmDialog para cancelación */}
      <ConfirmDialog
        isOpen={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        onConfirm={handleCancelConfirmed}
        title="¿Cancelar sin guardar?"
        message="¿Estás seguro? Si cancelas, esta factura NO se guardará y deberás subirla de nuevo."
        confirmText="Sí, cancelar"
        cancelText="No, continuar"
        variant="warning"
      />
    </>
  )
}