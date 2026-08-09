const Rol = require('../domain/models/Rol');

/**
 * Caso de Uso: UpdateRolUseCase
 * Contiene la lógica de aplicación para actualizar un rol.
 * Solo depende de la abstracción (RolRepository), no de bases de datos específicas.
 */
class UpdateRolUseCase {
    constructor(rolesRepository) {
        this.rolesRepository = rolesRepository;
    }

    async execute({ id, name, description }) {
        const rol = new Rol(id, name, description);
        return await this.rolesRepository.update(rol);
    }
}

module.exports = UpdateRolUseCase;
