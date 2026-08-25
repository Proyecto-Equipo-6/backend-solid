const express = require('express');
const { uploadEvidencia } = require('../middlewares/uploadMiddleware');

/**
 * Rutas del módulo Admin de Pedidos (CU-027, CU-031).
 * GET  /                       → listar pedidos (con filtros)
 * GET  /:id                    → detalle de pedido
 * GET  /:id/ticket             → generar ticket HTML (CU-031)
 * PUT  /:id/estado             → actualizar estado
 * PUT  /:id/cancelar           → cancelar pedido
 * PUT  /:id/asignar            → asignar repartidor
 * PUT  /:id/desasignar         → quitar repartidor asignado
 * PUT  /:id/entregar           → marcar como entregado con comprobante (CU-017)
 */
function createPedidoAdminRouter(pedidoAdminController, autenticar, requerirAdmin) {
  const router = express.Router();

  router.use(autenticar);
  router.use(requerirAdmin);

  router.get('/', (req, res) => pedidoAdminController.listar(req, res));
  router.get('/:id', (req, res) => pedidoAdminController.detalle(req, res));
  router.get('/:id/ticket', (req, res) => pedidoAdminController.ticket(req, res));
  router.put('/:id/estado', (req, res) => pedidoAdminController.actualizarEstado(req, res));
  router.put('/:id/cancelar', (req, res) => pedidoAdminController.cancelar(req, res));
  router.put('/:id/asignar', (req, res) => pedidoAdminController.asignarRepartidor(req, res));
  router.put('/:id/desasignar', (req, res) => pedidoAdminController.desasignarRepartidor(req, res));
  router.put('/:id/entregar', uploadEvidencia, (req, res) => pedidoAdminController.entregarPedido(req, res));

  return router;
}

module.exports = createPedidoAdminRouter;
