'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import DashboardNav from '@/components/DashboardNav'
import BusinessResultSummary from '@/components/BusinessResultSummary'
import WaterfallChart from '@/components/WaterfallChart'
import { IconRefresh } from '@/components/Icons'

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

export default function ResultadoPage() {
  const { user } = useUser()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [data, setData] = useState<BusinessResultData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true)
    else setLoading(true)

    try {
      const response = await fetch('/api/business-result')
      const result = await response.json()

      if (result.success) {
        setData(result.data)
        setError(null)
      } else {
        setError(result.error || 'Error al cargar datos')
      }
    } catch (err) {
      console.error('Error fetching business result:', err)
      setError('No se pudieron cargar los datos')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleRefresh = () => {
    fetchData(true)
  }

  // Obtener el nombre del tipo de entidad para mostrar
  const getTipoEntidadLabel = () => {
    if (!data) return ''
    switch (data.configFiscal.tipoEntidad) {
      case 'autonomo': return 'Autonomo'
      case 'sl': return 'Sociedad Limitada'
      case 'sa': return 'Sociedad Anonima'
      default: return data.configFiscal.tipoEntidad
    }
  }

  return (
    <>
      <DashboardNav />
      <div className="min-h-screen bg-[#262626]">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* ========================================
              HEADER
              ======================================== */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-[#d98c21]">
                Resultado de la Empresa
              </h1>
              <p className="mt-2 text-[#FFFCFF] text-[20px]">
                Analisis completo - {data?.periodo || 'Cargando...'}
              </p>
              {data && (
                <p className="mt-1 text-gray-400 text-sm">
                  Regimen: {getTipoEntidadLabel()} | IVA: {data.configFiscal.porcentajeIva}%
                  {data.configFiscal.tipoEntidad === 'autonomo' && ` | IRPF: ${data.configFiscal.porcentajeIrpf}%`}
                  {(data.configFiscal.tipoEntidad === 'sl' || data.configFiscal.tipoEntidad === 'sa') && 
                    ` | IS: ${data.configFiscal.porcentajeIS}%`}
                </p>
              )}
            </div>

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] text-gray-300 rounded-lg border border-gray-700 hover:bg-[#2a2a2a] hover:text-white transition-colors disabled:opacity-50"
            >
              <IconRefresh 
                size={20} 
                className={refreshing ? 'animate-spin' : ''} 
              />
              {refreshing ? 'Actualizando...' : 'Actualizar'}
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 bg-red-900/30 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Loading inicial */}
          {loading && !data && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d98c21]"></div>
              <p className="text-gray-400 mt-4">Calculando resultado de la empresa...</p>
            </div>
          )}

          {/* Contenido principal */}
          {data && (
            <div className="space-y-8">
              {/* ========================================
                  OPCION A: PANEL RESUMEN EJECUTIVO
                  ======================================== */}
              <section>
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <span className="text-2xl">📊</span>
                  Panel de Control
                </h2>
                <BusinessResultSummary data={data} loading={loading} />
              </section>

              {/* ========================================
                  OPCION B: GRAFICO WATERFALL
                  ======================================== */}
              <section>
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <span className="text-2xl">📈</span>
                  Visualizacion de Resultados
                </h2>
                <WaterfallChart data={data.waterfallData} loading={loading} />
              </section>

              {/* ========================================
                  NOTA INFORMATIVA
                  ======================================== */}
              <div className="bg-[#1a1a1a] rounded-xl p-6 border border-gray-700">
                <h3 className="text-[#d98c21] font-semibold mb-3 flex items-center gap-2">
                  <span className="text-xl">💡</span>
                  Sobre estos calculos
                </h3>
                <div className="text-gray-400 text-sm space-y-2">
                  <p>
                    • El <strong className="text-white">Beneficio Neto Real</strong> es lo que realmente 
                    te queda despues de pagar todos los gastos e impuestos estimados.
                  </p>
                  <p>
                    • La <strong className="text-white">Reserva Fiscal</strong> es el importe que deberias 
                    apartar para pagar IVA trimestral, IRPF o Impuesto de Sociedades.
                  </p>
                  <p>
                    • Los <strong className="text-white">Dias de Cobertura</strong> indican cuantos dias 
                    podrias mantener tus gastos actuales con la liquidez disponible.
                  </p>
                  <p>
                    • Los calculos fiscales son <strong className="text-white">estimaciones</strong> basadas 
                    en tu configuracion. Consulta con un asesor para calculos exactos.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}