const ActualizarEstadoPedidoUseCase = require('../../application/actualizarEstadoPedidoUseCase');
const {
  PedidoNoEncontradoError,
  TransicionEstadoInvalidaError,
  EvidenciaFotograficaRequeridaError,
  ObservacionRequeridaError,
} = require('../../domain/errors/pedidoErrors');
const {
  subirEvidenciaFotografica,
  guardarEvidenciaLocal,
} = require('../middlewares/uploadMiddleware');

function crearActualizarEstadoPedidoController(pedidoRepo) {
  return async function actualizarEstadoPedidoController(req, res) {
    try {
      const pedidoId = Number(req.params.pedidoId);
      const nuevoEstado = req.body?.estado;
      const estadoAnterior = req.body?.estadoAnterior; // para concurrencia
      const observacion = req.body?.observacion || null;

      if (!nuevoEstado || !estadoAnterior) {
        return res.status(400).json({ message: 'Estado y estadoAnterior son obligatorios' });
      }

      let foto = req.body?.foto || null;

      if (nuevoEstado === 'ENTREGADO') {
        if (req.file) {
          try {
            const subida = await subirEvidenciaFotografica(req.file.buffer, 'nexbit/evidencias');
            foto = subida.secure_url || subida.url || null;
          } catch (cloudinaryError) {
            console.error('Cloudinary no disponible, usando almacenamiento local:', cloudinaryError.message);
            foto = guardarEvidenciaLocal(req.file.buffer, req.file.mimetype, pedidoId);
          }
        } else if (!foto) {
          return res.status(400).json({ message: 'La foto es obligatoria para confirmar la entrega' });
        }
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
      if (error instanceof PedidoNoEncontradoError) {
        return res.status(404).json({ message: error.message });
      }
      if (
        error instanceof TransicionEstadoInvalidaError ||
        error instanceof EvidenciaFotograficaRequeridaError ||
        error instanceof ObservacionRequeridaError ||
        error.message.includes('actualizado por otro proceso')
      ) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: error.message });
    }
  };
}

module.exports = crearActualizarEstadoPedidoController;