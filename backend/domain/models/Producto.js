/**
 * Modelo de Dominio: Producto
 * Representa un producto del catálogo junto con los datos de su ficha técnica
 * (categoría y proveedor provienen de las tablas relacionadas).
 */
class Producto {
  constructor({
    id_producto = null,
    sku,
    nombre,
    descripcion,
    precio,
    stock,
    garantia,
    imagen_url,
    estado,
    categoria,
    proveedor,
  } = {}) {
    this.id_producto = id_producto;
    this.sku = sku;
    this.nombre = nombre;
    this.descripcion = descripcion;
    this.precio = precio;
    this.stock = stock;
    this.garantia = garantia;
    this.imagen_url = imagen_url;
    this.estado = estado;
    this.categoria = categoria;
    this.proveedor = proveedor;
  }

  esVisiblePublicamente() {
    return this.estado === 1;
  }
}

module.exports = Producto;
