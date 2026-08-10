/**
 * Adaptador de Infraestructura: UserController
 * Maneja las peticiones HTTP y las delega al Caso de Uso correspondiente.
 */
class UserController {
  constructor(createUserUseCase) {
    this.createUserUseCase = createUserUseCase;
  }

  async create(req, res) {
    try {
      const user = await this.createUserUseCase.execute(req.body);
      return res.status(201).json(user);
    } catch (error) {
      const status = error.status || 400;
      return res.status(status).json({ error: error.message });
    }
  }
}

module.exports = UserController;
