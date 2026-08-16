const AnaliticaRepository = require('../../../domain/ports/AnaliticaRepository');
const pool = require('../../database/db');

/**
 * Adaptador de Infraestructura: MySQLAnaliticaRepository
 * Ejecuta las consultas agregadas de los reportes usando inner joins.
 * (Principio de Sustitución de Liskov - LSP)
 */
class MySQLAnaliticaRepository extends AnaliticaRepository {
  async obtenerKpis() {
    const totales = await Promise.all([
      this._contarUsuarios(),
      this._contarPedidos(),
      this._sumarVentas(),
      this._contarProductos(),
    ]);

    const [seriesUsuarios, seriesPedidos, seriesVentas, seriesProductos] = await Promise.all([
      this._serieUsuarios(),
      this._seriePedidos(),
      this._serieVentas(),
      this._serieProductos(),
    ]);

    return {
      usuarios: totales[0],
      pedidos: totales[1],
      ventas: totales[2],
      productos: totales[3],
      series: {
        usuarios: seriesUsuarios,
        pedidos: seriesPedidos,
        ventas: seriesVentas,
        productos: seriesProductos,
      },
    };
  }

  async obtenerVentasPorMes(limite) {
    const query = `
      SELECT DATE_FORMAT(p.fecha_pedido, '%Y-%m') AS mes,
             COALESCE(SUM(p.total), 0) AS ventas,
             COUNT(p.id_pedido) AS pedidos
      FROM pedidos p
      INNER JOIN usuarios u ON u.id_usuario = p.id_usuario
      WHERE p.estado <> 'CANCELADO'
      GROUP BY mes
      ORDER BY mes DESC
      LIMIT ?
    `;
    const [rows] = await pool.execute(query, [limite]);
    return rows.map((fila) => ({
      mes: fila.mes,
      ventas: Number(fila.ventas),
      pedidos: Number(fila.pedidos),
    }));
  }

  async obtenerPedidosPorEstado() {
    const query = `
      SELECT p.estado,
             COUNT(p.id_pedido) AS cantidad,
             COALESCE(SUM(p.total), 0) AS total
      FROM pedidos p
      INNER JOIN usuarios u ON u.id_usuario = p.id_usuario
      GROUP BY p.estado
      ORDER BY cantidad DESC
    `;
    const [rows] = await pool.execute(query);
    return rows.map((fila) => ({
      estado: fila.estado,
      cantidad: Number(fila.cantidad),
      total: Number(fila.total),
    }));
  }

  async obtenerProductosMasVendidos(limite) {
    const query = `
      SELECT pr.id_producto, pr.nombre, pr.sku, c.nombre AS categoria,
             COALESCE(SUM(pd.cantidad), 0) AS unidades,
             COALESCE(SUM(pd.subtotal), 0) AS ventas
      FROM pedido_detalles pd
      INNER JOIN pedidos p ON p.id_pedido = pd.id_pedido
      INNER JOIN productos pr ON pr.id_producto = pd.id_producto
      INNER JOIN categorias c ON c.id_categoria = pr.id_categoria
      WHERE p.estado <> 'CANCELADO'
      GROUP BY pr.id_producto, pr.nombre, pr.sku, c.nombre
      ORDER BY ventas DESC
      LIMIT ?
    `;
    const [rows] = await pool.execute(query, [limite]);
    return rows.map((fila) => ({
      id_producto: fila.id_producto,
      nombre: fila.nombre,
      sku: fila.sku,
      categoria: fila.categoria,
      unidades: Number(fila.unidades),
      ventas: Number(fila.ventas),
    }));
  }

  async obtenerTopClientes(limite) {
    const query = `
      SELECT u.id_usuario, u.nombre_apellido, u.email,
             COUNT(p.id_pedido) AS pedidos,
             COALESCE(SUM(p.total), 0) AS total_gastado
      FROM pedidos p
      INNER JOIN usuarios u ON u.id_usuario = p.id_usuario
      WHERE p.estado <> 'CANCELADO'
      GROUP BY u.id_usuario, u.nombre_apellido, u.email
      ORDER BY total_gastado DESC
      LIMIT ?
    `;
    const [rows] = await pool.execute(query, [limite]);
    return rows.map((fila) => ({
      id_usuario: fila.id_usuario,
      nombre_apellido: fila.nombre_apellido,
      email: fila.email,
      pedidos: Number(fila.pedidos),
      total_gastado: Number(fila.total_gastado),
    }));
  }

  async _contarUsuarios() {
    const query = `
      SELECT COUNT(u.id_usuario) AS total
      FROM usuarios u
      INNER JOIN roles r ON r.id_rol = u.id_rol
    `;
    const [rows] = await pool.execute(query);
    return Number(rows[0].total);
  }

  async _contarPedidos() {
    const query = `
      SELECT COUNT(p.id_pedido) AS total
      FROM pedidos p
      INNER JOIN usuarios u ON u.id_usuario = p.id_usuario
    `;
    const [rows] = await pool.execute(query);
    return Number(rows[0].total);
  }

  async _sumarVentas() {
    const query = `
      SELECT COALESCE(SUM(p.total), 0) AS total
      FROM pedidos p
      INNER JOIN usuarios u ON u.id_usuario = p.id_usuario
      WHERE p.estado <> 'CANCELADO'
    `;
    const [rows] = await pool.execute(query);
    return Number(rows[0].total);
  }

  async _contarProductos() {
    const query = `
      SELECT COUNT(pr.id_producto) AS total
      FROM productos pr
      INNER JOIN categorias c ON c.id_categoria = pr.id_categoria
      INNER JOIN proveedores pv ON pv.id_proveedor = pr.id_proveedor
    `;
    const [rows] = await pool.execute(query);
    return Number(rows[0].total);
  }

  async _serieUsuarios() {
    const query = `
      SELECT DATE_FORMAT(u.fecha_creacion, '%Y-%m') AS mes, COUNT(*) AS valor
      FROM usuarios u
      INNER JOIN roles r ON r.id_rol = u.id_rol
      WHERE u.fecha_creacion >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY mes
      ORDER BY mes
    `;
    const [rows] = await pool.execute(query);
    return rows.map((fila) => ({ mes: fila.mes, valor: Number(fila.valor) }));
  }

  async _seriePedidos() {
    const query = `
      SELECT DATE_FORMAT(p.fecha_pedido, '%Y-%m') AS mes, COUNT(*) AS valor
      FROM pedidos p
      INNER JOIN usuarios u ON u.id_usuario = p.id_usuario
      WHERE p.fecha_pedido >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY mes
      ORDER BY mes
    `;
    const [rows] = await pool.execute(query);
    return rows.map((fila) => ({ mes: fila.mes, valor: Number(fila.valor) }));
  }

  async _serieVentas() {
    const query = `
      SELECT DATE_FORMAT(p.fecha_pedido, '%Y-%m') AS mes, COALESCE(SUM(p.total), 0) AS valor
      FROM pedidos p
      INNER JOIN usuarios u ON u.id_usuario = p.id_usuario
      WHERE p.estado <> 'CANCELADO'
        AND p.fecha_pedido >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY mes
      ORDER BY mes
    `;
    const [rows] = await pool.execute(query);
    return rows.map((fila) => ({ mes: fila.mes, valor: Number(fila.valor) }));
  }

  async _serieProductos() {
    const query = `
      SELECT DATE_FORMAT(pr.fecha_creacion, '%Y-%m') AS mes, COUNT(*) AS valor
      FROM productos pr
      INNER JOIN categorias c ON c.id_categoria = pr.id_categoria
      INNER JOIN proveedores pv ON pv.id_proveedor = pr.id_proveedor
      WHERE pr.fecha_creacion >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY mes
      ORDER BY mes
    `;
    const [rows] = await pool.execute(query);
    return rows.map((fila) => ({ mes: fila.mes, valor: Number(fila.valor) }));
  }
}

module.exports = MySQLAnaliticaRepository;