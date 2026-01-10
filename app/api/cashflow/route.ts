import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ========================================
// MÉTODOS DE PAGO AL CONTADO
// (estas ventas se consideran cobradas automáticamente)
// ========================================
const METODOS_PAGO_CONTADO = [
  'efectivo',
  'cash',
  'tarjeta',
  'tarjeta_credito',
  'tarjeta_debito',
  'card',
  'credit_card',
  'debit_card',
  'transferencia',
  'transfer',
  'bizum',
  'paypal'
];

// ========================================
// Función para verificar si una venta está cobrada
// LÓGICA MEJORADA:
// 1. payment_status = 'paid' → cobrada
// 2. source = 'ticket' → cobrada (tickets de caja siempre se pagan al momento)
// 3. payment_method es al contado → cobrada
// 4. actual_payment_date existe → cobrada
// ========================================
function ventaEstaCobrada(venta: any): boolean {
  // 1. Si tiene payment_status = 'paid', está cobrada
  if (venta.payment_status === 'paid') return true;
  
  // 2. NUEVO: Si es un ticket de caja, está cobrada automáticamente
  // Los tickets de venta (source = 'ticket') siempre se pagan en el momento
  if (venta.source === 'ticket') return true;
  
  // 3. Si el método de pago es al contado, está cobrada automáticamente
  const metodoPago = (venta.payment_method || '').toLowerCase().trim();
  if (metodoPago && METODOS_PAGO_CONTADO.includes(metodoPago)) return true;
  
  // 4. Si tiene actual_payment_date, está cobrada
  if (venta.actual_payment_date) return true;
  
  return false;
}

// Función para verificar si una factura está pagada
function facturaEstaPagada(factura: any): boolean {
  // 1. Si tiene payment_status = 'paid', está pagada
  if (factura.payment_status === 'paid') return true;
  
  // 2. Si payment_confirmed es true, está pagada
  if (factura.payment_confirmed === true) return true;
  
  // 3. Si el método de pago es al contado, está pagada
  const metodoPago = (factura.payment_method || '').toLowerCase().trim();
  if (metodoPago && METODOS_PAGO_CONTADO.includes(metodoPago)) return true;
  
  // 4. Si tiene actual_payment_date, está pagada
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

    // ========================================
    // CALCULAR FECHAS SEGÚN EL PERÍODO
    // ========================================
    
    if (periodo === 'all') {
      // Detectar todo el rango de datos
      const { data: oldestSale } = await supabase
        .from('sales')
        .select('sale_date')
        .eq('user_id', userId)
        .order('sale_date', { ascending: true })
        .limit(1)
        .single();

      const { data: oldestInvoice } = await supabase
        .from('invoices')
        .select('invoice_date')
        .eq('user_id', userId)
        .order('invoice_date', { ascending: true })
        .limit(1)
        .single();

      // Usar la fecha más antigua
      if (oldestSale?.sale_date && oldestInvoice?.invoice_date) {
        startDate = new Date(oldestSale.sale_date < oldestInvoice.invoice_date 
          ? oldestSale.sale_date 
          : oldestInvoice.invoice_date);
      } else if (oldestSale?.sale_date) {
        startDate = new Date(oldestSale.sale_date);
      } else if (oldestInvoice?.invoice_date) {
        startDate = new Date(oldestInvoice.invoice_date);
      } else {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      // Calcular meses en el período
      const monthsDiff = (now.getFullYear() - startDate.getFullYear()) * 12 + 
                         (now.getMonth() - startDate.getMonth()) + 
                         (now.getDate() / 30);
      mesesEnPeriodo = Math.max(1, monthsDiff);
      
    } else {
      switch (periodo) {
        case '3meses':
          startDate = new Date();
          startDate.setMonth(now.getMonth() - 3);
          mesesEnPeriodo = 3;
          break;
        case '6meses':
          startDate = new Date();
          startDate.setMonth(now.getMonth() - 6);
          mesesEnPeriodo = 6;
          break;
        default: // mes
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          mesesEnPeriodo = 1;
      }
    }

    // ========================================
    // OBTENER VENTAS (ENTRADAS/COBROS)
    // Incluimos 'source' para detectar tickets
    // ========================================
    const { data: ventas, error: errorVentas } = await supabase
      .from('sales')
      .select('id, total, payment_status, payment_method, payment_due_date, actual_payment_date, customer_name, sale_date, created_at, source')
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
      .select('id, name, amount, frequency, active')
      .eq('user_id', userId);

    if (errorCostos) {
      console.error('Error obteniendo costos fijos:', errorCostos);
    }

    // Filtrar costos activos
    const activeCosts = (costosFijos || []).filter(cost => {
      if (cost.active === false || cost.active === 'false') return false;
      return true;
    });

    // ========================================
    // CALCULAR TOTALES DE ENTRADAS (VENTAS)
    // ========================================
    const totalVentas = ventas?.reduce((sum, v) => sum + (v.total || 0), 0) || 0;
    
    // Ventas cobradas (usando la función mejorada)
    const ventasCobradas = ventas
      ?.filter(v => ventaEstaCobrada(v))
      .reduce((sum, v) => sum + (v.total || 0), 0) || 0;
    
    const ventasPendientes = totalVentas - ventasCobradas;

    // ========================================
    // CALCULAR TOTALES DE SALIDAS (FACTURAS)
    // ========================================
    const totalFacturas = facturas?.reduce((sum, f) => sum + (f.total_amount || 0), 0) || 0;
    
    // Facturas pagadas (usando la función mejorada)
    const facturasPagadas = facturas
      ?.filter(f => facturaEstaPagada(f))
      .reduce((sum, f) => sum + (f.total_amount || 0), 0) || 0;
    
    const facturasPendientes = totalFacturas - facturasPagadas;

    // ========================================
    // CALCULAR COSTOS FIJOS DEL PERÍODO
    // ========================================
    const costosFijosMensuales = activeCosts.reduce((sum, c) => {
      let mensual = c.amount || 0;
      if (c.frequency === 'annual' || c.frequency === 'yearly') mensual = mensual / 12;
      if (c.frequency === 'quarterly') mensual = mensual / 3;
      return sum + mensual;
    }, 0);

    // Multiplicar por los meses del período
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
    
    // Determinar cuántos meses mostrar (máximo 12)
    const mesesAMostrar = Math.min(Math.ceil(mesesEnPeriodo), 12);
    
    for (let i = mesesAMostrar - 1; i >= 0; i--) {
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
    // PRÓXIMOS COBROS (SOLO VENTAS REALMENTE PENDIENTES)
    // ========================================
    const ahora = new Date();
    const en30Dias = new Date(ahora);
    en30Dias.setDate(ahora.getDate() + 30);

    // Solo mostrar ventas que NO están cobradas
    const proximosCobros = ventas
      ?.filter(v => {
        // Si está cobrada (ticket, pago al contado, etc.), NO mostrar
        if (ventaEstaCobrada(v)) return false;
        
        // Si tiene fecha de vencimiento futura, mostrar
        if (v.payment_due_date) {
          const vencimiento = new Date(v.payment_due_date);
          return vencimiento >= ahora && vencimiento <= en30Dias;
        }
        
        return false; // Si no tiene fecha de vencimiento y no está cobrada, no mostrar
      })
      .sort((a, b) => {
        const dateA = a.payment_due_date ? new Date(a.payment_due_date).getTime() : 0;
        const dateB = b.payment_due_date ? new Date(b.payment_due_date).getTime() : 0;
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
    // PRÓXIMOS PAGOS (SOLO FACTURAS REALMENTE PENDIENTES)
    // ========================================
    const proximosPagos = facturas
      ?.filter(f => {
        // Si está pagada, NO mostrar
        if (facturaEstaPagada(f)) return false;
        
        // Si tiene fecha de vencimiento futura, mostrar
        if (f.payment_due_date) {
          const vencimiento = new Date(f.payment_due_date);
          return vencimiento >= ahora && vencimiento <= en30Dias;
        }
        
        return false; // Si no tiene fecha de vencimiento y no está pagada, no mostrar
      })
      .sort((a, b) => {
        const dateA = a.payment_due_date ? new Date(a.payment_due_date).getTime() : 0;
        const dateB = b.payment_due_date ? new Date(b.payment_due_date).getTime() : 0;
        return dateA - dateB;
      })
      .slice(0, 5)
      .map(f => ({
        id: String(f.id),
        concepto: f.supplier || `Factura ${f.category || 'compra'}`,
        monto: f.total_amount || 0,
        fecha: f.payment_due_date || f.invoice_date
      })) || [];

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
      mesesEnPeriodo: Math.round(mesesEnPeriodo * 10) / 10,
      costosFijosMensuales
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