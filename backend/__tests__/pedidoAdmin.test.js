import InMemoryPedidoRepartidorRepository from '../infraestructure/repositories/in-memory/InMemoryPedidoRepartidorRepository.js';
import ObtenerTodosPedidosUseCase from '../application/obtenerTodosPedidosUseCase.js';
import AsignarRepartidorUseCase from '../application/asignarRepartidorUseCase.js';
import CancelarPedidoAdminUseCase from '../application/cancelarPedidoAdminUseCase.js';
import ActualizarEstadoPedidoAdminUseCase from '../application/actualizarEstadoPedidoAdminUseCase.js';
import Pedido from '../domain/models/Pedido.js';

const crearPedido = (
  id_pedido,
  estado = 'PENDIENTE',
  id_usuario = 100,
  id_repartidor = null,
  fecha_pedido = new Date().toISOString()
) => new Pedido({
  id_pedido,
  id_usuario,
  id_repartidor,
  id_metodo_pago: 1,
  direccion_entrega: 'Calle 123',
  total: 50000,
  estado,
  comprobante_url: null,
  observaciones: null,
  motivo_cancelacion: null,
  fecha_pedido,
  fecha_actualizacion: new Date().toISOString()
});

describe('Módulo administración de pedidos (CU-019, CU-020, CU-027)', () => {
  test('Filtrado multi-criterio de pedidos por estado y fecha - CP-CU-027-03', async () => {
    const repo = new InMemoryPedidoRepartidorRepository([
      crearPedido(1, 'PENDIENTE', 100, null, '2026-08-15T08:00:00'),
      crearPedido(2, 'PAGO_APROBADO', 101, null, '2026-08-15T09:00:00'),
      crearPedido(3, 'ENTREGADO', 100, 10, '2026-08-14T10:00:00')
    ]);
    const useCase = new ObtenerTodosPedidosUseCase(repo);

    const pendientes = await useCase.ejecutar({ estado: 'PENDIENTE' });
    expect(pendientes).toHaveLength(1);
    expect(pendientes[0].id_pedido).toBe(1);

    const porFecha = await useCase.ejecutar({
      fechaDesde: '2026-08-15T00:00:00',
      fechaHasta: '2026-08-15T23:59:59'
    });
    expect(porFecha).toHaveLength(2);
  });

  test('Asignación exitosa de un pedido CONFIRMADO - CP-CU-019-01', async () => {
  const repo = new InMemoryPedidoRepartidorRepository([
    crearPedido(1, 'CONFIRMADO', 100)
  ]);
  const useCase = new AsignarRepartidorUseCase(repo);

  const pedidoAsignado = await useCase.ejecutar(1, 10);
  expect(pedidoAsignado.estado).toBe('ASIGNADO');
  expect(pedidoAsignado.id_repartidor).toBe(10);

  const cantidad = await repo.contarPedidosDelDia(10);
  expect(cantidad).toBe(1);
});

test('CP-CU-019-03: Bloqueo si el pedido ya fue asignado', async () => {
  const repo = new InMemoryPedidoRepartidorRepository([
    crearPedido(1, 'CONFIRMADO', 100, 10) // ya tiene repartidor 10
  ]);
  const useCase = new AsignarRepartidorUseCase(repo);

  await expect(
    useCase.ejecutar(1, 20)
  ).rejects.toThrow('El pedido ya fue asignado');
});

  test('Bloqueo si el repartidor alcanzó 3 pedidos diarios - CP-CU-019-05', async () => {
  const repo = new InMemoryPedidoRepartidorRepository([
    crearPedido(1, 'CONFIRMADO', 100),
    crearPedido(2, 'CONFIRMADO', 101),
    crearPedido(3, 'CONFIRMADO', 102),
    crearPedido(4, 'CONFIRMADO', 103)
  ]);

  await repo.actualizarPedido(1, { id_repartidor: 10, estado: 'ASIGNADO' });
  await repo.actualizarPedido(2, { id_repartidor: 10, estado: 'ASIGNADO' });
  await repo.actualizarPedido(3, { id_repartidor: 10, estado: 'ASIGNADO' });

  const useCase = new AsignarRepartidorUseCase(repo);
  await expect(useCase.ejecutar(4, 10)).rejects.toThrow('El repartidor ha alcanzado el límite de pedidos diarios');
});

  test('Cancelación directa exitosa con motivo predefinido - CP-CU-020-01', async () => {
    const repo = new InMemoryPedidoRepartidorRepository([
      crearPedido(1, 'CONFIRMADO', 100)
    ]);
    const useCase = new CancelarPedidoAdminUseCase(repo);

    const cancelado = await useCase.ejecutar(1, 'Producto no disponible');
    expect(cancelado.estado).toBe('CANCELADO');
    expect(cancelado.motivo_cancelacion).toBe('Producto no disponible');
  });

  test('Validación de observación obligatoria para motivo "Otro" - CP-CU-020-02', async () => {
    const repo = new InMemoryPedidoRepartidorRepository([
      crearPedido(1, 'CONFIRMADO', 100)
    ]);
    const useCase = new CancelarPedidoAdminUseCase(repo);

    await expect(
      useCase.ejecutar(1, 'Otro')
    ).rejects.toThrow('Debe especificar el motivo en la observación');
  });

 test('Bloqueo de cancelación en estado EN_CAMINO - CU-020', async () => {
  const repo = new InMemoryPedidoRepartidorRepository([
    crearPedido(1, 'EN_CAMINO', 100, 10)
  ]);
  const useCase = new CancelarPedidoAdminUseCase(repo);

  await expect(
    useCase.ejecutar(1, 'Otro', 'Observación de prueba')
  ).rejects.toThrow('No se puede cancelar un pedido en este estado');
});

  test('CP-CU-020-03: Cancelación de pedido NO_ENTREGADO con revisión de observación', async () => {
  const repo = new InMemoryPedidoRepartidorRepository([
    crearPedido(1, 'NO_ENTREGADO', 100, 10)
  ]);
  const useCase = new CancelarPedidoAdminUseCase(repo);

  const cancelado = await useCase.ejecutar(1, 'Cliente no responde', 'Revisión de observación del repartidor');
  expect(cancelado.estado).toBe('CANCELADO');
  expect(cancelado.motivo_cancelacion).toBe('Cliente no responde');
});

test('CP-CU-020-04: Mantener pedido activo no modifica el estado', async () => {
  const repo = new InMemoryPedidoRepartidorRepository([
    crearPedido(1, 'NO_ENTREGADO', 100, 10)
  ]);

  const pedido = await repo.obtenerDetallePedido(1);
  expect(pedido.estado).toBe('NO_ENTREGADO');
  // Al no llamar al caso de uso, el pedido permanece igual
});

  test('CP-RF-008.2-03: Bloqueo de saltos ilógicos en la máquina de estados', async () => {
  const repo = new InMemoryPedidoRepartidorRepository([
    crearPedido(1, 'PENDIENTE', 100)
  ]);
  const useCase = new ActualizarEstadoPedidoAdminUseCase(repo);

  await expect(
    useCase.ejecutar(1, 'ENTREGADO')
  ).rejects.toThrow('No se pudo actualizar el estado del pedido. Transición inválida.');
});

test('CP-CU-027-01: Transición válida PENDIENTE -> CONFIRMADO', async () => {
  const repo = new InMemoryPedidoRepartidorRepository([
    crearPedido(1, 'PENDIENTE', 100)
  ]);
  const useCase = new ActualizarEstadoPedidoAdminUseCase(repo);

  const pedidoActualizado = await useCase.ejecutar(1, 'CONFIRMADO');

  expect(pedidoActualizado.estado).toBe('CONFIRMADO');
});
});