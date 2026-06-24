import { resend } from "@/lib/resend";

export const sendWelcomeEmail = async () => {
    if (!resend) {
        console.warn("[Resend] Welcome email not sent: RESEND_API_KEY not configured");
        return;
    }

    await resend.emails.send({
        from: "no-reply@rentnow.app",
        to: "user@example.com",
        subject: "¡Bienvenido a la plataforma!",
        html: "<p>Gracias por registrarte. Aquí tienes los primeros pasos...</p>",
    });
};