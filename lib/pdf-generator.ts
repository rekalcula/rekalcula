import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// Colores del tema reKalcula
const COLORS = {
  primary: '#d98c21',
  dark: '#262626',
  white: '#FFFFFF',
  gray: '#6B7280',
  green: '#10B981',
  red: '#EF4444',
  blue: '#3B82F6'
}

// Función auxiliar para convertir hex a RGB
const hexToRgb = (hex: string): [number, number, number] => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result 
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [0, 0, 0]
}

// Header común para todos los PDFs
const addHeader = (doc: jsPDF, title: string, subtitle?: string) => {
  const pageWidth = doc.internal.pageSize.getWidth()
  
  // Fondo del header
  doc.setFillColor(...hexToRgb(COLORS.dark))
  doc.rect(0, 0, pageWidth, 45, 'F')
  
  // Logo/Título
  doc.setTextColor(...hexToRgb(COLORS.primary))
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.text('reKalcula', 20, 25)
  
  // Título del reporte
  doc.setTextColor(...hexToRgb(COLORS.white))
  doc.setFontSize(14)
  doc.text(title, 20, 38)
  
  // Fecha
  doc.setFontSize(10)
  doc.setTextColor(...hexToRgb(COLORS.gray))
  const fecha = new Date().toLocaleDateString('es-ES', { 
    day: '2-digit', 
    month: 'long', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
  doc.text(fecha, pageWidth - 20, 25, { align: 'right' })
  
  if (subtitle) {
    doc.setTextColor(...hexToRgb(COLORS.white))
    doc.setFontSize(10)
    doc.text(subtitle, pageWidth - 20, 38, { align: 'right' })
  }
  
  return 55 // Posición Y después del header
}

// Footer común
const addFooter = (doc: jsPDF) => {
  const pageCount = doc.internal.pages.length - 1
  const pageHeight = doc.internal.pageSize.getHeight()
  const pageWidth = doc.internal.pageSize.getWidth()
  
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(...hexToRgb(COLORS.gray))
    doc.text(
      `Página ${i} de ${pageCount} | Generado por reKalcula`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    )
  }
}

// ============================================================
// 1. PDF DE COSTES FIJOS
// ============================================================
interface FixedCost {
  id: string
  name: string
  description?: string
  amount: number
  frequency: string
  category_id: string
  is_active: boolean
  fixed_cost_categories?: {
    id: string
    name: string
    icon: string
  }
}

interface Category {
  id: string
  name: string
  icon: string
}

export const generateCostsPDF = (
  costs: FixedCost[], 
  categories: Category[],
  monthlyTotal: number
) => {
  const doc = new jsPDF()
  let yPos = addHeader(doc, 'Resumen de Costes Fijos', 'Gastos Empresariales')
  
  // Resumen total
  doc.setFillColor(...hexToRgb('#FEF3C7'))
  doc.roundedRect(20, yPos, 170, 25, 3, 3, 'F')
  doc.setFontSize(12)
  doc.setTextColor(...hexToRgb(COLORS.dark))
  doc.text('Total Mensual:', 30, yPos + 10)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...hexToRgb(COLORS.red))
  doc.text(`€${monthlyTotal.toFixed(2)}`, 30, yPos + 20)
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...hexToRgb(COLORS.gray))
  doc.text(`${costs.length} costes fijos registrados`, 120, yPos + 15)
  
  yPos += 35
  
  // Agrupar por categoría
  const costsByCategory = costs.reduce((acc, cost) => {
    const catId = cost.category_id || 'other'
    if (!acc[catId]) acc[catId] = []
    acc[catId].push(cost)
    return acc
  }, {} as Record<string, FixedCost[]>)
  
  const frequencyLabels: Record<string, string> = {
    monthly: 'Mensual',
    quarterly: 'Trimestral',
    yearly: 'Anual'
  }
  
  const getMonthlyAmount = (cost: FixedCost) => {
    if (cost.frequency === 'quarterly') return cost.amount / 3
    if (cost.frequency === 'yearly') return cost.amount / 12
    return cost.amount
  }
  
  // Tabla por cada categoría
  Object.entries(costsByCategory).forEach(([catId, categoryCosts]) => {
    const category = categories.find(c => c.id === catId)
    const categoryTotal = categoryCosts.reduce((sum, c) => sum + getMonthlyAmount(c), 0)
    
    // Título de categoría
    doc.setFillColor(...hexToRgb(COLORS.dark))
    doc.roundedRect(20, yPos, 170, 10, 2, 2, 'F')
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...hexToRgb(COLORS.white))
    doc.text(`${category?.icon || '📁'} ${category?.name || 'Otros'}`, 25, yPos + 7)
    doc.text(`€${categoryTotal.toFixed(2)}/mes`, 180, yPos + 7, { align: 'right' })
    
    yPos += 12
    
    // Tabla de costes
    const tableData = categoryCosts.map(cost => [
      cost.name,
      cost.description || '-',
      frequencyLabels[cost.frequency],
      `€${cost.amount.toFixed(2)}`,
      `€${getMonthlyAmount(cost).toFixed(2)}`
    ])
    
    autoTable(doc, {
      startY: yPos,
      head: [['Concepto', 'Descripción', 'Frecuencia', 'Importe', 'Mensual']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: hexToRgb(COLORS.primary),
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9
      },
      bodyStyles: {
        fontSize: 9,
        textColor: hexToRgb(COLORS.dark)
      },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 50 },
        2: { cellWidth: 25 },
        3: { cellWidth: 25, halign: 'right' },
        4: { cellWidth: 25, halign: 'right', fontStyle: 'bold' }
      },
      margin: { left: 20, right: 20 }
    })
    
    yPos = (doc as any).lastAutoTable.finalY + 10
    
    // Nueva página si es necesario
    if (yPos > 250) {
      doc.addPage()
      yPos = 20
    }
  })
  
  addFooter(doc)
  doc.save(`rekalcula_costes_fijos_${new Date().toISOString().split('T')[0]}.pdf`)
}

// ============================================================
// 2. PDF DE ANÁLISIS FINANCIERO
// ============================================================
interface FinancialData {
  totalSales: number
  totalVariableCosts: number
  totalFixedCosts: number
  grossProfit: number
  netProfit: number
  contributionMargin: number
  breakEvenPoint: number
  salesAboveBreakEven: number
}

export const generateFinancialPDF = (data: FinancialData, periodo: string) => {
  const doc = new jsPDF()
  let yPos = addHeader(doc, 'Análisis Financiero', periodo)
  
  const isProfit = data.netProfit >= 0
  const progressToBreakEven = data.breakEvenPoint > 0
    ? Math.min((data.totalSales / data.breakEvenPoint) * 100, 100)
    : 100
  
  // Tarjetas de resumen
  const cardWidth = 80
  const cardHeight = 35
  const gap = 10
  
  // Fila 1: Ventas y Costos
  // Ventas
  doc.setFillColor(...hexToRgb('#FEF3C7'))
  doc.roundedRect(20, yPos, cardWidth, cardHeight, 3, 3, 'F')
  doc.setFontSize(10)
  doc.setTextColor(...hexToRgb(COLORS.gray))
  doc.text('Ventas Totales', 25, yPos + 12)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...hexToRgb(COLORS.dark))
  doc.text(`€${data.totalSales.toFixed(2)}`, 25, yPos + 26)
  
  // Costos
  doc.setFillColor(...hexToRgb('#DBEAFE'))
  doc.roundedRect(20 + cardWidth + gap, yPos, cardWidth, cardHeight, 3, 3, 'F')
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...hexToRgb(COLORS.gray))
  doc.text('Costos Totales', 25 + cardWidth + gap, yPos + 12)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...hexToRgb(COLORS.dark))
  doc.text(`€${(data.totalVariableCosts + data.totalFixedCosts).toFixed(2)}`, 25 + cardWidth + gap, yPos + 26)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...hexToRgb(COLORS.gray))
  doc.text(`Fijos: €${data.totalFixedCosts.toFixed(0)} | Variables: €${data.totalVariableCosts.toFixed(0)}`, 25 + cardWidth + gap, yPos + 32)
  
  yPos += cardHeight + gap
  
  // Fila 2: Beneficio y Punto de Equilibrio
  // Beneficio
  doc.setFillColor(...hexToRgb(isProfit ? '#D1FAE5' : '#FEE2E2'))
  doc.roundedRect(20, yPos, cardWidth, cardHeight, 3, 3, 'F')
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...hexToRgb(isProfit ? COLORS.green : COLORS.red))
  doc.text('Beneficio Neto', 25, yPos + 12)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(`€${data.netProfit.toFixed(2)}`, 25, yPos + 26)
  doc.setFontSize(8)
  doc.text(`Margen: ${data.contributionMargin.toFixed(1)}%`, 25, yPos + 32)
  
  // Punto de Equilibrio
  doc.setFillColor(...hexToRgb('#F3F4F6'))
  doc.roundedRect(20 + cardWidth + gap, yPos, cardWidth, cardHeight, 3, 3, 'F')
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...hexToRgb(COLORS.gray))
  doc.text('Punto de Equilibrio', 25 + cardWidth + gap, yPos + 12)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...hexToRgb(COLORS.dark))
  doc.text(`€${data.breakEvenPoint.toFixed(2)}`, 25 + cardWidth + gap, yPos + 26)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...hexToRgb(progressToBreakEven >= 100 ? COLORS.green : COLORS.blue))
  doc.text(
    progressToBreakEven >= 100 
      ? `✓ Superado por €${data.salesAboveBreakEven.toFixed(0)}`
      : `${progressToBreakEven.toFixed(0)}% alcanzado`,
    25 + cardWidth + gap, yPos + 32
  )
  
  yPos += cardHeight + 20
  
  // Tabla de desglose
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...hexToRgb(COLORS.dark))
  doc.text('Desglose Financiero', 20, yPos)
  yPos += 8
  
  const tableData = [
    ['Ventas Brutas', `€${data.totalSales.toFixed(2)}`, ''],
    ['(-) Costos Variables', `€${data.totalVariableCosts.toFixed(2)}`, `${((data.totalVariableCosts / data.totalSales) * 100 || 0).toFixed(1)}%`],
    ['(=) Beneficio Bruto', `€${data.grossProfit.toFixed(2)}`, `${((data.grossProfit / data.totalSales) * 100 || 0).toFixed(1)}%`],
    ['(-) Costos Fijos', `€${data.totalFixedCosts.toFixed(2)}`, ''],
    ['(=) Beneficio Neto', `€${data.netProfit.toFixed(2)}`, `${((data.netProfit / data.totalSales) * 100 || 0).toFixed(1)}%`]
  ]
  
  autoTable(doc, {
    startY: yPos,
    head: [['Concepto', 'Importe', '% s/Ventas']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: hexToRgb(COLORS.primary),
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 10
    },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 50, halign: 'right', fontStyle: 'bold' },
      2: { cellWidth: 35, halign: 'right' }
    },
    margin: { left: 20, right: 20 },
    didParseCell: (data) => {
      if (data.row.index === 4) {
        data.cell.styles.fillColor = hexToRgb(isProfit ? '#D1FAE5' : '#FEE2E2')
        data.cell.styles.textColor = hexToRgb(isProfit ? COLORS.green : COLORS.red)
        data.cell.styles.fontStyle = 'bold'
      }
    }
  })
  
  addFooter(doc)
  doc.save(`rekalcula_analisis_financiero_${new Date().toISOString().split('T')[0]}.pdf`)
}

// ============================================================
// 3. PDF DE ANÁLISIS DE VENTAS
// ============================================================
interface Product {
  name: string
  quantity: number
  revenue: number
  percentage: number
  revenuePercentage: number
}

interface SalesData {
  period: string
  totalQuantity: number
  totalRevenue: number
  totalSales: number
  topProduct: Product | null
  products: Product[]
}

export const generateSalesPDF = (data: SalesData) => {
  const doc = new jsPDF()
  
  const periodLabels: Record<string, string> = {
    day: 'Hoy',
    week: 'Esta Semana',
    month: 'Este Mes'
  }
  
  let yPos = addHeader(doc, 'Análisis de Ventas', periodLabels[data.period] || data.period)
  
  // Tarjetas de resumen
  const cardWidth = 55
  const cardHeight = 30
  const gap = 8
  
  // Total Productos
  doc.setFillColor(...hexToRgb('#F3F4F6'))
  doc.roundedRect(20, yPos, cardWidth, cardHeight, 3, 3, 'F')
  doc.setFontSize(9)
  doc.setTextColor(...hexToRgb(COLORS.gray))
  doc.text('Productos Vendidos', 25, yPos + 10)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...hexToRgb(COLORS.dark))
  doc.text(`${data.totalQuantity}`, 25, yPos + 22)
  
  // Ingresos
  doc.setFillColor(...hexToRgb('#D1FAE5'))
  doc.roundedRect(20 + cardWidth + gap, yPos, cardWidth, cardHeight, 3, 3, 'F')
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...hexToRgb(COLORS.gray))
  doc.text('Ingresos Totales', 25 + cardWidth + gap, yPos + 10)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...hexToRgb(COLORS.green))
  doc.text(`€${data.totalRevenue.toFixed(2)}`, 25 + cardWidth + gap, yPos + 22)
  
  // Número de Ventas
  doc.setFillColor(...hexToRgb('#F3F4F6'))
  doc.roundedRect(20 + (cardWidth + gap) * 2, yPos, cardWidth, cardHeight, 3, 3, 'F')
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...hexToRgb(COLORS.gray))
  doc.text('Num. Ventas', 25 + (cardWidth + gap) * 2, yPos + 10)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...hexToRgb(COLORS.dark))
  doc.text(`${data.totalSales}`, 25 + (cardWidth + gap) * 2, yPos + 22)
  
  yPos += cardHeight + 15
  
  // Top Producto
  if (data.topProduct) {
    doc.setFillColor(...hexToRgb('#FEF3C7'))
    doc.roundedRect(20, yPos, 170, 25, 3, 3, 'F')
    doc.setFontSize(10)
    doc.setTextColor(...hexToRgb(COLORS.gray))
    doc.text('🏆 Producto Más Vendido', 25, yPos + 10)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...hexToRgb(COLORS.primary))
    doc.text(data.topProduct.name, 25, yPos + 20)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...hexToRgb(COLORS.green))
    doc.text(
      `${data.topProduct.quantity} uds · €${data.topProduct.revenue.toFixed(2)}`,
      180, yPos + 15, { align: 'right' }
    )
    yPos += 35
  }
  
  // Tabla de productos
  if (data.products.length > 0) {
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...hexToRgb(COLORS.dark))
    doc.text('Detalle por Producto', 20, yPos)
    yPos += 8
    
    const tableData = data.products.map((p, i) => [
      `${i + 1}`,
      p.name,
      `${p.quantity}`,
      `€${p.revenue.toFixed(2)}`,
      `${p.percentage.toFixed(1)}%`,
      `${p.revenuePercentage.toFixed(1)}%`
    ])
    
    autoTable(doc, {
      startY: yPos,
      head: [['#', 'Producto', 'Cantidad', 'Ingresos', '% Cant.', '% Ing.']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: hexToRgb(COLORS.primary),
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9
      },
      bodyStyles: {
        fontSize: 9
      },
      columnStyles: {
        0: { cellWidth: 15, halign: 'center' },
        1: { cellWidth: 60 },
        2: { cellWidth: 25, halign: 'right' },
        3: { cellWidth: 30, halign: 'right', fontStyle: 'bold' },
        4: { cellWidth: 20, halign: 'right' },
        5: { cellWidth: 20, halign: 'right' }
      },
      margin: { left: 20, right: 20 },
      didParseCell: (data) => {
        if (data.row.index === 0 && data.section === 'body') {
          data.cell.styles.fillColor = hexToRgb('#FEF3C7')
        }
      }
    })
  }
  
  addFooter(doc)
  doc.save(`rekalcula_analisis_ventas_${new Date().toISOString().split('T')[0]}.pdf`)
}

// ============================================================
// 4. PDF DE ASESOR IA
// ============================================================
interface Recomendacion {
  id: string
  titulo: string
  mensaje: string
  prioridad: number
  sector: string
  datosReales?: {
    ventas: number
    ingresos: number
    tendencia: number
  }
}

interface ConsejoAplicado extends Recomendacion {
  aplicadoEn: string
  periodoAnalisis: string
}

export const generateAdvisorPDF = (
  recomendaciones: Recomendacion[],
  consejosAplicados: ConsejoAplicado[],
  periodo: string,
  sector: string
) => {
  const doc = new jsPDF()
  
  const sectorLabels: Record<string, string> = {
    'cafeteria': 'Cafetería',
    'restaurante': 'Restaurante',
    'peluqueria': 'Peluquería',
    'taller_mecanico': 'Taller Mecánico',
    'carpinteria': 'Carpintería',
    'general': 'General'
  }
  
  const prioridadLabels: Record<number, string> = {
    1: 'Alta',
    2: 'Media',
    3: 'Baja'
  }
  
  const prioridadColors: Record<number, string> = {
    1: '#FEE2E2',
    2: '#FEF3C7',
    3: '#DBEAFE'
  }
  
  let yPos = addHeader(doc, 'Análisis del Asesor IA', `Sector: ${sectorLabels[sector] || sector}`)
  
  // Resumen
  doc.setFillColor(...hexToRgb('#F3F4F6'))
  doc.roundedRect(20, yPos, 170, 20, 3, 3, 'F')
  doc.setFontSize(10)
  doc.setTextColor(...hexToRgb(COLORS.dark))
  doc.text(`📊 ${recomendaciones.length} recomendaciones`, 30, yPos + 8)
  doc.text(`✓ ${consejosAplicados.length} consejos aplicados`, 30, yPos + 16)
  doc.text(`Período: ${periodo}`, 150, yPos + 12, { align: 'right' })
  
  yPos += 30
  
  // Recomendaciones actuales
  if (recomendaciones.length > 0) {
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...hexToRgb(COLORS.dark))
    doc.text('💡 Recomendaciones', 20, yPos)
    yPos += 10
    
    recomendaciones.forEach((rec, index) => {
      if (yPos > 250) {
        doc.addPage()
        yPos = 20
      }
      
      const bgColor = prioridadColors[rec.prioridad] || '#F3F4F6'
      
      doc.setFillColor(...hexToRgb(bgColor))
      doc.roundedRect(20, yPos, 170, 35, 3, 3, 'F')
      
      // Prioridad badge
      doc.setFontSize(8)
      doc.setTextColor(...hexToRgb(COLORS.gray))
      doc.text(`Prioridad: ${prioridadLabels[rec.prioridad] || 'Normal'}`, 25, yPos + 8)
      
      // Título
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...hexToRgb(COLORS.dark))
      doc.text(rec.titulo, 25, yPos + 18)
      
      // Mensaje (truncado si es muy largo)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...hexToRgb(COLORS.gray))
      const mensaje = rec.mensaje.length > 100 ? rec.mensaje.substring(0, 100) + '...' : rec.mensaje
      doc.text(mensaje, 25, yPos + 26, { maxWidth: 160 })
      
      // Datos
      if (rec.datosReales) {
        doc.setFontSize(8)
        doc.setTextColor(...hexToRgb(COLORS.green))
        doc.text(
          `Ventas: ${rec.datosReales.ventas} | Ingresos: €${rec.datosReales.ingresos?.toFixed(2) || '0.00'}`,
          180, yPos + 8, { align: 'right' }
        )
      }
      
      yPos += 40
    })
  }
  
  // Consejos aplicados
  if (consejosAplicados.length > 0) {
    if (yPos > 200) {
      doc.addPage()
      yPos = 20
    }
    
    yPos += 10
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...hexToRgb(COLORS.dark))
    doc.text('✓ Consejos Aplicados', 20, yPos)
    yPos += 10
    
    const tableData = consejosAplicados.map(c => [
      c.titulo,
      prioridadLabels[c.prioridad] || 'Normal',
      new Date(c.aplicadoEn).toLocaleDateString('es-ES'),
      `€${c.datosReales?.ingresos?.toFixed(2) || '0.00'}`
    ])
    
    autoTable(doc, {
      startY: yPos,
      head: [['Consejo', 'Prioridad', 'Aplicado', 'Impacto']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: hexToRgb(COLORS.green),
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9
      },
      bodyStyles: {
        fontSize: 9
      },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: 25 },
        2: { cellWidth: 30 },
        3: { cellWidth: 30, halign: 'right' }
      },
      margin: { left: 20, right: 20 }
    })
  }
  
  addFooter(doc)
  doc.save(`rekalcula_asesor_ia_${new Date().toISOString().split('T')[0]}.pdf`)
}
