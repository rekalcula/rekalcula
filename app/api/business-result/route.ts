import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface BusinessResultData {
  periodo: string
  mesesEnPeriodo: number
  
  // Ingresos
  ingresosBrutos: number
  ivaRepercutido: number
  baseImponibleIngresos: number
  
  // Costos
  costosVariables: number
  costosFijos: number
  costosFijosMensuales: number
  gastosFacturas: number
  ivaSoportado: number
  totalCostos: number
  
  // Resultados operativos
  margenBruto: number
  margenBrutoPorcentaje: number
  beneficioOperativo: number
  
  // Carga fiscal
  ivaAIngresar: number
  irpfEstimado: number
  impuestoSociedadesEstimado: number
  totalCargaFiscal: number
  reservaFiscalRecomendada: number
  
  // Resultado final
  beneficioNetoReal: number
  beneficioNetoPorcentaje: number
  
  // Liquidez (Cash Flow)
  cobradoReal: number
  pagadoReal: number
  balanceCaja: number
  pendienteCobro: number
  pendientePago: number
  diasCobertura: number
  
  // Configuración fiscal aplicada
  configFiscal: {
    tipoEntidad: string
    regimenFiscal: string
    porcentajeIva: number
    porcentajeIrpf: number
    porcentajeIS: number
  }
  
  // Datos para gráfico waterfall
  waterfallData: Array<{
    name: string
    value: number
    type: 'income' | 'expense' | 'subtotal' | 'total'
    cumulative: number
  }>
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const periodoParam = searchParams.get('periodo') || 'all'

    const now = new Date()
    let startDate: Date
    let endDate: Date
    let mesesEnPeriodo: number

    // ========================================
    // CALCULAR FECHAS SEGÚN EL PERÍODO
    // ========================================
    
    if (periodoParam === 'all') {
      // Detectar todo el rango de datos
      const { data: oldestSale } = await supabase
        .from('sales')
        .select('sale_date')
        .eq('user_id', userId)
        .order('sale_date', { ascending: true })
        .limit(1)
        .single()

      const { data: oldestInvoice } = await supabase
        .from('invoices')
        .select('invoice_date')
        .eq('user_id', userId)
        .order('invoice_date', { ascending: true })
        .limit(1)
        .single()

      // Usar la fecha más antigua
      if (oldestSale?.sale_date && oldestInvoice?.invoice_date) {
        startDate = new Date(oldestSale.sale_date < oldestInvoice.invoice_date 
          ? oldestSale.sale_date 
          : oldestInvoice.invoice_date)
      } else if (oldestSale?.sale_date) {
        startDate = new Date(oldestSale.sale_date)
      } else if (oldestInvoice?.invoice_date) {
        startDate = new Date(oldestInvoice.invoice_date)
      } else {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      }
      
      endDate = now
      
      // Calcular meses en el período
      const monthsDiff = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                         (endDate.getMonth() - startDate.getMonth()) + 
                         (endDate.getDate() / 30)
      mesesEnPeriodo = Math.max(1, monthsDiff)
      
    } else if (periodoParam === 'mes') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      mesesEnPeriodo = 1
    } else if (periodoParam === '3meses') {
      startDate = new Date()
      startDate.setMonth(now.getMonth() - 3)
      endDate = now
      mesesEnPeriodo = 3
    } else if (periodoParam === '6meses') {
      startDate = new Date()
      startDate.setMonth(now.getMonth() - 6)
      endDate = now
      mesesEnPeriodo = 6
    } else {
      // Por defecto: mes actual
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      mesesEnPeriodo = 1
    }
    
    // Formatear período para mostrar
    const startDateFormatted = startDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
    const endDateFormatted = endDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
    const periodoLabel = startDateFormatted === endDateFormatted 
      ? startDateFormatted 
      : `${startDateFormatted} - ${endDateFormatted}`

    // ========================================
    // 1. OBTENER CONFIGURACIÓN FISCAL
    // ========================================
    const { data: fiscalConfig } = await supabase
      .from('fiscal_config')
      .select('*')
      .eq('user_id', userId)
      .single()

    const config = {
      tipoEntidad: fiscalConfig?.tipo_entidad || 'autonomo',
      regimenFiscal: fiscalConfig?.regimen_fiscal || 'general',
      porcentajeIva: fiscalConfig?.porcentaje_iva || 21,
      porcentajeIrpf: fiscalConfig?.retencion_irpf || 15,
      porcentajeIS: fiscalConfig?.tipo_impuesto_sociedades || 25
    }

    // ========================================
    // 2. OBTENER VENTAS (TODO EL PERÍODO)
    // ========================================
    const { data: sales } = await supabase
      .from('sales')
      .select('*, sale_items(*)')
      .eq('user_id', userId)
      .gte('sale_date', startDate.toISOString().split('T')[0])
      .lte('sale_date', endDate.toISOString().split('T')[0])

    // Calcular ingresos
    // Calcular ingresos - ✅ CORREGIDO: usar campos directos
    const baseImponibleIngresos = (sales || []).reduce((sum, sale) => sum + (sale.subtotal || sale.total || 0), 0)
    const ivaRepercutido = (sales || []).reduce((sum, sale) => sum + (sale.tax_amount || 0), 0)
    const ingresosBrutos = baseImponibleIngresos + ivaRepercutido

    // Ventas cobradas vs pendientes
    const ventasCobradas = (sales || [])
      .filter(s => s.payment_status === 'paid' || s.source === 'ticket')
      .reduce((sum, s) => sum + (s.total || 0), 0)
    const ventasPendientes = ingresosBrutos - ventasCobradas

    // ========================================
    // 3. OBTENER COSTOS FIJOS - ✅ CORREGIDO
    // ========================================
    const { data: fixedCosts, error: fixedCostsError } = await supabase
      .from('fixed_costs')
      .select('*')
      .eq('user_id', userId)

    if (fixedCostsError) {
      console.error('[business-result] Error obteniendo costos fijos:', fixedCostsError)
    }

    // Filtrar activos - ✅ CORREGIDO: usar is_active
    const activeCosts = (fixedCosts || []).filter(cost => {
      if (cost.is_active === false || cost.is_active === 'false') return false
      return true
    })

    // Calcular costos fijos MENSUALES
    const costosFijosMensuales = activeCosts.reduce((sum, cost) => {
      let monthly = cost.amount || 0
      if (cost.frequency === 'quarterly') monthly = monthly / 3
      if (cost.frequency === 'yearly' || cost.frequency === 'annual') monthly = monthly / 12
      return sum + monthly
    }, 0)

    // IMPORTANTE: Multiplicar por los meses del período
    const costosFijos = costosFijosMensuales * mesesEnPeriodo

    console.log('[business-result] Período:', periodoLabel, '| Meses:', mesesEnPeriodo)
    console.log('[business-result] Costos fijos mensuales:', costosFijosMensuales, '| Total período:', costosFijos)

    // ========================================
    // 4. OBTENER FACTURAS/GASTOS (TODO EL PERÍODO)
    // ========================================
    const { data: invoices } = await supabase
      .from('invoices')
      .select('*')
      .eq('user_id', userId)
      .gte('invoice_date', startDate.toISOString().split('T')[0])
      .lte('invoice_date', endDate.toISOString().split('T')[0])

    // Gastos de facturas (compras variables)
    // Gastos de facturas (compras variables) - ✅ CORREGIDO
    const gastosFacturas = (invoices || []).reduce((sum, inv) => sum + (inv.total_amount || 0), 0)
    
    // IVA soportado - usar campo directo
    const ivaSoportado = (invoices || []).reduce((sum, inv) => sum + (inv.tax_amount || 0), 0)

    // Facturas pagadas vs pendientes
    const facturasPagadas = (invoices || [])
      .filter(i => i.payment_status === 'paid' || i.payment_confirmed === true)
      .reduce((sum, i) => sum + (i.total_amount || 0), 0)
    const facturasPendientes = gastosFacturas - facturasPagadas

    // ========================================
    // 5. CALCULAR RESULTADOS
    // ========================================
    const costosVariables = gastosFacturas
    const totalCostos = costosVariables + costosFijos
    
    const margenBruto = ingresosBrutos - costosVariables
    const margenBrutoPorcentaje = ingresosBrutos > 0 
      ? (margenBruto / ingresosBrutos) * 100 
      : 0

    const beneficioOperativo = margenBruto - costosFijos

    console.log('[business-result] Cálculo:', {
      ingresosBrutos,
      costosVariables,
      costosFijos,
      beneficioOperativo
    })

    // ========================================
    // 6. CALCULAR CARGA FISCAL
    // ========================================
    const ivaAIngresar = Math.max(0, ivaRepercutido - ivaSoportado)
    
    const irpfEstimado = config.tipoEntidad === 'autonomo' && beneficioOperativo > 0
      ? beneficioOperativo * (config.porcentajeIrpf / 100)
      : 0
    
    const impuestoSociedadesEstimado = 
      (config.tipoEntidad === 'sl' || config.tipoEntidad === 'sa') && beneficioOperativo > 0
        ? beneficioOperativo * (config.porcentajeIS / 100)
        : 0

    const totalCargaFiscal = ivaAIngresar + irpfEstimado + impuestoSociedadesEstimado
    const reservaFiscalRecomendada = totalCargaFiscal * 1.1

    // ========================================
    // 7. BENEFICIO NETO REAL
    // ========================================
    const beneficioNetoReal = beneficioOperativo - totalCargaFiscal
    const beneficioNetoPorcentaje = ingresosBrutos > 0 
      ? (beneficioNetoReal / ingresosBrutos) * 100 
      : 0

    // ========================================
    // 8. LIQUIDEZ / CASH FLOW
    // ========================================
    const cobradoReal = ventasCobradas
    const pagadoReal = facturasPagadas + costosFijos
    const balanceCaja = cobradoReal - pagadoReal
    const pendienteCobro = ventasPendientes
    const pendientePago = facturasPendientes

    const gastosDiarios = totalCostos / (mesesEnPeriodo * 30)
    const diasCobertura = gastosDiarios > 0 
      ? Math.round(Math.max(0, balanceCaja) / gastosDiarios)
      : 999

    // ========================================
    // 9. DATOS PARA GRÁFICO WATERFALL
    // ========================================
    let cumulative = 0
    const waterfallData: BusinessResultData['waterfallData'] = []

    cumulative = ingresosBrutos
    waterfallData.push({
      name: 'Ingresos Brutos',
      value: ingresosBrutos,
      type: 'income',
      cumulative
    })

    if (costosVariables > 0) {
      cumulative -= costosVariables
      waterfallData.push({
        name: 'Compras',
        value: -costosVariables,
        type: 'expense',
        cumulative
      })
    }

    waterfallData.push({
      name: 'Margen Bruto',
      value: margenBruto,
      type: 'subtotal',
      cumulative
    })

    if (costosFijos > 0) {
      cumulative -= costosFijos
      waterfallData.push({
        name: 'Costos Fijos',
        value: -costosFijos,
        type: 'expense',
        cumulative
      })
    }

    waterfallData.push({
      name: 'Beneficio Operativo',
      value: beneficioOperativo,
      type: 'subtotal',
      cumulative
    })

    if (ivaAIngresar > 0) {
      cumulative -= ivaAIngresar
      waterfallData.push({
        name: 'IVA a Ingresar',
        value: -ivaAIngresar,
        type: 'expense',
        cumulative
      })
    }

    if (irpfEstimado > 0) {
      cumulative -= irpfEstimado
      waterfallData.push({
        name: 'IRPF Estimado',
        value: -irpfEstimado,
        type: 'expense',
        cumulative
      })
    }
    
    if (impuestoSociedadesEstimado > 0) {
      cumulative -= impuestoSociedadesEstimado
      waterfallData.push({
        name: 'Imp. Sociedades',
        value: -impuestoSociedadesEstimado,
        type: 'expense',
        cumulative
      })
    }

    waterfallData.push({
      name: 'Beneficio Neto',
      value: beneficioNetoReal,
      type: 'total',
      cumulative: beneficioNetoReal
    })

    // ========================================
    // RESPUESTA
    // ========================================
    const result: BusinessResultData = {
      periodo: periodoLabel,
      mesesEnPeriodo: Math.round(mesesEnPeriodo * 10) / 10,
      
      ingresosBrutos,
      ivaRepercutido,
      baseImponibleIngresos,
      
      costosVariables,
      costosFijos,
      costosFijosMensuales,
      gastosFacturas,
      ivaSoportado,
      totalCostos,
      
      margenBruto,
      margenBrutoPorcentaje,
      beneficioOperativo,
      
      ivaAIngresar,
      irpfEstimado,
      impuestoSociedadesEstimado,
      totalCargaFiscal,
      reservaFiscalRecomendada,
      
      beneficioNetoReal,
      beneficioNetoPorcentaje,
      
      cobradoReal,
      pagadoReal,
      balanceCaja,
      pendienteCobro,
      pendientePago,
      diasCobertura,
      
      configFiscal: config,
      waterfallData
    }

    return NextResponse.json({ success: true, data: result })

  } catch (error) {
    console.error('Error en API business-result:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}