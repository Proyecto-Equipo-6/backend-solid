/**
 * CU-015 · Ver dashboard pedidos
 * Objetivo: mostrar el pedido activo y la cola de pedidos asignados al repartidor
 * para el día actual (RN-058 a RN-061).
 */
export class VerDashboardPedidosUseCase {
  constructor(pedidoRepartidorRepository) {
    this.pedidoRepartidorRepository = pedidoRepartidorRepository;
  }

  async execute({ repartidorId, fecha = new Date() }) {
    // FP-002: se consulta la BD con los pedidos asignados al repartidor para hoy.
    // El repositorio ya debe filtrar por estado "Asignado" (RN-059) y ordenar
    // por hora de asignación ascendente (RN-060), pero lo garantizamos también aquí.
    const pedidos = await this.pedidoRepartidorRepository.obtenerPedidosAsignadosDelDia(
      repartidorId,
      fecha
    );

    const pedidosOrdenados = [...pedidos].sort(
      (a, b) => new Date(a.fechaAsignacion) - new Date(b.fechaAsignacion)
    );

    // FA-001: sin pedidos asignados.
    if (pedidosOrdenados.length === 0) {
      return {
        pedidoActivo: null,
        pedidosEnCola: [],
        mensaje: 'No tienes pedidos asignados por el momento',
      };
    }

    // FP-004 / FA-002: el más antiguo (o el primero en caso de empate) es el activo.
    const [pedidoActivo, ...pedidosEnCola] = pedidosOrdenados;

    // RN-061: solo se exponen los datos básicos del pedido.
    const aVistaBasica = (pedido) => ({
      idPedido: pedido.idPedido,
      direccionEntrega: pedido.direccionEntrega,
      metodoPago: pedido.metodoPago,
    });

    return {
      pedidoActivo: aVistaBasica(pedidoActivo),
      pedidosEnCola: pedidosEnCola.map(aVistaBasica),
      mensaje: null,
    };
  }
}
