/**
 * Port: EmailSender
 * Define el contrato que cualquier servicio de correo debe implementar.
 * (Principio de Inversión de Dependencias - DIP)
 */
class EmailSender {
  async enviarRecuperacion({ to, token, nombre }) {
    throw new Error("Método 'enviarRecuperacion' no implementado");
  }
}

module.exports = EmailSender;
