/**
 * EJEMPLO DE IMPLEMENTACIÓN - Página de Registro
 * Este archivo muestra cómo integrar el componente TermsAcceptance
 * en el formulario de registro de Rekalcula
 */

'use client';

import React, { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import TermsAcceptance from '@/components/TermsAcceptance';

export default function SignUpPage() {
  const router = useRouter();
  
  // Estados del formulario
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    companyType: 'autonomo' as 'autonomo' | 'sl' | 'sa',
  });

  // Estado de aceptación de términos (CRÍTICO)
  const [termsAccepted, setTermsAccepted] = useState(false);
  
  // Estados de validación
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showTermsError, setShowTermsError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Validación del formulario
   * REGLA CRÍTICA: No permitir registro sin aceptación de términos
   */
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validar email
    if (!formData.email) {
      newErrors.email = 'El email es obligatorio';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email no válido';
    }

    // Validar contraseña
    if (!formData.password) {
      newErrors.password = 'La contraseña es obligatoria';
    } else if (formData.password.length < 8) {
      newErrors.password = 'La contraseña debe tener al menos 8 caracteres';
    }

    // Validar confirmación de contraseña
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    // Validar nombre de empresa
    if (!formData.companyName) {
      newErrors.companyName = 'El nombre de la empresa es obligatorio';
    }

    // ⚠️ VALIDACIÓN CRÍTICA: Términos y condiciones
    if (!termsAccepted) {
      newErrors.terms = 'Debes aceptar los Términos y Condiciones';
      setShowTermsError(true);
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Manejador del envío del formulario
   */
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Resetear errores previos
    setShowTermsError(false);
    
    // Validar formulario
    if (!validateForm()) {
      return;
    }

    // ⚠️ DOBLE VERIFICACIÓN: Seguridad adicional
    if (!termsAccepted) {
      alert('Debes aceptar los Términos y Condiciones para continuar');
      setShowTermsError(true);
      return;
    }

    setIsSubmitting(true);

    try {
      // Llamada a la API de registro
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          termsAccepted: true, // Enviar confirmación explícita
          termsAcceptedAt: new Date().toISOString(), // Timestamp de aceptación
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al crear la cuenta');
      }

      // Registro exitoso
      router.push('/onboarding');
      
    } catch (error) {
      setErrors({
        submit: error instanceof Error ? error.message : 'Error desconocido'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        
        {/* Header */}
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Crear cuenta en Rekalcula
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Gestión económica y fiscal para tu empresa
          </p>
        </div>

        {/* Formulario */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          {/* Contraseña */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password}</p>
            )}
          </div>

          {/* Confirmar contraseña */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
              Confirmar contraseña
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
            )}
          </div>

          {/* Nombre de empresa */}
          <div>
            <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
              Nombre de la empresa
            </label>
            <input
              id="companyName"
              name="companyName"
              type="text"
              required
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.companyName && (
              <p className="mt-1 text-sm text-red-600">{errors.companyName}</p>
            )}
          </div>

          {/* Tipo de empresa */}
          <div>
            <label htmlFor="companyType" className="block text-sm font-medium text-gray-700">
              Tipo de empresa
            </label>
            <select
              id="companyType"
              name="companyType"
              value={formData.companyType}
              onChange={(e) => setFormData({ ...formData, companyType: e.target.value as any })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="autonomo">Autónomo</option>
              <option value="sl">Sociedad Limitada (S.L.)</option>
              <option value="sa">Sociedad Anónima (S.A.)</option>
            </select>
          </div>

          {/* ⚠️ COMPONENTE CRÍTICO: Aceptación de términos */}
          <div className="pt-4">
            <TermsAcceptance
              isAccepted={termsAccepted}
              onAcceptanceChange={setTermsAccepted}
              showError={showTermsError}
            />
          </div>

          {/* Error general de envío */}
          {errors.submit && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{errors.submit}</p>
            </div>
          )}

          {/* Botón de envío */}
          <div>
            <button
              type="submit"
              disabled={isSubmitting || !termsAccepted}
              className={`
                w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white
                ${!termsAccepted || isSubmitting
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                }
              `}
            >
              {isSubmitting ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </div>

          {/* Link a login */}
          <div className="text-center text-sm">
            <span className="text-gray-600">¿Ya tienes cuenta? </span>
            <a href="/sign-in" className="font-medium text-blue-600 hover:text-blue-500">
              Inicia sesión
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
