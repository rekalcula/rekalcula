'use client'

interface InvoicePaymentFilterProps {
  selectedMethod: string
  onMethodChange: (method: string) => void
  totalInvoices: number
  filteredCount: number
}

export default function InvoicePaymentFilter({ 
  selectedMethod, 
  onMethodChange,
  totalInvoices,
  filteredCount
}: InvoicePaymentFilterProps) {
  return (
    <div className="bg-gray-200 rounded-xl shadow-sm p-4 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Lado izquierdo: Label y Select */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1">
          <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
            Filtrar por forma de pago:
          </label>
          
          <select
            value={selectedMethod}
            onChange={(e) => onMethodChange(e.target.value)}
            className="
              flex-1 sm:max-w-md px-4 py-2 rounded-lg 
              border border-gray-300 bg-white
              text-gray-900 font-medium
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              cursor-pointer
              transition-colors
            "
          >
            <option value="all">📋 Todas las formas de pago</option>
            <option value="cash">💵 Efectivo</option>
            <option value="card">💳 Tarjeta</option>
            <option value="transfer">🏦 Transferencia</option>
            <option value="promissory_note">📄 Pagaré</option>
            <option value="direct_debit">💰 Domiciliación</option>
            <option value="credit_30">📅 Crédito 30 días</option>
            <option value="credit_60">📅 Crédito 60 días</option>
            <option value="credit_90">📅 Crédito 90 días</option>
          </select>
        </div>

        {/* Lado derecho: Contador y Reset */}
        <div className="flex items-center gap-3">
          {/* Contador */}
          {selectedMethod !== 'all' && (
            <span className="text-sm text-gray-600">
              Mostrando <strong className="text-gray-900">{filteredCount}</strong> de {totalInvoices}
            </span>
          )}

          {/* Reset button */}
          {selectedMethod !== 'all' && (
            <button
              onClick={() => onMethodChange('all')}
              className="
                px-4 py-2 rounded-lg
                bg-gray-600 text-white font-medium text-sm
                hover:bg-gray-700
                transition-colors
                whitespace-nowrap
              "
            >
              Limpiar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}