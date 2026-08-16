/**
 * Adaptador de Infraestructura: BancoController
 * Maneja las peticiones HTTP de bancos y las delega al Caso de Uso.
 */
class BancoController {
  constructor(listarBancosUseCase) {
    this.listarBancosUseCase = listarBancosUseCase;
  }

  async listarPublicos(req, res) {
    try {
      const bancos = await this.listarBancosUseCase.execute();
      return res.status(200).json(bancos);
    } catch (error) {
      const status = error.status || 500;
      return res.status(status).json({ error: error.message });
    }
  }
}

module.exports = BancoController;