import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase'

// GET - Obtener productos y categorías
export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener categorías
    const { data: categories } = await supabase
      .from('product_categories')
      .select('*')
      .eq('user_id', userId)
      .order('sort_order, name')

    // Obtener productos
    const { data: products } = await supabase
      .from('products')
      .select('*, product_categories(*)')
      .eq('user_id', userId)
      .order('sort_order, name')

    return NextResponse.json({ categories: categories || [], products: products || [] })

  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// POST - Crear producto o categoría
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
        .from('product_categories')
        .insert({
          user_id: userId,
          name: data.name,
          icon: data.icon || '📦',
          color: data.color || '#3B82F6'
        })
        .select()
        .single()

      if (error) throw error
      return NextResponse.json({ success: true, category })

    } else {
      const { data: product, error } = await supabase
        .from('products')
        .insert({
          user_id: userId,
          category_id: data.category_id,
          name: data.name,
          description: data.description,
          sale_price: data.sale_price,
          cost_price: data.cost_price || 0,
          unit: data.unit || 'unidad',
          icon: data.icon
        })
        .select()
        .single()

      if (error) throw error
      return NextResponse.json({ success: true, product })
    }

  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error al guardar' }, { status: 500 })
  }
}

// PUT - Actualizar producto
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { id, type, ...data } = body

    if (type === 'category') {
      const { error } = await supabase
        .from('product_categories')
        .update({ name: data.name, icon: data.icon, color: data.color })
        .eq('id', id)
        .eq('user_id', userId)

      if (error) throw error

    } else {
      const { error } = await supabase
        .from('products')
        .update({
          category_id: data.category_id,
          name: data.name,
          description: data.description,
          sale_price: data.sale_price,
          cost_price: data.cost_price,
          unit: data.unit,
          icon: data.icon,
          is_active: data.is_active
        })
        .eq('id', id)
        .eq('user_id', userId)

      if (error) throw error
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 })
  }
}

// DELETE - Eliminar producto o categoría
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const type = searchParams.get('type')

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
    }

    if (type === 'category') {
      // Primero eliminar productos de la categoría
      await supabase
        .from('products')
        .delete()
        .eq('category_id', id)
        .eq('user_id', userId)

      // Luego eliminar categoría
      await supabase
        .from('product_categories')
        .delete()
        .eq('id', id)
        .eq('user_id', userId)

    } else {
      await supabase
        .from('products')
        .delete()
        .eq('id', id)
        .eq('user_id', userId)
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 })
  }
}