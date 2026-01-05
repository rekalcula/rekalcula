// app/api/invoice-backups/route.ts
// API para gestionar backups temporales de facturas

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import {
  getUserBackupStats,
  getUserBackups,
  deleteAllUserBackups,
  deleteInvoiceBackup,
  getInvoiceBackup,
  extendBackupLifetime
} from '@/lib/invoice-backups'

/**
 * GET - Obtener estadísticas y lista de backups del usuario
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'stats'
    const invoiceId = searchParams.get('invoiceId')

    // Acción: Obtener backup específico
    if (action === 'single' && invoiceId) {
      const result = await getInvoiceBackup(invoiceId)
      
      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        backup: result.backup
      })
    }

    // Acción: Obtener lista de backups
    if (action === 'list') {
      const result = await getUserBackups(userId)
      
      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        backups: result.backups
      })
    }

    // Acción por defecto: Obtener estadísticas
    const stats = await getUserBackupStats(userId)

    return NextResponse.json({
      success: true,
      stats
    })

  } catch (error) {
    console.error('Exception in invoice-backups GET:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido' 
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Eliminar backups
 */
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const invoiceId = searchParams.get('invoiceId')
    const deleteAll = searchParams.get('all') === 'true'

    // Eliminar todos los backups del usuario
    if (deleteAll) {
      const result = await deleteAllUserBackups(userId)
      
      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: `${result.deletedCount} backup(s) eliminado(s) permanentemente`,
        deletedCount: result.deletedCount
      })
    }

    // Eliminar backup específico
    if (invoiceId) {
      const result = await deleteInvoiceBackup(invoiceId, userId)
      
      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Backup eliminado permanentemente'
      })
    }

    return NextResponse.json(
      { success: false, error: 'Se requiere invoiceId o all=true' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Exception in invoice-backups DELETE:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido' 
      },
      { status: 500 }
    )
  }
}

/**
 * PATCH - Extender tiempo de vida de un backup
 */
export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { invoiceId, additionalDays = 30 } = body

    if (!invoiceId) {
      return NextResponse.json(
        { success: false, error: 'invoiceId requerido' },
        { status: 400 }
      )
    }

    if (additionalDays < 1 || additionalDays > 90) {
      return NextResponse.json(
        { success: false, error: 'additionalDays debe estar entre 1 y 90' },
        { status: 400 }
      )
    }

    const result = await extendBackupLifetime(invoiceId, userId, additionalDays)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Backup extendido por ${additionalDays} días`,
      backup: result.backup
    })

  } catch (error) {
    console.error('Exception in invoice-backups PATCH:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido' 
      },
      { status: 500 }
    )
  }
}