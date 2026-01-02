'use client'

import { useState, useEffect } from 'react'
import { Type, Save, RotateCcw, Loader2 } from 'lucide-react'
import { useTypography } from '@/app/providers/TypographyProvider'

interface TypographyFormData {
  baseSizeMobile: number
  baseSizeTablet: number
  baseSizeDesktop: number
  fontFamily: string
  scaleRatio: number
  lineHeight: number
}

const FONT_OPTIONS = [
  { value: 'Inter, system-ui, sans-serif', label: 'Inter (Default)' },
  { value: 'system-ui, sans-serif', label: 'System UI' },
  { value: 'Helvetica, Arial, sans-serif', label: 'Helvetica' },
  { value: 'Arial, sans-serif', label: 'Arial' },
  { value: '"Segoe UI", sans-serif', label: 'Segoe UI' },
  { value: 'Roboto, sans-serif', label: 'Roboto' },
  { value: '"Open Sans", sans-serif', label: 'Open Sans' },
  { value: 'Georgia, serif', label: 'Georgia (Serif)' },
  { value: '"Times New Roman", serif', label: 'Times New Roman' },
  { value: '"Courier New", monospace', label: 'Courier (Monospace)' }
]

// Función para obtener el nombre descriptivo de la escala
const getScaleName = (ratio: number): string => {
  if (ratio >= 1.05 && ratio < 1.12) return 'Minor Second'
  if (ratio >= 1.12 && ratio < 1.19) return 'Major Second'
  if (ratio >= 1.19 && ratio < 1.24) return 'Minor Third'
  if (ratio >= 1.24 && ratio < 1.30) return 'Major Third'
  if (ratio >= 1.30 && ratio < 1.40) return 'Perfect Fourth'
  if (ratio >= 1.40 && ratio < 1.49) return 'Augmented Fourth'
  if (ratio >= 1.49 && ratio < 1.58) return 'Perfect Fifth'
  if (ratio >= 1.58 && ratio <= 1.62) return 'Golden Ratio'
  return 'Custom'
}

export default function TypographyManager() {
  const { config, refreshConfig, isLoading: contextLoading } = useTypography()
  const [formData, setFormData] = useState<TypographyFormData>({
    baseSizeMobile: 16,
    baseSizeTablet: 16,
    baseSizeDesktop: 18,
    fontFamily: 'Inter, system-ui, sans-serif',
    scaleRatio: 1.25,
    lineHeight: 1.5
  })
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // Sincronizar form con config del contexto
  useEffect(() => {
    if (config) {
      setFormData({
        baseSizeMobile: config.baseSizeMobile,
        baseSizeTablet: config.baseSizeTablet,
        baseSizeDesktop: config.baseSizeDesktop,
        fontFamily: config.fontFamily,
        scaleRatio: config.scaleRatio,
        lineHeight: config.lineHeight
      })
    }
  }, [config])

  const handleSave = async () => {
    setIsSaving(true)
    setMessage(null)

    try {
      const response = await fetch('/api/admin/typography-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al guardar')
      }

      await refreshConfig()
      setMessage({ type: 'success', text: '✅ Configuración guardada. La página se recargará en 2 segundos...' })
      
      // Recargar después de 2 segundos para aplicar cambios
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Error al guardar configuración' 
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = async () => {
    if (!confirm('¿Restablecer a valores por defecto?')) return

    setIsSaving(true)
    setMessage(null)

    try {
      const response = await fetch('/api/admin/typography-config', {
        method: 'PUT'
      })

      if (!response.ok) {
        throw new Error('Error al restablecer')
      }

      await refreshConfig()
      setMessage({ type: 'success', text: '✅ Configuración restablecida. Recargando...' })
      
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: 'Error al restablecer configuración' 
      })
    } finally {
      setIsSaving(false)
    }
  }

  const calculatePreviewSize = (baseSize: number, multiplier: number) => {
    return Math.round(baseSize * multiplier)
  }

  if (contextLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-[#D98C21]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-gray-700">
        <Type className="w-6 h-6 text-[#D98C21]" />
        <div>
          <h2 className="text-2xl font-bold text-white">Configuración de Tipografía</h2>
          <p className="text-gray-400 text-sm mt-1">
            Controla el tamaño y tipo de letra de toda la aplicación
          </p>
        </div>
      </div>

      {/* Mensaje de estado */}
      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-900/30 border border-green-700 text-green-300'
            : 'bg-red-900/30 border border-red-700 text-red-300'
        }`}>
          {message.text}
        </div>
      )}

      {/* Familia Tipográfica */}
      <div className="bg-[#222] p-6 rounded-lg border border-gray-700">
        <label className="block text-white font-semibold mb-3">
          📝 Familia Tipográfica
        </label>
        <select
          value={formData.fontFamily}
          onChange={(e) => setFormData({ ...formData, fontFamily: e.target.value })}
          className="w-full bg-[#333] text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-[#D98C21] focus:outline-none"
        >
          {FONT_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div 
          className="mt-3 p-4 bg-[#1a1a1a] rounded border border-gray-600 text-gray-300"
          style={{ fontFamily: formData.fontFamily }}
        >
          Vista previa: Este es un texto de ejemplo con la fuente seleccionada
        </div>
      </div>

      {/* Tamaños Base Responsive */}
      <div className="bg-[#222] p-6 rounded-lg border border-gray-700">
        <h3 className="text-white font-semibold mb-4">📱 Tamaños Base Responsive</h3>
        
        <div className="space-y-4">
          {/* Mobile */}
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-gray-300">📱 Mobile (&lt; 768px)</label>
              <span className="text-[#D98C21] font-mono">{formData.baseSizeMobile}px</span>
            </div>
            <input
              type="range"
              min="12"
              max="24"
              value={formData.baseSizeMobile}
              onChange={(e) => setFormData({ ...formData, baseSizeMobile: parseInt(e.target.value) })}
              className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-[#D98C21]"
            />
          </div>

          {/* Tablet */}
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-gray-300">📋 Tablet (768px - 1024px)</label>
              <span className="text-[#D98C21] font-mono">{formData.baseSizeTablet}px</span>
            </div>
            <input
              type="range"
              min="12"
              max="24"
              value={formData.baseSizeTablet}
              onChange={(e) => setFormData({ ...formData, baseSizeTablet: parseInt(e.target.value) })}
              className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-[#D98C21]"
            />
          </div>

          {/* Desktop */}
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-gray-300">💻 Desktop (&gt; 1024px)</label>
              <span className="text-[#D98C21] font-mono">{formData.baseSizeDesktop}px</span>
            </div>
            <input
              type="range"
              min="12"
              max="24"
              value={formData.baseSizeDesktop}
              onChange={(e) => setFormData({ ...formData, baseSizeDesktop: parseInt(e.target.value) })}
              className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-[#D98C21]"
            />
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-4 p-3 bg-blue-900/20 border border-blue-700/50 rounded-lg">
          <p className="text-blue-300 text-sm flex items-start gap-2">
            <span className="text-lg">ℹ️</span>
            <span>El tamaño base afecta a todo el texto. Los títulos (H1, H2, etc.) escalarán automáticamente según la escala tipográfica.</span>
          </p>
        </div>
      </div>

      {/* Escala Tipográfica - MODIFICADO: Ahora es slider de 1.05 a 1.618 */}
      <div className="bg-[#222] p-6 rounded-lg border border-gray-700">
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <label className="text-white font-semibold">📐 Escala Tipográfica</label>
            <div className="text-right">
              <span className="text-[#D98C21] font-mono text-lg">{formData.scaleRatio.toFixed(3)}</span>
              <span className="text-gray-400 text-sm ml-2">({getScaleName(formData.scaleRatio)})</span>
            </div>
          </div>
          <input
            type="range"
            min="1.05"
            max="1.618"
            step="0.001"
            value={formData.scaleRatio}
            onChange={(e) => setFormData({ ...formData, scaleRatio: parseFloat(e.target.value) })}
            className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-[#D98C21]"
          />
        </div>

        {/* Marcadores de referencia */}
        <div className="grid grid-cols-4 gap-2 text-xs text-gray-400">
          <div className="text-center">
            <div className="font-mono">1.05</div>
            <div>Mínimo</div>
          </div>
          <div className="text-center">
            <div className="font-mono">1.25</div>
            <div>Recomendado</div>
          </div>
          <div className="text-center">
            <div className="font-mono">1.414</div>
            <div>Intermedio</div>
          </div>
          <div className="text-center">
            <div className="font-mono">1.618</div>
            <div>Golden</div>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
          <p className="text-yellow-300 text-sm flex items-start gap-2">
            <span className="text-lg">⚠️</span>
            <span>La escala tipográfica define cómo crecen los tamaños. 1.25 (Major Third) es la más recomendada para web.</span>
          </p>
        </div>
      </div>

      {/* Line Height - MODIFICADO: Ahora comienza en 1.05 */}
      <div className="bg-[#222] p-6 rounded-lg border border-gray-700">
        <div className="flex justify-between mb-3">
          <label className="text-white font-semibold">
            📏 Altura de Línea (Line Height)
          </label>
          <span className="text-[#D98C21] font-mono text-lg">{formData.lineHeight.toFixed(2)}</span>
        </div>
        <input
          type="range"
          min="1.05"
          max="2.0"
          step="0.05"
          value={formData.lineHeight}
          onChange={(e) => setFormData({ ...formData, lineHeight: parseFloat(e.target.value) })}
          className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-[#D98C21]"
        />

        {/* Marcadores de referencia */}
        <div className="grid grid-cols-4 gap-2 text-xs text-gray-400 mt-3">
          <div className="text-center">
            <div className="font-mono">1.05</div>
            <div>Compacto</div>
          </div>
          <div className="text-center">
            <div className="font-mono">1.4</div>
            <div>Denso</div>
          </div>
          <div className="text-center">
            <div className="font-mono">1.6</div>
            <div>Cómodo</div>
          </div>
          <div className="text-center">
            <div className="font-mono">2.0</div>
            <div>Espacioso</div>
          </div>
        </div>

        {/* Vista previa visual del line-height */}
        <div className="mt-4 p-4 bg-[#1a1a1a] rounded border border-gray-600">
          <p className="text-gray-300 text-sm" style={{ lineHeight: formData.lineHeight }}>
            Vista previa de altura de línea: Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
            El espaciado entre líneas afecta la legibilidad del texto. Un valor muy bajo hace el 
            texto difícil de leer, mientras que muy alto lo dispersa demasiado.
          </p>
        </div>
      </div>

      {/* Vista Previa de Tamaños */}
      <div className="bg-[#222] p-6 rounded-lg border border-gray-700">
        <h3 className="text-white font-semibold mb-4">👁️ Vista Previa de Tamaños Calculados</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Mobile Preview */}
          <div>
            <p className="text-gray-400 text-sm mb-2 font-semibold">📱 Mobile</p>
            <div className="space-y-1 text-gray-300 font-mono text-xs bg-[#1a1a1a] p-3 rounded border border-gray-600">
              <div>xs: {calculatePreviewSize(formData.baseSizeMobile, 0.75)}px</div>
              <div>sm: {calculatePreviewSize(formData.baseSizeMobile, 0.875)}px</div>
              <div className="text-[#D98C21]">base: {formData.baseSizeMobile}px</div>
              <div>lg: {calculatePreviewSize(formData.baseSizeMobile, Math.pow(formData.scaleRatio, 0.5))}px</div>
              <div>xl: {calculatePreviewSize(formData.baseSizeMobile, formData.scaleRatio)}px</div>
              <div>2xl: {calculatePreviewSize(formData.baseSizeMobile, Math.pow(formData.scaleRatio, 1.5))}px</div>
              <div>3xl: {calculatePreviewSize(formData.baseSizeMobile, Math.pow(formData.scaleRatio, 2))}px</div>
              <div>4xl: {calculatePreviewSize(formData.baseSizeMobile, Math.pow(formData.scaleRatio, 2.5))}px</div>
            </div>
          </div>

          {/* Tablet Preview */}
          <div>
            <p className="text-gray-400 text-sm mb-2 font-semibold">📋 Tablet</p>
            <div className="space-y-1 text-gray-300 font-mono text-xs bg-[#1a1a1a] p-3 rounded border border-gray-600">
              <div>xs: {calculatePreviewSize(formData.baseSizeTablet, 0.75)}px</div>
              <div>sm: {calculatePreviewSize(formData.baseSizeTablet, 0.875)}px</div>
              <div className="text-[#D98C21]">base: {formData.baseSizeTablet}px</div>
              <div>lg: {calculatePreviewSize(formData.baseSizeTablet, Math.pow(formData.scaleRatio, 0.5))}px</div>
              <div>xl: {calculatePreviewSize(formData.baseSizeTablet, formData.scaleRatio)}px</div>
              <div>2xl: {calculatePreviewSize(formData.baseSizeTablet, Math.pow(formData.scaleRatio, 1.5))}px</div>
              <div>3xl: {calculatePreviewSize(formData.baseSizeTablet, Math.pow(formData.scaleRatio, 2))}px</div>
              <div>4xl: {calculatePreviewSize(formData.baseSizeTablet, Math.pow(formData.scaleRatio, 2.5))}px</div>
            </div>
          </div>

          {/* Desktop Preview */}
          <div>
            <p className="text-gray-400 text-sm mb-2 font-semibold">💻 Desktop</p>
            <div className="space-y-1 text-gray-300 font-mono text-xs bg-[#1a1a1a] p-3 rounded border border-gray-600">
              <div>xs: {calculatePreviewSize(formData.baseSizeDesktop, 0.75)}px</div>
              <div>sm: {calculatePreviewSize(formData.baseSizeDesktop, 0.875)}px</div>
              <div className="text-[#D98C21]">base: {formData.baseSizeDesktop}px</div>
              <div>lg: {calculatePreviewSize(formData.baseSizeDesktop, Math.pow(formData.scaleRatio, 0.5))}px</div>
              <div>xl: {calculatePreviewSize(formData.baseSizeDesktop, formData.scaleRatio)}px</div>
              <div>2xl: {calculatePreviewSize(formData.baseSizeDesktop, Math.pow(formData.scaleRatio, 1.5))}px</div>
              <div className="text-yellow-300 font-semibold">3xl: {calculatePreviewSize(formData.baseSizeDesktop, Math.pow(formData.scaleRatio, 2))}px ⬅️ €6000</div>
              <div>4xl: {calculatePreviewSize(formData.baseSizeDesktop, Math.pow(formData.scaleRatio, 2.5))}px</div>
            </div>
          </div>
        </div>

        {/* Nota sobre text-3xl */}
        <div className="mt-4 p-3 bg-green-900/20 border border-green-700/50 rounded-lg">
          <p className="text-green-300 text-sm flex items-start gap-2">
            <span className="text-lg">💡</span>
            <span>El número <strong>€6000.00</strong> usa <code className="bg-black/40 px-1 rounded">text-3xl</code>. Para modificar su tamaño, ajusta <strong>Desktop Base</strong> o <strong>Escala</strong>.</span>
          </p>
        </div>
      </div>

      {/* Botones de Acción */}
      <div className="flex gap-4">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex-1 flex items-center justify-center gap-2 bg-[#D98C21] hover:bg-[#e09832] text-black font-semibold px-6 py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Guardar y Aplicar
            </>
          )}
        </button>

        <button
          onClick={handleReset}
          disabled={isSaving}
          className="flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold px-6 py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RotateCcw className="w-5 h-5" />
          Restablecer
        </button>
      </div>
    </div>
  )
}

