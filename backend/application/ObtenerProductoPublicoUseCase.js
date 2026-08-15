const Producto = require('../domain/models/Producto');
const ErrorNoEncontrado = require('./errors/ErrorNoEncontrado');

/**
 * Caso de Uso: ObtenerProductoPublicoUseCase
 * Obtiene un producto activo por su id. Si no existe o no es visible
 * públicamente (RN-001), lanza ErrorNoEncontrado (HTTP 404).
 */
class ObtenerProductoPublicoUseCase {
  constructor(productoRepository) {
    this.productoRepository = productoRepository;
  }

  async execute({ id }) {
    if (!id) {
      throw new ErrorNoEncontrado();
    }

    const registro = await this.productoRepository.findById(id);
    if (!registro) {
      throw new ErrorNoEncontrado();
    }

    const producto = registro instanceof Producto ? registro : new Producto(registro);
    if (!producto.esVisiblePublicamente()) {
      throw new ErrorNoEncontrado();
    }

    return {
      id_producto: producto.id_producto,
      sku: producto.sku,
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      precio: producto.precio,
      stock: producto.stock,
      garantia: producto.garantia,
      imagen_url: producto.imagen_url,
      estado: producto.estado,
      categoria: producto.categoria,
      proveedor: producto.proveedor,
    };
  }
}

module.exports = ObtenerProductoPublicoUseCase;
