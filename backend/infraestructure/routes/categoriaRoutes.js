const express = require('express');

/**
 * Función que configura las rutas públicas de categorías.
 * Recibe el controlador ya instanciado (con todas sus dependencias inyectadas).
 */
function createCategoriaRouter(categoriaController) {
  const router = express.Router();

  router.get('/', (req, res) => categoriaController.listarPublicas(req, res));

  return router;
}

module.exports = createCategoriaRouter;
