const ProductoRepository = require('../../../domain/ports/ProductoRepository');
const pool = require('../../database/db');

const SELECT_BASE = `
  SELECT
    p.id_producto,
    p.sku,
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
}

module.exports = MySQLProductoRepository;
