/**
 * Componente de aceptación de Términos y Condiciones
 * Este componente debe integrarse en el formulario de registro
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface TermsAcceptanceProps {
  /** Estado del checkbox controlado desde el componente padre */
  isAccepted: boolean;
  /** Callback para cambiar el estado */
  onAcceptanceChange: (accepted: boolean) => void;
  /** Mostrar error si no está aceptado (opcional) */
  showError?: boolean;
  /** URL de los términos y condiciones (por defecto: /terminos-y-condiciones) */
  termsUrl?: string;
  /** URL de la política de privacidad (por defecto: /politica-privacidad) */
  privacyUrl?: string;
}

export default function TermsAcceptance({
  isAccepted,
  onAcceptanceChange,
  showError = false,
  termsUrl = '/terminos-y-condiciones',
  privacyUrl = '/politica-privacidad'
}: TermsAcceptanceProps) {
  
  return (
    <div className="space-y-2">
      {/* Checkbox de aceptación */}
      <div className="flex items-start">
        <div className="flex items-center h-5">
          <input
            id="accept-terms"
            name="accept-terms"
            type="checkbox"
            checked={isAccepted}
            onChange={(e) => onAcceptanceChange(e.target.checked)}
            className={`
              h-4 w-4 rounded border-gray-300 
              text-blue-600 focus:ring-blue-500
              ${showError && !isAccepted ? 'border-red-500' : ''}
            `}
            required
            aria-required="true"
            aria-invalid={showError && !isAccepted}
            aria-describedby={showError && !isAccepted ? 'terms-error' : undefined}
          />
        </div>
        <div className="ml-3 text-sm">
          <label htmlFor="accept-terms" className="font-medium text-gray-700">
            Acepto los{' '}
            <Link 
              href={termsUrl} 
              target="_blank"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              Términos y Condiciones
            </Link>
            {' '}y la{' '}
            <Link 
              href={privacyUrl} 
              target="_blank"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              Política de Privacidad
            </Link>
            {' '}de Rekalcula
            <span className="text-red-500 ml-1">*</span>
          </label>
        </div>
      </div>

      {/* Mensaje de error */}
      {showError && !isAccepted && (
        <div 
          id="terms-error" 
          className="text-sm text-red-600 ml-7"
          role="alert"
        >
          Debes aceptar los Términos y Condiciones para continuar
        </div>
      )}

      {/* Aviso legal importante */}
      <div className="ml-7 p-3 bg-amber-50 border border-amber-200 rounded-md">
        <p className="text-xs text-amber-800">
          ⚠️ <strong>Importante:</strong> Rekalcula es una herramienta de apoyo a la gestión. 
          No sustituye el asesoramiento profesional. Se recomienda consultar con un asesor fiscal 
          antes de tomar decisiones importantes.
        </p>
      </div>
    </div>
  );
}
