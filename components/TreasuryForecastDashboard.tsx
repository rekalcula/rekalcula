'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, TrendingDown, TrendingUp, Plus, Save, Calendar, Wallet } from 'lucide-react';

// ============================================
// TIPOS Y LÓGICA (TODO EN UN ARCHIVO)
// ============================================

interface ForecastPeriod {
  period_date: string;
  initial_balance: number;
  planned_income: number;
  planned_expenses: number;
  final_balance: number;
  notes?: string;
  alert_level?: 'safe' | 'warning' | 'danger';
}

interface TreasuryForecast {
  id?: string;
  user_id?: string;
  period_type: 'monthly' | 'weekly';
  start_date: string;
  forecast_data: ForecastPeriod[];
  created_at?: string;
  updated_at?: string;
}

const calculateAlertLevel = (balance: number): 'safe' | 'warning' | 'danger' => {
  if (balance < 0) return 'danger';
  if (balance < 2000) return 'warning';
  return 'safe';
};

const generateEmptyPeriods = (
  startDate: string,
  periodType: 'monthly' | 'weekly',
  count: number,
  initialBalance: number
): ForecastPeriod[] => {
  const periods: ForecastPeriod[] = [];
  const date = new Date(startDate);
  let currentBalance = initialBalance;

  for (let i = 0; i < count; i++) {
    const periodDate = new Date(date);
    
    periods.push({
      period_date: periodDate.toISOString().split('T')[0],
      initial_balance: currentBalance,
      planned_income: 0,
      planned_expenses: 0,
      final_balance: currentBalance,
      alert_level: calculateAlertLevel(currentBalance),
      notes: ''
    });

    if (periodType === 'monthly') {
      date.setMonth(date.getMonth() + 1);
    } else {
      date.setDate(date.getDate() + 7);
    }
  }

  return periods;
};

const recalculateBalances = (periods: ForecastPeriod[]): ForecastPeriod[] => {
  return periods.map((period, index) => {
    const finalBalance = period.initial_balance + period.planned_income - period.planned_expenses;
    
    const updated = {
      ...period,
      final_balance: finalBalance,
      alert_level: calculateAlertLevel(finalBalance)
    };

    if (index < periods.length - 1) {
      periods[index + 1].initial_balance = finalBalance;
    }

    return updated;
  });
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function TreasuryForecastDashboard() {
  const [forecast, setForecast] = useState<TreasuryForecast | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [periodType, setPeriodType] = useState<'monthly' | 'weekly'>('monthly');
  const [initialBalance, setInitialBalance] = useState(0);

  useEffect(() => {
    loadForecast();
    loadCurrentBalance();
  }, []);

  const loadForecast = async () => {
    try {
      const response = await fetch('/api/treasury-forecast');
      const result = await response.json();
      
      if (result.data) {
        setForecast(result.data);
        setPeriodType(result.data.period_type);
      }
    } catch (error) {
      console.error('Error cargando previsión:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentBalance = async () => {
    setLoadingBalance(true);
    try {
      const response = await fetch('/api/cashflow');
      const result = await response.json();
      
      if (result.data?.length > 0) {
        // Ordenar por fecha para asegurar que obtenemos el más reciente
        const sortedData = [...result.data].sort((a, b) => 
          new Date(b.month || b.period || b.fecha).getTime() - 
          new Date(a.month || a.period || a.fecha).getTime()
        );
        
        const lastMonth = sortedData[0];
        
        // Intentar varios campos posibles para el saldo final
        const balance = lastMonth.balance_final || 
                       lastMonth.final_balance || 
                       lastMonth.saldo_final || 
                       lastMonth.balance || 
                       0;
        
        setInitialBalance(balance);
        
        console.log('Saldo inicial obtenido del cashflow:', balance);
      } else {
        console.log('No hay datos de cashflow disponibles');
        setInitialBalance(0);
      }
    } catch (error) {
      console.error('Error obteniendo saldo:', error);
      setInitialBalance(0);
    } finally {
      setLoadingBalance(false);
    }
  };

  const handleCreateForecast = () => {
    const today = new Date();
    const defaultStart = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const startDateStr = defaultStart.toISOString().split('T')[0];
    
    const periods = generateEmptyPeriods(
      startDateStr,
      periodType,
      periodType === 'monthly' ? 12 : 24,
      initialBalance
    );

    const newForecast: TreasuryForecast = {
      period_type: periodType,
      start_date: startDateStr,
      forecast_data: periods
    };

    setForecast(newForecast);
  };

  const handlePeriodChange = (index: number, field: 'planned_income' | 'planned_expenses', value: string) => {
    if (!forecast) return;

    const numValue = parseFloat(value) || 0;
    const updatedPeriods = [...forecast.forecast_data];
    updatedPeriods[index][field] = numValue;

    const recalculated = recalculateBalances(updatedPeriods);

    setForecast({
      ...forecast,
      forecast_data: recalculated
    });
  };

  const handleSave = async () => {
    if (!forecast) return;

    setSaving(true);
    try {
      const method = forecast.id ? 'PUT' : 'POST';
      const response = await fetch('/api/treasury-forecast', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(forecast)
      });

      const result = await response.json();
      
      if (result.data) {
        setForecast(result.data);
        alert('Previsión guardada correctamente');
      } else {
        alert('Error al guardar');
      }
    } catch (error) {
      console.error('Error guardando:', error);
      alert('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-white text-lg">Cargando previsión...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Previsión de Tesorería</h1>
          <p className="text-gray-400 mt-1">
            Planifica tus cobros y pagos futuros para anticipar tu liquidez
          </p>
        </div>
        
        {forecast && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            <Save className="h-5 w-5" />
            {saving ? 'Guardando...' : 'Guardar previsión'}
          </button>
        )}
      </div>

      {/* Configuración inicial */}
      {!forecast && (
        <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 shadow-2xl p-8">
          <h2 className="text-2xl font-semibold mb-6 text-white">Crear nueva previsión</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300 flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                Saldo inicial actual
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={initialBalance}
                  onChange={(e) => setInitialBalance(parseFloat(e.target.value) || 0)}
                  disabled={loadingBalance}
                  className={`w-full px-4 py-3 pr-32 bg-[#0a0a0a] border rounded-lg text-lg font-semibold focus:ring-1 transition-colors disabled:opacity-50 ${
                    initialBalance < 0 
                      ? 'border-red-500 text-red-400 focus:border-red-500 focus:ring-red-500' 
                      : initialBalance < 2000 && initialBalance > 0
                        ? 'border-orange-500 text-orange-400 focus:border-orange-500 focus:ring-orange-500'
                        : 'border-gray-700 text-white focus:border-green-500 focus:ring-green-500'
                  }`}
                  placeholder="0.00"
                  step="0.01"
                />
                {loadingBalance && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="animate-spin h-5 w-5 border-2 border-orange-500 border-t-transparent rounded-full"></div>
                  </div>
                )}
                {!loadingBalance && initialBalance !== 0 && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <button
                      onClick={loadCurrentBalance}
                      className="text-xs text-gray-400 hover:text-orange-500 transition-colors"
                      title="Actualizar desde cashflow"
                    >
                      🔄
                    </button>
                    <div className={`text-xs px-2 py-1 rounded whitespace-nowrap ${
                      initialBalance < 0
                        ? 'bg-red-600/20 text-red-400'
                        : initialBalance < 2000
                          ? 'bg-orange-600/20 text-orange-400'
                          : 'bg-green-600/20 text-green-400'
                    }`}>
                      Cashflow
                    </div>
                  </div>
                )}
              </div>
              <p className={`text-xs mt-2 ${
                initialBalance < 0 
                  ? 'text-red-400' 
                  : initialBalance < 2000 && initialBalance > 0
                    ? 'text-orange-400'
                    : 'text-gray-500'
              }`}>
                {loadingBalance 
                  ? 'Obteniendo saldo del cashflow...'
                  : initialBalance < 0
                    ? `⚠️ Saldo negativo: ${initialBalance.toFixed(2)} € - Necesitas financiación`
                    : initialBalance < 2000 && initialBalance > 0
                      ? `⚡ Liquidez ajustada: ${initialBalance.toFixed(2)} € - Planifica con cuidado`
                      : initialBalance !== 0 
                        ? `✓ Saldo: ${initialBalance.toFixed(2)} € (último mes de cashflow)` 
                        : 'Introduce el saldo inicial manualmente o se obtendrá del cashflow'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Periodicidad
              </label>
              <select
                value={periodType}
                onChange={(e) => setPeriodType(e.target.value as 'monthly' | 'weekly')}
                className="w-full px-4 py-3 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
              >
                <option value="monthly">Mensual</option>
                <option value="weekly">Semanal</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={handleCreateForecast}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg"
              >
                <Plus className="h-5 w-5" />
                Crear previsión
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabla de previsión */}
      {forecast && (
        <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 shadow-2xl overflow-hidden">
          <div className="p-6 border-b border-gray-800 bg-gradient-to-r from-gray-900 to-[#1a1a1a]">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-white">
                Previsión {periodType === 'monthly' ? 'Mensual' : 'Semanal'}
              </h2>
              <div className="text-sm text-gray-400 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Desde: {new Date(forecast.start_date).toLocaleDateString('es-ES')}
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-700">
                    <th className="text-left p-4 font-semibold text-gray-300">Periodo</th>
                    <th className="text-right p-4 font-semibold text-gray-300">Saldo inicial</th>
                    <th className="text-right p-4 font-semibold text-gray-300">Cobros previstos</th>
                    <th className="text-right p-4 font-semibold text-gray-300">Pagos previstos</th>
                    <th className="text-right p-4 font-semibold text-gray-300">Saldo final</th>
                    <th className="text-center p-4 font-semibold text-gray-300">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {forecast.forecast_data.map((period, index) => (
                    <tr key={index} className="border-b border-gray-800 hover:bg-[#222] transition-colors">
                      <td className="p-4 text-white font-medium">
                        {new Date(period.period_date).toLocaleDateString('es-ES', { 
                          month: 'short', 
                          year: 'numeric' 
                        })}
                      </td>
                      <td className="text-right p-4 font-medium text-gray-300">
                        {period.initial_balance.toFixed(2)} €
                      </td>
                      <td className="text-right p-4">
                        <input
                          type="number"
                          value={period.planned_income}
                          onChange={(e) => handlePeriodChange(index, 'planned_income', e.target.value)}
                          className="w-36 px-3 py-2 text-right bg-[#0a0a0a] border border-gray-700 rounded-lg text-green-400 focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors"
                          step="0.01"
                        />
                      </td>
                      <td className="text-right p-4">
                        <input
                          type="number"
                          value={period.planned_expenses}
                          onChange={(e) => handlePeriodChange(index, 'planned_expenses', e.target.value)}
                          className="w-36 px-3 py-2 text-right bg-[#0a0a0a] border border-gray-700 rounded-lg text-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors"
                          step="0.01"
                        />
                      </td>
                      <td className={`text-right p-4 font-bold text-lg ${
                        period.alert_level === 'danger' ? 'text-red-500' :
                        period.alert_level === 'warning' ? 'text-orange-500' :
                        'text-green-500'
                      }`}>
                        {period.final_balance.toFixed(2)} €
                      </td>
                      <td className="text-center p-4">
                        {period.alert_level === 'danger' && (
                          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-red-900/30">
                            <AlertTriangle className="h-5 w-5 text-red-500" />
                          </div>
                        )}
                        {period.alert_level === 'warning' && (
                          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-orange-900/30">
                            <TrendingDown className="h-5 w-5 text-orange-500" />
                          </div>
                        )}
                        {period.alert_level === 'safe' && (
                          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-900/30">
                            <TrendingUp className="h-5 w-5 text-green-500" />
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Alertas */}
            <div className="mt-6 space-y-3">
              {forecast.forecast_data.some(p => p.alert_level === 'danger') && (
                <div className="flex items-start gap-3 p-4 bg-red-950/30 border border-red-900/50 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-red-200">
                    <strong className="text-red-400">¡Alerta!</strong> Hay periodos con saldo negativo previsto. 
                    Planifica financiación o ajusta pagos.
                  </div>
                </div>
              )}
              {forecast.forecast_data.some(p => p.alert_level === 'warning') && (
                <div className="flex items-start gap-3 p-4 bg-orange-950/30 border border-orange-900/50 rounded-lg">
                  <TrendingDown className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-orange-200">
                    <strong className="text-orange-400">Atención:</strong> Algunos periodos tienen liquidez ajustada (menos de 2.000 €).
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}