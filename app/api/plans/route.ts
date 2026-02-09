import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { isAdmin } from '@/lib/admin'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// 🔒 VALIDACIONES
function isValidUUID(value: any): boolean {
  if (!value || typeof value !== 'string') return false
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
}

function sanitizeString(value: any, maxLength: number = 255): string {
  return String(value || '').trim().slice(0, maxLength).replace(/<[^>]*>/g, '').replace(/[<>"'`;]/g, '')
}

function validatePrice(value: any): number {
  const price = parseFloat(value)
  if (isNaN(price) || price < 0) return 0
  return Math.round(price * 100) / 100
}

// GET: Público - cualquiera puede ver planes activos
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (error) throw error

    return NextResponse.json({ success: true, plans: data })
  } catch (error: any) {
    console.error('Error en GET plans')
    return NextResponse.json({ error: 'Error al obtener planes' }, { status: 500 })
  }
}

// POST: Solo admin
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId || !(await isAdmin(userId))) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()

    const { data, error } = await supabase
      .from('plans')
      .insert({
        name: sanitizeString(body.name, 100),
        slug: sanitizeString(body.slug, 50).toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        description: sanitizeString(body.description, 500),
        price_monthly: validatePrice(body.price_monthly),
        price_yearly: validatePrice(body.price_yearly),
        invoices_limit: body.invoices_limit,
        tickets_limit: body.tickets_limit,
        analyses_limit: body.analyses_limit,
        accumulation_factor: body.accumulation_factor || 2.0,
        stripe_price_monthly: body.stripe_price_monthly,
        stripe_price_yearly: body.stripe_price_yearly,
        is_active: body.is_active ?? true,
        is_featured: body.is_featured ?? false,
        display_order: body.display_order || 0
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, plan: data })
  } catch (error: any) {
    console.error('Error en POST plans')
    return NextResponse.json({ error: 'Error al crear plan' }, { status: 500 })
  }
}

// PUT: Solo admin
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId || !(await isAdmin(userId))) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { id, ...updateData } = body

    if (!id || !isValidUUID(id)) {
      return NextResponse.json({ error: 'ID no válido' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('plans')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, plan: data })
  } catch (error: any) {
    console.error('Error en PUT plans')
    return NextResponse.json({ error: 'Error al actualizar plan' }, { status: 500 })
  }
}

// DELETE: Solo admin
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId || !(await isAdmin(userId))) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id || !isValidUUID(id)) {
      return NextResponse.json({ error: 'ID no válido' }, { status: 400 })
    }

    const { error } = await supabase
      .from('plans')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error en DELETE plans')
    return NextResponse.json({ error: 'Error al eliminar plan' }, { status: 500 })
  }
}