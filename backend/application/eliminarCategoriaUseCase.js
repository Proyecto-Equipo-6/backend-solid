class EliminarCategoriaUseCase {
  constructor(categoriaRepo) {
    this.categoriaRepo = categoriaRepo;
  }

  async ejecutar(id_categoria) {
    const categoria = await this.categoriaRepo.buscarPorId(id_categoria);
    if (!categoria) {
      throw new Error('Categoría no encontrada');
    }

    const productosAsociados = await this.categoriaRepo.contarProductosAsociados(id_categoria);
    if (productosAsociados > 0) {
      throw new Error(`No se puede eliminar: la categoría tiene ${productosAsociados} productos asociados`); // FE-001 / RN-093
    }

    await this.categoriaRepo.eliminar(id_categoria);
    return { mensaje: 'Categoría eliminada' };
  }
}

module.exports = EliminarCategoriaUseCase;