

// ============================================================
// COMPONENTE: NotificationsLab
// Ubicación: components/admin/NotificationsLab.tsx
// Laboratorio de notificaciones push para el panel admin
// ============================================================

import { useState } from 'react'
import { Bell, Send, Clock, CheckCircle, XCircle, Loader2, Trash2, Smartphone, Monitor } from 'lucide-react'

interface SentNotification {
  id: number
  title: string
  body: string
  url: string
  sentAt: string
  success: boolean
  devices: number
  error?: string
}

export default function NotificationsLab() {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [url, setUrl] = useState('/dashboard')
  const [isSending, setIsSending] = useState(false)
  const [history, setHistory] = useState<SentNotification[]>([])
  const [lastResult, setLastResult] = useState<{ success: boolean; message: string } | null>(null)
  const [previewType, setPreviewType] = useState<'mobile' | 'desktop'>('mobile')

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

      const entry: SentNotification = {
        id: Date.now(),
        title,
        body,
        url,
        sentAt: new Date().toLocaleTimeString('es-ES'),
        success: data.success,
        devices: data.sent || 0,
        error: data.error
      }

      setHistory(prev => [entry, ...prev])

      if (data.success) {
        setLastResult({ 
          success: true, 
          message: `Enviada a ${data.sent} dispositivo${data.sent !== 1 ? 's' : ''}` 
        })
      } else {
        setLastResult({ success: false, message: data.error || 'Error al enviar' })
      }
    } catch (err) {
      setLastResult({ success: false, message: 'Error de conexión' })
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* ============================================================
          SECCIÓN 1: Formulario de composición
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

        {/* Botón enviar + resultado inline */}
        <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-3">
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

          {lastResult && (
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm ${
              lastResult.success 
                ? 'bg-green-500/20 text-green-400' 
                : 'bg-red-500/20 text-red-400'
            }`}>
              {lastResult.success 
                ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> 
                : <XCircle className="w-4 h-4 flex-shrink-0" />
              }
              {lastResult.message}
            </div>
          )}
        </div>
      </div>

      {/* ============================================================
          SECCIÓN 2: Previsualización
          ============================================================ */}
      <div className="bg-[#262626] rounded-xl p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Previsualización</h3>
          {/* Toggle móvil / web */}
          <div className="flex bg-[#333] rounded-lg p-1 gap-1">
            <button
              onClick={() => setPreviewType('mobile')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs transition ${
                previewType === 'mobile' 
                  ? 'bg-[#D98C21] text-black font-medium' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              Móvil
            </button>
            <button
              onClick={() => setPreviewType('desktop')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs transition ${
                previewType === 'desktop' 
                  ? 'bg-[#D98C21] text-black font-medium' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              Web
            </button>
          </div>
        </div>

        {title || body ? (
          previewType === 'mobile' ? (
            /* Previsualización estilo Android */
            <div className="max-w-sm mx-auto">
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
                {/* Status bar simulado */}
                <div className="bg-[#111] px-4 py-2 flex justify-between items-center">
                  <span className="text-white text-xs font-medium">9:41</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-white text-xs opacity-60">●●●</span>
                    <div className="w-5 h-2.5 border border-white rounded-sm relative opacity-80">
                      <div className="absolute inset-0.5 bg-white rounded-sm" style={{ width: '70%' }} />
                    </div>
                  </div>
                </div>
                {/* Card de notificación */}
                <div className="m-3 bg-gray-50 rounded-xl p-4 shadow-sm border border-gray-100">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-[#D98C21] rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
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
                {/* Fondo de app simulado */}
                <div className="bg-white px-4 py-3 h-20">
                  <div className="h-2 bg-gray-100 rounded-full w-3/4 mb-2" />
                  <div className="h-2 bg-gray-100 rounded-full w-1/2" />
                </div>
              </div>
            </div>
          ) : (
            /* Previsualización estilo desktop toast */
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
          )
        ) : (
          <div className="bg-[#1a1a1a] rounded-lg border border-gray-700 p-8 text-center">
            <Bell className="w-8 h-8 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">
              Escribe título y mensaje para ver la previsualización
            </p>
          </div>
        )}
      </div>

      {/* ============================================================
          SECCIÓN 3: Historial de envíos
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

          <div className="space-y-2">
            {history.map(item => (
              <div key={item.id} className="bg-[#333] rounded-lg p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-white text-sm font-medium truncate">{item.title}</p>
                    <p className="text-gray-400 text-xs mt-0.5 truncate">{item.body}</p>
                  </div>
                  <div className={`flex-shrink-0 flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full whitespace-nowrap ${
                    item.success ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {item.success 
                      ? <CheckCircle className="w-3 h-3" /> 
                      : <XCircle className="w-3 h-3" />
                    }
                    {item.success 
                      ? `${item.devices} disp.` 
                      : (item.error || 'Error')
                    }
                  </div>
                </div>
                <p className="text-gray-600 text-xs mt-2">{item.sentAt} · URL: {item.url}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
