const ActualizarEstadoPedidoUseCase = require('../../application/actualizarEstadoPedidoUseCase');

function crearActualizarEstadoPedidoController(pedidoRepo) {
  return async function actualizarEstadoPedidoController(req, res) {
    try {
      const pedidoId = Number(req.params.pedidoId);
      const nuevoEstado = req.body?.estado;
      const estadoAnterior = req.body?.estadoAnterior; // para concurrencia
      const foto = req.body?.foto || null;
      const observacion = req.body?.observacion || null;

      if (!nuevoEstado || !estadoAnterior) {
        return res.status(400).json({ message: 'Estado y estadoAnterior son obligatorios' });
      }

      const useCase = new ActualizarEstadoPedidoUseCase(pedidoRepo);
      const pedidoActualizado = await useCase.ejecutar(
        pedidoId,
        nuevoEstado,
        estadoAnterior,
        { foto, observacion }
      );

      res.json(pedidoActualizado);
    } catch (error) {
      if (error.message === 'Pedido no encontrado') {
        return res.status(404).json({ message: error.message });
      }
      if (
        error.message.includes('Transición inválida') ||
        error.message.includes('obligatoria') ||
        error.message.includes('actualizado por otro proceso')
      ) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: error.message });
    }
  };
}

module.exports = crearActualizarEstadoPedidoController;