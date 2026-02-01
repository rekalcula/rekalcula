'use client'

// ============================================================
// COMPONENTE: NotificationsLab
// Ubicación: components/admin/NotificationsLab.tsx
// Laboratorio de notificaciones push + email para panel admin
// ============================================================

import { useState, useEffect } from 'react'
import {
  Bell, Send, Clock, Loader2, Trash2, Smartphone, Monitor, Mail,
  Search, X, Users, Check, User
} from 'lucide-react'

// ─── Interfaces ─────────────────────────────────────────────────

interface PushStatus {
  success: boolean
  sent: number
  failed: number
  noDevices: boolean
  targeted?: number
  notified?: number
}

interface EmailStatus {
  success: boolean
  to: string | null
  messageId?: string
  error?: string
}

interface SentNotification {
  id: number
  title: string
  body: string
  url: string
  sentAt: string
  push: PushStatus
  email: EmailStatus
  target: SendTarget
  targetedUsers?: number
}

interface UserBasic {
  user_id: string
  status: string
  plan: string
}

type SendTarget = 'self' | 'specific' | 'all'

// ─── Component ──────────────────────────────────────────────────

export default function NotificationsLab() {
  // Form
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [url, setUrl] = useState('/dashboard')
  const [isSending, setIsSending] = useState(false)
  const [history, setHistory] = useState<SentNotification[]>([])
  const [lastResult, setLastResult] = useState<{ push: PushStatus; email: EmailStatus } | null>(null)
  const [previewType, setPreviewType] = useState<'mobile' | 'desktop' | 'email'>('mobile')

  // Targeting
  const [sendTarget, setSendTarget] = useState<SendTarget>('self')
  const [users, setUsers] = useState<UserBasic[]>([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [userSearch, setUserSearch] = useState('')

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setLoadingUsers(true)
    try {
      const res = await fetch('/api/admin/users?limit=200')
      const data = await res.json()
      if (data.success) setUsers(data.users)
    } catch (err) {
      console.error('Error fetching users:', err)
    } finally {
      setLoadingUsers(false)
    }
  }

  // ─── User selector helpers ────────────────────────────────────

  const filteredUsers = users.filter(u =>
    u.user_id.toLowerCase().includes(userSearch.toLowerCase())
  )

  const toggleUser = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    )
  }

  const toggleAllFiltered = () => {
    const ids = filteredUsers.map(u => u.user_id)
    const allIn = ids.every(id => selectedUsers.includes(id))
    setSelectedUsers(prev =>
      allIn ? prev.filter(id => !ids.includes(id)) : [...new Set([...prev, ...ids])]
    )
  }

  const removeUser = (userId: string) => {
    setSelectedUsers(prev => prev.filter(id => id !== userId))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':   return 'bg-green-500/20 text-green-400'
      case 'trialing': return 'bg-blue-500/20 text-blue-400'
      case 'canceled': return 'bg-red-500/20 text-red-400'
      default:         return 'bg-gray-500/20 text-gray-400'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':   return 'Activo'
      case 'trialing': return 'Prueba'
      case 'canceled': return 'Cancelado'
      default:         return status
    }
  }

  // ─── Send logic ───────────────────────────────────────────────

  const getTargetUserIds = (): string[] | undefined => {
    if (sendTarget === 'self')     return undefined
    if (sendTarget === 'all')      return users.map(u => u.user_id)
    if (sendTarget === 'specific') return selectedUsers.length > 0 ? selectedUsers : undefined
    return undefined
  }

  const canSend = !!(title && body && (
    sendTarget === 'self' ||
    (sendTarget === 'all' && users.length > 0) ||
    (sendTarget === 'specific' && selectedUsers.length > 0)
  ))

  const sendNotification = async () => {
    if (!canSend) return
    setIsSending(true)
    setLastResult(null)

    try {
      const targetUserIds = getTargetUserIds()

      const response = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          body,
          url,
          ...(targetUserIds ? { targetUserIds } : {})
        })
      })

      const data = await response.json()

      if (data.success || data.push || data.email) {
        const entry: SentNotification = {
          id: Date.now(),
          title,
          body,
          url,
          sentAt: new Date().toLocaleTimeString('es-ES'),
          push: data.push || { success: false, sent: 0, failed: 0, noDevices: true },
          email: data.email || { success: false, to: null, error: 'Sin datos' },
          target: sendTarget,
          targetedUsers: targetUserIds?.length
        }
        setHistory(prev => [entry, ...prev])
        setLastResult({ push: entry.push, email: entry.email })
      } else {
        setLastResult({
          push: { success: false, sent: 0, failed: 0, noDevices: true },
          email: { success: false, to: null, error: data.error || 'Error al enviar' }
        })
      }
    } catch {
      setLastResult({
        push: { success: false, sent: 0, failed: 0, noDevices: true },
        email: { success: false, to: null, error: 'Error de conexión' }
      })
    } finally {
      setIsSending(false)
    }
  }

  // ─── Render ───────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* ============================================================
          SECCIÓN 1: Formulario
          ============================================================ */}
      <div className="bg-[#262626] rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5 text-[#D98C21]" />
          Componer notificación
        </h3>

        <div className="space-y-4">
          {/* Título */}
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Título *</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ej: 🎉 ¡Alerta de ventas!"
              className="w-full px-4 py-2.5 bg-[#333] border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#D98C21] transition"
            />
          </div>

          {/* Mensaje */}
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Mensaje *</label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Ej: Tus ventas han aumentado un 15% esta semana"
              rows={3}
              className="w-full px-4 py-2.5 bg-[#333] border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#D98C21] transition resize-none"
            />
          </div>

          {/* URL */}
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">
              URL al abrir <span className="text-gray-600">(opcional)</span>
            </label>
            <input
              type="text"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="/dashboard"
              className="w-full px-4 py-2.5 bg-[#333] border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#D98C21] transition"
            />
          </div>

          {/* ═══════════════════════════════════════════════════════
              DESTINATARIOS — selector de modo + picker de usuarios
              ═══════════════════════════════════════════════════════ */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Destinatarios</label>

            {/* Botones de modo */}
            <div className="flex gap-2 flex-wrap">
              {([
                { id: 'self',     icon: User,  label: 'Solo yo' },
                { id: 'specific', icon: Users, label: 'Específicos' },
                { id: 'all',      icon: Bell,  label: `Todos (${users.length})` },
              ] as const).map(({ id, icon: Icon, label }) => (
                <button
                  key={id}
                  onClick={() => setSendTarget(id)}
                  disabled={id === 'all' && users.length === 0}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition
                    disabled:opacity-40 disabled:cursor-not-allowed ${
                      sendTarget === id
                        ? 'bg-[#D98C21] text-black font-medium'
                        : 'bg-[#333] text-gray-300 border border-gray-600 hover:border-gray-500'
                    }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                  {id === 'specific' && selectedUsers.length > 0 && (
                    <span className={`text-xs ml-0.5 ${sendTarget === 'specific' ? 'text-black/50' : 'text-[#D98C21]'}`}>
                      ({selectedUsers.length})
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Picker — solo cuando el modo es 'specific' */}
            {sendTarget === 'specific' && (
              <div className="mt-3 border border-gray-600 rounded-lg overflow-hidden">

                {/* Buscador */}
                <div className="flex items-center gap-2 px-3 py-2 bg-[#333] border-b border-gray-600">
                  <Search className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Buscar por ID..."
                    value={userSearch}
                    onChange={e => setUserSearch(e.target.value)}
                    className="bg-transparent text-white text-sm flex-1 outline-none placeholder-gray-500"
                  />
                  {userSearch && (
                    <button onClick={() => setUserSearch('')} className="text-gray-500 hover:text-gray-300 transition">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Lista de usuarios */}
                <div className="max-h-48 overflow-y-auto">
                  {loadingUsers ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <p className="text-gray-500 text-xs text-center py-4">No hay usuarios</p>
                  ) : (
                    <>
                      {/* Fila "Seleccionar todos" */}
                      <div
                        onClick={toggleAllFiltered}
                        className="flex items-center gap-3 px-3 py-2 bg-[#2a2a2a] cursor-pointer hover:bg-[#353535] transition border-b border-gray-700"
                      >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                          filteredUsers.every(u => selectedUsers.includes(u.user_id))
                            ? 'bg-[#D98C21] border-[#D98C21]'
                            : 'border-gray-500'
                        }`}>
                          {filteredUsers.every(u => selectedUsers.includes(u.user_id)) && (
                            <Check className="w-3 h-3 text-black" />
                          )}
                        </div>
                        <span className="text-gray-400 text-xs font-medium">
                          {filteredUsers.every(u => selectedUsers.includes(u.user_id))
                            ? 'Desseleccionar todos'
                            : 'Seleccionar todos'}
                        </span>
                      </div>

                      {/* Usuarios */}
                      {filteredUsers.map(user => {
                        const sel = selectedUsers.includes(user.user_id)
                        return (
                          <div
                            key={user.user_id}
                            onClick={() => toggleUser(user.user_id)}
                            className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition ${
                              sel ? 'bg-[#D98C21]/10 hover:bg-[#D98C21]/15' : 'hover:bg-[#353535]'
                            }`}
                          >
                            <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                              sel ? 'bg-[#D98C21] border-[#D98C21]' : 'border-gray-500'
                            }`}>
                              {sel && <Check className="w-3 h-3 text-black" />}
                            </div>
                            <span className="text-white font-mono text-xs flex-1 truncate">
                              {user.user_id.length > 28
                                ? user.user_id.substring(0, 28) + '…'
                                : user.user_id}
                            </span>
                            <span className={`text-xs px-1.5 py-0.5 rounded flex-shrink-0 ${getStatusColor(user.status)}`}>
                              {getStatusLabel(user.status)}
                            </span>
                          </div>
                        )
                      })}
                    </>
                  )}
                </div>

                {/* Chips de selección */}
                {selectedUsers.length > 0 && (
                  <div className="flex gap-1.5 flex-wrap p-2.5 border-t border-gray-700 bg-[#2a2a2a]">
                    {selectedUsers.slice(0, 5).map(id => (
                      <span key={id} className="inline-flex items-center gap-1 bg-[#D98C21]/20 text-[#D98C21] text-xs px-2 py-0.5 rounded-full">
                        {id.substring(0, 14)}…
                        <button
                          onClick={e => { e.stopPropagation(); removeUser(id) }}
                          className="hover:text-white transition"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    ))}
                    {selectedUsers.length > 5 && (
                      <span className="text-xs text-gray-500 self-center">
                        +{selectedUsers.length - 5} más
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Aviso broadcast */}
            {sendTarget === 'all' && users.length > 0 && (
              <div className="mt-2 flex items-center gap-2 text-xs text-yellow-400/80 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2">
                <Bell className="w-3.5 h-3.5 flex-shrink-0" />
                Se enviará a los {users.length} usuarios registrados
              </div>
            )}
          </div>
        </div>

        {/* Botón enviar */}
        <div className="mt-6">
          <button
            onClick={sendNotification}
            disabled={isSending || !canSend}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[#D98C21] text-black rounded-lg font-medium hover:bg-[#c47d1d] disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {isSending ? 'Enviando…' : 'Enviar notificación'}
          </button>
        </div>

        {/* Resultado: push + email */}
        {lastResult && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Push */}
            <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${
              lastResult.push.success
                ? 'bg-green-500/10 border-green-500/30'
                : 'bg-gray-700/40 border-gray-600'
            }`}>
              <div className={`p-1.5 rounded-md ${lastResult.push.success ? 'bg-green-500/20' : 'bg-gray-600'}`}>
                <Smartphone className={`w-4 h-4 ${lastResult.push.success ? 'text-green-400' : 'text-gray-400'}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-400 font-medium">Push</p>
                <p className={`text-sm font-semibold truncate ${lastResult.push.success ? 'text-green-400' : 'text-gray-400'}`}>
                  {lastResult.push.success
                    ? (lastResult.push.targeted
                        ? `${lastResult.push.sent} disp. en ${lastResult.push.notified}/${lastResult.push.targeted} usu.`
                        : `${lastResult.push.sent} dispositivo${lastResult.push.sent !== 1 ? 's' : ''}`)
                    : (lastResult.push.noDevices ? 'Sin dispositivos' : 'Error')}
                </p>
              </div>
            </div>

            {/* Email */}
            <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${
              lastResult.email.success
                ? 'bg-green-500/10 border-green-500/30'
                : 'bg-gray-700/40 border-gray-600'
            }`}>
              <div className={`p-1.5 rounded-md ${lastResult.email.success ? 'bg-green-500/20' : 'bg-gray-600'}`}>
                <Mail className={`w-4 h-4 ${lastResult.email.success ? 'text-green-400' : 'text-gray-400'}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-400 font-medium">Email</p>
                <p className={`text-sm font-semibold truncate ${lastResult.email.success ? 'text-green-400' : 'text-gray-400'}`}>
                  {lastResult.email.success
                    ? (lastResult.email.to || 'Enviado')
                    : (lastResult.email.error || 'No habilitado')}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================
          SECCIÓN 2: Previsualización (push móvil / push web / email)
          ============================================================ */}
      <div className="bg-[#262626] rounded-xl p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Previsualización</h3>
          <div className="flex bg-[#333] rounded-lg p-1 gap-1">
            {([
              { id: 'mobile',  icon: Smartphone, label: 'Móvil' },
              { id: 'desktop', icon: Monitor,    label: 'Web' },
              { id: 'email',   icon: Mail,       label: 'Email' },
            ] as const).map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setPreviewType(id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition ${
                  previewType === id ? 'bg-[#D98C21] text-black font-medium' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {title || body ? (
          <>
            {/* Móvil */}
            {previewType === 'mobile' && (
              <div className="max-w-sm mx-auto">
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
                  <div className="bg-[#111] px-4 py-2 flex justify-between items-center">
                    <span className="text-white text-xs font-medium">9:41</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-white text-xs opacity-60">●●●</span>
                      <div className="w-5 h-2.5 border border-white rounded-sm relative opacity-80">
                        <div className="absolute inset-0.5 bg-white rounded-sm" style={{ width: '70%' }} />
                      </div>
                    </div>
                  </div>
                  <div className="m-3 bg-gray-50 rounded-xl p-4 shadow-sm border border-gray-100">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-[#D98C21] rounded-xl flex items-center justify-center flex-shrink-0">
                        <Bell className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-gray-600 text-xs font-medium">reKalcula</p>
                          <p className="text-gray-400 text-xs flex-shrink-0">Ahora</p>
                        </div>
                        <p className="text-gray-900 font-semibold text-sm mt-0.5 leading-tight">{title || '(título vacío)'}</p>
                        <p className="text-gray-500 text-xs mt-1 leading-relaxed">{body || '(mensaje vacío)'}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white px-4 py-3 h-20">
                    <div className="h-2 bg-gray-100 rounded-full w-3/4 mb-2" />
                    <div className="h-2 bg-gray-100 rounded-full w-1/2" />
                  </div>
                </div>
              </div>
            )}

            {/* Desktop toast */}
            {previewType === 'desktop' && (
              <div className="max-w-md mx-auto">
                <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 bg-[#D98C21] rounded-full flex items-center justify-center flex-shrink-0">
                      <Bell className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-gray-700 font-semibold text-sm">reKalcula</p>
                        <span className="text-gray-300 text-xs cursor-pointer hover:text-gray-500">✕</span>
                      </div>
                      <p className="text-gray-900 font-medium text-sm mt-1">{title || '(título vacío)'}</p>
                      <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">{body || '(mensaje vacío)'}</p>
                    </div>
                  </div>
                  {url && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-[#D98C21] text-xs font-medium">Abrir en: {url}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Email preview */}
            {previewType === 'email' && (
              <div className="max-w-lg mx-auto">
                <div className="bg-[#1a1a1a] rounded-t-xl border border-gray-600 px-4 py-3">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex gap-3">
                      <span className="text-gray-500 text-xs w-10 flex-shrink-0">De:</span>
                      <span className="text-gray-300 text-xs">noreply@rekalcula.com</span>
                    </div>
                    <div className="flex gap-3">
                      <span className="text-gray-500 text-xs w-10 flex-shrink-0">Para:</span>
                      <span className="text-gray-300 text-xs">tu@correo.com</span>
                    </div>
                    <div className="flex gap-3">
                      <span className="text-gray-500 text-xs w-10 flex-shrink-0">Asunto:</span>
                      <span className="text-white text-xs font-semibold">{title || '(título vacío)'}</span>
                    </div>
                  </div>
                </div>
                <div className="bg-[#f0f0f0] border border-gray-600 border-t-0 rounded-b-xl p-4">
                  <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="bg-[#262626] px-6 py-4 text-center">
                      <p className="text-[#d98c21] font-bold text-base">reKalcula</p>
                    </div>
                    <div className="p-6 text-center">
                      <div className="w-12 h-12 bg-[#d98c21] rounded-xl mx-auto mb-4 flex items-center justify-center">
                        <Bell className="w-6 h-6 text-white" />
                      </div>
                      <p className="text-gray-900 font-semibold text-sm mb-2">{title || '(título vacío)'}</p>
                      <p className="text-gray-500 text-xs leading-relaxed mb-5">{body || '(mensaje vacío)'}</p>
                      <div className="inline-block bg-[#d98c21] text-white text-xs font-semibold px-5 py-2 rounded-lg">
                        Ver en reKalcula
                      </div>
                    </div>
                    <div className="bg-[#f7f7f7] px-6 py-3 border-t border-gray-100">
                      <p className="text-gray-400 text-xs text-center">
                        Recibiste este correo porque tienes las notificaciones por email activadas.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="bg-[#1a1a1a] rounded-lg border border-gray-700 p-8 text-center">
            <Bell className="w-8 h-8 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Escribe título y mensaje para ver la previsualización</p>
          </div>
        )}
      </div>

      {/* ============================================================
          SECCIÓN 3: Historial
          ============================================================ */}
      {history.length > 0 && (
        <div className="bg-[#262626] rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#D98C21]" />
              Historial de envíos
            </h3>
            <button
              onClick={() => setHistory([])}
              className="text-gray-500 hover:text-red-400 transition p-1"
              title="Limpiar historial"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            {history.map(item => (
              <div key={item.id} className="bg-[#333] rounded-lg p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-white text-sm font-medium truncate">{item.title}</p>
                    <p className="text-gray-400 text-xs mt-0.5 truncate">{item.body}</p>
                  </div>
                  <p className="text-gray-600 text-xs flex-shrink-0">{item.sentAt}</p>
                </div>

                {/* Badges: push / email / target */}
                <div className="flex gap-2 flex-wrap">
                  <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full ${
                    item.push.success ? 'bg-green-500/20 text-green-400' : 'bg-gray-600/50 text-gray-400'
                  }`}>
                    <Smartphone className="w-3 h-3" />
                    {item.push.success
                      ? (item.push.targeted
                          ? `${item.push.sent} disp. · ${item.push.notified}/${item.push.targeted} usu.`
                          : `${item.push.sent} disp.`)
                      : (item.push.noDevices ? 'Sin dispositivos' : 'Push fallido')}
                  </span>

                  <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full ${
                    item.email.success ? 'bg-green-500/20 text-green-400' : 'bg-gray-600/50 text-gray-400'
                  }`}>
                    <Mail className="w-3 h-3" />
                    {item.email.success
                      ? (item.email.to || 'Email enviado')
                      : (item.email.error || 'Email fallido')}
                  </span>

                  {/* Badge de destino cuando no es 'self' */}
                  {item.target !== 'self' && (
                    <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-[#D98C21]/20 text-[#D98C21]">
                      <Users className="w-3 h-3" />
                      {item.target === 'all' ? 'Todos' : `${item.targetedUsers} usu.`}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}