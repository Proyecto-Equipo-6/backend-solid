const express = require('express');

/**
 * Función que configura las rutas del CRUD de proveedores (CU-025).
 * Recibe el controlador ya instanciado y los middlewares de autorización.
 * Todas las rutas requieren sesión de Administrador (id_rol = 1).
 */
function createProveedorRouter(proveedorController, autenticar, requerirAdmin) {
  const router = express.Router();

  router.use(autenticar);
  router.use(requerirAdmin);

  router.get('/', (req, res) => proveedorController.listarActivos(req, res));
  router.post('/', (req, res) => proveedorController.crear(req, res));
  router.put('/:id', (req, res) => proveedorController.editar(req, res));
  router.delete('/:id', (req, res) => proveedorController.eliminar(req, res));

  return router;
}

module.exports = createProveedorRouter;