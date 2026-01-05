'use client'

import { useState, useEffect } from 'react'
import { 
  UserCheck, 
  UserX, 
  Plus, 
  Search, 
  Euro, 
  Activity,
  FileText,
  Receipt,
  Brain,
  X
} from 'lucide-react'

interface BetaTester {
  id: string
  user_id: string
  granted_at: string
  is_active: boolean
  notes: string | null
  total_operations: number
  total_invoices: number
  total_tickets: number
  total_analyses: number
  total_cost_eur: number
  last_usage: string
}

interface Summary {
  totalTesters: number
  activeTesters: number
  totalCostEur: number
  totalOperations: number
}

export default function BetaTestersManager() {
  const [testers, setTesters] = useState<BetaTester[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [newUserId, setNewUserId] = useState('')
  const [newNotes, setNewNotes] = useState('')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchTesters()
  }, [])

  const fetchTesters = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/beta-testers')
      const data = await res.json()
      if (data.success) {
        setTesters(data.testers)
        setSummary(data.summary)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async () => {
    if (!newUserId.trim()) {
      setError('Introduce el ID del usuario')
      return
    }

    setAdding(true)
    setError('')

    try {
      const res = await fetch('/api/admin/beta-testers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: newUserId.trim(), notes: newNotes.trim() || null })
      })
      const data = await res.json()

      if (data.success) {
        setShowAddModal(false)
        setNewUserId('')
        setNewNotes('')
        fetchTesters()
      } else {
        setError(data.error || 'Error al añadir')
      }
    } catch (error) {
      setError('Error de conexión')
    } finally {
      setAdding(false)
    }
  }

  const handleRevoke = async (userId: string) => {
    if (!confirm('¿Seguro que quieres revocar el acceso de este usuario?')) return

    try {
      const res = await fetch(`/api/admin/beta-testers?userId=${userId}`, {
        method: 'DELETE'
      })
      const data = await res.json()

      if (data.success) {
        fetchTesters()
      } else {
        alert(data.error || 'Error al revocar')
      }
    } catch (error) {
      alert('Error de conexión')
    }
  }

  const filteredTesters = search
    ? testers.filter(t => t.user_id.toLowerCase().includes(search.toLowerCase()))
    : testers

  const activeTesters = filteredTesters.filter(t => t.is_active)
  const inactiveTesters = filteredTesters.filter(t => !t.is_active)

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
        <div>
          <h2 className="text-xl font-semibold text-white">Beta Testers</h2>
          <p className="text-gray-400 text-sm mt-1">
            Usuarios con acceso ilimitado para pruebas
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-[#D98C21] text-black px-4 py-2 rounded-lg font-medium hover:bg-[#c47d1d] transition"
        >
          <Plus className="w-4 h-4" />
          Añadir Tester
        </button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-[#262626] rounded-xl p-4 border border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <UserCheck className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Activos</p>
                <p className="text-2xl font-bold text-white">{summary.activeTesters}</p>
              </div>
            </div>
          </div>
          <div className="bg-[#262626] rounded-xl p-4 border border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Activity className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Operaciones</p>
                <p className="text-2xl font-bold text-white">{summary.totalOperations.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="bg-[#262626] rounded-xl p-4 border border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/20 rounded-lg">
                <Euro className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Coste Total</p>
                <p className="text-2xl font-bold text-white">{summary.totalCostEur.toFixed(2)} €</p>
              </div>
            </div>
          </div>
          <div className="bg-[#262626] rounded-xl p-4 border border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Euro className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Coste Medio/Tester</p>
                <p className="text-2xl font-bold text-white">
                  {summary.activeTesters > 0 
                    ? (summary.totalCostEur / summary.activeTesters).toFixed(2) 
                    : '0.00'} €
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por ID de usuario..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-[#333] border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-500 focus:border-[#D98C21] focus:outline-none"
        />
      </div>

      {/* Active Testers Table */}
      <div className="bg-[#262626] rounded-xl border border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-700">
          <h3 className="text-lg font-medium text-white flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-green-400" />
            Testers Activos ({activeTesters.length})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#333]">
              <tr>
                <th className="text-left text-gray-400 text-sm font-medium px-6 py-3">Usuario</th>
                <th className="text-left text-gray-400 text-sm font-medium px-6 py-3">Fecha Alta</th>
                <th className="text-left text-gray-400 text-sm font-medium px-6 py-3">Uso</th>
                <th className="text-left text-gray-400 text-sm font-medium px-6 py-3">Coste</th>
                <th className="text-left text-gray-400 text-sm font-medium px-6 py-3">Notas</th>
                <th className="text-left text-gray-400 text-sm font-medium px-6 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {activeTesters.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No hay testers activos
                  </td>
                </tr>
              ) : (
                activeTesters.map((tester) => (
                  <tr key={tester.id} className="hover:bg-[#333] transition">
                    <td className="px-6 py-4">
                      <p className="text-white font-mono text-sm">
                        {tester.user_id.substring(0, 24)}...
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-300 text-sm">
                        {new Date(tester.granted_at).toLocaleDateString('es-ES')}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1 text-purple-400">
                          <FileText className="w-3 h-3" />
                          {tester.total_invoices}
                        </span>
                        <span className="flex items-center gap-1 text-orange-400">
                          <Receipt className="w-3 h-3" />
                          {tester.total_tickets}
                        </span>
                        <span className="flex items-center gap-1 text-blue-400">
                          <Brain className="w-3 h-3" />
                          {tester.total_analyses}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-white font-medium">
                        {tester.total_cost_eur.toFixed(3)} €
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-400 text-sm max-w-[200px] truncate">
                        {tester.notes || '-'}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleRevoke(tester.user_id)}
                        className="flex items-center gap-1 text-red-400 hover:text-red-300 text-sm transition"
                      >
                        <UserX className="w-4 h-4" />
                        Revocar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inactive Testers (collapsed) */}
      {inactiveTesters.length > 0 && (
        <details className="bg-[#262626] rounded-xl border border-gray-700">
          <summary className="px-6 py-4 cursor-pointer text-gray-400 hover:text-white transition">
            Testers Revocados ({inactiveTesters.length})
          </summary>
          <div className="px-6 pb-4">
            <div className="space-y-2">
              {inactiveTesters.map((tester) => (
                <div key={tester.id} className="flex items-center justify-between py-2 text-sm text-gray-500">
                  <span className="font-mono">{tester.user_id.substring(0, 24)}...</span>
                  <span>{tester.total_cost_eur.toFixed(3)} € gastados</span>
                </div>
              ))}
            </div>
          </div>
        </details>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#262626] rounded-xl border border-gray-700 p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Añadir Beta Tester</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  ID de Usuario (Clerk)
                </label>
                <input
                  type="text"
                  value={newUserId}
                  onChange={(e) => setNewUserId(e.target.value)}
                  placeholder="user_2abc123..."
                  className="w-full bg-[#333] border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:border-[#D98C21] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Notas (opcional)
                </label>
                <input
                  type="text"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Ej: Tester versión 2.0"
                  className="w-full bg-[#333] border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:border-[#D98C21] focus:outline-none"
                />
              </div>

              {error && (
                <p className="text-red-400 text-sm">{error}</p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 bg-[#333] text-gray-300 rounded-lg hover:bg-[#444] transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAdd}
                  disabled={adding}
                  className="flex-1 px-4 py-2 bg-[#D98C21] text-black rounded-lg font-medium hover:bg-[#c47d1d] transition disabled:opacity-50"
                >
                  {adding ? 'Añadiendo...' : 'Añadir'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}