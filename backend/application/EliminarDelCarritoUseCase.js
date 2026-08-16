const ErrorNoEncontrado = require('./errors/ErrorNoEncontrado');
const ErrorValidacion = require('./errors/ErrorValidacion');

/**
 * Caso de Uso: EliminarDelCarritoUseCase
 * Elimina un producto del carrito del cliente autenticado (RF-004.4).
 * RN-030: el botón de eliminar es visible pero no protagónico (decisión UI).
 * RN-031: la eliminación afecta únicamente al carrito del cliente autenticado.
 * RN-032: solo se elimina un producto que esté en el carrito del usuario.
 */
class EliminarDelCarritoUseCase {
  constructor(carritoRepository) {
    this.carritoRepository = carritoRepository;
  }

  async execute(usuario, idProducto) {
    if (idProducto === undefined || idProducto === null) {
      throw new ErrorValidacion('Debes indicar el producto');
    }

    const cantidadActual = await this.carritoRepository.obtenerCantidad(usuario.id_usuario, Number(idProducto));
    if (cantidadActual === 0) {
      throw new ErrorNoEncontrado('El producto no se encuentra en tu carrito');
    }

    const carrito = await this.carritoRepository.eliminarProducto(usuario.id_usuario, Number(idProducto));

    return {
      mensaje: 'Producto eliminado correctamente',
      carrito: {
        items: carrito.items,
        total: carrito.total,
        vacio: carrito.items.length === 0,
      },
    };
  }
}

module.exports = EliminarDelCarritoUseCase;