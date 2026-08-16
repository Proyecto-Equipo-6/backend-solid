const CarritoRepository = require('../../../domain/ports/CarritoRepository');
const pool = require('../../database/db');

function aCarritoItem(fila) {
  return {
    idProducto: fila.id_producto,
    titulo: fila.nombre,
    imagen: fila.imagen_url,
    precio: Number(fila.precio),
    stock: Number(fila.stock),
    cantidad: Number(fila.cantidad),
    garantia: fila.garantia,
    subtotal: Number((Number(fila.precio) * Number(fila.cantidad)).toFixed(2)),
  };
}

function construirCarrito(filas) {
  const items = filas.map(aCarritoItem);
  const total = Number(items.reduce((acc, item) => acc + item.subtotal, 0).toFixed(2));
  return { items, total };
}

class MySQLCarritoRepository extends CarritoRepository {
  async _obtenerOCrearCarrito(idUsuario) {
    const [filas] = await pool.execute(
      'SELECT id_carrito FROM carrito WHERE id_usuario = ? LIMIT 1',
      [idUsuario]
    );
    if (filas[0]) return filas[0].id_carrito;

    const [resultado] = await pool.execute(
      'INSERT INTO carrito (id_usuario) VALUES (?)',
      [idUsuario]
    );
    return resultado.insertId;
  }

  async obtenerCarrito(idUsuario) {
    const idCarrito = await this._obtenerOCrearCarrito(idUsuario);
    const [filas] = await pool.execute(
      `SELECT cd.id_producto, cd.cantidad, p.nombre, p.imagen_url, p.precio, p.stock, p.garantia
       FROM carrito_detalles cd
       INNER JOIN productos p ON p.id_producto = cd.id_producto
       WHERE cd.id_carrito = ?
       ORDER BY cd.fecha_agregado ASC`,
      [idCarrito]
    );
    return construirCarrito(filas);
  }

  async agregarProducto(idUsuario, producto, cantidad) {
    const idCarrito = await this._obtenerOCrearCarrito(idUsuario);
    await pool.execute(
      `INSERT INTO carrito_detalles (id_carrito, id_producto, cantidad) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE cantidad = cantidad + VALUES(cantidad)`,
      [idCarrito, producto.id, cantidad]
    );
    return this.obtenerCarrito(idUsuario);
  }

  async actualizarCantidad(idUsuario, idProducto, cantidad) {
    const idCarrito = await this._obtenerOCrearCarrito(idUsuario);
    await pool.execute(
      'UPDATE carrito_detalles SET cantidad = ? WHERE id_carrito = ? AND id_producto = ?',
      [cantidad, idCarrito, idProducto]
    );
    return this.obtenerCarrito(idUsuario);
  }

  async eliminarProducto(idUsuario, idProducto) {
    const idCarrito = await this._obtenerOCrearCarrito(idUsuario);
    await pool.execute(
      'DELETE FROM carrito_detalles WHERE id_carrito = ? AND id_producto = ?',
      [idCarrito, idProducto]
    );
    return this.obtenerCarrito(idUsuario);
  }

  async obtenerCantidad(idUsuario, idProducto) {
    const idCarrito = await this._obtenerOCrearCarrito(idUsuario);
    const [filas] = await pool.execute(
      'SELECT cantidad FROM carrito_detalles WHERE id_carrito = ? AND id_producto = ? LIMIT 1',
      [idCarrito, idProducto]
    );
    return filas[0] ? Number(filas[0].cantidad) : 0;
  }
}

module.exports = MySQLCarritoRepository;