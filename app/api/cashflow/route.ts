import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const periodo = searchParams.get('periodo') || 'mes';

    // Calcular fechas según el período
    const now = new Date();
    const startDate = new Date();
    
    switch (periodo) {
      case '3meses':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case '6meses':
        startDate.setMonth(now.getMonth() - 6);
        break;
      default: // mes
        startDate.setMonth(now.getMonth() - 1);
        startDate.setDate(1);
    }

    // ========================================
    // OBTENER VENTAS (ENTRADAS/COBROS)
    // ========================================
    const { data: ventas, error: errorVentas } = await supabase
      .from('sales')
      .select('id, total, payment_status, payment_due_date, actual_payment_date, customer_name, sale_date, created_at')
      .eq('user_id', userId)
      .gte('sale_date', startDate.toISOString().split('T')[0])
      .lte('sale_date', now.toISOString().split('T')[0]);

    if (errorVentas) {
      console.error('Error obteniendo ventas:', errorVentas);
    }

    // ========================================
    // OBTENER FACTURAS (SALIDAS/PAGOS)
    // ========================================
    const { data: facturas, error: errorFacturas } = await supabase
      .from('invoices')
      .select('id, total_amount, invoice_date, payment_status, payment_method, payment_due_date, actual_payment_date, category, supplier, payment_confirmed')
      .eq('user_id', userId)
      .gte('invoice_date', startDate.toISOString().split('T')[0])
      .lte('invoice_date', now.toISOString().split('T')[0]);

    if (errorFacturas) {
      console.error('Error obteniendo facturas:', errorFacturas);
    }

    // ========================================
    // OBTENER COSTOS FIJOS
    // ========================================
    const { data: costosFijos, error: errorCostos } = await supabase
      .from('fixed_costs')
      .select('id, name, amount, frequency')
      .eq('user_id', userId)
      .eq('active', true);

    if (errorCostos) {
      console.error('Error obteniendo costos fijos:', errorCostos);
    }

    // ========================================
    // CALCULAR TOTALES DE ENTRADAS (VENTAS)
    // ========================================
    const totalVentas = ventas?.reduce((sum, v) => sum + (v.total || 0), 0) || 0;
    
    // Ventas cobradas = las que tienen payment_status = 'paid'
    const ventasCobradas = ventas
      ?.filter(v => v.payment_status === 'paid')
      .reduce((sum, v) => sum + (v.total || 0), 0) || 0;
    
    const ventasPendientes = totalVentas - ventasCobradas;

    // ========================================
    // CALCULAR TOTALES DE SALIDAS (FACTURAS)
    // Usando payment_status correctamente
    // ========================================
    const totalFacturas = facturas?.reduce((sum, f) => sum + (f.total_amount || 0), 0) || 0;
    
    // Facturas pagadas = las que tienen payment_status = 'paid'
    const facturasPagadas = facturas
      ?.filter(f => f.payment_status === 'paid')
      .reduce((sum, f) => sum + (f.total_amount || 0), 0) || 0;
    
    // Facturas pendientes = las que tienen payment_status != 'paid'
    const facturasPendientes = totalFacturas - facturasPagadas;

    // ========================================
    // CALCULAR COSTOS FIJOS MENSUALES
    // ========================================
    const costosFijosMensuales = costosFijos?.reduce((sum, c) => {
      let mensual = c.amount || 0;
      if (c.frequency === 'annual' || c.frequency === 'yearly') mensual = mensual / 12;
      if (c.frequency === 'quarterly') mensual = mensual / 3;
      return sum + mensual;
    }, 0) || 0;

    // Calcular meses en el período
    const mesesEnPeriodo = periodo === 'mes' ? 1 : periodo === '3meses' ? 3 : 6;
    const totalCostosFijos = costosFijosMensuales * mesesEnPeriodo;

    // Total de salidas incluyendo costos fijos
    const totalSalidas = totalFacturas + totalCostosFijos;
    const salidasPagadas = facturasPagadas;
    const salidasPendientes = facturasPendientes + totalCostosFijos;

    // ========================================
    // GENERAR DATOS HISTÓRICOS POR MES
    // ========================================
    const datosHistoricos: Array<{ periodo: string; entradas: number; salidas: number }> = [];
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    
    for (let i = mesesEnPeriodo - 1; i >= 0; i--) {
      const mesDate = new Date();
      mesDate.setMonth(now.getMonth() - i);
      const mesIndex = mesDate.getMonth();
      const mesNombre = meses[mesIndex];
      const año = mesDate.getFullYear();
      
      // Filtrar ventas del mes
      const ventasMes = ventas?.filter(v => {
        const fecha = new Date(v.sale_date || v.created_at);
        return fecha.getMonth() === mesIndex && fecha.getFullYear() === año;
      }).reduce((sum, v) => sum + (v.total || 0), 0) || 0;

      // Filtrar facturas del mes
      const facturasMes = facturas?.filter(f => {
        const fecha = new Date(f.invoice_date);
        return fecha.getMonth() === mesIndex && fecha.getFullYear() === año;
      }).reduce((sum, f) => sum + (f.total_amount || 0), 0) || 0;

      datosHistoricos.push({
        periodo: mesNombre,
        entradas: ventasMes,
        salidas: facturasMes + costosFijosMensuales
      });
    }

    // ========================================
    // PRÓXIMOS COBROS (VENTAS PENDIENTES)
    // Usando payment_due_date correctamente
    // ========================================
    const ahora = new Date();
    const en30Dias = new Date(ahora);
    en30Dias.setDate(ahora.getDate() + 30);

    // Ventas pendientes de cobro en los próximos 30 días
    const proximosCobros = ventas
      ?.filter(v => {
        // Solo ventas NO pagadas
        if (v.payment_status === 'paid') return false;
        
        // Si tiene fecha de vencimiento, verificar que esté en el rango
        if (v.payment_due_date) {
          const vencimiento = new Date(v.payment_due_date);
          return vencimiento <= en30Dias;
        }
        
        // Si no tiene fecha de vencimiento, incluir todas las pendientes
        return true;
      })
      .sort((a, b) => {
        // Ordenar por fecha de vencimiento (las más próximas primero)
        const dateA = a.payment_due_date ? new Date(a.payment_due_date).getTime() : new Date(a.sale_date || a.created_at).getTime();
        const dateB = b.payment_due_date ? new Date(b.payment_due_date).getTime() : new Date(b.sale_date || b.created_at).getTime();
        return dateA - dateB;
      })
      .slice(0, 5)
      .map(v => ({
        id: String(v.id),
        concepto: v.customer_name || 'Venta pendiente',
        monto: v.total || 0,
        fecha: v.payment_due_date || v.sale_date || v.created_at
      })) || [];

    // ========================================
    // PRÓXIMOS PAGOS (FACTURAS PENDIENTES)
    // ========================================
    const facturasProximasAPagar = facturas
      ?.filter(f => {
        // Solo facturas NO pagadas
        if (f.payment_status === 'paid') return false;
        
        // Si tiene fecha de vencimiento, verificar que esté en el rango
        if (f.payment_due_date) {
          const vencimiento = new Date(f.payment_due_date);
          return vencimiento <= en30Dias;
        }
        
        // Si no tiene fecha de vencimiento pero está pendiente, incluirla
        return true;
      })
      .sort((a, b) => {
        // Ordenar por fecha de vencimiento (las más próximas primero)
        const dateA = a.payment_due_date ? new Date(a.payment_due_date).getTime() : new Date(a.invoice_date).getTime();
        const dateB = b.payment_due_date ? new Date(b.payment_due_date).getTime() : new Date(b.invoice_date).getTime();
        return dateA - dateB;
      })
      .slice(0, 3)
      .map(f => ({
        id: String(f.id),
        concepto: f.supplier || `Factura ${f.category || 'compra'}`,
        monto: f.total_amount || 0,
        fecha: f.payment_due_date || f.invoice_date
      })) || [];

    // Combinar facturas pendientes + costos fijos del próximo mes
    const proximosPagos = [
      ...facturasProximasAPagar,
      ...(costosFijos?.slice(0, 2).map(c => ({
        id: `fixed-${c.id}`,
        concepto: c.name || 'Costo fijo mensual',
        monto: c.amount || 0,
        fecha: new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString()
      })) || [])
    ].slice(0, 5);

    // ========================================
    // RESPUESTA
    // ========================================
    return NextResponse.json({
      entradas: {
        total: totalVentas,
        cobrado: ventasCobradas,
        pendiente: ventasPendientes
      },
      salidas: {
        total: totalSalidas,
        pagado: salidasPagadas,
        pendiente: salidasPendientes,
        costosFijos: totalCostosFijos
      },
      balance: totalVentas - totalSalidas,
      proximosCobros,
      proximosPagos,
      datosHistoricos
    });

  } catch (error) {
    console.error('Error en API cashflow:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// ========================================
// POST: Marcar como pagado/cobrado
// ========================================
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { type, id, action } = body;

    if (action === 'mark_paid') {
      const table = type === 'invoice' ? 'invoices' : 'sales';
      const today = new Date().toISOString().split('T')[0];

      const { error } = await supabase
        .from(table)
        .update({ 
          payment_status: 'paid',
          actual_payment_date: today
        })
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        console.error('Error actualizando estado:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });

  } catch (error) {
    console.error('Error en POST cashflow:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}