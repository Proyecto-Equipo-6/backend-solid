const ErrorNoEncontrado = require('./errors/ErrorNoEncontrado');

/**
 * Caso de Uso: VerProductoDetalleUseCase
 * Consulta la ficha técnica de un producto activo (RF-003.3).
 * RN-001: solo se visualizan productos activos dentro del inventario.
 */
class VerProductoDetalleUseCase {
  constructor(productoRepository) {
    this.productoRepository = productoRepository;
  }

  async execute(id) {
    const producto = await this.productoRepository.findById(id);
    if (!producto) {
      throw new ErrorNoEncontrado('Producto no encontrado');
    }
    return {
      id: producto.id,
      titulo: producto.titulo,
      descripcion: producto.descripcion,
      categoria: producto.categoria,
      precio: producto.precio,
      stock: producto.stock,
      garantia: producto.garantia,
      imagen: producto.imagen,
      proveedor: producto.proveedor,
      disponibilidad: producto.stock > 0 ? `${producto.stock} unidades` : 'Agotado',
    };
  }
}

module.exports = VerProductoDetalleUseCase;