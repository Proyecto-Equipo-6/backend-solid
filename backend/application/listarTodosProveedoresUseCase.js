class ListarTodosProveedoresUseCase {
  constructor(proveedorRepo) {
    this.proveedorRepo = proveedorRepo;
  }

  async ejecutar() {
    return await this.proveedorRepo.findAll();
  }
}

module.exports = ListarTodosProveedoresUseCase;