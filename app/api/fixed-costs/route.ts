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

    // Obtener categorías (sistema + usuario) - mantener compatibilidad
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

    // Calcular total mensual (base imponible)
    const monthlyTotal = (costs || []).reduce((sum, cost) => {
      // Usar base_amount si existe, si no amount
      let baseAmount = cost.base_amount || cost.amount || 0
      if (cost.frequency === 'quarterly') baseAmount = baseAmount / 3
      if (cost.frequency === 'yearly') baseAmount = baseAmount / 12
      return sum + baseAmount
    }, 0)

    // Calcular IVA mensual
    const monthlyVAT = (costs || []).reduce((sum, cost) => {
      let taxAmount = cost.tax_amount || 0
      if (cost.frequency === 'quarterly') taxAmount = taxAmount / 3
      if (cost.frequency === 'yearly') taxAmount = taxAmount / 12
      return sum + taxAmount
    }, 0)

    return NextResponse.json({ 
      categories: categories || [], 
      costs: costs || [],
      monthlyTotal,
      monthlyVAT,
      monthlyGross: monthlyTotal + monthlyVAT
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
      // Crear categoría personalizada (mantener compatibilidad)
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
      // Crear costo fijo con campos de IVA y nómina
      const insertData: any = {
        user_id: userId,
        name: data.name,
        description: data.description,
        frequency: data.frequency || 'monthly',
        is_active: true,
        // Campos de IVA
        amount: data.amount || data.base_amount || 0,
        base_amount: data.base_amount || data.amount || 0,
        tax_amount: data.tax_amount || 0,
        vat_rate: data.vat_rate || 0,
        includes_vat: data.includes_vat || false,
        // Tipo de coste predefinido
        cost_type: data.cost_type || null,
        // Campos de nómina
        is_payroll: data.is_payroll || false,
        payroll_data: data.payroll_data || null
      }

      // Si hay category_id (compatibilidad con sistema anterior)
      if (data.category_id) {
        insertData.category_id = data.category_id
      }

      const { data: cost, error } = await supabase
        .from('fixed_costs')
        .insert(insertData)
        .select()
        .single()

      if (error) {
        console.error('Error inserting cost:', error)
        throw error
      }
      
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

    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    // Campos básicos
    if (data.name !== undefined) updateData.name = data.name
    if (data.description !== undefined) updateData.description = data.description
    if (data.frequency !== undefined) updateData.frequency = data.frequency
    if (data.is_active !== undefined) updateData.is_active = data.is_active
    if (data.category_id !== undefined) updateData.category_id = data.category_id
    if (data.cost_type !== undefined) updateData.cost_type = data.cost_type

    // Campos de IVA
    if (data.amount !== undefined) updateData.amount = data.amount
    if (data.base_amount !== undefined) updateData.base_amount = data.base_amount
    if (data.tax_amount !== undefined) updateData.tax_amount = data.tax_amount
    if (data.vat_rate !== undefined) updateData.vat_rate = data.vat_rate
    if (data.includes_vat !== undefined) updateData.includes_vat = data.includes_vat

    // Campos de nómina
    if (data.is_payroll !== undefined) updateData.is_payroll = data.is_payroll
    if (data.payroll_data !== undefined) updateData.payroll_data = data.payroll_data

    const { error } = await supabase
      .from('fixed_costs')
      .update(updateData)
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