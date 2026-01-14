'use client'

import { useState } from 'react'

export interface FilterState {
  search: string
  category: string
  supplier: string
  dateFrom: string
  dateTo: string
  minAmount: string
  maxAmount: string
  paymentMethod: string  // NUEVO
}

interface InvoicesFiltersProps {
  onFilterChange: (filters: FilterState) => void
  categories: string[]
  suppliers: string[]
}

export default function InvoicesFilters({ 
  onFilterChange, 
  categories, 
  suppliers 
}: InvoicesFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    category: '',
    supplier: '',
    dateFrom: '',
    dateTo: '',
    minAmount: '',
    maxAmount: '',
    paymentMethod: 'all',  // NUEVO
  })

  const handleChange = (field: keyof FilterState, value: string) => {
    const newFilters = { ...filters, [field]: value }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const handleReset = () => {
    const resetFilters: FilterState = {
      search: '',
      category: '',
      supplier: '',
      dateFrom: '',
      dateTo: '',
      minAmount: '',
      maxAmount: '',
      paymentMethod: 'all',  // NUEVO
    }
    setFilters(resetFilters)
    onFilterChange(resetFilters)
  }

  return (
    <div className="bg-gray-200 rounded-lg shadow p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Filtros</h3>
        <button
          onClick={handleReset}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          Limpiar filtros
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Búsqueda */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Buscar
          </label>
          <input
            type="text"
            placeholder="Buscar por nombre, proveedor..."
            value={filters.search}
            onChange={(e) => handleChange('search', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Categoría */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Categoría
          </label>
          <select
            value={filters.category}
            onChange={(e) => handleChange('category', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todas las categorías</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Proveedor */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Proveedor
          </label>
          <select
            value={filters.supplier}
            onChange={(e) => handleChange('supplier', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todos los proveedores</option>
            {suppliers.map(sup => (
              <option key={sup} value={sup}>{sup}</option>
            ))}
          </select>
        </div>

        {/* NUEVO: Forma de Pago */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Forma de Pago
          </label>
          <select
            value={filters.paymentMethod}
            onChange={(e) => handleChange('paymentMethod', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todas las formas</option>
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

        {/* Fecha desde */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fecha desde
          </label>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => handleChange('dateFrom', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Fecha hasta */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fecha hasta
          </label>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => handleChange('dateTo', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Monto mínimo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Monto mínimo (€)
          </label>
          <input
            type="number"
            step="0.01"
            placeholder="0.00"
            value={filters.minAmount}
            onChange={(e) => handleChange('minAmount', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Monto máximo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Monto máximo (€)
          </label>
          <input
            type="number"
            step="0.01"
            placeholder="0.00"
            value={filters.maxAmount}
            onChange={(e) => handleChange('maxAmount', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
    </div>
  )
}