/**
 * Modelo de Dominio: Categoria
 * Representa una categoría del catálogo de productos.
 */
class Categoria {
  constructor({ id_categoria = null, nombre, descripcion } = {}) {
    this.id_categoria = id_categoria;
    this.nombre = nombre;
    this.descripcion = descripcion;
  }
}

module.exports = Categoria;
