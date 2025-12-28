'use client'
import DateRangePicker from '@/components/DateRangePicker'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Recomendacion, Prioridad } from '@/lib/advisor/types'

// ============================================================
// ICONOS SVG
// ============================================================
const IconRefresh = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/>
    <path d="M21 3v5h-5"/>
  </svg>
)

const IconLightbulb = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/>
    <path d="M9 18h6"/>
    <path d="M10 22h4"/>
  </svg>
)

const IconTrendingUp = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
    <polyline points="17 6 23 6 23 12"/>
  </svg>
)

const IconTrendingDown = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/>
    <polyline points="17 18 23 18 23 12"/>
  </svg>
)

const IconTrash = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18"/>
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
  </svg>
)

const IconFolder = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
  </svg>
)

const IconPlay = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="5 3 19 12 5 21 5 3"/>
  </svg>
)

const IconCheck = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

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
  
  // Estados para consejos aplicados
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
    
    // Cambiar a la pestaa de aplicados
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
    
    if (!confirm(`Eliminar ${seleccionadosAplicados.size} consejos aplicados?`)) return

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
      console.error('Error cargando Análisis:', err)
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
        throw new Error(result.error || 'Error generando Análisis')
      }

      setAnalisisActual(result)
    } catch (err: any) {
      setError(err.message || 'Error generando Análisis')
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

    if (!confirm(`Eliminar ${seleccionados.size} Análisis?`)) return

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
      case 'dia': return 'Da'
      case 'semana': return 'Semana'
      case 'mes': return 'Mes'
      default: return p
    }
  }

  const traducirSector = (s: string) => {
    const sectores: Record<string, string> = {
      'cafeteria': 'Cafetera',
      'restaurante': 'Restaurante',
      'peluqueria': 'Peluquera',
      'taller_mecanico': 'Taller Mecnico',
      'carpinteria': 'Carpintera',
      'general': 'General'
    }
    return sectores[s] || s
  }

  const getColorPrioridad = (prioridad: number) => {
    switch (prioridad) {
      case 1: return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', badge: 'bg-red-100 text-red-800' }
      case 2: return { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-800' }
      case 3: return { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-800' }
      default: return { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-[#FFFCFF]', badge: 'bg-gray-100 text-gray-800' }
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

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 bg-[#262626] min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#d98c21] flex items-center gap-2">
            <span className="text-2xl"></span> <span className="text-[#d98c21]">Asesor IA</span>
          </h1>
          <p className="text-xl text-[#FFFCFF] mt-1">Genera y guarda Análisis de tu negocio
          </p>
        </div>
      </div>

      <div className="bg-[#262626] rounded-xl mb-6 overflow-hidden">
        <div className="flex flex-col sm:flex-row gap-3 p-4 bg-[#262626]">
          <button
            onClick={() => { setTabActiva('guardados'); setAnalisisDetalle(null) }}
            className={`flex items-center gap-2 px-4 sm:px-6 py-3 font-medium text-xl transition-colors ${
              tabActiva === 'guardados' ? 'bg-[#0d0d0d] text-[#979797]' : 'text-[#979797] hover:bg-[#2d2d2d]'
            }`}
          >
            <IconFolder />
            Análisis Guardados
            {analisisGuardados.length > 0 && (
              <span className="bg-gray-100 text-[#ACACAC] px-2 py-0.5 rounded-full text-xs">
                {analisisGuardados.length}
              </span>
            )}
          </button>
          <button
            onClick={() => { setTabActiva('nuevo'); setAnalisisDetalle(null) }}
            className={`flex items-center gap-2 px-4 sm:px-6 py-3 font-medium text-xl transition-colors ${
              tabActiva === 'nuevo' ? 'bg-[#0d0d0d] text-[#979797]' : 'text-[#979797] hover:bg-[#2d2d2d]'
            }`}
          >
            <IconLightbulb />
            Nuevo Análisis
          </button>
          <button
            onClick={() => setTabActiva('aplicados')}
            className={`flex items-center gap-2 px-4 sm:px-6 py-3 font-medium text-xl transition-colors ${
              tabActiva === 'aplicados' ? 'bg-[#0d0d0d] text-[#979797]' : 'text-[#979797] hover:bg-[#2d2d2d]'
            }`}
          >
            <IconCheck />
            Consejos Aplicados
            {consejosAplicados.length > 0 && (
              <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs">
                {consejosAplicados.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {tabActiva === 'nuevo' && (
        <div className="space-y-6">
          <div className="bg-[#262626] rounded-xl p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-[#FFFCFF] mb-4">Configurar Análisis</h2>

            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
              <div>
                <label className="block text-xl font-medium text-[#FFFCFF] mb-1">Perodo a analizar</label>
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
                className="flex items-center gap-2 px-6 py-2 bg-[#0d0d0d] text-white rounded-lg hover:bg-[#2d2d2d] transition-colors disabled:opacity-50 font-medium"
              >
                {generando ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Analizando...
                  </>
                ) : (
                  <>
                    <IconPlay />
                    Generar Análisis
                  </>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-red-700"> {error}</p>
            </div>
          )}

          {analisisActual && !analisisActual.sinRecomendaciones && (
            <div className="space-y-4">
              <div className="bg-[#262626] rounded-xl p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-[#FFFCFF]">
                      Análisis Generado - {traducirSector(analisisActual.sector)}
                    </h3>
                    <p className="text-xl text-[#ACACAC]">
                      {analisisActual.recomendaciones?.length || 0} recomendaciones encontradas
                    </p>
                  </div>
                  <button
                    onClick={guardarAnalisis}
                    disabled={guardando}
                    className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 font-medium"
                  >
                    {guardando ? 'Guardando...' : ' Guardar Análisis'}
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {analisisActual.recomendaciones?.map((rec) => {
                  const colors = getColorPrioridad(rec.prioridad)
                  return (
                    <div key={rec.id} className={`${colors.bg} border ${colors.border} rounded-xl p-4 sm:p-5`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors.badge}`}>
                              {getTextoPrioridad(rec.prioridad)}
                            </span>
                            {rec.datosReales?.tendencia !== 0 && (
                              <span className={`flex items-center gap-1 text-xs ${rec.datosReales.tendencia > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {rec.datosReales.tendencia > 0 ? <IconTrendingUp /> : <IconTrendingDown />}
                                {rec.datosReales.tendencia > 0 ? '+' : ''}{rec.datosReales.tendencia}%
                              </span>
                            )}
                          </div>
                          <h4 className="font-semibold text-[#262626] mb-2">{rec.titulo}</h4>
                          <p className="text-sm text-gray-800 mb-3">{rec.mensaje}</p>
                          <div className="flex flex-wrap gap-4 text-xs text-[#ACACAC] mb-3">
                            <span>Ventas: {rec.datosReales?.ventas || 0}</span>
                            <span>Ingresos: {rec.datosReales?.ingresos?.toFixed(2) || '0.00'}</span>
                          </div>
                          <button
                            onClick={() => aplicarConsejo(rec, { sector: analisisDetalle?.sector, periodo: analisisDetalle?.periodo })}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xl font-medium"
                          >
                            <IconCheck />
                            Aplicar
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {analisisActual?.sinRecomendaciones && (
            <div className="bg-[#262626] rounded-xl p-8 text-center">
              <IconLightbulb />
              <h3 className="text-lg font-medium text-[#FFFCFF] mt-4 mb-2">Sin recomendaciones</h3>
              <p className="text-xl text-[#ACACAC]">
                <strong>Requisito mnimo:</strong> Se necesitan al menos <strong>15 das de datos de ventas</strong> para realizar un Análisis cientficamente vlido y detectar tendencias significativas.
              </p>
              </div>
          )}
        </div>
      )}

      {tabActiva === 'aplicados' && (
        <div className="space-y-4">
          {consejosAplicados.length > 0 && (
            <div className="bg-[#262626] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={seleccionadosAplicados.size === consejosAplicados.length && consejosAplicados.length > 0}
                    onChange={seleccionarTodosAplicados}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <span className="text-xl text-[#ACACAC]">Seleccionar todos</span>
                </label>
                {seleccionadosAplicados.size > 0 && (
                  <span className="text-xl text-[#ACACAC]">
                    ({seleccionadosAplicados.size} seleccionados)
                  </span>
                )}
              </div>

              {seleccionadosAplicados.size > 0 && (
                <button
                  onClick={eliminarConsejosAplicados}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-xl font-medium"
                >
                  <IconTrash />
                  Eliminar ({seleccionadosAplicados.size})
                </button>
              )}
            </div>
          )}

          {consejosAplicados.length === 0 ? (
            <div className="bg-[#262626] rounded-xl p-8 text-center">
              <IconCheck />
              <h3 className="text-lg font-medium text-[#FFFCFF] mt-4 mb-2">Sin consejos aplicados</h3>
              <p className="text-[#ACACAC] text-[20px] mb-4">Los consejos que apliques aparecern aqu</p>
              <button
                onClick={() => setTabActiva('nuevo')}
                className="px-6 py-2 bg-[#0d0d0d] text-white rounded-lg hover:bg-[#2d2d2d] transition-colors font-medium"
              >
                Generar Análisis
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {consejosAplicados.map((consejo) => {
                const colors = getColorPrioridad(consejo.prioridad)
                return (
                  <div key={`${consejo.id}-${consejo.aplicadoEn}`} className="bg-[#262626] rounded-xl p-4">
                    <div className="flex items-start gap-4">
                      <input
                        type="checkbox"
                        checked={seleccionadosAplicados.has(consejo.id)}
                        onChange={() => toggleSeleccionAplicado(consejo.id)}
                        className="w-4 h-4 rounded border-gray-300 mt-1 flex-shrink-0"
                      />
                      <div className={`flex-1 ${colors.bg} border ${colors.border} rounded-lg p-4`}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors.badge}`}>
                            {getTextoPrioridad(consejo.prioridad)}
                          </span>
                          <span className="text-xs text-[#ACACAC]">
                            Aplicado: {formatearFecha(consejo.aplicadoEn)}
                          </span>
                        </div>
                        <h4 className="font-semibold text-[#262626] mb-2">{consejo.titulo}</h4>
                        <p className="text-sm text-gray-800 mb-3">{consejo.mensaje}</p>
                        <div className="flex flex-wrap gap-4 text-xs text-[#ACACAC]">
                          <span>Sector: {traducirSector(consejo.sector)}</span>
                          <span>Perodo: {traducirPeriodo(consejo.periodoAnalisis)}</span>
                          <span>Ventas: {consejo.datosReales?.ventas || 0}</span>
                          <span>Ingresos: {consejo.datosReales?.ingresos?.toFixed(2) || '0.00'}</span>
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

      {tabActiva === 'guardados' && !analisisDetalle && (
        <div className="space-y-4">
          {analisisGuardados.length > 0 && (
            <div className="bg-[#262626] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={seleccionados.size === analisisGuardados.length && analisisGuardados.length > 0}
                    onChange={seleccionarTodos}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <span className="text-xl text-[#ACACAC]">Seleccionar todos</span>
                </label>
                {seleccionados.size > 0 && (
                  <span className="text-xl text-[#ACACAC]">
                    ({seleccionados.size} seleccionados)
                  </span>
                )}
              </div>

              {seleccionados.size > 0 && (
                <button
                  onClick={borrarSeleccionados}
                  disabled={borrando}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 text-xl font-medium"
                >
                  <IconTrash />
                  {borrando ? 'Borrando...' : `Borrar (${seleccionados.size})`}
                </button>
              )}
            </div>
          )}

          {cargandoGuardados ? (
            <div className="bg-[#262626] rounded-xl p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="text-[#ACACAC] mt-4">Cargando Análisis...</p>
            </div>
          ) : analisisGuardados.length === 0 ? (
            <div className="bg-[#262626] rounded-xl p-8 text-center">
              <IconFolder />
              <h3 className="text-lg font-medium text-[#FFFCFF] mt-4 mb-2">Sin Análisis guardados</h3>
              <p className="text-[#ACACAC] text-[20px] mb-4">Genera tu primer Análisis para empezar</p>
              <button
                onClick={() => setTabActiva('nuevo')}
                className="px-6 py-2 bg-[#0d0d0d] text-white rounded-lg hover:bg-[#2d2d2d] transition-colors font-medium"
              >
                Crear Análisis
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {analisisGuardados.map((analisis) => (
                <div
                  key={analisis.id}
                  className="bg-[#262626] rounded-xl p-4 hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <input
                      type="checkbox"
                      checked={seleccionados.has(analisis.id)}
                      onChange={() => toggleSeleccion(analisis.id)}
                      className="w-4 h-4 rounded border-gray-300 flex-shrink-0"
                    />

                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => verDetalleAnalisis(analisis.id)}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                          <h3 className="font-medium text-[#FFFCFF]">
                            Análisis #{analisisGuardados.length - analisisGuardados.indexOf(analisis)}
                          </h3>
                          <p className="text-xl text-[#ACACAC]">
                            {formatearFecha(analisis.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tabActiva === 'guardados' && analisisDetalle && (
        <div className="space-y-4">
          <div className="bg-[#262626] rounded-xl p-4 sm:p-6">
            <button
              onClick={() => setAnalisisDetalle(null)}
              className="text-xl text-[#ACACAC] hover:text-[#FFFCFF] mb-4 flex items-center gap-1"
            >
               Volver a la lista
            </button>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-[#FFFCFF]">
                  Análisis del {formatearFecha(analisisDetalle.created_at)}
                </h2>
                <div className="flex flex-wrap gap-2 mt-2 text-xl">
                  <span className="bg-gray-100 text-[#ACACAC] px-2 py-1 rounded">
                    Perodo: {traducirPeriodo(analisisDetalle.periodo)}
                  </span>
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">
                    Sector: {traducirSector(analisisDetalle.sector)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {cargandoDetalle ? (
            <div className="bg-[#262626] rounded-xl p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="text-[#ACACAC] mt-4">Cargando detalles...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xl text-[#ACACAC]">
                {analisisDetalle.recomendaciones?.length || 0} recomendaciones
              </p>

              {analisisDetalle.recomendaciones?.map((rec: any) => {
                const colors = getColorPrioridad(rec.prioridad)
                return (
                  <div key={rec.id} className={`${colors.bg} border ${colors.border} rounded-xl p-4 sm:p-5`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors.badge}`}>
                            {getTextoPrioridad(rec.prioridad)}
                          </span>
                          {rec.datosReales?.tendencia !== 0 && (
                            <span className={`flex items-center gap-1 text-xs ${rec.datosReales?.tendencia > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {rec.datosReales?.tendencia > 0 ? <IconTrendingUp /> : <IconTrendingDown />}
                              {rec.datosReales?.tendencia > 0 ? '+' : ''}{rec.datosReales?.tendencia}%
                            </span>
                          )}
                        </div>
                        <h4 className="font-semibold text-[#262626] mb-2">{rec.titulo}</h4>
                        <p className="text-sm text-gray-800 mb-3">{rec.mensaje}</p>
                        <div className="flex flex-wrap gap-4 text-xs text-[#ACACAC]">
                          <span>Ventas: {rec.datosReales?.ventas || 0}</span>
                          <span>Ingresos: {rec.datosReales?.ingresos?.toFixed(2) || '0.00'}</span>
                        </div>
                        <button
                          onClick={() => aplicarConsejo(rec, { sector: analisisDetalle?.sector, periodo: analisisDetalle?.periodo })}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xl font-medium mt-3"
                        >
                          <IconCheck />
                          Aplicar
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
  )
}
