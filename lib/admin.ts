import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function isAdmin(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('admin_users')
    .select('id, role')
    .eq('user_id', userId)
    .single()

  if (error || !data) return false
  return true
}

export async function isSuperAdmin(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('admin_users')
    .select('id, role')
    .eq('user_id', userId)
    .eq('role', 'super_admin')
    .single()

  if (error || !data) return false
  return true
}

export async function getAdminRole(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('admin_users')
    .select('role')
    .eq('user_id', userId)
    .single()

  if (error || !data) return null
  return data.role
}