const express = require('express');

/**
 * Función que configura las rutas públicas de bancos.
 * Recibe el controlador ya instanciado (con todas sus dependencias inyectadas).
 */
function createBancoRouter(bancoController) {
  const router = express.Router();

  router.get('/', (req, res) => bancoController.listarPublicos(req, res));

  return router;
}

module.exports = createBancoRouter;