const InMemoryPedidoRepartidorRepository = require('../infraestructure/repositories/in-memory/InMemoryPedidoRepartidorRepository.js');
const VerDetallePedidoUseCase = require('../application/verDetallePedidoUseCase.js');
const Pedido = require('../domain/models/Pedido.js');

// Helper para crear pedidos con el repartidor indicado
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

test('Flujo feliz: el repartidor asignado ve el detalle sin productos', async () => {
  const pedido = crearPedido(1, 10);
  const repo = new InMemoryPedidoRepartidorRepository([pedido]);
  const useCase = new VerDetallePedidoUseCase(repo);

  const detalle = await useCase.ejecutar(1, 10);

  expect(detalle.id_pedido).toBe(1);
  expect(detalle.clienteNombre).toBe('María');
  expect(detalle.clienteTelefono).toBe('3001234567');
  expect(detalle).not.toHaveProperty('productos');
});

test('Flujo de seguridad: un repartidor diferente no puede ver los datos sensibles', async () => {
  const pedido = crearPedido(1, 10);
  const repo = new InMemoryPedidoRepartidorRepository([pedido]);
  const useCase = new VerDetallePedidoUseCase(repo);

  await expect(useCase.ejecutar(1, 20)).rejects.toThrow('Acceso denegado');
});

test('CP-CU-016-05: Lanza error si el pedido no existe o no está disponible', async () => {
  const repo = new InMemoryPedidoRepartidorRepository([]); // sin pedidos
  const useCase = new VerDetallePedidoUseCase(repo);

  await expect(useCase.ejecutar(999, 10)).rejects.toThrow('Pedido no encontrado');
});