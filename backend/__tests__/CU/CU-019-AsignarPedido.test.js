import InMemoryPedidoRepartidorRepository from '../../infraestructure/repositories/in-memory/InMemoryPedidoRepartidorRepository.js';
import InMemoryRepartidorRepository from '../../infraestructure/repositories/in-memory/InMemoryRepartidorRepository.js';
import AsignarRepartidorUseCase from '../../application/asignarRepartidorUseCase.js';
const { crearPedido } = require('./helpers/pedidos');

const crearRepoRepartidores = (ids = [10, 20, 30, 40]) => {
  return new InMemoryRepartidorRepository(
    ids.map(id => ({ id_usuario: id, estado: 'DISPONIBLE' }))
  );
};

describe('CU-019 Asignar pedido (AsignarRepartidorUseCase)', () => {
  test('Asignación exitosa de un pedido CONFIRMADO', async () => {
    const repoPedidos = new InMemoryPedidoRepartidorRepository([crearPedido({ id_pedido: 1, estado: 'CONFIRMADO', id_usuario: 100 })]);
    const repoRepartidores = crearRepoRepartidores();
    const useCase = new AsignarRepartidorUseCase(repoPedidos, repoRepartidores);

    const pedidoAsignado = await useCase.ejecutar(1, 10);
    expect(pedidoAsignado.estado).toBe('ASIGNADO');
    expect(pedidoAsignado.id_repartidor).toBe(10);

    const cantidad = await repoPedidos.contarPedidosDelDia(10);
    expect(cantidad).toBe(1);

    const disponible = await repoRepartidores.estaDisponible(10);
    expect(disponible).toBe(true);
  });

  test('Bloqueo si el repartidor está inactivo', async () => {
    const repoPedidos = new InMemoryPedidoRepartidorRepository([crearPedido({ id_pedido: 1, estado: 'CONFIRMADO', id_usuario: 100 })]);
    const repoRepartidores = new InMemoryRepartidorRepository([{ id_usuario: 10, estado: 'INACTIVO' }]);
    const useCase = new AsignarRepartidorUseCase(repoPedidos, repoRepartidores);

    await expect(useCase.ejecutar(1, 10)).rejects.toThrow('El repartidor no está disponible');
  });

  test('Permite asignar hasta 3 pedidos al mismo repartidor', async () => {
    const repoPedidos = new InMemoryPedidoRepartidorRepository([
      crearPedido({ id_pedido: 1, estado: 'CONFIRMADO', id_usuario: 100, id_repartidor: null }),
      crearPedido({ id_pedido: 2, estado: 'CONFIRMADO', id_usuario: 101, id_repartidor: null }),
      crearPedido({ id_pedido: 3, estado: 'CONFIRMADO', id_usuario: 102, id_repartidor: null }),
    ]);
    const repoRepartidores = crearRepoRepartidores();
    const useCase = new AsignarRepartidorUseCase(repoPedidos, repoRepartidores);

    const primero = await useCase.ejecutar(1, 10);
    const segundo = await useCase.ejecutar(2, 10);
    const tercero = await useCase.ejecutar(3, 10);

    expect(primero.id_repartidor).toBe(10);
    expect(segundo.id_repartidor).toBe(10);
    expect(tercero.id_repartidor).toBe(10);

    const cantidad = await repoPedidos.contarPedidosDelDia(10);
    expect(cantidad).toBe(3);
  });

  test('Reasignación permitida si el repartidor es distinto', async () => {
    const repoPedidos = new InMemoryPedidoRepartidorRepository([crearPedido({ id_pedido: 1, estado: 'CONFIRMADO', id_usuario: 100, id_repartidor: 10 })]);
    const repoRepartidores = crearRepoRepartidores();
    const useCase = new AsignarRepartidorUseCase(repoPedidos, repoRepartidores);

    const pedidoReasignado = await useCase.ejecutar(1, 20);
    expect(pedidoReasignado.id_repartidor).toBe(20);
    expect(pedidoReasignado.estado).toBe('ASIGNADO');
  });

  test('Bloqueo si el repartidor alcanzó 3 pedidos diarios', async () => {
    const repoPedidos = new InMemoryPedidoRepartidorRepository([
      crearPedido({ id_pedido: 1, estado: 'CONFIRMADO', id_usuario: 100 }),
      crearPedido({ id_pedido: 2, estado: 'CONFIRMADO', id_usuario: 101 }),
      crearPedido({ id_pedido: 3, estado: 'CONFIRMADO', id_usuario: 102 }),
      crearPedido({ id_pedido: 4, estado: 'CONFIRMADO', id_usuario: 103 })
    ]);
    const repoRepartidores = crearRepoRepartidores();
    const useCase = new AsignarRepartidorUseCase(repoPedidos, repoRepartidores);

    await repoPedidos.actualizarPedido(1, { id_repartidor: 10, estado: 'ASIGNADO' });
    await repoPedidos.actualizarPedido(2, { id_repartidor: 10, estado: 'ASIGNADO' });
    await repoPedidos.actualizarPedido(3, { id_repartidor: 10, estado: 'ASIGNADO' });

    await expect(useCase.ejecutar(4, 10)).rejects.toThrow('El repartidor ha alcanzado el límite de pedidos diarios');
  });
});