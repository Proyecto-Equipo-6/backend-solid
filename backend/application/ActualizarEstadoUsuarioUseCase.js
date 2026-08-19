/**
 * Caso de Uso: ActualizarEstadoUsuarioUseCase
 * Activa o desactiva un usuario (CU-026).
 * CA-002: el admin no puede desactivar su propia cuenta.
 */
class ActualizarEstadoUsuarioUseCase {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async execute({ id_usuario, activo, adminId }) {
    if (id_usuario === adminId) {
      throw new Error('No puedes desactivar tu propia cuenta. Solicita a otro administrador.');
    }

    const usuario = await this.userRepository.findById(id_usuario);
    if (!usuario) {
      throw new Error('Usuario no encontrado');
    }

    return await this.userRepository.updateEstado(id_usuario, activo);
  }
}

module.exports = ActualizarEstadoUsuarioUseCase;
