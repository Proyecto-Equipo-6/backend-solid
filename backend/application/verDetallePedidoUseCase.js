const {
  PedidoNoEncontradoError,
} = require('../domain/errors/pedidoErrors');
const { DIAGRAMA_SEGUIMIENTO } = require('../domain/models/Pedido');

/**
 * CU-016 · Ver detalles pedido (repartidor)
 * Muestra la información logística y de manipulación del pedido asignado.
 * RN-062: no se muestran los productos.
 * RN-063: solo el repartidor asignado puede ver los datos sensibles.
 * RN-064: se incluye el diagrama de seguimiento en orden fijo.
 */
class VerDetallePedidoUseCase {
  constructor(pedidoRepo) {
    this.pedidoRepo = pedidoRepo;
  }

  async ejecutar(pedidoId, repartidorId) {
    const pedido = await this.pedidoRepo.obtenerPedidoPorId(pedidoId);

    if (!pedido) {
      throw new PedidoNoEncontradoError('El pedido ya no está disponible.');
    }

    // RN-063: Solo el repartidor asignado puede ver los datos sensibles
    if (pedido.id_repartidor !== repartidorId) {
      throw new Error('Acceso denegado: el pedido pertenece a otro repartidor');
    }

    // RN-062: No se muestran los productos, solo info logística y de manipulación
    return {
      id_pedido: pedido.id_pedido,
      clienteNombre: pedido.clienteNombre,
      clienteTelefono: pedido.clienteTelefono,
      direccion_entrega: pedido.direccion_entrega,
      estado: pedido.estado,
      caracteristicasLogistica: pedido.caracteristicasLogistica || 'Ninguna',
      diagramaSeguimiento: [...DIAGRAMA_SEGUIMIENTO], // RN-064
      fecha_pedido: pedido.fecha_pedido,
      fecha_actualizacion: pedido.fecha_actualizacion
    };
  }
}

module.exports = VerDetallePedidoUseCase;