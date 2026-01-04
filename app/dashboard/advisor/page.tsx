'use client'

import DateRangePicker from '@/components/DateRangePicker'
import AdvisorExportButton from '@/components/AdvisorExportButton'
import { useState, useEffect } from 'react'
import { Recomendacion, Prioridad } from '@/lib/advisor/types'
import { 
  Lightbulb, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  Trash2, 
  FolderOpen, 
  Play, 
  Check,
  ChevronLeft,
  Plus,
  FileText
} from 'lucide-react'

interface AdvisorResponse {
  success: boolean
  sector: string
  confianzaSector: number
  periodo: string
  recomendaciones: Recomendacion[]
  sinRecomendaciones?: boolean
  mensaje?: string
  resumen?: any
}

interface AnalysisItem {
  id: string
  created_at: string
  periodo: string
  fecha_inicio?: string
  fecha_fin?: string
  sector: string
  total_ventas: number
  total_ingresos: number
  num_recomendaciones: number
}

interface AnalysisDetail {
  id: string
  created_at: string
  periodo: string
  sector: string
  total_ventas: number
  total_ingresos: number
  num_recomendaciones: number
  recomendaciones: Recomendacion[]
  resumen: any
}

interface ConsejoAplicado extends Recomendacion {
  aplicadoEn: string
  periodoAnalisis: string
}

export default function AdvisorPage() {
  const [tabActiva, setTabActiva] = useState<'nuevo' | 'guardados' | 'aplicados'>('guardados')
  const [periodo, setPeriodo] = useState<'dia' | 'semana' | 'mes'>('mes')
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [diasSeleccionados, setDiasSeleccionados] = useState(0)
  const [generando, setGenerando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [analisisActual, setAnalisisActual] = useState<AdvisorResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [analisisGuardados, setAnalisisGuardados] = useState<AnalysisItem[]>([])
  const [cargandoGuardados, setCargandoGuardados] = useState(true)
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set())
  const [borrando, setBorrando] = useState(false)
  const [analisisDetalle, setAnalisisDetalle] = useState<AnalysisDetail | null>(null)
  const [cargandoDetalle, setCargandoDetalle] = useState(false)
  
  const [consejosAplicados, setConsejosAplicados] = useState<ConsejoAplicado[]>([])
  const [seleccionadosAplicados, setSeleccionadosAplicados] = useState<Set<string>>(new Set())

  useEffect(() => {
    cargarAnalisisGuardados()
    cargarConsejosAplicados()
  }, [])

  const cargarConsejosAplicados = () => {
    try {
      const stored = localStorage.getItem('consejosAplicados')
      if (stored) {
        setConsejosAplicados(JSON.parse(stored))
      }
    } catch (err) {
      console.error('Error cargando consejos aplicados:', err)
    }
  }

  const aplicarConsejo = (rec: Recomendacion, contexto?: { sector?: string, periodo?: string }) => {
    const consejoAplicado: ConsejoAplicado = {
      ...rec,
      aplicadoEn: new Date().toISOString(),
      periodoAnalisis: contexto?.periodo || analisisActual?.periodo || ''
    }

    const nuevosConsejos = [...consejosAplicados, consejoAplicado]
    setConsejosAplicados(nuevosConsejos)
    localStorage.setItem('consejosAplicados', JSON.stringify(nuevosConsejos))
    setTabActiva('aplicados')
  }

  const toggleSeleccionAplicado = (id: string) => {
    const nuevo = new Set(seleccionadosAplicados)
    if (nuevo.has(id)) {
      nuevo.delete(id)
    } else {
      nuevo.add(id)
    }
    setSeleccionadosAplicados(nuevo)
  }

  const seleccionarTodosAplicados = () => {
    if (seleccionadosAplicados.size === consejosAplicados.length) {
      setSeleccionadosAplicados(new Set())
    } else {
      setSeleccionadosAplicados(new Set(consejosAplicados.map(c => c.id)))
    }
  }

  const eliminarConsejosAplicados = () => {
    if (seleccionadosAplicados.size === 0) return
    
    if (!confirm(`¿Eliminar ${seleccionadosAplicados.size} consejos aplicados?`)) return

    const nuevosConsejos = consejosAplicados.filter(c => !seleccionadosAplicados.has(c.id))
    setConsejosAplicados(nuevosConsejos)
    localStorage.setItem('consejosAplicados', JSON.stringify(nuevosConsejos))
    setSeleccionadosAplicados(new Set())
  }

  const cargarAnalisisGuardados = async () => {
    setCargandoGuardados(true)
    try {
      const response = await fetch('/api/advisor/analyses')
      const result = await response.json()
      if (result.success) {
        setAnalisisGuardados(result.analyses || [])
      }
    } catch (err) {
      console.error('Error cargando analisis:', err)
    } finally {
      setCargandoGuardados(false)
    }
  }

  const generarNuevoAnalisis = async () => {
    setGenerando(true)
    setError(null)
    setAnalisisActual(null)

    try {
      const url = fechaInicio && fechaFin ? `/api/advisor?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}` : `/api/advisor?periodo=${periodo}`
      const response = await fetch(url)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Error generando análisis')
      }

      setAnalisisActual(result)
    } catch (err: any) {
      setError(err.message || 'Error generando análisis')
    } finally {
      setGenerando(false)
    }
  }

  const guardarAnalisis = async () => {
    if (!analisisActual) return

    setGuardando(true)
    try {
      const response = await fetch('/api/advisor/analyses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          periodo: analisisActual.periodo,
          fechaInicio: fechaInicio,
          fechaFin: fechaFin,
          sector: analisisActual.sector,
          totalVentas: analisisActual.recomendaciones?.reduce((acc, r) => acc + (r.datosReales?.ventas || 0), 0),
          totalIngresos: analisisActual.recomendaciones?.reduce((acc, r) => acc + (r.datosReales?.ingresos || 0), 0),
          recomendaciones: analisisActual.recomendaciones,
          resumen: analisisActual.resumen
        })
      })

      const result = await response.json()
      if (!result.success) throw new Error(result.error)

      await cargarAnalisisGuardados()
      setAnalisisActual(null)
      setTabActiva('guardados')

    } catch (err: any) {
      alert('Error guardando: ' + err.message)
    } finally {
      setGuardando(false)
    }
  }

  const verDetalleAnalisis = async (id: string) => {
    setCargandoDetalle(true)
    try {
      const response = await fetch(`/api/advisor/analyses/${id}`)
      const result = await response.json()
      if (result.success) {
        setAnalisisDetalle(result.analysis)
      }
    } catch (err) {
      console.error('Error cargando detalle:', err)
    } finally {
      setCargandoDetalle(false)
    }
  }

  const toggleSeleccion = (id: string) => {
    const nuevo = new Set(seleccionados)
    if (nuevo.has(id)) {
      nuevo.delete(id)
    } else {
      nuevo.add(id)
    }
    setSeleccionados(nuevo)
  }

  const seleccionarTodos = () => {
    if (seleccionados.size === analisisGuardados.length) {
      setSeleccionados(new Set())
    } else {
      setSeleccionados(new Set(analisisGuardados.map(a => a.id)))
    }
  }

  const borrarSeleccionados = async () => {
    if (seleccionados.size === 0) return

    if (!confirm(`¿Eliminar ${seleccionados.size} análisis?`)) return

    setBorrando(true)
    try {
      const ids = Array.from(seleccionados).join(',')
      const response = await fetch(`/api/advisor/analyses?ids=${ids}`, {
        method: 'DELETE'
      })

      const result = await response.json()
      if (!result.success) throw new Error(result.error)

      setSeleccionados(new Set())
      await cargarAnalisisGuardados()

      if (analisisDetalle && seleccionados.has(analisisDetalle.id)) {
        setAnalisisDetalle(null)
      }

    } catch (err: any) {
      alert('Error borrando: ' + err.message)
    } finally {
      setBorrando(false)
    }
  }

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const traducirPeriodo = (p: string) => {
    switch(p) {
      case 'dia': return 'Día'
      case 'semana': return 'Semana'
      case 'mes': return 'Mes'
      default: return p
    }
  }

  const formatearPeriodoAnalisis = (analisis: AnalysisItem) => {
    if (analisis.fecha_inicio && analisis.fecha_fin) {
      const inicio = new Date(analisis.fecha_inicio).toLocaleDateString('es-ES', { day: 'numeric', month: 'numeric', year: 'numeric' })
      const fin = new Date(analisis.fecha_fin).toLocaleDateString('es-ES', { day: 'numeric', month: 'numeric', year: 'numeric' })
      return `${inicio} - ${fin}` 
    }
    return traducirPeriodo(analisis.periodo)
  }

  const traducirSector = (s: string) => {
    const sectores: Record<string, string> = {
      'cafeteria': 'Cafetería',
      'restaurante': 'Restaurante',
      'peluqueria': 'Peluquería',
      'taller_mecanico': 'Taller Mecánico',
      'carpinteria': 'Carpintería',
      'general': 'General'
    }
    return sectores[s] || s
  }

  const getColorPrioridad = (prioridad: number) => {
    switch (prioridad) {
      case 1: return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', badge: 'bg-red-100 text-red-800' }
      case 2: return { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-800' }
      case 3: return { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-800' }
      default: return { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700', badge: 'bg-gray-100 text-gray-800' }
    }
  }

  const getTextoPrioridad = (prioridad: number) => {
    switch (prioridad) {
      case 1: return 'Alta'
      case 2: return 'Media'
      case 3: return 'Baja'
      default: return 'Normal'
    }
  }

  // Calcular estadísticas para el badge
  const getEstadisticas = () => {
    if (tabActiva === 'guardados') {
      return { label: 'Análisis Guardados', count: analisisGuardados.length }
    } else if (tabActiva === 'aplicados') {
      return { label: 'Consejos Aplicados', count: consejosAplicados.length }
    } else {
      return { label: 'Recomendaciones', count: analisisActual?.recomendaciones?.length || 0 }
    }
  }

  const stats = getEstadisticas()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        
        {/* Header estilo Costes Fijos */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#c15f3c] flex items-center gap-3">
            <Lightbulb className="w-8 h-8" />
            Asesor IA
          </h1>
          <p className="text-gray-600 mt-1">Genera y guarda análisis de tu negocio</p>
        </div>

        {/* Barra de acciones estilo Costes Fijos */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => { setTabActiva('nuevo'); setAnalisisDetalle(null) }}
              className="flex items-center gap-2 px-4 py-2 bg-[#0d0d0d] text-white rounded-lg hover:bg-[#2d2d2d] transition-colors font-medium"
            >
              <Plus className="w-4 h-4" />
              Nuevo Análisis
            </button>
            
            <AdvisorExportButton 
              recomendaciones={analisisActual?.recomendaciones || analisisDetalle?.recomendaciones || []}
              consejosAplicados={consejosAplicados}
              periodo={analisisActual?.periodo || analisisDetalle?.periodo || 'mes'}
              sector={analisisActual?.sector || analisisDetalle?.sector || 'general'}
            />
          </div>

          {/* Badge de estadísticas */}
          <div className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-200 rounded-lg">
            <span className="text-gray-600 font-medium">{stats.label}</span>
            <span className="text-[#c15f3c] font-bold text-xl">{stats.count}</span>
          </div>
        </div>

        {/* Tabs estilo tarjetas */}
        <div className="bg-white rounded-xl border border-gray-200 mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => { setTabActiva('guardados'); setAnalisisDetalle(null) }}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 font-medium transition-colors ${
                tabActiva === 'guardados' 
                  ? 'text-[#c15f3c] border-b-2 border-[#c15f3c] bg-orange-50/50' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <FolderOpen className="w-5 h-5" />
              <span className="hidden sm:inline">Análisis Guardados</span>
              <span className="sm:hidden">Guardados</span>
            </button>
            <button
              onClick={() => { setTabActiva('nuevo'); setAnalisisDetalle(null) }}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 font-medium transition-colors ${
                tabActiva === 'nuevo' 
                  ? 'text-[#c15f3c] border-b-2 border-[#c15f3c] bg-orange-50/50' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Lightbulb className="w-5 h-5" />
              <span className="hidden sm:inline">Nuevo Análisis</span>
              <span className="sm:hidden">Nuevo</span>
            </button>
            <button
              onClick={() => setTabActiva('aplicados')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 font-medium transition-colors ${
                tabActiva === 'aplicados' 
                  ? 'text-[#c15f3c] border-b-2 border-[#c15f3c] bg-orange-50/50' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Check className="w-5 h-5" />
              <span className="hidden sm:inline">Consejos Aplicados</span>
              <span className="sm:hidden">Aplicados</span>
            </button>
          </div>
        </div>

        {/* TAB: Nuevo Análisis */}
        {tabActiva === 'nuevo' && (
          <div className="space-y-6">
            {/* Panel de configuración */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Configurar Análisis</h3>
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Período a analizar</label>
                  <DateRangePicker
                    onDateChange={(inicio, fin, dias) => {
                      setFechaInicio(inicio)
                      setFechaFin(fin)
                      setDiasSeleccionados(dias)
                    }}
                    disabled={generando}
                  />
                </div>

                <button
                  onClick={generarNuevoAnalisis}
                  disabled={generando}
                  className="flex items-center gap-2 px-6 py-3 bg-[#0d0d0d] text-white rounded-lg hover:bg-[#2d2d2d] transition-colors disabled:opacity-50 font-medium"
                >
                  {generando ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Analizando...
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5" />
                      Generar Análisis
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-red-700">{error}</p>
              </div>
            )}

            {/* Resultado del análisis */}
            {analisisActual && !analisisActual.sinRecomendaciones && (
              <div className="space-y-4">
                {/* Header del resultado */}
                <div className="bg-[#FFF8E7] rounded-xl border border-[#E8D5B5] p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Análisis Generado - {traducirSector(analisisActual.sector)}
                      </h3>
                      <p className="text-gray-600 mt-1">
                        {analisisActual.recomendaciones?.length || 0} recomendaciones encontradas
                      </p>
                    </div>
                    <button
                      onClick={guardarAnalisis}
                      disabled={guardando}
                      className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 font-medium"
                    >
                      {guardando ? 'Guardando...' : 'Guardar Análisis'}
                    </button>
                  </div>
                </div>

                {/* Lista de recomendaciones */}
                <div className="space-y-4">
                  {analisisActual.recomendaciones?.map((rec) => {
                    const colors = getColorPrioridad(rec.prioridad)
                    return (
                      <div key={rec.id} className={`bg-white rounded-xl border ${colors.border} p-5 hover:shadow-md transition-shadow`}>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colors.badge}`}>
                                Prioridad {getTextoPrioridad(rec.prioridad)}
                              </span>
                              {rec.datosReales?.tendencia !== 0 && (
                                <span className={`flex items-center gap-1 text-sm font-medium ${rec.datosReales.tendencia > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {rec.datosReales.tendencia > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                  {rec.datosReales.tendencia > 0 ? '+' : ''}{rec.datosReales.tendencia}%
                                </span>
                              )}
                            </div>
                            <h4 className="font-semibold text-gray-900 mb-2 text-lg">{rec.titulo}</h4>
                            <p className="text-gray-700 mb-4">{rec.mensaje}</p>
                            <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4 pb-4 border-b border-gray-100">
                              <span>Ventas: <span className="font-semibold text-gray-900">{rec.datosReales?.ventas || 0}</span></span>
                              <span>Ingresos: <span className="font-semibold text-green-600">€{rec.datosReales?.ingresos?.toFixed(2) || '0.00'}</span></span>
                            </div>
                            <button
                              onClick={() => aplicarConsejo(rec, { sector: analisisActual?.sector, periodo: analisisActual?.periodo })}
                              className="flex items-center gap-2 px-4 py-2 bg-[#0d0d0d] text-white rounded-lg hover:bg-[#2d2d2d] transition-colors text-sm font-medium"
                            >
                              <Check className="w-4 h-4" />
                              Marcar como Aplicado
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Sin recomendaciones */}
            {analisisActual?.sinRecomendaciones && (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lightbulb className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Sin recomendaciones</h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  {analisisActual.mensaje || 'No se detectaron oportunidades de mejora con los datos actuales del período seleccionado.'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB: Consejos Aplicados */}
        {tabActiva === 'aplicados' && (
          <div className="space-y-4">
            {/* Barra de selección */}
            {consejosAplicados.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={seleccionadosAplicados.size === consejosAplicados.length && consejosAplicados.length > 0}
                    onChange={seleccionarTodosAplicados}
                    className="w-5 h-5 rounded border-gray-300 text-[#c15f3c] focus:ring-[#c15f3c]"
                  />
                  <span className="text-gray-700">Seleccionar todos</span>
                  {seleccionadosAplicados.size > 0 && (
                    <span className="text-gray-500">({seleccionadosAplicados.size} seleccionados)</span>
                  )}
                </label>

                {seleccionadosAplicados.size > 0 && (
                  <button
                    onClick={eliminarConsejosAplicados}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                  >
                    <Trash2 className="w-4 h-4" />
                    Eliminar ({seleccionadosAplicados.size})
                  </button>
                )}
              </div>
            )}

            {/* Lista vacía */}
            {consejosAplicados.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Sin consejos aplicados</h3>
                <p className="text-gray-600 mb-6">Los consejos que apliques aparecerán aquí para hacer seguimiento</p>
                <button
                  onClick={() => setTabActiva('nuevo')}
                  className="inline-flex items-center gap-2 px-6 py-2 bg-[#0d0d0d] text-white rounded-lg hover:bg-[#2d2d2d] transition-colors font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Generar Análisis
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {consejosAplicados.map((consejo) => {
                  const colors = getColorPrioridad(consejo.prioridad)
                  return (
                    <div key={`${consejo.id}-${consejo.aplicadoEn}`} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-4">
                        <input
                          type="checkbox"
                          checked={seleccionadosAplicados.has(consejo.id)}
                          onChange={() => toggleSeleccionAplicado(consejo.id)}
                          className="w-5 h-5 rounded border-gray-300 text-[#c15f3c] focus:ring-[#c15f3c] mt-1 flex-shrink-0"
                        />
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colors.badge}`}>
                              {getTextoPrioridad(consejo.prioridad)}
                            </span>
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                              Aplicado: {formatearFecha(consejo.aplicadoEn)}
                            </span>
                          </div>
                          <h4 className="font-semibold text-gray-900 mb-2">{consejo.titulo}</h4>
                          <p className="text-gray-700 text-sm mb-3">{consejo.mensaje}</p>
                          <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                            <span className="bg-gray-50 px-2 py-1 rounded">Sector: {traducirSector(consejo.sector)}</span>
                            <span className="bg-gray-50 px-2 py-1 rounded">Período: {traducirPeriodo(consejo.periodoAnalisis)}</span>
                            <span className="bg-gray-50 px-2 py-1 rounded">Ventas: {consejo.datosReales?.ventas || 0}</span>
                            <span className="bg-green-50 text-green-700 px-2 py-1 rounded">€{consejo.datosReales?.ingresos?.toFixed(2) || '0.00'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB: Análisis Guardados - Lista */}
        {tabActiva === 'guardados' && !analisisDetalle && (
          <div className="space-y-4">
            {/* Barra de selección */}
            {analisisGuardados.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={seleccionados.size === analisisGuardados.length && analisisGuardados.length > 0}
                    onChange={seleccionarTodos}
                    className="w-5 h-5 rounded border-gray-300 text-[#c15f3c] focus:ring-[#c15f3c]"
                  />
                  <span className="text-gray-700">Seleccionar todos</span>
                  {seleccionados.size > 0 && (
                    <span className="text-gray-500">({seleccionados.size} seleccionados)</span>
                  )}
                </label>

                {seleccionados.size > 0 && (
                  <button
                    onClick={borrarSeleccionados}
                    disabled={borrando}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 font-medium"
                  >
                    <Trash2 className="w-4 h-4" />
                    {borrando ? 'Borrando...' : `Borrar (${seleccionados.size})`}
                  </button>
                )}
              </div>
            )}

            {/* Cargando */}
            {cargandoGuardados ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-4" />
                <p className="text-gray-600">Cargando análisis...</p>
              </div>
            ) : analisisGuardados.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FolderOpen className="w-8 h-8 text-[#c15f3c]" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Sin análisis guardados</h3>
                <p className="text-gray-600 mb-6">Genera tu primer análisis para empezar a recibir recomendaciones</p>
                <button
                  onClick={() => setTabActiva('nuevo')}
                  className="inline-flex items-center gap-2 px-6 py-2 bg-[#0d0d0d] text-white rounded-lg hover:bg-[#2d2d2d] transition-colors font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Crear Análisis
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {analisisGuardados.map((analisis) => (
                  <div
                    key={analisis.id}
                    className="bg-white rounded-xl border border-gray-200 p-4 hover:border-[#c15f3c] hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <input
                        type="checkbox"
                        checked={seleccionados.has(analisis.id)}
                        onChange={(e) => {
                          e.stopPropagation()
                          toggleSeleccion(analisis.id)
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-5 h-5 rounded border-gray-300 text-[#c15f3c] focus:ring-[#c15f3c] flex-shrink-0"
                      />

                      <div
                        className="flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                        onClick={() => verDetalleAnalisis(analisis.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#FFF8E7] rounded-lg flex items-center justify-center flex-shrink-0">
                            <FileText className="w-5 h-5 text-[#c15f3c]" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {formatearFecha(analisis.created_at)}
                            </p>
                            <p className="text-sm text-gray-500">
                              {formatearPeriodoAnalisis(analisis)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {analisis.num_recomendaciones || 0} recomendaciones
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: Análisis Guardados - Detalle */}
        {tabActiva === 'guardados' && analisisDetalle && (
          <div className="space-y-4">
            {/* Header del detalle */}
            <div className="bg-[#FFF8E7] rounded-xl border border-[#E8D5B5] p-6">
              <button
                onClick={() => setAnalisisDetalle(null)}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Volver a la lista
              </button>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Análisis del {formatearFecha(analisisDetalle.created_at)}
                  </h2>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="text-sm bg-white text-[#c15f3c] px-3 py-1 rounded-full border border-[#E8D5B5]">
                      Período: {traducirPeriodo(analisisDetalle.periodo)}
                    </span>
                    <span className="text-sm bg-white text-gray-600 px-3 py-1 rounded-full border border-gray-200">
                      {analisisDetalle.recomendaciones?.length || 0} recomendaciones
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Cargando detalle */}
            {cargandoDetalle ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-4" />
                <p className="text-gray-600">Cargando detalles...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {analisisDetalle.recomendaciones?.map((rec: any) => {
                  const colors = getColorPrioridad(rec.prioridad)
                  return (
                    <div key={rec.id} className={`bg-white rounded-xl border ${colors.border} p-5 hover:shadow-md transition-shadow`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colors.badge}`}>
                              Prioridad {getTextoPrioridad(rec.prioridad)}
                            </span>
                            {rec.datosReales?.tendencia !== 0 && (
                              <span className={`flex items-center gap-1 text-sm font-medium ${rec.datosReales?.tendencia > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {rec.datosReales?.tendencia > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                {rec.datosReales?.tendencia > 0 ? '+' : ''}{rec.datosReales?.tendencia}%
                              </span>
                            )}
                          </div>
                          <h4 className="font-semibold text-gray-900 mb-2 text-lg">{rec.titulo}</h4>
                          <p className="text-gray-700 mb-4">{rec.mensaje}</p>
                          <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4 pb-4 border-b border-gray-100">
                            <span>Ventas: <span className="font-semibold text-gray-900">{rec.datosReales?.ventas || 0}</span></span>
                            <span>Ingresos: <span className="font-semibold text-green-600">€{rec.datosReales?.ingresos?.toFixed(2) || '0.00'}</span></span>
                          </div>
                          <button
                            onClick={() => aplicarConsejo(rec, { sector: analisisDetalle?.sector, periodo: analisisDetalle?.periodo })}
                            className="flex items-center gap-2 px-4 py-2 bg-[#0d0d0d] text-white rounded-lg hover:bg-[#2d2d2d] transition-colors text-sm font-medium"
                          >
                            <Check className="w-4 h-4" />
                            Marcar como Aplicado
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}