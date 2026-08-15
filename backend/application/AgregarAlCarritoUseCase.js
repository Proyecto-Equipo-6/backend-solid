const CarritoItem = require('../domain/models/CarritoItem');
const ErrorNoEncontrado = require('./errors/ErrorNoEncontrado');
const ErrorStockInsuficiente = require('./errors/ErrorStockInsuficiente');
const ErrorValidacion = require('./errors/ErrorValidacion');

/**
 * Caso de Uso: AgregarAlCarritoUseCase
 * Añade un producto al carrito del cliente autenticado (RF-004.2).
 * RN-033: no se agrega más cantidad que el stock disponible.
 * RN-035: si no hay unidades suficientes → "No hay unidades suficientes".
 * RN-036: si ya existe, se incrementa la cantidad sin duplicar.
 * RN-037: solo usuarios con sesión iniciada pueden agregar.
 */
class AgregarAlCarritoUseCase {
  constructor(carritoRepository, productoRepository) {
    this.carritoRepository = carritoRepository;
    this.productoRepository = productoRepository;
  }

  async execute(usuario, { productoId, cantidad = 1 }) {
    if (productoId === undefined || productoId === null) {
      throw new ErrorValidacion('Debes indicar el producto');
    }

    const cantidadNumero = Number(cantidad);
    if (!Number.isInteger(cantidadNumero) || cantidadNumero < 1) {
      throw new ErrorValidacion('La cantidad debe ser un entero mayor o igual a 1');
    }

    const producto = await this.productoRepository.findById(productoId);
    if (!producto) {
      throw new ErrorNoEncontrado('Producto no encontrado');
    }

    const item = new CarritoItem({ ...producto, idProducto: producto.id, cantidad: cantidadNumero });
    if (!item.isValid()) {
      throw new ErrorValidacion('Datos de carrito inválidos');
    }

    const cantidadActual = await this.carritoRepository.obtenerCantidad(usuario.id_usuario, producto.id);
    const cantidadTotal = cantidadActual + cantidadNumero;

    if (cantidadTotal > producto.stock) {
      throw new ErrorStockInsuficiente();
    }

    const yaExiste = cantidadActual > 0;

    const carrito = await this.carritoRepository.agregarProducto(usuario.id_usuario, producto, cantidadNumero);

    return {
      mensaje: yaExiste
        ? 'Producto actualizado en tu carrito'
        : 'Producto añadido',
      carrito: {
        items: carrito.items,
        total: carrito.total,
        vacio: carrito.items.length === 0,
      },
    };
  }
}

module.exports = AgregarAlCarritoUseCase;