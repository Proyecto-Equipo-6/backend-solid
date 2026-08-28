const express = require('express');

/**
 * Función que configura las rutas de pedidos del cliente.
 * Requieren sesión iniciada y rol Cliente (RN-037, RN-039).
 * GET /:id/ticket → generar el ticket del pedido propio del cliente (CU-031).
 * Recibe el controlador y los middlewares ya instanciados (DIP).
 */
function createPedidoRouter(pedidoController, autenticar, requerirCliente) {
  const router = express.Router();

  router.use(autenticar, requerirCliente);

  router.get('/', (req, res) => pedidoController.ver(req, res));
  router.post('/', (req, res) => pedidoController.crear(req, res));
  router.get('/:id/ticket', (req, res) => pedidoController.ticket(req, res));
  router.get('/:id', (req, res) => pedidoController.detalle(req, res));
  router.delete('/:id', (req, res) => pedidoController.cancelar(req, res));

  return router;
}

module.exports = createPedidoRouter;