const crypto = require('node:crypto');

const MENSAJE_GENERICO = 'Recibirá un enlace de recuperación a su correo electrónico';
const MINUTOS_VALIDEZ_TOKEN = Number(process.env.TOKEN_RECUPERACION_MINUTOS) || 15;

/**
 * Caso de Uso: SolicitarRecuperacionUseCase
 * Genera un token temporal y envía el correo de recuperación.
 * No revela si el correo está registrado (RNF-004).
 */
class SolicitarRecuperacionUseCase {
  constructor(userRepository, tokensRepository, emailSender) {
    this.userRepository = userRepository;
    this.tokensRepository = tokensRepository;
    this.emailSender = emailSender;
  }

  async execute({ email }) {
    const usuario = email ? await this.userRepository.findByEmail(email) : null;

    if (!usuario) {
      return { mensaje: MENSAJE_GENERICO };
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiraEn = new Date(Date.now() + MINUTOS_VALIDEZ_TOKEN * 60 * 1000);

    await this.tokensRepository.save({
      id_usuario: usuario.id_usuario ?? usuario.id,
      token,
      expira_en: expiraEn,
    });

    try {
      await this.emailSender.enviarRecuperacion({
        to: usuario.email,
        token,
        nombre: usuario.nombre_apellido,
      });
    } catch (error) {
      throw new Error('No se pudo enviar el correo de recuperación. Inténtalo de nuevo más tarde.');
    }

    return { mensaje: MENSAJE_GENERICO };
  }
}

module.exports = SolicitarRecuperacionUseCase;
