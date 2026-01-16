import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ===============================
// HELPERS
// ===============================
function isPaid(item: any): boolean {
  return (
    item.payment_status === 'paid' ||
    item.payment_confirmed === true ||
    !!item.actual_payment_date
  );
}

// ===============================
// GET
// ===============================
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);

    // ===============================
    // VENTAS
    // ===============================
    const { data: ventas = [] } = await supabase
      .from('sales')
      .select(`
        id,
        subtotal,
        tax_amount,
        gross_total,
        sale_date,
        actual_payment_date,
        payment_status
      `)
      .eq('user_id', userId);

    // ---- CASH FLOW: COBROS (con IVA)
    const cobros = ventas.filter(v =>
      v.actual_payment_date &&
      new Date(v.actual_payment_date) >= startDate &&
      new Date(v.actual_payment_date) <= now
    );

    const cobrosCaja = cobros.reduce(
      (sum, v) =>
        sum + (v.gross_total ?? (v.subtotal || 0) + (v.tax_amount || 0)),
      0
    );

    // ---- RESULTADO: INGRESOS (sin IVA)
    const ventasDevengo = ventas.filter(v => {
      const f = new Date(v.sale_date);
      return f >= startDate && f <= now;
    });

    const ingresosContables = ventasDevengo.reduce(
      (sum, v) => sum + (v.subtotal || 0),
      0
    );

    const ivaRepercutido = ventasDevengo.reduce(
      (sum, v) => sum + (v.tax_amount || 0),
      0
    );

    // ===============================
    // FACTURAS
    // ===============================
    const { data: facturas = [] } = await supabase
      .from('invoices')
      .select(`
        id,
        total_amount,
        tax_amount,
        gross_amount,
        invoice_date,
        actual_payment_date,
        payment_status,
        payment_confirmed
      `)
      .eq('user_id', userId);

    // ---- CASH FLOW: PAGOS (con IVA)
    const pagos = facturas.filter(f =>
      isPaid(f) &&
      f.actual_payment_date &&
      new Date(f.actual_payment_date) >= startDate &&
      new Date(f.actual_payment_date) <= now
    );

    const pagosCaja = pagos.reduce(
      (sum, f) =>
        sum + (f.gross_amount ?? (f.total_amount || 0) + (f.tax_amount || 0)),
      0
    );

    // ---- RESULTADO: GASTOS (sin IVA)
    const facturasDevengo = facturas.filter(f => {
      const d = new Date(f.invoice_date);
      return d >= startDate && d <= now;
    });

    const gastosContables = facturasDevengo.reduce(
      (sum, f) => sum + (f.total_amount || 0),
      0
    );

    const ivaSoportado = facturasDevengo.reduce(
      (sum, f) => sum + (f.tax_amount || 0),
      0
    );

    // ===============================
    // RESULTADOS
    // ===============================
    const beneficioContable = ingresosContables - gastosContables;
    const cashFlow = cobrosCaja - pagosCaja;

    // ===============================
    // COMPROMISOS
    // ===============================
    const ivaPendiente = Math.max(0, ivaRepercutido - ivaSoportado);

    const facturasPendientes = facturas
      .filter(f => !isPaid(f))
      .reduce(
        (sum, f) =>
          sum + (f.gross_amount ?? (f.total_amount || 0) + (f.tax_amount || 0)),
        0
      );

    const liquidezReal = cashFlow - ivaPendiente - facturasPendientes;

    // ===============================
    // RESPONSE
    // ===============================
    return NextResponse.json({
      resultado_contable: {
        ingresos: ingresosContables,
        gastos: gastosContables,
        beneficio: beneficioContable
      },
      cash_flow: {
        cobros: cobrosCaja,
        pagos: pagosCaja,
        caja_generada: cashFlow
      },
      compromisos: {
        iva_pendiente: ivaPendiente,
        facturas_pendientes: facturasPendientes
      },
      liquidez_real: liquidezReal
    });

  } catch (error) {
    console.error('Error cashflow:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// ===============================
// POST – MARCAR COMO PAGADO
// ===============================
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { type, id } = body;

    if (!['sale', 'invoice'].includes(type)) {
      return NextResponse.json({ error: 'Tipo no válido' }, { status: 400 });
    }

    const table = type === 'invoice' ? 'invoices' : 'sales';

    const { error } = await supabase
      .from(table)
      .update({
        payment_status: 'paid',
        actual_payment_date: new Date().toISOString().split('T')[0]
      })
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error POST cashflow:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
