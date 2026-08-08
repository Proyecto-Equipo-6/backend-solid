const express = require('express');

/**
 * Función que configura las rutas de usuario.
 * Recibe el controlador ya instanciado (con todas sus dependencias inyectadas).
 */
function createUserRouter(userController) {
  const router = express.Router();

  // Definimos la ruta POST y la asociamos al método create del controlador
  router.post('/', (req, res) => userController.create(req, res));

  return router;
}

module.exports = createUserRouter;
