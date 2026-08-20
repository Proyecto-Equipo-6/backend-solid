const { esNoEncontrado, esConflicto } = require('../helpers/responseHelpers');

/**
 * Adaptador de Infraestructura: AdminUsuarioController
 * Administra usuarios (CU-026): listar, activar/desactivar.
 */
class AdminUsuarioController {
  constructor({
    listarUsuariosAdminUseCase,
    actualizarEstadoUsuarioUseCase,
    crearUsuarioAdminUseCase,
    actualizarUsuarioAdminUseCase,
    eliminarUsuarioAdminUseCase,
  }) {
    this.listarUsuariosAdminUseCase = listarUsuariosAdminUseCase;
    this.actualizarEstadoUsuarioUseCase = actualizarEstadoUsuarioUseCase;
    this.crearUsuarioAdminUseCase = crearUsuarioAdminUseCase;
    this.actualizarUsuarioAdminUseCase = actualizarUsuarioAdminUseCase;
    this.eliminarUsuarioAdminUseCase = eliminarUsuarioAdminUseCase;
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

  async crear(req, res) {
    try {
      const resultado = await this.crearUsuarioAdminUseCase.execute(req.body);
      return res.status(201).json(resultado);
    } catch (error) {
      const status = esConflicto(error.message) ? 409 : 400;
      return res.status(status).json({ error: error.message });
    }
  }

  async actualizar(req, res) {
    try {
      const resultado = await this.actualizarUsuarioAdminUseCase.execute({
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
      const resultado = await this.eliminarUsuarioAdminUseCase.execute({
        id: req.params.id,
        adminId: req.usuario.id_usuario,
      });
      return res.status(200).json(resultado);
    } catch (error) {
      const status = esNoEncontrado(error.message) ? 404 : 400;
      return res.status(status).json({ error: error.message });
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
