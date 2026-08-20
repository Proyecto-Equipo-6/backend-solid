const LIMITE_POR_DEFECTO = 10;

/**
 * Caso de Uso: VerPedidosUseCase
 * Consulta la lista de pedidos del cliente autenticado (CU-013 / HU-005.4).
 * FP-003: los pedidos se retornan ordenados por fecha descendente.
 * FA-001: si no hay pedidos, se retorna la vista vacía "No tienes pedidos aún".
 * FA-002: el cliente puede filtrar la lista por estado.
 * RF-005.4: la lista es paginada (server-side).
 */
class VerPedidosUseCase {
  constructor(pedidoRepository) {
    this.pedidoRepository = pedidoRepository;
  }

  async execute(usuario, { estado = null, pagina = 1, limite = LIMITE_POR_DEFECTO } = {}) {
    const pedidos = await this.pedidoRepository.obtenerPedidosPorUsuario(usuario.id_usuario);

    let lista = pedidos;
    if (estado) {
      lista = pedidos.filter((pedido) => pedido.estado === estado);
    }

    // Orden descendente por fecha (RN-051: del más reciente al más antiguo).
    lista = [...lista].sort((a, b) => new Date(b.fecha_pedido) - new Date(a.fecha_pedido));

    const paginaNumero = Math.max(1, Number(pagina) || 1);
    const limiteNumero = Math.max(1, Number(limite) || LIMITE_POR_DEFECTO);
    const total = lista.length;
    const inicio = (paginaNumero - 1) * limiteNumero;
    const items = lista.slice(inicio, inicio + limiteNumero);

    return {
      pedidos: items,
      total,
      pagina: paginaNumero,
      limite: limiteNumero,
      totalPaginas: Math.ceil(total / limiteNumero),
      vacio: total === 0,
      mensaje: total === 0 ? 'No tienes pedidos aún' : null,
    };
  }
}

module.exports = VerPedidosUseCase;