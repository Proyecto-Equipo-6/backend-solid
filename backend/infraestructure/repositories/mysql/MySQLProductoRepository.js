const ProductoRepository = require('../../../domain/ports/ProductoRepository');
const pool = require('../../database/db');

const SELECT_BASE = `
  SELECT
    p.id_producto,
    p.sku,
    p.id_categoria,
    p.id_proveedor,
    p.nombre,
    p.descripcion,
    p.precio,
    p.stock,
    p.garantia,
    p.imagen_url,
    p.estado,
    c.nombre AS categoria,
    pr.razon_social AS proveedor
  FROM productos p
  INNER JOIN categorias c   ON p.id_categoria = c.id_categoria
  INNER JOIN proveedores pr ON p.id_proveedor = pr.id_proveedor
`;

/**
 * Adaptador de Infraestructura: MySQLProductoRepository
 * Implementa el contrato ProductoRepository usando MySQL (mysql2/promise).
 * Incluye el catálogo público y el CRUD administrativo (CU-023).
 */
class MySQLProductoRepository extends ProductoRepository {
  async findActivos() {
    const query = `${SELECT_BASE} WHERE p.estado = 1 ORDER BY p.id_producto ASC`;
    const [rows] = await pool.execute(query);
    return rows;
  }

  async findById(id) {
    const query = `${SELECT_BASE} WHERE p.id_producto = ? LIMIT 1`;
    const [rows] = await pool.execute(query, [id]);
    return rows[0] || null;
  }

  async guardar(productoData) {
    const {
      id_categoria,
      id_proveedor,
      nombre,
      descripcion,
      precio,
      stock,
      imagen_url,
      estado,
    } = productoData;

    let proveedorFinal = id_proveedor;
    if (!proveedorFinal) {
      const [rows] = await pool.execute(
        'SELECT id_proveedor FROM proveedores WHERE estado = 1 ORDER BY id_proveedor ASC LIMIT 1'
      );
      if (rows.length === 0) {
        throw new Error('No hay proveedores activos para asignar al producto');
      }
      proveedorFinal = rows[0].id_proveedor;
    }

    const sku = productoData.sku || `PROD-${Date.now()}`;

    const [result] = await pool.execute(
      `INSERT INTO productos
        (sku, id_categoria, id_proveedor, nombre, descripcion, precio, stock, garantia, imagen_url, estado)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        sku,
        id_categoria,
        proveedorFinal,
        nombre,
        descripcion,
        precio,
        stock,
        'Sin garantía',
        imagen_url,
        estado ?? 1,
      ]
    );
    return this.findById(result.insertId);
  }

  async buscarPorNombre(nombre) {
    const query = `${SELECT_BASE} WHERE p.nombre = ? LIMIT 1`;
    const [rows] = await pool.execute(query, [nombre]);
    return rows[0] || null;
  }

  async actualizar(id_producto, datos) {
    const { id_categoria, id_proveedor, nombre, descripcion, precio, stock, estado } = datos;
    const actual = await this.findById(id_producto);
    if (!actual) throw new Error('Producto no encontrado');

    const proveedorFinal = id_proveedor ?? actual.id_proveedor;

    await pool.execute(
      `UPDATE productos
       SET id_categoria = ?, id_proveedor = ?, nombre = ?, descripcion = ?, precio = ?, stock = ?, estado = ?
       WHERE id_producto = ?`,
      [id_categoria, proveedorFinal, nombre, descripcion, precio, stock, estado, id_producto]
    );
    return this.findById(id_producto);
  }

  async eliminar(id_producto) {
    await pool.execute('UPDATE productos SET estado = 0 WHERE id_producto = ?', [id_producto]);
    return true;
  }
}

module.exports = MySQLProductoRepository;