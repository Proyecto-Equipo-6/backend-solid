class EliminarProductoUseCase {
  constructor(productoRepo) {
    this.productoRepo = productoRepo;
  }

  async ejecutar(id_producto) {
    const producto = await this.productoRepo.findById(id_producto);
    if (!producto) {
      throw new Error('Producto no encontrado');
    }

    const resultado = await this.productoRepo.eliminar(id_producto);

    // Mensaje condicionado según CP-RF-007.2-02
    if (resultado.teniaHistorial) {
      return {
        mensaje: 'El producto registra ventas en el historial; se ha inactivado del catálogo comercial.'
      };
    }

    return {
      mensaje: 'Producto desactivado correctamente.'
    };
  }
}

module.exports = EliminarProductoUseCase;