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
    <div className="flex flex-wrap justify-center gap-4 mt-4 text-xs">
      <div className="flex items-center gap-1.5">
        <span className="w-3 h-3 rounded-sm bg-emerald-500"></span>
        <span className="text-gray-400">Entradas</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-3 h-3 rounded-sm bg-red-500"></span>
        <span className="text-gray-400">Salidas</span>
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
    
    // Si no hay datos históricos, retornar array vacío
    return [];
  }, [datosHistoricos]);

  // Calcular el balance actual
  const balanceActual = entradas - salidas;
  const tendencia = balanceActual > 0 ? 'positiva' : balanceActual < 0 ? 'negativa' : 'neutral';

  return (
    <div className="h-full flex flex-col pb-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowInfo(!showInfo)}
            className="text-gray-400 hover:text-gray-300 transition-colors"
            title="¿Cómo leer este gráfico?"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
        
        {/* Indicador de tendencia */}
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
          ${tendencia === 'positiva' ? 'bg-emerald-500/10 text-emerald-400' : 
            tendencia === 'negativa' ? 'bg-red-500/10 text-red-400' : 
            'bg-gray-500/10 text-gray-400'}`}
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
        <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs text-blue-400">
          <p className="font-medium mb-1">📊 ¿Cómo leer este gráfico?</p>
          <ul className="space-y-0.5 text-blue-300">
            <li>• <span className="text-emerald-400 font-medium">Barras verdes</span>: Dinero que entra (ventas)</li>
            <li>• <span className="text-red-400 font-medium">Barras rojas</span>: Dinero que sale (gastos)</li>
            <li>• <span className="text-amber-400 font-medium">Línea amarilla</span>: Balance neto (entradas - salidas)</li>
          </ul>
        </div>
      )}

      {/* Gráfico */}
      <div className="flex-1 min-h-[320px] sm:min-h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="#374151" 
              vertical={false}
            />
            <XAxis 
              dataKey="periodoCorto" 
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              tickLine={false}
              axisLine={{ stroke: '#374151' }}
            />
            <YAxis 
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatShort}
              width={60}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* Línea de referencia en 0 */}
            <ReferenceLine 
              y={0} 
              stroke="#6b7280" 
              strokeDasharray="3 3"
              strokeWidth={1}
            />
            
            {/* Barras de Entradas */}
            <Bar 
              dataKey="entradas" 
              name="Entradas"
              fill="#10b981"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
            
            {/* Barras de Salidas */}
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
              activeDot={{ r: 6, stroke: '#f59e0b', strokeWidth: 2, fill: '#1a1a1a' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Leyenda */}
      <CustomLegend />
    </div>
  );
}