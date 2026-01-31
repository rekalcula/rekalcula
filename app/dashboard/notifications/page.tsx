
'use client'

// ============================================================
// PÁGINA: Notificaciones - app/dashboard/notifications/page.tsx
// ============================================================

import { useState, useEffect } from 'react'
import { Bell, BellOff, CheckCircle, Loader2, Save, Mail } from 'lucide-react'
import { PushNotificationManager } from '@/components/PushNotificationManager'

// Tipos de notificaciones disponibles
const NOTIFICATION_TYPES = [
  {
    id: 'alertas_productos',
    category: 'Análisis de Negocio',
    title: 'Alertas de productos',
    description: 'Productos que requieren atención: declive en ventas, oportunidades de mejora, etc.',
    defaultEnabled: true
  },
  {
    id: 'oportunidades_precio',
    category: 'Análisis de Negocio',
    title: 'Oportunidades de precio',
    description: 'Sugerencias para ajustar precios y mejorar rentabilidad.',
    defaultEnabled: true
  },
  {
    id: 'productos_estrella',
    category: 'Análisis de Negocio',
    title: 'Productos estrella',
    description: 'Notificaciones sobre productos con alto rendimiento.',
    defaultEnabled: true
  },
  {
    id: 'alertas_tesoreria',
    category: 'Finanzas',
    title: 'Alertas de tesorería',
    description: 'Avisos sobre posibles problemas de liquidez o flujo de caja.',
    defaultEnabled: true
  },
  {
    id: 'facturas_pendientes',
    category: 'Finanzas',
    title: 'Facturas pendientes',
    description: 'Recordatorios de facturas por pagar o cobrar.',
    defaultEnabled: true
  },
  {
    id: 'recordatorios_fiscales',
    category: 'Fiscal',
    title: 'Recordatorios fiscales',
    description: 'Fechas importantes de declaraciones e impuestos.',
    defaultEnabled: true
  },
  {
    id: 'iva_trimestral',
    category: 'Fiscal',
    title: 'IVA trimestral',
    description: 'Recordatorio antes del vencimiento del IVA trimestral.',
    defaultEnabled: true
  },
  {
    id: 'resumen_semanal',
    category: 'Resúmenes',
    title: 'Resumen semanal',
    description: 'Resumen de la actividad de tu negocio cada semana.',
    defaultEnabled: true
  },
  {
    id: 'resumen_mensual',
    category: 'Resúmenes',
    title: 'Resumen mensual',
    description: 'Informe mensual con métricas clave de tu negocio.',
    defaultEnabled: true
  }
]

// Agrupar por categoría
const groupByCategory = (notifications: typeof NOTIFICATION_TYPES) => {
  return notifications.reduce((acc, notif) => {
    if (!acc[notif.category]) {
      acc[notif.category] = []
    }
    acc[notif.category].push(notif)
    return acc
  }, {} as Record<string, typeof NOTIFICATION_TYPES>)
}

export default function NotificationsPage() {
  const [pushEnabled, setPushEnabled] = useState(false)
  const [emailEnabled, setEmailEnabled] = useState(true)
  const [preferences, setPreferences] = useState<Record<string, boolean>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)

  // Cargar preferencias guardadas o usar defaults
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const response = await fetch('/api/notifications/preferences')
        if (response.ok) {
          const data = await response.json()
          if (data.preferences) {
            // Extraer emailEnabled separadamente
            const { emailEnabled: savedEmailEnabled, ...notifPrefs } = data.preferences
            setPreferences(notifPrefs)
            if (typeof savedEmailEnabled === 'boolean') {
              setEmailEnabled(savedEmailEnabled)
            }
            return
          }
        }
      } catch (error) {
        console.log('Usando preferencias por defecto')
      }

      // Usar defaults si no hay preferencias guardadas
      const defaults: Record<string, boolean> = {}
      NOTIFICATION_TYPES.forEach(n => {
        defaults[n.id] = n.defaultEnabled
      })
      setPreferences(defaults)
    }

    loadPreferences()
  }, [])

  // Toggle individual
  const toggleNotification = (id: string) => {
    setPreferences(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
    setSaveMessage(null)
  }

  // Seleccionar/Deseleccionar todas
  const toggleAll = (enabled: boolean) => {
    const newPrefs: Record<string, boolean> = {}
    NOTIFICATION_TYPES.forEach(n => {
      newPrefs[n.id] = enabled
    })
    setPreferences(newPrefs)
    setSaveMessage(null)
  }

  // Guardar preferencias (incluye emailEnabled)
  const savePreferences = async () => {
    setIsSaving(true)
    setSaveMessage(null)

    try {
      const response = await fetch('/api/notifications/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preferences: {
            ...preferences,
            emailEnabled
          }
        })
      })

      if (response.ok) {
        setSaveMessage('Preferencias guardadas correctamente')
      } else {
        setSaveMessage('Error al guardar preferencias')
      }
    } catch (error) {
      setSaveMessage('Error al guardar preferencias')
    } finally {
      setIsSaving(false)
    }
  }

  const groupedNotifications = groupByCategory(NOTIFICATION_TYPES)
  const enabledCount = Object.values(preferences).filter(Boolean).length
  const allEnabled = enabledCount === NOTIFICATION_TYPES.length
  const noneEnabled = enabledCount === 0

  return (
    <div className="min-h-screen bg-[#262626]">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Bell className="w-8 h-8 text-[#d98c21]" />
          <div>
            <h1 className="text-2xl font-bold text-[#d98c21]">Notificaciones</h1>
            <p className="text-gray-400 text-sm">Configura qué alertas quieres recibir</p>
          </div>
        </div>

        {/* ============================================================
            Activar Push Notifications
            ============================================================ */}
        <div className="bg-[#1a1a1a] rounded-xl p-6 mb-4 border border-gray-700">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-full ${pushEnabled ? 'bg-green-500/20' : 'bg-gray-700'}`}>
              {pushEnabled ? (
                <Bell className="w-6 h-6 text-green-400" />
              ) : (
                <BellOff className="w-6 h-6 text-gray-400" />
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-white mb-1">
                Notificaciones Push
              </h2>
              <p className="text-gray-400 text-sm mb-4">
                Recibe alertas en tu dispositivo, incluso cuando no estés usando la aplicación.
              </p>
              <PushNotificationManager
                onStatusChange={setPushEnabled}
                className="mt-2"
              />
            </div>
          </div>
        </div>

        {/* ============================================================
            Notificaciones por Email — NUEVO
            ============================================================ */}
        <div className="bg-[#1a1a1a] rounded-xl p-6 mb-6 border border-gray-700">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-full ${emailEnabled ? 'bg-blue-500/20' : 'bg-gray-700'}`}>
              <Mail className={`w-6 h-6 ${emailEnabled ? 'text-blue-400' : 'text-gray-400'}`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-white mb-1">
                    Notificaciones por Email
                  </h2>
                  <p className="text-gray-400 text-sm">
                    Recibe las mismas alertas por correo electrónico en la dirección con la que te registraste.
                  </p>
                </div>
                {/* Toggle switch */}
                <button
                  onClick={() => { setEmailEnabled(!emailEnabled); setSaveMessage(null) }}
                  className={`relative w-14 h-8 rounded-full transition-colors duration-300 flex-shrink-0 ${
                    emailEnabled
                      ? 'bg-gradient-to-r from-[#d98c21] to-[#f5a623]'
                      : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`absolute top-1/2 -translate-y-1/2 w-7 h-7 bg-white rounded-full shadow-lg transition-all duration-300 ${
                      emailEnabled ? 'left-7' : 'left-0.5'
                    }`}
                    style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.3)' }}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================
            Tipos de Notificaciones
            ============================================================ */}
        <div className="bg-[#1a1a1a] rounded-xl border border-gray-700 overflow-hidden">
          {/* Header con acciones */}
          <div className="px-6 py-4 border-b border-gray-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Tipos de notificaciones</h2>
              <p className="text-gray-400 text-sm">
                {enabledCount} de {NOTIFICATION_TYPES.length} activadas
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => toggleAll(true)}
                disabled={allEnabled}
                className="px-3 py-1.5 text-xs bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Seleccionar todas
              </button>
              <button
                onClick={() => toggleAll(false)}
                disabled={noneEnabled}
                className="px-3 py-1.5 text-xs bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Deseleccionar todas
              </button>
            </div>
          </div>

          {/* Lista de notificaciones por categoría */}
          <div className="divide-y divide-gray-700">
            {Object.entries(groupedNotifications).map(([category, notifications]) => (
              <div key={category}>
                <div className="px-6 py-3 bg-[#262626]">
                  <h3 className="text-sm font-medium text-[#d98c21]">{category}</h3>
                </div>

                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className="px-6 py-4 flex items-center justify-between hover:bg-[#262626] transition-colors"
                  >
                    <div className="flex-1 pr-4">
                      <h4 className="text-white font-medium">{notif.title}</h4>
                      <p className="text-gray-400 text-sm">{notif.description}</p>
                    </div>

                    {/* Toggle switch */}
                    <button
                      onClick={() => toggleNotification(notif.id)}
                      className={`relative w-14 h-8 rounded-full transition-colors duration-300 flex-shrink-0 ${
                        preferences[notif.id]
                          ? 'bg-gradient-to-r from-[#d98c21] to-[#f5a623]'
                          : 'bg-gray-600'
                      }`}
                    >
                      <span
                        className={`absolute top-1/2 -translate-y-1/2 w-7 h-7 bg-white rounded-full shadow-lg transition-all duration-300 ${
                          preferences[notif.id] ? 'left-7' : 'left-0.5'
                        }`}
                        style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)' }}
                      />
                    </button>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Footer con botón guardar */}
          <div className="px-6 py-4 border-t border-gray-700 flex items-center justify-between bg-[#262626]">
            {saveMessage && (
              <div className={`flex items-center gap-2 text-sm ${
                saveMessage.includes('Error') ? 'text-red-400' : 'text-green-400'
              }`}>
                {!saveMessage.includes('Error') && <CheckCircle className="w-4 h-4" />}
                {saveMessage}
              </div>
            )}
            <div className="flex-1" />
            <button
              onClick={savePreferences}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-[#d98c21] text-white rounded-lg hover:bg-[#c17a1a] disabled:opacity-50 transition-colors"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Guardar preferencias
            </button>
          </div>
        </div>

        {/* Nota informativa */}
        <div className="mt-6 p-4 bg-[#1a1a1a] rounded-lg border border-gray-700">
          <p className="text-gray-400 text-sm">
            <strong className="text-[#d98c21]">Nota:</strong> Las notificaciones push requieren
            que actives el permiso en tu navegador. Los emails se envían a la dirección de correo
            con la que te registraste en tu cuenta.
          </p>
        </div>
      </div>
    </div>
  )
}
