/**
 * Componente de aceptación de Términos y Condiciones
 * Estilizado con el tema visual de Rekalcula
 */

'use client';

import React from 'react';
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
    <div className="space-y-3">
      
      {/* Checkbox de aceptación */}
      <div className="flex items-start bg-[#1a1a1a] border border-gray-800 rounded-lg p-4 hover:border-gray-700 transition-colors">
        <div className="flex items-center h-5 mt-0.5">
          <input
            id="accept-terms"
            name="accept-terms"
            type="checkbox"
            checked={isAccepted}
            onChange={(e) => onAcceptanceChange(e.target.checked)}
            className={`
              h-5 w-5 rounded border-2 
              bg-[#2a2a2a]
              text-orange-500 
              focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-[#0a0a0a]
              cursor-pointer
              ${showError && !isAccepted 
                ? 'border-red-500 focus:ring-red-500' 
                : 'border-gray-600 hover:border-orange-500'
              }
            `}
            required
            aria-required="true"
            aria-invalid={showError && !isAccepted}
            aria-describedby={showError && !isAccepted ? 'terms-error' : undefined}
          />
        </div>
        
        <div className="ml-3">
          <label htmlFor="accept-terms" className="font-medium text-gray-200 cursor-pointer">
            Acepto los{' '}
            <Link 
              href={termsUrl} 
              target="_blank"
              className="text-orange-500 hover:text-orange-400 underline underline-offset-2 font-semibold transition-colors"
            >
              Términos y Condiciones
            </Link>
            {' '}y la{' '}
            <Link 
              href={privacyUrl} 
              target="_blank"
              className="text-orange-500 hover:text-orange-400 underline underline-offset-2 font-semibold transition-colors"
            >
              Política de Privacidad
            </Link>
            {' '}de re<span className="text-orange-500">K</span>alcula
            <span className="text-red-500 ml-1">*</span>
          </label>
        </div>
      </div>

      {/* Mensaje de error */}
      {showError && !isAccepted && (
        <div 
          id="terms-error" 
          className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 flex items-start"
          role="alert"
        >
          <svg 
            className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" 
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            <path 
              fillRule="evenodd" 
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" 
              clipRule="evenodd" 
            />
          </svg>
          <span className="text-sm text-red-400 font-medium">
            Debes aceptar los Términos y Condiciones para continuar
          </span>
        </div>
      )}

      {/* Aviso legal importante */}
      <div className="bg-gradient-to-r from-orange-500/10 to-yellow-500/10 border border-orange-500/30 rounded-lg p-4">
        <div className="flex items-start">
          <svg 
            className="w-6 h-6 text-orange-500 mr-3 flex-shrink-0 mt-0.5" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
            />
          </svg>
          <div>
            <p className="text-sm font-semibold text-orange-400 mb-1">
              Importante
            </p>
            <p className="text-xs text-gray-300 leading-relaxed mb-0">
              Rekalcula es una herramienta de apoyo a la gestión. No sustituye el asesoramiento 
              profesional. Se recomienda consultar con un asesor fiscal antes de tomar decisiones importantes.
            </p>
          </div>
        </div>
      </div>
      
    </div>
  );
}