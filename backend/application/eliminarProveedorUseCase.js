class EliminarProveedorUseCase {
  constructor(proveedorRepo) {
    this.proveedorRepo = proveedorRepo;
  }

  async ejecutar(id_proveedor) {
    const proveedor = await this.proveedorRepo.buscarPorId(id_proveedor);
    if (!proveedor) {
      throw new Error('Proveedor no encontrado');
    }

    await this.proveedorRepo.eliminar(id_proveedor);
    return { mensaje: 'Proveedor desactivado correctamente' };
  }
}

module.exports = EliminarProveedorUseCase;