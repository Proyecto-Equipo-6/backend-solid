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
    if (pedido.idUsuario !== repartidorId) {
      throw new Error('Acceso denegado: el pedido pertenece a otro repartidor');
    }

    // RN-062: No se muestran los productos, solo info logística y de manipulación
    return {
      idPedido: pedido.idPedido,
      clienteNombre: pedido.clienteNombre,
      clienteTelefono: pedido.clienteTelefono,
      direccion: pedido.direccion,
      estado: pedido.estado,
      caracteristicasLogistica: pedido.caracteristicasLogistica,
      fechaAsignacion: pedido.fechaAsignacion,
      fechaActualizacion: pedido.fechaActualizacion
    };
  }
}

module.exports = VerDetallePedidoUseCase;