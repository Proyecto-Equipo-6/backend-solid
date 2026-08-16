const PedidoRepartidorRepository = require('../../../domain/ports/PedidoRepartidorRepository');
const Pedido = require('../../../domain/models/Pedido');
const pool = require('../../database/db');

/**
 * Adaptador de Infraestructura: MySQLPedidoRepartidorRepository
 * Persiste el flujo del repartidor (CU-015 a CU-018) en MySQL.
 * Requiere la columna `pedidos.id_repartidor` y la tabla `repartidores`
 * (ver reports/db/2026-08-16_cambios-bd-admin-tickets.md, sección 2.5).
 */
class MySQLPedidoRepartidorRepository extends PedidoRepartidorRepository {
  _mapearFila(fila) {
    if (!fila) return null;
    return new Pedido({
      id_pedido: fila.id_pedido,
      id_usuario: fila.id_usuario,
      id_repartidor: fila.id_repartidor,
      id_metodo_pago: fila.id_metodo_pago,
      direccion_entrega: fila.direccion_entrega,
      total: fila.total,
      estado: fila.estado,
      comprobante_url: fila.comprobante_url,
      observaciones: fila.observaciones,
      motivo_cancelacion: fila.motivo_cancelacion,
      fecha_pedido: fila.fecha_pedido,
      fecha_actualizacion: fila.fecha_actualizacion,
      clienteNombre: fila.cliente_nombre || '',
      clienteTelefono: fila.cliente_telefono || '',
      caracteristicasLogistica: fila.caracteristicas_logistica || 'Ninguna',
    });
  }

  // CU-015: pedidos ASIGNADO del día, ordenados por asignación ascendente (RN-059/RN-060)
  async obtenerPedidosAsignadosDelDia(repartidorId) {
    const [filas] = await pool.execute(
      `SELECT p.*, u.nombre_apellido AS cliente_nombre, u.telefono AS cliente_telefono
       FROM pedidos p
       JOIN usuarios u ON u.id_usuario = p.id_usuario
       WHERE p.id_repartidor = ?
         AND p.estado = 'ASIGNADO'
         AND DATE(p.fecha_actualizacion) = CURDATE()
       ORDER BY p.fecha_actualizacion ASC`,
      [repartidorId]
    );
    return filas.map((fila) => this._mapearFila(fila));
  }

  // CU-016: detalle de un pedido (sin productos, RN-062)
  async obtenerPedidoPorId(pedidoId) {
    const [filas] = await pool.execute(
      `SELECT p.*, u.nombre_apellido AS cliente_nombre, u.telefono AS cliente_telefono
       FROM pedidos p
       JOIN usuarios u ON u.id_usuario = p.id_usuario
       WHERE p.id_pedido = ?
       LIMIT 1`,
      [pedidoId]
    );
    return this._mapearFila(filas[0]);
  }

  // CU-017: actualizar estado con validación de concurrencia (RN-065 a RN-070)
  async actualizarEstadoPedido(pedidoId, nuevoEstado, estadoAnterior, datosAdicionales = {}) {
    const [resultado] = await pool.execute(
      `UPDATE pedidos
       SET estado = ?, comprobante_url = COALESCE(?, comprobante_url), observaciones = COALESCE(?, observaciones)
       WHERE id_pedido = ? AND estado = ?`,
      [
        nuevoEstado,
        datosAdicionales.foto || null,
        datosAdicionales.observacion || null,
        pedidoId,
        estadoAnterior,
      ]
    );

    if (resultado.affectedRows === 0) {
      throw new Error('El pedido fue actualizado por otro proceso. Recargue la información.');
    }

    return this.obtenerPedidoPorId(pedidoId);
  }

  // CU-018: historial de pedidos finalizados (RN-071/RN-072/RN-075)
  async obtenerHistorialPedidos(repartidorId, filtros = {}) {
    const estadosFinales = ['ENTREGADO', 'NO_ENTREGADO', 'CANCELADO'];
    let sql = `
      SELECT p.id_pedido, p.estado, p.direccion_entrega,
             COALESCE(p.fecha_actualizacion, p.fecha_pedido) AS fechaEntregaReal
      FROM pedidos p
      WHERE p.id_repartidor = ?
        AND p.estado IN (${estadosFinales.map(() => '?').join(', ')})`;
    const params = [repartidorId, ...estadosFinales];

    if (filtros.filtroEstado) {
      sql += ' AND p.estado = ?';
      params.push(filtros.filtroEstado);
    }

    sql += ' ORDER BY fechaEntregaReal DESC';

    const [filas] = await pool.execute(sql, params);
    return filas;
  }

  // CU-018: conteos del mes y la semana actuales (RN-073/RN-076)
  async contarPedidosDelPeriodo(repartidorId) {
    const estadosFinales = ['ENTREGADO', 'NO_ENTREGADO', 'CANCELADO'];
    const [filas] = await pool.execute(
      `SELECT
         SUM(CASE WHEN COALESCE(p.fecha_actualizacion, p.fecha_pedido) >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
                  THEN 1 ELSE 0 END) AS totalMes,
         SUM(CASE WHEN COALESCE(p.fecha_actualizacion, p.fecha_pedido) >= DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY)
                  THEN 1 ELSE 0 END) AS totalSemana
       FROM pedidos p
       WHERE p.id_repartidor = ?
         AND p.estado IN (${estadosFinales.map(() => '?').join(', ')})`,
      [repartidorId, ...estadosFinales]
    );

    return {
      totalMes: Number(filas[0]?.totalMes) || 0,
      totalSemana: Number(filas[0]?.totalSemana) || 0,
    };
  }
}

module.exports = MySQLPedidoRepartidorRepository;