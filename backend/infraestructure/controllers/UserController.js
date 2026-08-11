/**
 * Adaptador de Infraestructura: UserController
 * Maneja las peticiones HTTP de usuario y las delega al Caso de Uso correspondiente.
 */
class UserController {
  constructor(createUserUseCase, obtenerPerfilUseCase, actualizarPerfilUseCase) {
    this.createUserUseCase = createUserUseCase;
    this.obtenerPerfilUseCase = obtenerPerfilUseCase;
    this.actualizarPerfilUseCase = actualizarPerfilUseCase;
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

  async perfil(req, res) {
    try {
      const perfil = await this.obtenerPerfilUseCase.execute({
        id_usuario: req.usuario.id_usuario,
      });
      return res.status(200).json(perfil);
    } catch (error) {
      const status = error.status || 500;
      return res.status(status).json({ error: error.message });
    }
  }

  async actualizar(req, res) {
    try {
      const resultado = await this.actualizarPerfilUseCase.execute({
        id_usuario: req.usuario.id_usuario,
        password: req.body.password,
        datos: req.body,
      });
      return res.status(200).json(resultado);
    } catch (error) {
      const status = error.status || 400;
      return res.status(status).json({ error: error.message });
    }
  }
}

module.exports = UserController;
