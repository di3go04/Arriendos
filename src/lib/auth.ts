import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import Credentials from 'next-auth/providers/credentials'
import { compare } from 'bcryptjs'
import { createSupabaseServerClient } from './supabase-server'

const providers = []

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  )
}

if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true' || process.env.DEMO_MODE === 'true') {
  providers.push(
    Credentials({
      name: 'Demo',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials) {
        const email = credentials?.email as string
        const password = credentials?.password as string

        if (email === 'demo@rentnow.app' && password === 'Demo123!') {
          return {
            id: 'demo-user-1',
            email: 'demo@rentnow.app',
            name: 'Usuario Demo',
            image: null,
          }
        }
        return null
      },
    })
  )
}

if (process.env.AUTH_REAL_CREDENTIALS === 'true') {
  providers.push(
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials) {
        const email = credentials?.email as string
        const password = credentials?.password as string

        if (!email || !password) return null

        try {
          const supabase = await createSupabaseServerClient()
          const { data: users } = await supabase
            .from('users')
            .select('id, email, name, password_hash, role')
            .eq('email', email)
            .single()

          if (!users || !users.password_hash) return null

          const valid = await compare(password, users.password_hash)
          if (!valid) return null

          return {
            id: users.id,
            email: users.email,
            name: users.name,
            image: null,
          }
        } catch {
          return null
        }
      },
    })
  )
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers,
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    pkceCodeVerifier: {
      name: `next-auth.pkce.code-verifier`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  callbacks: {
    authorized({ request }) {
      // In demo mode, allow ALL requests — don't redirect to /login
      // NextAuth v5 with pages.signIn configured automatically redirects
      // unauthenticated users. This callback overrides that behavior.
      return true
    },
    async jwt({ token, user }) {
      if (user) token.id = user.id
      return token
    },
    async session({ session, token }) {
      if (session.user) session.user.id = token.id as string
      return session
    },
  },
  // Note: pages.signIn removed — NextAuth v5 with pages.signIn configured
  // was auto-redirecting /dashboard to /login?callbackUrl=%2Fdashboard
  // even without auth() middleware wrapper. Removing it fixes the 307.
  session: { strategy: 'jwt' },
  trustHost: true,
})
