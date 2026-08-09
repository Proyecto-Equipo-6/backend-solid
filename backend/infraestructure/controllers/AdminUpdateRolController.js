class AdminUpdateRolController {
    constructor(updateAdminRoleUseCase) {
        this.updateAdminRoleUseCase = updateAdminRoleUseCase;
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
    }

module.exports = AdminUpdateRolController;
