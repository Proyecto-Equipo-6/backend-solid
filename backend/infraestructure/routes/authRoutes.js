const express = require('express');

/**
 * Función que configura las rutas de autenticación.
 * Recibe el controlador ya instanciado (con todas sus dependencias inyectadas).
 */
function createAuthRouter(authController) {
  const router = express.Router();

  router.post('/login', (req, res) => authController.login(req, res));

  return router;
}

module.exports = createAuthRouter;
