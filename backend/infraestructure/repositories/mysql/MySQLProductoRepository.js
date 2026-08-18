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
    // Verificar si el producto tiene ventas en el historial (pedido_detalles)
    const [historial] = await pool.execute(
      'SELECT COUNT(*) AS total FROM pedido_detalles WHERE id_producto = ?',
      [id_producto]
    );
    const teniaHistorial = Number(historial[0]?.total) > 0;

    // Borrado lógico (RN-101)
    await pool.execute('UPDATE productos SET estado = 0 WHERE id_producto = ?', [id_producto]);

    return {
      teniaHistorial
    };
  }

  async reintegrarInventario(id_producto, cantidad) {
    const producto = await this.findById(id_producto);
    if (!producto) throw new Error('Producto no encontrado');

    const nuevoStock = producto.stock + cantidad;
    await pool.execute(
      'UPDATE productos SET stock = ? WHERE id_producto = ?',
      [nuevoStock, id_producto]
    );
    return this.findById(id_producto);
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

    await pool.execute(
      'UPDATE productos SET stock = ? WHERE id_producto = ?',
      [cantidad_nueva, id_producto]
    );

    await pool.execute(
      'INSERT INTO historial_stock (id_producto, id_admin, cantidad_anterior, cantidad_nueva, motivo) VALUES (?, 1, ?, ?, ?)',
      [id_producto, cantidad_anterior, cantidad_nueva, motivo.trim()]
    );

    return {
      id_producto,
      cantidad_anterior,
      cantidad_nueva,
      motivo: motivo.trim()
    };
  }

  async sugerencias(termino, limite = 5) {
    const [filas] = await pool.execute(
      `SELECT p.id_producto, p.nombre, p.imagen_url
       FROM productos p
       WHERE p.estado = 1 AND p.nombre LIKE ?
       ORDER BY p.nombre ASC
       LIMIT ?`,
      [`%${termino}%`, limite]
    );
    return filas;
  }

  async buscar(termino, filtros = {}) {
    let sql = `
      SELECT p.id_producto, p.sku, p.nombre, p.descripcion, p.precio, p.stock,
             p.garantia, p.imagen_url, p.estado,
             c.nombre AS categoria, pr.razon_social AS proveedor
      FROM productos p
      INNER JOIN categorias c ON p.id_categoria = c.id_categoria
      INNER JOIN proveedores pr ON p.id_proveedor = pr.id_proveedor
      WHERE p.estado = 1 AND p.nombre LIKE ?`;
    const params = [`%${termino}%`];

    if (filtros.categoria) {
      sql += ' AND p.id_categoria = ?';
      params.push(filtros.categoria);
    }
    if (filtros.precioMin) {
      sql += ' AND p.precio >= ?';
      params.push(filtros.precioMin);
    }
    if (filtros.precioMax) {
      sql += ' AND p.precio <= ?';
      params.push(filtros.precioMax);
    }

    sql += ' ORDER BY p.nombre ASC';

    const pagina = Number(filtros.pagina) || 1;
    const limite = Number(filtros.limite) || 12;
    const offset = (pagina - 1) * limite;
    sql += ' LIMIT ? OFFSET ?';
    params.push(limite, offset);

    const [filas] = await pool.execute(sql, params);

    // Contar total
    let sqlCount = 'SELECT COUNT(*) AS total FROM productos p WHERE p.estado = 1 AND p.nombre LIKE ?';
    const paramsCount = [`%${termino}%`];
    if (filtros.categoria) {
      sqlCount += ' AND p.id_categoria = ?';
      paramsCount.push(filtros.categoria);
    }
    const [countResult] = await pool.execute(sqlCount, paramsCount);
    const total = Number(countResult[0]?.total) || 0;

    return {
      items: filas,
      total,
      pagina,
      limite,
      totalPaginas: Math.ceil(total / limite),
    };
  }
}

module.exports = MySQLProductoRepository;