import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-04-22.dahlia',
});

export const createSubscription = async (customerId: string, priceId: string) => {
    return await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        expand: ["latest_invoice.payment_intent"],
    });
};

export const handleWebhook = async (req: Request) => {
    const sig = req.headers.get("stripe-signature")!;
    const body = await req.text();

    let event;
    try {
        event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
    } catch (err) {
        return new Response(`Webhook error: ${err}`, { status: 400 });
    }

    if (event.type === "invoice.payment_failed") {
        // TODO: add recovery logic
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
};