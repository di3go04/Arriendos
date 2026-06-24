export default function CheckoutButton({ children }: { children: string }) {
  return (
    <button onClick={async () => {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId: 'price_XX' }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    }}>
      {children}
    </button>
  );
}
