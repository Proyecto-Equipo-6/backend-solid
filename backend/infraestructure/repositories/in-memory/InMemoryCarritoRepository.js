const CarritoRepository = require('../../../domain/ports/CarritoRepository');

function construirCarrito(items) {
  const total = Number(items.reduce((acc, item) => acc + item.subtotal, 0).toFixed(2));
  return { items, total };
}

/**
 * Adaptador de Infraestructura: InMemoryCarritoRepository
 * Implementa el puerto CarritoRepository usando memoria volátil.
 * (Principio de Sustitución de Liskov - LSP)
 */
class InMemoryCarritoRepository extends CarritoRepository {
  constructor() {
    super();
    this.carritos = new Map();
  }

  _carritoDe(idUsuario) {
    if (!this.carritos.has(idUsuario)) {
      this.carritos.set(idUsuario, []);
    }
    return this.carritos.get(idUsuario);
  }

  _aItem(producto, cantidad) {
    return {
      idProducto: producto.id,
      titulo: producto.titulo,
      imagen: producto.imagen,
      precio: producto.precio,
      stock: producto.stock,
      cantidad,
      garantia: producto.garantia,
      subtotal: Number((producto.precio * cantidad).toFixed(2)),
    };
  }

  async obtenerCarrito(idUsuario) {
    return construirCarrito(this._carritoDe(idUsuario).slice());
  }

  async agregarProducto(idUsuario, producto, cantidad) {
    const carrito = this._carritoDe(idUsuario);
    const existente = carrito.find((item) => item.idProducto === producto.id);
    if (existente) {
      existente.cantidad += cantidad;
      existente.subtotal = Number((existente.precio * existente.cantidad).toFixed(2));
    } else {
      carrito.push(this._aItem(producto, cantidad));
    }
    return construirCarrito(carrito.slice());
  }

  async actualizarCantidad(idUsuario, idProducto, cantidad) {
    const carrito = this._carritoDe(idUsuario);
    const item = carrito.find((i) => i.idProducto === idProducto);
    if (item) {
      item.cantidad = cantidad;
      item.subtotal = Number((item.precio * item.cantidad).toFixed(2));
    }
    return construirCarrito(carrito.slice());
  }

  async eliminarProducto(idUsuario, idProducto) {
    const carrito = this._carritoDe(idUsuario);
    const indice = carrito.findIndex((i) => i.idProducto === idProducto);
    if (indice !== -1) carrito.splice(indice, 1);
    return construirCarrito(carrito.slice());
  }

  async obtenerCantidad(idUsuario, idProducto) {
    const carrito = this._carritoDe(idUsuario);
    const item = carrito.find((i) => i.idProducto === idProducto);
    return item ? item.cantidad : 0;
  }
}

module.exports = InMemoryCarritoRepository;