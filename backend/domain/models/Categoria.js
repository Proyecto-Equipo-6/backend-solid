/**
 * Modelo de Dominio: Categoria
 * Representa una categoría del catálogo de productos.
 */
class Categoria {
  constructor({ id_categoria = null, nombre, descripcion = '', estado = 1, fecha_creacion = new Date().toISOString() } = {}) 
  {
    this.id_categoria = id_categoria;
    this.nombre = nombre;
    this.descripcion = descripcion;
    this.estado = estado;
    this.fecha_creacion = fecha_creacion;
  }
}

module.exports = Categoria;
