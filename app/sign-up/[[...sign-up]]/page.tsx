/**
 * Página de registro con tema visual de Rekalcula
 */

'use client';

import { useState } from 'react';
import { SignUp } from '@clerk/nextjs';
import TermsAcceptance from '@/components/TermsAcceptance';

export default function SignUpPage() {
  const [termsAccepted, setTermsAccepted] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] py-12 px-4">
      <div className="max-w-md w-full space-y-6">
        
        {/* Header con branding */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            re<span className="text-orange-500">K</span>alcula
          </h1>
          <div className="h-1 w-20 bg-orange-500 rounded mx-auto mb-4"></div>
          <p className="text-gray-400 text-sm">
            Gestión económica y fiscal para tu empresa
          </p>
        </div>

        {/* Términos y Condiciones - OBLIGATORIO */}
        <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-6 shadow-xl">
          <TermsAcceptance
            isAccepted={termsAccepted}
            onAcceptanceChange={setTermsAccepted}
            showError={false}
          />
        </div>

        {/* Formulario de Clerk - Solo si acepta términos */}
        {termsAccepted ? (
          <div className="transform transition-all duration-300 ease-in-out">
            <SignUp 
              afterSignUpUrl="/onboarding"
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "bg-[#1a1a1a] border border-gray-800 shadow-xl",
                  headerTitle: "text-white",
                  headerSubtitle: "text-gray-400",
                  socialButtonsBlockButton: "bg-[#2a2a2a] border-gray-700 text-gray-200 hover:bg-[#3a3a3a]",
                  formButtonPrimary: "bg-orange-500 hover:bg-orange-600 text-white",
                  formFieldInput: "bg-[#2a2a2a] border-gray-700 text-white",
                  formFieldLabel: "text-gray-300",
                  footerActionLink: "text-orange-500 hover:text-orange-400",
                  identityPreviewText: "text-gray-300",
                  formFieldInputShowPasswordButton: "text-gray-400 hover:text-gray-200",
                  formFieldSuccessText: "text-green-400",
                  formFieldErrorText: "text-red-400",
                  dividerLine: "bg-gray-700",
                  dividerText: "text-gray-500",
                  otpCodeFieldInput: "bg-[#2a2a2a] border-gray-700 text-white",
                  formFieldAction: "text-orange-500 hover:text-orange-400",
                }
              }}
              unsafeMetadata={{
                termsAccepted: true,
                termsAcceptedAt: new Date().toISOString(),
                termsVersion: '1.0'
              }}
            />
          </div>
        ) : (
          <div className="bg-[#1a1a1a] border border-red-500/30 rounded-lg p-6 text-center shadow-xl">
            <div className="flex justify-center mb-4">
              <svg 
                className="w-12 h-12 text-red-500" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" 
                />
              </svg>
            </div>
            <p className="text-red-400 font-semibold text-lg mb-2">
              Acceso bloqueado
            </p>
            <p className="text-gray-400 text-sm">
              Debes aceptar los Términos y Condiciones para continuar con el registro
            </p>
          </div>
        )}

        {/* Link a login */}
        <div className="text-center text-sm">
          <span className="text-gray-400">¿Ya tienes cuenta? </span>
          <a 
            href="/sign-in" 
            className="font-medium text-orange-500 hover:text-orange-400 transition-colors"
          >
            Inicia sesión
          </a>
        </div>
        
      </div>
    </div>
  );
}