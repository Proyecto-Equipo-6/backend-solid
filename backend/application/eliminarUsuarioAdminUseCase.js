const ErrorValidacion = require('./errors/ErrorValidacion');
const ErrorNoEncontrado = require('./errors/ErrorNoEncontrado');
const { ROL_REPARTIDOR } = require('../constants');

/**
 * Caso de Uso: EliminarUsuarioAdminUseCase
 * Desactiva un usuario (borrado lógico). No permite desactivar al propio administrador.
 */
class EliminarUsuarioAdminUseCase {
  constructor(userRepository, repartidorRepository = null) {
    this.userRepository = userRepository;
    this.repartidorRepository = repartidorRepository;
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

    const resultado = await this.userRepository.updateEstado(idUsuario, false);

    if (Number(usuario.id_rol) === ROL_REPARTIDOR) {
      await this.sincronizarEstadoRepartidor(idUsuario);
    }

    return resultado;
  }

  async sincronizarEstadoRepartidor(id_usuario) {
    if (!this.repartidorRepository || typeof this.repartidorRepository.buscarPorId !== 'function') {
      return;
    }
    try {
      const repartidor = await this.repartidorRepository.buscarPorId(id_usuario);
      if (repartidor) {
        await this.repartidorRepository.actualizar(id_usuario, { estado: 'INACTIVO' });
      }
    } catch (error) {
      console.error(`Error sincronizando estado del repartidor ${id_usuario}:`, error.message);
    }
  }
}

module.exports = EliminarUsuarioAdminUseCase;