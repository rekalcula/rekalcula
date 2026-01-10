'use client'

import { useState } from 'react'
import { useAuth } from '@clerk/nextjs'

interface ManualInvoiceFormProps {
  onSuccess?: () => void
}

export default function ManualInvoiceForm({ onSuccess }: ManualInvoiceFormProps) {
  const { userId } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  // ⭐ Estado del formulario
  const [formData, setFormData] = useState({
    supplier: '',
    supplierNif: '',
    invoiceNumber: '',
    invoiceDate: '',
    category: 'Servicios',
    baseAmount: '',
    taxRate: '21', // IVA por defecto 21%
    includeVat: false, // ⭐ CHECKBOX CRÍTICO
    paymentMethod: 'bank_transfer',
    paymentTerms: 'immediate',
    notes: ''
  })

  // ⭐ Cálculos automáticos
  const baseAmount = parseFloat(formData.baseAmount) || 0
  const taxRate = parseFloat(formData.taxRate) || 0
  const taxAmount = baseAmount * (taxRate / 100)
  const totalAmount = baseAmount + taxAmount

  // Monto a guardar en BD según checkbox
  const amountToSave = formData.includeVat ? baseAmount : baseAmount

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.supplier || !formData.baseAmount || !formData.invoiceDate) {
      setError('Por favor completa todos los campos requeridos')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // ========================================
      // PASO 1: Preparar datos para guardado
      // ========================================
      const analysisData = {
        supplier: formData.supplier,
        supplier_nif: formData.supplierNif || null,
        invoice_number: formData.invoiceNumber || null,
        invoice_date: formData.invoiceDate,
        category: formData.category,
        // ⭐ CRÍTICO: base_amount es la base imponible
        base_amount: baseAmount,
        // Importe total con IVA (para referencia)
        total_amount: totalAmount,
        tax_amount: taxAmount,
        items: [
          {
            description: `Factura manual - ${formData.category}`,
            quantity: 1,
            unit_price: baseAmount,
            tax_rate: taxRate,
            total: totalAmount
          }
        ],
        notes: formData.notes,
        analysis: {
          insights: ['Factura registrada manualmente'],
          savings_opportunities: [],
          recommendations: []
        }
      }

      const fileData = {
        filePath: `manual/${userId}/${Date.now()}-manual-invoice.json`,
        fileName: `Factura Manual ${formData.supplier} ${formData.invoiceDate}`,
        fileSize: 0
      }

      // ========================================
      // PASO 2: Guardar en BD
      // ========================================
      const response = await fetch('/api/save-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysis: analysisData,
          fileData,
          paymentMethod: formData.paymentMethod,
          paymentTerms: formData.paymentTerms,
          // ⭐ PARÁMETRO: Indica si se incluye IVA
          includeVat: formData.includeVat
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Error al guardar la factura')
      }

      setSuccess(true)
      setFormData({
        supplier: '',
        supplierNif: '',
        invoiceNumber: '',
        invoiceDate: '',
        category: 'Servicios',
        baseAmount: '',
        taxRate: '21',
        includeVat: false,
        paymentMethod: 'bank_transfer',
        paymentTerms: 'immediate',
        notes: ''
      })

      setTimeout(() => {
        setSuccess(false)
        onSuccess?.()
      }, 2000)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold text-gray-900">Añadir Factura Manual</h2>

      {/* Datos del Proveedor */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Proveedor *</label>
          <input
            type="text"
            name="supplier"
            value={formData.supplier}
            onChange={handleChange}
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">NIF/CIF</label>
          <input
            type="text"
            name="supplierNif"
            value={formData.supplierNif}
            onChange={handleChange}
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Número Factura</label>
          <input
            type="text"
            name="invoiceNumber"
            value={formData.invoiceNumber}
            onChange={handleChange}
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Fecha Factura *</label>
          <input
            type="date"
            name="invoiceDate"
            value={formData.invoiceDate}
            onChange={handleChange}
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
            required
          />
        </div>
      </div>

      {/* Categoría */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Categoría</label>
        <select
          name="category"
          value={formData.category}
          onChange={handleChange}
          className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
        >
          <option value="Servicios">Servicios</option>
          <option value="Productos">Productos</option>
          <option value="Materiales">Materiales</option>
          <option value="Subcontratos">Subcontratos</option>
          <option value="Otros">Otros</option>
        </select>
      </div>

      {/* ⭐ SECCIÓN CRÍTICA: Importes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-50 rounded border border-blue-200">
        <div>
          <label className="block text-sm font-medium text-gray-700">Base Imponible (sin IVA) *</label>
          <input
            type="number"
            name="baseAmount"
            value={formData.baseAmount}
            onChange={handleChange}
            step="0.01"
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 font-semibold"
            required
            placeholder="0.00"
          />
          <p className="text-xs text-gray-500 mt-1">Esta cantidad se guardará en contabilidad</p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Tipo IVA (%)</label>
          <input
            type="number"
            name="taxRate"
            value={formData.taxRate}
            onChange={handleChange}
            step="0.01"
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
            placeholder="21"
          />
        </div>

        {/* Resumen de cálculos */}
        <div className="md:col-span-2 p-3 bg-white rounded border border-blue-300">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Base Imponible</p>
              <p className="font-bold text-lg">{baseAmount.toFixed(2)} €</p>
            </div>
            <div>
              <p className="text-gray-600">IVA ({formData.taxRate}%)</p>
              <p className="font-bold text-lg text-orange-600">{taxAmount.toFixed(2)} €</p>
            </div>
            <div>
              <p className="text-gray-600">Total Factura</p>
              <p className="font-bold text-lg text-green-600">{totalAmount.toFixed(2)} €</p>
            </div>
          </div>
        </div>
      </div>

      {/* ⭐ CHECKBOX CRÍTICO: Incluir IVA en cálculos */}
      <div className="p-4 bg-yellow-50 rounded border border-yellow-300">
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            name="includeVat"
            checked={formData.includeVat}
            onChange={handleChange}
            className="w-5 h-5 rounded border-gray-300"
          />
          <span className="text-sm font-medium text-gray-700">
            ¿El importe incluye IVA?
          </span>
        </label>
        <p className="text-xs text-gray-600 mt-2">
          {formData.includeVat 
            ? '✓ Se contabilizará solo la base imponible sin IVA'
            : '✓ Se contabilizará el importe como base imponible'}
        </p>
      </div>

      {/* Forma de Pago */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Forma de Pago</label>
          <select
            name="paymentMethod"
            value={formData.paymentMethod}
            onChange={handleChange}
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
          >
            <option value="bank_transfer">Transferencia</option>
            <option value="cash">Efectivo</option>
            <option value="card">Tarjeta</option>
            <option value="check">Cheque</option>
            <option value="other">Otra</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Condiciones Pago</label>
          <select
            name="paymentTerms"
            value={formData.paymentTerms}
            onChange={handleChange}
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
          >
            <option value="immediate">Inmediato</option>
            <option value="30days">30 días</option>
            <option value="60days">60 días</option>
            <option value="90days">90 días</option>
          </select>
        </div>
      </div>

      {/* Notas */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Notas</label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows={3}
          className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
          placeholder="Anotaciones adicionales..."
        />
      </div>

      {/* Mensajes de error/éxito */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-300 rounded text-red-700 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-50 border border-green-300 rounded text-green-700 text-sm">
          ✓ Factura guardada correctamente
        </div>
      )}

      {/* Botón envío */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded font-medium hover:bg-blue-700 disabled:bg-gray-400"
      >
        {loading ? 'Guardando...' : 'Guardar Factura'}
      </button>
    </form>
  )
}