import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase'

// GET - Obtener costos fijos
export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener categorías (sistema + usuario)
    const { data: categories } = await supabase
      .from('fixed_cost_categories')
      .select('*')
      .or(`is_system.eq.true,user_id.eq.${userId}`)
      .order('is_system', { ascending: false })
      .order('name')

    // Obtener costos fijos del usuario
    const { data: costs } = await supabase
      .from('fixed_costs')
      .select('*, fixed_cost_categories(*)')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    // Calcular total mensual
    const monthlyTotal = (costs || []).reduce((sum, cost) => {
      let monthlyAmount = cost.amount
      if (cost.frequency === 'quarterly') monthlyAmount = cost.amount / 3
      if (cost.frequency === 'yearly') monthlyAmount = cost.amount / 12
      return sum + monthlyAmount
    }, 0)

    return NextResponse.json({ 
      categories: categories || [], 
      costs: costs || [],
      monthlyTotal 
    })

  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// POST - Crear costo fijo o categoría
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { type, ...data } = body

    if (type === 'category') {
      const { data: category, error } = await supabase
        .from('fixed_cost_categories')
        .insert({
          user_id: userId,
          name: data.name,
          icon: data.icon || '📦',
          color: data.color || '#3B82F6',
          is_system: false
        })
        .select()
        .single()

      if (error) throw error
      return NextResponse.json({ success: true, category })

    } else {
      const { data: cost, error } = await supabase
        .from('fixed_costs')
        .insert({
          user_id: userId,
          category_id: data.category_id,
          name: data.name,
          description: data.description,
          amount: data.amount,
          frequency: data.frequency || 'monthly',
          start_date: data.start_date,
          invoice_id: data.invoice_id
        })
        .select()
        .single()

      if (error) throw error
      return NextResponse.json({ success: true, cost })
    }

  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error al guardar' }, { status: 500 })
  }
}

// PUT - Actualizar costo fijo
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { id, ...data } = body

    const { error } = await supabase
      .from('fixed_costs')
      .update({
        category_id: data.category_id,
        name: data.name,
        description: data.description,
        amount: data.amount,
        frequency: data.frequency,
        is_active: data.is_active,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw error
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 })
  }
}

// DELETE - Eliminar costo fijo
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
    }

    await supabase
      .from('fixed_costs')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 })
  }
}