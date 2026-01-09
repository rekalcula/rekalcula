import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface BusinessResultData {
  periodo: string
  
  // Ingresos
  ingresosBrutos: number
  ivaRepercutido: number
  baseImponibleIngresos: number
  
  // Costos
  costosVariables: number
  costosFijos: number
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
  
  // ⭐ NUEVO: Desglose detallado de costos para el frontend
  desgloseCostos: {
    comprasProductos: number      // Facturas de productos/materiales
    serviciosExternos: number     // Facturas de servicios
    costosFijosOperativos: number // Costos fijos mensuales
    otrosGastos: number           // Otros
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const periodoParam = searchParams.get('periodo') || 'mes'

    // ========================================
    // CALCULAR FECHAS DEL PERÍODO
    // ========================================
    const now = new Date()
    let startDate: Date
    let endDate: Date
    let mesesEnPeriodo = 1
    
    switch (periodoParam) {
      case '3meses':
        startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1)
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        mesesEnPeriodo = 3
        break
      case '6meses':
        startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1)
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        mesesEnPeriodo = 6
        break
      case 'año':
      case 'anual':
        startDate = new Date(now.getFullYear(), 0, 1)
        endDate = new Date(now.getFullYear(), 11, 31)
        mesesEnPeriodo = 12
        break
      default: // mes actual
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        mesesEnPeriodo = 1
    }
    
    const periodoLabel = periodoParam === 'mes' 
      ? now.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
      : `Últimos ${mesesEnPeriodo} meses`

    console.log(`[business-result] Período: ${periodoLabel}, desde ${startDate.toISOString().split('T')[0]} hasta ${endDate.toISOString().split('T')[0]}`)

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
    // 2. OBTENER VENTAS + ITEMS (Ingresos + Costos Variables)
    // ========================================
    const { data: sales } = await supabase
      .from('sales')
      .select('*, sale_items(*)')
      .eq('user_id', userId)
      .gte('sale_date', startDate.toISOString().split('T')[0])
      .lte('sale_date', endDate.toISOString().split('T')[0])

    // Calcular ingresos
    const ingresosBrutos = (sales || []).reduce((sum, sale) => sum + (sale.total || 0), 0)
    
    // Calcular IVA repercutido (incluido en el total de venta)
    const baseImponibleIngresos = ingresosBrutos / (1 + config.porcentajeIva / 100)
    const ivaRepercutido = ingresosBrutos - baseImponibleIngresos

    // Calcular costos variables (cost_price * quantity de sale_items)
    // Esto representa el COSTO DE VENTAS (COGS)
    const costosVariablesCOGS = (sales || []).reduce((sum, sale) => {
      return sum + (sale.sale_items || []).reduce((itemSum: number, item: any) =>
        itemSum + ((item.cost_price || 0) * (item.quantity || 0)), 0)
    }, 0)

    // Ventas cobradas vs pendientes
    const ventasCobradas = (sales || [])
      .filter(s => s.payment_status === 'paid')
      .reduce((sum, s) => sum + (s.total || 0), 0)
    const ventasPendientes = ingresosBrutos - ventasCobradas

    console.log(`[business-result] Ventas: ${ingresosBrutos}€, COGS: ${costosVariablesCOGS}€`)

    // ========================================
    // 3. OBTENER COSTOS FIJOS
    // ⭐ CORREGIDO: Multiplicar por meses del período
    // ========================================
    const { data: fixedCosts } = await supabase
      .from('fixed_costs')
      .select('*')
      .eq('user_id', userId)
      .eq('active', true)

    // Calcular costo fijo MENSUAL
    const costosFijosMensuales = (fixedCosts || []).reduce((sum, cost) => {
      let monthly = cost.amount || 0
      if (cost.frequency === 'quarterly') monthly = monthly / 3
      if (cost.frequency === 'yearly' || cost.frequency === 'annual') monthly = monthly / 12
      return sum + monthly
    }, 0)

    // ⭐ IMPORTANTE: Multiplicar por los meses del período
    const costosFijos = costosFijosMensuales * mesesEnPeriodo

    console.log(`[business-result] Costos fijos mensuales: ${costosFijosMensuales}€ x ${mesesEnPeriodo} meses = ${costosFijos}€`)

    // ========================================
    // 4. OBTENER FACTURAS/GASTOS (COMPRAS)
    // ========================================
    const { data: invoices } = await supabase
      .from('invoices')
      .select('*')
      .eq('user_id', userId)
      .gte('invoice_date', startDate.toISOString().split('T')[0])
      .lte('invoice_date', endDate.toISOString().split('T')[0])

    // Total de facturas de compra
    const gastosFacturas = (invoices || []).reduce((sum, inv) => sum + (inv.total_amount || 0), 0)
    
    // Calcular IVA soportado de las facturas
    const baseImponibleGastos = gastosFacturas / (1 + config.porcentajeIva / 100)
    const ivaSoportado = gastosFacturas - baseImponibleGastos

    // Facturas pagadas vs pendientes
    const facturasPagadas = (invoices || [])
      .filter(i => i.payment_status === 'paid')
      .reduce((sum, i) => sum + (i.total_amount || 0), 0)
    const facturasPendientes = gastosFacturas - facturasPagadas

    console.log(`[business-result] Facturas: ${gastosFacturas}€ (pagadas: ${facturasPagadas}€, pendientes: ${facturasPendientes}€)`)

    // ========================================
    // ⭐ DESGLOSE DE COSTOS POR CATEGORÍA
    // ========================================
    const categoriasProductos = ['Productos', 'Materiales', 'Suministros', 'Inventario', 'Mercancías']
    const categoriasServicios = ['Servicios', 'Marketing', 'Publicidad', 'Profesionales', 'Asesoría']
    
    const comprasProductos = (invoices || [])
      .filter(inv => categoriasProductos.some(cat => 
        (inv.category || '').toLowerCase().includes(cat.toLowerCase())
      ))
      .reduce((sum, inv) => sum + (inv.total_amount || 0), 0)

    const serviciosExternos = (invoices || [])
      .filter(inv => categoriasServicios.some(cat => 
        (inv.category || '').toLowerCase().includes(cat.toLowerCase())
      ))
      .reduce((sum, inv) => sum + (inv.total_amount || 0), 0)

    const otrosGastos = gastosFacturas - comprasProductos - serviciosExternos

    // ========================================
    // 5. CALCULAR RESULTADOS
    // ⭐ CORREGIDO: Incluir costos fijos correctamente
    // ========================================
    
    // Total de costos = COGS + Costos Fijos + Compras/Facturas
    const totalCostos = costosVariablesCOGS + costosFijos + gastosFacturas
    
    // ⭐ Para el cálculo del margen, usamos las compras como costos variables
    // ya que representan los gastos directamente relacionados con la operación
    const costosVariablesTotal = costosVariablesCOGS + gastosFacturas
    
    // Margen Bruto = Ingresos - Costos Variables (COGS + Compras)
    const margenBruto = ingresosBrutos - costosVariablesTotal
    const margenBrutoPorcentaje = ingresosBrutos > 0 
      ? (margenBruto / ingresosBrutos) * 100 
      : 0

    // Beneficio Operativo = Margen Bruto - Costos Fijos
    const beneficioOperativo = margenBruto - costosFijos

    console.log(`[business-result] Margen Bruto: ${margenBruto}€, Beneficio Operativo: ${beneficioOperativo}€`)

    // ========================================
    // 6. CALCULAR CARGA FISCAL
    // ========================================
    
    // IVA a ingresar = IVA Repercutido - IVA Soportado
    const ivaAIngresar = Math.max(0, ivaRepercutido - ivaSoportado)
    
    // IRPF estimado (solo para autónomos, sobre beneficio positivo)
    const irpfEstimado = config.tipoEntidad === 'autonomo' && beneficioOperativo > 0
      ? beneficioOperativo * (config.porcentajeIrpf / 100)
      : 0
    
    // Impuesto de Sociedades (para SL/SA, sobre beneficio positivo)
    const impuestoSociedadesEstimado = 
      (config.tipoEntidad === 'sl' || config.tipoEntidad === 'sa') && beneficioOperativo > 0
        ? beneficioOperativo * (config.porcentajeIS / 100)
        : 0

    const totalCargaFiscal = ivaAIngresar + irpfEstimado + impuestoSociedadesEstimado
    
    // Reserva fiscal recomendada (con margen de seguridad)
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
    // ⭐ CORREGIDO: Incluir costos fijos en lo pagado
    const pagadoReal = facturasPagadas + costosFijos
    const balanceCaja = cobradoReal - pagadoReal
    const pendienteCobro = ventasPendientes
    const pendientePago = facturasPendientes

    // Días de cobertura
    const gastosDiarios = totalCostos / (30 * mesesEnPeriodo)
    const diasCobertura = gastosDiarios > 0 
      ? Math.round(Math.max(0, balanceCaja) / gastosDiarios)
      : 999

    // ========================================
    // 9. DATOS PARA GRÁFICO WATERFALL
    // ========================================
    let cumulative = 0
    const waterfallData: BusinessResultData['waterfallData'] = []

    // Ingresos
    cumulative = ingresosBrutos
    waterfallData.push({
      name: 'Ingresos Brutos',
      value: ingresosBrutos,
      type: 'income',
      cumulative
    })

    // Costos Variables (COGS)
    if (costosVariablesCOGS > 0) {
      cumulative -= costosVariablesCOGS
      waterfallData.push({
        name: 'Costo de Ventas',
        value: -costosVariablesCOGS,
        type: 'expense',
        cumulative
      })
    }

    // Compras / Facturas
    if (gastosFacturas > 0) {
      cumulative -= gastosFacturas
      waterfallData.push({
        name: 'Compras',
        value: -gastosFacturas,
        type: 'expense',
        cumulative
      })
    }

    // Margen Bruto (subtotal)
    waterfallData.push({
      name: 'Margen Bruto',
      value: margenBruto,
      type: 'subtotal',
      cumulative
    })

    // Costos Fijos
    if (costosFijos > 0) {
      cumulative -= costosFijos
      waterfallData.push({
        name: 'Costos Fijos',
        value: -costosFijos,
        type: 'expense',
        cumulative
      })
    }

    // Beneficio Operativo (subtotal)
    waterfallData.push({
      name: 'Beneficio Operativo',
      value: beneficioOperativo,
      type: 'subtotal',
      cumulative
    })

    // IVA a Ingresar
    if (ivaAIngresar > 0) {
      cumulative -= ivaAIngresar
      waterfallData.push({
        name: 'IVA a Ingresar',
        value: -ivaAIngresar,
        type: 'expense',
        cumulative
      })
    }

    // IRPF o IS
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

    // Beneficio Neto (total final)
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
      
      ingresosBrutos,
      ivaRepercutido,
      baseImponibleIngresos,
      
      // ⭐ costosVariables ahora incluye COGS + Compras
      costosVariables: costosVariablesTotal,
      costosFijos,
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
      waterfallData,
      
      // ⭐ NUEVO: Desglose detallado
      desgloseCostos: {
        comprasProductos,
        serviciosExternos,
        costosFijosOperativos: costosFijos,
        otrosGastos
      }
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