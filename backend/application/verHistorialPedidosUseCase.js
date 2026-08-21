/**
 * CU-018 · Ver historial de pedidos (repartidor)
 * Lista los pedidos ya finalizados del repartidor, con métricas de mes/semana
 * y filtros por estado o antigüedad (RN-071 a RN-076).
 */
class VerHistorialPedidosUseCase {
  constructor(pedidoRepo) {
    this.pedidoRepo = pedidoRepo;
  }

  async ejecutar(repartidorId, { filtroEstado = null, orden = 'reciente' } = {}) {
    // RN-071/RN-072/RN-075: el repositorio solo trae pedidos finalizados
    // (Entregado, No entregado o Cancelado) de este repartidor.
    const [pedidos, metricas] = await Promise.all([
      this.pedidoRepo.obtenerHistorialPedidos(repartidorId, { filtroEstado }),
      // RN-073/RN-076: conteos calculados con base en la fecha actual, reiniciados por periodo.
      this.pedidoRepo.contarPedidosDelPeriodo(repartidorId),
    ]);

    // FE-002: sin historial disponible en absoluto.
    if (pedidos.length === 0 && !filtroEstado) {
      return {
        totalMes: metricas.totalMes ?? 0,
        totalSemana: metricas.totalSemana ?? 0,
        pedidos: [],
        mensaje: 'Aún no tienes pedidos registrados en tu historial',
      };
    }

    // FA-002: ordenar por antigüedad ("reciente" o "antiguo").
    const pedidosOrdenados = [...pedidos].sort((a, b) => {
      const diferencia = new Date(a.fechaEntregaReal) - new Date(b.fechaEntregaReal);
      return orden === 'antiguo' ? diferencia : -diferencia;
    });

    return {
      // FA-003: si no hay pedidos en el mes/semana, las métricas simplemente son 0.
      totalMes: metricas.totalMes ?? 0,
      totalSemana: metricas.totalSemana ?? 0,
      pedidos: pedidosOrdenados.map((pedido) => ({
        id_pedido: pedido.id_pedido,
        fecha: pedido.fechaEntregaReal,
        estado: pedido.estado,
        direccion_entrega: pedido.direccion_entrega,
        total: pedido.total,
        observacion: pedido.observaciones,
      })),
      mensaje: null,
    };
  }
}

module.exports = VerHistorialPedidosUseCase;