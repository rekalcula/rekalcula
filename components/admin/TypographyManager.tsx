'use client'

import { useState, useEffect } from 'react'
import {
  Type,
  Smartphone,
  Tablet,
  Monitor,
  Save,
  RefreshCw,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  Info
} from 'lucide-react'

interface TypographyConfig {
  base_font_size_mobile: number
  base_font_size_tablet: number
  base_font_size_desktop: number
  font_family: string
  scale_ratio: number
  line_height_body: number
  line_height_heading: number
  description?: string
  updated_at?: string
}

const FONT_FAMILIES = [
  { value: 'Inter, system-ui, -apple-system, sans-serif', label: 'Inter (Default)' },
  { value: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif', label: 'System UI' },
  { value: '"Helvetica Neue", Helvetica, Arial, sans-serif', label: 'Helvetica' },
  { value: 'Arial, sans-serif', label: 'Arial' },
  { value: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif', label: 'Segoe UI' },
  { value: 'Roboto, sans-serif', label: 'Roboto' },
  { value: '"Open Sans", sans-serif', label: 'Open Sans' },
  { value: 'Georgia, serif', label: 'Georgia (Serif)' },
  { value: '"Times New Roman", Times, serif', label: 'Times New Roman (Serif)' },
  { value: '"Courier New", Courier, monospace', label: 'Courier (Monospace)' },
]

const SCALE_RATIOS = [
  { value: 1.125, label: '1.125 - Major Second' },
  { value: 1.2, label: '1.2 - Minor Third' },
  { value: 1.25, label: '1.25 - Major Third (Recomendado)' },
  { value: 1.333, label: '1.333 - Perfect Fourth' },
  { value: 1.414, label: '1.414 - Augmented Fourth' },
  { value: 1.5, label: '1.5 - Perfect Fifth' },
  { value: 1.618, label: '1.618 - Golden Ratio' },
]

export default function TypographyManager() {
  const [config, setConfig] = useState<TypographyConfig>({
    base_font_size_mobile: 16,
    base_font_size_tablet: 16,
    base_font_size_desktop: 18,
    font_family: 'Inter, system-ui, -apple-system, sans-serif',
    scale_ratio: 1.25,
    line_height_body: 1.5,
    line_height_heading: 1.2,
  })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/typography-config')
      const data = await res.json()
      if (data.success && data.config) {
        setConfig(data.config)
      }
    } catch (error) {
      console.error('Error fetching config:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveConfig = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch('/api/admin/typography-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })
      const data = await res.json()

      if (data.success) {
        setConfig(data.config)
        setMessage({ type: 'success', text: 'Configuración guardada. Recarga la página para ver los cambios.' })
        
        // Recargar la página después de 2 segundos para aplicar cambios
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } else {
        setMessage({ type: 'error', text: data.error || 'Error al guardar' })
      }
    } catch (error) {
      console.error('Error saving config:', error)
      setMessage({ type: 'error', text: 'Error al guardar la configuración' })
    } finally {
      setSaving(false)
    }
  }

  const resetToDefaults = async () => {
    if (!confirm('¿Restablecer a valores por defecto? Esto recargará la página.')) {
      return
    }

    setResetting(true)
    setMessage(null)
    try {
      const res = await fetch('/api/admin/typography-config', {
        method: 'PUT'
      })
      const data = await res.json()

      if (data.success) {
        setMessage({ type: 'success', text: 'Restablecido a valores por defecto' })
        setTimeout(() => {
          window.location.reload()
        }, 1500)
      } else {
        setMessage({ type: 'error', text: data.error || 'Error al restablecer' })
      }
    } catch (error) {
      console.error('Error resetting config:', error)
      setMessage({ type: 'error', text: 'Error al restablecer la configuración' })
    } finally {
      setResetting(false)
    }
  }

  const calculatePreviewSizes = (baseSize: number, ratio: number) => {
    return {
      xs: Math.round(baseSize / ratio / ratio * 10) / 10,
      sm: Math.round(baseSize / ratio * 10) / 10,
      base: baseSize,
      lg: Math.round(baseSize * ratio * 10) / 10,
      xl: Math.round(baseSize * ratio * ratio * 10) / 10,
      '2xl': Math.round(baseSize * Math.pow(ratio, 3) * 10) / 10,
      '3xl': Math.round(baseSize * Math.pow(ratio, 4) * 10) / 10,
      '4xl': Math.round(baseSize * Math.pow(ratio, 5) * 10) / 10,
    }
  }

  const previewSizes = {
    mobile: calculatePreviewSizes(config.base_font_size_mobile, config.scale_ratio),
    tablet: calculatePreviewSizes(config.base_font_size_tablet, config.scale_ratio),
    desktop: calculatePreviewSizes(config.base_font_size_desktop, config.scale_ratio),
  }

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
          <Type className="w-6 h-6 text-[#D98C21]" />
          <h2 className="text-xl font-bold text-white">Configuración Tipográfica Global</h2>
        </div>
        <p className="text-gray-400">
          Configura el tamaño base y la fuente para toda la aplicación. Los cambios afectan a mobile, tablet y desktop.
        </p>
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

      {/* Familia Tipográfica */}
      <div className="bg-[#262626] rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Type className="w-5 h-5 text-[#D98C21]" />
          Familia Tipográfica
        </h3>

        <div>
          <label className="text-gray-300 mb-2 block text-sm">Fuente Principal</label>
          <select
            value={config.font_family}
            onChange={(e) => setConfig({ ...config, font_family: e.target.value })}
            className="w-full bg-[#333] border border-gray-600 rounded-lg px-3 py-2 text-white"
          >
            {FONT_FAMILIES.map((font) => (
              <option key={font.value} value={font.value}>
                {font.label}
              </option>
            ))}
          </select>

          <div className="mt-4 p-4 bg-[#1a1a1a] rounded-lg border border-gray-700">
            <p className="text-white mb-2" style={{ fontFamily: config.font_family }}>
              Vista previa: El rápido zorro marrón salta sobre el perro perezoso
            </p>
            <p className="text-2xl font-bold text-white" style={{ fontFamily: config.font_family }}>
              1234567890
            </p>
          </div>
        </div>
      </div>

      {/* Tamaños Base Responsive */}
      <div className="bg-[#262626] rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Tamaños Base Responsive</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Mobile */}
          <div>
            <label className="flex items-center gap-2 text-gray-300 mb-2 text-sm">
              <Smartphone className="w-4 h-4 text-blue-400" />
              Mobile (&lt;768px)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="12"
                max="20"
                value={config.base_font_size_mobile}
                onChange={(e) => setConfig({ ...config, base_font_size_mobile: parseInt(e.target.value) })}
                className="flex-1"
              />
              <input
                type="number"
                min="12"
                max="20"
                value={config.base_font_size_mobile}
                onChange={(e) => setConfig({ ...config, base_font_size_mobile: parseInt(e.target.value) })}
                className="w-16 bg-[#333] border border-gray-600 rounded px-2 py-1 text-white text-sm"
              />
              <span className="text-gray-400 text-sm">px</span>
            </div>
          </div>

          {/* Tablet */}
          <div>
            <label className="flex items-center gap-2 text-gray-300 mb-2 text-sm">
              <Tablet className="w-4 h-4 text-green-400" />
              Tablet (768-1024px)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="12"
                max="22"
                value={config.base_font_size_tablet}
                onChange={(e) => setConfig({ ...config, base_font_size_tablet: parseInt(e.target.value) })}
                className="flex-1"
              />
              <input
                type="number"
                min="12"
                max="22"
                value={config.base_font_size_tablet}
                onChange={(e) => setConfig({ ...config, base_font_size_tablet: parseInt(e.target.value) })}
                className="w-16 bg-[#333] border border-gray-600 rounded px-2 py-1 text-white text-sm"
              />
              <span className="text-gray-400 text-sm">px</span>
            </div>
          </div>

          {/* Desktop */}
          <div>
            <label className="flex items-center gap-2 text-gray-300 mb-2 text-sm">
              <Monitor className="w-4 h-4 text-purple-400" />
              Desktop (&gt;1024px)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="14"
                max="24"
                value={config.base_font_size_desktop}
                onChange={(e) => setConfig({ ...config, base_font_size_desktop: parseInt(e.target.value) })}
                className="flex-1"
              />
              <input
                type="number"
                min="14"
                max="24"
                value={config.base_font_size_desktop}
                onChange={(e) => setConfig({ ...config, base_font_size_desktop: parseInt(e.target.value) })}
                className="w-16 bg-[#333] border border-gray-600 rounded px-2 py-1 text-white text-sm"
              />
              <span className="text-gray-400 text-sm">px</span>
            </div>
          </div>
        </div>

        <div className="mt-4 p-3 bg-blue-900/20 border border-blue-700 rounded-lg flex items-start gap-2">
          <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
          <p className="text-blue-300 text-sm">
            El tamaño base afecta a todo el texto. Los títulos (H1, H2, etc.) escalarán automáticamente según la escala tipográfica.
          </p>
        </div>
      </div>

      {/* Escala Tipográfica */}
      <div className="bg-[#262626] rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Escala Tipográfica</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-gray-300 mb-2 block text-sm">Ratio de Escala</label>
            <select
              value={config.scale_ratio}
              onChange={(e) => setConfig({ ...config, scale_ratio: parseFloat(e.target.value) })}
              className="w-full bg-[#333] border border-gray-600 rounded-lg px-3 py-2 text-white"
            >
              {SCALE_RATIOS.map((ratio) => (
                <option key={ratio.value} value={ratio.value}>
                  {ratio.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-gray-300 mb-2 block text-sm">Line Height Body</label>
            <input
              type="number"
              step="0.1"
              min="1.2"
              max="2.0"
              value={config.line_height_body}
              onChange={(e) => setConfig({ ...config, line_height_body: parseFloat(e.target.value) })}
              className="w-full bg-[#333] border border-gray-600 rounded-lg px-3 py-2 text-white"
            />
          </div>
        </div>

        <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-700 rounded-lg flex items-start gap-2">
          <Info className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
          <p className="text-yellow-300 text-sm">
            La escala tipográfica define cómo crecen los tamaños. 1.25 (Major Third) es la más recomendada para web.
          </p>
        </div>
      </div>

      {/* Preview de Tamaños */}
      <div className="bg-[#262626] rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Vista Previa de Tamaños</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Mobile Preview */}
          <div className="bg-[#1a1a1a] rounded-lg p-4 border border-gray-700">
            <div className="flex items-center gap-2 mb-3">
              <Smartphone className="w-4 h-4 text-blue-400" />
              <h4 className="text-sm font-medium text-blue-400">Mobile</h4>
            </div>
            <div className="space-y-2 text-white" style={{ fontFamily: config.font_family }}>
              <div className="flex justify-between text-xs">
                <span>xs</span>
                <span className="text-gray-500">{previewSizes.mobile.xs}px</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>sm</span>
                <span className="text-gray-500">{previewSizes.mobile.sm}px</span>
              </div>
              <div className="flex justify-between" style={{ fontSize: `${config.base_font_size_mobile}px` }}>
                <span>base</span>
                <span className="text-gray-500">{previewSizes.mobile.base}px</span>
              </div>
              <div className="flex justify-between" style={{ fontSize: `${previewSizes.mobile.lg}px` }}>
                <span>lg</span>
                <span className="text-gray-500">{previewSizes.mobile.lg}px</span>
              </div>
              <div className="flex justify-between" style={{ fontSize: `${previewSizes.mobile.xl}px` }}>
                <span>xl</span>
                <span className="text-gray-500">{previewSizes.mobile.xl}px</span>
              </div>
            </div>
          </div>

          {/* Tablet Preview */}
          <div className="bg-[#1a1a1a] rounded-lg p-4 border border-gray-700">
            <div className="flex items-center gap-2 mb-3">
              <Tablet className="w-4 h-4 text-green-400" />
              <h4 className="text-sm font-medium text-green-400">Tablet</h4>
            </div>
            <div className="space-y-2 text-white" style={{ fontFamily: config.font_family }}>
              <div className="flex justify-between text-xs">
                <span>xs</span>
                <span className="text-gray-500">{previewSizes.tablet.xs}px</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>sm</span>
                <span className="text-gray-500">{previewSizes.tablet.sm}px</span>
              </div>
              <div className="flex justify-between" style={{ fontSize: `${config.base_font_size_tablet}px` }}>
                <span>base</span>
                <span className="text-gray-500">{previewSizes.tablet.base}px</span>
              </div>
              <div className="flex justify-between" style={{ fontSize: `${previewSizes.tablet.lg}px` }}>
                <span>lg</span>
                <span className="text-gray-500">{previewSizes.tablet.lg}px</span>
              </div>
              <div className="flex justify-between" style={{ fontSize: `${previewSizes.tablet.xl}px` }}>
                <span>xl</span>
                <span className="text-gray-500">{previewSizes.tablet.xl}px</span>
              </div>
            </div>
          </div>

          {/* Desktop Preview */}
          <div className="bg-[#1a1a1a] rounded-lg p-4 border border-gray-700">
            <div className="flex items-center gap-2 mb-3">
              <Monitor className="w-4 h-4 text-purple-400" />
              <h4 className="text-sm font-medium text-purple-400">Desktop</h4>
            </div>
            <div className="space-y-2 text-white" style={{ fontFamily: config.font_family }}>
              <div className="flex justify-between text-xs">
                <span>xs</span>
                <span className="text-gray-500">{previewSizes.desktop.xs}px</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>sm</span>
                <span className="text-gray-500">{previewSizes.desktop.sm}px</span>
              </div>
              <div className="flex justify-between" style={{ fontSize: `${config.base_font_size_desktop}px` }}>
                <span>base</span>
                <span className="text-gray-500">{previewSizes.desktop.base}px</span>
              </div>
              <div className="flex justify-between" style={{ fontSize: `${previewSizes.desktop.lg}px` }}>
                <span>lg</span>
                <span className="text-gray-500">{previewSizes.desktop.lg}px</span>
              </div>
              <div className="flex justify-between" style={{ fontSize: `${previewSizes.desktop.xl}px` }}>
                <span>xl</span>
                <span className="text-gray-500">{previewSizes.desktop.xl}px</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notas */}
      <div className="bg-[#262626] rounded-xl p-6 border border-gray-700">
        <label className="text-gray-300 mb-2 block text-sm">Notas/Descripción</label>
        <input
          type="text"
          value={config.description || ''}
          onChange={(e) => setConfig({ ...config, description: e.target.value })}
          placeholder="Ej: Actualización tipográfica Enero 2025"
          className="w-full bg-[#333] border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-500"
        />
      </div>

      {/* Botones de Acción */}
      <div className="flex gap-4">
        <button
          onClick={saveConfig}
          disabled={saving}
          className="flex items-center gap-2 bg-[#D98C21] text-black px-6 py-3 rounded-lg font-medium hover:bg-[#c47d1d] transition disabled:opacity-50 flex-1"
        >
          {saving ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Guardar y Aplicar Cambios
            </>
          )}
        </button>

        <button
          onClick={resetToDefaults}
          disabled={resetting}
          className="flex items-center gap-2 bg-gray-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700 transition disabled:opacity-50"
        >
          {resetting ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              Restableciendo...
            </>
          ) : (
            <>
              <RotateCcw className="w-5 h-5" />
              Restablecer
            </>
          )}
        </button>
      </div>

      {config.updated_at && (
        <p className="text-gray-500 text-xs text-center">
          Última actualización: {new Date(config.updated_at).toLocaleString('es-ES')}
        </p>
      )}
    </div>
  )
}

