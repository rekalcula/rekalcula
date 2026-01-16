import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ========================================
// MÉTODOS DE PAGO AL CONTADO
// ========================================
const METODOS_PAGO_CONTADO = [
  'efectivo', 'cash', 'tarjeta', 'tarjeta_credito', 'tarjeta_debito',
  'card', 'credit_card', 'debit_card', 'transferencia', 'transfer',
  'bizum', 'paypal'
];

// ========================================
// FECHAS DE LIQUIDACIÓN DE IVA (España)
// ========================================
const FECHAS_LIQUIDACION_IVA = [
  { mes: 1, dia: 30, trimestre: 4, nombre: 'Q4 (Oct-Dic)' },
  { mes: 4, dia: 20, trimestre: 1, nombre: 'Q1 (Ene-Mar)' },
  { mes: 7, dia: 20, trimestre: 2, nombre: 'Q2 (Abr-Jun)' },
  { mes: 10, dia: 20, trimestre: 3, nombre: 'Q3 (Jul-Sep)' }
];

function obtenerTrimestre(fecha: Date): number {
  const mes = fecha.getMonth();
  if (mes >= 0 && mes <= 2) return 1;
  if (mes >= 3 && mes <= 5) return 2;
  if (mes >= 6 && mes <= 8) return 3;
  return 4;
}

function obtenerRangoTrimestre(trimestre: number, año: number): { inicio: Date; fin: Date } {
  const inicios = [
    new Date(año, 0, 1), new Date(año, 3, 1), new Date(año, 6, 1), new Date(año, 9, 1)
  ];
  const fines = [
    new Date(año, 2, 31), new Date(año, 5, 30), new Date(año, 8, 30), new Date(año, 11, 31)
  ];
  return { inicio: inicios[trimestre - 1], fin: fines[trimestre - 1] };
}

function obtenerProximaLiquidacion(ahora: Date): { fecha: Date; trimestre: string; diasRestantes: number } {
  const año = ahora.getFullYear();
  
  for (const liq of FECHAS_LIQUIDACION_IVA) {
    const fechaLiq = new Date(año, liq.mes - 1, liq.dia);
    if (fechaLiq > ahora) {
      const diasRestantes = Math.ceil((fechaLiq.getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24));
      return { fecha: fechaLiq, trimestre: liq.nombre, diasRestantes };
    }
  }
  
  const fechaLiq = new Date(año + 1, 0, 30);
  const diasRestantes = Math.ceil((fechaLiq.getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24));
  return { fecha: fechaLiq, trimestre: 'Q4 (Oct-Dic)', diasRestantes };
}

function ventaEstaCobrada(venta: any): boolean {
  if (venta.payment_status === 'paid') return true;
  if (venta.source === 'ticket') return true;
  const metodoPago = (venta.payment_method || '').toLowerCase().trim();
  if (metodoPago && METODOS_PAGO_CONTADO.includes(metodoPago)) return true;
  if (venta.actual_payment_date) return true;
  return false;
}

function facturaEstaPagada(factura: any): boolean {
  if (factura.payment_status === 'paid') return true;
  if (factura.payment_confirmed === true) return true;
  const metodoPago = (factura.payment_method || '').toLowerCase().trim();
  if (metodoPago && METODOS_PAGO_CONTADO.includes(metodoPago)) return true;
  if (factura.actual_payment_date) return true;
  return false;
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const periodo = searchParams.get('periodo') || 'mes';

    const now = new Date();
    let startDate: Date;
    let mesesEnPeriodo: number;

    if (periodo === 'all') {
      const { data: oldestSale } = await supabase
        .from('sales').select('sale_date').eq('user_id', userId)
        .order('sale_date', { ascending: true }).limit(1).single();

      const { data: oldestInvoice } = await supabase
        .from('invoices').select('invoice_date').eq('user_id', userId)
        .order('invoice_date', { ascending: true }).limit(1).single();

      if (oldestSale?.sale_date && oldestInvoice?.invoice_date) {
        startDate = new Date(oldestSale.sale_date < oldestInvoice.invoice_date 
          ? oldestSale.sale_date : oldestInvoice.invoice_date);
      } else if (oldestSale?.sale_date) {
        startDate = new Date(oldestSale.sale_date);
      } else if (oldestInvoice?.invoice_date) {
        startDate = new Date(oldestInvoice.invoice_date);
      } else {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      const monthsDiff = (now.getFullYear() - startDate.getFullYear()) * 12 + 
                         (now.getMonth() - startDate.getMonth()) + (now.getDate() / 30);
      mesesEnPeriodo = Math.max(1, monthsDiff);
    } else {
      switch (periodo) {
        case '3meses':
          startDate = new Date(); startDate.setMonth(now.getMonth() - 3); mesesEnPeriodo = 3; break;
        case '6meses':
          startDate = new Date(); startDate.setMonth(now.getMonth() - 6); mesesEnPeriodo = 6; break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1); mesesEnPeriodo = 1;
      }
    }

    // ⭐⭐⭐ OBTENER VENTAS HISTÓRICAS (últimos 6 meses para calcular promedio)
    const hace6Meses = new Date();
    hace6Meses.setMonth(now.getMonth() - 6);
    
    const { data: todasVentas } = await supabase
      .from('sales')
      .select('id, total, subtotal, tax_amount, gross_total, payment_status, payment_method, payment_due_date, actual_payment_date, customer_name, sale_date, created_at, source')
      .eq('user_id', userId)
      .gte('sale_date', hace6Meses.toISOString().split('T')[0])
      .lte('sale_date', now.toISOString().split('T')[0]);

    // Filtrar ventas del período seleccionado
    const ventas = todasVentas?.filter(v => {
      const fecha = new Date(v.sale_date);
      return fecha >= startDate && fecha <= now;
    }) || [];

    // ⭐⭐⭐ CALCULAR PROMEDIO MENSUAL DE VENTAS (últimos 3 meses con datos)
    const ventasUltimos3Meses = todasVentas?.filter(v => {
      const fecha = new Date(v.sale_date);
      const hace3Meses = new Date();
      hace3Meses.setMonth(now.getMonth() - 3);
      return fecha >= hace3Meses;
    }) || [];

    // Contar meses únicos con ventas
    const mesesConVentas = new Set(
      ventasUltimos3Meses.map(v => new Date(v.sale_date).toISOString().slice(0, 7))
    ).size;

    const totalVentasUltimos3Meses = ventasUltimos3Meses.reduce((sum, v) => 
      sum + (v.subtotal || v.total || 0), 0);
    
    const ventasMensualesPromedio = mesesConVentas > 0 
      ? totalVentasUltimos3Meses / mesesConVentas 
      : 0;

    const ivaMensualesPromedio = mesesConVentas > 0
      ? ventasUltimos3Meses.reduce((sum, v) => sum + (v.tax_amount || 0), 0) / mesesConVentas
      : 0;

    // ⭐⭐⭐ CALCULAR VENTAS DEL MES ACTUAL (REALES hasta hoy)
    const ventasMesActual = todasVentas?.filter(v => {
      const fecha = new Date(v.sale_date);
      return fecha.getMonth() === now.getMonth() && fecha.getFullYear() === now.getFullYear();
    }) || [];

    const ventasRealesMesActual = ventasMesActual.reduce((sum, v) => 
      sum + (v.subtotal || v.total || 0), 0);
    const ivaRealesMesActual = ventasMesActual.reduce((sum, v) => 
      sum + (v.tax_amount || 0), 0);

    // ⭐⭐⭐ PROYECTAR RESTO DEL MES ACTUAL
    const diasDelMes = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const diasTranscurridos = now.getDate();
    const diasRestantes = diasDelMes - diasTranscurridos;

    const proyeccionRestoDeMes = (ventasMensualesPromedio / diasDelMes) * diasRestantes;
    const ivaProyeccionRestoDeMes = (ivaMensualesPromedio / diasDelMes) * diasRestantes;

    const ventasProyectadasMesActual = ventasRealesMesActual + proyeccionRestoDeMes;
    const ivaProyectadoMesActual = ivaRealesMesActual + ivaProyeccionRestoDeMes;

    // ⭐⭐⭐ CALCULAR VENTAS PROYECTADAS SEGÚN PERÍODO
    let ventasProyectadasTotal: number;
    let ivaProyectadoTotal: number;
    let mesesFuturos: number;

    if (periodo === 'mes') {
      ventasProyectadasTotal = ventasProyectadasMesActual;
      ivaProyectadoTotal = ivaProyectadoMesActual;
      mesesFuturos = 0;
    } else if (periodo === '3meses') {
      mesesFuturos = 2;
      ventasProyectadasTotal = ventasProyectadasMesActual + (ventasMensualesPromedio * mesesFuturos);
      ivaProyectadoTotal = ivaProyectadoMesActual + (ivaMensualesPromedio * mesesFuturos);
    } else if (periodo === '6meses') {
      mesesFuturos = 5;
      ventasProyectadasTotal = ventasProyectadasMesActual + (ventasMensualesPromedio * mesesFuturos);
      ivaProyectadoTotal = ivaProyectadoMesActual + (ivaMensualesPromedio * mesesFuturos);
    } else {
      // 'all' - usar solo datos históricos
      ventasProyectadasTotal = ventas.reduce((sum, v) => sum + (v.subtotal || v.total || 0), 0);
      ivaProyectadoTotal = ventas.reduce((sum, v) => sum + (v.tax_amount || 0), 0);
      mesesFuturos = 0;
    }

    // OBTENER FACTURAS
    const { data: facturas } = await supabase
      .from('invoices')
      .select('id, total_amount, tax_amount, gross_amount, invoice_date, payment_status, payment_method, payment_due_date, actual_payment_date, category, supplier, payment_confirmed')
      .eq('user_id', userId)
      .gte('invoice_date', startDate.toISOString().split('T')[0])
      .lte('invoice_date', now.toISOString().split('T')[0]);

    // OBTENER COSTOS FIJOS
    const { data: costosFijos } = await supabase
      .from('fixed_costs')
      .select('id, name, amount, tax_amount, vat_rate, frequency, is_active, cost_type')
      .eq('user_id', userId)
      .eq('is_active', true);

    const activeCosts = costosFijos || [];

    // ⭐ VENTAS - Usar proyección
    const ventasBaseImponible = ventasProyectadasTotal;
    const ivaRepercutido = ivaProyectadoTotal;
    const ventasBruto = ventasBaseImponible + ivaRepercutido;
    
    // Cobros (solo históricos)
    const ventasCobradasBase = ventas.filter(v => ventaEstaCobrada(v))
      .reduce((sum, v) => sum + (v.subtotal || v.total || 0), 0);
    const ventasPendientesBase = ventasRealesMesActual - ventasCobradasBase;

    // ⭐ CALCULAR SALIDAS - BASE IMPONIBLE
    const facturasBaseImponible = facturas?.reduce((sum, f) => sum + (f.total_amount || 0), 0) || 0;
    const ivaSoportado = facturas?.reduce((sum, f) => sum + (f.tax_amount || 0), 0) || 0;
    const facturasBruto = facturas?.reduce((sum, f) => sum + (f.gross_amount || f.total_amount || 0), 0) || 0;
    const facturasPagadasBase = facturas?.filter(f => facturaEstaPagada(f))
      .reduce((sum, f) => sum + (f.total_amount || 0), 0) || 0;
    const facturasPendientesBase = facturasBaseImponible - facturasPagadasBase;

    // COSTOS FIJOS
    const costosFijosMensuales = activeCosts.reduce((sum, c) => {
      let mensual = c.amount || 0;
      if (c.frequency === 'annual' || c.frequency === 'yearly') mensual = mensual / 12;
      if (c.frequency === 'quarterly') mensual = mensual / 3;
      return sum + mensual;
    }, 0);
    
    const mesesTranscurridosHastaHoy = Math.max(0, 
      (now.getFullYear() - startDate.getFullYear()) * 12 + 
      (now.getMonth() - startDate.getMonth()) + 
      (now.getDate() >= startDate.getDate() ? 1 : 0)
    );
    const mesesTranscurridos = Math.min(mesesTranscurridosHastaHoy, Math.ceil(mesesEnPeriodo));
    
    const costosFijosPasados = costosFijosMensuales * mesesTranscurridos;
    const costosFijosFuturos = costosFijosMensuales * Math.max(0, mesesEnPeriodo - mesesTranscurridos);
    const totalCostosFijos = costosFijosPasados + costosFijosFuturos;

    // IVA DE COSTOS FIJOS
    const ivaCostosFijosMensual = activeCosts.reduce((sum, c) => {
      let ivaMensual = c.tax_amount || 0;
      if (c.frequency === 'annual' || c.frequency === 'yearly') ivaMensual = ivaMensual / 12;
      if (c.frequency === 'quarterly') ivaMensual = ivaMensual / 3;
      return sum + ivaMensual;
    }, 0);
    
    const ivaCostosFijosPasados = ivaCostosFijosMensual * mesesTranscurridos;
    const ivaCostosFijosFuturos = ivaCostosFijosMensual * Math.max(0, mesesEnPeriodo - mesesTranscurridos);
    const ivaCostosFijosPeriodo = ivaCostosFijosPasados + ivaCostosFijosFuturos;
    const ivaSoportadoTotal = ivaSoportado + ivaCostosFijosPasados;

    // IVA TRIMESTRAL
    const trimestreActual = obtenerTrimestre(now);
    const rangoTrimestre = obtenerRangoTrimestre(trimestreActual, now.getFullYear());
    
    const ventasTrimestre = ventas?.filter(v => {
      const f = new Date(v.sale_date);
      return f >= rangoTrimestre.inicio && f <= rangoTrimestre.fin;
    }) || [];
    const facturasTrimestre = facturas?.filter(f => {
      const fecha = new Date(f.invoice_date);
      return fecha >= rangoTrimestre.inicio && fecha <= rangoTrimestre.fin;
    }) || [];

    const ivaRepercutidoTrimestre = ventasTrimestre.reduce((sum, v) => sum + (v.tax_amount || 0), 0);
    const ivaSoportadoFacturasTrimestre = facturasTrimestre.reduce((sum, f) => sum + (f.tax_amount || 0), 0);
    
    const inicioTrimestre = rangoTrimestre.inicio;
    const finTrimestre = now < rangoTrimestre.fin ? now : rangoTrimestre.fin;
    const mesesTranscurridosTrimestre = Math.max(1, 
      (finTrimestre.getFullYear() - inicioTrimestre.getFullYear()) * 12 + 
      (finTrimestre.getMonth() - inicioTrimestre.getMonth()) + 1
    );
    const ivaCostosFijosTrimestre = ivaCostosFijosMensual * Math.min(mesesTranscurridosTrimestre, 3);
    
    const ivaSoportadoTrimestre = ivaSoportadoFacturasTrimestre + ivaCostosFijosTrimestre;
    const liquidacionIvaTrimestre = ivaRepercutidoTrimestre - ivaSoportadoTrimestre;
    const proximaLiquidacion = obtenerProximaLiquidacion(now);

    // TOTALES
    const totalSalidasBase = facturasBaseImponible + totalCostosFijos;
    const balanceOperativo = ventasBaseImponible - totalSalidasBase;

    // DATOS HISTÓRICOS
    const datosHistoricos: Array<{ periodo: string; entradas: number; salidas: number; ivaRepercutido: number; ivaSoportado: number }> = [];
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const mesesAMostrar = Math.min(Math.ceil(mesesEnPeriodo), 12);
    
    for (let i = mesesAMostrar - 1; i >= 0; i--) {
      const mesDate = new Date(); mesDate.setMonth(now.getMonth() - i);
      const mesIndex = mesDate.getMonth();
      const año = mesDate.getFullYear();
      
      const ventasMes = todasVentas?.filter(v => {
        const f = new Date(v.sale_date || v.created_at);
        return f.getMonth() === mesIndex && f.getFullYear() === año;
      }) || [];
      const facturasMes = facturas?.filter(f => {
        const fecha = new Date(f.invoice_date);
        return fecha.getMonth() === mesIndex && fecha.getFullYear() === año;
      }) || [];

      datosHistoricos.push({
        periodo: meses[mesIndex],
        entradas: ventasMes.reduce((sum, v) => sum + (v.subtotal || v.total || 0), 0),
        salidas: facturasMes.reduce((sum, f) => sum + (f.total_amount || 0), 0) + costosFijosMensuales,
        ivaRepercutido: ventasMes.reduce((sum, v) => sum + (v.tax_amount || 0), 0),
        ivaSoportado: facturasMes.reduce((sum, f) => sum + (f.tax_amount || 0), 0) + ivaCostosFijosMensual
      });
    }

    // PRÓXIMOS COBROS Y PAGOS
    const ahora = new Date();
    const en30Dias = new Date(ahora); en30Dias.setDate(ahora.getDate() + 30);

    const proximosCobros = ventas?.filter(v => !ventaEstaCobrada(v) && v.payment_due_date && 
      new Date(v.payment_due_date) >= ahora && new Date(v.payment_due_date) <= en30Dias)
      .sort((a, b) => new Date(a.payment_due_date!).getTime() - new Date(b.payment_due_date!).getTime())
      .slice(0, 5).map(v => ({
        id: String(v.id), concepto: v.customer_name || 'Venta pendiente',
        monto: v.subtotal || v.total || 0, iva: v.tax_amount || 0,
        fecha: v.payment_due_date || v.sale_date
      })) || [];

    const proximosPagos = facturas?.filter(f => !facturaEstaPagada(f) && f.payment_due_date &&
      new Date(f.payment_due_date) >= ahora && new Date(f.payment_due_date) <= en30Dias)
      .sort((a, b) => new Date(a.payment_due_date!).getTime() - new Date(b.payment_due_date!).getTime())
      .slice(0, 5).map(f => ({
        id: String(f.id), concepto: f.supplier || `Factura ${f.category || 'compra'}`,
        monto: f.total_amount || 0, iva: f.tax_amount || 0,
        fecha: f.payment_due_date || f.invoice_date
      })) || [];

    return NextResponse.json({
      entradas: {
        total: ventasBaseImponible,
        real: ventasRealesMesActual,
        proyectado: proyeccionRestoDeMes + (ventasMensualesPromedio * mesesFuturos),
        promedio_mensual: ventasMensualesPromedio,
        cobrado: ventasCobradasBase,
        pendiente: ventasPendientesBase,
        bruto: ventasBruto,
        proyeccion: {
          mes_actual_real: ventasRealesMesActual,
          mes_actual_proyectado: proyeccionRestoDeMes,
          meses_futuros: mesesFuturos,
          ventas_meses_futuros: ventasMensualesPromedio * mesesFuturos
        }
      },
      salidas: {
        total: totalSalidasBase, 
        pagado: facturasPagadasBase + costosFijosPasados,
        pendiente: facturasPendientesBase + costosFijosFuturos,
        bruto: facturasBruto + ivaCostosFijosPeriodo,
        desglose: {
          facturas: facturasBaseImponible, 
          facturasPagadas: facturasPagadasBase,
          facturasPendientes: facturasPendientesBase, 
          costosFijos: totalCostosFijos,
          costosFijosMensuales,
          costosFijosPasados,
          costosFijosFuturos,
          ivaCostosFijos: ivaCostosFijosPeriodo,
          ivaCostosFijosPasados,
          ivaCostosFijosFuturos,
          ivaCostosFijosMensual
        }
      },
      balance: balanceOperativo,
      iva: {
        repercutido: ivaRepercutido, 
        soportado: ivaSoportadoTotal,
        soportadoFacturas: ivaSoportado,
        soportadoCostosFijos: ivaCostosFijosPasados,
        liquidacion: ivaRepercutido - ivaSoportadoTotal,
        trimestre: {
          numero: trimestreActual, nombre: `Q${trimestreActual}`,
          repercutido: ivaRepercutidoTrimestre, 
          soportado: ivaSoportadoTrimestre,
          soportadoFacturas: ivaSoportadoFacturasTrimestre,
          soportadoCostosFijos: ivaCostosFijosTrimestre,
          liquidacion: liquidacionIvaTrimestre,
          inicio: rangoTrimestre.inicio.toISOString().split('T')[0],
          fin: rangoTrimestre.fin.toISOString().split('T')[0]
        },
        proximaLiquidacion: {
          fecha: proximaLiquidacion.fecha.toISOString().split('T')[0],
          trimestre: proximaLiquidacion.trimestre,
          diasRestantes: proximaLiquidacion.diasRestantes,
          importeEstimado: liquidacionIvaTrimestre
        }
      },
      proximosCobros, proximosPagos, datosHistoricos,
      mesesEnPeriodo: Math.round(mesesEnPeriodo * 10) / 10,
      mesesTranscurridos,
      costosFijosMensuales,
      resumen: {
        periodoMeses: Math.round(mesesEnPeriodo * 10) / 10,
        mesesTranscurridos,
        ventasBase: ventasBaseImponible,
        ventasReales: ventasRealesMesActual,
        ventasProyectadas: proyeccionRestoDeMes + (ventasMensualesPromedio * mesesFuturos),
        comprasBase: facturasBaseImponible,
        costosFijosTotales: totalCostosFijos,
        costosFijosPasados,
        costosFijosFuturos,
        gastosTotales: totalSalidasBase,
        beneficioBruto: balanceOperativo,
        ivaRepercutido, 
        ivaSoportado: ivaSoportadoTotal,
        ivaSoportadoFacturas: ivaSoportado,
        ivaSoportadoCostosFijos: ivaCostosFijosPasados,
        ivaAPagar: Math.max(0, ivaRepercutido - ivaSoportadoTotal),
        ivaACompensar: Math.max(0, ivaSoportadoTotal - ivaRepercutido),
        ventasBruto, comprasBruto: facturasBruto
      }
    });
  } catch (error) {
    console.error('Error en API cashflow:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const body = await request.json();
    const { type, id, action } = body;

    if (action === 'mark_paid') {
      const table = type === 'invoice' ? 'invoices' : 'sales';
      const { error } = await supabase.from(table).update({ 
        payment_status: 'paid', actual_payment_date: new Date().toISOString().split('T')[0]
      }).eq('id', id).eq('user_id', userId);

      if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
