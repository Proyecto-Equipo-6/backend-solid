const express = require('express');

/**
 * Función que configura las rutas de pedidos del cliente.
 * Requieren sesión iniciada y rol Cliente (RN-037, RN-039).
 * Recibe el controlador y los middlewares ya instanciados (DIP).
 */
function createPedidoRouter(pedidoController, autenticar, requerirCliente) {
  const router = express.Router();

  router.use(autenticar, requerirCliente);

  router.post('/', (req, res) => pedidoController.crear(req, res));

  return router;
}

module.exports = createPedidoRouter;