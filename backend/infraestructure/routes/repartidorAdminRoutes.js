const express = require('express');

/**
 * Rutas del módulo Admin de Repartidores (CU-021).
 * GET    /                       → listar repartidores (con filtros)
 * POST   /                       → crear repartidor
 * PUT    /:id                    → editar repartidor
 * DELETE /:id                    → eliminar (borrado lógico)
 * PUT    /:id/estado             → cambiar estado operativo
 */
function createRepartidorAdminRouter(repartidorAdminController, autenticar, requerirAdmin) {
  const router = express.Router();

  router.use(autenticar);
  router.use(requerirAdmin);

  router.get('/', (req, res) => repartidorAdminController.listar(req, res));
  router.post('/', (req, res) => repartidorAdminController.crear(req, res));
  router.put('/:id/estado', (req, res) => repartidorAdminController.cambiarEstado(req, res));
  router.put('/:id', (req, res) => repartidorAdminController.actualizar(req, res));
  router.delete('/:id', (req, res) => repartidorAdminController.eliminar(req, res));

  return router;
}

module.exports = createRepartidorAdminRouter;
