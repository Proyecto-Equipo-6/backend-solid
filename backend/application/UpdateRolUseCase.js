const Rol = require('../domain/models/Rol');
const ErrorConflicto = require('./errors/ErrorConflicto');
const { ROL_ADMIN, ROL_CLIENTE, ROL_REPARTIDOR } = require('../constants');

/**
 * Caso de Uso: UpdateRolUseCase
 * Contiene la lógica de aplicación para actualizar un rol.
 * Solo depende de la abstracción (RolRepository), no de bases de datos específicas.
 * RN-105 / RN-009-02: los roles del sistema no pueden ser renombrados.
 * RN-104: el nombre del rol debe ser único.
 */
class UpdateRolUseCase {
    constructor(rolesRepository) {
        this.rolesRepository = rolesRepository;
    }

    async execute({ id, name, description }) {
        const rol = new Rol(id, name, description);
        if (!rol.isValid()) {
            throw new Error('Datos de rol inválidos.');
        }

        const rolId = Number(id);
        const rolesProtegidos = [ROL_ADMIN, ROL_CLIENTE, ROL_REPARTIDOR];
        if (rolesProtegidos.includes(rolId)) {
            const existente = await this.rolesRepository.findAll();
            const actual = existente.find((r) => Number(r.id) === rolId);
            if (actual && String(actual.name).toLowerCase() !== String(name).trim().toLowerCase()) {
                throw new ErrorConflicto('Los roles del sistema no pueden ser renombrados');
            }
        }

        // RN-104: unicidad del nombre, excluyendo el propio rol.
        const existentes = await this.rolesRepository.findAll();
        const duplicado = existentes.some(
            (r) =>
                Number(r.id) !== rolId &&
                String(r.name).toLowerCase() === String(name).trim().toLowerCase()
        );
        if (duplicado) {
            throw new ErrorConflicto('Ya existe un rol con ese nombre');
        }

        return await this.rolesRepository.update(rol);
    }
}

module.exports = UpdateRolUseCase;
