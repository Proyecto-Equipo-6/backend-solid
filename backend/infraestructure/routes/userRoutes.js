const express = require('express');

/**
 * Función que configura las rutas de usuario.
 * Recibe el controlador y el middleware de autenticación ya instanciados
 * (con todas sus dependencias inyectadas).
 */
function createUserRouter(userController, autenticar) {
  const router = express.Router();

  // Definimos la ruta POST y la asociamos al método create del controlador
  router.post('/', (req, res) => userController.create(req, res));

  // Perfil del usuario autenticado (CU-004): requiere sesión válida (JWT)
  router.get('/perfil', autenticar, (req, res) => userController.perfil(req, res));

  // Editar perfil del usuario autenticado (CU-005): requiere sesión válida (JWT)
  router.put('/perfil', autenticar, (req, res) => userController.actualizar(req, res));

  return router;
}

module.exports = createUserRouter;
