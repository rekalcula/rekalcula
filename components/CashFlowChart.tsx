'use client';

import { useState, useMemo } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Cell
} from 'recharts';
import { TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';

// Tipos para los datos del gráfico
interface CashFlowDataPoint {
  periodo: string;
  periodoCorto: string;
  entradas: number;
  salidas: number;
  balance: number;
  balanceAcumulado: number;
}

interface CashFlowChartProps {
  entradas: number;
  salidas: number;
  cobrado: number;
  pendienteCobro: number;
  pagado: number;
  pendientePago: number;
  costosFijos: number;
  periodo: 'mes' | '3meses' | '6meses' | 'all';
  // Datos históricos opcionales para el gráfico temporal
  datosHistoricos?: {
    periodo: string;
    entradas: number;
    salidas: number;
  }[];
}

// Función para formatear números como moneda
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

// Función para formatear números cortos
const formatShort = (value: number): string => {
  if (Math.abs(value) >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (Math.abs(value) >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }
  return value.toFixed(0);
};

// Componente de Tooltip personalizado
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const entradas = payload.find((p: any) => p.dataKey === 'entradas')?.value || 0;
    const salidas = payload.find((p: any) => p.dataKey === 'salidas')?.value || 0;
    const balance = payload.find((p: any) => p.dataKey === 'balance')?.value || 0;
    
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-xl">
        <p className="text-gray-300 font-medium mb-2 border-b border-gray-700 pb-2">
          {label}
        </p>
        <div className="space-y-1.5 text-sm">
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm bg-emerald-500"></span>
              <span className="text-gray-400">Entradas:</span>
            </span>
            <span className="text-emerald-400 font-semibold">{formatCurrency(entradas)}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm bg-red-500"></span>
              <span className="text-gray-400">Salidas:</span>
            </span>
            <span className="text-red-400 font-semibold">{formatCurrency(salidas)}</span>
          </div>
          <div className="flex items-center justify-between gap-4 pt-1.5 border-t border-gray-700">
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-400"></span>
              <span className="text-gray-400">Balance:</span>
            </span>
            <span className={`font-bold ${balance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {formatCurrency(balance)}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

// Componente de Leyenda personalizada
const CustomLegend = () => {
  return (
    <div className="flex flex-wrap justify-center gap-4 mt-2 text-xs">
      <div className="flex items-center gap-1.5">
        <span className="w-3 h-3 rounded-sm bg-emerald-500"></span>
        <span className="text-gray-400">Cobros (Entradas)</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-3 h-3 rounded-sm bg-red-500"></span>
        <span className="text-gray-400">Pagos (Salidas)</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-3 h-1 rounded-full bg-amber-400"></span>
        <span className="text-gray-400">Balance Neto</span>
      </div>
    </div>
  );
};

export default function CashFlowChart({
  entradas,
  salidas,
  cobrado,
  pendienteCobro,
  pagado,
  pendientePago,
  costosFijos,
  periodo,
  datosHistoricos = []
}: CashFlowChartProps) {
  const [showInfo, setShowInfo] = useState(false);
  
  // Generar datos para el gráfico
  const chartData = useMemo(() => {
    // Si hay datos históricos, usarlos
    if (datosHistoricos.length > 0) {
      let acumulado = 0;
      return datosHistoricos.map((item, index) => {
        const balance = item.entradas - item.salidas;
        acumulado += balance;
        return {
          periodo: item.periodo,
          periodoCorto: item.periodo.substring(0, 3),
          entradas: item.entradas,
          salidas: item.salidas,
          balance: balance,
          balanceAcumulado: acumulado
        };
      });
    }
    
    // Si no hay datos históricos, generar datos de ejemplo basados en los valores actuales
    const mesesAtras = periodo === 'mes' ? 1 : periodo === '3meses' ? 3 : periodo === '6meses' ? 6 : 12;
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const mesActual = new Date().getMonth();
    
    const data: CashFlowDataPoint[] = [];
    let acumulado = 0;
    
    for (let i = mesesAtras - 1; i >= 0; i--) {
      const mesIndex = (mesActual - i + 12) % 12;
      const mesNombre = meses[mesIndex];
      
      // Para el mes actual, usar los datos reales
      // Para meses anteriores, simular variación (esto debería venir de la BD)
      const factor = i === 0 ? 1 : 0.8 + Math.random() * 0.4;
      const entradasMes = i === 0 ? entradas : Math.round(entradas * factor);
      const salidasMes = i === 0 ? salidas : Math.round(salidas * factor);
      const balance = entradasMes - salidasMes;
      acumulado += balance;
      
      data.push({
        periodo: mesNombre,
        periodoCorto: mesNombre,
        entradas: entradasMes,
        salidas: salidasMes,
        balance: balance,
        balanceAcumulado: acumulado
      });
    }
    
    return data;
  }, [entradas, salidas, periodo, datosHistoricos]);

  // Calcular el balance actual
  const balanceActual = entradas - salidas;
  const tendencia = balanceActual > 0 ? 'positiva' : balanceActual < 0 ? 'negativa' : 'neutral';

  // Calcular valores máximos para el eje Y
  const maxValue = Math.max(
    ...chartData.map(d => Math.max(d.entradas, d.salidas)),
    Math.abs(Math.min(...chartData.map(d => d.balance))),
    Math.abs(Math.max(...chartData.map(d => d.balance)))
  );

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800">
            Evolución del Flujo
          </h3>
          <button 
            onClick={() => setShowInfo(!showInfo)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            title="¿Cómo leer este gráfico?"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
        
        {/* Indicador de tendencia */}
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
          ${tendencia === 'positiva' ? 'bg-emerald-100 text-emerald-700' : 
            tendencia === 'negativa' ? 'bg-red-100 text-red-700' : 
            'bg-gray-100 text-gray-600'}`}
        >
          {tendencia === 'positiva' ? (
            <>
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Positivo</span>
            </>
          ) : tendencia === 'negativa' ? (
            <>
              <TrendingDown className="w-3.5 h-3.5" />
              <span>Negativo</span>
            </>
          ) : (
            <>
              <Minus className="w-3.5 h-3.5" />
              <span>Neutral</span>
            </>
          )}
        </div>
      </div>

      {/* Panel informativo */}
      {showInfo && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
          <p className="font-medium mb-1">📊 ¿Cómo leer este gráfico?</p>
          <ul className="space-y-0.5 text-blue-700">
            <li>• <span className="text-emerald-600 font-medium">Barras verdes</span>: Dinero que entra (cobros)</li>
            <li>• <span className="text-red-600 font-medium">Barras rojas</span>: Dinero que sale (pagos)</li>
            <li>• <span className="text-amber-600 font-medium">Línea amarilla</span>: Balance neto (entradas - salidas)</li>
            <li>• Si la línea está <span className="text-emerald-600 font-medium">arriba de 0</span>: ¡Bien! Entra más de lo que sale</li>
            <li>• Si la línea está <span className="text-red-600 font-medium">debajo de 0</span>: Atención, sale más de lo que entra</li>
          </ul>
        </div>
      )}

      {/* Gráfico */}
      <div className="flex-1 min-h-[200px] sm:min-h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="#e5e7eb" 
              vertical={false}
            />
            <XAxis 
              dataKey="periodoCorto" 
              tick={{ fontSize: 11, fill: '#6b7280' }}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis 
              tick={{ fontSize: 10, fill: '#6b7280' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatShort}
              width={45}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* Línea de referencia en 0 */}
            <ReferenceLine 
              y={0} 
              stroke="#9ca3af" 
              strokeDasharray="3 3"
              strokeWidth={1}
            />
            
            {/* Barras de Entradas (Cobros) */}
            <Bar 
              dataKey="entradas" 
              name="Entradas"
              fill="#10b981"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
            
            {/* Barras de Salidas (Pagos) */}
            <Bar 
              dataKey="salidas" 
              name="Salidas"
              fill="#ef4444"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
            
            {/* Línea de Balance */}
            <Line
              type="monotone"
              dataKey="balance"
              name="Balance"
              stroke="#f59e0b"
              strokeWidth={3}
              dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#f59e0b', strokeWidth: 2, fill: '#fff' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Leyenda */}
      <CustomLegend />

      {/* Resumen rápido - ✅ CORREGIDO: Usar valores totales del período, no sumar chartData */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 bg-emerald-50 rounded-lg">
            <p className="text-xs text-emerald-600 font-medium">Total Entradas</p>
            <p className="text-sm sm:text-base font-bold text-emerald-700">
              {formatCurrency(entradas)}
            </p>
          </div>
          <div className="p-2 bg-red-50 rounded-lg">
            <p className="text-xs text-red-600 font-medium">Total Salidas</p>
            <p className="text-sm sm:text-base font-bold text-red-700">
              {formatCurrency(salidas)}
            </p>
          </div>
          <div className={`p-2 rounded-lg ${balanceActual >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
            <p className={`text-xs font-medium ${balanceActual >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              Balance Período
            </p>
            <p className={`text-sm sm:text-base font-bold ${balanceActual >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
              {formatCurrency(balanceActual)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}