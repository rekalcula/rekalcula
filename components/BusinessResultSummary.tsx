'use client'

import { 
  IconMoney, 
  IconBarChart, 
  IconWallet, 
  IconTrendingUp, 
  IconTrendingDown,
  IconClock,
  IconCheckCircle,
  IconAlertTriangle,
  IconTarget
} from './Icons'

interface BusinessResultData {
  periodo: string
  ingresosBrutos: number
  costosVariables: number
  costosFijos: number
  gastosFacturas: number
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
    porcentajeIva: number
    porcentajeIrpf: number
    porcentajeIS: number
  }
}

interface Props {
  data: BusinessResultData
  loading?: boolean
}

export default function BusinessResultSummary({ data, loading }: Props) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const isProfit = data.beneficioNetoReal >= 0
  const isOperatingProfit = data.beneficioOperativo >= 0

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-gray-200 rounded-xl h-32"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ========================================
          FILA 1: RESUMEN PRINCIPAL
          ======================================== */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Ingresos */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-3">
            <IconMoney size={28} color="#10B981" />
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {data.periodo}
            </span>
          </div>
          <p className="text-sm text-gray-500 mb-1">Ingresos Brutos</p>
          <p className="text-3xl font-bold text-gray-900">
            {formatCurrency(data.ingresosBrutos)}
          </p>
          <div className="mt-2 text-xs text-gray-500">
            Base: {formatCurrency(data.ingresosBrutos - (data.ingresosBrutos * data.configFiscal.porcentajeIva / (100 + data.configFiscal.porcentajeIva)))}
          </div>
        </div>

        {/* Gastos */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-3">
            <IconBarChart size={28} color="#EF4444" />
          </div>
          <p className="text-sm text-gray-500 mb-1">Gastos Totales</p>
          <p className="text-3xl font-bold text-gray-900">
            {formatCurrency(data.totalCostos)}
          </p>
          <div className="mt-2 text-xs text-gray-500 space-y-0.5">
            <p>Variables: {formatCurrency(data.costosVariables)}</p>
            <p>Fijos: {formatCurrency(data.costosFijos)}</p>
            {data.gastosFacturas > 0 && <p>Otros: {formatCurrency(data.gastosFacturas)}</p>}
          </div>
        </div>

        {/* Beneficio */}
        <div className={`rounded-xl shadow-sm p-6 ${
          isProfit ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-center justify-between mb-3">
            {isProfit ? (
              <IconTrendingUp size={28} color="#10B981" />
            ) : (
              <IconTrendingDown size={28} color="#EF4444" />
            )}
          </div>
          <p className={`text-sm mb-1 ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
            Beneficio Neto Real
          </p>
          <p className={`text-3xl font-bold ${isProfit ? 'text-green-700' : 'text-red-700'}`}>
            {formatCurrency(data.beneficioNetoReal)}
          </p>
          <div className={`mt-2 text-xs ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
            Margen: {data.beneficioNetoPorcentaje.toFixed(1)}% sobre ingresos
          </div>
        </div>
      </div>

      {/* ========================================
          FILA 2: DESGLOSE DEL BENEFICIO
          ======================================== */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <IconTarget size={24} color="#d98c21" />
          Desglose del Resultado
        </h3>
        
        <div className="space-y-3">
          {/* Beneficio Operativo */}
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-gray-700">Beneficio Operativo</span>
            <span className={`font-semibold ${isOperatingProfit ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(data.beneficioOperativo)}
            </span>
          </div>

          {/* IVA a Ingresar */}
          {data.ivaAIngresar > 0 && (
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">- IVA a ingresar (trimestral)</span>
              <span className="text-red-600">-{formatCurrency(data.ivaAIngresar)}</span>
            </div>
          )}

          {/* IRPF Estimado */}
          {data.irpfEstimado > 0 && (
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">- IRPF estimado ({data.configFiscal.porcentajeIrpf}%)</span>
              <span className="text-red-600">-{formatCurrency(data.irpfEstimado)}</span>
            </div>
          )}

          {/* Impuesto Sociedades */}
          {data.impuestoSociedadesEstimado > 0 && (
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">- Imp. Sociedades ({data.configFiscal.porcentajeIS}%)</span>
              <span className="text-red-600">-{formatCurrency(data.impuestoSociedadesEstimado)}</span>
            </div>
          )}

          {/* Línea divisoria */}
          <div className="border-t-2 border-gray-300 my-2"></div>

          {/* Beneficio Neto Final */}
          <div className="flex items-center justify-between py-2">
            <span className="text-lg font-bold text-gray-900">BENEFICIO NETO REAL</span>
            <span className={`text-2xl font-bold ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(data.beneficioNetoReal)}
            </span>
          </div>
        </div>
      </div>

      {/* ========================================
          FILA 3: LIQUIDEZ Y RESERVA FISCAL
          ======================================== */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Liquidez */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-3">
            <IconWallet size={28} color="#3B82F6" />
          </div>
          <p className="text-sm text-gray-500 mb-1">Liquidez Disponible</p>
          <p className={`text-2xl font-bold ${data.balanceCaja >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
            {formatCurrency(data.balanceCaja)}
          </p>
          <div className="mt-3 space-y-1 text-xs">
            <div className="flex items-center gap-1.5 text-green-600">
              <IconCheckCircle size={14} color="#10B981" />
              <span>Cobrado: {formatCurrency(data.cobradoReal)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-red-600">
              <IconClock size={14} color="#EF4444" />
              <span>Pagado: {formatCurrency(data.pagadoReal)}</span>
            </div>
          </div>
        </div>

        {/* Reserva Fiscal */}
        <div className="bg-amber-50 rounded-xl shadow-sm p-6 border border-amber-200">
          <div className="flex items-center justify-between mb-3">
            <IconAlertTriangle size={28} color="#F59E0B" />
            <span className="text-xs text-amber-700 font-medium">Reservar</span>
          </div>
          <p className="text-sm text-amber-700 mb-1">Reserva Fiscal</p>
          <p className="text-2xl font-bold text-amber-800">
            {formatCurrency(data.reservaFiscalRecomendada)}
          </p>
          <div className="mt-3 text-xs text-amber-600">
            <p>Debes apartar este importe para:</p>
            <ul className="mt-1 space-y-0.5">
              {data.ivaAIngresar > 0 && <li>• IVA trimestral: {formatCurrency(data.ivaAIngresar)}</li>}
              {data.irpfEstimado > 0 && <li>• IRPF: {formatCurrency(data.irpfEstimado)}</li>}
              {data.impuestoSociedadesEstimado > 0 && <li>• IS: {formatCurrency(data.impuestoSociedadesEstimado)}</li>}
            </ul>
          </div>
        </div>

        {/* Días de Cobertura */}
        <div className={`rounded-xl shadow-sm p-6 ${
          data.diasCobertura >= 30 
            ? 'bg-green-50 border border-green-200' 
            : data.diasCobertura >= 15 
              ? 'bg-amber-50 border border-amber-200'
              : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <IconClock size={28} color={
              data.diasCobertura >= 30 ? '#10B981' : data.diasCobertura >= 15 ? '#F59E0B' : '#EF4444'
            } />
          </div>
          <p className={`text-sm mb-1 ${
            data.diasCobertura >= 30 ? 'text-green-600' : data.diasCobertura >= 15 ? 'text-amber-600' : 'text-red-600'
          }`}>
            Cobertura de Gastos
          </p>
          <p className={`text-2xl font-bold ${
            data.diasCobertura >= 30 ? 'text-green-700' : data.diasCobertura >= 15 ? 'text-amber-700' : 'text-red-700'
          }`}>
            {data.diasCobertura > 365 ? '+365' : data.diasCobertura} días
          </p>
          <div className={`mt-3 text-xs ${
            data.diasCobertura >= 30 ? 'text-green-600' : data.diasCobertura >= 15 ? 'text-amber-600' : 'text-red-600'
          }`}>
            {data.diasCobertura >= 30 
              ? 'Situación saludable' 
              : data.diasCobertura >= 15 
                ? 'Revisar próximos cobros'
                : 'Atención: liquidez baja'
            }
          </div>
        </div>
      </div>

      {/* ========================================
          FILA 4: PENDIENTES
          ======================================== */}
      {(data.pendienteCobro > 0 || data.pendientePago > 0) && (
        <div className="grid md:grid-cols-2 gap-4">
          {/* Pendiente de Cobro */}
          <div className="bg-blue-50 rounded-xl shadow-sm p-5 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Pendiente de Cobro</p>
                <p className="text-xl font-bold text-blue-700">{formatCurrency(data.pendienteCobro)}</p>
              </div>
              <div className="text-3xl">📥</div>
            </div>
          </div>

          {/* Pendiente de Pago */}
          <div className="bg-orange-50 rounded-xl shadow-sm p-5 border border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 font-medium">Pendiente de Pago</p>
                <p className="text-xl font-bold text-orange-700">{formatCurrency(data.pendientePago)}</p>
              </div>
              <div className="text-3xl">📤</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}