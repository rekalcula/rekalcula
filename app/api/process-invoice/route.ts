import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

/**
 * API Route: /api/process-invoice
 * Procesa facturas subidas por el usuario
 */

// Crear cliente de Supabase para Server Components
function createSupabaseClient() {
  const cookieStore = cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
    },
    global: {
      headers: {
        cookie: cookieStore.toString(),
      },
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseClient();

    // Verificar autenticación
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Obtener datos del body
    const body = await request.json();
    const { invoiceData, fileUrl } = body;

    if (!invoiceData) {
      return NextResponse.json(
        { error: 'Datos de factura requeridos' },
        { status: 400 }
      );
    }

    // Validar campos requeridos
    const requiredFields = ['fecha', 'total', 'empresa'];
    const missingFields = requiredFields.filter(
      (field) => !invoiceData[field]
    );

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          error: 'Campos requeridos faltantes',
          missingFields,
        },
        { status: 400 }
      );
    }

    // Insertar factura en la base de datos
    const { data: invoice, error: insertError } = await supabase
      .from('invoices')
      .insert([
        {
          user_id: user.id,
          fecha: invoiceData.fecha,
          empresa: invoiceData.empresa,
          concepto: invoiceData.concepto || '',
          base_imponible: invoiceData.baseImponible || 0,
          iva: invoiceData.iva || 0,
          total: invoiceData.total,
          tipo: invoiceData.tipo || 'gasto',
          categoria: invoiceData.categoria || 'otros',
          file_url: fileUrl || null,
          metadata: invoiceData.metadata || {},
        },
      ])
      .select()
      .single();

    if (insertError) {
      console.error('Error insertando factura:', insertError);
      return NextResponse.json(
        { error: 'Error al guardar factura', details: insertError.message },
        { status: 500 }
      );
    }

    // Registrar en el log de actividad (opcional)
    await supabase.from('activity_log').insert([
      {
        user_id: user.id,
        action: 'invoice_processed',
        entity_type: 'invoice',
        entity_id: invoice.id,
        metadata: {
          empresa: invoiceData.empresa,
          total: invoiceData.total,
        },
      },
    ]);

    return NextResponse.json(
      {
        success: true,
        invoice,
        message: 'Factura procesada correctamente',
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error procesando factura:', error);
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseClient();

    // Verificar autenticación
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Obtener parámetros de consulta
    const { searchParams } = new URL(request.url);
    const invoiceId = searchParams.get('id');

    if (invoiceId) {
      // Obtener una factura específica
      const { data: invoice, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', invoiceId)
        .eq('user_id', user.id)
        .single();

      if (error || !invoice) {
        return NextResponse.json(
          { error: 'Factura no encontrada' },
          { status: 404 }
        );
      }

      return NextResponse.json({ invoice }, { status: 200 });
    }

    // Obtener todas las facturas del usuario
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('user_id', user.id)
      .order('fecha', { ascending: false });

    if (error) {
      console.error('Error obteniendo facturas:', error);
      return NextResponse.json(
        { error: 'Error al obtener facturas', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        invoices,
        count: invoices.length,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error obteniendo facturas:', error);
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createSupabaseClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID de factura requerido' },
        { status: 400 }
      );
    }

    // Actualizar factura
    const { data: invoice, error } = await supabase
      .from('invoices')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error actualizando factura:', error);
      return NextResponse.json(
        { error: 'Error al actualizar factura', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        invoice,
        message: 'Factura actualizada correctamente',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error actualizando factura:', error);
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createSupabaseClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const invoiceId = searchParams.get('id');

    if (!invoiceId) {
      return NextResponse.json(
        { error: 'ID de factura requerido' },
        { status: 400 }
      );
    }

    // Eliminar factura
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', invoiceId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error eliminando factura:', error);
      return NextResponse.json(
        { error: 'Error al eliminar factura', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Factura eliminada correctamente',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error eliminando factura:', error);
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details: error.message,
      },
      { status: 500 }
    );
  }
}