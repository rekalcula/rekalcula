'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import DashboardNav from '@/components/DashboardNav'
import BusinessResultSummary from '@/components/BusinessResultSummary'
import WaterfallChart from '@/components/WaterfallChart'
import ConfirmDialog from '@/components/ConfirmDialog'
import { 
  IconRefresh, 
  IconLightbulb,
  IconBarChart,
  IconFolderOpen,
  IconTrash,
  IconChevronLeft,
  IconPlus,
  IconFileText
} from '@/components/Icons'

interface BusinessResultData {
  periodo: string
  ingresosBrutos: number
  ivaRepercutido: number
  baseImponibleIngresos: number
  costosVariables: number
  costosFijos: number
  gastosFacturas: number
  ivaSoportado: number
  totalCostos: number
  margenBruto: number
  margenBrutoPorcentaje: number
  beneficioOperativo: number
  ivaAIngresar: number
  irpfEstimado: number
  impuestoSociedadesEstimado: number
  totalCargaFiscal: number
  reservaFiscalRecomendada: number
  beneficioNetoReal: number
  beneficioNetoPorcentaje: number
  cobradoReal: number
  pagadoReal: number
  balanceCaja: number
  pendienteCobro: number
  pendientePago: number
  diasCobertura: number
  configFiscal: {
    tipoEntidad: string
    regimenFiscal: string
    porcentajeIva: number
    porcentajeIrpf: number
    porcentajeIS: number
  }
  waterfallData: Array<{
    name: string
    value: number
    type: 'income' | 'expense' | 'subtotal' | 'total'
    cumulative: number
  }>
}

interface AnalysisItem {
  id: string
  created_at: string
  periodo: string
  fecha_inicio?: string
  fecha_fin?: string
  ingresos_brutos: number
  total_costos: number
  beneficio_neto_real: number
  tipo_entidad: string
}

interface AnalysisDetail {
  id: string
  created_at: string
  periodo: string
  fecha_inicio?: string
  fecha_fin?: string
  ingresos_brutos: number
  total_costos: number
  beneficio_neto_real: number
  tipo_entidad: string
  analysis_data: BusinessResultData
}

export default function ResultadoPage() {
  const { user } = useUser()
  const [tabActiva, setTabActiva] = useState<'guardados' | 'nuevo'>('guardados')
  const [generando, setGenerando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [analisisActual, setAnalisisActual] = useState<BusinessResultData | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  const [analisisGuardados, setAnalisisGuardados] = useState<AnalysisItem[]>([])
  const [cargandoGuardados, setCargandoGuardados] = useState(true)
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set())
  const [borrando, setBorrando] = useState(false)
  
  const [analisisDetalle, setAnalisisDetalle] = useState<AnalysisDetail | null>(null)
  const [cargandoDetalle, setCargandoDetalle] = useState(false)

  // Estado para ConfirmDialog
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    cargarAnalisisGuardados()
  }, [])

  const cargarAnalisisGuardados = async () => {
    setCargandoGuardados(true)
    try {
      const response = await fetch('/api/business-result/analyses')
      const result = await response.json()
      if (result.success) {
        setAnalisisGuardados(result.analyses || [])
      }
    } catch (err) {
      console.error('Error cargando análisis guardados:', err)
    } finally {
      setCargandoGuardados(false)
    }
  }

  const generarNuevoAnalisis = async () => {
    setGenerando(true)
    setError(null)
    setAnalisisActual(null)

    try {
      const response = await fetch('/api/business-result')
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Error generando análisis')
      }

      setAnalisisActual(result.data)
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
      const response = await fetch('/api/business-result/analyses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysisData: analisisActual
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
      const response = await fetch(`/api/business-result/analyses/${id}`)
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
    setBorrando(true)
    try {
      const ids = Array.from(seleccionados).join(',')
      const response = await fetch(`/api/business-result/analyses?ids=${ids}`, {
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

  const getTipoEntidadLabel = (tipo: string) => {
    switch (tipo) {
      case 'autonomo': return 'Autonomo'
      case 'sl': return 'Sociedad Limitada'
      case 'sa': return 'Sociedad Anonima'
      default: return tipo
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  // Datos a mostrar (análisis actual o detalle guardado)
  const dataToDisplay = analisisDetalle?.analysis_data || analisisActual
  const fechaCreacion = analisisDetalle?.created_at || (analisisActual ? new Date().toISOString() : null)

  // Estadísticas para el badge
  const stats = {
    label: 'Análisis Guardados',
    count: analisisGuardados.length
  }

  return (
    <>
      <DashboardNav />
      <div className="min-h-screen bg-[#262626]">
        <div className="max-w-6xl mx-auto px-4 py-8">
          
          {/* ========================================
              HEADER
              ======================================== */}
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#D98C21] flex items-center gap-3">
              <IconBarChart size={32} />
              Resultado de la Empresa
            </h1>
            <p className="text-white mt-1">Genera y guarda análisis de resultados</p>
          </div>

          {/* ========================================
              BARRA DE ACCIONES
              ======================================== */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => { setTabActiva('nuevo'); setAnalisisDetalle(null) }}
                className="flex items-center gap-2 px-4 py-2 bg-[#0d0d0d] text-white rounded-lg hover:bg-[#2d2d2d] transition-colors font-medium"
              >
                <IconPlus size={16} />
                Nuevo Análisis
              </button>
            </div>

            {/* Badge de estadísticas */}
            <div className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] border-2 border-[#3a3a3a] rounded-lg">
              <span className="text-gray-300 font-medium">{stats.label}</span>
              <span className="text-[#D98C21] font-bold text-xl">{stats.count}</span>
            </div>
          </div>

          {/* ========================================
              TABS
              ======================================== */}
          <div className="bg-[#1a1a1a] rounded-xl border border-[#3a3a3a] mb-6">
            <div className="flex border-b border-[#3a3a3a]">
              <button
                onClick={() => { setTabActiva('guardados'); setAnalisisDetalle(null) }}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 font-medium transition-colors ${
                  tabActiva === 'guardados' 
                    ? 'text-[#D98C21] border-b-2 border-[#D98C21] bg-[#2a2a2a]' 
                    : 'text-gray-400 hover:text-white hover:bg-[#2a2a2a]'
                }`}
              >
                <IconFolderOpen size={20} />
                <span className="hidden sm:inline">Análisis Guardados</span>
                <span className="sm:hidden">Guardados</span>
              </button>
              <button
                onClick={() => { setTabActiva('nuevo'); setAnalisisDetalle(null) }}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 font-medium transition-colors ${
                  tabActiva === 'nuevo' 
                    ? 'text-[#D98C21] border-b-2 border-[#D98C21] bg-[#2a2a2a]' 
                    : 'text-gray-400 hover:text-white hover:bg-[#2a2a2a]'
                }`}
              >
                <IconLightbulb size={20} />
                <span className="hidden sm:inline">Nuevo Análisis</span>
                <span className="sm:hidden">Nuevo</span>
              </button>
            </div>
          </div>

          {/* ========================================
              TAB: NUEVO ANÁLISIS
              ======================================== */}
          {tabActiva === 'nuevo' && (
            <div className="space-y-6">
              {/* Panel de configuración */}
              <div className="bg-[#1a1a1a] rounded-xl border border-[#3a3a3a] p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Configurar Análisis</h3>
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
                  <div className="flex-1">
                    <p className="text-sm text-gray-400 mb-2">
                      Se generará un análisis completo del mes actual con todos los datos disponibles
                    </p>
                  </div>

                  <button
                    onClick={generarNuevoAnalisis}
                    disabled={generando}
                    className="flex items-center gap-2 px-6 py-3 bg-[#0d0d0d] text-white rounded-lg hover:bg-[#3d3d3d] transition-colors disabled:opacity-50 font-medium border border-[#4a4a4a]"
                  >
                    {generando ? (
                      <>
                        <IconRefresh size={20} className="animate-spin" />
                        Generando...
                      </>
                    ) : (
                      <>
                        <IconBarChart size={20} />
                        Generar Análisis
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-900/30 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              {/* Resultado del análisis */}
              {analisisActual && (
                <div className="space-y-4">
                  {/* Header del resultado */}
                  <div className="bg-[#1a1a1a] rounded-xl border border-[#3a3a3a] p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          Análisis Generado - {analisisActual.periodo}
                        </h3>
                        <p className="text-gray-400 mt-1 text-sm">
                          Régimen: {getTipoEntidadLabel(analisisActual.configFiscal.tipoEntidad)} | 
                          IVA: {analisisActual.configFiscal.porcentajeIva}%
                          {analisisActual.configFiscal.tipoEntidad === 'autonomo' && ` | IRPF: ${analisisActual.configFiscal.porcentajeIrpf}%`}
                          {(analisisActual.configFiscal.tipoEntidad === 'sl' || analisisActual.configFiscal.tipoEntidad === 'sa') && 
                            ` | IS: ${analisisActual.configFiscal.porcentajeIS}%`}
                        </p>
                      </div>
                      <button
                        onClick={guardarAnalisis}
                        disabled={guardando}
                        className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 font-medium"
                      >
                        {guardando ? 'Guardando...' : '💾 Guardar Análisis'}
                      </button>
                    </div>
                  </div>

                  {/* Visualización del análisis */}
                  <div className="space-y-8">
                    <section>
                      <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                        <span className="text-2xl">📊</span>
                        Panel de Control
                      </h2>
                      <BusinessResultSummary data={analisisActual} loading={false} />
                    </section>

                    <section>
                      <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                        <span className="text-2xl">📈</span>
                        Desglose del Resultado
                      </h2>
                      <WaterfallChart data={analisisActual.waterfallData} loading={false} />
                    </section>

                    {/* Nota informativa */}
                    <div className="bg-[#1a1a1a] rounded-xl p-6 border border-gray-700">
                      <h3 className="text-[#d98c21] font-semibold mb-3 flex items-center gap-2">
                        <span className="text-xl">💡</span>
                        Sobre estos cálculos
                      </h3>
                      <div className="text-gray-400 text-sm space-y-2">
                        <p>
                          • El <strong className="text-white">Beneficio Neto Real</strong> es lo que realmente 
                          te queda después de pagar todos los gastos e impuestos estimados.
                        </p>
                        <p>
                          • La <strong className="text-white">Reserva Fiscal</strong> es el importe que deberías 
                          apartar para pagar IVA trimestral, IRPF o Impuesto de Sociedades.
                        </p>
                        <p>
                          • Los <strong className="text-white">Días de Cobertura</strong> indican cuántos días 
                          podrías mantener tus gastos actuales con la liquidez disponible.
                        </p>
                        <p>
                          • Los cálculos fiscales son <strong className="text-white">estimaciones</strong> basadas 
                          en tu configuración. Consulta con un asesor para cálculos exactos.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================
              TAB: ANÁLISIS GUARDADOS - LISTA
              ======================================== */}
          {tabActiva === 'guardados' && !analisisDetalle && (
            <div className="space-y-4">
              {/* Barra de selección */}
              {analisisGuardados.length > 0 && (
                <div className="bg-[#1a1a1a] rounded-xl border border-[#3a3a3a] p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={seleccionados.size === analisisGuardados.length && analisisGuardados.length > 0}
                      onChange={seleccionarTodos}
                      className="w-5 h-5 rounded border-gray-600 bg-[#2a2a2a] text-[#D98C21] focus:ring-[#D98C21]"
                    />
                    <span className="text-gray-300">Seleccionar todos</span>
                    {seleccionados.size > 0 && (
                      <span className="text-gray-500">({seleccionados.size} seleccionados)</span>
                    )}
                  </label>

                  {seleccionados.size > 0 && (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      disabled={borrando}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 font-medium"
                    >
                      <IconTrash size={16} />
                      {borrando ? 'Borrando...' : `Borrar (${seleccionados.size})`}
                    </button>
                  )}
                </div>
              )}

              {/* Cargando */}
              {cargandoGuardados ? (
                <div className="bg-[#1a1a1a] rounded-xl border border-[#3a3a3a] p-12 text-center">
                  <IconRefresh size={32} className="text-gray-500 animate-spin mx-auto mb-4" />
                  <p className="text-gray-400">Cargando análisis...</p>
                </div>
              ) : analisisGuardados.length === 0 ? (
                <div className="bg-[#1a1a1a] rounded-xl border border-[#3a3a3a] p-12 text-center">
                  <div className="w-16 h-16 bg-[#D98C21]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <IconFolderOpen size={32} color="#D98C21" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Sin análisis guardados</h3>
                  <p className="text-gray-400 mb-6">Genera tu primer análisis para empezar a hacer seguimiento</p>
                  <button
                    onClick={() => setTabActiva('nuevo')}
                    className="inline-flex items-center gap-2 px-6 py-2 bg-[#0d0d0d] text-white rounded-lg hover:bg-[#3d3d3d] transition-colors font-medium border border-[#4a4a4a]"
                  >
                    <IconPlus size={16} />
                    Crear Análisis
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {analisisGuardados.map((analisis) => (
                    <div
                      key={analisis.id}
                      className="bg-[#1a1a1a] rounded-xl border border-[#3a3a3a] p-4 hover:border-[#D98C21] transition-all cursor-pointer"
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
                          className="w-5 h-5 rounded border-gray-600 bg-[#2a2a2a] text-[#D98C21] focus:ring-[#D98C21] flex-shrink-0"
                        />

                        <div
                          className="flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                          onClick={() => verDetalleAnalisis(analisis.id)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#D98C21]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                              <IconFileText size={20} color="#D98C21" />
                            </div>
                            <div>
                              <p className="font-medium text-white">
                                {formatearFecha(analisis.created_at)}
                              </p>
                              <p className="text-sm text-gray-400">
                                {analisis.periodo}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-sm px-3 py-1 rounded-full ${
                              analisis.beneficio_neto_real >= 0 
                                ? 'bg-green-900/30 text-green-400' 
                                : 'bg-red-900/30 text-red-400'
                            }`}>
                              {formatCurrency(analisis.beneficio_neto_real)}
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

          {/* ========================================
              TAB: ANÁLISIS GUARDADOS - DETALLE
              ======================================== */}
          {tabActiva === 'guardados' && analisisDetalle && (
            <div className="space-y-6">
              {/* Header del detalle */}
              <div className="bg-[#1a1a1a] rounded-xl border border-[#3a3a3a] p-6">
                <button
                  onClick={() => setAnalisisDetalle(null)}
                  className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
                >
                  <IconChevronLeft size={16} />
                  Volver a la lista
                </button>

                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-white mb-2">
                      Resultado de la Empresa
                    </h2>
                    <p className="text-white text-lg mb-2">
                      Análisis completo - {analisisDetalle.analysis_data.periodo}
                    </p>
                    <div className="text-sm text-gray-400 space-y-1">
                      <p>
                        Régimen: {getTipoEntidadLabel(analisisDetalle.tipo_entidad)} | 
                        IVA: {analisisDetalle.analysis_data.configFiscal.porcentajeIva}%
                        {analisisDetalle.analysis_data.configFiscal.tipoEntidad === 'autonomo' && 
                          ` | IRPF: ${analisisDetalle.analysis_data.configFiscal.porcentajeIrpf}%`}
                        {(analisisDetalle.analysis_data.configFiscal.tipoEntidad === 'sl' || 
                          analisisDetalle.analysis_data.configFiscal.tipoEntidad === 'sa') && 
                          ` | IS: ${analisisDetalle.analysis_data.configFiscal.porcentajeIS}%`}
                      </p>
                      <p className="text-[#D98C21]">
                        Análisis realizado: {formatearFecha(analisisDetalle.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cargando detalle */}
              {cargandoDetalle ? (
                <div className="bg-[#1a1a1a] rounded-xl border border-[#3a3a3a] p-12 text-center">
                  <IconRefresh size={32} className="text-gray-500 animate-spin mx-auto mb-4" />
                  <p className="text-gray-400">Cargando detalles...</p>
                </div>
              ) : (
                <div className="space-y-8">
                  <section>
                    <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                      <span className="text-2xl">📊</span>
                      Panel de Control
                    </h2>
                    <BusinessResultSummary data={analisisDetalle.analysis_data} loading={false} />
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                      <span className="text-2xl">📈</span>
                      Desglose del Resultado
                    </h2>
                    <WaterfallChart data={analisisDetalle.analysis_data.waterfallData} loading={false} />
                  </section>

                  {/* Nota informativa */}
                  <div className="bg-[#1a1a1a] rounded-xl p-6 border border-gray-700">
                    <h3 className="text-[#d98c21] font-semibold mb-3 flex items-center gap-2">
                      <span className="text-xl">💡</span>
                      Sobre estos cálculos
                    </h3>
                    <div className="text-gray-400 text-sm space-y-2">
                      <p>
                        • El <strong className="text-white">Beneficio Neto Real</strong> es lo que realmente 
                        te queda después de pagar todos los gastos e impuestos estimados.
                      </p>
                      <p>
                        • La <strong className="text-white">Reserva Fiscal</strong> es el importe que deberías 
                        apartar para pagar IVA trimestral, IRPF o Impuesto de Sociedades.
                      </p>
                      <p>
                        • Los <strong className="text-white">Días de Cobertura</strong> indican cuántos días 
                        podrías mantener tus gastos actuales con la liquidez disponible.
                      </p>
                      <p>
                        • Los cálculos fiscales son <strong className="text-white">estimaciones</strong> basadas 
                        en tu configuración. Consulta con un asesor para cálculos exactos.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Diálogo de confirmación */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={borrarSeleccionados}
        title="Confirmar eliminación"
        message={`¿Eliminar ${seleccionados.size} análisis? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
      />
    </>
  )
}