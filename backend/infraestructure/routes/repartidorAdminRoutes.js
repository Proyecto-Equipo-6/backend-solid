const express = require('express');

/**
 * Rutas del módulo Admin de Repartidores (CU-021).
 * GET  /                       → listar repartidores (con filtros)
 * PUT  /:id/estado             → cambiar estado operativo
 */
function createRepartidorAdminRouter(repartidorAdminController, autenticar, requerirAdmin) {
  const router = express.Router();

  router.use(autenticar);
  router.use(requerirAdmin);

  router.get('/', (req, res) => repartidorAdminController.listar(req, res));
  router.put('/:id/estado', (req, res) => repartidorAdminController.cambiarEstado(req, res));

  return router;
}

module.exports = createRepartidorAdminRouter;
