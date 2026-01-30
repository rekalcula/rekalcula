'use client'

// ============================================================
// PÁGINA: Configuración - app/dashboard/settings/page.tsx
// ============================================================

import { PushNotificationManager } from '@/components/PushNotificationManager'
import { Bell, Settings } from 'lucide-react'

export default function SettingsPage() {
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="w-8 h-8 text-gray-600" />
        <h1 className="text-2xl font-bold text-gray-800">Configuración</h1>
      </div>

      {/* Sección de Notificaciones */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Bell className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-800">Notificaciones Push</h2>
        </div>
        
        <p className="text-gray-600 mb-4">
          Recibe alertas importantes sobre tu negocio directamente en tu móvil o navegador.
          Te notificaremos sobre:
        </p>
        
        <ul className="text-sm text-gray-500 mb-6 space-y-1">
          <li>• Productos que requieren atención</li>
          <li>• Oportunidades de mejora detectadas</li>
          <li>• Alertas de tesorería</li>
          <li>• Recordatorios fiscales</li>
        </ul>

        <PushNotificationManager />
      </div>

      {/* Información adicional */}
      <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-500">
        <p>
          <strong>Nota:</strong> Las notificaciones push requieren tu permiso. 
          Puedes desactivarlas en cualquier momento desde aquí o desde la configuración de tu navegador.
        </p>
      </div>
    </div>
  )
}
