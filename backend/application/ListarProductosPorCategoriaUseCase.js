const Producto = require('../domain/models/Producto');

/**
 * Caso de Uso: ListarProductosPorCategoriaUseCase
 * Obtiene los productos activos de una categoría específica (CP-CU-001-02).
 */
class ListarProductosPorCategoriaUseCase {
  constructor(productoRepository) {
    this.productoRepository = productoRepository;
  }

  async execute(id_categoria) {
    const productos = await this.productoRepository.findActivosPorCategoria(id_categoria);
    return productos.map((producto) => {
      const instancia = producto instanceof Producto ? producto : new Producto(producto);
      return instancia.toDTO();
    });
  }
}

module.exports = ListarProductosPorCategoriaUseCase;