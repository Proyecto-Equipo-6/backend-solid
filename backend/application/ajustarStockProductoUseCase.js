class AjustarStockProductoUseCase {
  constructor(productoRepo) {
    this.productoRepo = productoRepo;
  }

  async ejecutar(id_producto, cantidad_nueva, motivo) {
    if (cantidad_nueva === undefined || cantidad_nueva === null || typeof cantidad_nueva !== 'number') {
      throw new Error('La cantidad nueva debe ser un número válido');
    }

    return await this.productoRepo.registrarAjusteStock(
      id_producto,
      cantidad_nueva,
      motivo
    );
  }
}

module.exports = AjustarStockProductoUseCase;