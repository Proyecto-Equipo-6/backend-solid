const Producto = require('../domain/models/Producto');

/**
 * Caso de Uso: ListarProductosPublicosUseCase
 * Obtiene los productos activos del catálogo con su ficha técnica
 * (categoría y proveedor). Solo depende de la abstracción (ProductoRepository).
 */
class ListarProductosPublicosUseCase {
  constructor(productoRepository) {
    this.productoRepository = productoRepository;
  }

  async execute() {
    const productos = await this.productoRepository.findActivos();
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

module.exports = ListarProductosPublicosUseCase;
