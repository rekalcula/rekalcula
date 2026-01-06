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

    // Obtener ventas (entradas/cobros)
    const { data: ventas, error: errorVentas } = await supabase
      .from('sales')
      .select('id, total, payment_status, created_at')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', now.toISOString());

    if (errorVentas) {
      console.error('Error obteniendo ventas:', errorVentas);
    }

    // ========================================
    // CORREGIDO: Obtener facturas con campos correctos
    // ========================================
    const { data: facturas, error: errorFacturas } = await supabase
      .from('invoices')
      .select('id, total_amount, invoice_date, payment_confirmed, payment_method, payment_due_date, category')
      .eq('user_id', userId)
      .gte('invoice_date', startDate.toISOString().split('T')[0])
      .lte('invoice_date', now.toISOString().split('T')[0]);

    if (errorFacturas) {
      console.error('Error obteniendo facturas:', errorFacturas);
    }

    // Obtener costos fijos
    const { data: costosFijos, error: errorCostos } = await supabase
      .from('fixed_costs')
      .select('id, name, amount, frequency')
      .eq('user_id', userId)
      .eq('active', true);

    if (errorCostos) {
      console.error('Error obteniendo costos fijos:', errorCostos);
    }

    // Calcular totales de entradas
    const totalVentas = ventas?.reduce((sum, v) => sum + (v.total || 0), 0) || 0;
    const ventasCobradas = ventas?.filter(v => v.payment_status === 'paid')
      .reduce((sum, v) => sum + (v.total || 0), 0) || 0;
    const ventasPendientes = totalVentas - ventasCobradas;

    // ========================================
    // CORREGIDO: Calcular totales de salidas
    // ========================================
    const totalFacturas = facturas?.reduce((sum, f) => sum + (f.total_amount || 0), 0) || 0;
    
    // Facturas ya pagadas (las que tienen payment_method en efectivo o tarjeta Y están confirmadas)
    const facturasPagadas = facturas?.filter(f => 
      f.payment_confirmed && 
      (f.payment_method === 'cash' || f.payment_method === 'card')
    ).reduce((sum, f) => sum + (f.total_amount || 0), 0) || 0;
    
    // Facturas pendientes (las que tienen fecha de vencimiento futura o no están pagadas)
    const facturasPendientes = totalFacturas - facturasPagadas;

    // Calcular costos fijos mensuales
    const costosFijosMensuales = costosFijos?.reduce((sum, c) => {
      let mensual = c.amount || 0;
      if (c.frequency === 'annual') mensual = mensual / 12;
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

    // Generar datos históricos por mes
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
        const fecha = new Date(v.created_at);
        return fecha.getMonth() === mesIndex && fecha.getFullYear() === año;
      }).reduce((sum, v) => sum + (v.total || 0), 0) || 0;

      // Filtrar facturas del mes (CORREGIDO: usar invoice_date y total_amount)
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
    // CORREGIDO: Próximos pagos con facturas pendientes
    // ========================================
    const ahora = new Date();
    const en30Dias = new Date(ahora);
    en30Dias.setDate(ahora.getDate() + 30);

    // Facturas con vencimiento en los próximos 30 días
    const facturasProximasAPagar = facturas
      ?.filter(f => {
        if (!f.payment_due_date) return false;
        const vencimiento = new Date(f.payment_due_date);
        return vencimiento > ahora && vencimiento <= en30Dias;
      })
      .sort((a, b) => {
        const dateA = new Date(a.payment_due_date!).getTime();
        const dateB = new Date(b.payment_due_date!).getTime();
        return dateA - dateB;
      })
      .slice(0, 3)
      .map(f => ({
        id: String(f.id),
        concepto: `Factura ${f.category || 'compra'}`,
        monto: f.total_amount || 0,
        fecha: f.payment_due_date!
      })) || [];

    // Próximos cobros (ventas pendientes de cobro)
    const proximosCobros = ventas
      ?.filter(v => v.payment_status !== 'paid')
      .slice(0, 5)
      .map(v => ({
        id: String(v.id),
        concepto: 'Venta pendiente',
        monto: v.total || 0,
        fecha: v.created_at
      })) || [];

    // Próximos pagos (facturas pendientes + costos fijos)
    const proximosPagos = [
      ...facturasProximasAPagar,
      ...(costosFijos?.slice(0, 2).map(c => ({
        id: String(c.id),
        concepto: c.name || 'Costo fijo',
        monto: c.amount || 0,
        fecha: new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString()
      })) || [])
    ].slice(0, 5);

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