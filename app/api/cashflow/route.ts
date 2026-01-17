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
    new Date(año, 0, 1),   // Q1: 1 enero
    new Date(año, 3, 1),   // Q2: 1 abril
    new Date(año, 6, 1),   // Q3: 1 julio
    new Date(año, 9, 1)    // Q4: 1 octubre
  ];
  const fines = [
    new Date(año, 2, 31, 23, 59, 59),  // Q1: 31 marzo
    new Date(año, 5, 30, 23, 59, 59),  // Q2: 30 junio
    new Date(año, 8, 30, 23, 59, 59),  // Q3: 30 septiembre
    new Date(año, 11, 31, 23, 59, 59)  // Q4: 31 diciembre
  ];
  return { inicio: inicios[trimestre - 1], fin: fines[trimestre - 1] };
}

function obtenerProximaLiquidacion(ahora: Date): { 
  fecha: Date; 
  trimestre: string; 
  diasRestantes: number;
  trimestreLiquidar: number;
} {
  const año = ahora.getFullYear();
  const trimestreActual = obtenerTrimestre(ahora);
  
  // Buscar la próxima fecha de liquidación
  for (const liq of FECHAS_LIQUIDACION_IVA) {
    const fechaLiq = new Date(año, liq.mes - 1, liq.dia);
    if (fechaLiq > ahora) {
      const diasRestantes = Math.ceil((fechaLiq.getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24));
      return { 
        fecha: fechaLiq, 
        trimestre: liq.nombre, 
        diasRestantes,
        trimestreLiquidar: liq.trimestre
      };
    }
  }
  
  // Si no hay más liquidaciones este año, la próxima es en enero del año siguiente
  const fechaLiq = new Date(año + 1, 0, 30);
  const diasRestantes = Math.ceil((fechaLiq.getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24));
  return { 
    fecha: fechaLiq, 
    trimestre: 'Q4 (Oct-Dic)', 
    diasRestantes,
    trimestreLiquidar: 4
  };
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

    const now = new Date();
    const trimestreActual = obtenerTrimestre(now);
    const rangoTrimestre = obtenerRangoTrimestre(trimestreActual, now.getFullYear());
    const proximaLiquidacion = obtenerProximaLiquidacion(now);

    // ========================================
    // OBTENER VENTAS DEL TRIMESTRE ACTUAL
    // ========================================
    const { data: ventasTrimestre } = await supabase
      .from('sales')
      .select('id, total, subtotal, tax_amount, gross_total, payment_status, payment_method, payment_due_date, actual_payment_date, customer_name, sale_date, created_at, source')
      .eq('user_id', userId)
      .gte('sale_date', rangoTrimestre.inicio.toISOString().split('T')[0])
      .lte('sale_date', now.toISOString().split('T')[0]);

    // ========================================
    // OBTENER FACTURAS DEL TRIMESTRE ACTUAL
    // ========================================
    const { data: facturasTrimestre } = await supabase
      .from('invoices')
      .select('id, total_amount, tax_amount, gross_amount, invoice_date, payment_status, payment_method, payment_due_date, actual_payment_date, category, supplier, payment_confirmed')
      .eq('user_id', userId)
      .gte('invoice_date', rangoTrimestre.inicio.toISOString().split('T')[0])
      .lte('invoice_date', now.toISOString().split('T')[0]);

    // ========================================
    // OBTENER COSTOS FIJOS
    // ========================================
    const { data: costosFijos } = await supabase
      .from('fixed_costs')
      .select('id, name, amount, tax_amount, vat_rate, frequency, is_active, cost_type')
      .eq('user_id', userId)
      .eq('is_active', true);

    const activeCosts = costosFijos || [];

    // ========================================
    // CALCULAR MESES TRANSCURRIDOS DEL TRIMESTRE
    // ========================================
    const mesesTranscurridosTrimestre = Math.max(1, 
      (now.getFullYear() - rangoTrimestre.inicio.getFullYear()) * 12 + 
      (now.getMonth() - rangoTrimestre.inicio.getMonth()) + 1
    );

    // ========================================
    // COSTOS FIJOS MENSUALES
    // ========================================
    const costosFijosMensuales = activeCosts.reduce((sum, c) => {
      let mensual = c.amount || 0;
      if (c.frequency === 'annual' || c.frequency === 'yearly') mensual = mensual / 12;
      if (c.frequency === 'quarterly') mensual = mensual / 3;
      return sum + mensual;
    }, 0);

    const ivaCostosFijosMensual = activeCosts.reduce((sum, c) => {
      let ivaMensual = c.tax_amount || 0;
      if (c.frequency === 'annual' || c.frequency === 'yearly') ivaMensual = ivaMensual / 12;
      if (c.frequency === 'quarterly') ivaMensual = ivaMensual / 3;
      return sum + ivaMensual;
    }, 0);

    const costosFijosTrimestre = costosFijosMensuales * mesesTranscurridosTrimestre;
    const ivaCostosFijosTrimestre = ivaCostosFijosMensual * mesesTranscurridosTrimestre;

    // ========================================
    // VENTAS - SEPARAR COBRADAS Y PENDIENTES
    // ========================================
    const ventas = ventasTrimestre || [];
    
    // COBRADAS (caja real)
    const ventasCobradas = ventas.filter(v => ventaEstaCobrada(v));
    const ventasCobradasBase = ventasCobradas.reduce((sum, v) => sum + (v.subtotal || v.total || 0), 0);
    const ivaVentasCobradas = ventasCobradas.reduce((sum, v) => sum + (v.tax_amount || 0), 0);
    const ventasCobradasBruto = ventasCobradasBase + ivaVentasCobradas;

    // PENDIENTES DE COBRO
    const ventasPendientes = ventas.filter(v => !ventaEstaCobrada(v));
    const ventasPendientesBase = ventasPendientes.reduce((sum, v) => sum + (v.subtotal || v.total || 0), 0);
    const ivaVentasPendientes = ventasPendientes.reduce((sum, v) => sum + (v.tax_amount || 0), 0);

    // TOTAL VENTAS (devengado)
    const ventasTotalesBase = ventasCobradasBase + ventasPendientesBase;
    const ivaRepercutidoTotal = ivaVentasCobradas + ivaVentasPendientes;

    // ========================================
    // COMPRAS - SEPARAR PAGADAS Y PENDIENTES
    // ========================================
    const facturas = facturasTrimestre || [];

    // PAGADAS (caja real)
    const facturasPagadas = facturas.filter(f => facturaEstaPagada(f));
    const facturasPagadasBase = facturasPagadas.reduce((sum, f) => sum + (f.total_amount || 0), 0);
    const ivaFacturasPagadas = facturasPagadas.reduce((sum, f) => sum + (f.tax_amount || 0), 0);
    const facturasPagadasBruto = facturasPagadasBase + ivaFacturasPagadas;

    // PENDIENTES DE PAGO
    const facturasPendientes = facturas.filter(f => !facturaEstaPagada(f));
    const facturasPendientesBase = facturasPendientes.reduce((sum, f) => sum + (f.total_amount || 0), 0);
    const ivaFacturasPendientes = facturasPendientes.reduce((sum, f) => sum + (f.tax_amount || 0), 0);

    // TOTAL FACTURAS (devengado)
    const facturasTotalesBase = facturasPagadasBase + facturasPendientesBase;
    const ivaSoportadoFacturas = ivaFacturasPagadas + ivaFacturasPendientes;

    // ========================================
    // IVA TRIMESTRAL (Modelo 303)
    // ========================================
    // Solo se liquida el IVA de operaciones DEVENGADAS (facturadas), no solo cobradas
    const ivaRepercutidoTrimestre = ivaRepercutidoTotal;
    const ivaSoportadoTrimestre = ivaSoportadoFacturas + ivaCostosFijosTrimestre;
    const liquidacionIvaTrimestre = ivaRepercutidoTrimestre - ivaSoportadoTrimestre;

    // ========================================
    // RESULTADO OPERATIVO (Contable)
    // ========================================
    const ingresosTotales = ventasTotalesBase;
    const gastosTotales = facturasTotalesBase + costosFijosTrimestre;
    const resultadoContable = ingresosTotales - gastosTotales;

    // ========================================
    // IRPF - PAGO FRACCIONADO (Modelo 130)
    // ========================================
    // Solo para autónomos en estimación directa
    // 20% sobre beneficio neto (o 5% sobre ingresos si <600k€ y sin empleados)
    
    // Criterio: 20% sobre beneficio si es positivo
    const irpfFraccionado = resultadoContable > 0 ? resultadoContable * 0.20 : 0;

    // ========================================
    // CAJA OPERATIVA REAL
    // ========================================
    // Dinero que REALMENTE ha entrado y salido
    const cajaEntradas = ventasCobradasBruto; // Incluye IVA cobrado
    const cajaSalidas = facturasPagadasBruto + (costosFijosTrimestre + ivaCostosFijosTrimestre);
    const cajaBruta = cajaEntradas - cajaSalidas;

    // Caja después de liquidar IVA e IRPF
    const obligacionesFiscales = Math.max(0, liquidacionIvaTrimestre) + irpfFraccionado;
    const cajaNeta = cajaBruta - obligacionesFiscales;

    // ========================================
    // DATOS HISTÓRICOS POR MES
    // ========================================
    const datosHistoricos: Array<{ 
      periodo: string; 
      entradas: number; 
      salidas: number; 
      ivaRepercutido: number; 
      ivaSoportado: number;
      resultado: number;
    }> = [];
    
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    
    for (let i = 0; i < mesesTranscurridosTrimestre; i++) {
      const mesDate = new Date(rangoTrimestre.inicio);
      mesDate.setMonth(rangoTrimestre.inicio.getMonth() + i);
      const mesIndex = mesDate.getMonth();
      const año = mesDate.getFullYear();
      
      const ventasMes = ventas.filter(v => {
        const f = new Date(v.sale_date || v.created_at);
        return f.getMonth() === mesIndex && f.getFullYear() === año;
      });
      
      const facturasMes = facturas.filter(f => {
        const fecha = new Date(f.invoice_date);
        return fecha.getMonth() === mesIndex && fecha.getFullYear() === año;
      });

      const entradasMes = ventasMes.reduce((sum, v) => sum + (v.subtotal || v.total || 0), 0);
      const salidasMes = facturasMes.reduce((sum, f) => sum + (f.total_amount || 0), 0) + costosFijosMensuales;

      datosHistoricos.push({
        periodo: meses[mesIndex],
        entradas: entradasMes,
        salidas: salidasMes,
        ivaRepercutido: ventasMes.reduce((sum, v) => sum + (v.tax_amount || 0), 0),
        ivaSoportado: facturasMes.reduce((sum, f) => sum + (f.tax_amount || 0), 0) + ivaCostosFijosMensual,
        resultado: entradasMes - salidasMes
      });
    }

    // ========================================
    // PRÓXIMOS COBROS Y PAGOS
    // ========================================
    const ahora = new Date();
    const en30Dias = new Date(ahora); 
    en30Dias.setDate(ahora.getDate() + 30);

    const proximosCobros = ventasPendientes
      .filter(v => v.payment_due_date && 
        new Date(v.payment_due_date) >= ahora && 
        new Date(v.payment_due_date) <= en30Dias)
      .sort((a, b) => new Date(a.payment_due_date!).getTime() - new Date(b.payment_due_date!).getTime())
      .slice(0, 5)
      .map(v => ({
        id: String(v.id),
        concepto: v.customer_name || 'Venta pendiente',
        monto: v.subtotal || v.total || 0,
        iva: v.tax_amount || 0,
        fecha: v.payment_due_date || v.sale_date
      }));

    const proximosPagos = facturasPendientes
      .filter(f => f.payment_due_date &&
        new Date(f.payment_due_date) >= ahora && 
        new Date(f.payment_due_date) <= en30Dias)
      .sort((a, b) => new Date(a.payment_due_date!).getTime() - new Date(b.payment_due_date!).getTime())
      .slice(0, 5)
      .map(f => ({
        id: String(f.id),
        concepto: f.supplier || `Factura ${f.category || 'compra'}`,
        monto: f.total_amount || 0,
        iva: f.tax_amount || 0,
        fecha: f.payment_due_date || f.invoice_date
      }));

    // ========================================
    // RESPUESTA
    // ========================================
    return NextResponse.json({
      trimestre: {
        numero: trimestreActual,
        nombre: `Q${trimestreActual} ${now.getFullYear()}`,
        inicio: rangoTrimestre.inicio.toISOString().split('T')[0],
        fin: rangoTrimestre.fin.toISOString().split('T')[0],
        mesesTranscurridos: mesesTranscurridosTrimestre
      },
      resultadoContable: {
        ingresos: ingresosTotales,
        gastos: gastosTotales,
        resultado: resultadoContable,
        desglose: {
          ventas: ventasTotalesBase,
          compras: facturasTotalesBase,
          costosFijos: costosFijosTrimestre
        }
      },
      cajaOperativa: {
        entradas: ventasCobradasBase,
        entradasBruto: cajaEntradas,
        salidas: facturasPagadasBase + costosFijosTrimestre,
        salidasBruto: cajaSalidas,
        cajaBruta: cajaBruta,
        obligacionesFiscales: obligacionesFiscales,
        cajaNeta: cajaNeta,
        desglose: {
          cobrado: ventasCobradasBase,
          pendienteCobro: ventasPendientesBase,
          pagado: facturasPagadasBase,
          pendientePago: facturasPendientesBase,
          costosFijosPagados: costosFijosTrimestre
        }
      },
      iva: {
        repercutido: ivaRepercutidoTrimestre,
        soportado: ivaSoportadoTrimestre,
        soportadoFacturas: ivaSoportadoFacturas,
        soportadoCostosFijos: ivaCostosFijosTrimestre,
        liquidacion: liquidacionIvaTrimestre,
        desglose: {
          ivaCobrado: ivaVentasCobradas,
          ivaPendienteCobro: ivaVentasPendientes,
          ivaPagado: ivaFacturasPagadas,
          ivaPendientePago: ivaFacturasPendientes
        }
      },
      irpf: {
        baseFraccionado: resultadoContable,
        fraccionado: irpfFraccionado,
        porcentaje: 20
      },
      proximaLiquidacion: {
        fecha: proximaLiquidacion.fecha.toISOString().split('T')[0],
        trimestre: proximaLiquidacion.trimestre,
        diasRestantes: proximaLiquidacion.diasRestantes,
        importeIva: liquidacionIvaTrimestre,
        importeIrpf: irpfFraccionado,
        importeTotal: liquidacionIvaTrimestre + irpfFraccionado
      },
      proximosCobros,
      proximosPagos,
      datosHistoricos,
      costosFijosMensuales
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
        payment_status: 'paid', 
        actual_payment_date: new Date().toISOString().split('T')[0]
      }).eq('id', id).eq('user_id', userId);

      if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }
    
    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}