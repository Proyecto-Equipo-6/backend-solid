/**
 * Caso de Uso: GenerarTicketPedidoUseCase
 * Genera el HTML del ticket de un pedido para impresión a PDF (CU-031).
 * RN-050: solo disponible en estado CONFIRMADO.
 * RN-053: nombre del archivo Ticket_Pedido_[ID].pdf
 */
class GenerarTicketPedidoUseCase {
  constructor(pedidoRepartidorRepository) {
    this.pedidoRepartidorRepository = pedidoRepartidorRepository;
  }

  async execute(id_pedido) {
    const pedido = await this.pedidoRepartidorRepository.obtenerDetallePedido(id_pedido);
    if (!pedido) {
      throw new Error('Pedido no encontrado');
    }

    if (pedido.estado !== 'CONFIRMADO') {
      throw new Error('El ticket solo está disponible en estado CONFIRMADO');
    }

    const detalles = await this.pedidoRepartidorRepository.obtenerDetallesPorPedido(id_pedido);

    const html = this._generarHTML(pedido, detalles);

    return {
      nombreArchivo: `Ticket_Pedido_${id_pedido}.pdf`,
      html,
      formato: 'text/html',
    };
  }

  _generarHTML(pedido, detalles) {
    const fecha = new Date(pedido.fecha_pedido).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const productosHTML = detalles.map(d => `
      <tr>
        <td>${d.producto_nombre || 'Producto'}</td>
        <td>${d.cantidad}</td>
        <td>$${Number(d.precio_unitario).toLocaleString('es-CO')}</td>
        <td>$${Number(d.subtotal).toLocaleString('es-CO')}</td>
      </tr>
    `).join('');

    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Ticket Pedido #${pedido.id_pedido}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; }
    .info { margin: 15px 0; }
    .info p { margin: 5px 0; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
    .total { text-align: right; font-size: 1.2em; font-weight: bold; margin-top: 15px; }
    .footer { text-align: center; margin-top: 20px; font-size: 0.9em; color: #666; }
  </style>
</head>
<body>
  <div class="header">
    <h2>Remates el Paisa</h2>
    <p>Ticket de Pedido #${pedido.id_pedido}</p>
  </div>
  
  <div class="info">
    <p><strong>Fecha:</strong> ${fecha}</p>
    <p><strong>Cliente:</strong> ${pedido.clienteNombre || 'N/A'}</p>
    <p><strong>Dirección:</strong> ${pedido.direccion_entrega}</p>
    <p><strong>Estado:</strong> ${pedido.estado}</p>
  </div>

  <table>
    <thead>
      <tr>
        <th>Producto</th>
        <th>Cantidad</th>
        <th>Precio Unit.</th>
        <th>Subtotal</th>
      </tr>
    </thead>
    <tbody>
      ${productosHTML}
    </tbody>
  </table>

  <div class="total">
    <p>TOTAL: $${Number(pedido.total).toLocaleString('es-CO')}</p>
  </div>

  <div class="footer">
    <p>Gracias por su compra</p>
    <p>Remates el Paisa - Sistema Comercial</p>
  </div>
</body>
</html>`;
  }
}

module.exports = GenerarTicketPedidoUseCase;
