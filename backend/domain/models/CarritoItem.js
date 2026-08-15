/**
 * Entidad de Dominio: CarritoItem
 * Representa un producto dentro del carrito del cliente autenticado.
 * RN-026: cantidad mínima 1.
 * RN-027: cantidad máxima no supera el stock.
 * RN-029: no se permiten cantidades negativas o decimales.
 */
class CarritoItem {
  constructor({
    idProducto,
    titulo,
    imagen,
    precio,
    stock = 0,
    cantidad = 1,
    garantia = null,
  } = {}) {
    this.idProducto = idProducto;
    this.titulo = titulo;
    this.imagen = imagen;
    this.precio = precio;
    this.stock = stock;
    this.cantidad = cantidad;
    this.garantia = garantia;
  }

  get subtotal() {
    return Number((this.precio * this.cantidad).toFixed(2));
  }

  isValid() {
    return Boolean(
      this.idProducto &&
      Number.isInteger(this.cantidad) &&
      this.cantidad >= 1
    );
  }
}

module.exports = CarritoItem;