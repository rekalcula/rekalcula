'use client'

import SalesAnalyticsChart from '@/components/SalesAnalyticsChart'
import SalesAnalysisWithHours from '@/components/SalesAnalysisWithHours'

export default function SalesAnalyticsPage() {
  return (
    <div className="min-h-screen bg-[#fefcf5] p-6 space-y-8">
      {/* ============================================ */}
      {/* ANÁLISIS DE PRODUCTOS (ORIGINAL) */}
      {/* ============================================ */}
      {/* 
        - Gráficos de barras por producto
        - Tabla detallada de productos
        - Métricas: Total Productos, Ingresos, Ventas
        - Filtros: Período (Todo/Día/Semana/Mes)
        - Botón: Exportar PDF
      */}
      <SalesAnalyticsChart />

      {/* ============================================ */}
      {/* ANÁLISIS DE OPORTUNIDADES (NUEVO) */}
      {/* ============================================ */}
      {/* 
        - Sistema de horarios comerciales
        - Análisis hora por hora
        - Análisis día por día
        - Recomendaciones de optimización
        - Filtrado por día de la semana
      */}
      <SalesAnalysisWithHours />
    </div>
  )
}