const ErrorValidacion = require('./errors/ErrorValidacion');
const ErrorNoEncontrado = require('./errors/ErrorNoEncontrado');

/**
 * Caso de Uso: EliminarUsuarioAdminUseCase
 * Desactiva un usuario (borrado lógico). No permite desactivar al propio administrador.
 */
class EliminarUsuarioAdminUseCase {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async execute({ id, adminId }) {
    const idUsuario = Number(id);
    if (idUsuario === Number(adminId)) {
      throw new ErrorValidacion('No puedes desactivar tu propia cuenta de administrador');
    }

    const usuario = await this.userRepository.findById(idUsuario);
    if (!usuario) {
      throw new ErrorNoEncontrado('Usuario no encontrado');
    }

    return this.userRepository.updateEstado(idUsuario, false);
  }
}

module.exports = EliminarUsuarioAdminUseCase;