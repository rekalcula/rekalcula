import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { isAdmin } from '@/lib/admin'
import { 
  getBetaTesters, 
  addBetaTester, 
  revokeBetaTester,
  getBetaTestersSummary 
} from '@/lib/beta-testers'

// GET: Obtener lista de beta testers
export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId || !isAdmin(userId)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const testers = await getBetaTesters()
    const summary = await getBetaTestersSummary()

    return NextResponse.json({
      success: true,
      testers,
      summary
    })
  } catch (error) {
    console.error('Error fetching beta testers:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener beta testers' },
      { status: 500 }
    )
  }
}

// POST: Añadir nuevo beta tester
export async function POST(request: NextRequest) {
  try {
    const { userId: adminId } = await auth()
    if (!adminId || !isAdmin(adminId)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { userId, notes } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Se requiere userId' },
        { status: 400 }
      )
    }

    const result = await addBetaTester(userId, adminId, notes)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error adding beta tester:', error)
    return NextResponse.json(
      { success: false, error: 'Error al añadir beta tester' },
      { status: 500 }
    )
  }
}

// DELETE: Revocar acceso de beta tester
export async function DELETE(request: NextRequest) {
  try {
    const { userId: adminId } = await auth()
    if (!adminId || !isAdmin(adminId)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Se requiere userId' },
        { status: 400 }
      )
    }

    const result = await revokeBetaTester(userId)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error revoking beta tester:', error)
    return NextResponse.json(
      { success: false, error: 'Error al revocar beta tester' },
      { status: 500 }
    )
  }
}