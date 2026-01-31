'use client'

// ============================================================
// COMPONENTE: NotificationsLab
// Ubicación: components/admin/NotificationsLab.tsx
// Laboratorio de notificaciones push + email para panel admin
// ============================================================

import { useState } from 'react'
import { Bell, Send, Clock, CheckCircle, XCircle, Loader2, Trash2, Smartphone, Monitor, Mail } from 'lucide-react'

interface PushStatus {
  success: boolean
  sent: number
  failed: number
  noDevices: boolean
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
}

export default function NotificationsLab() {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [url, setUrl] = useState('/dashboard')
  const [isSending, setIsSending] = useState(false)
  const [history, setHistory] = useState<SentNotification[]>([])
  const [lastResult, setLastResult] = useState<{ push: PushStatus; email: EmailStatus } | null>(null)
  const [previewType, setPreviewType] = useState<'mobile' | 'desktop' | 'email'>('mobile')

  const sendNotification = async () => {
    if (!title || !body) return

    setIsSending(true)
    setLastResult(null)

    try {
      const response = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body, url })
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
          email: data.email || { success: false, to: null, error: 'Sin datos' }
        }

        setHistory(prev => [entry, ...prev])
        setLastResult({ push: entry.push, email: entry.email })
      } else {
        setLastResult({
          push: { success: false, sent: 0, failed: 0, noDevices: true },
          email: { success: false, to: null, error: data.error || 'Error al enviar' }
        })
      }
    } catch (err) {
      setLastResult({
        push: { success: false, sent: 0, failed: 0, noDevices: true },
        email: { success: false, to: null, error: 'Error de conexión' }
      })
    } finally {
      setIsSending(false)
    }
  }

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
        </div>

        {/* Botón enviar */}
        <div className="mt-6">
          <button
            onClick={sendNotification}
            disabled={isSending || !title || !body}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[#D98C21] text-black rounded-lg font-medium hover:bg-[#c47d1d] disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {isSending ? 'Enviando...' : 'Enviar notificación'}
          </button>
        </div>

        {/* Resultado: push + email en cards separadas */}
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
                    ? `${lastResult.push.sent} dispositivo${lastResult.push.sent !== 1 ? 's' : ''}`
                    : lastResult.push.noDevices ? 'Sin dispositivos' : 'Error'}
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
                    ? lastResult.email.to || 'Enviado'
                    : lastResult.email.error || 'Error'}
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
          {/* Toggle: móvil / web / email */}
          <div className="flex bg-[#333] rounded-lg p-1 gap-1">
            <button
              onClick={() => setPreviewType('mobile')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition ${
                previewType === 'mobile' ? 'bg-[#D98C21] text-black font-medium' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              Móvil
            </button>
            <button
              onClick={() => setPreviewType('desktop')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition ${
                previewType === 'desktop' ? 'bg-[#D98C21] text-black font-medium' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              Web
            </button>
            <button
              onClick={() => setPreviewType('email')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition ${
                previewType === 'email' ? 'bg-[#D98C21] text-black font-medium' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              Email
            </button>
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
                {/* Barra de cliente email simulada */}
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
                {/* Cuerpo del email */}
                <div className="bg-[#f0f0f0] border border-gray-600 border-t-0 rounded-b-xl p-4">
                  <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    {/* Header */}
                    <div className="bg-[#262626] px-6 py-4 text-center">
                      <p className="text-[#d98c21] font-bold text-base">reKalcula</p>
                    </div>
                    {/* Body */}
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
                    {/* Footer */}
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
                {/* Push + Email badges */}
                <div className="flex gap-2 flex-wrap">
                  <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full ${
                    item.push.success ? 'bg-green-500/20 text-green-400' : 'bg-gray-600/50 text-gray-400'
                  }`}>
                    <Smartphone className="w-3 h-3" />
                    {item.push.success ? `${item.push.sent} disp.` : (item.push.noDevices ? 'Sin dispositivos' : 'Push fallido')}
                  </span>
                  <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full ${
                    item.email.success ? 'bg-green-500/20 text-green-400' : 'bg-gray-600/50 text-gray-400'
                  }`}>
                    <Mail className="w-3 h-3" />
                    {item.email.success ? (item.email.to || 'Email enviado') : (item.email.error || 'Email fallido')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
