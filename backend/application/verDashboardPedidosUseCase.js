const PedidoRepartidorRepository = require('../domain/ports/PedidoRepartidorRepository');

class VerDashboardPedidosUseCase {
  constructor(pedidoRepo) {
    this.pedidoRepo = pedidoRepo;
  }

  async ejecutar(repartidorId) {
    // repartidorId es el id_usuario del repartidor
    const pedidos = await this.pedidoRepo.obtenerPedidosDelDia(repartidorId);

    if (pedidos.length === 0) {
      return {
        conteoDelDia: 0,
        pedidoActivo: null,
        pedidosEnCola: [],
        mensaje: 'No tienes pedidos asignados por el momento'
      };
    }

    // El repositorio ya entrega ordenado por fecha/hora de asignación ascendente
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