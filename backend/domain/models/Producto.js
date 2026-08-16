/**
 * Modelo de Dominio: Producto
 * Representa un producto del catálogo junto con sus datos de inventario y ficha técnica.
 * Mantiene campos del catálogo público y del CRUD administrativo.
 */
class Producto {
  constructor({
    id_producto = null,
    sku,
    nombre,
    descripcion = '',
    precio,
    stock,
    garantia,
    imagen_url,
    estado = 1,
    categoria,
    proveedor,
    id_categoria = null,
    fecha_creacion = new Date().toISOString(),
    fecha_actualizacion = new Date().toISOString()
  } = {}) {
    this.id_producto = id_producto;
    this.sku = sku || null;
    this.nombre = nombre;
    this.descripcion = descripcion;
    this.precio = precio;
    this.stock = stock;
    this.garantia = garantia || null;
    this.imagen_url = imagen_url || null;
    this.estado = estado; // 1 = Activo, 0 = Inactivo
    this.categoria = categoria || null; // string del nombre (para catálogo)
    this.proveedor = proveedor || null; // string del nombre (para catálogo)
    this.id_categoria = id_categoria; // para CRUD admin
    this.fecha_creacion = fecha_creacion;
    this.fecha_actualizacion = new Date().toISOString();
  }

  esVisiblePublicamente() {
    return this.estado === 1;
  }

  desactivar() {
    this.estado = 0;
  }
}

module.exports = Producto;
