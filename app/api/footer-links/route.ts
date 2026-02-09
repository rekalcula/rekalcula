import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { isAdmin } from '@/lib/admin';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 🔒 VALIDACIONES
function isValidUUID(value: any): boolean {
  if (!value || typeof value !== 'string') return false
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
}

function sanitizeString(value: any, maxLength: number = 255): string {
  return String(value || '').trim().slice(0, maxLength).replace(/<[^>]*>/g, '').replace(/[<>"'`;]/g, '')
}

function isValidURL(url: string): boolean {
  try {
    const parsed = new URL(url)
    return ['http:', 'https:'].includes(parsed.protocol)
  } catch {
    return false
  }
}

// GET - Público (cualquiera puede ver los enlaces del footer)
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('footer_links')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error en GET footer-links')
    return NextResponse.json(
      { success: false, error: 'Error al obtener enlaces' },
      { status: 500 }
    );
  }
}

// POST - Solo admin
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId || !(await isAdmin(userId))) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json();
    const { name, url, icon_type, display_order } = body;

    // 🔒 Validar inputs
    if (!name || !url) {
      return NextResponse.json({ error: 'Nombre y URL requeridos' }, { status: 400 })
    }

    if (!isValidURL(url)) {
      return NextResponse.json({ error: 'URL no válida' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('footer_links')
      .insert([{ 
        name: sanitizeString(name, 100), 
        url: url.trim(), 
        icon_type: sanitizeString(icon_type, 50), 
        display_order: parseInt(display_order) || 0, 
        is_active: true 
      }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error en POST footer-links')
    return NextResponse.json(
      { success: false, error: 'Error al crear enlace' },
      { status: 500 }
    );
  }
}

// PUT - Solo admin
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId || !(await isAdmin(userId))) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json();
    const { id, name, url, icon_type, display_order, is_active } = body;

    if (!id || !isValidUUID(id)) {
      return NextResponse.json({ error: 'ID no válido' }, { status: 400 })
    }

    if (url && !isValidURL(url)) {
      return NextResponse.json({ error: 'URL no válida' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('footer_links')
      .update({ 
        name: sanitizeString(name, 100), 
        url: url?.trim(), 
        icon_type: sanitizeString(icon_type, 50), 
        display_order: parseInt(display_order) || 0, 
        is_active, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error en PUT footer-links')
    return NextResponse.json(
      { success: false, error: 'Error al actualizar enlace' },
      { status: 500 }
    );
  }
}

// DELETE - Solo admin
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId || !(await isAdmin(userId))) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || !isValidUUID(id)) {
      return NextResponse.json(
        { success: false, error: 'ID no válido' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('footer_links')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error en DELETE footer-links')
    return NextResponse.json(
      { success: false, error: 'Error al eliminar enlace' },
      { status: 500 }
    );
  }
}