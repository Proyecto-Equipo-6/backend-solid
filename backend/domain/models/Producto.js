/**
 * Entidad de Dominio: Producto
 * Representa un producto del catálogo público.
 * RN-009: Solo se listan productos activos de categorías activas.
 * RN-010: Stock 0 se muestra como "Agotado" y deshabilita compra rápida.
 */
class Producto {
  constructor({
    id = null,
    titulo,
    descripcion,
    categoria,
    precio,
    stock = 0,
    garantia = 'Sin garantía',
    imagen = null,
    proveedor = null,
    destacado = false
  } = {}) {
    this.id = id;
    this.titulo = titulo;
    this.descripcion = descripcion;
    this.categoria = categoria;
    this.precio = precio;
    this.stock = stock;
    this.garantia = garantia;
    this.imagen = imagen;
    this.proveedor = proveedor;
    this.destacado = destacado;
  }

  get agotado() {
    return this.stock === 0;
  }

  get disponible() {
    return this.stock > 0;
  }

  isValid() {
    return Boolean(
      this.titulo &&
      this.categoria &&
      typeof this.precio === 'number' &&
      this.precio > 0 &&
      Number.isInteger(this.stock) &&
      this.stock >= 0
    );
  }
}

module.exports = Producto;
