'use client'

import { useEffect, useState } from 'react'
import { Clock, AlertCircle, Settings } from 'lucide-react'
import BusinessHoursConfigV2 from './BusinessHoursConfigV2'
import OpportunityAnalysis_v4_WithHours from './OpportunityAnalysis_v4_WithHours'

export default function SalesAnalysisWithHours() {
  const [hoursConfigured, setHoursConfigured] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkHoursConfiguration()
  }, [])

  const checkHoursConfiguration = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/business-hours')
      const data = await response.json()
      setHoursConfigured(data.configured === true)
    } catch (error) {
      console.error('Error al verificar configuración:', error)
      setHoursConfigured(false)
    } finally {
      setLoading(false)
    }
  }

  const handleHoursSaved = () => {
    setHoursConfigured(true)
  }

  if (loading) {
    return (
      <div className="bg-[#1a1a1a] rounded-xl p-12 border border-gray-700">
        <div className="flex flex-col items-center justify-center gap-4">
          <Clock className="w-12 h-12 text-[#d98c21] animate-pulse" />
          <p className="text-white text-lg">Verificando configuración...</p>
        </div>
      </div>
    )
  }

  // BLOQUEO: Si no hay horarios configurados, mostrar mensaje + formulario
  if (!hoursConfigured) {
    return (
      <div className="space-y-6">
        {/* Mensaje de advertencia */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl p-6 border-2 border-amber-400">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-8 h-8 text-white flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">
                ⚠️ Configuración Requerida
              </h3>
              <p className="text-white text-lg mb-3">
                Para realizar el análisis de oportunidades, primero debes configurar tu <strong>horario comercial</strong>.
              </p>
              <p className="text-white/90">
                Esto permite que el sistema analice correctamente tus ventas según tus horas de apertura y cierre, 
                incluyendo turnos partidos si cierras al mediodía.
              </p>
            </div>
          </div>
        </div>

        {/* Formulario de configuración */}
        <BusinessHoursConfigV2 onSaved={handleHoursSaved} />

        {/* Mensaje informativo adicional */}
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-start gap-3">
            <Settings className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-blue-900 font-medium mb-1">
                ¿Por qué necesitamos esto?
              </p>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Análisis hora por hora solo muestra tus horas de apertura</li>
                <li>• Detecta si tienes ventas fuera de tu horario habitual</li>
                <li>• Calcula rendimiento real según tiempo operativo</li>
                <li>• Identifica oportunidades de optimización de horario</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Si hay configuración, mostrar análisis normal
  return (
    <div className="space-y-6">
      {/* Enlace para editar horarios */}
      <div className="flex justify-end">
        <button
          onClick={() => setHoursConfigured(false)}
          className="text-sm text-[#d98c21] hover:text-[#f4a340] font-medium flex items-center gap-2"
        >
          <Settings className="w-4 h-4" />
          Editar horario comercial
        </button>
      </div>

      {/* Componente de análisis */}
      <OpportunityAnalysis_v4_WithHours />
    </div>
  )
}