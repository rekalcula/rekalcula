'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useUser } from '@clerk/nextjs'

const CONTRACT_VERSION = '1.0'

export default function TermsRequiredPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/dashboard'

  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false)
  const [isAccepting, setIsAccepting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const contractRef = useRef<HTMLDivElement>(null)

  // Detectar cuando el usuario llega al final del contrato
  useEffect(() => {
    const el = contractRef.current
    if (!el) return

    const handleScroll = () => {
      const threshold = 50 // px antes del final
      const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - threshold
      if (atBottom) setHasScrolledToBottom(true)
    }

    el.addEventListener('scroll', handleScroll)
    return () => el.removeEventListener('scroll', handleScroll)
  }, [])

  const handleAccept = async () => {
    if (!hasScrolledToBottom || isAccepting) return
    setIsAccepting(true)
    setError(null)

    try {
      const res = await fetch('/api/terms-acceptance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Solo enviamos la versión — el servidor obtiene el userId de auth()
        body: JSON.stringify({ contractVersion: CONTRACT_VERSION }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Error al registrar la aceptación')
      }

      // Redirigir al destino original
      router.push(redirectTo)
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Error inesperado. Inténtalo de nuevo.')
      setIsAccepting(false)
    }
  }

  if (!isLoaded) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
      </div>
    )
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>

        {/* Header */}
        <div style={styles.header}>
          <span style={styles.logo}>
            <span style={{ color: '#ffffff' }}>re</span>
            <span style={{ color: '#d98c21' }}>K</span>
            <span style={{ color: '#ffffff' }}>alcula</span>
          </span>
          <p style={styles.headerSubtitle}>
            Antes de continuar, debes leer y aceptar el contrato de uso
          </p>
        </div>

        {/* Aviso de lectura obligatoria */}
        <div style={styles.warningBanner}>
          <span style={styles.warningIcon}>⚠️</span>
          <span style={styles.warningText}>
            Lee el contrato completo hasta el final para poder aceptarlo.
            Este documento tiene validez legal.
          </span>
        </div>

        {/* Contrato — área scrollable */}
        <div ref={contractRef} style={styles.contractScroll}>
          <div style={styles.contractContent}>

            <h1 style={styles.contractTitle}>reKalcula</h1>
            <p style={styles.contractSubtitle}><em>Plataforma de Gestión Económica y Fiscal</em></p>
            <h2 style={styles.contractMainTitle}>CONTRATO DE DESCARGO DE RESPONSABILIDAD Y CONDICIONES DE USO DE LA PLATAFORMA</h2>
            <p style={styles.contractVersion}><em>Versión 1.0 — Febrero 2026</em></p>

            <h3 style={styles.sectionTitle}>PREÁMBULO</h3>
            <p style={styles.paragraph}>
              El presente documento constituye un acuerdo legalmente vinculante entre el usuario (en adelante,{' '}
              <strong>"el Usuario"</strong>) y la plataforma reKalcula (en adelante, <strong>"reKalcula"</strong> o{' '}
              <strong>"la Plataforma"</strong>). Al acceder, registrarse o utilizar cualquiera de los servicios
              ofrecidos por reKalcula, el Usuario acepta íntegramente las condiciones aquí establecidas.
            </p>
            <p style={{ ...styles.paragraph, fontWeight: 600, fontStyle: 'italic' }}>
              Es imprescindible que el Usuario lea detenidamente este documento antes de utilizar la Plataforma.
            </p>

            <h3 style={styles.sectionTitle}>CLÁUSULA 1 — NATURALEZA DEL SERVICIO</h3>
            <p style={styles.paragraph}>
              <strong>1.1.</strong> reKalcula es una herramienta tecnológica de apoyo a la gestión económica y fiscal
              dirigida a autónomos y pequeñas empresas en España. La Plataforma proporciona funcionalidades de registro
              de facturas, análisis de ventas, gestión de costes, previsiones de tesorería y recomendaciones basadas
              en inteligencia artificial.
            </p>
            <p style={styles.paragraph}>
              <strong>1.2.</strong> reKalcula <strong>NO es una asesoría fiscal, contable ni jurídica</strong>. Los
              cálculos, análisis, estimaciones y recomendaciones generados por la Plataforma tienen carácter
              exclusivamente informativo y orientativo.
            </p>
            <p style={styles.paragraph}>
              <strong>1.3.</strong> La Plataforma utiliza modelos de inteligencia artificial para el análisis de datos
              y la generación de recomendaciones. Estos modelos pueden contener errores, imprecisiones o limitaciones
              inherentes a la tecnología empleada.
            </p>

            <h3 style={styles.sectionTitle}>CLÁUSULA 2 — RESPONSABILIDAD DEL USUARIO</h3>
            <p style={styles.paragraph}>
              <strong>2.1.</strong> <strong>El Usuario es el único y exclusivo responsable de todas las decisiones
              económicas, fiscales, financieras y empresariales que adopte</strong>, con independencia de que dichas
              decisiones se hayan tomado con base en información, cálculos o recomendaciones proporcionados por la
              Plataforma.
            </p>
            <p style={styles.paragraph}><strong>2.2.</strong> El Usuario se compromete a:</p>
            <ul style={styles.list}>
              <li style={styles.listItem}>Verificar de forma independiente toda la información proporcionada por reKalcula antes de tomar cualquier decisión.</li>
              <li style={styles.listItem}>Consultar con un profesional cualificado (asesor fiscal, contable o abogado) cuando la situación lo requiera, especialmente en materias de índole fiscal o legal.</li>
              <li style={styles.listItem}>Introducir datos veraces, completos y actualizados en la Plataforma, asumiendo la responsabilidad derivada de cualquier error u omisión en los datos introducidos.</li>
              <li style={styles.listItem}>Mantener actualizada su información fiscal y empresarial dentro de la Plataforma.</li>
            </ul>
            <p style={styles.paragraph}>
              <strong>2.3.</strong> El Usuario reconoce que la normativa fiscal y contable española está sujeta a
              cambios frecuentes y que reKalcula, pese a sus esfuerzos por mantenerse actualizada, puede no reflejar
              en todo momento las últimas modificaciones legislativas o interpretaciones administrativas.
            </p>

            <h3 style={styles.sectionTitle}>CLÁUSULA 3 — EXONERACIÓN DE RESPONSABILIDAD DE reKalcula</h3>
            <p style={styles.paragraph}><strong>3.1.</strong> reKalcula queda expresamente exonerada de cualquier responsabilidad derivada de:</p>
            <ul style={styles.list}>
              <li style={styles.listItem}>Decisiones tomadas por el Usuario basándose en la información, cálculos, análisis, previsiones o recomendaciones generados por la Plataforma.</li>
              <li style={styles.listItem}>Errores, inexactitudes o imprecisiones en los cálculos fiscales, contables o financieros, incluyendo pero no limitados a: cálculos de IVA, IRPF, Impuesto sobre Sociedades, retenciones, pagos fraccionados y cualquier otro tributo.</li>
              <li style={styles.listItem}>Pérdidas económicas, sanciones, recargos, intereses de demora o cualquier perjuicio patrimonial que el Usuario pueda sufrir como consecuencia directa o indirecta del uso de la Plataforma.</li>
              <li style={styles.listItem}>Recomendaciones generadas por el módulo de inteligencia artificial, incluyendo análisis de coste de oportunidad, previsiones de tesorería, alertas financieras y cualquier otra sugerencia automatizada.</li>
              <li style={styles.listItem}>Interrupciones del servicio, fallos técnicos, pérdida de datos o cualquier incidencia tecnológica que afecte al funcionamiento de la Plataforma.</li>
              <li style={styles.listItem}>Cambios normativos que no hayan sido incorporados a la Plataforma en el momento de su entrada en vigor.</li>
              <li style={styles.listItem}>La interpretación o aplicación incorrecta por parte del Usuario de la información proporcionada por reKalcula.</li>
            </ul>
            <p style={styles.paragraph}>
              <strong>3.2.</strong> En ningún caso la responsabilidad total de reKalcula frente al Usuario, por
              cualquier concepto, podrá exceder del importe total abonado por el Usuario en concepto de suscripción
              durante los doce (12) meses anteriores al hecho causante de la reclamación.
            </p>

            <h3 style={styles.sectionTitle}>CLÁUSULA 4 — LIMITACIONES DE LA INTELIGENCIA ARTIFICIAL</h3>
            <p style={styles.paragraph}><strong>4.1.</strong> El Usuario reconoce y acepta que los módulos de inteligencia artificial integrados en reKalcula:</p>
            <ul style={styles.list}>
              <li style={styles.listItem}>Generan estimaciones y no certezas. Toda cifra o recomendación producida por la IA debe considerarse como una orientación aproximada.</li>
              <li style={styles.listItem}>Pueden producir resultados erróneos o sesgados en función de la calidad y cantidad de datos proporcionados por el Usuario.</li>
              <li style={styles.listItem}>No sustituyen el criterio profesional de un asesor fiscal, contable o financiero cualificado.</li>
              <li style={styles.listItem}>Operan con modelos estadísticos que, por su naturaleza, están sujetos a márgenes de error.</li>
              <li style={styles.listItem}>Las previsiones de tesorería y análisis de coste de oportunidad son herramientas de reflexión, no garantías de resultado.</li>
            </ul>

            <h3 style={styles.sectionTitle}>CLÁUSULA 5 — DATOS FISCALES Y OBLIGACIONES TRIBUTARIAS</h3>
            <p style={styles.paragraph}>
              <strong>5.1.</strong> reKalcula facilita herramientas de cálculo fiscal orientativo. No obstante, el
              cumplimiento de las obligaciones tributarias (presentación de modelos, pago de impuestos, liquidaciones
              trimestrales y anuales) es <strong>responsabilidad exclusiva del Usuario</strong>.
            </p>
            <p style={styles.paragraph}>
              <strong>5.2.</strong> reKalcula no actúa como representante fiscal del Usuario ante la Agencia Estatal
              de Administración Tributaria (AEAT) ni ante ningún otro organismo público.
            </p>
            <p style={styles.paragraph}>
              <strong>5.3.</strong> Los cálculos de IVA, IRPF, retenciones y demás conceptos fiscales realizados por
              la Plataforma son aproximaciones basadas en la información disponible y las reglas fiscales generales.
              Pueden existir circunstancias específicas del Usuario (regímenes especiales, exenciones,
              bonificaciones, etc.) que la Plataforma no contemple.
            </p>

            <h3 style={styles.sectionTitle}>CLÁUSULA 6 — PROTECCIÓN DE DATOS</h3>
            <p style={styles.paragraph}>
              <strong>6.1.</strong> reKalcula se compromete a tratar los datos personales y empresariales del Usuario
              conforme al Reglamento General de Protección de Datos (RGPD) y a la Ley Orgánica 3/2018, de 5 de
              diciembre, de Protección de Datos Personales y garantía de los derechos digitales (LOPDGDD).
            </p>
            <p style={styles.paragraph}>
              <strong>6.2.</strong> El Usuario es responsable de la veracidad y licitud de los datos que introduce en
              la Plataforma, incluyendo datos de terceros (proveedores, clientes, empleados). reKalcula no asumirá
              responsabilidad alguna por el tratamiento de datos de terceros introducidos por el Usuario sin el
              consentimiento o base legal adecuada.
            </p>

            <h3 style={styles.sectionTitle}>CLÁUSULA 7 — DISPONIBILIDAD Y CONTINUIDAD DEL SERVICIO</h3>
            <p style={styles.paragraph}>
              <strong>7.1.</strong> reKalcula realizará sus mejores esfuerzos para garantizar la disponibilidad
              continua de la Plataforma, pero no garantiza un funcionamiento ininterrumpido ni libre de errores.
            </p>
            <p style={styles.paragraph}>
              <strong>7.2.</strong> reKalcula se reserva el derecho de suspender, modificar o descontinuar cualquier
              funcionalidad de la Plataforma, con el preaviso razonable que las circunstancias permitan.
            </p>

            <h3 style={styles.sectionTitle}>CLÁUSULA 8 — MODIFICACIONES DEL CONTRATO</h3>
            <p style={styles.paragraph}>
              <strong>8.1.</strong> reKalcula podrá modificar los términos del presente contrato en cualquier
              momento. Las modificaciones serán comunicadas al Usuario a través de la Plataforma o por correo
              electrónico con una antelación mínima de quince (15) días naturales.
            </p>
            <p style={styles.paragraph}>
              <strong>8.2.</strong> El uso continuado de la Plataforma tras la entrada en vigor de las
              modificaciones implicará la aceptación de las nuevas condiciones por parte del Usuario.
            </p>

            <h3 style={styles.sectionTitle}>CLÁUSULA 9 — LEGISLACIÓN APLICABLE Y JURISDICCIÓN</h3>
            <p style={styles.paragraph}>
              <strong>9.1.</strong> El presente contrato se regirá e interpretará conforme a la legislación española
              vigente.
            </p>
            <p style={styles.paragraph}>
              <strong>9.2.</strong> Para cualquier controversia derivada del presente contrato, ambas partes se
              someten a la jurisdicción de los Juzgados y Tribunales del domicilio del Usuario, conforme a la
              normativa de consumidores y usuarios aplicable.
            </p>

            <h3 style={styles.sectionTitle}>CLÁUSULA 10 — ACEPTACIÓN</h3>
            <p style={styles.paragraph}>
              <strong>10.1.</strong> Al pulsar el botón <strong>"Acepto las condiciones de uso"</strong> o al acceder
              y utilizar los servicios de reKalcula, el Usuario declara:
            </p>
            <ul style={styles.list}>
              <li style={styles.listItem}>Haber leído y comprendido íntegramente el presente documento.</li>
              <li style={styles.listItem}>Aceptar de forma libre, voluntaria e informada todas las cláusulas contenidas en el mismo.</li>
              <li style={styles.listItem}>Ser consciente de que reKalcula es una herramienta de apoyo y no un servicio de asesoría profesional.</li>
              <li style={styles.listItem}>Asumir la plena responsabilidad sobre las decisiones económicas, fiscales y empresariales que adopte.</li>
            </ul>

            {/* Resumen informativo */}
            <div style={styles.summaryBox}>
              <p style={styles.summaryTitle}><strong>RESUMEN INFORMATIVO PARA EL USUARIO</strong></p>
              <p style={styles.summaryNote}><em>(Este resumen no sustituye al contenido completo del contrato)</em></p>
              <p style={styles.summaryItem}>✅ reKalcula te ayuda a entender tu dinero, tus impuestos y tu negocio.</p>
              <p style={styles.summaryItem}>✅ Los cálculos y recomendaciones son orientativos, nunca definitivos.</p>
              <p style={styles.summaryItem}>✅ Tú eres quien toma las decisiones y quien responde por ellas.</p>
              <p style={styles.summaryItem}>✅ Si tienes dudas fiscales o legales, consulta siempre con un profesional.</p>
              <p style={styles.summaryItem}>✅ La inteligencia artificial te sugiere, pero no decide por ti.</p>
              <p style={styles.summaryItem}>✅ Tus datos están protegidos conforme a la normativa europea y española.</p>
            </div>

            <p style={styles.contractFooter}>© 2026 reKalcula. Todos los derechos reservados.</p>
            <p style={styles.contractFooter}><em>Documento generado el 14 de febrero de 2026</em></p>

          </div>
        </div>

        {/* Footer con botón de aceptación */}
        <div style={styles.footer}>
          {!hasScrolledToBottom && (
            <p style={styles.scrollHint}>
              👆 Desplázate hasta el final del contrato para activar el botón de aceptación
            </p>
          )}

          {error && (
            <p style={styles.errorText}>⚠️ {error}</p>
          )}

          <div style={styles.footerButtons}>
            <button
              onClick={handleAccept}
              disabled={!hasScrolledToBottom || isAccepting}
              style={{
                ...styles.acceptButton,
                ...(!hasScrolledToBottom || isAccepting ? styles.acceptButtonDisabled : {})
              }}
            >
              {isAccepting ? 'Registrando aceptación...' : '✓ Acepto las condiciones de uso'}
            </button>
          </div>

          <p style={styles.legalNote}>
            Al aceptar, quedará registro de tu aceptación con fecha, hora e identificador de sesión.
            Esta acción tiene validez legal conforme a la normativa española vigente.
          </p>
        </div>

      </div>
    </div>
  )
}

// ============================================================
// Estilos inline (sin dependencia de Tailwind para garantizar
// que esta página crítica siempre se renderiza correctamente)
// ============================================================
const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.85)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '16px',
  },
  modal: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    width: '100%',
    maxWidth: '720px',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
  },
  header: {
    backgroundColor: '#1a1a1a',
    padding: '24px 32px 20px',
    textAlign: 'center',
    flexShrink: 0,
  },
  logo: {
    fontSize: '36px',
    fontWeight: 800,
    letterSpacing: '-1px',
    display: 'block',
    marginBottom: '8px',
  },
  headerSubtitle: {
    color: '#9ca3af',
    fontSize: '13px',
    margin: 0,
  },
  warningBanner: {
    backgroundColor: '#fffbeb',
    borderBottom: '1px solid #fcd34d',
    padding: '12px 24px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexShrink: 0,
  },
  warningIcon: {
    fontSize: '18px',
    flexShrink: 0,
  },
  warningText: {
    fontSize: '13px',
    color: '#92400e',
    lineHeight: 1.4,
  },
  contractScroll: {
    overflowY: 'auto',
    flex: 1,
    padding: '0',
  },
  contractContent: {
    padding: '28px 36px 24px',
    fontSize: '14px',
    lineHeight: 1.7,
    color: '#1f2937',
  },
  contractTitle: {
    fontSize: '22px',
    fontWeight: 700,
    textAlign: 'center',
    margin: '0 0 4px',
    color: '#111827',
  },
  contractSubtitle: {
    textAlign: 'center',
    color: '#6b7280',
    margin: '0 0 16px',
  },
  contractMainTitle: {
    fontSize: '15px',
    fontWeight: 700,
    textAlign: 'center',
    margin: '0 0 4px',
    color: '#111827',
  },
  contractVersion: {
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: '13px',
    margin: '0 0 28px',
  },
  sectionTitle: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#d98c21',
    marginTop: '24px',
    marginBottom: '10px',
    paddingBottom: '4px',
    borderBottom: '1px solid #fef3c7',
  },
  paragraph: {
    margin: '0 0 12px',
    color: '#374151',
  },
  list: {
    margin: '0 0 12px',
    paddingLeft: '20px',
  },
  listItem: {
    marginBottom: '8px',
    color: '#374151',
  },
  summaryBox: {
    backgroundColor: '#f0fdf4',
    border: '1px solid #bbf7d0',
    borderRadius: '8px',
    padding: '16px 20px',
    marginTop: '24px',
    marginBottom: '16px',
  },
  summaryTitle: {
    margin: '0 0 4px',
    color: '#166534',
    fontSize: '13px',
  },
  summaryNote: {
    margin: '0 0 10px',
    color: '#6b7280',
    fontSize: '12px',
  },
  summaryItem: {
    margin: '4px 0',
    color: '#15803d',
    fontSize: '13px',
  },
  contractFooter: {
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: '12px',
    margin: '4px 0',
  },
  footer: {
    padding: '16px 32px 20px',
    borderTop: '1px solid #e5e7eb',
    backgroundColor: '#f9fafb',
    flexShrink: 0,
  },
  scrollHint: {
    textAlign: 'center',
    color: '#6b7280',
    fontSize: '13px',
    marginBottom: '12px',
    margin: '0 0 12px',
  },
  errorText: {
    color: '#dc2626',
    fontSize: '13px',
    textAlign: 'center',
    margin: '0 0 10px',
  },
  footerButtons: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '12px',
  },
  acceptButton: {
    backgroundColor: '#d98c21',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    padding: '14px 36px',
    fontSize: '15px',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    minWidth: '280px',
  },
  acceptButtonDisabled: {
    backgroundColor: '#d1d5db',
    color: '#9ca3af',
    cursor: 'not-allowed',
  },
  legalNote: {
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: '11px',
    lineHeight: 1.5,
    margin: 0,
  },
  loadingContainer: {
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f4f4f5',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #e5e7eb',
    borderTop: '4px solid #d98c21',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
}