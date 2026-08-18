const express = require('express');

/**
 * Función que configura las rutas de reportes del panel administrativo.
 * Recibe el controlador ya instanciado (con todas sus dependencias inyectadas).
 * Todas las rutas requieren sesión de Administrador (id_rol = 1).
 */
function createAnaliticaRouter(analiticaController, autenticar, requerirAdmin) {
  const router = express.Router();

  router.use(autenticar);
  router.use(requerirAdmin);

  router.get('/resumen', (req, res) => analiticaController.obtenerResumen(req, res));

  return router;
}

module.exports = createAnaliticaRouter;