const {
  PedidoNoEncontradoError,
} = require('../domain/errors/pedidoErrors');
const { DIAGRAMA_SEGUIMIENTO } = require('../domain/models/Pedido');

/**
 * CU-016 · Ver detalles pedido (repartidor)
 * Muestra la información logística, los productos del pedido y el seguimiento.
 * RN-063: solo el repartidor asignado puede ver los datos sensibles.
 * RN-064: se incluye el diagrama de seguimiento en orden fijo.
 */
class VerDetallePedidoUseCase {
  constructor(pedidoRepo) {
    this.pedidoRepo = pedidoRepo;
  }

  async ejecutar(pedidoId, repartidorId) {
    let pedido;

    try {
      // CP-CU-016-04: captura errores de conexión/consulta
      pedido = await this.pedidoRepo.obtenerDetallePedido(pedidoId);
    } catch (error) {
      throw new Error('No se pudieron cargar los detalles del pedido');
    }

    if (!pedido) {
      throw new PedidoNoEncontradoError();
    }

    // CP-CU-016-05: pedido cancelado no debe mostrarse
    if (pedido.estado === 'CANCELADO') {
      throw new Error('El pedido ya no está disponible');
    }

    if (pedido.id_repartidor !== repartidorId) {
      throw new Error('Acceso denegado: el pedido pertenece a otro repartidor');
    }

    const detalles = await this.pedidoRepo.obtenerDetallesPorPedido(pedidoId);

    return {
      id_pedido: pedido.id_pedido,
      clienteNombre: pedido.clienteNombre,
      clienteTelefono: pedido.clienteTelefono,
      direccion_entrega: pedido.direccion_entrega,
      estado: pedido.estado,
      caracteristicasLogistica: pedido.caracteristicasLogistica,
      diagramaSeguimiento: DIAGRAMA_SEGUIMIENTO,
      fecha_pedido: pedido.fecha_pedido,
      fecha_actualizacion: pedido.fecha_actualizacion,
      productos: detalles.map((d) => ({
        id_producto: d.id_producto,
        nombre: d.producto_nombre || `Producto #${d.id_producto}`,
        cantidad: d.cantidad,
        precio_unitario: d.precio_unitario,
        subtotal: d.subtotal,
      })),
    };
  }
}

module.exports = VerDetallePedidoUseCase;