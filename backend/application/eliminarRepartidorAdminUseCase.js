const ErrorNoEncontrado = require('./errors/ErrorNoEncontrado');

/**
 * Caso de Uso: EliminarRepartidorAdminUseCase
 * Desactiva un repartidor (borrado lógico) junto con su usuario.
 */
class EliminarRepartidorAdminUseCase {
  constructor(userRepository, repartidorRepository) {
    this.userRepository = userRepository;
    this.repartidorRepository = repartidorRepository;
  }

  async execute({ id }) {
    const idUsuario = Number(id);
    const repartidor = await this.repartidorRepository.buscarPorId(idUsuario);
    if (!repartidor) {
      throw new ErrorNoEncontrado('Repartidor no encontrado');
    }

    await this.repartidorRepository.eliminar(idUsuario);
    await this.userRepository.updateEstado(idUsuario, false);

    return { mensaje: 'Repartidor eliminado correctamente.', id_usuario: idUsuario };
  }
}

module.exports = EliminarRepartidorAdminUseCase;