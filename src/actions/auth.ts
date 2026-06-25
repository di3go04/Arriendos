'use server'

/**
 * Server Action: loginWithDemo
 *
 * Realiza el login automático con la cuenta demo predefinida usando Supabase Auth.
 * Si la cuenta no existe, la crea automáticamente con supabase.auth.signUp y
 * luego inicia sesión con signInWithPassword.
 *
 * Seguridad: las credenciales están hardcodeadas en el servidor (server action),
 * NUNCA se exponen al cliente. El navegador solo recibe { success, error }.
 *
 * @returns {Promise<{ success: boolean; error?: string }>}
 */
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Credenciales demo — hardcodeadas en el servidor (seguro para entorno demo)
const DEMO_EMAIL = 'demo@rentnow.app'
const DEMO_PASSWORD = 'Demo123!'

export async function loginWithDemo(): Promise<{ success: boolean; error?: string }> {
  try {
    const cookieStore = await cookies()

    // Verificar que las variables de entorno de Supabase estén configuradas
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      return { success: false, error: 'Supabase no está configurado. Contacta al administrador.' }
    }

    // Crear cliente de Supabase con manejo de cookies SSR
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    })

    // PASO 1: Verificar si ya hay una sesión activa
    const { data: { session: existingSession } } = await supabase.auth.getSession()
    if (existingSession?.user) {
      // Ya hay sesión, no necesitamos hacer login de nuevo
      return { success: true }
    }

    // PASO 2: Intentar login con las credenciales demo
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
    })

    if (signInData?.user && !signInError) {
      // Login exitoso — la cookie de sesión se establece automáticamente
      return { success: true }
    }

    // PASO 3: Si el login falla porque la cuenta no existe, crearla
    if (signInError && (signInError.message.includes('Invalid login') || signInError.message.includes('not confirmed'))) {
      // Usar service role key para crear el usuario (bypassa restricciones)
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
      if (!serviceRoleKey) {
        return { success: false, error: 'No se puede crear la cuenta demo. Service role key no configurada.' }
      }

      // Crear cliente admin con service role key
      const { createClient } = await import('@supabase/supabase-js')
      const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

      // Crear usuario demo
      const { data: signUpData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
        email_confirm: true, // Auto-confirmar email para evitar flujo de verificación
        user_metadata: {
          full_name: 'Usuario Demo',
          role: 'arrendador',
        },
      })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const signUpResult = signUpData as any
      if (signUpError) {
        // Si el usuario ya existe pero no se pudo hacer login (ej: email no confirmado),
        // intentar confirmar el email con admin
        if (signUpError.message.includes('already') && signUpResult?.user?.id) {
          // Actualizar el usuario para confirmar email
          await supabaseAdmin.auth.admin.updateUserById(
            signUpResult.user.id,
            { email_confirm: true }
          ).catch(() => {})
        }
      }

      // Intentar login de nuevo después de crear/confirmar
      const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
      })

      if (retryData?.user && !retryError) {
        return { success: true }
      }

      return { success: false, error: 'No se pudo iniciar sesión con la cuenta demo.' }
    }

    // Otro error
    return { success: false, error: signInError?.message || 'Error al iniciar sesión demo.' }
  } catch (err) {
    console.error('[loginWithDemo] Error:', err)
    return { success: false, error: 'Error al iniciar la demo. Por favor, intenta de nuevo.' }
  }
}
