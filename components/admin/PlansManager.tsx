'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Save, X, Star } from 'lucide-react'

interface Plan {
  id: string
  name: string
  slug: string
  description: string
  price_monthly: number
  price_yearly: number
  invoices_limit: number
  tickets_limit: number
  analyses_limit: number
  accumulation_factor: number
  stripe_price_monthly: string
  stripe_price_yearly: string
  is_active: boolean
  is_featured: boolean
  display_order: number
}

export default function PlansManager() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    fetchPlans()
  }, [])

  const fetchPlans = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/plans')
      const data = await res.json()
      if (data.success) {
        setPlans(data.plans)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const savePlan = async (plan: Partial<Plan>) => {
    try {
      const method = plan.id ? 'PUT' : 'POST'
      const res = await fetch('/api/admin/plans', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(plan)
      })
      const data = await res.json()
      if (data.success) {
        fetchPlans()
        setEditingPlan(null)
        setIsCreating(false)
      } else {
        alert('Error: ' + data.error)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al guardar')
    }
  }

  const deletePlan = async (id: string) => {
    if (!confirm('¿Desactivar este plan?')) return

    try {
      const res = await fetch(`/api/admin/plans?id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        fetchPlans()
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const emptyPlan: Partial<Plan> = {
    name: '',
    slug: '',
    description: '',
    price_monthly: 0,
    price_yearly: 0,
    invoices_limit: 20,
    tickets_limit: 200,
    analyses_limit: 4,
    accumulation_factor: 2.0,
    stripe_price_monthly: '',
    stripe_price_yearly: '',
    is_active: true,
    is_featured: false,
    display_order: plans.length + 1
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D98C21]"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Gestión de Planes</h2>
        <button
          onClick={() => {
            setEditingPlan(emptyPlan as Plan)
            setIsCreating(true)
          }}
          className="flex items-center gap-2 bg-[#D98C21] text-black px-4 py-2 rounded-lg font-medium hover:bg-[#c47d1d] transition"
        >
          <Plus className="w-4 h-4" />
          Nuevo Plan
        </button>
      </div>

      {/* Plans Table */}
      <div className="bg-[#262626] rounded-xl border border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#333]">
            <tr>
              <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">Plan</th>
              <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">Precio</th>
              <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">Límites</th>
              <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">Estado</th>
              <th className="text-right text-gray-400 text-sm font-medium px-6 py-4">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {plans.map((plan) => (
              <tr key={plan.id} className="hover:bg-[#333] transition">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {plan.is_featured && <Star className="w-4 h-4 text-yellow-400" />}
                    <div>
                      <p className="font-medium text-white">{plan.name}</p>
                      <p className="text-sm text-gray-500">{plan.slug}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="text-white">€{plan.price_monthly}/mes</p>
                  <p className="text-sm text-gray-500">€{plan.price_yearly}/año</p>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-300">
                    <p>{plan.invoices_limit} facturas</p>
                    <p>{plan.tickets_limit} tickets</p>
                    <p>{plan.analyses_limit} análisis</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    plan.is_active 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {plan.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setEditingPlan(plan)}
                      className="p-2 text-gray-400 hover:text-white hover:bg-[#444] rounded-lg transition"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deletePlan(plan.id)}
                      className="p-2 text-gray-400 hover:text-red-400 hover:bg-[#444] rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit/Create Modal */}
      {editingPlan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#262626] rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <h3 className="text-xl font-semibold text-white">
                {isCreating ? 'Crear Plan' : 'Editar Plan'}
              </h3>
              <button
                onClick={() => {
                  setEditingPlan(null)
                  setIsCreating(false)
                }}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Nombre</label>
                  <input
                    type="text"
                    value={editingPlan.name}
                    onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                    className="w-full bg-[#333] border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-[#D98C21] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Slug</label>
                  <input
                    type="text"
                    value={editingPlan.slug}
                    onChange={(e) => setEditingPlan({ ...editingPlan, slug: e.target.value })}
                    className="w-full bg-[#333] border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-[#D98C21] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Descripción</label>
                <input
                  type="text"
                  value={editingPlan.description || ''}
                  onChange={(e) => setEditingPlan({ ...editingPlan, description: e.target.value })}
                  className="w-full bg-[#333] border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-[#D98C21] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Precio Mensual (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingPlan.price_monthly}
                    onChange={(e) => setEditingPlan({ ...editingPlan, price_monthly: parseFloat(e.target.value) })}
                    className="w-full bg-[#333] border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-[#D98C21] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Precio Anual (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingPlan.price_yearly || ''}
                    onChange={(e) => setEditingPlan({ ...editingPlan, price_yearly: parseFloat(e.target.value) })}
                    className="w-full bg-[#333] border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-[#D98C21] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Facturas/mes</label>
                  <input
                    type="number"
                    value={editingPlan.invoices_limit}
                    onChange={(e) => setEditingPlan({ ...editingPlan, invoices_limit: parseInt(e.target.value) })}
                    className="w-full bg-[#333] border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-[#D98C21] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Tickets/mes</label>
                  <input
                    type="number"
                    value={editingPlan.tickets_limit}
                    onChange={(e) => setEditingPlan({ ...editingPlan, tickets_limit: parseInt(e.target.value) })}
                    className="w-full bg-[#333] border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-[#D98C21] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Análisis/mes</label>
                  <input
                    type="number"
                    value={editingPlan.analyses_limit}
                    onChange={(e) => setEditingPlan({ ...editingPlan, analyses_limit: parseInt(e.target.value) })}
                    className="w-full bg-[#333] border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-[#D98C21] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Stripe Price ID (Mensual)</label>
                  <input
                    type="text"
                    value={editingPlan.stripe_price_monthly || ''}
                    onChange={(e) => setEditingPlan({ ...editingPlan, stripe_price_monthly: e.target.value })}
                    className="w-full bg-[#333] border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-[#D98C21] focus:outline-none"
                    placeholder="price_..."
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Stripe Price ID (Anual)</label>
                  <input
                    type="text"
                    value={editingPlan.stripe_price_yearly || ''}
                    onChange={(e) => setEditingPlan({ ...editingPlan, stripe_price_yearly: e.target.value })}
                    className="w-full bg-[#333] border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-[#D98C21] focus:outline-none"
                    placeholder="price_..."
                  />
                </div>
              </div>

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingPlan.is_active}
                    onChange={(e) => setEditingPlan({ ...editingPlan, is_active: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-600 text-[#D98C21] focus:ring-[#D98C21]"
                  />
                  <span className="text-gray-300">Activo</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingPlan.is_featured}
                    onChange={(e) => setEditingPlan({ ...editingPlan, is_featured: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-600 text-[#D98C21] focus:ring-[#D98C21]"
                  />
                  <span className="text-gray-300">Destacado</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-4 p-6 border-t border-gray-700">
              <button
                onClick={() => {
                  setEditingPlan(null)
                  setIsCreating(false)
                }}
                className="px-4 py-2 text-gray-400 hover:text-white transition"
              >
                Cancelar
              </button>
              <button
                onClick={() => savePlan(editingPlan)}
                className="flex items-center gap-2 bg-[#D98C21] text-black px-6 py-2 rounded-lg font-medium hover:bg-[#c47d1d] transition"
              >
                <Save className="w-4 h-4" />
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}