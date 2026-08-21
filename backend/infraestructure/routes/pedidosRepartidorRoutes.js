const express = require('express');
const crearDashboardPedidosController = require('../controllers/dashboardPedidosController');
const crearDetallePedidoController = require('../controllers/detallePedidoController');
const crearActualizarEstadoPedidoController = require('../controllers/actualizarEstadoPedidoController');
const crearHistorialPedidosController = require('../controllers/historialPedidosController');
const { uploadEvidencia } = require('../middlewares/uploadMiddleware');

/**
 * Fábrica de rutas del módulo Repartidor (CU-015 a CU-018).
 * Recibe el repositorio y los middlewares ya instanciados (DIP).
 * Todas las rutas requieren sesión iniciada y rol Repartidor (RN-058).
 */
function createPedidosRepartidorRouter(pedidoRepo, autenticar, requerirRepartidor) {
  const router = express.Router();

  const dashboardController = crearDashboardPedidosController(pedidoRepo);
  const detalleController = crearDetallePedidoController(pedidoRepo);
  const actualizarEstadoController = crearActualizarEstadoPedidoController(pedidoRepo);
  const historialController = crearHistorialPedidosController(pedidoRepo);

  router.use(autenticar, requerirRepartidor);

  // CU-015: dashboard del repartidor
  router.get('/dashboard', dashboardController);

  // CU-016: detalle de un pedido asignado
  router.get('/pedidos/:pedidoId/detalle', detalleController);

  // CU-017: actualizar estado (ASIGNADO → EN_CAMINO → ENTREGADO / NO_ENTREGADO)
  router.patch('/pedidos/:pedidoId/estado', uploadEvidencia, actualizarEstadoController);

  // CU-018: historial de pedidos finalizados
  router.get('/historial', historialController);

  return router;
}

module.exports = createPedidosRepartidorRouter;