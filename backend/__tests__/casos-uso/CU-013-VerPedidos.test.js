const VerPedidosUseCase = require('../../application/VerPedidosUseCase');
const InMemoryPedidoRepository = require('../../infraestructure/repositories/in-memory/InMemoryPedidoRepository');

describe('CU-013 Ver pedidos (VerPedidosUseCase)', () => {
  const CLIENTE = { id_usuario: 2, id_rol: 2, email: 'juan@email.com' };

  function crearPedido(id, idUsuario, estado, fecha) {
    return {
      id_pedido: id,
      id_usuario: idUsuario,
      id_metodo_pago: 1,
      direccion_entrega: 'Calle 123',
      total: 250000,
      estado,
      motivo_cancelacion: null,
      fecha_pedido: fecha,
    };
  }

  function crearRepositorio(pedidos) {
    const repo = new InMemoryPedidoRepository();
    repo.pedidos.push(...pedidos);
    return repo;
  }

  it('CP-CU-013-01: lista los pedidos del cliente ordenados por fecha descendente (RN-051)', async () => {
    const repo = crearRepositorio([
      crearPedido(1, 2, 'PENDIENTE', '2026-08-10T10:00:00'),
      crearPedido(2, 2, 'ENTREGADO', '2026-08-15T10:00:00'),
      crearPedido(3, 99, 'PENDIENTE', '2026-08-12T10:00:00'),
    ]);
    const casoUso = new VerPedidosUseCase(repo);

    const resultado = await casoUso.execute(CLIENTE);

    expect(resultado.pedidos).toHaveLength(2);
    expect(resultado.pedidos[0].id_pedido).toBe(2); // más reciente primero
    expect(resultado.pedidos[1].id_pedido).toBe(1);
    expect(resultado.vacio).toBe(false);
  });

  it('CP-CU-013-02: muestra vista vacía cuando no hay pedidos (FA-001)', async () => {
    const repo = crearRepositorio([]);
    const casoUso = new VerPedidosUseCase(repo);

    const resultado = await casoUso.execute(CLIENTE);

    expect(resultado.pedidos).toEqual([]);
    expect(resultado.vacio).toBe(true);
    expect(resultado.mensaje).toBe('No tienes pedidos aún');
  });

  it('CP-CU-013-03: filtra la lista por estado (FA-002)', async () => {
    const repo = crearRepositorio([
      crearPedido(1, 2, 'PENDIENTE', '2026-08-10T10:00:00'),
      crearPedido(2, 2, 'CANCELADO', '2026-08-15T10:00:00'),
    ]);
    const casoUso = new VerPedidosUseCase(repo);

    const resultado = await casoUso.execute(CLIENTE, { estado: 'CANCELADO' });

    expect(resultado.pedidos).toHaveLength(1);
    expect(resultado.pedidos[0].estado).toBe('CANCELADO');
  });

  it('CP-CU-013-07: aislamiento por usuario, solo ve sus propios pedidos (RN-049)', async () => {
    const repo = crearRepositorio([
      crearPedido(1, 2, 'PENDIENTE', '2026-08-10T10:00:00'),
      crearPedido(2, 99, 'PENDIENTE', '2026-08-12T10:00:00'),
    ]);
    const casoUso = new VerPedidosUseCase(repo);

    const resultado = await casoUso.execute(CLIENTE);

    expect(resultado.pedidos).toHaveLength(1);
    expect(resultado.pedidos[0].id_pedido).toBe(1);
  });

  it('CP-CU-013-08: aplica paginación server-side (RF-005.4)', async () => {
    const pedidos = Array.from({ length: 15 }, (_, i) =>
      crearPedido(i + 1, 2, 'PENDIENTE', `2026-08-${String(i + 1).padStart(2, '0')}T10:00:00`)
    );
    const repo = crearRepositorio(pedidos);
    const casoUso = new VerPedidosUseCase(repo);

    const pagina1 = await casoUso.execute(CLIENTE, { pagina: 1, limite: 10 });
    expect(pagina1.pedidos).toHaveLength(10);
    expect(pagina1.total).toBe(15);
    expect(pagina1.totalPaginas).toBe(2);

    const pagina2 = await casoUso.execute(CLIENTE, { pagina: 2, limite: 10 });
    expect(pagina2.pedidos).toHaveLength(5);
  });

  it('CP-CU-013-08: maneja error de conexión al cargar los pedidos', async () => {
    const pedidoRepositoryFalso = {
      obtenerPedidosPorUsuario: jest.fn().mockRejectedValue(new Error('Error de conexión')),
    };
    const casoUso = new VerPedidosUseCase(pedidoRepositoryFalso);

    await expect(casoUso.execute(CLIENTE)).rejects.toThrow('Error de conexión');
  });
});