const ErrorConflicto = require('./errors/ErrorConflicto');

/**
 * Caso de Uso: EliminarRolUseCase
 * Elimina un rol siempre que no esté asignado a usuarios.
 */
class EliminarRolUseCase {
  constructor(rolesRepository, userRepository) {
    this.rolesRepository = rolesRepository;
    this.userRepository = userRepository;
  }

  async execute({ id }) {
    const rolId = Number(id);
    const enUso = await this.userRepository.contarPorRol(rolId);
    if (enUso > 0) {
      throw new ErrorConflicto('No se puede eliminar un rol que está asignado a usuarios');
    }
    return this.rolesRepository.eliminar(rolId);
  }
}

module.exports = EliminarRolUseCase;