'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, TrendingDown, TrendingUp, Calendar, Plus, Save } from 'lucide-react';
import { treasuryForecastService, type ForecastPeriod, type TreasuryForecast } from '@/lib/treasuryForecastService';

export default function TreasuryForecastDashboard() {
  const [forecast, setForecast] = useState<TreasuryForecast | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [periodType, setPeriodType] = useState<'monthly' | 'weekly'>('monthly');
  const [startDate, setStartDate] = useState('');
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
        setStartDate(result.data.start_date);
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
    
    const periods = treasuryForecastService.generateEmptyPeriods(
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
    setStartDate(startDateStr);
  };

  const handlePeriodChange = (index: number, field: 'planned_income' | 'planned_expenses', value: string) => {
    if (!forecast) return;

    const numValue = parseFloat(value) || 0;
    const updatedPeriods = [...forecast.forecast_data];
    updatedPeriods[index][field] = numValue;

    const recalculated = treasuryForecastService.recalculateBalances(updatedPeriods);

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Previsión de Tesorería</h1>
          <p className="text-muted-foreground mt-1">
            Planifica tus cobros y pagos futuros para anticipar tu liquidez
          </p>
        </div>
        
        {forecast && (
          <Button onClick={handleSave} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Guardando...' : 'Guardar previsión'}
          </Button>
        )}
      </div>

      {/* Configuración inicial */}
      {!forecast && (
        <Card>
          <CardHeader>
            <CardTitle>Crear nueva previsión</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Saldo inicial actual</Label>
                <Input
                  type="number"
                  value={initialBalance}
                  onChange={(e) => setInitialBalance(parseFloat(e.target.value) || 0)}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Saldo obtenido del último mes de cashflow
                </p>
              </div>

              <div>
                <Label>Periodicidad</Label>
                <Select value={periodType} onValueChange={(v: any) => setPeriodType(v)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Mensual</SelectItem>
                    <SelectItem value="weekly">Semanal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button onClick={handleCreateForecast} className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  Crear previsión
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabla de previsión */}
      {forecast && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                Previsión {periodType === 'monthly' ? 'Mensual' : 'Semanal'}
              </CardTitle>
              <div className="text-sm text-muted-foreground">
                Desde: {new Date(forecast.start_date).toLocaleDateString('es-ES')}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">Periodo</th>
                    <th className="text-right p-3 font-medium">Saldo inicial</th>
                    <th className="text-right p-3 font-medium">Cobros previstos</th>
                    <th className="text-right p-3 font-medium">Pagos previstos</th>
                    <th className="text-right p-3 font-medium">Saldo final</th>
                    <th className="text-center p-3 font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {forecast.forecast_data.map((period, index) => (
                    <tr key={index} className="border-b hover:bg-muted/50">
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
                        <Input
                          type="number"
                          value={period.planned_income}
                          onChange={(e) => handlePeriodChange(index, 'planned_income', e.target.value)}
                          className="w-32 text-right"
                          step="0.01"
                        />
                      </td>
                      <td className="text-right p-3">
                        <Input
                          type="number"
                          value={period.planned_expenses}
                          onChange={(e) => handlePeriodChange(index, 'planned_expenses', e.target.value)}
                          className="w-32 text-right"
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
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>¡Alerta!</strong> Hay periodos con saldo negativo previsto. 
                    Planifica financiación o ajusta pagos.
                  </AlertDescription>
                </Alert>
              )}
              {forecast.forecast_data.some(p => p.alert_level === 'warning') && (
                <Alert>
                  <TrendingDown className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Atención:</strong> Algunos periodos tienen liquidez ajustada (menos de 2.000 €).
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}