import InMemoryPedidoRepartidorRepository from '../infraestructure/repositories/in-memory/InMemoryPedidoRepartidorRepository.js';
import VerDetallePedidoUseCase from '../application/verDetallePedidoUseCase.js';
import Pedido from '../domain/models/Pedido.js';

// Helper para crear pedidos con el repartidor indicado
const crearPedido = (idPedido, idUsuarioRepartidor, estado = 'ASIGNADO') => new Pedido({
  idPedido,
  idUsuario: idUsuarioRepartidor,
  idMetodoPago: 1,
  direccion: 'Calle 123',
  estado,
  clienteNombre: 'María',
  clienteTelefono: '3001234567',
  caracteristicasLogistica: 'Frágil',
  fechaAsignacion: new Date().toISOString(),
  fechaActualizacion: new Date().toISOString()
});

test('Flujo feliz: el repartidor asignado ve el detalle sin productos', async () => {
  const pedido = crearPedido(1, 10);
  const repo = new InMemoryPedidoRepartidorRepository([pedido]);
  const useCase = new VerDetallePedidoUseCase(repo);

  const detalle = await useCase.ejecutar(1, 10);

  expect(detalle.idPedido).toBe(1);
  expect(detalle.clienteNombre).toBe('María');
  expect(detalle.clienteTelefono).toBe('3001234567');
  expect(detalle).not.toHaveProperty('productos');
  expect(detalle).not.toHaveProperty('listaProductos');
});

test('Flujo de seguridad: un repartidor diferente no puede ver los datos sensibles', async () => {
  const pedido = crearPedido(1, 10);
  const repo = new InMemoryPedidoRepartidorRepository([pedido]);
  const useCase = new VerDetallePedidoUseCase(repo);

  await expect(useCase.ejecutar(1, 20)).rejects.toThrow('Acceso denegado');
});