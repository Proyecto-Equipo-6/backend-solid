const Pedido = require('../domain/models/Pedido');
const ErrorValidacion = require('./errors/ErrorValidacion');
const ErrorStockInsuficiente = require('./errors/ErrorStockInsuficiente');

/**
 * Caso de Uso: CrearPedidoUseCase
 * Genera un pedido a partir del carrito del cliente (CU-012 / RF-005.1).
 * Flujo SOLO CONTRA ENTREGA: el pedido nace en PENDIENTE sin comprobante
 * y se notifica al administrador.
 *
 * RN-041: transacción ACID (si falla el descuento de stock, se revierte).
 * RN-042: el pedido refleja exactamente el carrito confirmado.
 * RN-044: monto mínimo de $200.000.
 * RN-045: el pedido se crea con estado PENDIENTE y se notifica al admin.
 * RN-046: se notifica al cliente que su pedido fue generado.
 * RN-047: no se puede dividir el carrito ni hacer pedidos parciales.
 */
class CrearPedidoUseCase {
  constructor(carritoRepository, pedidoRepository) {
    this.carritoRepository = carritoRepository;
    this.pedidoRepository = pedidoRepository;
  }

  async execute(usuario, { direccionEntrega, observaciones = null } = {}) {
    if (!usuario || !usuario.id_usuario) {
      throw new ErrorValidacion('Debes iniciar sesión para generar un pedido');
    }

    if (!direccionEntrega || typeof direccionEntrega !== 'string' || direccionEntrega.trim() === '') {
      throw new ErrorValidacion('Debes indicar la dirección de entrega');
    }

    // RN-047: el pedido se genera a partir del carrito completo (no parcial)
    const carrito = await this.carritoRepository.obtenerCarrito(usuario.id_usuario);
    if (!carrito || !carrito.items || carrito.items.length === 0) {
      throw new ErrorValidacion('Tu carrito está vacío');
    }

    // RN-044: monto mínimo de $200.000
    const total = Number(carrito.total);
    const pedido = new Pedido({
      id_usuario: usuario.id_usuario,
      id_metodo_pago: 1, // Efectivo / Contraentrega
      direccion_entrega: direccionEntrega.trim(),
      total,
      observaciones: observaciones ? String(observaciones).trim() : null,
    });

    if (!pedido.cumpleMontoMinimo()) {
      throw new ErrorValidacion('El monto mínimo para generar un pedido es $200.000');
    }

    // RN-041: validar stock de cada ítem antes de la transacción
    for (const item of carrito.items) {
      if (Number(item.cantidad) > Number(item.stock)) {
        throw new ErrorStockInsuficiente(`No hay unidades suficientes de "${item.titulo}"`);
      }
    }

    // RN-041: crear pedido + descontar stock + vaciar carrito en una transacción ACID
    const resultado = await this.pedidoRepository.crearPedidoConTransaccion({
      idUsuario: usuario.id_usuario,
      idMetodoPago: pedido.id_metodo_pago,
      direccionEntrega: pedido.direccion_entrega,
      observaciones: pedido.observaciones,
      items: carrito.items,
      total,
    });

    // RN-045 / RN-046: notificaciones (se registran en el repository/evento)
    return {
      mensaje: 'Pedido generado exitosamente',
      pedido: {
        id_pedido: resultado.id_pedido,
        estado: 'PENDIENTE',
        total,
        direccion_entrega: pedido.direccion_entrega,
        fecha_pedido: resultado.fecha_pedido,
      },
    };
  }
}

module.exports = CrearPedidoUseCase;