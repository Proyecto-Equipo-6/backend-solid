const GenerarTicketPedidoUseCase = require('../../application/GenerarTicketPedidoUseCase');

function crearRepositorio(pedido, detalles) {
  return {
    async obtenerDetallePedido() {
      return pedido;
    },
    async obtenerDetallesPorPedido() {
      return detalles;
    },
  };
}

describe('CU-031 GenerarTicketPedidoUseCase', () => {
  const PEDIDO = {
    id_pedido: 42,
    clienteNombre: 'Juan Pérez',
    clienteTelefono: '3001234567',
    direccion_entrega: 'Calle 10 #20-30',
    total: 250000,
    estado: 'ENTREGADO',
    observaciones: null,
    motivo_cancelacion: null,
    id_metodo_pago: 1,
    fecha_pedido: '2026-08-10T14:30:00',
  };

  const DETALLES = [
    { id_producto: 1, producto_nombre: 'Televisor 43"', cantidad: 2, precio_unitario: 100000, subtotal: 200000 },
    { id_producto: 2, producto_nombre: 'Control remoto', cantidad: 1, precio_unitario: 50000, subtotal: 50000 },
  ];

  async function generarTicket(pedido = PEDIDO, detalles = DETALLES) {
    const casoUso = new GenerarTicketPedidoUseCase(crearRepositorio(pedido, detalles));
    return casoUso.execute(pedido.id_pedido);
  }

  it('CP-CU-031-01: genera el recibo con la información del establecimiento', async () => {
    const resultado = await generarTicket();

    expect(resultado.nombreArchivo).toBe('Ticket_Pedido_42.pdf');
    expect(resultado.html).toContain('NEXBIT');
    expect(resultado.html).toContain('Lorem Ipsum, 23-10');
    expect(resultado.html).toContain('Tel: 11223344');
  });

  it('CP-CU-031-02: lista los artículos con cantidad, unitario y subtotal', async () => {
    const resultado = await generarTicket();

    expect(resultado.html).toContain('Televisor 43"');
    expect(resultado.html).toContain('$200.000');
    expect(resultado.html).toContain('2 x $100.000');
    expect(resultado.html).toContain('Control remoto');
    expect(resultado.html).toContain('$50.000');
  });

  it('CP-CU-031-03: resume el pago con TOTAL, Efectivo y Cambio', async () => {
    const resultado = await generarTicket();

    expect(resultado.html).toContain('TOTAL');
    expect(resultado.html).toContain('$250.000');
    expect(resultado.html).toContain('Efectivo');
    expect(resultado.html).toContain('Cambio');
    expect(resultado.html).toContain('>$0<');
  });

  it('CP-CU-031-04: no incluye la sección bancaria (pago contraentrega)', async () => {
    const resultado = await generarTicket();

    expect(resultado.html).not.toContain('Tarjeta bancaria');
    expect(resultado.html).not.toContain('Código de aprobación');
  });

  it('CP-CU-031-05: lanza error si el pedido no existe', async () => {
    const casoUso = new GenerarTicketPedidoUseCase({
      async obtenerDetallePedido() {
        return null;
      },
    });

    await expect(casoUso.execute(999)).rejects.toThrow('Pedido no encontrado');
  });
});
