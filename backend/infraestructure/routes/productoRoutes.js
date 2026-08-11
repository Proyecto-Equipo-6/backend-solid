const express = require('express');

/**
 * Función que configura las rutas públicas de productos (catálogo).
 * Recibe el controlador ya instanciado (con todas sus dependencias inyectadas).
 */
function createProductoRouter(productoController) {
  const router = express.Router();

  router.get('/publico', (req, res) => productoController.listarPublicos(req, res));
  router.get('/:id', (req, res) => productoController.obtenerPorId(req, res));

  return router;
}

module.exports = createProductoRouter;
