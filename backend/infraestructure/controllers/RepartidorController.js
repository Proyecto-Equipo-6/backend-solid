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

/**
 * Adaptador de Infraestructura: RepartidorController
 * Maneja las peticiones HTTP del módulo Repartidor (CU-015 a CU-018).
 * Recibe los casos de uso ya instanciados (DIP), igual que el resto de los
 * controladores del proyecto. Requiere sesión iniciada y rol Repartidor
 * (aplicado en las rutas).
 */
class RepartidorController {
  constructor({ verDashboard, verDetalle, actualizarEstado, verHistorial }) {
    this.verDashboard = verDashboard;
    this.verDetalle = verDetalle;
    this.actualizarEstado = actualizarEstado;
    this.verHistorial = verHistorial;
  }

  // CU-015: dashboard del repartidor
  async dashboard(req, res) {
    try {
      const repartidorId = Number(req.usuario?.id_usuario);
      if (!repartidorId) {
        return res.status(401).json({ message: 'Usuario no autenticado' });
      }
      const dashboard = await this.verDashboard.ejecutar(repartidorId);
      res.json(dashboard);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // CU-016: detalle de un pedido asignado
  async detalle(req, res) {
    try {
      const pedidoId = Number(req.params.pedidoId);
      const repartidorId = Number(req.usuario?.id_usuario);
      if (!repartidorId) {
        return res.status(401).json({ message: 'Usuario no autenticado' });
      }
      const detalle = await this.verDetalle.ejecutar(pedidoId, repartidorId);
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
  }

  // CU-017: subir comprobante de entrega a Cloudinary
  async subirComprobante(req, res) {
    try {
      const pedidoId = Number(req.params.pedidoId);

      if (!req.file) {
        return res.status(400).json({ message: 'La imagen es obligatoria' });
      }

      let comprobanteUrl = null;
      try {
        const subida = await subirEvidenciaFotografica(req.file.buffer, 'nexbit/comprobantes');
        comprobanteUrl = subida.secure_url || subida.url || null;
      } catch (cloudinaryError) {
        console.error('Cloudinary no disponible, usando almacenamiento local:', cloudinaryError.message);
        comprobanteUrl = guardarEvidenciaLocal(req.file.buffer, req.file.mimetype, pedidoId);
      }

      res.json({ comprobante_url: comprobanteUrl });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // CU-017: actualizar estado (ASIGNADO → EN_CAMINO → ENTREGADO / NO_ENTREGADO)
  async estado(req, res) {
    try {
      const pedidoId = Number(req.params.pedidoId);
      const nuevoEstado = req.body?.estado;
      const estadoAnterior = req.body?.estadoAnterior; // para concurrencia
      const observacion = req.body?.observacion || null;

      if (!nuevoEstado || !estadoAnterior) {
        return res.status(400).json({ message: 'Estado y estadoAnterior son obligatorios' });
      }

      let foto = req.body?.fotoEvidencia || req.body?.comprobante_url || null;

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

      const pedidoActualizado = await this.actualizarEstado.ejecutar(
        pedidoId,
        nuevoEstado,
        estadoAnterior,
        { foto, observacion }
      );
      res.json(pedidoActualizado);
    } catch (error) {
      if (error instanceof TransicionEstadoInvalidaError ||
          error instanceof EvidenciaFotograficaRequeridaError ||
          error instanceof ObservacionRequeridaError ||
          error.message.includes('actualizado por otro proceso')) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: error.message });
    }
  }

  // CU-018: historial de pedidos finalizados
  async historial(req, res) {
    try {
      const repartidorId = Number(req.usuario?.id_usuario);
      if (!repartidorId) {
        return res.status(401).json({ message: 'Usuario no autenticado' });
      }
      // FA-001/FA-002: filtro por estado (Entregado, No entregado, Cancelado) y orden.
      const { estado, orden } = req.query;
      const historial = await this.verHistorial.ejecutar(repartidorId, {
        filtroEstado: estado || null,
        orden: orden || 'reciente',
      });
      res.json(historial);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
}

module.exports = RepartidorController;
