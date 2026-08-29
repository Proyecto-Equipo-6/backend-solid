const CancelarPedidoUseCase = require('../../application/CancelarPedidoUseCase');
const InMemoryPedidoRepository = require('../../infraestructure/repositories/in-memory/InMemoryPedidoRepository');

describe('CU-014 Cancelar pedido (CancelarPedidoUseCase)', () => {
  const CLIENTE = { id_usuario: 2, id_rol: 2, email: 'juan@email.com' };

  function crearPedido(id, idUsuario, estado = 'PENDIENTE') {
    return {
      id_pedido: id,
      id_usuario: idUsuario,
      id_metodo_pago: 1,
      direccion_entrega: 'Calle 123',
      total: 250000,
      estado,
      motivo_cancelacion: null,
      fecha_pedido: new Date().toISOString(),
    };
  }

  function crearRepositorio(pedidos) {
    const repo = new InMemoryPedidoRepository();
    repo.pedidos.push(...pedidos);
    return repo;
  }

  it('CP-CU-014-01: cancela un pedido PENDIENTE con motivo (RN-054, RN-056)', async () => {
    const repo = crearRepositorio([crearPedido(1, 2)]);
    const casoUso = new CancelarPedidoUseCase(repo);

    const resultado = await casoUso.execute(CLIENTE, { idPedido: 1, motivo: 'Ya no lo necesito' });

    expect(resultado.pedido.estado).toBe('CANCELADO');
    expect(resultado.pedido.motivo_cancelacion).toBe('Ya no lo necesito');
  });

  it('CP-CU-014-02: exige motivo obligatorio (FA-001, RN-056)', async () => {
    const repo = crearRepositorio([crearPedido(1, 2)]);
    const casoUso = new CancelarPedidoUseCase(repo);

    const error = await casoUso
      .execute(CLIENTE, { idPedido: 1, motivo: '' })
      .catch((e) => e);

    expect(error.status).toBe(400);
    expect(error.message).toBe('Debes indicar el motivo de la cancelación');
  });

  it('CP-CU-014-03: impide cancelar un pedido que no está PENDIENTE (FE-001, RN-054)', async () => {
    const repo = crearRepositorio([crearPedido(1, 2, 'CONFIRMADO')]);
    const casoUso = new CancelarPedidoUseCase(repo);

    const error = await casoUso
      .execute(CLIENTE, { idPedido: 1, motivo: 'Motivo' })
      .catch((e) => e);

    expect(error.status).toBe(400);
    expect(error.message).toBe('No se puede cancelar un pedido que ya no está PENDIENTE');
  });

  it('CP-CU-014-04: impide cancelar un pedido de otro usuario (RN-049)', async () => {
    const repo = crearRepositorio([crearPedido(1, 99)]);
    const casoUso = new CancelarPedidoUseCase(repo);

    const error = await casoUso
      .execute(CLIENTE, { idPedido: 1, motivo: 'Motivo' })
      .catch((e) => e);

    expect(error.status).toBe(404);
    expect(error.message).toBe('Pedido no encontrado');
  });

  it('CP-CU-014-05: rechaza motivo mayor a 200 caracteres (RN-057)', async () => {
    const repo = crearRepositorio([crearPedido(1, 2)]);
    const casoUso = new CancelarPedidoUseCase(repo);

    const error = await casoUso
      .execute(CLIENTE, { idPedido: 1, motivo: 'x'.repeat(201) })
      .catch((e) => e);

    expect(error.status).toBe(400);
    expect(error.message).toBe('El motivo de cancelación no puede superar los 200 caracteres');
  });

  it('CP-CU-014-04: maneja error de conexión al cancelar', async () => {
    // Repositorio falso cuyo obtenerPedidoPorId falla (simula error de BD)
    const pedidoRepositoryFalso = {
      obtenerPedidoPorId: jest.fn().mockRejectedValue(new Error('Error de conexión')),
    };
    const casoUso = new CancelarPedidoUseCase(pedidoRepositoryFalso);

    await expect(
      casoUso.execute(CLIENTE, { idPedido: 1, motivo: 'Ya no lo necesito' })
    ).rejects.toThrow('Error de conexión');
  });
});