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
// FUNCIÓN: Verificar si es un email
// ========================================
function isEmail(input: string): boolean {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailPattern.test(input)
}

// ========================================
// FUNCIÓN: Verificar si es un ID de Clerk válido
// ========================================
function isValidClerkUserId(userId: string): boolean {
  if (!userId || typeof userId !== 'string') return false
  const clerkPattern = /^user_[a-zA-Z0-9]{20,}$/
  return clerkPattern.test(userId)
}

// ========================================
// FUNCIÓN: Buscar usuario en Clerk por email
// ========================================
async function findClerkUserByEmail(email: string): Promise<{ userId: string | null; error?: string }> {
  try {
    const clerkSecretKey = process.env.CLERK_SECRET_KEY
    
    if (!clerkSecretKey) {
      return { userId: null, error: 'CLERK_SECRET_KEY no configurado en el servidor' }
    }

    // Buscar usuarios por email en Clerk API
    const response = await fetch(
      `https://api.clerk.com/v1/users?email_address=${encodeURIComponent(email)}`,
      {
        headers: {
          'Authorization': `Bearer ${clerkSecretKey}`,
          'Content-Type': 'application/json'
        }
      }
    )

    if (!response.ok) {
      console.error('Error buscando usuario en Clerk:', response.status)
      return { userId: null, error: 'Error al conectar con Clerk API' }
    }

    const users = await response.json()

    if (!users || users.length === 0) {
      return { userId: null, error: `No se encontró ningún usuario con el email: ${email}` }
    }

    // Devolver el primer usuario encontrado
    return { userId: users[0].id }

  } catch (error) {
    console.error('Error en findClerkUserByEmail:', error)
    return { userId: null, error: 'Error al buscar usuario' }
  }
}

// ========================================
// FUNCIÓN: Verificar que un user_id existe en Clerk
// ========================================
async function verifyClerkUserById(userId: string): Promise<{ exists: boolean; error?: string }> {
  try {
    const clerkSecretKey = process.env.CLERK_SECRET_KEY
    
    if (!clerkSecretKey) {
      // Sin clave, solo validamos formato
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
      return { exists: false, error: 'El usuario no existe en Clerk' }
    } else {
      return { exists: isValidClerkUserId(userId) }
    }
  } catch (error) {
    console.error('Error verificando usuario:', error)
    return { exists: isValidClerkUserId(userId) }
  }
}

// ========================================
// FUNCIÓN PRINCIPAL: Añadir nuevo beta tester
// Acepta EMAIL o ID de Clerk
// ========================================
export async function addBetaTester(
  userInput: string, 
  grantedBy: string, 
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  
  // ========================================
  // PASO 1: Validar que no esté vacío
  // ========================================
  if (!userInput || userInput.trim() === '') {
    return { success: false, error: 'El ID de usuario o email es requerido' }
  }

  const trimmedInput = userInput.trim()
  let clerkUserId: string

  // ========================================
  // PASO 2: Determinar si es email o ID de Clerk
  // ========================================
  if (isEmail(trimmedInput)) {
    // Es un email - buscar el usuario en Clerk
    console.log('Buscando usuario por email:', trimmedInput)
    
    const result = await findClerkUserByEmail(trimmedInput)
    
    if (!result.userId) {
      return { 
        success: false, 
        error: result.error || `No se encontró usuario con el email: ${trimmedInput}` 
      }
    }
    
    clerkUserId = result.userId
    console.log('Usuario encontrado:', clerkUserId)
    
  } else if (isValidClerkUserId(trimmedInput)) {
    // Es un ID de Clerk válido - verificar que existe
    const verifyResult = await verifyClerkUserById(trimmedInput)
    
    if (!verifyResult.exists) {
      return { 
        success: false, 
        error: verifyResult.error || 'El ID de usuario no existe en Clerk' 
      }
    }
    
    clerkUserId = trimmedInput
    
  } else {
    // Formato no reconocido
    return { 
      success: false, 
      error: 'Formato inválido. Introduce un email válido o un ID de Clerk (ej: user_2abc123...)' 
    }
  }

  // ========================================
  // PASO 3: Verificar si ya es beta tester
  // ========================================
  const { data: existing } = await supabase
    .from('beta_testers')
    .select('id, is_active, notes')
    .eq('user_id', clerkUserId)
    .single()

  if (existing?.is_active) {
    return { success: false, error: 'El usuario ya es beta tester activo' }
  }

  // ========================================
  // PASO 4: Si existía pero estaba revocado, reactivar
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
    
    await updateSubscriptionBetaStatus(clerkUserId, true)
    return { success: true }
  }

  // ========================================
  // PASO 5: Crear nuevo registro de beta tester
  // ========================================
  const { error } = await supabase
    .from('beta_testers')
    .insert({
      user_id: clerkUserId,
      granted_by: grantedBy,
      notes: notes || null
    })

  if (error) {
    return { success: false, error: error.message }
  }

  // ========================================
  // PASO 6: Crear o actualizar suscripción como beta tester
  // ========================================
  await ensureBetaTesterSubscription(clerkUserId)

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