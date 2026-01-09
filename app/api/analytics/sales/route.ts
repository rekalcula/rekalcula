// Normalizar nombres de productos - VERSION GENERICA
// Solo limpia el texto sin asumir tipo de negocio
function normalizeProductName(name: string): string {
  if (!name) return 'otros'
  
  let normalized = name
    .toLowerCase()
    .trim()
    // Eliminar caracteres especiales excepto espacios y letras acentuadas
    .replace(/[^\w\sáéíóúüñ]/gi, '')
    // Eliminar espacios multiples
    .replace(/\s+/g, ' ')
    .trim()
  
  // Si queda vacio, devolver 'otros'
  if (!normalized || normalized.length === 0) {
    return 'otros'
  }
  
  return normalized
}

function capitalizeFirst(str: string): string {
  if (!str) return ''
  // Capitalizar cada palabra
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}