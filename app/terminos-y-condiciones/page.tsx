// app/terminos-y-condiciones/page.tsx

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-8">
        <article className="prose prose-lg max-w-none">
          
          <h1 className="text-3xl font-bold mb-4">Términos y Condiciones de Uso de Rekalcula</h1>
          <p className="text-sm text-gray-600 mb-8"><strong>Última actualización: 19 de enero de 2026</strong></p>
          
          <hr className="my-8" />
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">1. ACEPTACIÓN DE LOS TÉRMINOS</h2>
          <p className="mb-4">
            Al registrarse y utilizar Rekalcula (en adelante, "la Plataforma"), 
            el usuario (en adelante, "el Usuario") acepta expresamente y sin reservas 
            estos Términos y Condiciones, así como la Política de Privacidad de la Plataforma.
          </p>
          <p className="mb-4 font-semibold">
            La aceptación de estos términos es condición indispensable para acceder y usar la Plataforma.
          </p>
          
          <hr className="my-8" />
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">2. IDENTIFICACIÓN DEL PRESTADOR DEL SERVICIO</h2>
          <p className="mb-2"><strong>Denominación social:</strong> [Nombre de la empresa titular de Rekalcula]</p>
          <p className="mb-2"><strong>NIF/CIF:</strong> [Número de identificación fiscal]</p>
          <p className="mb-2"><strong>Domicilio social:</strong> [Dirección completa]</p>
          <p className="mb-2"><strong>Correo electrónico:</strong> [email de contacto]</p>
          <p className="mb-4"><strong>Datos registrales:</strong> [Registro Mercantil, si aplica]</p>
          <p className="mb-4">Este servicio se presta conforme a la legislación española vigente.</p>
          
          <hr className="my-8" />
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">3. OBJETO Y NATURALEZA DEL SERVICIO</h2>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">3.1 Definición del servicio</h3>
          <p className="mb-4">
            Rekalcula es una <strong>herramienta de gestión económica y fiscal automatizada</strong> que 
            proporciona funcionalidades de cálculo, registro contable, análisis de flujos de caja y 
            generación de informes orientados a pequeñas empresas, autónomos y sociedades en España.
          </p>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">3.2 Naturaleza del servicio</h3>
          <p className="mb-2 font-semibold">Rekalcula NO es:</p>
          <ul className="list-disc ml-6 mb-4">
            <li>Un asesor fiscal, contable o financiero profesional</li>
            <li>Un servicio de asesoría personalizada</li>
            <li>Un sustituto del asesoramiento profesional de gestores, contables, asesores fiscales o abogados</li>
            <li>Un servicio que garantice el cumplimiento tributario o contable</li>
          </ul>
          
          <p className="mb-2 font-semibold">Rekalcula es:</p>
          <ul className="list-disc ml-6 mb-4">
            <li>Una <strong>herramienta de apoyo a la gestión</strong> económica y financiera</li>
            <li>Un <strong>sistema automatizado</strong> basado en algoritmos y normativa fiscal general</li>
            <li>Un <strong>recurso informativo</strong> que facilita la organización de datos económicos</li>
          </ul>
          
          <hr className="my-8" />
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">4. EXENCIÓN DE RESPONSABILIDAD (DISCLAIMER)</h2>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">4.1 Responsabilidad sobre la información</h3>
          <p className="mb-4">El Usuario reconoce y acepta expresamente que:</p>
          
          <ol className="list-decimal ml-6 mb-4 space-y-2">
            <li><strong>Los cálculos, proyecciones, informes y recomendaciones generados por Rekalcula tienen carácter meramente informativo y orientativo.</strong></li>
            
            <li><strong>La responsabilidad final sobre cualquier decisión económica, fiscal o financiera corresponde única y exclusivamente al Usuario.</strong></li>
            
            <li><strong>Rekalcula no se responsabiliza de:</strong>
              <ul className="list-disc ml-6 mt-2">
                <li>Errores en los cálculos derivados de información incorrecta, incompleta o desactualizada introducida por el Usuario</li>
                <li>Pérdidas económicas, sanciones fiscales, recargos o cualquier perjuicio derivado de decisiones adoptadas en base a los resultados de la Plataforma</li>
                <li>Cambios normativos, fiscales o contables posteriores a la última actualización del sistema</li>
                <li>Interpretaciones fiscales que puedan diferir de las aplicadas por la Agencia Tributaria u otros organismos públicos</li>
                <li>Daños indirectos, lucro cesante o daño moral derivados del uso de la Plataforma</li>
              </ul>
            </li>
          </ol>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">4.2 Recomendación de asesoramiento profesional</h3>
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
            <p className="font-semibold">
              SE RECOMIENDA EXPRESAMENTE AL USUARIO que consulte con un asesor fiscal, gestor contable 
              o profesional cualificado antes de tomar decisiones basadas en la información proporcionada 
              por Rekalcula.
            </p>
          </div>
          <p className="mb-4">
            La Plataforma no sustituye el criterio profesional de un experto en materia fiscal, 
            contable o financiera.
          </p>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">4.3 Exclusión de garantías</h3>
          <p className="mb-2">Rekalcula no garantiza:</p>
          <ul className="list-disc ml-6 mb-4">
            <li>La ausencia de errores en los cálculos o algoritmos</li>
            <li>La actualización permanente de la normativa fiscal aplicable</li>
            <li>La compatibilidad con todos los supuestos fiscales particulares</li>
            <li>Resultados específicos en términos de ahorro fiscal o mejora económica</li>
          </ul>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">4.4 Limitación de responsabilidad</h3>
          <p className="mb-4">
            En ningún caso la responsabilidad de Rekalcula superará el importe total abonado por el Usuario 
            durante los 12 meses anteriores al hecho que genere la reclamación.
          </p>
          
          <hr className="my-8" />
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">5. OBLIGACIONES DEL USUARIO</h2>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">5.1 Veracidad y exactitud de los datos</h3>
          <p className="mb-2">El Usuario se compromete a:</p>
          <ol className="list-decimal ml-6 mb-4">
            <li>Introducir información <strong>veraz, exacta y actualizada</strong></li>
            <li>Revisar periódicamente los datos registrados</li>
            <li><strong>No utilizar la Plataforma como único soporte para el cumplimiento de obligaciones fiscales</strong></li>
            <li>Conservar documentación original que respalde los registros introducidos</li>
          </ol>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">5.2 Uso responsable</h3>
          <p className="mb-2">El Usuario se compromete a:</p>
          <ul className="list-disc ml-6 mb-4">
            <li>Usar la Plataforma conforme a la legalidad vigente</li>
            <li>No intentar alterar, manipular o realizar ingeniería inversa del sistema</li>
            <li>No utilizar la Plataforma para fines fraudulentos o ilícitos</li>
            <li>Mantener la confidencialidad de sus credenciales de acceso</li>
          </ul>
          
          <hr className="my-8" />
          
          <div className="bg-blue-50 border-l-4 border-blue-400 p-6 my-8">
            <h2 className="text-xl font-semibold mb-4">DECLARACIÓN FINAL DE ACEPTACIÓN</h2>
            <p className="mb-4 font-semibold">
              AL MARCAR LA CASILLA DE ACEPTACIÓN Y COMPLETAR EL REGISTRO, EL USUARIO DECLARA:
            </p>
            <ol className="list-decimal ml-6 space-y-2">
              <li>Haber leído, comprendido y aceptado en su totalidad estos Términos y Condiciones</li>
              <li>Ser mayor de edad o contar con autorización de su representante legal</li>
              <li>Comprender que Rekalcula es una herramienta de apoyo, no un asesor profesional</li>
              <li>Asumir la responsabilidad exclusiva de las decisiones adoptadas en base a la información de la Plataforma</li>
              <li>Reconocer la recomendación de consultar con profesionales antes de tomar decisiones fiscales o económicas importantes</li>
            </ol>
          </div>
          
          <hr className="my-8" />
          
          <p className="text-center text-gray-600 mt-8">
            <strong>Fecha de última actualización: 19 de enero de 2026</strong>
          </p>
          
        </article>
      </div>
    </div>
  );
}