// lib/invoice-backups.ts
// Gestión de backups temporales de facturas

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Cliente con service_role para operaciones privilegiadas
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

/**
 * Estructura del backup de factura
 */
export interface InvoiceBackupData {
  // Información del proveedor (datos sensibles)
  supplier_name: string
  supplier_address?: string
  supplier_nif?: string
  supplier_email?: string
  supplier_phone?: string
  
  // Detalles de items/líneas
  items?: Array<{
    description: string
    quantity: number
    unit_price: number
    total: number
    tax_rate?: number
  }>
  
  // Información adicional
  notes?: string
  payment_conditions?: string
  bank_account?: string
  
  // Metadata
  file_name?: string
  file_size?: number
  ocr_confidence?: number
  
  // Cualquier otro dato extraído
  [key: string]: any
}

/**
 * Estadísticas de backups del usuario
 */
export interface BackupStats {
  total_backups: number
  oldest_backup?: string
  newest_backup?: string
  days_until_delete: number
  total_size_mb?: number
}

/**
 * Crear un backup de factura con datos completos
 */
export async function createInvoiceBackup(
  userId: string,
  invoiceId: string,
  backupData: InvoiceBackupData
) {
  try {
    const { data, error } = await supabaseAdmin
      .from('invoice_backups')
      .insert({
        user_id: userId,
        invoice_id: invoiceId,
        original_data: backupData,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating invoice backup:', error)
      throw new Error(`Failed to create backup: ${error.message}`)
    }

    console.log(`✅ Backup created for invoice ${invoiceId}`)
    return { success: true, backup: data }
  } catch (error) {
    console.error('Exception creating backup:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Obtener backup de una factura específica
 */
export async function getInvoiceBackup(invoiceId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('invoice_backups')
      .select('*')
      .eq('invoice_id', invoiceId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No se encontró el backup (ya eliminado o nunca existió)
        return { success: true, backup: null }
      }
      throw new Error(`Failed to get backup: ${error.message}`)
    }

    return { success: true, backup: data }
  } catch (error) {
    console.error('Exception getting backup:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Obtener todos los backups de un usuario
 */
export async function getUserBackups(userId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('invoice_backups')
      .select(`
        id,
        invoice_id,
        created_at,
        auto_delete_at,
        invoices (
          invoice_number,
          invoice_date,
          total_amount
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to get user backups: ${error.message}`)
    }

    return { success: true, backups: data || [] }
  } catch (error) {
    console.error('Exception getting user backups:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Obtener estadísticas de backups del usuario
 */
export async function getUserBackupStats(userId: string): Promise<BackupStats> {
  try {
    const { data, error } = await supabaseAdmin
      .rpc('get_user_backup_stats', { p_user_id: userId })

    if (error) {
      console.error('Error getting backup stats:', error)
      return {
        total_backups: 0,
        days_until_delete: 0
      }
    }

    return data || {
      total_backups: 0,
      days_until_delete: 0
    }
  } catch (error) {
    console.error('Exception getting backup stats:', error)
    return {
      total_backups: 0,
      days_until_delete: 0
    }
  }
}

/**
 * Eliminar un backup específico
 */
export async function deleteInvoiceBackup(invoiceId: string, userId: string) {
  try {
    const { error } = await supabaseAdmin
      .from('invoice_backups')
      .delete()
      .eq('invoice_id', invoiceId)
      .eq('user_id', userId)

    if (error) {
      throw new Error(`Failed to delete backup: ${error.message}`)
    }

    console.log(`✅ Backup deleted for invoice ${invoiceId}`)
    return { success: true }
  } catch (error) {
    console.error('Exception deleting backup:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Eliminar TODOS los backups de un usuario
 */
export async function deleteAllUserBackups(userId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('invoice_backups')
      .delete()
      .eq('user_id', userId)
      .select('id')

    if (error) {
      throw new Error(`Failed to delete user backups: ${error.message}`)
    }

    const deletedCount = data?.length || 0
    console.log(`✅ Deleted ${deletedCount} backups for user ${userId}`)
    
    return { success: true, deletedCount }
  } catch (error) {
    console.error('Exception deleting user backups:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Ejecutar limpieza manual de backups expirados
 * (normalmente ejecutado por pg_cron, pero disponible para testing)
 */
export async function cleanupExpiredBackups() {
  try {
    const { data, error } = await supabaseAdmin
      .rpc('delete_expired_invoice_backups')

    if (error) {
      throw new Error(`Failed to cleanup expired backups: ${error.message}`)
    }

    console.log(`✅ Cleaned up ${data} expired backups`)
    return { success: true, deletedCount: data }
  } catch (error) {
    console.error('Exception cleaning up expired backups:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Verificar si una factura tiene backup
 */
export async function hasBackup(invoiceId: string): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdmin
      .from('invoice_backups')
      .select('id')
      .eq('invoice_id', invoiceId)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking backup:', error)
      return false
    }

    return !!data
  } catch (error) {
    console.error('Exception checking backup:', error)
    return false
  }
}

/**
 * Extender el tiempo de auto-eliminación de un backup
 * (ej: dar 30 días más)
 */
export async function extendBackupLifetime(
  invoiceId: string, 
  userId: string,
  additionalDays: number = 30
) {
  try {
    const { data, error } = await supabaseAdmin
      .from('invoice_backups')
      .update({
        auto_delete_at: new Date(
          Date.now() + additionalDays * 24 * 60 * 60 * 1000
        ).toISOString()
      })
      .eq('invoice_id', invoiceId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to extend backup lifetime: ${error.message}`)
    }

    console.log(`✅ Extended backup lifetime for invoice ${invoiceId}`)
    return { success: true, backup: data }
  } catch (error) {
    console.error('Exception extending backup lifetime:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Calcular días restantes hasta auto-eliminación
 */
export function calculateDaysUntilDeletion(autoDeleteAt: string): number {
  const deleteDate = new Date(autoDeleteAt)
  const now = new Date()
  const diffMs = deleteDate.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  return Math.max(0, diffDays)
}