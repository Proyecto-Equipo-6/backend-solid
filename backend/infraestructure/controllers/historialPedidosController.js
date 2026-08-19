const VerHistorialPedidosUseCase = require('../../application/verHistorialPedidosUseCase');

function crearHistorialPedidosController(pedidoRepo) {
  return async function historialPedidosController(req, res) {
    try {
      const repartidorId = Number(req.usuario?.id_usuario || req.usuario?.id);

      if (!repartidorId) {
        return res.status(401).json({ message: 'Usuario no autenticado' });
      }

      // FA-001/FA-002: filtro por estado (Entregado, No entregado, Cancelado) y orden.
      const { estado, orden } = req.query;
      const useCase = new VerHistorialPedidosUseCase(pedidoRepo);
      const historial = await useCase.ejecutar(repartidorId, {
        filtroEstado: estado || null,
        orden: orden || 'reciente',
      });

      res.json(historial);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
}

module.exports = crearHistorialPedidosController;