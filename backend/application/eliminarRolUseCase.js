const ErrorConflicto = require('./errors/ErrorConflicto');
const { ROL_ADMIN, ROL_CLIENTE, ROL_REPARTIDOR } = require('../constants');

/**
 * Caso de Uso: EliminarRolUseCase
 * Elimina un rol siempre que no esté asignado a usuarios.
 * RN-105 / RN-009-02 / RN-009-04: los roles del sistema (Administrador,
 * Cliente y Repartidor) son protegidos y no pueden ser eliminados.
 */
class EliminarRolUseCase {
  constructor(rolesRepository, userRepository) {
    this.rolesRepository = rolesRepository;
    this.userRepository = userRepository;
  }

  async execute({ id }) {
    const rolId = Number(id);

    const rolesProtegidos = [ROL_ADMIN, ROL_CLIENTE, ROL_REPARTIDOR];
    if (rolesProtegidos.includes(rolId)) {
      throw new ErrorConflicto('Los roles del sistema no pueden ser eliminados');
    }

    const enUso = await this.userRepository.contarPorRol(rolId);
    if (enUso > 0) {
      throw new ErrorConflicto('No se puede eliminar un rol que está asignado a usuarios');
    }
    return this.rolesRepository.eliminar(rolId);
  }
}

module.exports = EliminarRolUseCase;