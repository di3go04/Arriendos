/**
 * Commercial Kit — Interfaz de servicios white-label y soporte.
 *
 * Define el contrato que deben implementar los módulos de personalización
 * de marca (white-label) y el sistema de tickets de soporte multi-tenant.
 */

export interface ICommercialKitService {
  /**
   * Obtiene la configuración white-label de una organización.
   *
   * @param organizationId - UUID de la organización.
   * @returns Objeto con logo (URL), colores personalizados (mapa clave → valor hexadecimal)
   *          y dominio personalizado de la organización.
   */
  getWhiteLabelConfig(
    organizationId: string,
  ): Promise<{
    logo: string;
    colors: Record<string, string>;
    domain: string;
  }>;

  /**
   * Genera un ticket de soporte en nombre de un usuario.
   *
   * @param userId  - UUID del usuario que reporta.
   * @param subject - Asunto del ticket.
   * @param message - Cuerpo del mensaje.
   * @returns Indicador de éxito y, si se creó, el ID del ticket.
   */
  generateSupportTicket(
    userId: string,
    subject: string,
    message: string,
  ): Promise<{ ok: boolean; ticketId?: string }>;
}
