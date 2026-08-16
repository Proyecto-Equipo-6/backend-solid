const express = require('express');

/**
 * Función que configura las rutas públicas de reportes del panel administrativo.
 * Recibe el controlador ya instanciado (con todas sus dependencias inyectadas).
 */
function createAnaliticaRouter(analiticaController) {
  const router = express.Router();

  router.get('/resumen', (req, res) => analiticaController.obtenerResumen(req, res));

  return router;
}

module.exports = createAnaliticaRouter;