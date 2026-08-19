const { esNoEncontrado } = require('../helpers/responseHelpers');

/**
 * Adaptador de Infraestructura: AdminUsuarioController
 * Administra usuarios (CU-026): listar, activar/desactivar.
 */
class AdminUsuarioController {
  constructor({
    listarUsuariosAdminUseCase,
    actualizarEstadoUsuarioUseCase,
  }) {
    this.listarUsuariosAdminUseCase = listarUsuariosAdminUseCase;
    this.actualizarEstadoUsuarioUseCase = actualizarEstadoUsuarioUseCase;
  }

  async listar(req, res) {
    try {
      const { estado, rol, busqueda, page, limit } = req.query;
      const filtros = {};
      if (estado !== undefined) filtros.estado = Number(estado);
      if (rol) filtros.rol = Number(rol);
      if (busqueda) filtros.busqueda = busqueda;
      if (page) filtros.page = Number(page);
      if (limit) filtros.limit = Number(limit);

      const usuarios = await this.listarUsuariosAdminUseCase.execute(filtros);
      return res.status(200).json(usuarios);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  async actualizarEstado(req, res) {
    try {
      const id_usuario = Number(req.params.id);
      const { activo } = req.body;

      if (activo === undefined) {
        return res.status(400).json({ error: 'El campo activo es obligatorio' });
      }

      const resultado = await this.actualizarEstadoUsuarioUseCase.execute({
        id_usuario,
        activo: Boolean(activo),
        adminId: req.usuario.id_usuario,
      });
      return res.status(200).json(resultado);
    } catch (error) {
      const status = esNoEncontrado(error.message) ? 404 : 400;
      return res.status(status).json({ error: error.message });
    }
  }
}

module.exports = AdminUsuarioController;
