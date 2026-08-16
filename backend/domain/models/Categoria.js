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

  esActivo() {
    return this.estado === 1;
  }

  cambiarEstado(nuevoEstado) {
    if (nuevoEstado === 'Activo') this.estado = 1;
    else if (nuevoEstado === 'Inactivo') this.estado = 0;
    else if ([0, 1].includes(nuevoEstado)) this.estado = nuevoEstado;
    else throw new Error('Estado inválido');
  }
}

module.exports = Categoria;
