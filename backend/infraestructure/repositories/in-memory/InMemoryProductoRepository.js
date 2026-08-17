const Producto = require('../../../domain/models/Producto');
const ProductoRepository = require('../../../domain/ports/ProductoRepository');

class InMemoryProductoRepository extends ProductoRepository {
  constructor(productos = []) {
    super();
    this.productos = productos.map(p => new Producto({ ...p }));
    this.contadorId = this.productos.length > 0
      ? Math.max(...this.productos.map(p => p.id_producto))
      : 0;
  }

  async findActivos() {
    return this.productos.filter(p => p.estado === 1);
  }

  async findById(id) {
    return this.productos.find(p => p.id_producto === id) || null;
  }

  async guardar(productoData) {
    const nuevoId = this.contadorId + 1;
    const nuevoProducto = new Producto({
      ...productoData,
      id_producto: nuevoId,
      estado: productoData.estado ?? 1,
      fecha_creacion: new Date().toISOString()
    });
    this.productos.push(nuevoProducto);
    this.contadorId = nuevoId;
    return new Producto({ ...nuevoProducto });
  }

  async buscarPorNombre(nombre) {
    return this.productos.find(
      p => p.nombre.toLowerCase() === nombre.toLowerCase()
    ) || null;
  }

  async actualizar(id_producto, datos) {
    const index = this.productos.findIndex(p => p.id_producto === id_producto);
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
    return this.actualizar(id_producto, { estado: 0 });
  }

  // NUEVO: Reintegrar inventario (RN-012.2)
  async reintegrarInventario(id_producto, cantidad) {
    const producto = await this.findById(id_producto);
    if (!producto) throw new Error('Producto no encontrado');

    const nuevoStock = producto.stock + cantidad;
    return this.actualizar(id_producto, { stock: nuevoStock });
  }
}

module.exports = InMemoryProductoRepository;