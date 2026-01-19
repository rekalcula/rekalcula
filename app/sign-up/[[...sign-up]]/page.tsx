'use client';

import { useState } from 'react';
import { SignUp } from '@clerk/nextjs';
import TermsAcceptance from '@/components/TermsAcceptance';

export default function SignUpPage() {
  const [termsAccepted, setTermsAccepted] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        
        {/* Términos y Condiciones - OBLIGATORIO */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <TermsAcceptance
            isAccepted={termsAccepted}
            onAcceptanceChange={setTermsAccepted}
            showError={false}
          />
        </div>

        {/* Formulario de Clerk - Solo si acepta términos */}
        {termsAccepted ? (
          <SignUp 
            afterSignUpUrl="/onboarding"
            unsafeMetadata={{
              termsAccepted: true,
              termsAcceptedAt: new Date().toISOString(),
              termsVersion: '1.0'
            }}
          />
        ) : (
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <p className="text-red-600 font-medium">
              Debes aceptar los Términos y Condiciones para continuar con el registro
            </p>
          </div>
        )}
        
      </div>
    </div>
  );
}