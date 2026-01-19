/**
 * API Route: /api/auth/signup
 * 
 * Este endpoint maneja el registro de nuevos usuarios
 * INCLUYE VALIDACIÓN OBLIGATORIA DE TÉRMINOS Y CONDICIONES
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

// Tipos
interface SignUpRequest {
  email: string;
  password: string;
  confirmPassword: string;
  companyName: string;
  companyType: 'autonomo' | 'sl' | 'sa';
  termsAccepted: boolean;
  termsAcceptedAt: string;
}

export async function POST(request: NextRequest) {
  try {
    // Parsear body
    const body: SignUpRequest = await request.json();

    // ⚠️ VALIDACIÓN CRÍTICA 1: Términos aceptados
    if (!body.termsAccepted) {
      return NextResponse.json(
        { 
          error: 'terms_required',
          message: 'Debes aceptar los Términos y Condiciones para registrarte' 
        },
        { status: 400 }
      );
    }

    // ⚠️ VALIDACIÓN CRÍTICA 2: Timestamp de aceptación
    if (!body.termsAcceptedAt) {
      return NextResponse.json(
        { 
          error: 'terms_timestamp_required',
          message: 'No se pudo verificar la fecha de aceptación de términos' 
        },
        { status: 400 }
      );
    }

    // Validar campos obligatorios
    if (!body.email || !body.password || !body.companyName) {
      return NextResponse.json(
        { 
          error: 'missing_fields',
          message: 'Faltan campos obligatorios' 
        },
        { status: 400 }
      );
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { 
          error: 'invalid_email',
          message: 'Email no válido' 
        },
        { status: 400 }
      );
    }

    // Validar contraseña
    if (body.password.length < 8) {
      return NextResponse.json(
        { 
          error: 'weak_password',
          message: 'La contraseña debe tener al menos 8 caracteres' 
        },
        { status: 400 }
      );
    }

    // Validar confirmación de contraseña
    if (body.password !== body.confirmPassword) {
      return NextResponse.json(
        { 
          error: 'password_mismatch',
          message: 'Las contraseñas no coinciden' 
        },
        { status: 400 }
      );
    }

    // Inicializar cliente Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verificar si el email ya existe
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', body.email.toLowerCase())
      .single();

    if (existingUser) {
      return NextResponse.json(
        { 
          error: 'email_exists',
          message: 'Este email ya está registrado' 
        },
        { status: 409 }
      );
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(body.password, 10);

    // Crear usuario en Supabase Auth
    const { data: authUser, error: authError } = await supabase.auth.signUp({
      email: body.email.toLowerCase(),
      password: body.password,
    });

    if (authError) {
      console.error('Error en Supabase Auth:', authError);
      return NextResponse.json(
        { 
          error: 'auth_error',
          message: 'Error al crear la cuenta' 
        },
        { status: 500 }
      );
    }

    // ⚠️ INSERCIÓN CRÍTICA: Guardar registro de aceptación de términos
    const { data: user, error: dbError } = await supabase
      .from('users')
      .insert({
        id: authUser.user?.id,
        email: body.email.toLowerCase(),
        company_name: body.companyName,
        company_type: body.companyType,
        password_hash: hashedPassword,
        // CAMPOS CRÍTICOS PARA TÉRMINOS Y CONDICIONES
        terms_accepted: true,
        terms_accepted_at: new Date(body.termsAcceptedAt).toISOString(),
        terms_version: '1.0', // Versión actual de los términos
        terms_ip_address: request.headers.get('x-forwarded-for') || 
                          request.headers.get('x-real-ip') || 
                          'unknown',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (dbError) {
      console.error('Error al crear usuario en DB:', dbError);
      
      // Rollback: eliminar usuario de Auth si falla la DB
      await supabase.auth.admin.deleteUser(authUser.user!.id);
      
      return NextResponse.json(
        { 
          error: 'database_error',
          message: 'Error al guardar los datos del usuario' 
        },
        { status: 500 }
      );
    }

    // ⚠️ REGISTRO ADICIONAL: Log de aceptación de términos (auditoría)
    await supabase
      .from('terms_acceptance_log')
      .insert({
        user_id: user.id,
        terms_version: '1.0',
        accepted_at: new Date(body.termsAcceptedAt).toISOString(),
        ip_address: request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
      });

    // Respuesta exitosa
    return NextResponse.json(
      {
        message: 'Cuenta creada exitosamente',
        user: {
          id: user.id,
          email: user.email,
          companyName: user.company_name,
          companyType: user.company_type,
        }
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error en signup:', error);
    return NextResponse.json(
      { 
        error: 'server_error',
        message: 'Error interno del servidor' 
      },
      { status: 500 }
    );
  }
}