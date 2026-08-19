const express = require('express');

/**
 * Rutas del módulo Admin de Usuarios (CU-026).
 * GET    /                   → listar usuarios (con filtros)
 * POST   /                   → crear usuario
 * PUT    /:id                → editar usuario
 * DELETE /:id                → desactivar usuario (borrado lógico)
 * PUT    /:id/estado         → activar/desactivar usuario
 */
function createUsuarioAdminRouter(adminUsuarioController, autenticar, requerirAdmin) {
  const router = express.Router();

  router.use(autenticar);
  router.use(requerirAdmin);

  router.get('/', (req, res) => adminUsuarioController.listar(req, res));
  router.post('/', (req, res) => adminUsuarioController.crear(req, res));
  router.put('/:id/estado', (req, res) => adminUsuarioController.actualizarEstado(req, res));
  router.put('/:id', (req, res) => adminUsuarioController.actualizar(req, res));
  router.delete('/:id', (req, res) => adminUsuarioController.eliminar(req, res));

  return router;
}

module.exports = createUsuarioAdminRouter;
