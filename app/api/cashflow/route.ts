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
    // ⭐ CORREGIDO: Obtener TODAS las facturas pendientes, no solo las del período
    // ========================================
    const { data: facturasDelPeriodo, error: errorFacturas } = await supabase
      .from('invoices')
      .select('id, total_amount, invoice_date, payment_status, payment_method, payment_due_date, actual_payment_date, category, supplier, payment_confirmed, payment_terms')
      .eq('user_id', userId)
      .gte('invoice_date', startDate.toISOString().split('T')[0])
      .lte('invoice_date', now.toISOString().split('T')[0]);

    // ⭐ NUEVO: Obtener TODAS las facturas pendientes de pago (independiente del período)
    const { data: facturasPendientesGlobal } = await supabase
      .from('invoices')
      .select('id, total_amount, invoice_date, payment_status, payment_method, payment_due_date, actual_payment_date, category, supplier, payment_confirmed, payment_terms')
      .eq('user_id', userId)
      .neq('payment_status', 'paid');

    if (errorFacturas) {
      console.error('Error obteniendo facturas:', errorFacturas);
    }

    const facturas = facturasDelPeriodo || [];

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
    
    const ventasCobradas = ventas
      ?.filter(v => v.payment_status === 'paid')
      .reduce((sum, v) => sum + (v.total || 0), 0) || 0;
    
    const ventasPendientes = totalVentas - ventasCobradas;

    // ========================================
    // CALCULAR TOTALES DE SALIDAS (FACTURAS)
    // ========================================
    const totalFacturas = facturas.reduce((sum, f) => sum + (f.total_amount || 0), 0);
    
    const facturasPagadas = facturas
      .filter(f => f.payment_status === 'paid')
      .reduce((sum, f) => sum + (f.total_amount || 0), 0);
    
    const facturasPendientesDelPeriodo = totalFacturas - facturasPagadas;

    // ========================================
    // CALCULAR COSTOS FIJOS MENSUALES
    // ========================================
    const costosFijosMensuales = costosFijos?.reduce((sum, c) => {
      let mensual = c.amount || 0;
      if (c.frequency === 'annual' || c.frequency === 'yearly') mensual = mensual / 12;
      if (c.frequency === 'quarterly') mensual = mensual / 3;
      return sum + mensual;
    }, 0) || 0;

    const mesesEnPeriodo = periodo === 'mes' ? 1 : periodo === '3meses' ? 3 : 6;
    const totalCostosFijos = costosFijosMensuales * mesesEnPeriodo;

    // Total de salidas
    const totalSalidas = totalFacturas + totalCostosFijos;
    const salidasPagadas = facturasPagadas;
    const salidasPendientes = facturasPendientesDelPeriodo + totalCostosFijos;

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
      
      const ventasMes = ventas?.filter(v => {
        const fecha = new Date(v.sale_date || v.created_at);
        return fecha.getMonth() === mesIndex && fecha.getFullYear() === año;
      }).reduce((sum, v) => sum + (v.total || 0), 0) || 0;

      const facturasMes = facturas.filter(f => {
        const fecha = new Date(f.invoice_date);
        return fecha.getMonth() === mesIndex && fecha.getFullYear() === año;
      }).reduce((sum, f) => sum + (f.total_amount || 0), 0);

      datosHistoricos.push({
        periodo: mesNombre,
        entradas: ventasMes,
        salidas: facturasMes + costosFijosMensuales
      });
    }

    // ========================================
    // PRÓXIMOS COBROS (VENTAS PENDIENTES)
    // ========================================
    const ahora = new Date();
    const en30Dias = new Date(ahora);
    en30Dias.setDate(ahora.getDate() + 30);
    const en60Dias = new Date(ahora);
    en60Dias.setDate(ahora.getDate() + 60);

    const proximosCobros = ventas
      ?.filter(v => {
        if (v.payment_status === 'paid') return false;
        if (v.payment_due_date) {
          const vencimiento = new Date(v.payment_due_date);
          return vencimiento <= en60Dias;
        }
        return true;
      })
      .sort((a, b) => {
        const dateA = a.payment_due_date ? new Date(a.payment_due_date).getTime() : new Date(a.sale_date || a.created_at).getTime();
        const dateB = b.payment_due_date ? new Date(b.payment_due_date).getTime() : new Date(b.sale_date || b.created_at).getTime();
        return dateA - dateB;
      })
      .slice(0, 10) // ⭐ Aumentado de 5 a 10
      .map(v => ({
        id: String(v.id),
        concepto: v.customer_name || 'Venta pendiente',
        monto: v.total || 0,
        fecha: v.payment_due_date || v.sale_date || v.created_at
      })) || [];

    // ========================================
    // PRÓXIMOS PAGOS (FACTURAS PENDIENTES)
    // ⭐ CORREGIDO: Usar facturas pendientes GLOBALES, no solo del período
    // ⭐ CORREGIDO: Aumentar límite de 3 a 10
    // ========================================
    
    // Calcular fecha de vencimiento para facturas sin payment_due_date
    const calcularVencimiento = (factura: any): Date => {
      // Si tiene fecha de vencimiento, usarla
      if (factura.payment_due_date) {
        return new Date(factura.payment_due_date);
      }
      
      // Si no tiene, calcular basándose en payment_terms
      const fechaFactura = new Date(factura.invoice_date);
      const terms = factura.payment_terms || 'immediate';
      
      switch (terms) {
        case '30_days':
          fechaFactura.setDate(fechaFactura.getDate() + 30);
          break;
        case '45_days':
          fechaFactura.setDate(fechaFactura.getDate() + 45);
          break;
        case '60_days':
          fechaFactura.setDate(fechaFactura.getDate() + 60);
          break;
        case '90_days':
          fechaFactura.setDate(fechaFactura.getDate() + 90);
          break;
        default: // immediate
          // La fecha de vencimiento es la fecha de la factura
          break;
      }
      
      return fechaFactura;
    };

    const facturasProximasAPagar = (facturasPendientesGlobal || [])
      .filter(f => {
        // Solo facturas NO pagadas
        if (f.payment_status === 'paid') return false;
        return true;
      })
      .map(f => ({
        ...f,
        fechaVencimientoCalculada: calcularVencimiento(f)
      }))
      .sort((a, b) => {
        // Ordenar por fecha de vencimiento calculada
        return a.fechaVencimientoCalculada.getTime() - b.fechaVencimientoCalculada.getTime();
      })
      .slice(0, 10) // ⭐ Aumentado de 3 a 10
      .map(f => ({
        id: String(f.id),
        concepto: f.supplier || f.category || 'Factura pendiente',
        monto: f.total_amount || 0,
        fecha: f.payment_due_date || f.fechaVencimientoCalculada.toISOString(),
        // ⭐ NUEVO: Información adicional útil
        categoria: f.category,
        metodoPago: f.payment_method,
        vencida: f.fechaVencimientoCalculada < ahora
      }));

    // Agregar costos fijos como próximos pagos (próximo mes)
    const proximoMes = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const costosFijosComoProximosPagos = (costosFijos || [])
      .slice(0, 3)
      .map(c => ({
        id: `fixed-${c.id}`,
        concepto: c.name || 'Costo fijo mensual',
        monto: c.amount || 0,
        fecha: proximoMes.toISOString(),
        categoria: 'Costo Fijo',
        metodoPago: 'recurring',
        vencida: false
      }));

    // Combinar y ordenar todos los próximos pagos
    const proximosPagos = [...facturasProximasAPagar, ...costosFijosComoProximosPagos]
      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
      .slice(0, 10); // ⭐ Máximo 10 próximos pagos

    // ========================================
    // ⭐ NUEVO: Calcular totales de próximos pagos
    // ========================================
    const totalProximosPagos = proximosPagos.reduce((sum, p) => sum + p.monto, 0);
    const pagosVencidos = facturasProximasAPagar.filter(f => f.vencida);
    const totalPagosVencidos = pagosVencidos.reduce((sum, p) => sum + p.monto, 0);

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
      datosHistoricos,
      // ⭐ NUEVO: Resumen de pagos pendientes
      resumenPagos: {
        totalProximosPagos,
        totalPagosVencidos,
        cantidadPagosVencidos: pagosVencidos.length,
        cantidadPagosPendientes: proximosPagos.length
      }
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