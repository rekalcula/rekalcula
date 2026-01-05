import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface BetaTester {
  id: string
  user_id: string
  granted_by: string
  granted_at: string
  revoked_at: string | null
  is_active: boolean
  notes: string | null
  total_operations: number
  total_invoices: number
  total_tickets: number
  total_analyses: number
  total_cost_eur: number
  last_usage: string
}

// Obtener todos los beta testers con estadísticas
export async function getBetaTesters(): Promise<BetaTester[]> {
  const { data, error } = await supabase
    .from('beta_tester_usage_stats')
    .select('*')
    .order('granted_at', { ascending: false })

  if (error) {
    console.error('Error fetching beta testers:', error)
    return []
  }

  return data || []
}

// Añadir nuevo beta tester
export async function addBetaTester(
  userId: string, 
  grantedBy: string, 
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  // Verificar si el usuario existe
  const { data: userExists } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('user_id', userId)
    .single()

  if (!userExists) {
    return { success: false, error: 'El usuario no existe en el sistema' }
  }

  // Verificar si ya es beta tester
  const { data: existing } = await supabase
    .from('beta_testers')
    .select('id, is_active')
    .eq('user_id', userId)
    .single()

  if (existing?.is_active) {
    return { success: false, error: 'El usuario ya es beta tester' }
  }

  // Si existía pero estaba revocado, reactivar
  if (existing && !existing.is_active) {
    const { error } = await supabase
      .from('beta_testers')
      .update({
        is_active: true,
        revoked_at: null,
        granted_by: grantedBy,
        granted_at: new Date().toISOString(),
        notes: notes || existing.notes
      })
      .eq('id', existing.id)

    if (error) {
      return { success: false, error: error.message }
    }
    return { success: true }
  }

  // Crear nuevo registro
  const { error } = await supabase
    .from('beta_testers')
    .insert({
      user_id: userId,
      granted_by: grantedBy,
      notes: notes || null
    })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

// Revocar acceso de beta tester
export async function revokeBetaTester(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('beta_testers')
    .update({
      is_active: false,
      revoked_at: new Date().toISOString()
    })
    .eq('user_id', userId)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

// Obtener resumen de costes de todos los beta testers
export async function getBetaTestersSummary(): Promise<{
  totalTesters: number
  activeTesters: number
  totalCostEur: number
  totalOperations: number
}> {
  const { data, error } = await supabase
    .from('beta_tester_usage_stats')
    .select('is_active, total_cost_eur, total_operations')

  if (error || !data) {
    return { totalTesters: 0, activeTesters: 0, totalCostEur: 0, totalOperations: 0 }
  }

  return {
    totalTesters: data.length,
    activeTesters: data.filter(t => t.is_active).length,
    totalCostEur: data.reduce((sum, t) => sum + (t.total_cost_eur || 0), 0),
    totalOperations: data.reduce((sum, t) => sum + (t.total_operations || 0), 0)
  }
}