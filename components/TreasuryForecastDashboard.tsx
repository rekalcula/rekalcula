'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, TrendingDown, TrendingUp, Plus, Save } from 'lucide-react';

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
    try {
      const response = await fetch('/api/cashflow');
      const result = await response.json();
      
      if (result.data?.length > 0) {
        const lastMonth = result.data[result.data.length - 1];
        setInitialBalance(lastMonth.balance_final || 0);
      }
    } catch (error) {
      console.error('Error obteniendo saldo:', error);
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
    return <div className="p-8">Cargando previsión...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Previsión de Tesorería</h1>
          <p className="text-gray-600 mt-1">
            Planifica tus cobros y pagos futuros para anticipar tu liquidez
          </p>
        </div>
        
        {forecast && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Guardando...' : 'Guardar previsión'}
          </button>
        )}
      </div>

      {/* Configuración inicial */}
      {!forecast && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Crear nueva previsión</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Saldo inicial actual</label>
              <input
                type="number"
                value={initialBalance}
                onChange={(e) => setInitialBalance(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border rounded-md"
              />
              <p className="text-xs text-gray-500 mt-1">
                Saldo obtenido del último mes de cashflow
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Periodicidad</label>
              <select
                value={periodType}
                onChange={(e) => setPeriodType(e.target.value as 'monthly' | 'weekly')}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="monthly">Mensual</option>
                <option value="weekly">Semanal</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={handleCreateForecast}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                <Plus className="h-4 w-4" />
                Crear previsión
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabla de previsión */}
      {forecast && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                Previsión {periodType === 'monthly' ? 'Mensual' : 'Semanal'}
              </h2>
              <div className="text-sm text-gray-600">
                Desde: {new Date(forecast.start_date).toLocaleDateString('es-ES')}
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2">
                    <th className="text-left p-3 font-semibold">Periodo</th>
                    <th className="text-right p-3 font-semibold">Saldo inicial</th>
                    <th className="text-right p-3 font-semibold">Cobros previstos</th>
                    <th className="text-right p-3 font-semibold">Pagos previstos</th>
                    <th className="text-right p-3 font-semibold">Saldo final</th>
                    <th className="text-center p-3 font-semibold">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {forecast.forecast_data.map((period, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        {new Date(period.period_date).toLocaleDateString('es-ES', { 
                          month: 'short', 
                          year: 'numeric' 
                        })}
                      </td>
                      <td className="text-right p-3 font-medium">
                        {period.initial_balance.toFixed(2)} €
                      </td>
                      <td className="text-right p-3">
                        <input
                          type="number"
                          value={period.planned_income}
                          onChange={(e) => handlePeriodChange(index, 'planned_income', e.target.value)}
                          className="w-32 px-2 py-1 text-right border rounded"
                          step="0.01"
                        />
                      </td>
                      <td className="text-right p-3">
                        <input
                          type="number"
                          value={period.planned_expenses}
                          onChange={(e) => handlePeriodChange(index, 'planned_expenses', e.target.value)}
                          className="w-32 px-2 py-1 text-right border rounded"
                          step="0.01"
                        />
                      </td>
                      <td className={`text-right p-3 font-bold ${
                        period.alert_level === 'danger' ? 'text-red-600' :
                        period.alert_level === 'warning' ? 'text-orange-600' :
                        'text-green-600'
                      }`}>
                        {period.final_balance.toFixed(2)} €
                      </td>
                      <td className="text-center p-3">
                        {period.alert_level === 'danger' && (
                          <AlertTriangle className="h-5 w-5 text-red-600 inline" />
                        )}
                        {period.alert_level === 'warning' && (
                          <TrendingDown className="h-5 w-5 text-orange-600 inline" />
                        )}
                        {period.alert_level === 'safe' && (
                          <TrendingUp className="h-5 w-5 text-green-600 inline" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Alertas */}
            <div className="mt-6 space-y-2">
              {forecast.forecast_data.some(p => p.alert_level === 'danger') && (
                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-md">
                  <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-red-800">
                    <strong>¡Alerta!</strong> Hay periodos con saldo negativo previsto. 
                    Planifica financiación o ajusta pagos.
                  </div>
                </div>
              )}
              {forecast.forecast_data.some(p => p.alert_level === 'warning') && (
                <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-md">
                  <TrendingDown className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-orange-800">
                    <strong>Atención:</strong> Algunos periodos tienen liquidez ajustada (menos de 2.000 €).
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