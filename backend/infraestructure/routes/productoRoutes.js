const express = require('express');

/**
 * Función que configura las rutas del catálogo público.
 * Recibe el controlador ya instanciado (con todas sus dependencias inyectadas).
 */
function createProductoRouter(productoController) {
  const router = express.Router();

  router.get('/publico', (req, res) => productoController.listar(req, res));
  router.get('/buscar', (req, res) => productoController.buscar(req, res));
  router.get('/:id', (req, res) => productoController.detalle(req, res));

  return router;
}

module.exports = createProductoRouter;