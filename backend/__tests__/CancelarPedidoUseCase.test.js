const CancelarPedidoUseCase = require('../application/CancelarPedidoUseCase');
const InMemoryPedidoRepository = require('../infraestructure/repositories/in-memory/InMemoryPedidoRepository');

const CLIENTE = { id_usuario: 2, id_rol: 2, email: 'juan@email.com' };
const OTRO_CLIENTE = { id_usuario: 3, id_rol: 2, email: 'otro@email.com' };

function crearRepositorioConPedidoPendiente() {
  const repositorio = new InMemoryPedidoRepository();
  repositorio.pedidos.push({
    id_pedido: 1,
    id_usuario: CLIENTE.id_usuario,
    id_metodo_pago: 1,
    direccion_entrega: 'Calle 10 # 5-20, Medellín',
    total: 250000,
    estado: 'PENDIENTE',
    observaciones: null,
    motivo_cancelacion: null,
    fecha_pedido: new Date().toISOString(),
  });
  return repositorio;
}

describe('CancelarPedidoUseCase', () => {
  it('cancela un pedido PENDIENTE del cliente y registra el motivo (CU-014 FP-006)', async () => {
    const repositorio = crearRepositorioConPedidoPendiente();
    const casoUso = new CancelarPedidoUseCase(repositorio);

    const resultado = await casoUso.execute(CLIENTE, { idPedido: 1, motivo: 'Cambié de opinión' });

    expect(resultado.pedido.estado).toBe('CANCELADO');
    expect(resultado.pedido.motivo_cancelacion).toBe('Cambié de opinión');
    expect(repositorio.pedidos[0].estado).toBe('CANCELADO');
  });

  it('rechaza cancelación sin motivo (FA-001)', async () => {
    const repositorio = crearRepositorioConPedidoPendiente();
    const casoUso = new CancelarPedidoUseCase(repositorio);

    const error = await casoUso.execute(CLIENTE, { idPedido: 1, motivo: '' }).catch((e) => e);

    expect(error.status).toBe(400);
    expect(error.message).toContain('motivo');
  });

  it('rechaza cancelar un pedido que no está PENDIENTE (FE-001, PC-003)', async () => {
    const repositorio = crearRepositorioConPedidoPendiente();
    repositorio.pedidos[0].estado = 'ASIGNADO';
    const casoUso = new CancelarPedidoUseCase(repositorio);

    const error = await casoUso.execute(CLIENTE, { idPedido: 1, motivo: 'Cambié de opinión' }).catch((e) => e);

    expect(error.status).toBe(400);
    expect(error.message).toContain('PENDIENTE');
  });

  it('rechaza cancelar un pedido de otro usuario (PC-002)', async () => {
    const repositorio = crearRepositorioConPedidoPendiente();
    const casoUso = new CancelarPedidoUseCase(repositorio);

    const error = await casoUso.execute(OTRO_CLIENTE, { idPedido: 1, motivo: 'Cambié de opinión' }).catch((e) => e);

    expect(error.status).toBe(404);
    expect(error.message).toContain('no encontrado');
  });

  it('rechaza cancelar un pedido inexistente', async () => {
    const repositorio = new InMemoryPedidoRepository();
    const casoUso = new CancelarPedidoUseCase(repositorio);

    const error = await casoUso.execute(CLIENTE, { idPedido: 999, motivo: 'Cambié de opinión' }).catch((e) => e);

    expect(error.status).toBe(404);
    expect(error.message).toContain('no encontrado');
  });
});