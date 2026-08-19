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
      return {
        id_producto: instancia.id_producto,
        sku: instancia.sku,
        nombre: instancia.nombre,
        descripcion: instancia.descripcion,
        precio: instancia.precio,
        stock: instancia.stock,
        garantia: instancia.garantia,
        imagen_url: instancia.imagen_url,
        estado: instancia.estado,
        categoria: instancia.categoria,
        proveedor: instancia.proveedor,
      };
    });
  }
}

module.exports = ListarProductosPorCategoriaUseCase;