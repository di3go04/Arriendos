declare module 'react-cookie-consent' {
  import { ReactNode } from 'react'

  interface CookieConsentProps {
    location?: 'top' | 'bottom'
    children?: ReactNode
    buttonText?: string
    declineButtonText?: string
    enableDeclineButton?: boolean
    cookieName?: string
    expires?: number
    style?: React.CSSProperties
    buttonStyle?: React.CSSProperties
    declineButtonStyle?: React.CSSProperties
    contentStyle?: React.CSSProperties
    onAccept?: () => void
    onDecline?: () => void
  }

  const CookieConsent: React.FC<CookieConsentProps>
  export default CookieConsent
}
