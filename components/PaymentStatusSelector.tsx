'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  invoiceId: number
  invoiceDate: string | null
  currentPaymentStatus: string | null
  currentPaymentTerm: string | null
  currentDueDate: string | null
}

export default function PaymentStatusSelector({
  invoiceId,
  invoiceDate,
  currentPaymentStatus,
  currentPaymentTerm,
  currentDueDate
}: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [paidCash, setPaidCash] = useState(currentPaymentStatus === 'paid' && currentPaymentTerm === 'contado')
  const [paymentTerm, setPaymentTerm] = useState(currentPaymentTerm || '')
  const [showDropdown, setShowDropdown] = useState(currentPaymentStatus === 'pending')

  const paymentOptions = [
    { value: '15', label: '15 dias' },
    { value: '30', label: '30 dias' },
    { value: '45', label: '45 dias' },
    { value: '60', label: '60 dias' },
    { value: '90', label: '90 dias' },
  ]

  // Calcular fecha de vencimiento
  const calculateDueDate = (term: string): string | null => {
    if (!invoiceDate || term === 'contado') return null
    
    const date = new Date(invoiceDate)
    const days = parseInt(term)
    date.setDate(date.getDate() + days)
    return date.toISOString().split('T')[0]
  }

  // Formatear fecha para mostrar
  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const handlePaidCash = async (isPaidCash: boolean) => {
    setPaidCash(isPaidCash)
    
    if (isPaidCash) {
      // Pagado al contado
      setShowDropdown(false)
      setPaymentTerm('contado')
      await savePaymentStatus('paid', 'contado', null)
    } else {
      // No pagado al contado - mostrar opciones
      setShowDropdown(true)
      setPaymentTerm('')
    }
  }

  const handlePaymentTermChange = async (term: string) => {
    setPaymentTerm(term)
    const dueDate = calculateDueDate(term)
    await savePaymentStatus('pending', term, dueDate)
  }

  const savePaymentStatus = async (status: string, term: string, dueDate: string | null) => {
    setSaving(true)
    try {
      const response = await fetch('/api/invoices/payment-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId,
          paymentStatus: status,
          paymentTerm: term,
          dueDate
        })
      })

      if (response.ok) {
        router.refresh()
      }
    } catch (error) {
      console.error('Error guardando estado de pago:', error)
    } finally {
      setSaving(false)
    }
  }

  // Calcular fecha vencimiento actual para mostrar
  const displayDueDate = paymentTerm && paymentTerm !== 'contado' 
    ? calculateDueDate(paymentTerm) 
    : currentDueDate

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Estado de Pago
      </h2>

      {/* Pregunta principal */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          ¿Se ha pagado al contado?
        </label>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => handlePaidCash(true)}
            disabled={saving}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
              paidCash
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            } disabled:opacity-50`}
          >
            SI
          </button>
          <button
            type="button"
            onClick={() => handlePaidCash(false)}
            disabled={saving}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
              showDropdown && !paidCash
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            } disabled:opacity-50`}
          >
            NO
          </button>
        </div>
      </div>

      {/* Dropdown de forma de pago (solo si NO) */}
      {showDropdown && (
        <div className="mt-4 p-4 bg-[#262626] rounded-lg border border-gray-600">
          <label className="block text-sm font-medium text-white mb-2">
            Forma de pago:
          </label>
          <select
            value={paymentTerm}
            onChange={(e) => handlePaymentTermChange(e.target.value)}
            disabled={saving}
            className="w-full px-4 py-3 border border-gray-600 rounded-lg bg-[#1a1a1a] text-white focus:ring-2 focus:ring-[#d98c21] focus:border-transparent disabled:opacity-50"
          >
            <option value="">Seleccionar plazo...</option>
            {paymentOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Mostrar fecha de vencimiento calculada */}
          {paymentTerm && displayDueDate && (
            <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-orange-600 text-lg">📅</span>
                <div>
                  <p className="text-sm text-orange-700 font-medium">Fecha de vencimiento:</p>
                  <p className="text-lg font-bold text-orange-800">{formatDate(displayDueDate)}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Estado actual */}
      {(currentPaymentStatus || paidCash || paymentTerm) && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Estado:</span>
            {paidCash || currentPaymentStatus === 'paid' ? (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                ✓ Pagada
              </span>
            ) : paymentTerm ? (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
                ⏳ Pendiente ({paymentTerm} dias)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
                Sin definir
              </span>
            )}
          </div>
        </div>
      )}

      {/* Indicador de guardando */}
      {saving && (
        <div className="mt-3 text-center text-sm text-gray-500">
          Guardando...
        </div>
      )}
    </div>
  )
}