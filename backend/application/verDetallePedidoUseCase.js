class VerDetallePedidoUseCase {
  constructor(pedidoRepo) {
    this.pedidoRepo = pedidoRepo;
  }

  async ejecutar(pedidoId, repartidorId) {
    const pedido = await this.pedidoRepo.obtenerDetallePedido(pedidoId);

    if (!pedido) {
      throw new Error('Pedido no encontrado');
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
      diagramaSeguimiento: ['ASIGNADO', 'EN_CAMINO', 'ENTREGADO'], // RN-064
      fecha_pedido: pedido.fecha_pedido,
      fecha_actualizacion: pedido.fecha_actualizacion
    };
  }
}

module.exports = VerDetallePedidoUseCase;