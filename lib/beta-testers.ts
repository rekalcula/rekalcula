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

// ========================================
// FUNCIÓN AUXILIAR: Verificar si es un ID de Clerk válido
// ========================================
function isValidClerkUserId(userId: string): boolean {
  if (!userId || typeof userId !== 'string') return false
  
  // Los IDs de Clerk tienen formato: user_XXXXXXXXXXXXXXXXXXXXXXXXXX
  const clerkPattern = /^user_[a-zA-Z0-9]{20,}$/
  return clerkPattern.test(userId)
}

// ========================================
// FUNCIÓN AUXILIAR: Verificar usuario en Clerk API
// ========================================
async function verifyClerkUser(userId: string): Promise<{ exists: boolean; error?: string }> {
  try {
    const clerkSecretKey = process.env.CLERK_SECRET_KEY
    
    if (!clerkSecretKey) {
      console.warn('CLERK_SECRET_KEY no configurado')
      // Sin clave de Clerk, solo validamos el formato
      return { exists: isValidClerkUserId(userId) }
    }

    const response = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
      headers: {
        'Authorization': `Bearer ${clerkSecretKey}`,
        'Content-Type': 'application/json'
      }
    })

    if (response.ok) {
      return { exists: true }
    } else if (response.status === 404) {
      return { exists: false, error: 'El usuario no existe en Clerk. Verifica que el ID sea correcto.' }
    } else {
      console.warn('Error verificando usuario en Clerk:', response.status)
      // Si hay error de API, permitir si el formato es válido
      return { exists: isValidClerkUserId(userId) }
    }
  } catch (error) {
    console.error('Error conectando con Clerk API:', error)
    return { exists: isValidClerkUserId(userId) }
  }
}

// ========================================
// CORREGIDO: Añadir nuevo beta tester
// ========================================
export async function addBetaTester(
  userId: string, 
  grantedBy: string, 
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  
  // ========================================
  // PASO 1: Validar que no esté vacío
  // ========================================
  if (!userId || userId.trim() === '') {
    return { success: false, error: 'El ID de usuario es requerido' }
  }

  const trimmedUserId = userId.trim()

  // ========================================
  // PASO 2: Validar formato de ID de Clerk
  // ========================================
  if (!isValidClerkUserId(trimmedUserId)) {
    // Detectar si es un email
    if (trimmedUserId.includes('@')) {
      return { 
        success: false, 
        error: 'Debes introducir el ID de Clerk (ej: user_2abc123...), no el email del usuario.' 
      }
    }
    return { 
      success: false, 
      error: 'Formato de ID inválido. Debe ser un ID de Clerk (ej: user_2abc123...)' 
    }
  }

  // ========================================
  // PASO 3: Verificar que el usuario existe en Clerk
  // ========================================
  const clerkCheck = await verifyClerkUser(trimmedUserId)
  
  if (!clerkCheck.exists) {
    return { 
      success: false, 
      error: clerkCheck.error || 'El usuario no existe en Clerk' 
    }
  }

  // ========================================
  // PASO 4: Verificar si ya es beta tester
  // ========================================
  const { data: existing } = await supabase
    .from('beta_testers')
    .select('id, is_active, notes')
    .eq('user_id', trimmedUserId)
    .single()

  if (existing?.is_active) {
    return { success: false, error: 'El usuario ya es beta tester activo' }
  }

  // ========================================
  // PASO 5: Si existía pero estaba revocado, reactivar
  // ========================================
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
    
    // Actualizar suscripción si existe
    await updateSubscriptionBetaStatus(trimmedUserId, true)
    
    return { success: true }
  }

  // ========================================
  // PASO 6: Crear nuevo registro de beta tester
  // ========================================
  const { error } = await supabase
    .from('beta_testers')
    .insert({
      user_id: trimmedUserId,
      granted_by: grantedBy,
      notes: notes || null
    })

  if (error) {
    return { success: false, error: error.message }
  }

  // ========================================
  // PASO 7: Crear o actualizar suscripción como beta tester
  // ========================================
  await ensureBetaTesterSubscription(trimmedUserId)

  return { success: true }
}

// ========================================
// Función auxiliar: Asegurar que existe suscripción beta
// ========================================
async function ensureBetaTesterSubscription(userId: string): Promise<void> {
  const { data: existingSub } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('user_id', userId)
    .single()

  if (!existingSub) {
    // Crear suscripción de tipo beta_tester
    await supabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        status: 'active',
        plan_type: 'beta_tester',
        is_beta_tester: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
  } else {
    // Actualizar suscripción existente
    await updateSubscriptionBetaStatus(userId, true)
  }
}

// ========================================
// Función auxiliar: Actualizar estado beta en suscripción
// ========================================
async function updateSubscriptionBetaStatus(userId: string, isBeta: boolean): Promise<void> {
  await supabase
    .from('subscriptions')
    .update({
      is_beta_tester: isBeta,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId)
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

  // También actualizar la suscripción
  await updateSubscriptionBetaStatus(userId, false)

  return { success: true }
}

// Verificar si un usuario es beta tester activo
export async function isBetaTester(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('beta_testers')
    .select('is_active')
    .eq('user_id', userId)
    .eq('is_active', true)
    .single()

  return !!data
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