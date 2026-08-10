const nodemailer = require('nodemailer');
const EmailSender = require('../../domain/ports/EmailSender');

/**
 * Adaptador de Infraestructura: SmtpEmailSender
 * Implementa el puerto EmailSender usando Nodemailer vía SMTP.
 */
class SmtpEmailSender extends EmailSender {
  constructor() {
    super();
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async enviarRecuperacion({ to, token, nombre }) {
    const url = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/restablecer?token=${token}`;

    await this.transporter.sendMail({
      from: `"Nexbit" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to,
      subject: 'Recuperación de contraseña',
      text: [
        `Hola ${nombre},`,
        '',
        'Recibimos una solicitud para restablecer tu contraseña.',
        'Si no fuiste tú, ignora este correo.',
        '',
        `Para continuar, ingresa al siguiente enlace (válido por 15 minutos): ${url}`,
        '',
        'Equipo Nexbit',
      ].join('\n'),
      html: `
        <p>Hola <strong>${nombre}</strong>,</p>
        <p>Recibimos una solicitud para restablecer tu contraseña.</p>
        <p>Si no fuiste tú, ignora este correo.</p>
        <p>
          Para continuar, haz clic en el siguiente botón
          (válido por <strong>15 minutos</strong>):
        </p>
        <p style="text-align:center;">
          <a href="${url}"
             style="background:#333;color:#fff;padding:12px 24px;border-radius:8px;
                    text-decoration:none;display:inline-block;">
            Restablecer contraseña
          </a>
        </p>
        <p>Equipo Nexbit</p>
      `,
    });
  }
}

module.exports = SmtpEmailSender;
