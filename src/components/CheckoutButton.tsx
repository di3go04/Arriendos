import { NextResponse } from 'next/server';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
export default function CheckoutButton({ children }: { children: string }) {
  return (
    <button onClick={async () => await stripePromise?.redirectToCheckout({
      sessionId: "price_XX", // Placeador de la ID de sesión
      paymentMethod: { type: 'card' }
    })}>
      {children}
    </button>
  );
}