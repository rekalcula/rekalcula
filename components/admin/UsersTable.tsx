'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Search, Trash2, AlertTriangle } from 'lucide-react'

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
  const [deleting, setDeleting] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)

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

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user)
    setShowDeleteModal(true)
  }

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return

    setDeleting(userToDelete.user_id)
    try {
      const res = await fetch(`/api/admin/users?userId=${userToDelete.user_id}`, {
        method: 'DELETE'
      })
      const data = await res.json()
      
      if (data.success) {
        // Actualizar lista
        setUsers(users.filter(u => u.user_id !== userToDelete.user_id))
        setShowDeleteModal(false)
        setUserToDelete(null)
      } else {
        alert('Error al eliminar: ' + data.error)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al eliminar usuario')
    } finally {
      setDeleting(null)
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
                <th className="text-center text-gray-400 text-sm font-medium px-6 py-4">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No hay usuarios registrados
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
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
                      <td className="px-6 py-4">
                        <div className="flex justify-center">
                          <button
                            onClick={() => handleDeleteClick(user)}
                            disabled={deleting === user.user_id}
                            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Eliminar usuario"
                          >
                            {deleting === user.user_id ? (
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-400"></div>
                            ) : (
                              <Trash2 className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-700">
          <p className="text-sm text-gray-400">
            Página {page} de {totalPages || 1}
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
              disabled={page === totalPages || totalPages === 0}
              className="p-2 text-gray-400 hover:text-white hover:bg-[#333] rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal de confirmación */}
      {showDeleteModal && userToDelete && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[#262626] rounded-xl p-6 max-w-md w-full mx-4 border border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-500/20 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-xl font-semibold text-white">Eliminar Usuario</h3>
            </div>
            
            <p className="text-gray-300 mb-2">
              ¿Estás seguro de que quieres eliminar este usuario?
            </p>
            <p className="text-sm text-gray-500 mb-4 font-mono bg-[#333] p-2 rounded">
              {userToDelete.user_id}
            </p>
            <p className="text-sm text-red-400 mb-6">
              ⚠️ Esta acción eliminará todos los datos asociados: suscripción, créditos, facturas y tickets. No se puede deshacer.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setUserToDelete(null)
                }}
                className="flex-1 px-4 py-2 bg-[#333] text-gray-300 rounded-lg hover:bg-[#444] transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting !== null}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Eliminando...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Eliminar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}