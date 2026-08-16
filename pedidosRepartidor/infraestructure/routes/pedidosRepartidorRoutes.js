import express from 'express';

/**
 * Fábrica de rutas: recibe los controladores ya instanciados con sus
 * dependencias inyectadas (ver infraestructure/index.js) y el middleware
 * de subida de archivos, y arma el router de Express.
 */
export function createPedidosRepartidorRouter({
  dashboardPedidosController,
  detallePedidoController,
  actualizarEstadoPedidoController,
  historialPedidosController,
  verificarToken,
  verificarRol,
  uploadEvidencia, // middleware multer, ej. uploadComprobante.single('fotoEvidencia')
}) {
  const router = express.Router();

  // CU-015
  router.get(
    '/dashboard',
    verificarToken,
    verificarRol('Repartidor'),
    (req, res) => dashboardPedidosController.obtener(req, res)
  );

  // CU-016
  router.get(
    '/:idPedido/detalle',
    verificarToken,
    verificarRol('Repartidor'),
    (req, res) => detallePedidoController.obtener(req, res)
  );

  // CU-017 (multipart: campo "fotoEvidencia" cuando estadoNuevo === 'ENTREGADO')
  router.patch(
    '/:idPedido/estado',
    verificarToken,
    verificarRol('Repartidor'),
    uploadEvidencia,
    (req, res) => actualizarEstadoPedidoController.actualizar(req, res)
  );

  // CU-018
  router.get(
    '/historial',
    verificarToken,
    verificarRol('Repartidor'),
    (req, res) => historialPedidosController.obtener(req, res)
  );

  return router;
}
