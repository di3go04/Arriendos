import Stripe from "stripe";

function getStripe() {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error('STRIPE_SECRET_KEY no configurada');
    return new Stripe(key, { apiVersion: '2026-04-22.dahlia' });
}

export const createSubscription = async (customerId: string, priceId: string) => {
    return await getStripe().subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        expand: ["latest_invoice.payment_intent"],
    });
};

export const handleWebhook = async (req: Request) => {
    const body = await req.text();
    const sig = req.headers.get('stripe-signature')!;

    let event: Stripe.Event;
    try {
        event = getStripe().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
    } catch (err) {
        console.error('Stripe webhook verification failed:', err);
        return new Response('Webhook Error', { status: 400 });
    }

    return { event, body };
};
