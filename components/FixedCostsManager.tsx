'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Category {
  id: string
  name: string
  icon: string
  is_system: boolean
}

interface FixedCost {
  id: string
  name: string
  description?: string
  amount: number
  frequency: string
  category_id: string
  is_active: boolean
  fixed_cost_categories?: Category
}

interface Props {
  initialCategories: Category[]
  initialCosts: FixedCost[]
}

export default function FixedCostsManager({ initialCategories, initialCosts }: Props) {
  const router = useRouter()
  const [costs, setCosts] = useState(initialCosts)
  const [showAddCost, setShowAddCost] = useState(false)
  const [saving, setSaving] = useState(false)

  const [newCost, setNewCost] = useState({
    name: '',
    amount: '',
    frequency: 'monthly',
    category_id: '',
    description: ''
  })

  const handleAddCost = async () => {
    if (!newCost.name || !newCost.amount || !newCost.category_id) return
    setSaving(true)

    try {
      const response = await fetch('/api/fixed-costs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'cost',
          name: newCost.name,
          amount: parseFloat(newCost.amount),
          frequency: newCost.frequency,
          category_id: newCost.category_id,
          description: newCost.description
        })
      })

      if (response.ok) {
        router.refresh()
        setNewCost({ name: '', amount: '', frequency: 'monthly', category_id: '', description: '' })
        setShowAddCost(false)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteCost = async (id: string) => {
    if (!confirm('¿Eliminar este costo fijo?')) return

    try {
      await fetch(`/api/fixed-costs?id=${id}`, { method: 'DELETE' })
      setCosts(costs.filter(c => c.id !== id))
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const getMonthlyAmount = (cost: FixedCost) => {
    if (cost.frequency === 'quarterly') return cost.amount / 3
    if (cost.frequency === 'yearly') return cost.amount / 12
    return cost.amount
  }

  const frequencyLabels: Record<string, string> = {
    monthly: 'Mensual',
    quarterly: 'Trimestral',
    yearly: 'Anual'
  }

  // Agrupar costos por categoría
  const costsByCategory = costs.reduce((acc, cost) => {
    const catId = cost.category_id || 'other'
    if (!acc[catId]) acc[catId] = []
    acc[catId].push(cost)
    return acc
  }, {} as Record<string, FixedCost[]>)

  return (
    <div className="space-y-6">
      {/* Botón añadir */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowAddCost(true)}
          className="bg-[#0d0d0d] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#2d2d2d]"
        >
          + Añadir Costo Fijo
        </button>
      </div>

      {/* Formulario nuevo costo */}
      {showAddCost && (
        <div className="bg-gray-200 rounded-xl shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Nuevo Costo Fijo</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoría *
              </label>
              <select
                value={newCost.category_id}
                onChange={(e) => setNewCost({ ...newCost, category_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              >
                <option value="">Seleccionar...</option>
                {initialCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre *
              </label>
              <input
                type="text"
                placeholder="Ej: Alquiler local"
                value={newCost.name}
                onChange={(e) => setNewCost({ ...newCost, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Importe (€) *
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={newCost.amount}
                onChange={(e) => setNewCost({ ...newCost, amount: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Frecuencia
              </label>
              <select
                value={newCost.frequency}
                onChange={(e) => setNewCost({ ...newCost, frequency: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="monthly">Mensual</option>
                <option value="quarterly">Trimestral</option>
                <option value="yearly">Anual</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción (opcional)
              </label>
              <input
                type="text"
                placeholder="Notas adicionales..."
                value={newCost.description}
                onChange={(e) => setNewCost({ ...newCost, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end space-x-3">
            <button
              onClick={() => setShowAddCost(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancelar
            </button>
            <button
              onClick={handleAddCost}
              disabled={saving || !newCost.name || !newCost.amount || !newCost.category_id}
              className="px-6 py-2 bg-[#0d0d0d] text-white rounded-lg font-medium hover:bg-[#2d2d2d] disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      )}

      {/* Lista de costos por categoría */}
      {Object.entries(costsByCategory).map(([catId, categoryCosts]) => {
        const category = initialCategories.find(c => c.id === catId)
        const categoryTotal = categoryCosts.reduce((sum, c) => sum + getMonthlyAmount(c), 0)

        return (
          <div key={catId} className="bg-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b flex justify-between items-center">
              <h3 className="font-semibold text-gray-900 text-[20px]">
                {category?.icon} {category?.name || 'Otros'}
              </h3>
              <span className="text-[20px] font-medium text-gray-600">
                €{categoryTotal.toFixed(2)}/mes
              </span>
            </div>
            <div className="divide-y">
              {categoryCosts.map((cost) => (
                <div key={cost.id} className="px-6 py-4 flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-900 text-[20px]">{cost.name}</p>
                    {cost.description && (
                      <p className="text-gray-500 text-[20px]">{cost.description}</p>
                    )}
                    <span className="text-[20px] text-gray-400">
                      {frequencyLabels[cost.frequency]}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 text-[20px]">
                        €{cost.amount.toFixed(2)}
                      </p>
                      {cost.frequency !== 'monthly' && (
                        <p className="text-[20px] text-gray-500">
                          €{getMonthlyAmount(cost).toFixed(2)}/mes
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteCost(cost.id)}
                      className="text-red-600 hover:text-red-700 text-[20px]"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}

      {costs.length === 0 && (
        <div className="bg-gray-200 rounded-xl shadow-sm p-12 text-center">
          <span className="text-4xl block mb-2">💰</span>
          <p className="text-gray-500">No hay costos fijos registrados</p>
          <p className="text-sm text-gray-400 mt-1">
            Añade tus gastos fijos como alquiler, luz, agua, etc.
          </p>
        </div>
      )}
    </div>
  )
}