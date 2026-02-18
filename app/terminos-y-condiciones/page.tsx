'use client'

// app/terminos-y-condiciones/page.tsx

import { useState } from 'react'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Header con branding */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            re<span className="text-orange-500">K</span>alcula
          </h1>
          <div className="h-1 w-20 bg-orange-500 rounded"></div>
        </div>

        {/* Contenedor principal */}
        <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg shadow-xl p-8">
          <article className="prose prose-lg prose-invert max-w-none">
            
            <h1 className="text-3xl font-bold text-white mb-2">
              Términos y Condiciones de Uso de Rekalcula
            </h1>
            <p className="text-sm text-gray-400 mb-8">
              <strong>Última actualización: 19 de enero de 2026</strong>
            </p>
            
            <hr className="border-gray-700 my-8" />
            
            {/* Sección 1 */}
            <h2 className="text-2xl font-semibold text-orange-500 mt-8 mb-4">
              1. ACEPTACIÓN DE LOS TÉRMINOS
            </h2>
            <p className="text-gray-300 mb-4 leading-relaxed">
              Al registrarse y utilizar Rekalcula (en adelante, "la Plataforma"), 
              el usuario (en adelante, "el Usuario") acepta expresamente y sin reservas 
              estos Términos y Condiciones, así como la Política de Privacidad de la Plataforma.
            </p>
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4 mb-4">
              <p className="text-orange-400 font-semibold mb-0">
                ⚠️ La aceptación de estos términos es condición indispensable para acceder y usar la Plataforma.
              </p>
            </div>
            
            <hr className="border-gray-700 my-8" />
            
            {/* Sección 2 */}
            <h2 className="text-2xl font-semibold text-orange-500 mt-8 mb-4">
              2. IDENTIFICACIÓN DEL PRESTADOR DEL SERVICIO
            </h2>
            <div className="bg-[#2a2a2a] rounded-lg p-4 mb-4">
              <p className="text-gray-300 mb-2"><strong className="text-white">Denominación social:</strong> [Nombre de la empresa titular de Rekalcula]</p>
              <p className="text-gray-300 mb-2"><strong className="text-white">NIF/CIF:</strong> [Número de identificación fiscal]</p>
              <p className="text-gray-300 mb-2"><strong className="text-white">Domicilio social:</strong> [Dirección completa]</p>
              <p className="text-gray-300 mb-2"><strong className="text-white">Correo electrónico:</strong> [email de contacto]</p>
              <p className="text-gray-300 mb-0"><strong className="text-white">Datos registrales:</strong> [Registro Mercantil, si aplica]</p>
            </div>
            <p className="text-gray-300 mb-4">Este servicio se presta conforme a la legislación española vigente.</p>
            
            <hr className="border-gray-700 my-8" />
            
            {/* Sección 3 */}
            <h2 className="text-2xl font-semibold text-orange-500 mt-8 mb-4">
              3. OBJETO Y NATURALEZA DEL SERVICIO
            </h2>
            <h3 className="text-xl font-semibold text-white mt-6 mb-3">3.1 Definición del servicio</h3>
            <p className="text-gray-300 mb-4 leading-relaxed">
              Rekalcula es una <strong className="text-white">herramienta de gestión económica y fiscal automatizada</strong> que 
              proporciona funcionalidades de cálculo, registro contable, análisis de flujos de caja y 
              generación de informes orientados a pequeñas empresas, autónomos y sociedades en España.
            </p>
            <h3 className="text-xl font-semibold text-white mt-6 mb-3">3.2 Naturaleza del servicio</h3>
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                <p className="text-red-400 font-semibold mb-3">❌ Rekalcula NO es:</p>
                <ul className="space-y-2 text-gray-300">
                  <li className="flex items-start"><span className="mr-2">•</span><span>Un asesor fiscal, contable o financiero profesional</span></li>
                  <li className="flex items-start"><span className="mr-2">•</span><span>Un servicio de asesoría personalizada</span></li>
                  <li className="flex items-start"><span className="mr-2">•</span><span>Un sustituto del asesoramiento profesional</span></li>
                  <li className="flex items-start"><span className="mr-2">•</span><span>Un servicio que garantice el cumplimiento tributario</span></li>
                </ul>
              </div>
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                <p className="text-green-400 font-semibold mb-3">✅ Rekalcula es:</p>
                <ul className="space-y-2 text-gray-300">
                  <li className="flex items-start"><span className="mr-2">•</span><span>Una <strong className="text-white">herramienta de apoyo</strong> a la gestión</span></li>
                  <li className="flex items-start"><span className="mr-2">•</span><span>Un <strong className="text-white">sistema automatizado</strong> basado en algoritmos</span></li>
                  <li className="flex items-start"><span className="mr-2">•</span><span>Un <strong className="text-white">recurso informativo</strong> para organización de datos</span></li>
                </ul>
              </div>
            </div>
            
            <hr className="border-gray-700 my-8" />
            
            {/* Sección 4 */}
            <h2 className="text-2xl font-semibold text-orange-500 mt-8 mb-4">
              4. EXENCIÓN DE RESPONSABILIDAD (DISCLAIMER)
            </h2>
            <h3 className="text-xl font-semibold text-white mt-6 mb-3">4.1 Responsabilidad sobre la información</h3>
            <p className="text-gray-300 mb-4">El Usuario reconoce y acepta expresamente que:</p>
            <div className="space-y-4 mb-6">
              <div className="bg-[#2a2a2a] border-l-4 border-orange-500 p-4 rounded">
                <p className="text-white font-semibold mb-2">1. Carácter informativo</p>
                <p className="text-gray-300 mb-0">
                  Los cálculos, proyecciones, informes y recomendaciones generados por Rekalcula tienen 
                  carácter <strong className="text-orange-400">meramente informativo y orientativo</strong>.
                </p>
              </div>
              <div className="bg-[#2a2a2a] border-l-4 border-orange-500 p-4 rounded">
                <p className="text-white font-semibold mb-2">2. Responsabilidad del usuario</p>
                <p className="text-gray-300 mb-0">
                  La responsabilidad final sobre cualquier decisión económica, fiscal o financiera corresponde 
                  <strong className="text-orange-400"> única y exclusivamente al Usuario</strong>.
                </p>
              </div>
              <div className="bg-[#2a2a2a] border-l-4 border-red-500 p-4 rounded">
                <p className="text-white font-semibold mb-2">3. Exclusión de responsabilidad</p>
                <p className="text-gray-300 mb-3">Rekalcula no se responsabiliza de:</p>
                <ul className="space-y-2 text-gray-300">
                  <li className="flex items-start"><span className="text-red-400 mr-2">→</span><span>Errores derivados de datos incorrectos introducidos por el Usuario</span></li>
                  <li className="flex items-start"><span className="text-red-400 mr-2">→</span><span>Cambios normativos posteriores a la actualización</span></li>
                  <li className="flex items-start"><span className="text-red-400 mr-2">→</span><span>Diferencias con interpretaciones de la Agencia Tributaria</span></li>
                  <li className="flex items-start"><span className="text-red-400 mr-2">→</span><span>Daños indirectos o lucro cesante</span></li>
                </ul>
              </div>
            </div>
            
            <h3 className="text-xl font-semibold text-white mt-6 mb-3">4.2 Recomendación de asesoramiento profesional</h3>
            <div className="bg-gradient-to-r from-orange-500/20 to-yellow-500/20 border border-orange-500/50 rounded-lg p-6 mb-6">
              <p className="text-orange-400 font-bold text-lg mb-2">⚠️ IMPORTANTE</p>
              <p className="text-white font-semibold mb-0">
                SE RECOMIENDA EXPRESAMENTE AL USUARIO que consulte con un asesor fiscal, gestor contable 
                o profesional cualificado antes de tomar decisiones basadas en la información proporcionada 
                por Rekalcula.
              </p>
            </div>
            <p className="text-gray-300 mb-4">
              La Plataforma no sustituye el criterio profesional de un experto en materia fiscal, 
              contable o financiera.
            </p>
            
            <h3 className="text-xl font-semibold text-white mt-6 mb-3">4.3 Exclusión de garantías</h3>
            <div className="bg-[#2a2a2a] rounded-lg p-4 mb-4">
              <p className="text-white font-semibold mb-3">Rekalcula no garantiza:</p>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-start"><span className="text-orange-500 mr-2">•</span><span>La ausencia de errores en los cálculos o algoritmos</span></li>
                <li className="flex items-start"><span className="text-orange-500 mr-2">•</span><span>La actualización permanente de la normativa fiscal</span></li>
                <li className="flex items-start"><span className="text-orange-500 mr-2">•</span><span>La compatibilidad con todos los supuestos fiscales</span></li>
                <li className="flex items-start"><span className="text-orange-500 mr-2">•</span><span>Resultados específicos de ahorro fiscal</span></li>
              </ul>
            </div>
            
            <h3 className="text-xl font-semibold text-white mt-6 mb-3">4.4 Limitación de responsabilidad</h3>
            <p className="text-gray-300 mb-4">
              En ningún caso la responsabilidad de Rekalcula superará el importe total abonado por el Usuario 
              durante los 12 meses anteriores al hecho que genere la reclamación.
            </p>
            
            <hr className="border-gray-700 my-8" />
            
            {/* Sección 5 */}
            <h2 className="text-2xl font-semibold text-orange-500 mt-8 mb-4">
              5. OBLIGACIONES DEL USUARIO
            </h2>
            <h3 className="text-xl font-semibold text-white mt-6 mb-3">5.1 Veracidad y exactitud de los datos</h3>
            <p className="text-gray-300 mb-3">El Usuario se compromete a:</p>
            <div className="grid md:grid-cols-2 gap-3 mb-6">
              <div className="bg-blue-500/10 border border-blue-500/30 rounded p-3"><p className="text-blue-400 font-medium mb-0">✓ Introducir información veraz y exacta</p></div>
              <div className="bg-blue-500/10 border border-blue-500/30 rounded p-3"><p className="text-blue-400 font-medium mb-0">✓ Revisar periódicamente los datos</p></div>
              <div className="bg-blue-500/10 border border-blue-500/30 rounded p-3"><p className="text-blue-400 font-medium mb-0">✓ No usar como único soporte fiscal</p></div>
              <div className="bg-blue-500/10 border border-blue-500/30 rounded p-3"><p className="text-blue-400 font-medium mb-0">✓ Conservar documentación original</p></div>
            </div>
            
            <h3 className="text-xl font-semibold text-white mt-6 mb-3">5.2 Uso responsable</h3>
            <div className="bg-[#2a2a2a] rounded-lg p-4 mb-4">
              <p className="text-white font-semibold mb-3">El Usuario se compromete a:</p>
              <ul className="space-y-2 text-gray-300">
                <li>• Usar la Plataforma conforme a la legalidad vigente</li>
                <li>• No intentar alterar o manipular el sistema</li>
                <li>• No utilizar para fines fraudulentos o ilícitos</li>
                <li>• Mantener la confidencialidad de credenciales</li>
              </ul>
            </div>
            
            <hr className="border-gray-700 my-8" />
            
            {/* Declaración final */}
            <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 border-2 border-orange-500 rounded-lg p-6 my-8">
              <h2 className="text-2xl font-bold text-white mb-4">
                📋 DECLARACIÓN FINAL DE ACEPTACIÓN
              </h2>
              <p className="text-orange-400 font-semibold mb-4">
                AL MARCAR LA CASILLA DE ACEPTACIÓN Y COMPLETAR EL REGISTRO, EL USUARIO DECLARA:
              </p>
              <div className="space-y-3">
                <div className="flex items-start"><span className="text-green-400 font-bold mr-3 text-lg">1.</span><p className="text-gray-200 mb-0">Haber leído, comprendido y aceptado estos Términos y Condiciones</p></div>
                <div className="flex items-start"><span className="text-green-400 font-bold mr-3 text-lg">2.</span><p className="text-gray-200 mb-0">Ser mayor de edad o contar con autorización legal</p></div>
                <div className="flex items-start"><span className="text-green-400 font-bold mr-3 text-lg">3.</span><p className="text-gray-200 mb-0">Comprender que Rekalcula es una herramienta de apoyo, no un asesor profesional</p></div>
                <div className="flex items-start"><span className="text-green-400 font-bold mr-3 text-lg">4.</span><p className="text-gray-200 mb-0">Asumir la responsabilidad exclusiva de las decisiones adoptadas</p></div>
                <div className="flex items-start"><span className="text-green-400 font-bold mr-3 text-lg">5.</span><p className="text-gray-200 mb-0">Reconocer la recomendación de consultar con profesionales</p></div>
              </div>
            </div>
            
            <hr className="border-gray-700 my-8" />
            
            <p className="text-center text-gray-400 mt-8 mb-0">
              <strong>Fecha de última actualización: 19 de enero de 2026</strong>
            </p>
            
          </article>
        </div>

        {/* ============================================================
            CONTRATO DE DESCARGO — Sección expandible añadida
        ============================================================ */}
        <ContractSection />
        
        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-gray-500 text-sm">
            © 2026 Rekalcula - Todos los derechos reservados
          </p>
        </div>
        
      </div>
    </div>
  )
}

// ============================================================
// Componente: Contrato de Descargo de Responsabilidad
// ============================================================
function ContractSection() {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="mt-6 bg-[#1a1a1a] border border-gray-800 rounded-lg shadow-xl p-8">

      {/* Cabecera */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">
            Contrato de Descargo de Responsabilidad
          </h2>
          <p className="text-sm text-gray-400">
            Versión 1.0 — Febrero 2026 ·{' '}
            <span className="text-orange-400 font-medium">Documento con validez legal vinculante</span>
          </p>
        </div>
        <span className="text-3xl ml-4 flex-shrink-0">📄</span>
      </div>

      {/* Preview siempre visible */}
      <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4 mb-6">
        <p className="text-orange-400 font-semibold mb-2">⚠️ Documento legalmente vinculante</p>
        <p className="text-gray-300 text-sm leading-relaxed mb-0">
          El presente contrato constituye un acuerdo legalmente vinculante entre el Usuario y reKalcula.
          Al utilizar la Plataforma, el Usuario acepta íntegramente las condiciones aquí establecidas.{' '}
          <strong className="text-white">
            Es imprescindible leer este documento en su totalidad antes de utilizar la Plataforma.
          </strong>
        </p>
      </div>

      {/* Botón expandir/contraer */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 border border-[#d98c21] text-[#d98c21] hover:bg-[#d98c21]/10 rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors"
      >
        <span>{expanded ? '▲' : '▼'}</span>
        {expanded ? 'Ocultar contrato completo' : 'Leer contrato completo'}
      </button>

      {/* Contrato completo expandible */}
      {expanded && (
        <div className="mt-6 border-t border-gray-700 pt-6 text-sm leading-7 text-gray-300">

          {/* Encabezado del documento */}
          <div className="text-center mb-8">
            <p className="text-2xl font-bold text-white mb-1">
              re<span className="text-[#d98c21]">K</span>alcula
            </p>
            <p className="text-gray-400 italic mb-3">Plataforma de Gestión Económica y Fiscal</p>
            <p className="text-base font-bold text-white mb-1 uppercase tracking-wide">
              Contrato de Descargo de Responsabilidad
            </p>
            <p className="text-base font-bold text-white mb-3 uppercase tracking-wide">
              y Condiciones de Uso de la Plataforma
            </p>
            <p className="text-gray-400 italic text-xs">Versión 1.0 — Febrero 2026</p>
          </div>

          <hr className="border-gray-700 my-6" />

          {/* PREÁMBULO */}
          <h3 className="text-[#d98c21] font-bold uppercase tracking-widest text-xs mb-3 mt-6">
            Preámbulo
          </h3>
          <p className="mb-3">
            El presente documento constituye un acuerdo legalmente vinculante entre el usuario (en adelante,{' '}
            <strong className="text-white">"el Usuario"</strong>) y la plataforma reKalcula (en adelante,{' '}
            <strong className="text-white">"reKalcula"</strong> o <strong className="text-white">"la Plataforma"</strong>).
            Al acceder, registrarse o utilizar cualquiera de los servicios ofrecidos por reKalcula, el Usuario
            acepta íntegramente las condiciones aquí establecidas.
          </p>
          <p className="text-[#f59e0b] font-semibold italic mb-3">
            Es imprescindible que el Usuario lea detenidamente este documento antes de utilizar la Plataforma.
          </p>

          {/* CLÁUSULA 1 */}
          <h3 className="text-[#d98c21] font-bold uppercase tracking-widest text-xs mb-3 mt-8 border-b border-gray-700 pb-2">
            Cláusula 1 — Naturaleza del Servicio
          </h3>
          <p className="mb-3">
            <strong className="text-white">1.1.</strong> reKalcula es una herramienta tecnológica de apoyo a la
            gestión económica y fiscal dirigida a autónomos y pequeñas empresas en España. La Plataforma
            proporciona funcionalidades de registro de facturas, análisis de ventas, gestión de costes,
            previsiones de tesorería y recomendaciones basadas en inteligencia artificial.
          </p>
          <p className="mb-3">
            <strong className="text-white">1.2.</strong> reKalcula{' '}
            <strong className="text-red-400">NO es una asesoría fiscal, contable ni jurídica</strong>. Los cálculos,
            análisis, estimaciones y recomendaciones tienen carácter exclusivamente informativo y orientativo.
          </p>
          <p className="mb-3">
            <strong className="text-white">1.3.</strong> La Plataforma utiliza modelos de inteligencia artificial
            que pueden contener errores, imprecisiones o limitaciones inherentes a la tecnología empleada.
          </p>

          {/* CLÁUSULA 2 */}
          <h3 className="text-[#d98c21] font-bold uppercase tracking-widest text-xs mb-3 mt-8 border-b border-gray-700 pb-2">
            Cláusula 2 — Responsabilidad del Usuario
          </h3>
          <p className="mb-3">
            <strong className="text-white">2.1.</strong>{' '}
            <strong className="text-white">
              El Usuario es el único y exclusivo responsable de todas las decisiones económicas, fiscales,
              financieras y empresariales que adopte
            </strong>
            , con independencia de que dichas decisiones se hayan tomado con base en información
            proporcionada por la Plataforma.
          </p>
          <p className="mb-2"><strong className="text-white">2.2.</strong> El Usuario se compromete a:</p>
          <ul className="list-disc list-inside space-y-1 text-gray-400 mb-3 ml-4">
            <li>Verificar de forma independiente toda la información antes de tomar cualquier decisión.</li>
            <li>Consultar con un profesional cualificado (asesor fiscal, contable o abogado) cuando lo requiera.</li>
            <li>Introducir datos veraces, completos y actualizados en la Plataforma.</li>
            <li>Mantener actualizada su información fiscal y empresarial.</li>
          </ul>
          <p className="mb-3">
            <strong className="text-white">2.3.</strong> El Usuario reconoce que la normativa fiscal española
            está sujeta a cambios frecuentes y reKalcula puede no reflejar en todo momento las últimas
            modificaciones legislativas.
          </p>

          {/* CLÁUSULA 3 */}
          <h3 className="text-[#d98c21] font-bold uppercase tracking-widest text-xs mb-3 mt-8 border-b border-gray-700 pb-2">
            Cláusula 3 — Exoneración de Responsabilidad de reKalcula
          </h3>
          <p className="mb-2">
            <strong className="text-white">3.1.</strong> reKalcula queda expresamente exonerada de cualquier
            responsabilidad derivada de:
          </p>
          <ul className="list-disc list-inside space-y-1 text-gray-400 mb-3 ml-4">
            <li>Decisiones tomadas por el Usuario basándose en información generada por la Plataforma.</li>
            <li>Errores en cálculos de IVA, IRPF, Impuesto sobre Sociedades, retenciones o pagos fraccionados.</li>
            <li>Pérdidas económicas, sanciones, recargos o intereses de demora.</li>
            <li>Recomendaciones del módulo de IA, incluyendo análisis de coste de oportunidad y previsiones de tesorería.</li>
            <li>Interrupciones del servicio, fallos técnicos o pérdida de datos.</li>
            <li>Cambios normativos no incorporados a la Plataforma en el momento de su vigor.</li>
            <li>La interpretación o aplicación incorrecta por parte del Usuario de la información proporcionada.</li>
          </ul>
          <p className="mb-3">
            <strong className="text-white">3.2.</strong> La responsabilidad total de reKalcula no podrá exceder
            del importe abonado durante los doce (12) meses anteriores al hecho causante.
          </p>

          {/* CLÁUSULA 4 */}
          <h3 className="text-[#d98c21] font-bold uppercase tracking-widest text-xs mb-3 mt-8 border-b border-gray-700 pb-2">
            Cláusula 4 — Limitaciones de la Inteligencia Artificial
          </h3>
          <p className="mb-2">
            <strong className="text-white">4.1.</strong> El Usuario reconoce que los módulos de IA integrados en reKalcula:
          </p>
          <ul className="list-disc list-inside space-y-1 text-gray-400 mb-3 ml-4">
            <li>Generan estimaciones, no certezas. Toda cifra debe considerarse orientación aproximada.</li>
            <li>Pueden producir resultados erróneos en función de la calidad de los datos introducidos.</li>
            <li>No sustituyen el criterio de un asesor fiscal, contable o financiero cualificado.</li>
            <li>Operan con modelos estadísticos sujetos a márgenes de error por su naturaleza.</li>
            <li>Las previsiones de tesorería son herramientas de reflexión, no garantías de resultado.</li>
          </ul>

          {/* CLÁUSULA 5 */}
          <h3 className="text-[#d98c21] font-bold uppercase tracking-widest text-xs mb-3 mt-8 border-b border-gray-700 pb-2">
            Cláusula 5 — Datos Fiscales y Obligaciones Tributarias
          </h3>
          <p className="mb-3">
            <strong className="text-white">5.1.</strong> El cumplimiento de las obligaciones tributarias
            (presentación de modelos, pago de impuestos, liquidaciones trimestrales y anuales) es{' '}
            <strong className="text-white">responsabilidad exclusiva del Usuario</strong>.
          </p>
          <p className="mb-3">
            <strong className="text-white">5.2.</strong> reKalcula no actúa como representante fiscal ante
            la AEAT ni ningún otro organismo público.
          </p>
          <p className="mb-3">
            <strong className="text-white">5.3.</strong> Los cálculos son aproximaciones basadas en reglas fiscales
            generales. Pueden existir circunstancias específicas (regímenes especiales, exenciones,
            bonificaciones) que la Plataforma no contemple.
          </p>

          {/* CLÁUSULA 6 */}
          <h3 className="text-[#d98c21] font-bold uppercase tracking-widest text-xs mb-3 mt-8 border-b border-gray-700 pb-2">
            Cláusula 6 — Protección de Datos
          </h3>
          <p className="mb-3">
            <strong className="text-white">6.1.</strong> reKalcula trata los datos personales conforme al
            Reglamento General de Protección de Datos (RGPD) y la Ley Orgánica 3/2018 (LOPDGDD).
          </p>
          <p className="mb-3">
            <strong className="text-white">6.2.</strong> El Usuario es responsable de la veracidad y licitud
            de los datos que introduce, incluyendo datos de terceros (proveedores, clientes, empleados).
          </p>

          {/* CLÁUSULA 7 */}
          <h3 className="text-[#d98c21] font-bold uppercase tracking-widest text-xs mb-3 mt-8 border-b border-gray-700 pb-2">
            Cláusula 7 — Disponibilidad del Servicio
          </h3>
          <p className="mb-3">
            <strong className="text-white">7.1.</strong> reKalcula no garantiza un funcionamiento ininterrumpido
            ni libre de errores.
          </p>
          <p className="mb-3">
            <strong className="text-white">7.2.</strong> reKalcula se reserva el derecho de suspender o
            modificar cualquier funcionalidad con el preaviso razonable que las circunstancias permitan.
          </p>

          {/* CLÁUSULA 8 */}
          <h3 className="text-[#d98c21] font-bold uppercase tracking-widest text-xs mb-3 mt-8 border-b border-gray-700 pb-2">
            Cláusula 8 — Modificaciones del Contrato
          </h3>
          <p className="mb-3">
            <strong className="text-white">8.1.</strong> Las modificaciones serán comunicadas con antelación
            mínima de quince (15) días naturales por correo o a través de la Plataforma.
          </p>
          <p className="mb-3">
            <strong className="text-white">8.2.</strong> El uso continuado tras las modificaciones implica
            la aceptación de las nuevas condiciones.
          </p>

          {/* CLÁUSULA 9 */}
          <h3 className="text-[#d98c21] font-bold uppercase tracking-widest text-xs mb-3 mt-8 border-b border-gray-700 pb-2">
            Cláusula 9 — Legislación Aplicable y Jurisdicción
          </h3>
          <p className="mb-3">
            <strong className="text-white">9.1.</strong> El contrato se rige conforme a la legislación española vigente.
          </p>
          <p className="mb-3">
            <strong className="text-white">9.2.</strong> Las controversias se someten a los Juzgados del
            domicilio del Usuario conforme a la normativa de consumidores y usuarios aplicable.
          </p>

          {/* CLÁUSULA 10 */}
          <h3 className="text-[#d98c21] font-bold uppercase tracking-widest text-xs mb-3 mt-8 border-b border-gray-700 pb-2">
            Cláusula 10 — Aceptación
          </h3>
          <p className="mb-3">
            <strong className="text-white">10.1.</strong> Al pulsar{' '}
            <strong className="text-[#d98c21]">"Acepto las condiciones de uso"</strong>, el Usuario declara:
          </p>
          <ul className="list-disc list-inside space-y-1 text-gray-400 mb-6 ml-4">
            <li>Haber leído y comprendido íntegramente el presente documento.</li>
            <li>Aceptar de forma libre, voluntaria e informada todas las cláusulas.</li>
            <li>Ser consciente de que reKalcula es una herramienta de apoyo, no asesoría profesional.</li>
            <li>Asumir la plena responsabilidad sobre sus decisiones económicas, fiscales y empresariales.</li>
          </ul>

          {/* Resumen informativo */}
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-5 my-6">
            <p className="text-green-400 font-bold text-sm mb-1">RESUMEN INFORMATIVO PARA EL USUARIO</p>
            <p className="text-gray-500 text-xs italic mb-4">
              Este resumen no sustituye al contenido completo del contrato
            </p>
            {[
              'reKalcula te ayuda a entender tu dinero, tus impuestos y tu negocio.',
              'Los cálculos y recomendaciones son orientativos, nunca definitivos.',
              'Tú eres quien toma las decisiones y quien responde por ellas.',
              'Si tienes dudas fiscales o legales, consulta siempre con un profesional.',
              'La inteligencia artificial te sugiere, pero no decide por ti.',
              'Tus datos están protegidos conforme a la normativa europea y española.',
            ].map((item, i) => (
              <p key={i} className="text-green-400 text-sm my-1">✅ {item}</p>
            ))}
          </div>

          <p className="text-center text-gray-500 text-xs mt-6 mb-0">
            © 2026 reKalcula. Todos los derechos reservados. · Documento generado el 14 de febrero de 2026
          </p>

        </div>
      )}
    </div>
  )
}