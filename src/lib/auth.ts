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

if (process.env.DEMO_MODE === 'true') {
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
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id
      return token
    },
    async session({ session, token }) {
      if (session.user) session.user.id = token.id as string
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: { strategy: 'jwt' },
  trustHost: true,
})
