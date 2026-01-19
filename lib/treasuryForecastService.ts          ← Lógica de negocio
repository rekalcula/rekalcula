import { createClient } from '@/lib/supabase/client';

export interface ForecastPeriod {
  period_date: string;
  initial_balance: number;
  planned_income: number;
  planned_expenses: number;
  final_balance: number;
  notes?: string;
  alert_level?: 'safe' | 'warning' | 'danger';
}

export interface TreasuryForecast {
  id?: string;
  user_id?: string;
  period_type: 'monthly' | 'weekly';
  start_date: string;
  forecast_data: ForecastPeriod[];
  created_at?: string;
  updated_at?: string;
}

export const treasuryForecastService = {
  /**
   * Calcula el nivel de alerta según el saldo
   */
  calculateAlertLevel(balance: number): 'safe' | 'warning' | 'danger' {
    if (balance < 0) return 'danger';
    if (balance < 2000) return 'warning';
    return 'safe';
  },

  /**
   * Genera periodos vacíos para inicializar la previsión
   */
  generateEmptyPeriods(
    startDate: string,
    periodType: 'monthly' | 'weekly',
    count: number,
    initialBalance: number
  ): ForecastPeriod[] {
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
        alert_level: this.calculateAlertLevel(currentBalance),
        notes: ''
      });

      // Avanzar periodo
      if (periodType === 'monthly') {
        date.setMonth(date.getMonth() + 1);
      } else {
        date.setDate(date.getDate() + 7);
      }
    }

    return periods;
  },

  /**
   * Recalcula todos los saldos en cascada
   */
  recalculateBalances(periods: ForecastPeriod[]): ForecastPeriod[] {
    return periods.map((period, index) => {
      const finalBalance = period.initial_balance + period.planned_income - period.planned_expenses;
      
      const updated = {
        ...period,
        final_balance: finalBalance,
        alert_level: this.calculateAlertLevel(finalBalance)
      };

      // Actualizar saldo inicial del siguiente periodo
      if (index < periods.length - 1) {
        periods[index + 1].initial_balance = finalBalance;
      }

      return updated;
    });
  },

  /**
   * Obtener previsión activa del usuario
   */
  async getActiveForecast(userId: string): Promise<TreasuryForecast | null> {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('treasury_forecasts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) return null;

    return data as TreasuryForecast;
  },

  /**
   * Guardar o actualizar previsión
   */
  async saveForecast(forecast: TreasuryForecast): Promise<{ success: boolean; data?: TreasuryForecast; error?: string }> {
    const supabase = createClient();

    if (forecast.id) {
      // Actualizar existente
      const { data, error } = await supabase
        .from('treasury_forecasts')
        .update({
          period_type: forecast.period_type,
          start_date: forecast.start_date,
          forecast_data: forecast.forecast_data,
          updated_at: new Date().toISOString()
        })
        .eq('id', forecast.id)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data as TreasuryForecast };
    } else {
      // Crear nueva
      const { data, error } = await supabase
        .from('treasury_forecasts')
        .insert({
          user_id: forecast.user_id,
          period_type: forecast.period_type,
          start_date: forecast.start_date,
          forecast_data: forecast.forecast_data
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data as TreasuryForecast };
    }
  },

  /**
   * Obtener saldo inicial real de caja (desde cashflow)
   */
  async getCurrentCashBalance(userId: string): Promise<number> {
    const supabase = createClient();

    // Obtener última fecha con datos
    const { data: cashflowData } = await supabase
      .from('monthly_cashflow')
      .select('balance_final')
      .eq('user_id', userId)
      .order('periodo', { ascending: false })
      .limit(1)
      .single();

    return cashflowData?.balance_final || 0;
  }
};