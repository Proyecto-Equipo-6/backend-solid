const InMemoryPedidoRepartidorRepository = require('../infraestructure/repositories/in-memory/InMemoryPedidoRepartidorRepository.js');
const VerDetallePedidoUseCase = require('../application/verDetallePedidoUseCase.js');
const Pedido = require('../domain/models/Pedido.js');

// Helper para crear un pedido activo asignado al repartidor
const crearPedido = (id_pedido, id_repartidor, estado = 'ASIGNADO') => new Pedido({
  id_pedido,
  id_usuario: 100,
  id_repartidor,
  id_metodo_pago: 1,
  direccion_entrega: 'Calle 123',
  total: 50000,
  estado,
  comprobante_url: null,
  observaciones: null,
  motivo_cancelacion: null,
  fecha_pedido: new Date().toISOString(),
  fecha_actualizacion: new Date().toISOString(),
  clienteNombre: 'María',
  clienteTelefono: '3001234567',
  caracteristicasLogistica: 'Frágil'
});

describe('CU-016: Ver detalles pedido', () => {
  test('CP-CU-016-01 / CP-CU-016-02 / CP-CU-016-03: Flujo feliz, el repartidor asignado ve todos los detalles excepto productos', async () => {
    const pedido = crearPedido(1, 10);
    const repo = new InMemoryPedidoRepartidorRepository([pedido]);
    const useCase = new VerDetallePedidoUseCase(repo);

    const detalle = await useCase.ejecutar(1, 10);

    expect(detalle.id_pedido).toBe(1);
    expect(detalle.clienteNombre).toBe('María');
    expect(detalle.clienteTelefono).toBe('3001234567');
    expect(detalle.estado).toBe('ASIGNADO');
    expect(detalle.caracteristicasLogistica).toBe('Frágil');
    expect(detalle.diagramaSeguimiento).toEqual(['ASIGNADO', 'EN_CAMINO', 'ENTREGADO']);
    expect(detalle).not.toHaveProperty('productos');
  });

  test('CP-CU-016-06: Flujo de seguridad, otro repartidor no puede ver los datos', async () => {
    const pedido = crearPedido(1, 10);
    const repo = new InMemoryPedidoRepartidorRepository([pedido]);
    const useCase = new VerDetallePedidoUseCase(repo);

    await expect(useCase.ejecutar(1, 20)).rejects.toThrow('Acceso denegado');
  });
});