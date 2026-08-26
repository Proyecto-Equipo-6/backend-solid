const { ROL_REPARTIDOR } = require('../constants');

/**
 * Caso de Uso: ActualizarEstadoUsuarioUseCase
 * Activa o desactiva un usuario (CU-026).
 * CA-002: el admin no puede desactivar su propia cuenta.
 */
class ActualizarEstadoUsuarioUseCase {
  constructor(userRepository, repartidorRepository = null) {
    this.userRepository = userRepository;
    this.repartidorRepository = repartidorRepository;
  }

  async execute({ id_usuario, activo, adminId }) {
    if (id_usuario === adminId) {
      throw new Error('No puedes desactivar tu propia cuenta. Solicita a otro administrador.');
    }

    const usuario = await this.userRepository.findById(id_usuario);
    if (!usuario) {
      throw new Error('Usuario no encontrado');
    }

    const resultado = await this.userRepository.updateEstado(id_usuario, activo);

    // Mantiene sincronizado el estado operativo del repartidor: si se
    // activa/desactiva un usuario con rol repartidor, se refleja también en
    // la tabla repartidores para que aparezca/desaparezca en la gestión de
    // repartidores y no se le puedan asignar pedidos.
    if (Number(usuario.id_rol) === ROL_REPARTIDOR) {
      await this.sincronizarEstadoRepartidor(id_usuario, activo);
    }

    return resultado;
  }

  async sincronizarEstadoRepartidor(id_usuario, activo) {
    if (!this.repartidorRepository || typeof this.repartidorRepository.buscarPorId !== 'function') {
      return;
    }
    try {
      const repartidor = await this.repartidorRepository.buscarPorId(id_usuario);
      if (repartidor) {
        await this.repartidorRepository.actualizar(id_usuario, {
          estado: activo ? 'DISPONIBLE' : 'INACTIVO',
        });
      }
    } catch (error) {
      console.error(`Error sincronizando estado del repartidor ${id_usuario}:`, error.message);
    }
  }
}

module.exports = ActualizarEstadoUsuarioUseCase;
