import InMemoryPedidoRepartidorRepository from '../infraestructure/repositories/in-memory/InMemoryPedidoRepartidorRepository.js';
import VerDashboardPedidosUseCase from '../application/verDashboardPedidosUseCase.js';
import Pedido from '../domain/models/Pedido.js';

test('Dashboard devuelve pedidos ASIGNADO del día ordenados de más antiguo a más reciente, usando id_usuario', async () => {
  const hoy = new Date();
  const horaTemprana = new Date(hoy);
  horaTemprana.setHours(8, 0, 0, 0);
  const horaTarde = new Date(hoy);
  horaTarde.setHours(10, 0, 0, 0);

  const pedidos = [
    new Pedido({
      id_pedido: 2,
      id_usuario: 100, // cliente
      id_repartidor: 10,
      id_metodo_pago: 1,
      direccion_entrega: 'Calle 45',
      total: 50000,
      estado: 'ASIGNADO',
      comprobante_url: null,
      observaciones: null,
      motivo_cancelacion: null,
      fecha_pedido: horaTarde.toISOString(),
      fecha_actualizacion: horaTarde.toISOString()
    }),
    new Pedido({
      id_pedido: 1,
      id_usuario: 101,
      id_repartidor: 10,
      id_metodo_pago: 2,
      direccion_entrega: 'Carrera 12',
      total: 30000,
      estado: 'ASIGNADO',
      comprobante_url: null,
      observaciones: null,
      motivo_cancelacion: null,
      fecha_pedido: horaTemprana.toISOString(),
      fecha_actualizacion: horaTemprana.toISOString()
    })
  ];

  const repo = new InMemoryPedidoRepartidorRepository(pedidos);
  const useCase = new VerDashboardPedidosUseCase(repo);
  const dashboard = await useCase.ejecutar(10);

  expect(dashboard.conteoDelDia).toBe(2);
  expect(dashboard.pedidoActivo.id_pedido).toBe(1);
  expect(dashboard.pedidosEnCola).toHaveLength(1);
  expect(dashboard.pedidosEnCola[0].id_pedido).toBe(2);
});

test('CP-CU-015-02: Dashboard vacío cuando no hay pedidos asignados', async () => {
  const repo = new InMemoryPedidoRepartidorRepository([]); // sin pedidos
  const useCase = new VerDashboardPedidosUseCase(repo);
  const dashboard = await useCase.ejecutar(10);

  expect(dashboard.conteoDelDia).toBe(0);
  expect(dashboard.pedidoActivo).toBeNull();
  expect(dashboard.pedidosEnCola).toEqual([]);
  expect(dashboard.mensaje).toBe('No tienes pedidos asignados por el momento');
});

test('CP-CU-015-06: Solo muestra pedidos asignados al repartidor autenticado', async () => {
  const hoy = new Date();
  const hora = new Date(hoy);
  hora.setHours(9, 0, 0, 0);

  const pedidos = [
    new Pedido({
      id_pedido: 1,
      id_usuario: 100,
      id_repartidor: 10, // asignado al repartidor 10
      id_metodo_pago: 1,
      direccion_entrega: 'Calle 123',
      total: 50000,
      estado: 'ASIGNADO',
      fecha_pedido: hora.toISOString(),
      fecha_actualizacion: hora.toISOString()
    }),
    new Pedido({
      id_pedido: 2,
      id_usuario: 101,
      id_repartidor: 20, // asignado a otro repartidor
      id_metodo_pago: 2,
      direccion_entrega: 'Carrera 45',
      total: 30000,
      estado: 'ASIGNADO',
      fecha_pedido: hora.toISOString(),
      fecha_actualizacion: hora.toISOString()
    })
  ];

  const repo = new InMemoryPedidoRepartidorRepository(pedidos);
  const useCase = new VerDashboardPedidosUseCase(repo);
  const dashboard = await useCase.ejecutar(10);

  expect(dashboard.conteoDelDia).toBe(1);
  expect(dashboard.pedidoActivo.id_pedido).toBe(1);
  expect(dashboard.pedidosEnCola).toHaveLength(0);
});