const Producto = require('../../../domain/models/Producto');
const ProductoRepository = require('../../../domain/ports/ProductoRepository');

/**
 * Adaptador de Infraestructura: InMemoryProductoRepository
 * Implementa el puerto ProductoRepository usando memoria volátil.
 * Conserva los métodos públicos existentes y agrega los del CRUD.
 */
class InMemoryProductoRepository extends ProductoRepository {
  constructor() {
    super();
    this.productos = [];
    this.contadorId = 0;
  }

  async findActivos() {
    return this.productos.filter((producto) => producto.estado === 1);
  }

  async findById(id) {
    return this.productos.find((p) => p.id_producto === id) || null;
  }

  async guardar(productoData) {
    const nuevoId = this.contadorId + 1;
    const nuevoProducto = new Producto({
      ...productoData,
      id_producto: nuevoId,
      estado: productoData.estado ?? 1,
      fecha_creacion: new Date().toISOString(),
      fecha_actualizacion: new Date().toISOString() // AÑADIDO
    });

    this.productos.push(nuevoProducto);
    this.contadorId = nuevoId;
    return new Producto({ ...nuevoProducto });
  }

  async buscarPorNombre(nombre) {
    return this.productos.find(
      (p) => p.nombre.toLowerCase() === nombre.toLowerCase()
    ) || null;
  }

  async actualizar(id_producto, datos) {
    const index = this.productos.findIndex((p) => p.id_producto === id_producto);
    if (index === -1) throw new Error('Producto no encontrado');

    const actualizado = new Producto({
      ...this.productos[index],
      ...datos,
      id_producto,
      fecha_creacion: this.productos[index].fecha_creacion,
      fecha_actualizacion: new Date().toISOString()
    });

    this.productos[index] = actualizado;
    return new Producto({ ...actualizado });
  }

  async eliminar(id_producto) {
    const producto = await this.findById(id_producto);
    if (!producto) throw new Error('Producto no encontrado');
    // Borrado lógico (RN-101)
    return this.actualizar(id_producto, { estado: 0 });
  }
}

module.exports = InMemoryProductoRepository;