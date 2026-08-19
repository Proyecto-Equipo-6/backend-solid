class AdminUpdateRolController {
    constructor(updateAdminRoleUseCase, rolesRepository, crearRolUseCase, eliminarRolUseCase) {
        this.updateAdminRoleUseCase = updateAdminRoleUseCase;
        this.rolesRepository = rolesRepository;
        this.crearRolUseCase = crearRolUseCase;
        this.eliminarRolUseCase = eliminarRolUseCase;
    }

    async update(req, res) {
        try {
            const { id, name, description } = req.body;
            const adminRole = await this.updateAdminRoleUseCase.execute({ id, name, description });
            return res.status(200).json(adminRole);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }

    async crear(req, res) {
        try {
            const { name, description } = req.body;
            const rol = await this.crearRolUseCase.execute({ name, description });
            return res.status(201).json(rol);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }

    async eliminar(req, res) {
        try {
            const { id } = req.params;
            const resultado = await this.eliminarRolUseCase.execute({ id });
            return res.status(200).json(resultado);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }

    async listar(req, res) {
        try {
            const roles = await this.rolesRepository.findAll();
            return res.status(200).json(roles);
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
}

module.exports = AdminUpdateRolController;
