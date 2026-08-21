const RolesRepository = require("../../../domain/ports/RolesRepository");

class InMemoryRolesRepository extends RolesRepository {
    constructor() {
        super();
        this.roles = [];
        this.contadorId = 0;
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

    async crear(rol) {
        this.contadorId += 1;
        const nuevo = { id: this.contadorId, name: rol.name, description: rol.description || null };
        this.roles.push(nuevo);
        return nuevo;
    }

    async eliminar(id) {
        const index = this.roles.findIndex(r => r.id === id);
        if (index === -1) throw new Error('Rol no encontrado');
        const eliminado = this.roles[index];
        this.roles.splice(index, 1);
        return { id: eliminado.id, eliminado: true };
    }

    async findAll() {
        return this.roles.map((r) => ({ ...r }));
    }
}

module.exports = InMemoryRolesRepository;
