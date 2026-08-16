import {
  PedidoNoEncontradoError,
  TransicionEstadoInvalidaError,
  EvidenciaFotograficaRequeridaError,
  ObservacionRequeridaError,
} from '../../domain/errors/pedidoErrors.js';

/**
 * Adaptador de infraestructura: ActualizarEstadoPedidoController
 * Traduce HTTP <-> ActualizarEstadoPedidoUseCase (CU-017).
 *
 * `subirEvidenciaFotografica` es una función inyectada (buffer) => Promise<url>,
 * normalmente la que ya expone uploadMiddleware.js (uploadToCloudinary),
 * así el controlador no depende directamente de Cloudinary.
 */
export class ActualizarEstadoPedidoController {
  constructor(actualizarEstadoPedidoUseCase, subirEvidenciaFotografica) {
    this.actualizarEstadoPedidoUseCase = actualizarEstadoPedidoUseCase;
    this.subirEvidenciaFotografica = subirEvidenciaFotografica;
  }

  async actualizar(req, res) {
    try {
      const repartidorId = req.usuario.userId;
      const { idPedido } = req.params;
      const { estadoNuevo, observacion } = req.body;

      let fotoEvidenciaUrl;
      // RN-066: la foto solo se sube cuando el destino del cambio es "ENTREGADO".
      if (estadoNuevo === 'ENTREGADO' && req.file) {
        const resultado = await this.subirEvidenciaFotografica(req.file.buffer, 'nexbit/evidencias');
        fotoEvidenciaUrl = resultado.secure_url || resultado.url;
      }

      const pedidoActualizado = await this.actualizarEstadoPedidoUseCase.execute({
        idPedido,
        repartidorId,
        estadoNuevo,
        fotoEvidenciaUrl,
        observacion,
      });

      return res.status(200).json(pedidoActualizado);
    } catch (error) {
      if (error instanceof PedidoNoEncontradoError) {
        return res.status(404).json({ error: error.message });
      }
      if (
        error instanceof TransicionEstadoInvalidaError
        || error instanceof EvidenciaFotograficaRequeridaError
        || error instanceof ObservacionRequeridaError
      ) {
        return res.status(400).json({ error: error.message });
      }
      console.error('Error al actualizar el estado del pedido:', error);
      return res.status(500).json({ error: 'No se pudo actualizar el estado del pedido' });
    }
  }
}
