import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Obtener formas de pago
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const businessType = searchParams.get('businessType')

    let query = supabase
      .from('payment_methods')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (type && type !== 'all') {
      query = query.or(`payment_type.eq.${type},payment_type.eq.both`)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching payment methods:', error)
      return NextResponse.json({ error: 'Error al obtener formas de pago' }, { status: 500 })
    }

    let methods = data || []
    if (businessType) {
      methods = methods.map(method => ({
        ...method,
        is_recommended: method.default_for_business_types?.[businessType] === true
      }))
    }

    return NextResponse.json({ 
      success: true, 
      paymentMethods: methods 
    })

  } catch (error) {
    console.error('Error in payment-methods GET:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// POST - Crear nueva forma de pago
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      name, 
      slug, 
      days, 
      payment_type, 
      description,
      default_for_business_types,
      is_default_b2c,
      is_default_b2b,
      display_order 
    } = body

    if (!name || !slug) {
      return NextResponse.json({ error: 'Nombre y slug son requeridos' }, { status: 400 })
    }

    if (days < 0 || days > 365) {
      return NextResponse.json({ error: 'Días debe estar entre 0 y 365' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('payment_methods')
      .insert({
        name,
        slug: slug.toLowerCase().replace(/\s+/g, '-'),
        days: days || 0,
        payment_type: payment_type || 'both',
        description,
        default_for_business_types: default_for_business_types || {},
        is_default_b2c: is_default_b2c || false,
        is_default_b2b: is_default_b2b || false,
        display_order: display_order || 100,
        is_system: false
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating payment method:', error)
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Ya existe una forma de pago con ese slug' }, { status: 400 })
      }
      return NextResponse.json({ error: 'Error al crear forma de pago' }, { status: 500 })
    }

    return NextResponse.json({ success: true, paymentMethod: data })

  } catch (error) {
    console.error('Error in payment-methods POST:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// PUT - Actualizar forma de pago
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'ID es requerido' }, { status: 400 })
    }

    const { data: existing } = await supabase
      .from('payment_methods')
      .select('is_system')
      .eq('id', id)
      .single()

    if (existing?.is_system) {
      const allowedUpdates: any = {}
      if ('is_active' in updates) allowedUpdates.is_active = updates.is_active
      if ('display_order' in updates) allowedUpdates.display_order = updates.display_order
      
      if (Object.keys(allowedUpdates).length === 0) {
        return NextResponse.json({ error: 'No se pueden modificar formas de pago del sistema' }, { status: 400 })
      }
      
      const { data, error } = await supabase
        .from('payment_methods')
        .update(allowedUpdates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return NextResponse.json({ success: true, paymentMethod: data })
    }

    const { data, error } = await supabase
      .from('payment_methods')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating payment method:', error)
      return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 })
    }

    return NextResponse.json({ success: true, paymentMethod: data })

  } catch (error) {
    console.error('Error in payment-methods PUT:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// DELETE - Eliminar forma de pago
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID es requerido' }, { status: 400 })
    }

    const { data: existing } = await supabase
      .from('payment_methods')
      .select('is_system')
      .eq('id', id)
      .single()

    if (existing?.is_system) {
      return NextResponse.json({ error: 'No se pueden eliminar formas de pago del sistema' }, { status: 400 })
    }

    const { error } = await supabase
      .from('payment_methods')
      .update({ is_active: false })
      .eq('id', id)

    if (error) {
      console.error('Error deleting payment method:', error)
      return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error in payment-methods DELETE:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}