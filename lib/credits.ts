import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type CreditType = 'invoices' | 'tickets' | 'analyses'

// ============================================
// OBTENER CONFIGURACIÓN DEL TRIAL
// ============================================
export async function getTrialConfig() {
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

// ============================================
// OBTENER CRÉDITOS DEL USUARIO
// ============================================
export async function getUserCredits(userId: string) {
  const { data, error } = await supabase
    .from('user_credits')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching credits:', error)
    return null
  }

  return data
}

// ============================================
// VERIFICAR SI TIENE CRÉDITOS DISPONIBLES
// ============================================
export async function hasCredits(userId: string, type: CreditType, amount: number = 1): Promise<boolean> {
  const credits = await getUserCredits(userId)

  if (!credits) {
    // Si no tiene registro de créditos, verificar si está en trial
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('status, plan')
      .eq('user_id', userId)
      .single()

    // En trial, inicializar créditos con límites del trial
    if (subscription?.status === 'trialing') {
      const initialized = await initializeTrialCredits(userId)
      if (initialized) {
        // Reintentar verificación después de inicializar
        return hasCredits(userId, type, amount)
      }
      return false
    }
    return false
  }

  const available = credits[`${type}_available`] || 0
  return available >= amount
}

// ============================================
// INICIALIZAR CRÉDITOS PARA USUARIO EN TRIAL
// ============================================
export async function initializeTrialCredits(userId: string): Promise<boolean> {
  // Obtener configuración actual del trial
  const trialConfig = await getTrialConfig()

  // Verificar si ya existe registro
  const existingCredits = await getUserCredits(userId)
  if (existingCredits) {
    return true // Ya tiene créditos inicializados
  }

  // Crear registro de créditos con límites del trial
  const { error } = await supabase
    .from('user_credits')
    .insert({
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
    })

  if (error) {
    console.error('Error initializing trial credits:', error)
    return false
  }

  // Registrar transacción
  await supabase.from('credit_transactions').insert({
    user_id: userId,
    transaction_type: 'trial_start',
    credit_type: 'invoices',
    amount: trialConfig.invoices_limit,
    description: `Créditos de prueba gratuita: ${trialConfig.invoices_limit} facturas, ${trialConfig.tickets_limit} tickets, ${trialConfig.analyses_limit} análisis`
  })

  return true
}

// ============================================
// USAR CRÉDITOS
// ============================================
export async function useCredits(userId: string, type: CreditType, amount: number = 1): Promise<{
  success: boolean
  remaining: number
  error?: string
}> {
  // Verificar disponibilidad
  const credits = await getUserCredits(userId)

  if (!credits) {
    // Verificar si está en trial e inicializar
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('status')
      .eq('user_id', userId)
      .single()

    if (subscription?.status === 'trialing') {
      const initialized = await initializeTrialCredits(userId)
      if (!initialized) {
        return { success: false, remaining: 0, error: 'No se pudo inicializar créditos de prueba' }
      }
      return useCredits(userId, type, amount) // Reintentar
    }

    return { success: false, remaining: 0, error: 'No tienes créditos disponibles' }
  }

  const availableField = `${type}_available` as keyof typeof credits
  const usedField = `${type}_used_this_month` as keyof typeof credits

  const available = (credits[availableField] as number) || 0

  if (available < amount) {
    // Mensaje personalizado para usuarios en trial
    const isTrialUser = credits.is_trial
    const errorMessage = isTrialUser 
      ? `Has alcanzado el límite de tu prueba gratuita. Disponibles: ${available}. Actualiza a un plan de pago para continuar.`
      : `No tienes suficientes créditos. Disponibles: ${available}`

    return {
      success: false,
      remaining: available,
      error: errorMessage
    }
  }

  // Descontar créditos
  const { error } = await supabase
    .from('user_credits')
    .update({
      [availableField]: available - amount,
      [usedField]: ((credits[usedField] as number) || 0) + amount,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId)

  if (error) {
    console.error('Error using credits:', error)
    return { success: false, remaining: available, error: 'Error al descontar créditos' }
  }

  // Registrar transacción
  await supabase.from('credit_transactions').insert({
    user_id: userId,
    transaction_type: 'usage',
    credit_type: type,
    amount: -amount,
    description: `Uso de ${amount} ${type}`
  })

  return { success: true, remaining: available - amount }
}

// ============================================
// INICIALIZAR CRÉDITOS PARA NUEVO USUARIO
// ============================================
export async function initializeUserCredits(userId: string, planSlug?: string): Promise<boolean> {
  // Obtener plan del usuario
  let plan = null

  if (planSlug) {
    const { data } = await supabase
      .from('plans')
      .select('*')
      .eq('slug', planSlug)
      .eq('is_active', true)
      .single()
    plan = data
  } else {
    // Buscar suscripción del usuario
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('plan, status')
      .eq('user_id', userId)
      .single()

    if (subscription?.plan && subscription.plan !== 'trial') {
      const { data } = await supabase
        .from('plans')
        .select('*')
        .eq('slug', subscription.plan)
        .eq('is_active', true)
        .single()
      plan = data
    } else if (subscription?.status === 'trialing') {
      // Usuario en trial - usar initializeTrialCredits
      return initializeTrialCredits(userId)
    }
  }

  if (!plan) {
    console.error('No plan found for user:', userId)
    return false
  }

  // Crear o actualizar registro de créditos
  const { error } = await supabase
    .from('user_credits')
    .upsert({
      user_id: userId,
      invoices_available: plan.invoices_limit,
      tickets_available: plan.tickets_limit,
      analyses_available: plan.analyses_limit,
      invoices_used_this_month: 0,
      tickets_used_this_month: 0,
      analyses_used_this_month: 0,
      is_trial: false,
      last_reset_date: new Date().toISOString().split('T')[0],
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id'
    })

  if (error) {
    console.error('Error initializing credits:', error)
    return false
  }

  // Registrar transacción
  await supabase.from('credit_transactions').insert({
    user_id: userId,
    transaction_type: 'refill',
    credit_type: 'invoices',
    amount: plan.invoices_limit,
    description: `Créditos iniciales - Plan ${plan.name}`
  })

  return true
}

// ============================================
// AÑADIR CRÉDITOS (compra de extras)
// ============================================
export async function addCredits(userId: string, type: CreditType, amount: number, reason: string): Promise<boolean> {
  const credits = await getUserCredits(userId)

  if (!credits) {
    await initializeUserCredits(userId)
    return addCredits(userId, type, amount, reason)
  }

  const availableField = `${type}_available`
  const currentAmount = (credits as any)[availableField] || 0

  const { error } = await supabase
    .from('user_credits')
    .update({
      [availableField]: currentAmount + amount,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId)

  if (error) {
    console.error('Error adding credits:', error)
    return false
  }

  // Registrar transacción
  await supabase.from('credit_transactions').insert({
    user_id: userId,
    transaction_type: 'purchase',
    credit_type: type,
    amount: amount,
    description: reason
  })

  return true
}

// ============================================
// REINICIO MENSUAL CON ACUMULACIÓN
// ============================================
export async function monthlyRefill(userId: string): Promise<boolean> {
  // Obtener suscripción y plan
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('plan, status')
    .eq('user_id', userId)
    .single()

  if (!subscription || subscription.status !== 'active') {
    return false
  }

  const { data: plan } = await supabase
    .from('plans')
    .select('*')
    .eq('slug', subscription.plan)
    .single()

  if (!plan) {
    return false
  }

  const credits = await getUserCredits(userId)
  if (!credits) {
    return initializeUserCredits(userId, subscription.plan)
  }

  // Calcular nuevos créditos con acumulación
  const maxAccumulation = plan.accumulation_factor || 2

  const newInvoices = Math.min(
    credits.invoices_available + plan.invoices_limit,
    plan.invoices_limit * maxAccumulation
  )
  const newTickets = Math.min(
    credits.tickets_available + plan.tickets_limit,
    plan.tickets_limit * maxAccumulation
  )
  const newAnalyses = Math.min(
    credits.analyses_available + plan.analyses_limit,
    plan.analyses_limit * maxAccumulation
  )

  const { error } = await supabase
    .from('user_credits')
    .update({
      invoices_available: newInvoices,
      tickets_available: newTickets,
      analyses_available: newAnalyses,
      invoices_used_this_month: 0,
      tickets_used_this_month: 0,
      analyses_used_this_month: 0,
      is_trial: false,
      last_reset_date: new Date().toISOString().split('T')[0],
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId)

  if (error) {
    console.error('Error in monthly refill:', error)
    return false
  }

  return true
}

// ============================================
// OBTENER RESUMEN DE CRÉDITOS PARA UI
// ============================================
export async function getCreditsSummary(userId: string) {
  const credits = await getUserCredits(userId)

  // Obtener plan del usuario
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('plan, status')
    .eq('user_id', userId)
    .single()

  let plan = null
  let limits = null

  if (subscription?.status === 'trialing') {
    // Para usuarios en trial, usar configuración del trial
    const trialConfig = await getTrialConfig()
    limits = {
      invoices_limit: trialConfig.invoices_limit,
      tickets_limit: trialConfig.tickets_limit,
      analyses_limit: trialConfig.analyses_limit,
      name: 'Prueba Gratuita'
    }
  } else if (subscription?.plan) {
    const { data } = await supabase
      .from('plans')
      .select('*')
      .eq('slug', subscription.plan)
      .single()
    plan = data
    limits = plan
  }

  if (!credits) {
    return {
      invoices: { available: 0, limit: limits?.invoices_limit || 0, used: 0 },
      tickets: { available: 0, limit: limits?.tickets_limit || 0, used: 0 },
      analyses: { available: 0, limit: limits?.analyses_limit || 0, used: 0 },
      plan: limits?.name || 'Sin plan',
      status: subscription?.status || 'none',
      isTrial: subscription?.status === 'trialing'
    }
  }

  return {
    invoices: {
      available: credits.invoices_available,
      limit: limits?.invoices_limit || 0,
      used: credits.invoices_used_this_month
    },
    tickets: {
      available: credits.tickets_available,
      limit: limits?.tickets_limit || 0,
      used: credits.tickets_used_this_month
    },
    analyses: {
      available: credits.analyses_available,
      limit: limits?.analyses_limit || 0,
      used: credits.analyses_used_this_month
    },
    plan: limits?.name || 'Sin plan',
    status: subscription?.status || 'none',
    isTrial: credits.is_trial || subscription?.status === 'trialing'
  }
}
