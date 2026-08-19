class ListarTodosProductosUseCase {
  constructor(productoRepository) {
    this.productoRepository = productoRepository;
  }

  async execute() {
    return await this.productoRepository.findAll();
  }
}

module.exports = ListarTodosProductosUseCase;