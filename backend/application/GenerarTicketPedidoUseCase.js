const ETIQUETAS_ESTADO = {
  PENDIENTE: 'Pendiente',
  CONFIRMADO: 'Confirmado',
  ASIGNADO: 'Asignado',
  EN_CAMINO: 'En camino',
  ENTREGADO: 'Entregado',
  NO_ENTREGADO: 'No entregado',
  CANCELADO: 'Cancelado',
};

const COMERCIO = {
  nombre: 'Nexbit',
  direccion: 'Lorem Ipsum, 23-10',
  telefono: '11223344',
};

const FORMATO_PRECIO = new Intl.NumberFormat('es-CO');

/**
 * Caso de Uso: GenerarTicketPedidoUseCase
 * Genera el HTML del recibo de caja de un pedido para impresión a PDF (CU-031).
 * RN-053: nombre del archivo Ticket_Pedido_[ID].pdf
 * El ticket está disponible en cualquier estado del pedido.
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

    const detalles = await this.pedidoRepartidorRepository.obtenerDetallesPorPedido(id_pedido);

    const html = this._generarHTML(pedido, detalles);

    return {
      nombreArchivo: `Ticket_Pedido_${id_pedido}.pdf`,
      html,
      formato: 'text/html',
    };
  }

  _generarItems(detalles) {
    return detalles.map(d => {
      const nombre = d.producto_nombre || `Producto #${d.id_producto}`;
      const unitario = `$${FORMATO_PRECIO.format(Number(d.precio_unitario))}`;
      const subtotal = `$${FORMATO_PRECIO.format(Number(d.subtotal))}`;
      return `
        <div class="item">
          <div class="item-fila"><span>${nombre}</span><span>${subtotal}</span></div>
          <div class="item-detalle">${d.cantidad} x ${unitario}</div>
        </div>`;
    }).join('');
  }

  _generarHTML(pedido, detalles) {
    const fecha = new Date(pedido.fecha_pedido);
    const fechaCorta = `${fecha.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })} ${fecha.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false })}`;

    const estado = ETIQUETAS_ESTADO[pedido.estado] || pedido.estado;
    const total = `$${FORMATO_PRECIO.format(Number(pedido.total))}`;

    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Ticket Pedido #${pedido.id_pedido}</title>
  <style>
    body {
      font-family: 'Courier New', Courier, monospace;
      background: #ffffff;
      color: #000000;
      margin: 0;
    }
    .recibo {
      max-width: 380px;
      margin: 0 auto;
      padding: 28px 20px;
      font-size: 14px;
      line-height: 1.45;
    }
    .comercio {
      text-align: center;
      font-size: 24px;
      font-weight: 700;
      letter-spacing: 3px;
    }
    .linea {
      text-align: center;
      font-size: 13px;
    }
    .sep {
      text-align: center;
      color: #888;
      margin: 10px 0;
    }
    .fila {
      display: flex;
      justify-content: space-between;
      margin: 2px 0;
    }
    .fila .label {
      color: #333;
    }
    .fila .valor {
      font-weight: 700;
      text-align: right;
    }
    .total {
      font-size: 17px;
      font-weight: 700;
      border-top: 1px dashed #000;
      padding-top: 8px;
      margin-top: 8px;
    }
    .item {
      margin: 8px 0;
    }
    .item-fila {
      display: flex;
      justify-content: space-between;
      gap: 10px;
    }
    .item-fila span:first-child {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .item-detalle {
      padding-left: 14px;
      font-size: 12px;
      color: #333;
    }
    .pie {
      text-align: center;
      margin-top: 4px;
    }
    .pie:first-of-type {
      margin-top: 12px;
    }
  </style>
</head>
<body>
  <div class="recibo">
    <div class="comercio">${COMERCIO.nombre.toUpperCase()}</div>
    <div class="linea">${COMERCIO.direccion}</div>
    <div class="linea">Tel: ${COMERCIO.telefono}</div>

    <div class="sep">- - - - - - - - - - - - - - - - - - - -</div>

    <div class="fila"><span class="label">Pedido</span><span class="valor">#${pedido.id_pedido}</span></div>
    <div class="fila"><span class="label">Fecha</span><span class="valor">${fechaCorta}</span></div>
    <div class="fila"><span class="label">Cliente</span><span class="valor">${pedido.clienteNombre || 'N/A'}</span></div>
    <div class="fila"><span class="label">Estado</span><span class="valor">${estado}</span></div>

    <div class="sep">- - - - - - - - - - - - - - - - - - - -</div>

    ${this._generarItems(detalles)}

    <div class="sep">- - - - - - - - - - - - - - - - - - - -</div>

    <div class="fila total"><span>TOTAL</span><span>${total}</span></div>
    <div class="fila"><span class="label">Efectivo</span><span class="valor">${total}</span></div>
    <div class="fila"><span class="label">Cambio</span><span class="valor">$0</span></div>

    <div class="sep">- - - - - - - - - - - - - - - - - - - -</div>

    <div class="pie">Gracias por su compra</div>
    <div class="pie">${COMERCIO.nombre} - Sistema Comercial</div>
  </div>
</body>
</html>`;
  }
}

module.exports = GenerarTicketPedidoUseCase;