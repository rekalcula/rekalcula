'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react'

interface Package {
  id: string
  name: string
  credit_type: 'invoices' | 'tickets' | 'analyses'
  amount: number
  price: number
  stripe_price_id: string
  is_active: boolean
}

export default function PackagesManager() {
  const [packages, setPackages] = useState<Package[]>([])
  const [loading, setLoading] = useState(true)
  const [editingPackage, setEditingPackage] = useState<Package | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    fetchPackages()
  }, [])

  const fetchPackages = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/packages')
      const data = await res.json()
      if (data.success) {
        setPackages(data.packages)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const savePackage = async (pkg: Partial<Package>) => {
    try {
      const method = pkg.id ? 'PUT' : 'POST'
      const res = await fetch('/api/admin/packages', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pkg)
      })
      const data = await res.json()
      if (data.success) {
        fetchPackages()
        setEditingPackage(null)
        setIsCreating(false)
      } else {
        alert('Error: ' + data.error)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al guardar')
    }
  }

  const deletePackage = async (id: string) => {
    if (!confirm('¿Desactivar este paquete?')) return

    try {
      const res = await fetch(`/api/admin/packages?id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        fetchPackages()
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const emptyPackage: Partial<Package> = {
    name: '',
    credit_type: 'invoices',
    amount: 0,
    price: 0,
    stripe_price_id: '',
    is_active: true
  }

  const creditTypeLabels = {
    invoices: 'Facturas',
    tickets: 'Tickets',
    analyses: 'Análisis'
  }

  const creditTypeColors = {
    invoices: 'bg-purple-500/20 text-purple-400',
    tickets: 'bg-orange-500/20 text-orange-400',
    analyses: 'bg-blue-500/20 text-blue-400'
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
        <h2 className="text-xl font-semibold text-white">Paquetes Extra</h2>
        <button
          onClick={() => {
            setEditingPackage(emptyPackage as Package)
            setIsCreating(true)
          }}
          className="flex items-center gap-2 bg-[#D98C21] text-black px-4 py-2 rounded-lg font-medium hover:bg-[#c47d1d] transition"
        >
          <Plus className="w-4 h-4" />
          Nuevo Paquete
        </button>
      </div>

      {/* Packages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {packages.map((pkg) => (
          <div
            key={pkg.id}
            className={`bg-[#262626] rounded-xl border p-6 ${
              pkg.is_active ? 'border-gray-700' : 'border-red-800 opacity-60'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white">{pkg.name}</h3>
                <span className={`inline-block mt-1 px-2 py-1 rounded-full text-xs font-medium ${creditTypeColors[pkg.credit_type]}`}>
                  {creditTypeLabels[pkg.credit_type]}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setEditingPackage(pkg)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-[#333] rounded-lg transition"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deletePackage(pkg.id)}
                  className="p-2 text-gray-400 hover:text-red-400 hover:bg-[#333] rounded-lg transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Cantidad:</span>
                <span className="text-white font-medium">+{pkg.amount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Precio:</span>
                <span className="text-[#D98C21] font-bold">€{pkg.price}</span>
              </div>
            </div>

            {!pkg.is_active && (
              <div className="mt-4 text-center text-red-400 text-sm">
                Desactivado
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Edit/Create Modal */}
      {editingPackage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#262626] rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <h3 className="text-xl font-semibold text-white">
                {isCreating ? 'Crear Paquete' : 'Editar Paquete'}
              </h3>
              <button
                onClick={() => {
                  setEditingPackage(null)
                  setIsCreating(false)
                }}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Nombre</label>
                <input
                  type="text"
                  value={editingPackage.name}
                  onChange={(e) => setEditingPackage({ ...editingPackage, name: e.target.value })}
                  className="w-full bg-[#333] border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-[#D98C21] focus:outline-none"
                  placeholder="Ej: +20 Facturas"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Tipo de Crédito</label>
                <select
                  value={editingPackage.credit_type}
                  onChange={(e) => setEditingPackage({ ...editingPackage, credit_type: e.target.value as any })}
                  className="w-full bg-[#333] border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-[#D98C21] focus:outline-none"
                >
                  <option value="invoices">Facturas</option>
                  <option value="tickets">Tickets</option>
                  <option value="analyses">Análisis</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Cantidad</label>
                  <input
                    type="number"
                    value={editingPackage.amount}
                    onChange={(e) => setEditingPackage({ ...editingPackage, amount: parseInt(e.target.value) })}
                    className="w-full bg-[#333] border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-[#D98C21] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Precio (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingPackage.price}
                    onChange={(e) => setEditingPackage({ ...editingPackage, price: parseFloat(e.target.value) })}
                    className="w-full bg-[#333] border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-[#D98C21] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Stripe Price ID</label>
                <input
                  type="text"
                  value={editingPackage.stripe_price_id || ''}
                  onChange={(e) => setEditingPackage({ ...editingPackage, stripe_price_id: e.target.value })}
                  className="w-full bg-[#333] border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-[#D98C21] focus:outline-none"
                  placeholder="price_..."
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingPackage.is_active}
                  onChange={(e) => setEditingPackage({ ...editingPackage, is_active: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-600 text-[#D98C21] focus:ring-[#D98C21]"
                />
                <span className="text-gray-300">Activo</span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-4 p-6 border-t border-gray-700">
              <button
                onClick={() => {
                  setEditingPackage(null)
                  setIsCreating(false)
                }}
                className="px-4 py-2 text-gray-400 hover:text-white transition"
              >
                Cancelar
              </button>
              <button
                onClick={() => savePackage(editingPackage)}
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