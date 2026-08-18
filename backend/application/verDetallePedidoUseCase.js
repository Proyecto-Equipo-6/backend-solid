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
    const pedido = await this.pedidoRepo.obtenerDetallePedido(pedidoId);

    if (!pedido) {
      throw new Error('Pedido no encontrado');
    }

    if (pedido.id_repartidor !== repartidorId) {
      throw new Error('Acceso denegado: el pedido pertenece a otro repartidor');
    }

    return {
      id_pedido: pedido.id_pedido,
      clienteNombre: pedido.clienteNombre,
      clienteTelefono: pedido.clienteTelefono,
      direccion_entrega: pedido.direccion_entrega,
      estado: pedido.estado,
      caracteristicasLogistica: pedido.caracteristicasLogistica,
      diagramaSeguimiento: ['ASIGNADO', 'EN_CAMINO', 'ENTREGADO'],
      fecha_pedido: pedido.fecha_pedido,
      fecha_actualizacion: pedido.fecha_actualizacion
    };
  }
}

module.exports = VerDetallePedidoUseCase;