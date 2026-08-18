const Producto = require('../../../domain/models/Producto');
const ProductoRepository = require('../../../domain/ports/ProductoRepository');

class InMemoryProductoRepository extends ProductoRepository {
  constructor(productos = []) {
    super();
    this.productos = productos.map(p => new Producto({ ...p }));
    this.contadorId = this.productos.length > 0
      ? Math.max(...this.productos.map(p => p.id_producto))
      : 0;
    this.historialStock = [];
    this.productosConHistorial = new Set(); // ids de productos con ventas
  }

  async findActivos() {
    return this.productos.filter(p => p.estado === 1);
  }

  async findById(id) {
    return this.productos.find(p => p.id_producto === id) || null;
  }

  async buscarPorNombre(nombre) {
    return this.productos.find(
      p => p.nombre.toLowerCase() === nombre.toLowerCase()
    ) || null;
  }

  async buscarPorSKU(sku) {
    return this.productos.find(
      p => p.sku && p.sku.toLowerCase() === sku.toLowerCase()
    ) || null;
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

    // Borrado lógico siempre (RN-101)
    const productoDesactivado = await this.actualizar(id_producto, { estado: 0 });

    return {
      producto: productoDesactivado,
      teniaHistorial: this.productosConHistorial.has(id_producto)
    };
  }

  async reintegrarInventario(id_producto, cantidad) {
    const producto = await this.findById(id_producto);
    if (!producto) throw new Error('Producto no encontrado');

    const nuevoStock = producto.stock + cantidad;
    return this.actualizar(id_producto, { stock: nuevoStock });
  }

  async registrarAjusteStock(id_producto, cantidad_nueva, motivo) {
    const producto = await this.findById(id_producto);
    if (!producto) throw new Error('Producto no encontrado');

    if (cantidad_nueva === undefined || cantidad_nueva === null || cantidad_nueva < 0) {
      throw new Error('El stock no puede ser negativo');
    }
    if (!motivo || motivo.trim() === '') {
      throw new Error('El motivo del ajuste es obligatorio');
    }

    const cantidad_anterior = producto.stock;
    await this.actualizar(id_producto, { stock: cantidad_nueva });

    const registro = {
      id_historial: this.historialStock.length + 1,
      id_producto,
      id_admin: null,
      cantidad_anterior,
      cantidad_nueva,
      motivo: motivo.trim(),
      fecha: new Date().toISOString()
    };

    this.historialStock.push(registro);

    return {
      id_producto,
      cantidad_anterior,
      cantidad_nueva,
      motivo: motivo.trim()
    };
  }

  // Métodos para simular historial transaccional
  marcarConHistorial(idProducto) {
    this.productosConHistorial.add(idProducto);
  }

  tieneHistorial(idProducto) {
    return this.productosConHistorial.has(idProducto);
  }
}

module.exports = InMemoryProductoRepository;