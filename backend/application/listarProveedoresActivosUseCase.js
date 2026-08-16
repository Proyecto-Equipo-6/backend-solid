class ListarProveedoresActivosUseCase {
  constructor(proveedorRepo) {
    this.proveedorRepo = proveedorRepo;
  }

  async ejecutar() {
    return await this.proveedorRepo.findActivos();
  }
}

module.exports = ListarProveedoresActivosUseCase;