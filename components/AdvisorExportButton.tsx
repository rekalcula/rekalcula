'use client'

import ExportPDFButton from '@/components/ExportPDFButton'
import { generateAdvisorPDF } from '@/lib/pdf-generator'

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

interface Props {
  recomendaciones: Recomendacion[]
  consejosAplicados: ConsejoAplicado[]
  periodo: string
  sector: string
}

export default function AdvisorExportButton({ 
  recomendaciones, 
  consejosAplicados, 
  periodo, 
  sector 
}: Props) {
  const handleExport = () => {
    generateAdvisorPDF(recomendaciones, consejosAplicados, periodo, sector)
  }

  if (recomendaciones.length === 0 && consejosAplicados.length === 0) return null

  return (
    <ExportPDFButton 
      onClick={handleExport} 
      label="Exportar PDF"
    />
  )
}
