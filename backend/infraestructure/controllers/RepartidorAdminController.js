const { esNoEncontrado } = require('../helpers/responseHelpers');

/**
 * Adaptador de Infraestructura: RepartidorAdminController
 * Administra repartidores (CU-021): consultar lista y cambiar estado operativo.
 */
class RepartidorAdminController {
  constructor({
    consultarRepartidoresUseCase,
    cambiarEstadoOperativoRepartidorUseCase,
  }) {
    this.consultarRepartidoresUseCase = consultarRepartidoresUseCase;
    this.cambiarEstadoOperativoRepartidorUseCase = cambiarEstadoOperativoRepartidorUseCase;
  }

  async listar(req, res) {
    try {
      const { termino, estado } = req.query;
      const repartidores = await this.consultarRepartidoresUseCase.ejecutar({ termino, estado });
      return res.status(200).json(repartidores);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  async cambiarEstado(req, res) {
    try {
      const idRepartidor = Number(req.params.id);
      const { estado } = req.body;

      if (!estado) {
        return res.status(400).json({ error: 'El campo estado es obligatorio' });
      }

      const repartidor = await this.cambiarEstadoOperativoRepartidorUseCase.ejecutar(idRepartidor, estado);
      return res.status(200).json(repartidor);
    } catch (error) {
      const status = esNoEncontrado(error.message) ? 404 : 400;
      return res.status(status).json({ error: error.message });
    }
  }
}

module.exports = RepartidorAdminController;
