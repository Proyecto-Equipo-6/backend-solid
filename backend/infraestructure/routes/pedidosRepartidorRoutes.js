const express = require('express');
const { uploadEvidencia } = require('../middlewares/uploadMiddleware');

/**
 * Fábrica de rutas del módulo Repartidor (CU-015 a CU-018).
 * Recibe el controlador (que a su vez recibe los casos de uso inyectados)
 * y los middlewares ya instanciados (DIP).
 * Todas las rutas requieren sesión iniciada y rol Repartidor (RN-058).
 */
function createPedidosRepartidorRouter(repartidorController, autenticar, requerirRepartidor) {
  const router = express.Router();

  router.use(autenticar, requerirRepartidor);

  // CU-015: dashboard del repartidor
  router.get('/dashboard', (req, res) => repartidorController.dashboard(req, res));

  // CU-016: detalle de un pedido asignado
  router.get('/pedidos/:pedidoId/detalle', (req, res) => repartidorController.detalle(req, res));

  // CU-017: actualizar estado (ASIGNADO → EN_CAMINO → ENTREGADO / NO_ENTREGADO)
  router.patch('/pedidos/:pedidoId/estado', uploadEvidencia, (req, res) =>
    repartidorController.estado(req, res)
  );

  // CU-018: historial de pedidos finalizados
  router.get('/historial', (req, res) => repartidorController.historial(req, res));

  return router;
}

module.exports = createPedidosRepartidorRouter;
