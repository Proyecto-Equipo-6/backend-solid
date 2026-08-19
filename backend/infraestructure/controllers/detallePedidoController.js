const VerDetallePedidoUseCase = require('../../application/verDetallePedidoUseCase');
const { PedidoNoEncontradoError } = require('../../domain/errors/pedidoErrors');

function crearDetallePedidoController(pedidoRepo) {
  return async function detallePedidoController(req, res) {
    try {
      const pedidoId = Number(req.params.pedidoId);
      const repartidorId = Number(req.usuario?.id_usuario || req.usuario?.id);

      if (!repartidorId) {
        return res.status(401).json({ message: 'Usuario no autenticado' });
      }

      const useCase = new VerDetallePedidoUseCase(pedidoRepo);
      const detalle = await useCase.ejecutar(pedidoId, repartidorId);

      res.json(detalle);
    } catch (error) {
      if (error instanceof PedidoNoEncontradoError) {
        return res.status(404).json({ message: error.message });
      }
      if (error.message.startsWith('Acceso denegado')) {
        return res.status(403).json({ message: error.message });
      }
      res.status(500).json({ message: error.message });
    }
  };
}

module.exports = crearDetallePedidoController;