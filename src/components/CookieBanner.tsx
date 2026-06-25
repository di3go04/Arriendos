'use client'

import CookieConsent from 'react-cookie-consent'

export default function CookieBanner() {
  return (
    <CookieConsent
      location="bottom"
      buttonText="Aceptar todas"
      declineButtonText="Rechazar"
      enableDeclineButton
      cookieName="RentNOW_CookieConsent"
      expires={365}
      style={{
        background: '#060e1a',
        borderTop: '1px solid rgba(240,185,11,0.3)',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.4)',
        padding: '14px 20px',
        fontFamily: 'system-ui, sans-serif',
        zIndex: 9999,
        alignItems: 'center',
      }}
      buttonStyle={{
        background: '#f0b90b',
        color: '#060e1a',
        fontWeight: 700,
        borderRadius: '8px',
        padding: '10px 24px',
        marginRight: '10px',
        border: 'none',
        cursor: 'pointer',
        fontSize: '14px',
      }}
      declineButtonStyle={{
        background: 'transparent',
        color: '#94a3b8',
        border: '1px solid #334155',
        borderRadius: '8px',
        padding: '10px 24px',
        cursor: 'pointer',
        fontSize: '14px',
      }}
      contentStyle={{
        flex: '1',
        textAlign: 'left',
        color: '#e2e8f0',
        fontSize: '14px',
        lineHeight: '1.5',
      }}
    >
      Este sitio utiliza cookies para mejorar tu experiencia, analizar tráfico
      y mostrar funcionalidades personalizadas. Al hacer clic en &quot;Aceptar todas&quot;,
      aceptas nuestro uso de cookies. Consulta nuestra{' '}
      <a href="/privacidad" style={{ color: '#f0b90b', textDecoration: 'underline' }}>
        Política de Privacidad
      </a>.
    </CookieConsent>
  )
}
