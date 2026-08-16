class ObtenerTodosPedidosUseCase {
  constructor(pedidoRepo) {
    this.pedidoRepo = pedidoRepo;
  }

  async ejecutar(filtros = {}) {
    return await this.pedidoRepo.obtenerTodos(filtros);
  }
}

module.exports = ObtenerTodosPedidosUseCase;