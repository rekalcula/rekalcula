'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { 
  ArrowDownCircle, 
  ArrowUpCircle, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock
} from 'lucide-react';
import CashFlowChart from '@/components/CashFlowChart';

interface CashFlowData {
  entradas: {
    total: number;
    cobrado: number;
    pendiente: number;
  };
  salidas: {
    total: number;
    pagado: number;
    pendiente: number;
    costosFijos: number;
  };
  balance: number;
  proximosCobros: Array<{
    id: string;
    concepto: string;
    monto: number;
    fecha: string;
  }>;
  proximosPagos: Array<{
    id: string;
    concepto: string;
    monto: number;
    fecha: string;
  }>;
  datosHistoricos?: Array<{
    periodo: string;
    entradas: number;
    salidas: number;
  }>;
}

type PeriodoTipo = 'mes' | '3meses' | '6meses';

export default function CashFlowPage() {
  const { user } = useUser();
  const [periodo, setPeriodo] = useState<PeriodoTipo>('mes');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<CashFlowData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    
    try {
      const response = await fetch(`/api/cashflow?periodo=${periodo}`);
      if (!response.ok) throw new Error('Error al cargar datos');
      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      setError('No se pudieron cargar los datos del flujo de caja');
      // Datos de ejemplo en caso de error
      setData({
        entradas: { total: 0, cobrado: 0, pendiente: 0 },
        salidas: { total: 6000, pagado: 0, pendiente: 6000, costosFijos: 6000 },
        balance: -6000,
        proximosCobros: [],
        proximosPagos: [],
        datosHistoricos: []
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [periodo]);

  const handleRefresh = () => {
    fetchData(true);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short'
    });
  };

  if (loading) {
    return (
      // ========================================
      // LOADING STATE - CON FONDO OSCURO
      // ========================================
      <div className="min-h-screen bg-[#262626]">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-3">
            <RefreshCw className="w-8 h-8 text-[#d98c21] animate-spin" />
            <p className="text-gray-300">Cargando flujo de caja...</p>
          </div>
        </div>
      </div>
    );
  }

  const entradas = data?.entradas.total || 0;
  const salidas = data?.salidas.total || 0;
  const balance = data?.balance || entradas - salidas;
  const balancePositivo = balance >= 0;

  return (
    // ========================================
    // WRAPPER PRINCIPAL - FONDO OSCURO #262626
    // (Igual que Analytics)
    // ========================================
    <div className="min-h-screen bg-[#262626]">
      {/* ========================================
          CONTENEDOR CON MÁRGENES
          (Igual que Analytics: max-w-6xl)
          ======================================== */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* ========================================
              HEADER - ESTILO ANALYTICS
              ======================================== */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              {/* Título en naranja #d98c21 - igual que Analytics */}
              <h1 className="text-3xl font-bold text-[#d98c21]">Flujo de Caja</h1>
              {/* Subtítulo en blanco - igual que Analytics */}
              <p className="mt-2 text-[#FFFCFF] text-[20px]">
                Controla tus cobros y pagos en tiempo real
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Selector de período - adaptado para fondo oscuro */}
              <div className="flex bg-[#1a1a1a] rounded-lg p-1 border border-gray-700">
                {[
                  { value: 'mes', label: 'Este mes' },
                  { value: '3meses', label: '3 meses' },
                  { value: '6meses', label: '6 meses' }
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setPeriodo(opt.value as PeriodoTipo)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all
                      ${periodo === opt.value 
                        ? 'bg-white text-gray-900 shadow-sm' 
                        : 'text-gray-400 hover:text-white'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              
              {/* Botón refrescar - adaptado para fondo oscuro */}
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 text-gray-400 hover:text-white hover:bg-[#1a1a1a] rounded-lg transition-colors border border-gray-700"
                title="Actualizar datos"
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Error banner */}
          {error && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-amber-800 font-medium">Datos no disponibles</p>
                <p className="text-amber-700 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Layout principal: Gráfico a la izquierda, Tarjetas a la derecha */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Columna izquierda: Gráfico */}
            <div className="lg:row-span-2">
              <CashFlowChart
                entradas={entradas}
                salidas={salidas}
                cobrado={data?.entradas.cobrado || 0}
                pendienteCobro={data?.entradas.pendiente || 0}
                pagado={data?.salidas.pagado || 0}
                pendientePago={data?.salidas.pendiente || 0}
                costosFijos={data?.salidas.costosFijos || 0}
                periodo={periodo}
                datosHistoricos={data?.datosHistoricos}
              />
            </div>

            {/* Columna derecha: Tarjetas de resumen */}
            <div className="space-y-4">
              {/* Tarjetas de Entradas, Salidas, Balance */}
              <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3 gap-4">
                {/* Entradas (Cobros) */}
                <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-emerald-700 text-sm font-medium">Entradas (Cobros)</span>
                    <ArrowDownCircle className="w-5 h-5 text-emerald-500" />
                  </div>
                  <p className="text-2xl font-bold text-emerald-800">
                    {formatCurrency(entradas)}
                  </p>
                  <div className="mt-3 space-y-1 text-xs">
                    <div className="flex items-center gap-1.5 text-emerald-700">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Cobrado: {formatCurrency(data?.entradas.cobrado || 0)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-600">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Pendiente: {formatCurrency(data?.entradas.pendiente || 0)}</span>
                    </div>
                  </div>
                </div>

                {/* Salidas (Pagos) */}
                <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-red-700 text-sm font-medium">Salidas (Pagos)</span>
                    <ArrowUpCircle className="w-5 h-5 text-red-500" />
                  </div>
                  <p className="text-2xl font-bold text-red-800">
                    {formatCurrency(salidas)}
                  </p>
                  <div className="mt-3 space-y-1 text-xs">
                    <div className="flex items-center gap-1.5 text-red-700">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Pagado: {formatCurrency(data?.salidas.pagado || 0)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-red-600">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Pendiente: {formatCurrency(data?.salidas.pendiente || 0)}</span>
                    </div>
                    {(data?.salidas.costosFijos || 0) > 0 && (
                      <p className="text-red-500 mt-1 pt-1 border-t border-red-200">
                        Incluye {formatCurrency(data?.salidas.costosFijos || 0)}/mes en costos fijos
                      </p>
                    )}
                  </div>
                </div>

                {/* Balance Neto */}
                <div className={`rounded-xl p-4 border ${
                  balancePositivo 
                    ? 'bg-emerald-50 border-emerald-100' 
                    : 'bg-red-50 border-red-100'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm font-medium ${
                      balancePositivo ? 'text-emerald-700' : 'text-red-700'
                    }`}>
                      Balance Neto
                    </span>
                    {balancePositivo ? (
                      <TrendingUp className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                  <p className={`text-2xl font-bold ${
                    balancePositivo ? 'text-emerald-800' : 'text-red-800'
                  }`}>
                    {formatCurrency(balance)}
                  </p>
                  <p className={`text-xs mt-2 ${
                    balancePositivo ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                    {balancePositivo 
                      ? 'Flujo de caja positivo' 
                      : 'Flujo de caja negativo'}
                  </p>
                </div>
              </div>

              {/* Próximos cobros y pagos */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {/* Próximos Cobros */}
                <div className="bg-[#FEF9E7] rounded-xl p-4 border border-[#F9E79F]">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 bg-emerald-100 rounded-lg">
                      <Calendar className="w-4 h-4 text-emerald-600" />
                    </div>
                    <h3 className="font-semibold text-gray-800">Próximos Cobros</h3>
                    <span className="text-xs text-gray-500 ml-auto">30 días</span>
                  </div>
                  
                  {data?.proximosCobros && data.proximosCobros.length > 0 ? (
                    <div className="space-y-2">
                      {data.proximosCobros.slice(0, 3).map((cobro) => (
                        <div key={cobro.id} className="flex items-center justify-between py-2 border-b border-[#F9E79F] last:border-0">
                          <div>
                            <p className="text-sm font-medium text-gray-700">{cobro.concepto}</p>
                            <p className="text-xs text-gray-500">{formatDate(cobro.fecha)}</p>
                          </div>
                          <span className="text-sm font-semibold text-emerald-600">
                            +{formatCurrency(cobro.monto)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm text-center py-4">
                      No hay cobros pendientes en los próximos 30 días
                    </p>
                  )}
                </div>

                {/* Próximos Pagos */}
                <div className="bg-[#FEF9E7] rounded-xl p-4 border border-[#F9E79F]">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 bg-red-100 rounded-lg">
                      <Calendar className="w-4 h-4 text-red-600" />
                    </div>
                    <h3 className="font-semibold text-gray-800">Próximos Pagos</h3>
                    <span className="text-xs text-gray-500 ml-auto">30 días</span>
                  </div>
                  
                  {data?.proximosPagos && data.proximosPagos.length > 0 ? (
                    <div className="space-y-2">
                      {data.proximosPagos.slice(0, 3).map((pago) => (
                        <div key={pago.id} className="flex items-center justify-between py-2 border-b border-[#F9E79F] last:border-0">
                          <div>
                            <p className="text-sm font-medium text-gray-700">{pago.concepto}</p>
                            <p className="text-xs text-gray-500">{formatDate(pago.fecha)}</p>
                          </div>
                          <span className="text-sm font-semibold text-red-600">
                            -{formatCurrency(pago.monto)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm text-center py-4">
                      No hay pagos pendientes en los próximos 30 días
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}