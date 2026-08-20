const Rol = require('../domain/models/Rol');
const ErrorConflicto = require('./errors/ErrorConflicto');

/**
 * Caso de Uso: CrearRolUseCase
 * Crea un rol nuevo. Solo depende de la abstracción (RolesRepository).
 */
class CrearRolUseCase {
  constructor(rolesRepository) {
    this.rolesRepository = rolesRepository;
  }

  async execute({ name, description }) {
    const rol = new Rol(null, name, description);
    if (!name || !String(name).trim()) {
      throw new Error('El nombre del rol es obligatorio');
    }
    if (String(name).length > 30) {
      throw new Error('El nombre del rol no puede superar los 30 caracteres');
    }

    const existentes = await this.rolesRepository.findAll();
    const duplicado = existentes.some(
      (r) => String(r.name).toLowerCase() === String(name).trim().toLowerCase()
    );
    if (duplicado) {
      throw new ErrorConflicto('Ya existe un rol con ese nombre');
    }

    return this.rolesRepository.crear(rol);
  }
}

module.exports = CrearRolUseCase;