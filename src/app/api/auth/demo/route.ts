/**
 * API Route: GET/POST /api/auth/demo
 *
 * Login demo con Supabase Auth.
 * - GET: hace login y redirige a /app (para usar con window.location.href)
 * - POST: hace login y devuelve JSON { success, error }
 *
 * Si la cuenta no existe, la crea con service role key.
 */
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const DEMO_EMAIL = 'demo@rentnow.app'
const DEMO_PASSWORD = 'Demo123!'

export const runtime = 'nodejs'

async function doDemoLogin() {
  const cookieStore = await cookies()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return { success: false, error: 'Supabase no configurado' }
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() { return cookieStore.getAll() },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options)
        )
      },
    },
  })

  // Verificar sesión existente
  const { data: { session: existingSession } } = await supabase.auth.getSession()
  if (existingSession?.user) {
    return { success: true }
  }

  // Intentar login
  let signInData: any = null
  let signInError: any = null
  try {
    const result = await supabase.auth.signInWithPassword({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
    })
    signInData = result.data
    signInError = result.error
  } catch (e) {
    return { success: false, error: 'fetch failed', details: { exception: String(e), supabaseUrl: supabaseUrl, anonKey: supabaseAnonKey ? 'set' : 'not set' } }
  }

  if (signInData?.user && !signInError) {
    // Insert demo data if properties table is empty
    try {
      const { count } = await supabase.from('properties').select('*', { count: 'exact', head: true })
      if (count === 0) {
        // Insert demo properties
        await supabase.from('properties').insert([
          {
            owner_id: signInData.user.id,
            title: 'Apartamento Chapinero',
            type: 'apartamento',
            address: 'Carrera 11 # 70-30',
            city: 'Bogotá',
            area_sqm: 85, bedrooms: 3, bathrooms: 2,
            description: 'Hermoso apartamento en Chapinero. Portería 24h, parqueadero y balcón.',
            amenities: ['Portería', 'Parqueadero', 'Balcón', 'Ascensor'],
            monthly_rent: 2800000, deposit: 2800000, status: 'ocupado', image_urls: [],
          },
          {
            owner_id: signInData.user.id,
            title: 'Casa en Laureles',
            type: 'casa',
            address: 'Calle 35 # 80-15',
            city: 'Medellín',
            area_sqm: 150, bedrooms: 4, bathrooms: 3,
            description: 'Amplia casa en barrio Laureles. Jardín privado y garaje para 2 autos.',
            amenities: ['Jardín', 'Parqueadero', 'Zona de parrilla', 'Seguridad 24h'],
            monthly_rent: 3500000, deposit: 3500000, status: 'disponible', image_urls: [],
          },
          {
            owner_id: signInData.user.id,
            title: 'Local Comercial Centro',
            type: 'local',
            address: 'Calle 19 # 7-50',
            city: 'Bogotá',
            area_sqm: 60, bedrooms: 0, bathrooms: 1,
            description: 'Local comercial en centro histórico. Alta afluencia de público.',
            amenities: ['Baño privado', 'Vitrina', 'Aire acondicionado'],
            monthly_rent: 4200000, deposit: 4200000, status: 'disponible', image_urls: [],
          },
        ])
        console.log('[demo] Demo properties inserted')
      }
    } catch (e) {
      console.error('[demo] Error inserting seed data:', e)
    }
    return { success: true }
  }

  // Si falla, crear cuenta demo
  if (signInError) {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (serviceRoleKey) {
      const { createClient } = await import('@supabase/supabase-js')
      const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

      // Crear usuario demo
      await supabaseAdmin.auth.admin.createUser({
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: 'Usuario Demo', role: 'arrendador' },
      }).catch(() => {})

      // Si ya existe, confirmar email
      const { data: usersList } = await supabaseAdmin.auth.admin.listUsers()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const demoUser = (usersList?.users as any[])?.find(u => u?.email === DEMO_EMAIL)
      if (demoUser) {
        await supabaseAdmin.auth.admin.updateUserById(demoUser.id, {
          email_confirm: true,
          password: DEMO_PASSWORD,
        }).catch(() => {})
      }

      // Reintentar login
      const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
      })

      if (retryData?.user && !retryError) {
        return { success: true }
      }
    }
  }

  return { success: false, error: signInError?.message || 'Error al iniciar sesión', details: { signInError: signInError ? String(signInError) : null, supabaseUrl: supabaseUrl || 'not set', anonKey: supabaseAnonKey ? 'set' : 'not set', serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'set' : 'not set' } }
}

// POST: login + JSON response (para fetch API)
export async function POST() {
  const result = await doDemoLogin()

  if (result.success) {
    return NextResponse.json({ success: true })
  }

  return NextResponse.json(
    { success: false, error: result.error || 'Error al iniciar sesión demo', details: result.details || null },
    { status: 401 }
  )
}

// GET: login + redirect a /app (para usar con window.location.href)
export async function GET(request: Request) {
  const result = await doDemoLogin()

  // Usar la URL del request para el redirect (evita redirect a dominio equivocado)
  const url = new URL(request.url)
  const origin = url.protocol + '//' + url.host

  if (result.success) {
    return NextResponse.redirect(new URL('/app', origin), 302)
  }

  return NextResponse.redirect(new URL('/login-direct?error=demo_failed', origin), 302)
}
