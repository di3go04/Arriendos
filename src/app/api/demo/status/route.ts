import { NextResponse } from 'next/server'

export async function GET() {
  const demoMode = process.env.DEMO_MODE === 'true'

  return NextResponse.json({
    demoMode,
    credentials: demoMode
      ? {
          email: process.env.DEMO_EMAIL || 'demo@rentnow.app',
          password: process.env.DEMO_PASSWORD || 'DemoR3ntN0w!2026_Public',
        }
      : null,
    configured: {
      stripe: Boolean(process.env.STRIPE_SECRET_KEY),
      belvo: Boolean(process.env.BELVO_SECRET_ID),
      gemini: Boolean(process.env.GEMINI_API_KEY),
      twilio: Boolean(process.env.TWILIO_ACCOUNT_SID),
      resend: Boolean(process.env.RESEND_API_KEY),
      mapbox: Boolean(process.env.NEXT_PUBLIC_MAPBOX_TOKEN),
      mercadopago: Boolean(process.env.MP_ACCESS_TOKEN),
      whatsapp: Boolean(process.env.WHATSAPP_BRIDGE_URL),
      paypal: Boolean(process.env.PAYPAL_CLIENT_ID),
    },
  })
}
