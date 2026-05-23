import { resend } from "@/lib/resend";

export const sendWelcomeEmail = async () => {
    if (!resend) {
        console.log("[Resend] Simulated welcome email – no API key");
        return;
    }

    await resend.emails.send({
        from: "no-reply@rentnow.app",
        to: "user@example.com",
        subject: "¡Bienvenido a la plataforma!",
        html: "<p>Gracias por registrarte. Aquí tienes los primeros pasos...</p>",
    });
};