const ErrorNoEncontrado = require('./errors/ErrorNoEncontrado');
const ErrorStockInsuficiente = require('./errors/ErrorStockInsuficiente');
const ErrorValidacion = require('./errors/ErrorValidacion');

/**
 * Caso de Uso: ActualizarCarritoUseCase
 * Modifica la cantidad de un producto en el carrito (RF-004.3).
 * RN-026: cantidad mínima 1; en 0 se sugiere eliminar.
 * RN-027: la cantidad no supera el stock disponible.
 * RN-028: afecta únicamente al carrito del cliente autenticado.
 * RN-029: no se permiten cantidades negativas o decimales.
 */
class ActualizarCarritoUseCase {
  constructor(carritoRepository, productoRepository) {
    this.carritoRepository = carritoRepository;
    this.productoRepository = productoRepository;
  }

  async execute(usuario, idProducto, { cantidad }) {
    const cantidadNumero = Number(cantidad);

    if (cantidadNumero === 0) {
      throw new ErrorValidacion('La cantidad mínima es 1. Si deseas eliminar el producto usa el botón de eliminar');
    }
    if (!Number.isInteger(cantidadNumero) || cantidadNumero < 1) {
      throw new ErrorValidacion('La cantidad debe ser un entero mayor o igual a 1');
    }

    const producto = await this.productoRepository.findById(idProducto);
    if (!producto) {
      throw new ErrorNoEncontrado('Producto no encontrado');
    }

    if (cantidadNumero > producto.stock) {
      throw new ErrorStockInsuficiente();
    }

    const cantidadActual = await this.carritoRepository.obtenerCantidad(usuario.id_usuario, Number(idProducto));
    if (cantidadActual === 0) {
      throw new ErrorNoEncontrado('El producto no se encuentra en tu carrito');
    }

    const carrito = await this.carritoRepository.actualizarCantidad(
      usuario.id_usuario,
      Number(idProducto),
      cantidadNumero
    );

    return {
      mensaje: 'Cantidad actualizada',
      carrito: {
        items: carrito.items,
        total: carrito.total,
        vacio: carrito.items.length === 0,
      },
    };
  }
}

module.exports = ActualizarCarritoUseCase;