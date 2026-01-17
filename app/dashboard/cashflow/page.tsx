'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { 
  ArrowDownCircle, ArrowUpCircle, TrendingUp, TrendingDown,
  Calendar, RefreshCw, AlertCircle, CheckCircle2, Clock,
  Receipt, Building2, FileText, AlertTriangle, Coins,
  Calculator, Landmark
} from 'lucide-react';
import CashFlowChart from '@/components/CashFlowChart';

interface CashFlowData {
  trimestre: {
    numero: number;
    nombre: string;
    inicio: string;
    fin: string;
    mesesTranscurridos: number;
  };
  resultadoContable: {
    ingresos: number;
    gastos: number;
    resultado: number;
    desglose: {
      ventas: number;
      compras: number;
      costosFijos: number;
    };
  };
  cajaOperativa: {
    entradas: number;
    entradasBruto: number;
    salidas: number;
    salidasBruto: number;
    cajaBruta: number;
    obligacionesFiscales: number;
    cajaNeta: number;
    desglose: {
      cobrado: number;
      pendienteCobro: number;
      pagado: number;
      pendientePago: number;
      costosFijosPagados: number;
    };
  };
  iva: {
    repercutido: number;
    soportado: number;
    soportadoFacturas: number;
    soportadoCostosFijos: number;
    liquidacion: number;
    desglose: {
      ivaCobrado: number;
      ivaPendienteCobro: number;
      ivaPagado: number;
      ivaPendientePago: number;
    };
  };
  irpf: {
    baseFraccionado: number;
    fraccionado: number;
    porcentaje: number;
  };
  proximaLiquidacion: {
    fecha: string;
    trimestre: string;
    diasRestantes: number;
    importeIva: number;
    importeIrpf: number;
    importeTotal: number;
  };
  proximosCobros: Array<{ id: string; concepto: string; monto: number; iva?: number; fecha: string }>;
  proximosPagos: Array<{ id: string; concepto: string; monto: number; iva?: number; fecha: string }>;
  datosHistoricos?: Array<{ 
    periodo: string; 
    entradas: number; 
    salidas: number; 
    ivaRepercutido?: number; 
    ivaSoportado?: number;
    resultado?: number;
  }>;
  costosFijosMensuales?: number;
}

export default function CashFlowPage() {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<CashFlowData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    
    try {
      const response = await fetch('/api/cashflow');
      if (!response.ok) throw new Error('Error al cargar datos');
      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      setError('No se pudieron cargar los datos del Cash Flow');
      setData(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const formatCurrency = (value: number) => new Intl.NumberFormat('es-ES', {
    style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0
  }).format(value);

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('es-ES', {
    day: 'numeric', month: 'short'
  });

  const formatDateLong = (dateString: string) => new Date(dateString).toLocaleDateString('es-ES', {
    day: 'numeric', month: 'long', year: 'numeric'
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#262626]">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-3">
            <RefreshCw className="w-8 h-8 text-[#d98c21] animate-spin" />
            <p className="text-gray-300">Cargando Cash Flow...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#262626]">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-red-500">{error || 'Error al cargar datos'}</p>
          </div>
        </div>
      </div>
    );
  }

  const resultadoPositivo = data.resultadoContable.resultado >= 0;
  const cajaPositiva = data.cajaOperativa.cajaNeta >= 0;
  const ivaAPagar = Math.max(0, data.iva.liquidacion);
  const ivaACompensar = Math.max(0, -data.iva.liquidacion);

  return (
    <div className="min-h-screen bg-[#262626]">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="space-y-6">
          
          {/* HEADER */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-[#d98c21]">Cash Flow Operativo</h1>
              <p className="mt-2 text-[#FFFCFF] text-lg">
                {data.trimestre.nombre} • Fiscalidad Española
              </p>
              <p className="mt-1 text-gray-400 text-sm">
                Del {formatDateLong(data.trimestre.inicio)} al {formatDateLong(data.trimestre.fin)}
              </p>
            </div>
            
            <button
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-[#d98c21] hover:bg-[#c17a1a] 
                       text-white rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
          </div>

          {/* PRÓXIMA LIQUIDACIÓN - DESTACADO */}
          <div className="bg-gradient-to-r from-amber-600 to-orange-600 rounded-lg p-6 border-2 border-amber-500">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white/20 rounded-lg">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-semibold text-lg">Próxima Liquidación Fiscal</h3>
                <p className="text-amber-100 text-sm mt-1">
                  {data.proximaLiquidacion.trimestre}
                </p>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <p className="text-amber-100 text-sm">Fecha límite</p>
                    <p className="text-white font-bold text-xl mt-1">
                      {formatDateLong(data.proximaLiquidacion.fecha)}
                    </p>
                    <p className="text-amber-100 text-xs mt-1">
                      Quedan {data.proximaLiquidacion.diasRestantes} días
                    </p>
                  </div>
                  <div>
                    <p className="text-amber-100 text-sm">IVA a liquidar</p>
                    <p className="text-white font-bold text-xl mt-1">
                      {formatCurrency(data.proximaLiquidacion.importeIva)}
                    </p>
                  </div>
                  <div>
                    <p className="text-amber-100 text-sm">IRPF fraccionado</p>
                    <p className="text-white font-bold text-xl mt-1">
                      {formatCurrency(data.proximaLiquidacion.importeIrpf)}
                    </p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-amber-400/30">
                  <div className="flex items-center justify-between">
                    <span className="text-amber-100 font-medium">Total a pagar:</span>
                    <span className="text-white font-bold text-2xl">
                      {formatCurrency(data.proximaLiquidacion.importeTotal)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* TARJETAS PRINCIPALES */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* RESULTADO CONTABLE */}
            <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-700">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Calculator className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-gray-400 text-sm">Resultado Contable</h3>
                  <p className="text-xs text-gray-500">Ingresos - Gastos</p>
                </div>
              </div>
              <div className={`text-3xl font-bold ${resultadoPositivo ? 'text-green-500' : 'text-red-500'}`}>
                {formatCurrency(data.resultadoContable.resultado)}
              </div>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between text-gray-400">
                  <span>Ingresos:</span>
                  <span className="text-green-400">{formatCurrency(data.resultadoContable.ingresos)}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Gastos:</span>
                  <span className="text-red-400">{formatCurrency(data.resultadoContable.gastos)}</span>
                </div>
              </div>
            </div>

            {/* CAJA BRUTA */}
            <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-700">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <Coins className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-gray-400 text-sm">Caja Bruta</h3>
                  <p className="text-xs text-gray-500">Cobros - Pagos</p>
                </div>
              </div>
              <div className={`text-3xl font-bold ${data.cajaOperativa.cajaBruta >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {formatCurrency(data.cajaOperativa.cajaBruta)}
              </div>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between text-gray-400">
                  <span>Cobrado:</span>
                  <span className="text-green-400">{formatCurrency(data.cajaOperativa.entradasBruto)}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Pagado:</span>
                  <span className="text-red-400">{formatCurrency(data.cajaOperativa.salidasBruto)}</span>
                </div>
              </div>
            </div>

            {/* CAJA NETA (después de impuestos) */}
            <div className="bg-[#1a1a1a] rounded-lg p-6 border-2 border-[#d98c21]">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-[#d98c21]/10 rounded-lg">
                  <Landmark className="w-5 h-5 text-[#d98c21]" />
                </div>
                <div>
                  <h3 className="text-gray-400 text-sm">Caja Neta Real</h3>
                  <p className="text-xs text-gray-500">Después de IVA + IRPF</p>
                </div>
              </div>
              <div className={`text-3xl font-bold ${cajaPositiva ? 'text-[#d98c21]' : 'text-red-500'}`}>
                {formatCurrency(data.cajaOperativa.cajaNeta)}
              </div>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between text-gray-400">
                  <span>Obligaciones fiscales:</span>
                  <span className="text-amber-400">-{formatCurrency(data.cajaOperativa.obligacionesFiscales)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* DESGLOSE IVA E IRPF */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* IVA TRIMESTRAL */}
            <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/10 rounded-lg">
                    <Receipt className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">IVA Trimestral</h3>
                    <p className="text-xs text-gray-400">Modelo 303</p>
                  </div>
                </div>
                {ivaAPagar > 0 ? (
                  <span className="px-3 py-1 bg-amber-500/10 text-amber-400 rounded-full text-xs font-medium">
                    A PAGAR
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-green-500/10 text-green-400 rounded-full text-xs font-medium">
                    A COMPENSAR
                  </span>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-green-500/5 rounded-lg">
                  <span className="text-gray-400 text-sm">IVA Repercutido</span>
                  <span className="text-green-400 font-semibold">{formatCurrency(data.iva.repercutido)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-red-500/5 rounded-lg">
                  <span className="text-gray-400 text-sm">IVA Soportado</span>
                  <span className="text-red-400 font-semibold">-{formatCurrency(data.iva.soportado)}</span>
                </div>
                <div className="pt-3 border-t border-gray-700">
                  <div className="flex justify-between items-center">
                    <span className="text-white font-medium">Liquidación:</span>
                    <span className={`text-2xl font-bold ${ivaAPagar > 0 ? 'text-amber-400' : 'text-green-400'}`}>
                      {ivaAPagar > 0 ? formatCurrency(ivaAPagar) : formatCurrency(ivaACompensar)}
                    </span>
                  </div>
                </div>

                {/* Desglose detallado */}
                <div className="mt-4 pt-4 border-t border-gray-700/50">
                  <p className="text-xs text-gray-500 mb-2">Desglose IVA Soportado:</p>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between text-gray-400">
                      <span>• Facturas:</span>
                      <span>{formatCurrency(data.iva.soportadoFacturas)}</span>
                    </div>
                    <div className="flex justify-between text-gray-400">
                      <span>• Costes fijos:</span>
                      <span>{formatCurrency(data.iva.soportadoCostosFijos)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* IRPF FRACCIONADO */}
            <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-500/10 rounded-lg">
                    <FileText className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">IRPF Fraccionado</h3>
                    <p className="text-xs text-gray-400">Modelo 130</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full text-xs font-medium">
                  20%
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-blue-500/5 rounded-lg">
                  <span className="text-gray-400 text-sm">Base (Beneficio)</span>
                  <span className="text-blue-400 font-semibold">{formatCurrency(data.irpf.baseFraccionado)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-indigo-500/5 rounded-lg">
                  <span className="text-gray-400 text-sm">Porcentaje aplicable</span>
                  <span className="text-indigo-400 font-semibold">{data.irpf.porcentaje}%</span>
                </div>
                <div className="pt-3 border-t border-gray-700">
                  <div className="flex justify-between items-center">
                    <span className="text-white font-medium">A ingresar:</span>
                    <span className="text-2xl font-bold text-indigo-400">
                      {formatCurrency(data.irpf.fraccionado)}
                    </span>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
                  <p className="text-xs text-blue-400">
                    ℹ️ Para autónomos en estimación directa. Se aplica 20% sobre beneficio neto trimestral.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* GRÁFICO Y DESGLOSE */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* GRÁFICO */}
            {data.datosHistoricos && data.datosHistoricos.length > 0 && (
              <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-700">
                <h3 className="text-white font-semibold mb-4">Evolución Mensual</h3>
                <CashFlowChart data={data.datosHistoricos} />
              </div>
            )}

            {/* DESGLOSE OPERATIVO */}
            <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-700">
              <h3 className="text-white font-semibold mb-4">Desglose Operativo</h3>
              
              <div className="space-y-4">
                {/* Cobros y Pendientes */}
                <div>
                  <p className="text-sm text-gray-400 mb-2">Entradas</p>
                  <div className="space-y-2">
                    <div className="flex justify-between p-2 bg-green-500/5 rounded">
                      <span className="text-sm text-gray-400">Cobrado</span>
                      <span className="text-green-400 font-medium">
                        {formatCurrency(data.cajaOperativa.desglose.cobrado)}
                      </span>
                    </div>
                    <div className="flex justify-between p-2 bg-amber-500/5 rounded">
                      <span className="text-sm text-gray-400">Pendiente cobro</span>
                      <span className="text-amber-400 font-medium">
                        {formatCurrency(data.cajaOperativa.desglose.pendienteCobro)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Pagos y Pendientes */}
                <div>
                  <p className="text-sm text-gray-400 mb-2">Salidas</p>
                  <div className="space-y-2">
                    <div className="flex justify-between p-2 bg-red-500/5 rounded">
                      <span className="text-sm text-gray-400">Pagado</span>
                      <span className="text-red-400 font-medium">
                        {formatCurrency(data.cajaOperativa.desglose.pagado)}
                      </span>
                    </div>
                    <div className="flex justify-between p-2 bg-amber-500/5 rounded">
                      <span className="text-sm text-gray-400">Pendiente pago</span>
                      <span className="text-amber-400 font-medium">
                        {formatCurrency(data.cajaOperativa.desglose.pendientePago)}
                      </span>
                    </div>
                    <div className="flex justify-between p-2 bg-purple-500/5 rounded">
                      <span className="text-sm text-gray-400">Costes fijos</span>
                      <span className="text-purple-400 font-medium">
                        {formatCurrency(data.cajaOperativa.desglose.costosFijosPagados)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* PRÓXIMOS COBROS Y PAGOS */}
          {(data.proximosCobros.length > 0 || data.proximosPagos.length > 0) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* PRÓXIMOS COBROS */}
              {data.proximosCobros.length > 0 && (
                <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-700">
                  <div className="flex items-center gap-2 mb-4">
                    <ArrowDownCircle className="w-5 h-5 text-green-400" />
                    <h3 className="text-white font-semibold">Próximos Cobros</h3>
                    <span className="text-xs text-gray-400">(30 días)</span>
                  </div>
                  <div className="space-y-2">
                    {data.proximosCobros.map(cobro => (
                      <div key={cobro.id} className="flex items-center justify-between p-3 bg-green-500/5 rounded-lg border border-green-500/10">
                        <div className="flex-1">
                          <p className="text-sm text-gray-300">{cobro.concepto}</p>
                          <p className="text-xs text-gray-500">{formatDate(cobro.fecha)}</p>
                        </div>
                        <span className="text-green-400 font-semibold">
                          {formatCurrency(cobro.monto)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* PRÓXIMOS PAGOS */}
              {data.proximosPagos.length > 0 && (
                <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-700">
                  <div className="flex items-center gap-2 mb-4">
                    <ArrowUpCircle className="w-5 h-5 text-red-400" />
                    <h3 className="text-white font-semibold">Próximos Pagos</h3>
                    <span className="text-xs text-gray-400">(30 días)</span>
                  </div>
                  <div className="space-y-2">
                    {data.proximosPagos.map(pago => (
                      <div key={pago.id} className="flex items-center justify-between p-3 bg-red-500/5 rounded-lg border border-red-500/10">
                        <div className="flex-1">
                          <p className="text-sm text-gray-300">{pago.concepto}</p>
                          <p className="text-xs text-gray-500">{formatDate(pago.fecha)}</p>
                        </div>
                        <span className="text-red-400 font-semibold">
                          {formatCurrency(pago.monto)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}