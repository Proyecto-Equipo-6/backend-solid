const InMemoryPedidoRepartidorRepository = require('../infraestructure/repositories/in-memory/InMemoryPedidoRepartidorRepository.js');
const VerDashboardPedidosUseCase = require('../application/verDashboardPedidosUseCase.js');
const Pedido = require('../domain/models/Pedido.js');

describe('CU-015: Ver Dashboard pedidos', () => {
  test('CP-CU-015-01: Dashboard con pedido activo y en cola', async () => {
    const hoy = new Date();
    const horaTemprana = new Date(hoy);
    horaTemprana.setHours(8, 0, 0, 0);
    const horaTarde = new Date(hoy);
    horaTarde.setHours(10, 0, 0, 0);

    const pedidos = [
      new Pedido({
        id_pedido: 2,
        id_usuario: 101,
        id_repartidor: 10,
        id_metodo_pago: 1,
        direccion_entrega: 'Calle 45',
        total: 30000,
        estado: 'ASIGNADO',
        fecha_pedido: horaTarde.toISOString(),
        fecha_actualizacion: horaTarde.toISOString()
      }),
      new Pedido({
        id_pedido: 1,
        id_usuario: 100,
        id_repartidor: 10,
        id_metodo_pago: 2,
        direccion_entrega: 'Carrera 12',
        total: 50000,
        estado: 'ASIGNADO',
        fecha_pedido: horaTemprana.toISOString(),
        fecha_actualizacion: horaTemprana.toISOString()
      })
    ];

    const repo = new InMemoryPedidoRepartidorRepository(pedidos);
    const useCase = new VerDashboardPedidosUseCase(repo);
    const dashboard = await useCase.ejecutar(10);

    expect(dashboard.conteoDelDia).toBe(2);
    expect(dashboard.pedidoActivo.id_pedido).toBe(1); // el más antiguo
    expect(dashboard.pedidosEnCola).toHaveLength(1);
    expect(dashboard.pedidosEnCola[0].id_pedido).toBe(2);
  });

  test('CP-CU-015-02: Dashboard vacío cuando no hay pedidos asignados', async () => {
    const repo = new InMemoryPedidoRepartidorRepository([]);
    const useCase = new VerDashboardPedidosUseCase(repo);
    const dashboard = await useCase.ejecutar(10);

    expect(dashboard.conteoDelDia).toBe(0);
    expect(dashboard.pedidoActivo).toBeNull();
    expect(dashboard.pedidosEnCola).toEqual([]);
    expect(dashboard.mensaje).toBe('No tienes pedidos asignados por el momento');
  });

  test('CP-CU-015-03: Múltiples pedidos de prioridad similar, el más antiguo queda activo', async () => {
  const hoy = new Date();
  const mismaHora = new Date(hoy);
  mismaHora.setHours(9, 0, 0, 0);

  const pedidos = [
    new Pedido({
      id_pedido: 1,
      id_usuario: 100,
      id_repartidor: 10,
      id_metodo_pago: 1,
      direccion_entrega: 'Calle 1',
      total: 50000,
      estado: 'ASIGNADO',
      fecha_pedido: mismaHora.toISOString(),
      fecha_actualizacion: mismaHora.toISOString()
    }),
    new Pedido({
      id_pedido: 2,
      id_usuario: 101,
      id_repartidor: 10,
      id_metodo_pago: 1,
      direccion_entrega: 'Calle 2',
      total: 30000,
      estado: 'ASIGNADO',
      fecha_pedido: mismaHora.toISOString(), // misma prioridad
      fecha_actualizacion: mismaHora.toISOString()
    })
  ];

  const repo = new InMemoryPedidoRepartidorRepository(pedidos);
  const useCase = new VerDashboardPedidosUseCase(repo);
  const dashboard = await useCase.ejecutar(10);

  expect(dashboard.conteoDelDia).toBe(2);
  expect(dashboard.pedidoActivo.id_pedido).toBe(1); // el que se agregó primero con misma hora
  expect(dashboard.pedidosEnCola).toHaveLength(1);
  expect(dashboard.pedidosEnCola[0].id_pedido).toBe(2);
  });

  test('CP-CU-015-06: Solo muestra pedidos asignados al repartidor autenticado', async () => {
    const hoy = new Date();
    const hora = new Date(hoy);
    hora.setHours(9, 0, 0, 0);

    const pedidos = [
      new Pedido({
        id_pedido: 1,
        id_usuario: 100,
        id_repartidor: 10,
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
        id_repartidor: 20,
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

  test('CP-CU-015-04: maneja error de conexión con la BD', async () => {
    const pedidoRepoFalso = {
      obtenerPedidosDelDia: jest.fn().mockRejectedValue(new Error('Error de conexión')),
    };
    const useCase = new VerDashboardPedidosUseCase(pedidoRepoFalso);

    await expect(useCase.ejecutar(10)).rejects.toThrow('Error de conexión');
  });

  test('CP-CU-015-05: maneja excepción por sesión expirada', async () => {
    // Simula que el repartidor ya no tiene sesión válida (error de autenticación)
    const pedidoRepoFalso = {
      obtenerPedidosDelDia: jest.fn().mockRejectedValue(new Error('Su sesión ha expirado')),
    };
    const useCase = new VerDashboardPedidosUseCase(pedidoRepoFalso);

    await expect(useCase.ejecutar(10)).rejects.toThrow('Su sesión ha expirado');
  });
});