const express = require('express');

/**
 * Función que configura las rutas de categorías.
 * GET / es público (catálogo). El CRUD administrativo (CU-022) requiere
 * sesión de Administrador (id_rol = 1).
 */
function createCategoriaRouter(categoriaController, autenticar, requerirAdmin) {
  const router = express.Router();

  router.get('/', (req, res) => categoriaController.listarPublicas(req, res));
  router.get('/todas', autenticar, requerirAdmin, (req, res) => categoriaController.listarTodas(req, res));

  router.post('/', autenticar, requerirAdmin, (req, res) => categoriaController.crear(req, res));
  router.put('/:id', autenticar, requerirAdmin, (req, res) => categoriaController.editar(req, res));
  router.delete('/:id', autenticar, requerirAdmin, (req, res) => categoriaController.eliminar(req, res));

  return router;
}

module.exports = createCategoriaRouter;