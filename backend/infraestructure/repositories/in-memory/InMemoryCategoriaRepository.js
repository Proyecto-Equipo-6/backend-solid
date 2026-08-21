const Categoria = require('../../../domain/models/Categoria');
const CategoriaRepository = require('../../../domain/ports/CategoriaRepository');

/**
 * Adaptador de Infraestructura: InMemoryCategoriaRepository
 * Implementa la interfaz (puerto) CategoriaRepository usando memoria volátil.
 * (Principio de Sustitución de Liskov - LSP)
 */
class InMemoryCategoriaRepository extends CategoriaRepository {
  constructor() {
    super();
    this.categorias = [];
    this.contadorId = 0;
    this.productosAsociados = new Map(); // id_categoria -> cantidad de productos
  }

  async findActivos() {
    return this.categorias.filter((categoria) => categoria.estado === 1);
  }

  async guardar(categoriaData) {
    const nuevoId = this.contadorId + 1;
    const nuevaCategoria = new Categoria({
      ...categoriaData,
      id_categoria: nuevoId,
      estado: categoriaData.estado ?? 1,
      fecha_creacion: new Date().toISOString()
    });

    this.categorias.push(nuevaCategoria);
    this.contadorId = nuevoId;
    return new Categoria({ ...nuevaCategoria });
  }

  async buscarPorNombre(nombre) {
    return this.categorias.find(
      (c) => c.nombre.toLowerCase() === nombre.toLowerCase()
    ) || null;
  }

  async buscarPorId(id_categoria) {
    return this.categorias.find((c) => c.id_categoria === id_categoria) || null;
  }

  async actualizar(id_categoria, datos) {
    const index = this.categorias.findIndex((c) => c.id_categoria === id_categoria);
    if (index === -1) throw new Error('Categoría no encontrada');

    const actualizada = new Categoria({
      ...this.categorias[index],
      ...datos,
      id_categoria,
      fecha_creacion: this.categorias[index].fecha_creacion // no se modifica
    });

    this.categorias[index] = actualizada;
    return new Categoria({ ...actualizada });
  }

  async eliminar(id_categoria) {
  const categoria = await this.buscarPorId(id_categoria);
  if (!categoria) throw new Error('Categoría no encontrada');

  // Borrado lógico: estado = 0 (Inactivo)
  return this.actualizar(id_categoria, { estado: 0 });
  }

  async contarProductosAsociados(id_categoria) {
    return this.productosAsociados.get(id_categoria) || 0;
  }

  setProductosAsociados(id_categoria, cantidad) {
    this.productosAsociados.set(id_categoria, cantidad);
  }
}

module.exports = InMemoryCategoriaRepository;
