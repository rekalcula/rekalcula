import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase'

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
    console.error('Error en GET products')
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
          name: sanitizeString(data.name, 100),
          icon: sanitizeString(data.icon, 10) || '📦',
          color: /^#[0-9A-Fa-f]{6}$/.test(data.color) ? data.color : '#3B82F6'
        })
        .select()
        .single()

      if (error) throw error
      return NextResponse.json({ success: true, category })

    } else {
      // 🔒 Validar category_id
      if (data.category_id && !isValidUUID(data.category_id)) {
        return NextResponse.json({ error: 'ID de categoría no válido' }, { status: 400 })
      }

      const { data: product, error } = await supabase
        .from('products')
        .insert({
          user_id: userId,
          category_id: data.category_id,
          name: sanitizeString(data.name, 150),
          description: sanitizeString(data.description, 500),
          sale_price: validatePrice(data.sale_price),
          cost_price: validatePrice(data.cost_price),
          unit: sanitizeString(data.unit, 50) || 'unidad',
          icon: sanitizeString(data.icon, 10)
        })
        .select()
        .single()

      if (error) throw error
      return NextResponse.json({ success: true, product })
    }

  } catch (error) {
    console.error('Error en POST products')
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

    if (!id || !isValidUUID(id)) {
      return NextResponse.json({ error: 'ID no válido' }, { status: 400 })
    }

    if (type === 'category') {
      const { error } = await supabase
        .from('product_categories')
        .update({ 
          name: sanitizeString(data.name, 100), 
          icon: sanitizeString(data.icon, 10), 
          color: /^#[0-9A-Fa-f]{6}$/.test(data.color) ? data.color : '#3B82F6'
        })
        .eq('id', id)
        .eq('user_id', userId)

      if (error) throw error

    } else {
      // 🔒 Validar category_id si se envía
      if (data.category_id && !isValidUUID(data.category_id)) {
        return NextResponse.json({ error: 'ID de categoría no válido' }, { status: 400 })
      }

      const { error } = await supabase
        .from('products')
        .update({
          category_id: data.category_id,
          name: sanitizeString(data.name, 150),
          description: sanitizeString(data.description, 500),
          sale_price: validatePrice(data.sale_price),
          cost_price: validatePrice(data.cost_price),
          unit: sanitizeString(data.unit, 50),
          icon: sanitizeString(data.icon, 10),
          is_active: data.is_active
        })
        .eq('id', id)
        .eq('user_id', userId)

      if (error) throw error
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error en PUT products')
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

    if (!id || !isValidUUID(id)) {
      return NextResponse.json({ error: 'ID no válido' }, { status: 400 })
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
    console.error('Error en DELETE products')
    return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 })
  }
}