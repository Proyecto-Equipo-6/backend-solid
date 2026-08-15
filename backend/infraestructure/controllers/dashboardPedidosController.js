const VerDashboardPedidosUseCase = require('../../application/verDashboardPedidosUseCase');

/**
 * Se recibe el repositorio (inyección de dependencias)
 * y devuelve el handler del controlador.
 */
function crearDashboardPedidosController(pedidoRepo) {
  return async function dashboardPedidosController(req, res) {
    try {
      const repartidorId = Number(req.user?.id || req.user?.userId);

      if (!repartidorId) {
        return res.status(401).json({ message: 'Usuario no autenticado' });
      }

      const useCase = new VerDashboardPedidosUseCase(pedidoRepo);
      const dashboard = await useCase.ejecutar(repartidorId);

      res.json(dashboard);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
}

module.exports = crearDashboardPedidosController;