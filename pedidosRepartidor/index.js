/**
 * Composition root del módulo "Pedidos del repartidor" (CU-015 a CU-018).
 * Aquí se cablean dominio -> aplicación -> infraestructura y se exporta
 * un router de Express ya listo para montar en app.js:
 *
 *   import pedidosRepartidorRouter from './modules/pedidosRepartidor/index.js';
 *   app.use('/api/v1/repartidor/pedidos', pedidosRepartidorRouter);
 */
import { verificarToken, verificarRol } from '../../middleware/authMiddleware.js';
import { uploadComprobante, uploadToCloudinary } from '../../middleware/uploadMiddleware.js';

import { VerDashboardPedidosUseCase } from './application/useCases/verDashboardPedidosUseCase.js';
import { VerDetallePedidoUseCase } from './application/useCases/verDetallePedidoUseCase.js';
import { ActualizarEstadoPedidoUseCase } from './application/useCases/actualizarEstadoPedidoUseCase.js';
import { VerHistorialPedidosUseCase } from './application/useCases/verHistorialPedidosUseCase.js';

import { PrismaPedidoRepartidorRepository } from './infraestructure/repositories/prismaPedidoRepartidorRepository.js';
import { DashboardPedidosController } from './infraestructure/controllers/dashboardPedidosController.js';
import { DetallePedidoController } from './infraestructure/controllers/detallePedidoController.js';
import { ActualizarEstadoPedidoController } from './infraestructure/controllers/actualizarEstadoPedidoController.js';
import { HistorialPedidosController } from './infraestructure/controllers/historialPedidosController.js';
import { createPedidosRepartidorRouter } from './infraestructure/routes/pedidosRepartidorRoutes.js';

// Adaptador de persistencia (cámbialo por InMemoryPedidoRepartidorRepository en tests).
const pedidoRepartidorRepository = new PrismaPedidoRepartidorRepository();

// Casos de uso (capa de aplicación).
const verDashboardPedidosUseCase = new VerDashboardPedidosUseCase(pedidoRepartidorRepository);
const verDetallePedidoUseCase = new VerDetallePedidoUseCase(pedidoRepartidorRepository);
const actualizarEstadoPedidoUseCase = new ActualizarEstadoPedidoUseCase(pedidoRepartidorRepository);
const verHistorialPedidosUseCase = new VerHistorialPedidosUseCase(pedidoRepartidorRepository);

// Controladores (capa de infraestructura).
const dashboardPedidosController = new DashboardPedidosController(verDashboardPedidosUseCase);
const detallePedidoController = new DetallePedidoController(verDetallePedidoUseCase);
const actualizarEstadoPedidoController = new ActualizarEstadoPedidoController(
  actualizarEstadoPedidoUseCase,
  uploadToCloudinary
);
const historialPedidosController = new HistorialPedidosController(verHistorialPedidosUseCase);

const pedidosRepartidorRouter = createPedidosRepartidorRouter({
  dashboardPedidosController,
  detallePedidoController,
  actualizarEstadoPedidoController,
  historialPedidosController,
  verificarToken,
  verificarRol,
  uploadEvidencia: uploadComprobante.single('fotoEvidencia'),
});

export default pedidosRepartidorRouter;
