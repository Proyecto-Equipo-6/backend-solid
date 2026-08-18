/**
 * Modelo de Dominio: Producto
 * Representa un producto del catálogo junto con sus datos de inventario y ficha técnica.
 * Mantiene campos del catálogo público y del CRUD administrativo.
 */
class Producto {
  constructor({
    id_producto = null,
    sku = null,
    id_categoria = null,
    id_proveedor = null,
    nombre = '',
    descripcion = '',
    precio = 0,
    stock = 0,
    garantia = null,
    imagen_url = null,
    estado = 1,
    categoria = null,   // string para catálogo (opcional)
    proveedor = null,   // string para catálogo (opcional)
    fecha_creacion = new Date().toISOString(),
    fecha_actualizacion = null
  } = {}) {
    this.id_producto = id_producto;
    this.sku = sku;
    this.id_categoria = id_categoria;
    this.id_proveedor = id_proveedor;
    this.nombre = nombre;
    this.descripcion = descripcion;
    this.precio = precio;
    this.stock = stock;
    this.garantia = garantia;
    this.imagen_url = imagen_url;
    this.estado = estado;
    this.categoria = categoria;
    this.proveedor = proveedor;
    this.fecha_creacion = fecha_creacion;
    this.fecha_actualizacion = fecha_actualizacion;
  }

  esVisiblePublicamente() {
    return this.estado === 1;
  }

  desactivar() {
    this.estado = 0;
  }
}

module.exports = Producto;
