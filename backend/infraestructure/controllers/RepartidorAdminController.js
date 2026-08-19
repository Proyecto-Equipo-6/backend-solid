const { esNoEncontrado, esConflicto } = require('../helpers/responseHelpers');

/**
 * Adaptador de Infraestructura: RepartidorAdminController
 * Administra repartidores (CU-021): consultar lista y cambiar estado operativo.
 */
class RepartidorAdminController {
  constructor({
    consultarRepartidoresUseCase,
    cambiarEstadoOperativoRepartidorUseCase,
    crearRepartidorAdminUseCase,
    actualizarRepartidorAdminUseCase,
    eliminarRepartidorAdminUseCase,
  }) {
    this.consultarRepartidoresUseCase = consultarRepartidoresUseCase;
    this.cambiarEstadoOperativoRepartidorUseCase = cambiarEstadoOperativoRepartidorUseCase;
    this.crearRepartidorAdminUseCase = crearRepartidorAdminUseCase;
    this.actualizarRepartidorAdminUseCase = actualizarRepartidorAdminUseCase;
    this.eliminarRepartidorAdminUseCase = eliminarRepartidorAdminUseCase;
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

  async crear(req, res) {
    try {
      const resultado = await this.crearRepartidorAdminUseCase.execute(req.body);
      return res.status(201).json(resultado);
    } catch (error) {
      const status = esConflicto(error.message) ? 409 : 400;
      return res.status(status).json({ error: error.message });
    }
  }

  async actualizar(req, res) {
    try {
      const resultado = await this.actualizarRepartidorAdminUseCase.execute({
        id: req.params.id,
        ...req.body,
      });
      return res.status(200).json(resultado);
    } catch (error) {
      const status = esNoEncontrado(error.message) ? 404 : 400;
      return res.status(status).json({ error: error.message });
    }
  }

  async eliminar(req, res) {
    try {
      const resultado = await this.eliminarRepartidorAdminUseCase.execute({ id: req.params.id });
      return res.status(200).json(resultado);
    } catch (error) {
      const status = esNoEncontrado(error.message) ? 404 : 400;
      return res.status(status).json({ error: error.message });
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
