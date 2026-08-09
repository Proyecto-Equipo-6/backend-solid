const RolesRepository = require("../../domain/ports/RolesRepository");

class InMemoryRolesRepository extends RolesRepository {
    constructor() {
        super();
        this.roles = [];
    }

    async update(rol) {
        const index = this.roles.findIndex(r => r.id === rol.id);
        if (index !== -1) {
            this.roles[index] = {
                ...this.roles[index],
                name: rol.name,
                description: rol.description
            };
            return this.roles[index];
        }
        throw new Error("Rol no encontrado");
    }
}

module.exports = InMemoryRolesRepository;