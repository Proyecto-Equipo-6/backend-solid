const InMemoryPedidoRepartidorRepository = require('../../infraestructure/repositories/in-memory/InMemoryPedidoRepartidorRepository.js');
const VerDashboardPedidosUseCase = require('../../application/verDashboardPedidosUseCase.js');
const { crearPedido } = require('../helpers/pedidos');

function crearHora(hora, minutos = 0) {
  const d = new Date();
  d.setHours(hora, minutos, 0, 0);
  return d;
}

function pedidoDashboard(id, id_usuario, hora, overrides = {}) {
  return crearPedido({
    id_pedido: id,
    id_usuario,
    id_repartidor: 10,
    id_metodo_pago: 1,
    estado: 'ASIGNADO',
    fecha_pedido: hora.toISOString(),
    fecha_actualizacion: hora.toISOString(),
    ...overrides
  });
}

describe('CU-015: Ver Dashboard pedidos', () => {
  test('Dashboard con pedido activo y en cola', async () => {
    const horaTemprana = crearHora(8);
    const horaTarde = crearHora(10);

    const pedidos = [
      pedidoDashboard(2, 101, horaTarde, { direccion_entrega: 'Calle 45', total: 30000 }),
      pedidoDashboard(1, 100, horaTemprana, { id_metodo_pago: 2, direccion_entrega: 'Carrera 12' })
    ];

    const repo = new InMemoryPedidoRepartidorRepository(pedidos);
    const useCase = new VerDashboardPedidosUseCase(repo);
    const dashboard = await useCase.ejecutar(10);

    expect(dashboard.conteoDelDia).toBe(2);
    expect(dashboard.pedidoActivo.id_pedido).toBe(1); // el más antiguo
    expect(dashboard.pedidosEnCola).toHaveLength(1);
    expect(dashboard.pedidosEnCola[0].id_pedido).toBe(2);
  });

  test('Dashboard vacío cuando no hay pedidos asignados', async () => {
    const repo = new InMemoryPedidoRepartidorRepository([]);
    const useCase = new VerDashboardPedidosUseCase(repo);
    const dashboard = await useCase.ejecutar(10);

    expect(dashboard.conteoDelDia).toBe(0);
    expect(dashboard.pedidoActivo).toBeNull();
    expect(dashboard.pedidosEnCola).toEqual([]);
    expect(dashboard.mensaje).toBe('No tienes pedidos asignados por el momento');
  });

  test('Múltiples pedidos de prioridad similar, el más antiguo queda activo', async () => {
    const mismaHora = crearHora(9);

    const pedidos = [
      pedidoDashboard(1, 100, mismaHora, { direccion_entrega: 'Calle 1' }),
      pedidoDashboard(2, 101, mismaHora, { direccion_entrega: 'Calle 2', total: 30000 })
    ];

    const repo = new InMemoryPedidoRepartidorRepository(pedidos);
    const useCase = new VerDashboardPedidosUseCase(repo);
    const dashboard = await useCase.ejecutar(10);

    expect(dashboard.conteoDelDia).toBe(2);
    expect(dashboard.pedidoActivo.id_pedido).toBe(1); // el que se agregó primero con misma hora
    expect(dashboard.pedidosEnCola).toHaveLength(1);
    expect(dashboard.pedidosEnCola[0].id_pedido).toBe(2);
  });

  test('Solo muestra pedidos asignados al repartidor autenticado', async () => {
    const hora = crearHora(9);

    const pedidos = [
      pedidoDashboard(1, 100, hora),
      pedidoDashboard(2, 101, hora, { id_repartidor: 20, id_metodo_pago: 2, direccion_entrega: 'Carrera 45', total: 30000 })
    ];

    const repo = new InMemoryPedidoRepartidorRepository(pedidos);
    const useCase = new VerDashboardPedidosUseCase(repo);
    const dashboard = await useCase.ejecutar(10);

    expect(dashboard.conteoDelDia).toBe(1);
    expect(dashboard.pedidoActivo.id_pedido).toBe(1);
    expect(dashboard.pedidosEnCola).toHaveLength(0);
  });

  test('maneja error de conexión con la BD', async () => {
    const pedidoRepoFalso = {
      obtenerPedidosDelDia: jest.fn().mockRejectedValue(new Error('Error de conexión')),
    };
    const useCase = new VerDashboardPedidosUseCase(pedidoRepoFalso);

    await expect(useCase.ejecutar(10)).rejects.toThrow('Error de conexión');
  });

  test('maneja excepción por sesión expirada', async () => {
    // Simula que el repartidor ya no tiene sesión válida (error de autenticación)
    const pedidoRepoFalso = {
      obtenerPedidosDelDia: jest.fn().mockRejectedValue(new Error('Su sesión ha expirado')),
    };
    const useCase = new VerDashboardPedidosUseCase(pedidoRepoFalso);

    await expect(useCase.ejecutar(10)).rejects.toThrow('Su sesión ha expirado');
  });
});
