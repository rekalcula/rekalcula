import { supabase } from './supabase'

export interface Subscription {
  id: string
  user_id: string
  status: 'trialing' | 'active' | 'canceled' | 'past_due' | 'expired'
  plan: 'free' | 'trial' | 'pro'
  billing_cycle: 'monthly' | 'yearly' | null
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  trial_start: string | null
  trial_end: string | null
  current_period_start: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
}

export async function getSubscription(userId: string): Promise<Subscription | null> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .single()
  
  if (error) return null
  return data
}

export async function hasActiveSubscription(userId: string): Promise<boolean> {
  const sub = await getSubscription(userId)
  if (!sub) return false
  
  if (sub.status === 'trialing' && sub.trial_end) {
    return new Date(sub.trial_end) > new Date()
  }
  
  return sub.status === 'active'
}

// Obtener configuración del trial desde la BD
async function getTrialConfig() {
  const { data, error } = await supabase
    .from('trial_config')
    .select('*')
    .eq('is_active', true)
    .order('updated_at', { ascending: false })
    .limit(1)
    .single()

  if (error) {
    console.error('Error fetching trial config:', error)
    // Valores por defecto si no hay configuración
    return {
      invoices_limit: 10,
      tickets_limit: 10,
      analyses_limit: 5,
      trial_days: 7
    }
  }

  return data
}

export async function createTrialSubscription(userId: string) {
  // Obtener configuración del trial desde la BD
  const trialConfig = await getTrialConfig()
  
  const trialDays = trialConfig?.trial_days || 7
  
  const trialEnd = new Date()
  trialEnd.setDate(trialEnd.getDate() + trialDays)
  
  // Crear suscripción
  const { data } = await supabase
    .from('subscriptions')
    .upsert({
      user_id: userId,
      status: 'trialing',
      plan: 'trial',
      trial_start: new Date().toISOString(),
      trial_end: trialEnd.toISOString()
    }, { onConflict: 'user_id' })
    .select()
    .single()

  // Inicializar créditos con los límites del trial
  if (data) {
    const { error: creditsError } = await supabase
      .from('user_credits')
      .upsert({
        user_id: userId,
        invoices_available: trialConfig.invoices_limit,
        tickets_available: trialConfig.tickets_limit,
        analyses_available: trialConfig.analyses_limit,
        invoices_used_this_month: 0,
        tickets_used_this_month: 0,
        analyses_used_this_month: 0,
        is_trial: true,
        last_reset_date: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' })

    if (creditsError) {
      console.error('Error initializing trial credits:', creditsError)
    }

    // Registrar transacción de créditos
    await supabase.from('credit_transactions').insert({
      user_id: userId,
      transaction_type: 'trial_start',
      credit_type: 'invoices',
      amount: trialConfig.invoices_limit,
      description: `Créditos de prueba gratuita (${trialDays} días): ${trialConfig.invoices_limit} facturas, ${trialConfig.tickets_limit} tickets, ${trialConfig.analyses_limit} análisis`
    })
  }
  
  return data
}

export async function getTrialDaysRemaining(userId: string): Promise<number> {
  const sub = await getSubscription(userId)
  if (!sub || sub.status !== 'trialing' || !sub.trial_end) return 0
  
  const diffTime = new Date(sub.trial_end).getTime() - new Date().getTime()
  return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))
}