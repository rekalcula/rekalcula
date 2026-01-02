'use client'

import { useState, useEffect } from 'react'
import { 
  Settings, 
  Save, 
  RefreshCw, 
  FileText, 
  Receipt, 
  Lightbulb,
  Calendar,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'

interface TrialConfig {
  id: string
  invoices_limit: number
  tickets_limit: number
  analyses_limit: number
  trial_days: number
  description: string
  is_active: boolean
  updated_at: string
}

export default function TrialConfigManager() {
  const [config, setConfig] = useState<TrialConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    invoices_limit: 10,
    tickets_limit: 10,
    analyses_limit: 5,
    trial_days: 7,
    description: ''
  })

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/trial-config')
      const data = await res.json()
      if (data.success && data.config) {
        setConfig(data.config)
        setFormData({
          invoices_limit: data.config.invoices_limit,
          tickets_limit: data.config.tickets_limit,
          analyses_limit: data.config.analyses_limit,
          trial_days: data.config.trial_days,
          description: data.config.description || ''
        })
      }
    } catch (error) {
      console.error('Error fetching trial config:', error)
      setMessage({ type: 'error', text: 'Error al cargar la configuración' })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch('/api/admin/trial-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      const data = await res.json()
      
      if (data.success) {
        setConfig(data.config)
        setMessage({ type: 'success', text: 'Configuración guardada correctamente' })
      } else {
        setMessage({ type: 'error', text: data.error || 'Error al guardar' })
      }
    } catch (error) {
      console.error('Error saving trial config:', error)
      setMessage({ type: 'error', text: 'Error al guardar la configuración' })
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: string, value: number | string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Calcular costo estimado por usuario en trial
  const estimatedCost = (
    formData.invoices_limit * 0.017 +
    formData.tickets_limit * 0.011 +
    formData.analyses_limit * 0.006
  ).toFixed(2)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#262626] rounded-xl p-6 border border-gray-700">
        <div className="flex items-center gap-3 mb-2">
          <Settings className="w-6 h-6 text-[#D98C21]" />
          <h2 className="text-xl font-bold text-white">Configuración de Prueba Gratuita</h2>
        </div>
        <p className="text-gray-400">
          Define los límites de uso para usuarios en período de prueba. 
          Estos valores se aplican a todos los nuevos usuarios que inicien trial.
        </p>
      </div>

      {/* Warning Card */}
      <div className="bg-yellow-900/20 border border-yellow-700 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
          <div>
            <h3 className="text-yellow-500 font-semibold">Importante</h3>
            <p className="text-yellow-200/80 text-sm mt-1">
              Los cambios solo afectan a nuevos usuarios en trial. 
              Los usuarios existentes mantienen sus créditos actuales.
            </p>
          </div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`rounded-xl p-4 flex items-center gap-3 ${
          message.type === 'success' 
            ? 'bg-green-900/20 border border-green-700' 
            : 'bg-red-900/20 border border-red-700'
        }`}>
          {message.type === 'success' 
            ? <CheckCircle className="w-5 h-5 text-green-500" />
            : <AlertTriangle className="w-5 h-5 text-red-500" />
          }
          <span className={message.type === 'success' ? 'text-green-300' : 'text-red-300'}>
            {message.text}
          </span>
        </div>
      )}

      {/* Configuration Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Limits Card */}
        <div className="bg-[#262626] rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-6">Límites de Créditos</h3>
          
          <div className="space-y-6">
            {/* Invoices */}
            <div>
              <label className="flex items-center gap-2 text-gray-300 mb-2">
                <FileText className="w-4 h-4 text-purple-400" />
                Facturas
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={formData.invoices_limit}
                  onChange={(e) => handleInputChange('invoices_limit', parseInt(e.target.value))}
                  className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.invoices_limit}
                  onChange={(e) => handleInputChange('invoices_limit', parseInt(e.target.value) || 0)}
                  className="w-20 bg-[#333] border border-gray-600 rounded-lg px-3 py-2 text-white text-center"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Costo: ~€{(formData.invoices_limit * 0.017).toFixed(3)}</p>
            </div>

            {/* Tickets */}
            <div>
              <label className="flex items-center gap-2 text-gray-300 mb-2">
                <Receipt className="w-4 h-4 text-orange-400" />
                Tickets de Venta
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={formData.tickets_limit}
                  onChange={(e) => handleInputChange('tickets_limit', parseInt(e.target.value))}
                  className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
                />
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.tickets_limit}
                  onChange={(e) => handleInputChange('tickets_limit', parseInt(e.target.value) || 0)}
                  className="w-20 bg-[#333] border border-gray-600 rounded-lg px-3 py-2 text-white text-center"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Costo: ~€{(formData.tickets_limit * 0.011).toFixed(3)}</p>
            </div>

            {/* Analyses */}
            <div>
              <label className="flex items-center gap-2 text-gray-300 mb-2">
                <Lightbulb className="w-4 h-4 text-yellow-400" />
                Análisis IA
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={formData.analyses_limit}
                  onChange={(e) => handleInputChange('analyses_limit', parseInt(e.target.value))}
                  className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                />
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={formData.analyses_limit}
                  onChange={(e) => handleInputChange('analyses_limit', parseInt(e.target.value) || 0)}
                  className="w-20 bg-[#333] border border-gray-600 rounded-lg px-3 py-2 text-white text-center"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Costo: ~€{(formData.analyses_limit * 0.006).toFixed(3)}</p>
            </div>
          </div>
        </div>

        {/* Duration & Summary Card */}
        <div className="space-y-6">
          {/* Duration */}
          <div className="bg-[#262626] rounded-xl p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Duración del Trial</h3>
            
            <div>
              <label className="flex items-center gap-2 text-gray-300 mb-2">
                <Calendar className="w-4 h-4 text-blue-400" />
                Días de prueba
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="1"
                  max="30"
                  value={formData.trial_days}
                  onChange={(e) => handleInputChange('trial_days', parseInt(e.target.value))}
                  className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={formData.trial_days}
                  onChange={(e) => handleInputChange('trial_days', parseInt(e.target.value) || 7)}
                  className="w-20 bg-[#333] border border-gray-600 rounded-lg px-3 py-2 text-white text-center"
                />
              </div>
            </div>
          </div>

          {/* Cost Summary */}
          <div className="bg-gradient-to-br from-[#D98C21]/20 to-[#D98C21]/5 rounded-xl p-6 border border-[#D98C21]/30">
            <h3 className="text-lg font-semibold text-white mb-4">Resumen de Costos</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between text-gray-300">
                <span>Facturas ({formData.invoices_limit})</span>
                <span>€{(formData.invoices_limit * 0.017).toFixed(3)}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Tickets ({formData.tickets_limit})</span>
                <span>€{(formData.tickets_limit * 0.011).toFixed(3)}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Análisis ({formData.analyses_limit})</span>
                <span>€{(formData.analyses_limit * 0.006).toFixed(3)}</span>
              </div>
              <hr className="border-gray-600" />
              <div className="flex justify-between text-white font-bold text-lg">
                <span>Costo máx. por usuario</span>
                <span className="text-[#D98C21]">€{estimatedCost}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-[#262626] rounded-xl p-6 border border-gray-700">
            <label className="text-gray-300 mb-2 block">Notas/Descripción</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Notas sobre esta configuración..."
              className="w-full bg-[#333] border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 resize-none"
              rows={3}
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-[#D98C21] text-black px-6 py-3 rounded-lg font-semibold hover:bg-[#c47d1d] transition disabled:opacity-50"
        >
          {saving ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Guardar Configuración
            </>
          )}
        </button>
      </div>

      {/* Last Update Info */}
      {config?.updated_at && (
        <p className="text-center text-gray-500 text-sm">
          Última actualización: {new Date(config.updated_at).toLocaleString('es-ES')}
        </p>
      )}
    </div>
  )
}
