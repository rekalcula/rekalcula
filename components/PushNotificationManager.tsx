'use client'

// ============================================================
// COMPONENTE: PushNotificationManager
// Ubicación: components/PushNotificationManager.tsx
// ============================================================

import { useState, useEffect, useCallback } from 'react'
import { Bell, BellOff, CheckCircle, XCircle, Loader2 } from 'lucide-react'

// VAPID Key pública de Firebase (necesitas generarla en Firebase Console)
// Firebase Console > Configuración del proyecto > Cloud Messaging > Certificados push web
const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || ''

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
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null)

  // ============================================================
  // Verificar estado inicial
  // ============================================================
  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return
    }

    setPermission(Notification.permission)

    // Registrar Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('[Push] Service Worker registrado')
          setSwRegistration(registration)
          
          // Verificar si ya está suscrito
          registration.pushManager.getSubscription()
            .then((subscription) => {
              const isActive = subscription !== null
              setIsSubscribed(isActive)
              onStatusChange?.(isActive)
            })
        })
        .catch((err) => {
          console.error('[Push] Error registrando SW:', err)
        })
    }
  }, [onStatusChange])

  // ============================================================
  // Solicitar permiso y suscribir
  // ============================================================
  const subscribeToPush = useCallback(async () => {
    if (!swRegistration) {
      setError('Service Worker no disponible')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // 1. Solicitar permiso
      const permissionResult = await Notification.requestPermission()
      setPermission(permissionResult)

      if (permissionResult !== 'granted') {
        setError('Permiso de notificaciones denegado')
        setIsLoading(false)
        return
      }

    // 2. Suscribirse a Push
    const subscription = await swRegistration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_KEY) as BufferSource
    })

      // 3. Enviar token al servidor
      const token = JSON.stringify(subscription)
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

      setIsSubscribed(true)
      onStatusChange?.(true)
      console.log('[Push] Suscripción completada')

    } catch (err: any) {
      console.error('[Push] Error:', err)
      setError(err.message || 'Error al activar notificaciones')
    } finally {
      setIsLoading(false)
    }
  }, [swRegistration, onStatusChange])

  // ============================================================
  // Desuscribir
  // ============================================================
  const unsubscribeFromPush = useCallback(async () => {
    if (!swRegistration) return

    setIsLoading(true)

    try {
      const subscription = await swRegistration.pushManager.getSubscription()
      
      if (subscription) {
        // Notificar al servidor
        await fetch('/api/notifications/register-token', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: JSON.stringify(subscription) })
        })

        await subscription.unsubscribe()
      }

      setIsSubscribed(false)
      onStatusChange?.(false)
      console.log('[Push] Desuscripción completada')

    } catch (err: any) {
      console.error('[Push] Error al desuscribir:', err)
    } finally {
      setIsLoading(false)
    }
  }, [swRegistration, onStatusChange])

  // ============================================================
  // Enviar notificación de prueba
  // ============================================================
  const sendTestNotification = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications/test', {
        method: 'POST'
      })
      const data = await response.json()
      
      if (!data.success) {
        setError(data.error)
      }
    } catch (err) {
      setError('Error al enviar prueba')
    }
  }, [])

  // ============================================================
  // Render
  // ============================================================
  if (!showButton) {
    return null
  }

  // No soportado
  if (typeof window === 'undefined' || !('Notification' in window) || !('serviceWorker' in navigator)) {
    return (
      <div className={`flex items-center gap-2 text-sm text-gray-500 ${className}`}>
        <BellOff className="w-4 h-4" />
        <span>Notificaciones no soportadas</span>
      </div>
    )
  }

  // Permiso denegado permanentemente
  if (permission === 'denied') {
    return (
      <div className={`flex items-center gap-2 text-sm text-red-500 ${className}`}>
        <XCircle className="w-4 h-4" />
        <span>Notificaciones bloqueadas en el navegador</span>
      </div>
    )
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
      
      <div className="flex items-center gap-3">
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
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Enviar prueba
            </button>
          </>
        ) : (
          <button
            onClick={subscribeToPush}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
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
    </div>
  )
}

// ============================================================
// Utilidades
// ============================================================

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

function detectDeviceType(): string {
  const ua = navigator.userAgent
  if (/android/i.test(ua)) return 'android'
  if (/iPad|iPhone|iPod/.test(ua)) return 'ios'
  if (/mobile/i.test(ua)) return 'mobile'
  return 'web'
}

function detectDeviceName(): string {
  const ua = navigator.userAgent
  
  // Android
  const androidMatch = ua.match(/Android.*;\s*([^;)]+)/i)
  if (androidMatch) return androidMatch[1].trim()
  
  // iOS
  if (/iPad/.test(ua)) return 'iPad'
  if (/iPhone/.test(ua)) return 'iPhone'
  
  // Desktop browsers
  if (/Chrome/i.test(ua)) return 'Chrome'
  if (/Firefox/i.test(ua)) return 'Firefox'
  if (/Safari/i.test(ua)) return 'Safari'
  if (/Edge/i.test(ua)) return 'Edge'
  
  return 'Navegador'
}

export default PushNotificationManager