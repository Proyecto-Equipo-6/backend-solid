const express = require('express');

/**
 * Rutas del módulo Admin de Pedidos (CU-027).
 * GET  /                       → listar pedidos (con filtros)
 * GET  /:id                    → detalle de pedido
 * PUT  /:id/estado             → actualizar estado
 * PUT  /:id/cancelar           → cancelar pedido
 * PUT  /:id/asignar            → asignar repartidor
 */
function createPedidoAdminRouter(pedidoAdminController, autenticar, requerirAdmin) {
  const router = express.Router();

  router.use(autenticar);
  router.use(requerirAdmin);

  router.get('/', (req, res) => pedidoAdminController.listar(req, res));
  router.get('/:id', (req, res) => pedidoAdminController.detalle(req, res));
  router.put('/:id/estado', (req, res) => pedidoAdminController.actualizarEstado(req, res));
  router.put('/:id/cancelar', (req, res) => pedidoAdminController.cancelar(req, res));
  router.put('/:id/asignar', (req, res) => pedidoAdminController.asignarRepartidor(req, res));

  return router;
}

module.exports = createPedidoAdminRouter;
