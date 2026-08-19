const bcrypt = require('bcrypt');
const ErrorTokenInvalido = require('./errors/ErrorTokenInvalido');

/**
 * Caso de Uso: RestablecerContrasenaUseCase
 * Valida el token, actualiza la contraseña cifrada e invalida el token (RN-006).
 */
class RestablecerContrasenaUseCase {
  constructor(userRepository, tokensRepository) {
    this.userRepository = userRepository;
    this.tokensRepository = tokensRepository;
  }

  async execute({ token, nueva_password }) {
    if (!token) {
      throw new ErrorTokenInvalido();
    }

    if (
      !nueva_password ||
      typeof nueva_password !== 'string' ||
      nueva_password.length < 8 ||
      nueva_password.length > 20
    ) {
      throw new Error('La contraseña debe tener entre 8 y 20 caracteres.');
    }

    const registro = await this.tokensRepository.findByToken(token);
    if (!registro || registro.usado === 1 || new Date(registro.expira_en) < new Date()) {
      throw new ErrorTokenInvalido();
    }

    const usuario = await this.userRepository.findById(registro.id_usuario);
    if (!usuario) {
      throw new ErrorTokenInvalido();
    }

    const saltRounds = Number(process.env.BCRYPT_ROUNDS) || 10;
    const hash = await bcrypt.hash(nueva_password, saltRounds);

    await this.userRepository.updatePassword(usuario.id_usuario ?? usuario.id, hash);
    await this.tokensRepository.marcarUsado(token);

    return { mensaje: 'Contraseña actualizada correctamente. Por favor inicie sesión' };
  }
}

module.exports = RestablecerContrasenaUseCase;
