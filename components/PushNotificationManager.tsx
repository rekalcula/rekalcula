
'use client'

// ============================================================
// COMPONENTE: PushNotificationManager
// Ubicación: components/PushNotificationManager.tsx
// ============================================================

import { useState, useEffect, useCallback } from 'react'
import { Bell, BellOff, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { getFCMToken, onForegroundMessage } from '@/lib/firebase'

interface PushNotificationManagerProps {
  onStatusChange?: (enabled: boolean) => void
  showButton?: boolean
  className?: string
}

export function PushNotificationManager({ 
  onStatusChange, 
  showButton = true,
  className = '' 
}: PushNotificationManagerProps) {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [testSuccess, setTestSuccess] = useState(false)
  const [isTestSending, setIsTestSending] = useState(false)

  // ============================================================
  // Verificar estado inicial
  // ============================================================
  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setIsLoading(false)
      return
    }

    setPermission(Notification.permission)

    const checkSubscription = async () => {
      try {
        const response = await fetch('/api/notifications/test', { method: 'GET' })
        const data = await response.json()
        
        if (data.success && data.notificationsEnabled) {
          setIsSubscribed(true)
          onStatusChange?.(true)
        }
      } catch (error) {
        console.log('[Push] Error verificando suscripción')
      } finally {
        setIsLoading(false)
      }
    }

    checkSubscription()

    onForegroundMessage((payload) => {
      console.log('[Push] Mensaje en primer plano:', payload)
      if (Notification.permission === 'granted') {
        new Notification(payload.notification?.title || 'ReKalcula', {
          body: payload.notification?.body,
          icon: '/icons/icon-192x192.svg'
        })
      }
    })
  }, [onStatusChange])

  // ============================================================
  // Solicitar permiso y suscribir
  // ============================================================
  const subscribeToPush = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const token = await getFCMToken()
      
      if (!token) {
        setError('No se pudo obtener el token de notificaciones')
        setIsLoading(false)
        return
      }

      const response = await fetch('/api/notifications/register-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: token,
          deviceType: detectDeviceType(),
          deviceName: detectDeviceName()
        })
      })

      if (!response.ok) {
        throw new Error('Error al registrar en el servidor')
      }

      setPermission('granted')
      setIsSubscribed(true)
      onStatusChange?.(true)
      console.log('[Push] Suscripción completada')

    } catch (err: any) {
      console.error('[Push] Error:', err)
      setError(err.message || 'Error al activar notificaciones')
    } finally {
      setIsLoading(false)
    }
  }, [onStatusChange])

  // ============================================================
  // Desuscribir
  // ============================================================
  const unsubscribeFromPush = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const token = await getFCMToken()
      
      if (token) {
        await fetch('/api/notifications/register-token', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        })
      }

      setIsSubscribed(false)
      onStatusChange?.(false)
      console.log('[Push] Desuscripción completada')

    } catch (err: any) {
      console.error('[Push] Error al desuscribir:', err)
      setError('Error al desactivar notificaciones')
    } finally {
      setIsLoading(false)
    }
  }, [onStatusChange])

  // ============================================================
  // Enviar notificación de prueba — CORREGIDO
  // Ahora muestra confirmación visual en todos los dispositivos
  // ============================================================
  const sendTestNotification = useCallback(async () => {
    setError(null)
    setTestSuccess(false)
    setIsTestSending(true)
    try {
      const response = await fetch('/api/notifications/test', {
        method: 'POST'
      })
      const data = await response.json()
      
      if (data.success) {
        setTestSuccess(true)
        setTimeout(() => setTestSuccess(false), 4000)
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError('Error al enviar prueba')
    } finally {
      setIsTestSending(false)
    }
  }, [])

  // ============================================================
  // Render
  // ============================================================
  if (!showButton) {
    return null
  }

  if (isLoading && !isSubscribed) {
    return (
      <div className={`flex items-center gap-2 text-sm text-gray-500 ${className}`}>
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Verificando...</span>
      </div>
    )
  }

  if (typeof window !== 'undefined' && (!('Notification' in window) || !('serviceWorker' in navigator))) {
    return (
      <div className={`flex items-center gap-2 text-sm text-gray-500 ${className}`}>
        <BellOff className="w-4 h-4" />
        <span>Notificaciones no soportadas en este navegador</span>
      </div>
    )
  }

  if (permission === 'denied') {
    return (
      <div className={`flex items-center gap-2 text-sm text-red-500 ${className}`}>
        <XCircle className="w-4 h-4" />
        <span>Notificaciones bloqueadas en el navegador</span>
      </div>
    )
  }

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
      
      <div className="flex items-center gap-3 flex-wrap">
        {isSubscribed ? (
          <>
            <button
              onClick={unsubscribeFromPush}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              <span>Notificaciones activas</span>
            </button>
            
            <button
              onClick={sendTestNotification}
              disabled={isTestSending}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors disabled:opacity-50"
            >
              {isTestSending && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{isTestSending ? 'Enviando...' : 'Enviar prueba'}</span>
            </button>
          </>
        ) : (
          <button
            onClick={subscribeToPush}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Bell className="w-4 h-4" />
            )}
            <span>Activar notificaciones</span>
          </button>
        )}
      </div>

      {/* Confirmación visual — visible en todos los dispositivos incluyendo smartphone */}
      {testSuccess && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-green-500/20 border border-green-500/30 text-green-400 rounded-lg text-sm">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>¡Prueba enviada correctamente! Revisa tus notificaciones.</span>
        </div>
      )}
    </div>
  )
}

// ============================================================
// Utilidades
// ============================================================

function detectDeviceType(): string {
  const ua = navigator.userAgent
  if (/android/i.test(ua)) return 'android'
  if (/iPad|iPhone|iPod/.test(ua)) return 'ios'
  if (/mobile/i.test(ua)) return 'mobile'
  return 'web'
}

function detectDeviceName(): string {
  const ua = navigator.userAgent
  
  const androidMatch = ua.match(/Android.*;\s*([^;)]+)/i)
  if (androidMatch) return androidMatch[1].trim()
  
  if (/iPad/.test(ua)) return 'iPad'
  if (/iPhone/.test(ua)) return 'iPhone'
  
  if (/Chrome/i.test(ua)) return 'Chrome'
  if (/Firefox/i.test(ua)) return 'Firefox'
  if (/Safari/i.test(ua)) return 'Safari'
  if (/Edge/i.test(ua)) return 'Edge'
  
  return 'Navegador'
}

export default PushNotificationManager
