const InMemoryPedidoRepartidorRepository = require('../../infraestructure/repositories/in-memory/InMemoryPedidoRepartidorRepository.js');
const VerHistorialPedidosUseCase = require('../../application/verHistorialPedidosUseCase.js');
const { crearPedido } = require('../helpers/pedidos');

// Inicio de la semana calendario (lunes), consistente con el repositorio.
const inicioDeSemana = (fecha) => {
  const d = new Date(fecha);
  const diasDesdeLunes = d.getDay() === 0 ? 6 : d.getDay() - 1;
  d.setDate(d.getDate() - diasDesdeLunes);
  return d;
};

// Fecha dentro de la semana Y del mes actuales (para métricas deterministas).
const fechaEnPeriodoActual = (hoy) => {
  const inicioSemana = inicioDeSemana(hoy);
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  return inicioSemana > inicioMes ? inicioSemana : inicioMes;
};

describe('CU-018: Ver historial pedidos', () => {
  test('Historial con pedidos finalizados y métricas', async () => {
    const hoy = new Date();
    const haceUnosDias = fechaEnPeriodoActual(hoy);

    const pedidos = [
      crearPedido({ id_pedido: 1, id_repartidor: 10, estado: 'ENTREGADO', fecha_pedido: hoy.toISOString(), fecha_actualizacion: hoy.toISOString() }),
      crearPedido({ id_pedido: 2, id_repartidor: 10, estado: 'NO_ENTREGADO', fecha_pedido: haceUnosDias.toISOString(), fecha_actualizacion: haceUnosDias.toISOString() }),
      crearPedido({ id_pedido: 3, id_repartidor: 20, estado: 'ENTREGADO', fecha_pedido: hoy.toISOString(), fecha_actualizacion: hoy.toISOString() })
    ];

    const repo = new InMemoryPedidoRepartidorRepository(pedidos);
    const useCase = new VerHistorialPedidosUseCase(repo);
    const historial = await useCase.ejecutar(10);

    expect(historial.pedidos).toHaveLength(2);
    expect(historial.totalMes).toBe(2);
    expect(historial.totalSemana).toBe(2);
    expect(historial.mensaje).toBeNull();
    expect(historial.pedidos[0].id_pedido).toBe(1); // reciente primero
  });

  test('Historial vacío devuelve mensaje', async () => {
    const repo = new InMemoryPedidoRepartidorRepository([]);
    const useCase = new VerHistorialPedidosUseCase(repo);
    const historial = await useCase.ejecutar(10);

    expect(historial.pedidos).toEqual([]);
    expect(historial.totalMes).toBe(0);
    expect(historial.totalSemana).toBe(0);
    expect(historial.mensaje).toBe('Aún no tienes pedidos registrados en tu historial');
  });

  test('Filtro por estado NO_ENTREGADO', async () => {
    const hoy = new Date();

    const pedidos = [
      crearPedido({ id_pedido: 1, id_repartidor: 10, estado: 'ENTREGADO', fecha_pedido: hoy.toISOString(), fecha_actualizacion: hoy.toISOString() }),
      crearPedido({ id_pedido: 2, id_repartidor: 10, estado: 'NO_ENTREGADO', fecha_pedido: hoy.toISOString(), fecha_actualizacion: hoy.toISOString() })
    ];

    const repo = new InMemoryPedidoRepartidorRepository(pedidos);
    const useCase = new VerHistorialPedidosUseCase(repo);
    const historial = await useCase.ejecutar(10, { filtroEstado: 'NO_ENTREGADO' });

    expect(historial.pedidos).toHaveLength(1);
    expect(historial.pedidos[0].estado).toBe('NO_ENTREGADO');
  });

  test('Orden antiguo primero', async () => {
    const hoy = new Date();
    const haceUnaSemana = new Date(hoy);
    haceUnaSemana.setDate(hoy.getDate() - 5);

    const pedidos = [
      crearPedido({ id_pedido: 1, id_repartidor: 10, estado: 'ENTREGADO', fecha_pedido: hoy.toISOString(), fecha_actualizacion: hoy.toISOString() }),
      crearPedido({ id_pedido: 2, id_repartidor: 10, estado: 'ENTREGADO', fecha_pedido: haceUnaSemana.toISOString(), fecha_actualizacion: haceUnaSemana.toISOString() })
    ];

    const repo = new InMemoryPedidoRepartidorRepository(pedidos);
    const useCase = new VerHistorialPedidosUseCase(repo);
    const historial = await useCase.ejecutar(10, { orden: 'antiguo' });

    expect(historial.pedidos[0].id_pedido).toBe(2); // el más antiguo primero
  });

  test('Solo muestra pedidos finalizados del historial', async () => {
    const hoy = new Date();
    const pedidoFinalizado = crearPedido({ id_pedido: 1, id_repartidor: 10, estado: 'ENTREGADO', fecha_pedido: hoy.toISOString(), fecha_actualizacion: hoy.toISOString() });
    const pedidoCancelado = crearPedido({ id_pedido: 2, id_repartidor: 10, estado: 'CANCELADO', fecha_pedido: hoy.toISOString(), fecha_actualizacion: hoy.toISOString() });
    // Se agrega un pedido PENDIENTE que debe ser ignorado por el repositorio
    const repo = new InMemoryPedidoRepartidorRepository([pedidoFinalizado, pedidoCancelado]);
    repo.pedidos.push(crearPedido({ id_pedido: 3, id_repartidor: 10, estado: 'PENDIENTE', fecha_pedido: hoy.toISOString(), fecha_actualizacion: hoy.toISOString() }));

    const useCase = new VerHistorialPedidosUseCase(repo);
    const historial = await useCase.ejecutar(10);

    // Solo se listan los finalizados (ENTREGADO y CANCELADO), no el PENDIENTE
    expect(historial.pedidos).toHaveLength(2);
    const estados = historial.pedidos.map((p) => p.estado);
    expect(estados).toEqual(expect.arrayContaining(['ENTREGADO', 'CANCELADO']));
    expect(estados).not.toContain('PENDIENTE');
  });

  test('maneja error de conexión con la BD', async () => {
    const pedidoRepoFalso = {
      obtenerHistorialPedidos: jest.fn().mockRejectedValue(new Error('Error de conexión')),
      contarPedidosDelPeriodo: jest.fn().mockResolvedValue({ totalMes: 0, totalSemana: 0 }),
    };
    const useCase = new VerHistorialPedidosUseCase(pedidoRepoFalso);

    await expect(useCase.ejecutar(10)).rejects.toThrow('Error de conexión');
  });
});
