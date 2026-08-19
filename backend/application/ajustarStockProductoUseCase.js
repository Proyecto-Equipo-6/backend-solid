class AjustarStockProductoUseCase {
  constructor(productoRepo) {
    this.productoRepo = productoRepo;
  }

  async ejecutar(id_producto, cantidad_nueva, motivo, id_admin = null) {
    if (cantidad_nueva === undefined || cantidad_nueva === null || typeof cantidad_nueva !== 'number') {
      throw new Error('La cantidad nueva debe ser un número válido');
    }

    if (id_admin === null || id_admin === undefined) {
      throw new Error('Debes iniciar sesión como administrador para ajustar el stock');
    }

    return await this.productoRepo.registrarAjusteStock(
      id_producto,
      cantidad_nueva,
      motivo,
      id_admin
    );
  }
}

module.exports = AjustarStockProductoUseCase;