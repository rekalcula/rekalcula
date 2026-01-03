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

    // Obtener facturas/gastos (salidas/pagos)
    const { data: facturas, error: errorFacturas } = await supabase
      .from('invoices')
      .select('id, total, payment_status, date, supplier')
      .eq('user_id', userId)
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', now.toISOString().split('T')[0]);

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

    // Calcular totales de salidas
    const totalFacturas = facturas?.reduce((sum, f) => sum + (f.total || 0), 0) || 0;
    const facturasPagadas = facturas?.filter(f => f.payment_status === 'paid')
      .reduce((sum, f) => sum + (f.total || 0), 0) || 0;
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

      // Filtrar facturas del mes
      const facturasMes = facturas?.filter(f => {
        const fecha = new Date(f.date);
        return fecha.getMonth() === mesIndex && fecha.getFullYear() === año;
      }).reduce((sum, f) => sum + (f.total || 0), 0) || 0;

      datosHistoricos.push({
        periodo: mesNombre,
        entradas: ventasMes,
        salidas: facturasMes + costosFijosMensuales
      });
    }

    // Próximos cobros (ventas pendientes de cobro)
    const proximosCobros = ventas
      ?.filter(v => v.payment_status !== 'paid')
      .slice(0, 5)
      .map(v => ({
        id: v.id,
        concepto: 'Venta pendiente',
        monto: v.total || 0,
        fecha: v.created_at
      })) || [];

    // Próximos pagos (facturas pendientes + costos fijos)
    const proximosPagos = [
      ...(facturas
        ?.filter(f => f.payment_status !== 'paid')
        .slice(0, 3)
        .map(f => ({
          id: f.id,
          concepto: f.supplier || 'Factura pendiente',
          monto: f.total || 0,
          fecha: f.date
        })) || []),
      ...(costosFijos?.slice(0, 2).map(c => ({
        id: c.id,
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