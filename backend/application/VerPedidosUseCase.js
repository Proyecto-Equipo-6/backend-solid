/**
 * Caso de Uso: VerPedidosUseCase
 * Consulta la lista de pedidos del cliente autenticado (CU-013 / HU-005.4).
 * FP-003: los pedidos se retornan ordenados por fecha descendente.
 * FA-001: si no hay pedidos, se retorna la vista vacía "No tienes pedidos aún".
 * FA-002: el cliente puede filtrar la lista por estado.
 */
class VerPedidosUseCase {
  constructor(pedidoRepository) {
    this.pedidoRepository = pedidoRepository;
  }

  async execute(usuario, { estado = null } = {}) {
    const pedidos = await this.pedidoRepository.obtenerPedidosPorUsuario(usuario.id_usuario);

    let lista = pedidos;
    if (estado) {
      lista = pedidos.filter((pedido) => pedido.estado === estado);
    }

    return {
      pedidos: lista,
      vacio: lista.length === 0,
      mensaje: lista.length === 0 ? 'No tienes pedidos aún' : null,
    };
  }
}

module.exports = VerPedidosUseCase;