const express = require('express');

/**
 * Función que configura las rutas de productos.
 * GET /publico y GET /:id son públicos (catálogo). El CRUD administrativo
 * (CU-023) requiere sesión de Administrador (id_rol = 1).
 */
function createProductoRouter(productoController, autenticar, requerirAdmin) {
  const router = express.Router();

  router.get('/publico', (req, res) => productoController.listarPublicos(req, res));
  router.get('/:id', (req, res) => productoController.obtenerPorId(req, res));

  router.post('/', autenticar, requerirAdmin, (req, res) => productoController.crear(req, res));
  router.put('/:id', autenticar, requerirAdmin, (req, res) => productoController.editar(req, res));
  router.delete('/:id', autenticar, requerirAdmin, (req, res) => productoController.eliminar(req, res));
  router.put('/:id/ajustar-stock', autenticar, requerirAdmin, (req, res) => productoController.ajustarStock(req, res));

  return router;
}

module.exports = createProductoRouter;