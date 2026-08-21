const bcrypt = require('bcrypt');
const ErrorTokenInvalido = require('./errors/ErrorTokenInvalido');
const ErrorValidacion = require('./errors/ErrorValidacion');

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

    const passwordValida =
      typeof nueva_password === 'string' &&
      nueva_password.length >= 8 &&
      /[A-Z]/.test(nueva_password) &&
      /[0-9]/.test(nueva_password);

    if (!passwordValida) {
      throw new ErrorValidacion('La contraseña debe tener mínimo 8 caracteres, una mayúscula y un número');
    }

    const registro = await this.tokensRepository.findByToken(token);
    if (!registro || registro.usado === 1 || new Date(registro.expira_en) < new Date()) {
      throw new ErrorTokenInvalido();
    }

    const usuario = await this.userRepository.findById(registro.id_usuario);
    if (!usuario) {
      throw new ErrorTokenInvalido();
    }

    // RN-021: la nueva contraseña debe ser diferente a la anterior.
    const esIgualAnterior = await bcrypt.compare(nueva_password, usuario.password);
    if (esIgualAnterior) {
      throw new ErrorValidacion('La nueva contraseña debe ser diferente a la anterior');
    }

    const saltRounds = Number(process.env.BCRYPT_ROUNDS) || 10;
    const hash = await bcrypt.hash(nueva_password, saltRounds);

    await this.userRepository.updatePassword(usuario.id_usuario ?? usuario.id, hash);
    await this.tokensRepository.marcarUsado(token);

    return { mensaje: 'Contraseña actualizada correctamente. Por favor inicie sesión' };
  }
}

module.exports = RestablecerContrasenaUseCase;