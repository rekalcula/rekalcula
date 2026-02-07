'use client'

// ============================================================
// COMPONENTE: PushNotificationManager
// Ubicación: components/PushNotificationManager.tsx
// VERSIÓN MEJORADA: Incluye aviso para notificaciones flotantes en Android
// + POPUP PERSONALIZADO PREVIO
// ============================================================

import { useState, useEffect, useCallback } from 'react'
import { Bell, BellOff, CheckCircle, XCircle, Loader2, Info, Smartphone } from 'lucide-react'
import { getFCMToken, onForegroundMessage } from '@/lib/firebase'
import NotificationPermissionDialog from './NotificationPermissionDialog'

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
  const [isAndroid, setIsAndroid] = useState(false)
  const [showAndroidTip, setShowAndroidTip] = useState(false)
  const [justActivated, setJustActivated] = useState(false)
  
  // ============================================================
  // NUEVO: Estado para popup personalizado
  // ============================================================
  const [showPermissionDialog, setShowPermissionDialog] = useState(false)

  // ============================================================
  // Detectar Android
  // ============================================================
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const ua = navigator.userAgent
      setIsAndroid(/android/i.test(ua))
    }
  }, [])

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
          icon: '/icons/icon-192x192.png'
        })
      }
    })
  }, [onStatusChange])

  // ============================================================
  // NUEVO: Función para mostrar popup personalizado
  // ============================================================
  const handleActivateNotifications = useCallback(() => {
    setError(null)
    setShowPermissionDialog(true)
  }, [])

  // ============================================================
  // MODIFICADO: Función que se ejecuta tras aceptar popup personalizado
  // ============================================================
  const handleConfirmPermission = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    setShowAndroidTip(false)

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
      setJustActivated(true)
      onStatusChange?.(true)
      
      // Mostrar tip de Android si es dispositivo Android
      if (isAndroid) {
        setShowAndroidTip(true)
      }
      
      console.log('[Push] Suscripción completada')

    } catch (err: any) {
      console.error('[Push] Error:', err)
      setError(err.message || 'Error al activar notificaciones')
    } finally {
      setIsLoading(false)
    }
  }, [onStatusChange, isAndroid])

  // ============================================================
  // NUEVO: Función para cancelar popup personalizado
  // ============================================================
  const handleCancelPermission = useCallback(() => {
    setShowPermissionDialog(false)
  }, [])

  // ============================================================
  // Desuscribir (sin cambios)
  // ============================================================
  const unsubscribeFromPush = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    setShowAndroidTip(false)

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
      setJustActivated(false)
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
  // Enviar notificación de prueba (sin cambios)
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
  // Cerrar tip de Android (sin cambios)
  // ============================================================
  const dismissAndroidTip = () => {
    setShowAndroidTip(false)
  }

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
    <>
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
              onClick={handleActivateNotifications}
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

        {/* Confirmación visual de prueba enviada */}
        {testSuccess && (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-green-500/20 border border-green-500/30 text-green-400 rounded-lg text-sm">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span>¡Prueba enviada correctamente! Revisa tus notificaciones.</span>
          </div>
        )}

        {/* ============================================================ */}
        {/* AVISO PARA ANDROID: Notificaciones flotantes */}
        {/* ============================================================ */}
        {isAndroid && showAndroidTip && justActivated && (
          <div className="relative flex flex-col gap-2 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg text-sm">
            {/* Botón cerrar */}
            <button 
              onClick={dismissAndroidTip}
              className="absolute top-2 right-2 text-blue-400 hover:text-blue-300 p-1"
              aria-label="Cerrar"
            >
              <XCircle className="w-4 h-4" />
            </button>
            
            <div className="flex items-start gap-3 pr-6">
              <Smartphone className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="flex flex-col gap-2">
                <p className="text-blue-300 font-medium">
                  ✅ ¡Notificaciones activadas!
                </p>
                <p className="text-blue-200/80">
                  Para ver las notificaciones como burbujas flotantes en tu pantalla, activa las <strong>notificaciones flotantes</strong> en la configuración de Chrome:
                </p>
                <ol className="text-blue-200/70 text-xs space-y-1 list-decimal list-inside">
                  <li>Abre <strong>Ajustes de Chrome</strong> (toca ⋮ → Configuración)</li>
                  <li>Ve a <strong>Notificaciones</strong> → <strong>Configuración del sitio</strong></li>
                  <li>Busca <strong>rekalcula</strong> en la lista</li>
                  <li>Activa <strong>"Notificaciones flotantes"</strong></li>
                </ol>
                <p className="text-blue-200/60 text-xs mt-1">
                  Sin esta opción, las notificaciones aparecerán solo en el panel de notificaciones de tu teléfono.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Aviso permanente pero más discreto si ya está suscrito en Android */}
        {isAndroid && isSubscribed && !showAndroidTip && !justActivated && (
          <button
            onClick={() => setShowAndroidTip(true)}
            className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-400 transition-colors"
          >
            <Info className="w-3.5 h-3.5" />
            <span>¿No ves las notificaciones flotantes? Toca aquí</span>
          </button>
        )}
      </div>

      {/* ============================================================ */}
      {/* NUEVO: Popup personalizado de permisos */}
      {/* ============================================================ */}
      <NotificationPermissionDialog
        isOpen={showPermissionDialog}
        onClose={handleCancelPermission}
        onConfirm={handleConfirmPermission}
      />
    </>
  )
}

// ============================================================
// Utilidades (sin cambios)
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