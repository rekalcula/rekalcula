'use client'

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

const IconArrowLeft = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 19l-7-7 7-7"/>
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

const IconInfo = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <path d="M12 16v-4"/>
    <path d="M12 8h.01"/>
  </svg>
)

const IconCheck = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

const IconX = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18"/>
    <path d="M6 6l12 12"/>
  </svg>
)

const IconBook = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
  </svg>
)

const IconDownload = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
)

const IconBell = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
)

const IconHistory = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
    <path d="M3 3v5h5"/>
    <path d="M12 7v5l4 2"/>
  </svg>
)

const IconChart = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/>
    <line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="14"/>
  </svg>
)

// ============================================================
// TIPOS
// ============================================================
interface AdvisorResponse {
  success: boolean
  sector: string
  confianzaSector: number
  periodo: string
  recomendaciones: Recomendacion[]
  sinRecomendaciones?: boolean
  mensaje?: string
}

interface HistorialItem {
  id: string
  producto: string
  principio_nombre: string
  prioridad: number
  accion: string
  created_at: string
}

interface ImpactoItem {
  id: string
  producto: string
  principio: string
  diasTranscurridos: number
  antes: { cantidad: number; ingresos: number }
  despues: { cantidad: number; ingresos: number }
  cambio: { cantidad: number; ingresos: number }
  tendencia: string
}

interface Notificacion {
  id: string
  titulo: string
  mensaje: string
  producto: string
  tendencia: number
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
export default function AdvisorPage() {
  // Estados principales
  const [data, setData] = useState<AdvisorResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [periodo, setPeriodo] = useState<'dia' | 'semana' | 'mes'>('mes')
  const [filtroprioridad, setFiltroPrioridad] = useState<Prioridad | 'todas'>('todas')
  const [recomendacionesDescartadas, setRecomendacionesDescartadas] = useState<Set<string>>(new Set())
  const [recomendacionesAplicadas, setRecomendacionesAplicadas] = useState<Set<string>>(new Set())
  const [mostrarPrincipio, setMostrarPrincipio] = useState<string | null>(null)

  // Estados para las nuevas funcionalidades
  const [tabActiva, setTabActiva] = useState<'recomendaciones' | 'historial' | 'impacto'>('recomendaciones')
  const [historial, setHistorial] = useState<HistorialItem[]>([])
  const [estadisticasHistorial, setEstadisticasHistorial] = useState({ totalAplicadas: 0, totalDescartadas: 0 })
  const [impactos, setImpactos] = useState<ImpactoItem[]>([])
  const [resumenImpacto, setResumenImpacto] = useState<any>(null)
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([])
  const [mostrarNotificaciones, setMostrarNotificaciones] = useState(false)
  const [exportando, setExportando] = useState(false)
  const [guardando, setGuardando] = useState<string | null>(null)

  // --------------------------------------------------------
  // CARGAR DATOS
  // --------------------------------------------------------
  const cargarRecomendaciones = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/advisor?periodo=${periodo}`)
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Error desconocido')
      }
      
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando recomendaciones')
    } finally {
      setLoading(false)
    }
  }

  const cargarHistorial = async () => {
    try {
      const response = await fetch('/api/advisor/history')
      const result = await response.json()
      
      if (result.success) {
        setHistorial(result.historial || [])
        setEstadisticasHistorial(result.estadisticas || { totalAplicadas: 0, totalDescartadas: 0 })
      }
    } catch (err) {
      console.error('Error cargando historial:', err)
    }
  }

  const cargarImpacto = async () => {
    try {
      const response = await fetch('/api/advisor/impact')
      const result = await response.json()
      
      if (result.success && result.tienesDatos) {
        setImpactos(result.impactos || [])
        setResumenImpacto(result.resumen)
      }
    } catch (err) {
      console.error('Error cargando impacto:', err)
    }
  }

  const cargarNotificaciones = async () => {
    try {
      const response = await fetch('/api/advisor/notifications')
      const result = await response.json()
      
      if (result.success) {
        setNotificaciones(result.notificaciones || [])
      }
    } catch (err) {
      console.error('Error cargando notificaciones:', err)
    }
  }

  // --------------------------------------------------------
  // EFECTOS
  // --------------------------------------------------------
  useEffect(() => {
    cargarRecomendaciones()
    cargarNotificaciones()
  }, [periodo])

  useEffect(() => {
    if (tabActiva === 'historial') {
      cargarHistorial()
    } else if (tabActiva === 'impacto') {
      cargarImpacto()
    }
  }, [tabActiva])

  // --------------------------------------------------------
  // ACCIONES
  // --------------------------------------------------------
  const guardarEnHistorial = async (rec: Recomendacion, accion: 'aplicada' | 'descartada') => {
    setGuardando(rec.id)
    try {
      const response = await fetch('/api/advisor/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recomendacion: rec, accion })
      })
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error)
      }

      // Actualizar estado local
      if (accion === 'aplicada') {
        setRecomendacionesAplicadas(prev => new Set([...prev, rec.id]))
      } else {
        setRecomendacionesDescartadas(prev => new Set([...prev, rec.id]))
      }

      // Recargar historial si estamos en esa pestaña
      if (tabActiva === 'historial') {
        cargarHistorial()
      }

    } catch (err) {
      console.error('Error guardando en historial:', err)
      alert('Error guardando la acción')
    } finally {
      setGuardando(null)
    }
  }

  const exportarPDF = async () => {
    setExportando(true)
    try {
      const response = await fetch(`/api/advisor/export-pdf?periodo=${periodo}`)
      
      if (!response.ok) {
        throw new Error('Error generando informe')
      }

      const html = await response.text()
      
      // Crear blob y descargar
      const blob = new Blob([html], { type: 'text/html' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `informe-rekalcula-${periodo}.html`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      alert('Informe descargado. Ábrelo en el navegador y usa Ctrl+P para guardar como PDF.')

    } catch (err) {
      console.error('Error exportando:', err)
      alert('Error generando el informe')
    } finally {
      setExportando(false)
    }
  }

  // --------------------------------------------------------
  // FILTROS Y HELPERS
  // --------------------------------------------------------
  const recomendacionesFiltradas = data?.recomendaciones?.filter(rec => {
    if (recomendacionesDescartadas.has(rec.id)) return false
    if (filtroprioridad !== 'todas' && rec.prioridad !== Number(filtroprioridad)) return false
    return true
  }) || []

  const getColorPrioridad = (prioridad: Prioridad) => {
    switch (prioridad) {
      case 1: return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', badge: 'bg-red-100 text-red-800' }
      case 2: return { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-800' }
      case 3: return { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', badge: 'bg-green-100 text-green-800' }
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

  const traducirSector = (sector: string) => {
    const traducciones: Record<string, string> = {
      cafeteria: 'Cafetería', restaurante: 'Restaurante',
      peluqueria: 'Peluquería', tienda: 'Tienda',
      taller: 'Taller mecánico', desconocido: 'Negocio'
    }
    return traducciones[sector] || sector
  }

  // --------------------------------------------------------
  // RENDER
  // --------------------------------------------------------
  return (
      <div className="min-h-screen bg-gray-50" suppressHydrationWarning>
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href="/dashboard" 
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <IconArrowLeft />
              </Link>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <IconLightbulb />
                  Asesor de Ventas
                </h1>
                <p className="text-sm text-gray-500">
                  Recomendaciones basadas en principios científicos
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Botón de notificaciones */}
              <div className="relative">
                <button
                  onClick={() => setMostrarNotificaciones(!mostrarNotificaciones)}
                  className={`p-2 rounded-lg transition-colors relative ${
                    notificaciones.length > 0 
                      ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  <IconBell />
                  {notificaciones.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {notificaciones.length}
                    </span>
                  )}
                </button>

                {/* Dropdown de notificaciones */}
                {mostrarNotificaciones && notificaciones.length > 0 && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50">
                    <div className="p-3 border-b border-gray-100">
                      <h3 className="font-medium text-gray-900">⚠️ Alertas de Alta Prioridad</h3>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notificaciones.map(notif => (
                        <div key={notif.id} className="p-3 border-b border-gray-50 hover:bg-gray-50">
                          <p className="font-medium text-sm text-gray-900">{notif.titulo}</p>
                          <p className="text-xs text-gray-500">{notif.mensaje}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Botón exportar */}
              <button
                onClick={exportarPDF}
                disabled={exportando || !data?.recomendaciones?.length}
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 text-sm"
              >
                <IconDownload />
                {exportando ? 'Exportando...' : 'Exportar'}
              </button>

              {/* Botón actualizar */}
              <button
                onClick={cargarRecomendaciones}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-[#E07A5F] text-white rounded-lg hover:bg-[#c96a52] transition-colors disabled:opacity-50"
              >
                <span className={loading ? 'animate-spin' : ''}>
                  <IconRefresh />
                </span>
                Actualizar
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="bg-white rounded-xl border border-gray-200 mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setTabActiva('recomendaciones')}
              className={`flex items-center gap-2 px-6 py-3 font-medium text-sm transition-colors ${
                tabActiva === 'recomendaciones'
                  ? 'text-[#E07A5F] border-b-2 border-[#E07A5F]'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <IconLightbulb />
              Recomendaciones
            </button>
            <button
              onClick={() => setTabActiva('historial')}
              className={`flex items-center gap-2 px-6 py-3 font-medium text-sm transition-colors ${
                tabActiva === 'historial'
                  ? 'text-[#E07A5F] border-b-2 border-[#E07A5F]'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <IconHistory />
              Historial
              {estadisticasHistorial.totalAplicadas > 0 && (
                <span className="ml-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                  {estadisticasHistorial.totalAplicadas}
                </span>
              )}
            </button>
            <button
              onClick={() => setTabActiva('impacto')}
              className={`flex items-center gap-2 px-6 py-3 font-medium text-sm transition-colors ${
                tabActiva === 'impacto'
                  ? 'text-[#E07A5F] border-b-2 border-[#E07A5F]'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <IconChart />
              Impacto
            </button>
          </div>

          {/* Filtros (solo en tab recomendaciones) */}
          {tabActiva === 'recomendaciones' && (
            <div className="p-4 flex flex-wrap items-center gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Período</label>
                <select
                  value={periodo}
                  onChange={(e) => setPeriodo(e.target.value as 'dia' | 'semana' | 'mes')}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E07A5F]"
                >
                  <option value="dia">Hoy</option>
                  <option value="semana">Esta semana</option>
                  <option value="mes">Este mes</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Prioridad</label>
                <select
                  value={filtroprioridad}
                  onChange={(e) => setFiltroPrioridad(e.target.value as Prioridad | 'todas')}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E07A5F]"
                >
                  <option value="todas">Todas</option>
                  <option value="1">Alta</option>
                  <option value="2">Media</option>
                  <option value="3">Baja</option>
                </select>
              </div>

              {data && !loading && (
                <div className="ml-auto text-right">
                  <p className="text-xs text-gray-500">Sector detectado</p>
                  <p className="text-sm font-medium text-gray-900">
                    {traducirSector(data.sector)}
                    <span className="ml-1 text-gray-400">({data.confianzaSector}%)</span>
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ============================================================ */}
        {/* TAB: RECOMENDACIONES */}
        {/* ============================================================ */}
        {tabActiva === 'recomendaciones' && (
          <>
            {/* Estado de carga */}
            {loading && (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <div className="animate-spin w-8 h-8 border-4 border-[#E07A5F] border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-500">Analizando tus datos de ventas...</p>
              </div>
            )}

            {/* Error */}
            {error && !loading && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                <p className="text-red-700 font-medium mb-2">Error al cargar recomendaciones</p>
                <p className="text-red-600 text-sm">{error}</p>
                <button
                  onClick={cargarRecomendaciones}
                  className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                >
                  Reintentar
                </button>
              </div>
            )}

            {/* Sin recomendaciones */}
            {data?.sinRecomendaciones && !loading && (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <IconLightbulb />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Sin recomendaciones por ahora</h3>
                <p className="text-gray-500 max-w-md mx-auto">{data.mensaje}</p>
                <Link
                  href="/dashboard/sales/upload"
                  className="inline-block mt-6 px-6 py-3 bg-[#E07A5F] text-white rounded-lg hover:bg-[#c96a52] transition-colors"
                >
                  Subir tickets de venta
                </Link>
              </div>
            )}

            {/* Lista de recomendaciones */}
            {!loading && !error && recomendacionesFiltradas.length > 0 && (
              <>
                <div className="mb-4 text-sm text-gray-500">
                  {recomendacionesFiltradas.length} recomendación{recomendacionesFiltradas.length !== 1 ? 'es' : ''} disponible{recomendacionesFiltradas.length !== 1 ? 's' : ''}
                </div>

                <div className="space-y-4">
                  {recomendacionesFiltradas.map((rec) => {
                    const colors = getColorPrioridad(rec.prioridad)
                    const aplicada = recomendacionesAplicadas.has(rec.id)
                    const estaGuardando = guardando === rec.id
                    
                    return (
                      <div
                        key={rec.id}
                        className={`bg-white rounded-xl border-2 ${aplicada ? 'border-green-300 bg-green-50' : colors.border} overflow-hidden transition-all`}
                      >
                        {/* Header */}
                        <div className={`px-5 py-3 ${aplicada ? 'bg-green-100' : colors.bg} border-b ${aplicada ? 'border-green-200' : colors.border}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${aplicada ? 'bg-green-200 text-green-800' : colors.badge}`}>
                                {aplicada ? '✓ Aplicada' : `Prioridad ${getTextoPrioridad(rec.prioridad)}`}
                              </span>
                              {rec.datosReales.tendencia !== 0 && (
                                <span className={`flex items-center gap-1 text-xs ${rec.datosReales.tendencia > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {rec.datosReales.tendencia > 0 ? <IconTrendingUp /> : <IconTrendingDown />}
                                  {rec.datosReales.tendencia > 0 ? '+' : ''}{rec.datosReales.tendencia}%
                                </span>
                              )}
                            </div>
                            
                            <button
                              onClick={() => setMostrarPrincipio(mostrarPrincipio === rec.id ? null : rec.id)}
                              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                              title="Ver principio científico"
                            >
                              <IconInfo />
                            </button>
                          </div>
                        </div>

                        {/* Contenido */}
                        <div className="p-5">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">{rec.titulo}</h3>
                          <p className="text-gray-600 mb-4 leading-relaxed">{rec.mensaje}</p>

                          {/* Datos */}
                          <div className="flex flex-wrap gap-4 mb-4 text-sm">
                            <div className="bg-gray-50 px-3 py-2 rounded-lg">
                              <span className="text-gray-500">Ventas:</span>
                              <span className="ml-1 font-medium text-gray-900">{rec.datosReales.ventas}</span>
                              <span className="text-gray-400 ml-1">(media: {Math.round(rec.datosReales.mediaVentas)})</span>
                            </div>
                            <div className="bg-gray-50 px-3 py-2 rounded-lg">
                              <span className="text-gray-500">Ingresos:</span>
                              <span className="ml-1 font-medium text-gray-900">€{rec.datosReales.ingresos.toFixed(2)}</span>
                            </div>
                          </div>

                          {/* Principio científico */}
                          {mostrarPrincipio === rec.id && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                              <div className="flex items-start gap-2">
                                <IconBook />
                                <div>
                                  <h4 className="font-medium text-blue-900">Principio de {rec.principio.nombre}</h4>
                                  <p className="text-sm text-blue-700 mt-1">{rec.principio.autor} ({rec.principio.año})</p>
                                  {rec.principio.publicacion && (
                                    <p className="text-xs text-blue-600 mt-1 italic">{rec.principio.publicacion}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Acciones */}
                          {!aplicada && (
                            <div className="flex gap-2 pt-2 border-t border-gray-100">
                              <button
                                onClick={() => guardarEnHistorial(rec, 'aplicada')}
                                disabled={estaGuardando}
                                className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium disabled:opacity-50"
                              >
                                <IconCheck />
                                {estaGuardando ? 'Guardando...' : 'Marcar aplicada'}
                              </button>
                              <button
                                onClick={() => guardarEnHistorial(rec, 'descartada')}
                                disabled={estaGuardando}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors text-sm disabled:opacity-50"
                              >
                                <IconX />
                                Descartar
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </>
        )}

        {/* ============================================================ */}
        {/* TAB: HISTORIAL */}
        {/* ============================================================ */}
        {tabActiva === 'historial' && (
          <div className="space-y-4">
            {/* Estadísticas */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                <p className="text-2xl font-bold text-gray-900">{estadisticasHistorial.totalAplicadas}</p>
                <p className="text-sm text-gray-500">Aplicadas</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                <p className="text-2xl font-bold text-gray-900">{estadisticasHistorial.totalDescartadas}</p>
                <p className="text-sm text-gray-500">Descartadas</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {estadisticasHistorial.totalAplicadas + estadisticasHistorial.totalDescartadas}
                </p>
                <p className="text-sm text-gray-500">Total</p>
              </div>
            </div>

            {/* Lista de historial */}
            {historial.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                <IconHistory />
                <h3 className="text-lg font-medium text-gray-900 mt-4 mb-2">Sin historial aún</h3>
                <p className="text-gray-500">Cuando apliques o descartes recomendaciones, aparecerán aquí.</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Principio</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acción</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {historial.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.producto}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{item.principio_nombre}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            item.accion === 'aplicada' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {item.accion === 'aplicada' ? '✓ Aplicada' : '✗ Descartada'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {new Date(item.created_at).toLocaleDateString('es-ES')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB: IMPACTO */}
        {/* ============================================================ */}
        {tabActiva === 'impacto' && (
          <div className="space-y-6">
            {/* Resumen */}
            {resumenImpacto && (
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                  <p className="text-2xl font-bold text-blue-600">{resumenImpacto.totalRecomendacionesAplicadas}</p>
                  <p className="text-sm text-gray-500">Aplicadas</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                  <p className="text-2xl font-bold text-green-600">{resumenImpacto.mejoradas}</p>
                  <p className="text-sm text-gray-500">Mejoradas</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                  <p className="text-2xl font-bold text-red-600">{resumenImpacto.empeoradas}</p>
                  <p className="text-sm text-gray-500">Empeoradas</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                  <p className={`text-2xl font-bold ${resumenImpacto.promedioMejora >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {resumenImpacto.promedioMejora > 0 ? '+' : ''}{resumenImpacto.promedioMejora}%
                  </p>
                  <p className="text-sm text-gray-500">Promedio</p>
                </div>
              </div>
            )}

            {/* Gráfico de impacto */}
            {impactos.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                <IconChart />
                <h3 className="text-lg font-medium text-gray-900 mt-4 mb-2">Sin datos de impacto</h3>
                <p className="text-gray-500">Aplica algunas recomendaciones y espera unos días para ver el impacto en tus ventas.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {impactos.map((impacto) => (
                  <div key={impacto.id} className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-gray-900">{impacto.producto}</h3>
                        <p className="text-sm text-gray-500">
                          {impacto.principio} • Hace {impacto.diasTranscurridos} días
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        impacto.tendencia === 'positiva' 
                          ? 'bg-green-100 text-green-700'
                          : impacto.tendencia === 'negativa'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gray-100 text-gray-600'
                      }`}>
                        {impacto.cambio.cantidad > 0 ? '+' : ''}{impacto.cambio.cantidad}%
                      </span>
                    </div>

                    {/* Barras comparativas */}
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Antes: {impacto.antes.cantidad} ventas</span>
                          <span>€{impacto.antes.ingresos.toFixed(2)}</span>
                        </div>
                        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gray-400 rounded-full"
                            style={{ width: `${Math.min(100, (impacto.antes.cantidad / Math.max(impacto.antes.cantidad, impacto.despues.cantidad)) * 100)}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Después: {impacto.despues.cantidad} ventas</span>
                          <span>€{impacto.despues.ingresos.toFixed(2)}</span>
                        </div>
                        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              impacto.tendencia === 'positiva' ? 'bg-green-500' : 
                              impacto.tendencia === 'negativa' ? 'bg-red-500' : 'bg-gray-400'
                            }`}
                            style={{ width: `${Math.min(100, (impacto.despues.cantidad / Math.max(impacto.antes.cantidad, impacto.despues.cantidad)) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer educativo */}
        {tabActiva === 'recomendaciones' && !loading && !error && !data?.sinRecomendaciones && (
          <div className="mt-8 bg-gray-100 rounded-xl p-6">
            <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
              <IconBook />
              Sobre las recomendaciones
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Todas las recomendaciones están basadas en principios de psicología del consumidor 
              con respaldo científico (Cialdini, Kahneman, Tversky, Iyengar, etc.). 
              El sistema analiza tus datos reales de ventas y aplica estos principios 
              para sugerir acciones concretas. Ninguna recomendación es inventada ni promete 
              resultados específicos.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}