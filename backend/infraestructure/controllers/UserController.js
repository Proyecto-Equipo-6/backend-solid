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
      const { id, name, email } = req.body;
      const user = await this.createUserUseCase.execute({ id, name, email });
      return res.status(201).json(user);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }
}

module.exports = UserController;
