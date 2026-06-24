/**
 * demo-client.ts — Utilidades de DEMO_MODE para el cliente (browser)
 */

export function isDemoModeClient(): boolean {
  if (typeof window === 'undefined') return false
  return process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
}

export async function fetchDemoStatus(): Promise<{
  demoMode: boolean
  credentials: { email: string; password: string } | null
  configured: Record<string, boolean>
}> {
  const res = await fetch('/api/demo/status')
  return res.json()
}
