const express = require('express');
const { autenticar, requerirCliente } = require('../middlewares/autenticacion');

/**
 * Función que configura las rutas del carrito.
 * Todas requieren sesión iniciada y rol Cliente (RN-037, RN-039).
 */
function createCarritoRouter(carritoController) {
  const router = express.Router();

  router.use(autenticar, requerirCliente);

  router.get('/', (req, res) => carritoController.ver(req, res));
  router.post('/', (req, res) => carritoController.agregar(req, res));
  router.put('/:productoId', (req, res) => carritoController.actualizar(req, res));
  router.delete('/:productoId', (req, res) => carritoController.eliminar(req, res));

  return router;
}

module.exports = createCarritoRouter;