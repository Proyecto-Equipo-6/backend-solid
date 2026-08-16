class EliminarProductoUseCase {
  constructor(productoRepo) {
    this.productoRepo = productoRepo;
  }

  async ejecutar(id_producto) {
    const producto = await this.productoRepo.findById(id_producto);
    if (!producto) {
      throw new Error('Producto no encontrado');
    }

    await this.productoRepo.eliminar(id_producto);
    return { mensaje: 'Producto desactivado correctamente' };
  }
}

module.exports = EliminarProductoUseCase;