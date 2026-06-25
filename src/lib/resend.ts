import { Resend } from "resend";

/**
 * Centralized Resend client.
 * In development (or when RESEND_API_KEY is missing) the client is null
 * and email sending is simulated via console.log.
 */
export const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;