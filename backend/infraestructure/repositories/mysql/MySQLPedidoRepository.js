const PedidoRepository = require('../../../domain/ports/PedidoRepository');
const pool = require('../../database/db');

/**
 * Adaptador de Infraestructura: MySQLPedidoRepository
 * Persiste pedidos en MySQL. La generación del pedido es una transacción ACID
 * (RN-041): inserta el pedido, sus detalles, descuenta stock y vacía el carrito.
 */
class MySQLPedidoRepository extends PedidoRepository {
  async crearPedidoConTransaccion({ idUsuario, idMetodoPago, direccionEntrega, observaciones, items, total }) {
    const conexion = await pool.getConnection();
    try {
      await conexion.beginTransaction();

      // 1. Crear el pedido con estado PENDIENTE (RN-045)
      const [resultadoPedido] = await conexion.execute(
        `INSERT INTO pedidos (id_usuario, id_metodo_pago, direccion_entrega, total, estado, observaciones)
         VALUES (?, ?, ?, ?, 'PENDIENTE', ?)`,
        [idUsuario, idMetodoPago, direccionEntrega, total, observaciones]
      );
      const idPedido = resultadoPedido.insertId;

      // 2. Insertar los detalles del pedido (RN-042: refleja exactamente el carrito)
      for (const item of items) {
        const subtotal = Number((Number(item.precio) * Number(item.cantidad)).toFixed(2));
        await conexion.execute(
          `INSERT INTO pedido_detalles (id_pedido, id_producto, cantidad, precio_unitario, subtotal)
           VALUES (?, ?, ?, ?, ?)`,
          [idPedido, item.idProducto, item.cantidad, item.precio, subtotal]
        );

        // 3. Descontar stock (RN-041)
        await conexion.execute(
          'UPDATE productos SET stock = stock - ? WHERE id_producto = ? AND stock >= ?',
          [item.cantidad, item.idProducto, item.cantidad]
        );
      }

      // 4. Vaciar el carrito (RN-047: pedido completo, no parcial)
      const [carrito] = await conexion.execute(
        'SELECT id_carrito FROM carrito WHERE id_usuario = ? LIMIT 1',
        [idUsuario]
      );
      if (carrito[0]) {
        await conexion.execute(
          'DELETE FROM carrito_detalles WHERE id_carrito = ?',
          [carrito[0].id_carrito]
        );
      }

      await conexion.commit();

      return {
        id_pedido: idPedido,
        fecha_pedido: new Date().toISOString(),
      };
    } catch (error) {
      await conexion.rollback();
      throw error;
    } finally {
      conexion.release();
    }
  }

  async obtenerPedidosPorUsuario(idUsuario) {
    const [filas] = await pool.execute(
      `SELECT id_pedido, id_metodo_pago, direccion_entrega, total, estado, observaciones, fecha_pedido
       FROM pedidos
       WHERE id_usuario = ?
       ORDER BY fecha_pedido DESC`,
      [idUsuario]
    );
    return filas;
  }

  async obtenerPedidoPorId(idPedido) {
    const [filas] = await pool.execute(
      `SELECT id_pedido, id_usuario, id_metodo_pago, direccion_entrega, total, estado, observaciones, motivo_cancelacion, fecha_pedido
       FROM pedidos
       WHERE id_pedido = ?
       LIMIT 1`,
      [idPedido]
    );
    return filas[0] || null;
  }

  async cancelarPedido(idPedido, idUsuario, motivo) {
    const [resultado] = await pool.execute(
      `UPDATE pedidos
       SET estado = 'CANCELADO', motivo_cancelacion = ?
       WHERE id_pedido = ? AND id_usuario = ? AND estado = 'PENDIENTE'`,
      [motivo, idPedido, idUsuario]
    );
    return resultado.affectedRows > 0;
  }

  async obtenerDetallePedido(idPedido) {
    const [filas] = await pool.execute(
      `SELECT
         p.id_pedido,
         u.nombre_apellido AS clienteNombre,
         u.telefono AS clienteTelefono,
         p.direccion_entrega,
         p.total,
         p.estado,
         p.comprobante_url
       FROM pedidos p
       INNER JOIN usuarios u ON p.id_usuario = u.id_usuario
       WHERE p.id_pedido = ?
       LIMIT 1`,
      [idPedido]
    );
    return filas[0] || null;
  }

  async obtenerDetallesPorPedido(idPedido) {
    const [filas] = await pool.execute(
      `SELECT id_producto, cantidad, precio_unitario, subtotal
       FROM pedido_detalles
       WHERE id_pedido = ?
       ORDER BY id_detalle ASC`,
      [idPedido]
    );
    return filas;
  }
}

module.exports = MySQLPedidoRepository;