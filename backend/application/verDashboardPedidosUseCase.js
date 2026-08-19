class VerDashboardPedidosUseCase {
  constructor(pedidoRepo) {
    this.pedidoRepo = pedidoRepo;
  }

  async ejecutar(repartidorId) {
    // Usamos obtenerPedidosDelDia (no obtenerPedidosAsignadosDelDia)
    const pedidos = await this.pedidoRepo.obtenerPedidosDelDia(repartidorId);

    if (pedidos.length === 0) {
      return {
        conteoDelDia: 0,
        pedidoActivo: null,
        pedidosEnCola: [],
        mensaje: 'No tienes pedidos asignados por el momento'
      };
    }

    const pedidoActivo = pedidos[0];
    const pedidosEnCola = pedidos.slice(1);

    return {
      conteoDelDia: pedidos.length,
      pedidoActivo,
      pedidosEnCola
    };
  }
}

module.exports = VerDashboardPedidosUseCase;