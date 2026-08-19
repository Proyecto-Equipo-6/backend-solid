const express = require('express');

/**
 * Rutas del módulo Admin de Usuarios (CU-026).
 * GET  /                       → listar usuarios (con filtros)
 * PUT  /:id/estado             → activar/desactivar usuario
 */
function createUsuarioAdminRouter(adminUsuarioController, autenticar, requerirAdmin) {
  const router = express.Router();

  router.use(autenticar);
  router.use(requerirAdmin);

  router.get('/', (req, res) => adminUsuarioController.listar(req, res));
  router.put('/:id/estado', (req, res) => adminUsuarioController.actualizarEstado(req, res));

  return router;
}

module.exports = createUsuarioAdminRouter;
