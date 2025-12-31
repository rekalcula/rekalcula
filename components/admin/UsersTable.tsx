'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Search } from 'lucide-react'

interface UserCredits {
  invoices_available: number
  tickets_available: number
  analyses_available: number
  invoices_used_this_month: number
  tickets_used_this_month: number
  analyses_used_this_month: number
}

interface User {
  user_id: string
  status: string
  plan: string
  billing_cycle: string
  trial_start: string
  trial_end: string
  created_at: string
  user_credits: UserCredits[]
  total_invoices: number
  total_tickets: number
}

export default function UsersTable() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchUsers()
  }, [page])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/users?page=${page}&limit=20`)
      const data = await res.json()
      if (data.success) {
        setUsers(data.users)
        setTotalPages(data.pagination.totalPages)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400'
      case 'trialing': return 'bg-blue-500/20 text-blue-400'
      case 'canceled': return 'bg-red-500/20 text-red-400'
      case 'expired': return 'bg-gray-500/20 text-gray-400'
      default: return 'bg-gray-500/20 text-gray-400'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Activo'
      case 'trialing': return 'Prueba'
      case 'canceled': return 'Cancelado'
      case 'expired': return 'Expirado'
      default: return status
    }
  }

  const filteredUsers = search
    ? users.filter(u => u.user_id.toLowerCase().includes(search.toLowerCase()))
    : users

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D98C21]"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Usuarios</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-[#333] border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-500 focus:border-[#D98C21] focus:outline-none"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#262626] rounded-xl border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#333]">
              <tr>
                <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">Usuario</th>
                <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">Plan</th>
                <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">Estado</th>
                <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">Uso Total</th>
                <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">Créditos</th>
                <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">Registro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredUsers.map((user) => {
                const credits = user.user_credits?.[0]
                
                return (
                  <tr key={user.user_id} className="hover:bg-[#333] transition">
                    <td className="px-6 py-4">
                      <p className="text-white font-mono text-sm">
                        {user.user_id.substring(0, 20)}...
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-white capitalize">{user.plan || 'trial'}</p>
                      <p className="text-xs text-gray-500">{user.billing_cycle || '-'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                        {getStatusLabel(user.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <p className="text-gray-300">{user.total_invoices} facturas</p>
                        <p className="text-gray-300">{user.total_tickets} tickets</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {credits ? (
                        <div className="text-sm text-gray-300">
                          <p>F: {credits.invoices_available}</p>
                          <p>T: {credits.tickets_available}</p>
                          <p>A: {credits.analyses_available}</p>
                        </div>
                      ) : (
                        <span className="text-gray-500 text-sm">Sin datos</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-400 text-sm">
                        {new Date(user.created_at).toLocaleDateString('es-ES')}
                      </p>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-700">
          <p className="text-sm text-gray-400">
            Página {page} de {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 text-gray-400 hover:text-white hover:bg-[#333] rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 text-gray-400 hover:text-white hover:bg-[#333] rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}