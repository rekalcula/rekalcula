// lib/contract-integrity.ts
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

export async function getContractText(version: string): Promise<string> {
  // El contrato vive en /docs como archivo controlado por git
  const contractPath = path.join(process.cwd(), 'docs', `contrato_v${version}.md`)
  return fs.readFileSync(contractPath, 'utf-8')
}

export function hashContract(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex')
}

// Al actualizar el contrato: cambiar versión (1.0 → 1.1)
// Los usuarios que aceptaron 1.0 deben volver a aceptar 1.1
// Cada versión queda sellada con su hash en la BD