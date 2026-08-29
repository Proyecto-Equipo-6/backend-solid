import InMemoryPedidoRepartidorRepository from '../../infraestructure/repositories/in-memory/InMemoryPedidoRepartidorRepository.js';
import InMemoryProductoRepository from '../../infraestructure/repositories/in-memory/InMemoryProductoRepository.js';
import InMemoryRepartidorRepository from '../../infraestructure/repositories/in-memory/InMemoryRepartidorRepository.js';
import ObtenerTodosPedidosUseCase from '../../application/obtenerTodosPedidosUseCase.js';
import AsignarRepartidorUseCase from '../../application/asignarRepartidorUseCase.js';
import CancelarPedidoAdminUseCase from '../../application/cancelarPedidoAdminUseCase.js';
import ActualizarEstadoPedidoAdminUseCase from '../../application/actualizarEstadoPedidoAdminUseCase.js';
import ObtenerDetallePedidoAdminUseCase from '../../application/obtenerDetallePedidoAdminUseCase.js';
const { crearPedido } = require('../helpers/pedidos');

const crearRepoRepartidores = (ids = [10, 20, 30, 40]) => {
  return new InMemoryRepartidorRepository(
    ids.map(id => ({ id_usuario: id, estado: 'DISPONIBLE' }))
  );
};

const crearProducto = (id_producto, stock) => ({
  id_producto,
  sku: `SKU-${id_producto}`,
  id_categoria: 1,
  id_proveedor: 1,
  nombre: `Producto ${id_producto}`,
  descripcion: 'Descripción',
  precio: 1000,
  stock,
  estado: 1,
  garantia: '6 meses',
  imagen_url: null,
  fecha_creacion: new Date().toISOString()
});

const crearDetallePedido = (id_pedido, id_producto, cantidad) => ({
  id_detalle_pedido: 1,
  id_pedido,
  id_producto,
  cantidad,
  precio_unitario: 1000,
  subtotal: 1000 * cantidad
});

describe('Módulo administración de pedidos (CU-019, CU-020, CU-027)', () => {
  test('Filtrado multi-criterio de pedidos por estado y fecha - CP-CU-027-03', async () => {
  const repo = new InMemoryPedidoRepartidorRepository([
    crearPedido({ id_pedido: 1, estado: 'PENDIENTE', id_usuario: 100, id_repartidor: null, fecha_pedido: '2026-08-15T08:00:00' }),
    crearPedido({ id_pedido: 2, estado: 'CONFIRMADO', id_usuario: 101, id_repartidor: null, fecha_pedido: '2026-08-15T09:00:00' }),
    crearPedido({ id_pedido: 3, estado: 'ENTREGADO', id_usuario: 100, id_repartidor: 10, fecha_pedido: '2026-08-14T10:00:00' })
  ]);
  const useCase = new ObtenerTodosPedidosUseCase(repo);

  const resultadoPendientes = await useCase.ejecutar({ estado: 'PENDIENTE' });
  const pendientes = resultadoPendientes.data;
  expect(pendientes).toHaveLength(1);
  expect(pendientes[0].id_pedido).toBe(1);

  const resultadoPorFecha = await useCase.ejecutar({
    fechaDesde: '2026-08-15T00:00:00',
    fechaHasta: '2026-08-15T23:59:59'
  });
  const porFecha = resultadoPorFecha.data;
  expect(porFecha).toHaveLength(2);
  });

  test('Transición válida PENDIENTE -> CONFIRMADO', async () => {
    const repo = new InMemoryPedidoRepartidorRepository([crearPedido({ id_pedido: 1, estado: 'PENDIENTE', id_usuario: 100 })]);
    const useCase = new ActualizarEstadoPedidoAdminUseCase(repo);

    const pedidoActualizado = await useCase.ejecutar(1, 'CONFIRMADO');
    expect(pedidoActualizado.estado).toBe('CONFIRMADO');
  });

  test('Bloqueo de saltos ilógicos', async () => {
    const repo = new InMemoryPedidoRepartidorRepository([crearPedido({ id_pedido: 1, estado: 'PENDIENTE', id_usuario: 100 })]);
    const useCase = new ActualizarEstadoPedidoAdminUseCase(repo);

    await expect(
      useCase.ejecutar(1, 'ENTREGADO')
    ).rejects.toThrow('No se pudo actualizar el estado del pedido. Transición inválida.');
  });

  test('Asignación exitosa de un pedido CONFIRMADO - CP-CU-019-01 / CP-RF010.2-01', async () => {
    const repoPedidos = new InMemoryPedidoRepartidorRepository([crearPedido({ id_pedido: 1, estado: 'CONFIRMADO', id_usuario: 100 })]);
    const repoRepartidores = crearRepoRepartidores();
    const useCase = new AsignarRepartidorUseCase(repoPedidos, repoRepartidores);

    const pedidoAsignado = await useCase.ejecutar(1, 10);
    expect(pedidoAsignado.estado).toBe('ASIGNADO');
    expect(pedidoAsignado.id_repartidor).toBe(10);

    const cantidad = await repoPedidos.contarPedidosDelDia(10);
    expect(cantidad).toBe(1);

    const disponible = await repoRepartidores.estaDisponible(10);
    expect(disponible).toBe(false);
  });

  test('Bloqueo si el repartidor no está disponible - CP-RF010.2-02', async () => {
    const repoPedidos = new InMemoryPedidoRepartidorRepository([crearPedido({ id_pedido: 1, estado: 'CONFIRMADO', id_usuario: 100 })]);
    const repoRepartidores = new InMemoryRepartidorRepository([{ id_usuario: 10, estado: 'OCUPADO' }]);
    const useCase = new AsignarRepartidorUseCase(repoPedidos, repoRepartidores);

    await expect(useCase.ejecutar(1, 10)).rejects.toThrow('El repartidor no está disponible');
  });

  test('Reasignación permitida si el repartidor es distinto', async () => {
    const repoPedidos = new InMemoryPedidoRepartidorRepository([crearPedido({ id_pedido: 1, estado: 'CONFIRMADO', id_usuario: 100, id_repartidor: 10 })]);
    const repoRepartidores = crearRepoRepartidores();
    const useCase = new AsignarRepartidorUseCase(repoPedidos, repoRepartidores);

    const pedidoReasignado = await useCase.ejecutar(1, 20);
    expect(pedidoReasignado.id_repartidor).toBe(20);
    expect(pedidoReasignado.estado).toBe('ASIGNADO');
  });

  test('Bloqueo si el repartidor alcanzó 3 pedidos diarios - CP-CU-019-05', async () => {
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

  test('Cancelación directa exitosa con motivo predefinido - CP-CU-020-01', async () => {
    const repoPedidos = new InMemoryPedidoRepartidorRepository([crearPedido({ id_pedido: 1, estado: 'CONFIRMADO', id_usuario: 100 })]);
    const repoProductos = new InMemoryProductoRepository([crearProducto(1, 10)]);
    const repoRepartidores = crearRepoRepartidores();
    const useCase = new CancelarPedidoAdminUseCase(repoPedidos, repoProductos, repoRepartidores);

    const cancelado = await useCase.ejecutar(1, 'Producto no disponible');
    expect(cancelado.estado).toBe('CANCELADO');
    expect(cancelado.motivo_cancelacion).toBe('Producto no disponible');
  });

  test('Validación de observación obligatoria para motivo "Otro" - CP-CU-020-02', async () => {
    const repoPedidos = new InMemoryPedidoRepartidorRepository([crearPedido({ id_pedido: 1, estado: 'CONFIRMADO', id_usuario: 100 })]);
    const repoProductos = new InMemoryProductoRepository([crearProducto(1, 10)]);
    const repoRepartidores = crearRepoRepartidores();
    const useCase = new CancelarPedidoAdminUseCase(repoPedidos, repoProductos, repoRepartidores);

    await expect(
      useCase.ejecutar(1, 'Otro')
    ).rejects.toThrow('Debe especificar el motivo en la observación');
  });

  test('Bloqueo de cancelación en estado EN_CAMINO - CU-020', async () => {
    const repoPedidos = new InMemoryPedidoRepartidorRepository([crearPedido({ id_pedido: 1, estado: 'EN_CAMINO', id_usuario: 100, id_repartidor: 10 })]);
    const repoProductos = new InMemoryProductoRepository([crearProducto(1, 10)]);
    const repoRepartidores = crearRepoRepartidores();
    const useCase = new CancelarPedidoAdminUseCase(repoPedidos, repoProductos, repoRepartidores);

    await expect(
      useCase.ejecutar(1, 'Otro', { observaciones: 'Prueba' })
    ).rejects.toThrow('No se puede cancelar un pedido en este estado');
  });

  test('Cancelación de pedido NO_ENTREGADO con revisión de observación', async () => {
    const repoPedidos = new InMemoryPedidoRepartidorRepository([crearPedido({ id_pedido: 1, estado: 'NO_ENTREGADO', id_usuario: 100, id_repartidor: 10 })]);
    const repoProductos = new InMemoryProductoRepository([crearProducto(1, 10)]);
    const repoRepartidores = crearRepoRepartidores();
    const useCase = new CancelarPedidoAdminUseCase(repoPedidos, repoProductos, repoRepartidores);

    const cancelado = await useCase.ejecutar(1, 'Cliente no responde', { observaciones: 'Revisión de observación del repartidor' });
    expect(cancelado.estado).toBe('CANCELADO');
    expect(cancelado.motivo_cancelacion).toBe('Cliente no responde');
  });

  test('Mantener pedido activo no modifica el estado', async () => {
    const repoPedidos = new InMemoryPedidoRepartidorRepository([crearPedido({ id_pedido: 1, estado: 'NO_ENTREGADO', id_usuario: 100, id_repartidor: 10 })]);
    const pedido = await repoPedidos.obtenerDetallePedido(1);
    expect(pedido.estado).toBe('NO_ENTREGADO');
  });

  test('Cancelación exitosa con reversión atómica de stock', async () => {
    const pedido = crearPedido({ id_pedido: 1, estado: 'CONFIRMADO', id_usuario: 100 });
    const producto = crearProducto(1, 10);

    const repoPedidos = new InMemoryPedidoRepartidorRepository(
      [pedido],
      [crearDetallePedido(1, 1, 3)]
    );
    const repoProductos = new InMemoryProductoRepository([producto]);
    const repoRepartidores = crearRepoRepartidores();

    const useCase = new CancelarPedidoAdminUseCase(repoPedidos, repoProductos, repoRepartidores);

    const cancelado = await useCase.ejecutar(1, 'Cliente solicitó anulación');

    expect(cancelado.estado).toBe('CANCELADO');
    expect(cancelado.motivo_cancelacion).toBe('Cliente solicitó anulación');

    const productoActualizado = await repoProductos.findById(1);
    expect(productoActualizado.stock).toBe(13);
  });

  test('Bloqueo por inmutabilidad de pedido en estado terminal ENTREGADO', async () => {
    const repoPedidos = new InMemoryPedidoRepartidorRepository([crearPedido({ id_pedido: 1, estado: 'ENTREGADO', id_usuario: 100, id_repartidor: 10 })]);
    const repoProductos = new InMemoryProductoRepository([crearProducto(1, 10)]);
    const repoRepartidores = crearRepoRepartidores();

    const useCase = new CancelarPedidoAdminUseCase(repoPedidos, repoProductos, repoRepartidores);

    await expect(
      useCase.ejecutar(1, 'Producto dañado')
    ).rejects.toThrow('No se puede cancelar un pedido en este estado');
  });

  test('Cancelación sin devolución de stock en caso de mermas', async () => {
    const pedido = crearPedido({ id_pedido: 1, estado: 'CONFIRMADO', id_usuario: 100 });
    const producto = crearProducto(1, 10);

    const repoPedidos = new InMemoryPedidoRepartidorRepository(
      [pedido],
      [crearDetallePedido(1, 1, 3)]
    );
    const repoProductos = new InMemoryProductoRepository([producto]);
    const repoRepartidores = crearRepoRepartidores();

    const useCase = new CancelarPedidoAdminUseCase(repoPedidos, repoProductos, repoRepartidores);

    const cancelado = await useCase.ejecutar(1, 'Producto dañado en bodega', { reintegrar_stock: false });

    expect(cancelado.estado).toBe('CANCELADO');
    expect(cancelado.motivo_cancelacion).toBe('Producto dañado en bodega');

    const productoActualizado = await repoProductos.findById(1);
    expect(productoActualizado.stock).toBe(10);
  });

  test('Liberación del repartidor al cancelar un pedido con repartidor asignado', async () => {
    const repoPedidos = new InMemoryPedidoRepartidorRepository(
      [crearPedido({ id_pedido: 1, estado: 'CONFIRMADO', id_usuario: 100, id_repartidor: 10 })],
      [crearDetallePedido(1, 1, 2)]
    );
    const repoProductos = new InMemoryProductoRepository([crearProducto(1, 10)]);
    const repoRepartidores = new InMemoryRepartidorRepository([
      { id_usuario: 10, estado: 'OCUPADO' }
    ]);

    const useCase = new CancelarPedidoAdminUseCase(repoPedidos, repoProductos, repoRepartidores);

    const cancelado = await useCase.ejecutar(1, 'Cliente solicitó anulación', { reintegrar_stock: true });

    const disponible = await repoRepartidores.estaDisponible(10);
    expect(disponible).toBe(true);
    expect(cancelado.estado).toBe('CANCELADO');
  });

  test('Verificar la visualización completa del detalle de una orden administrativa', async () => {
  // Pedido ficticio
  const pedido = crearPedido({ id_pedido: 1, estado: 'CONFIRMADO', id_usuario: 100, id_repartidor: null, fecha_pedido: '2026-08-15T08:00:00' });
  pedido.clienteNombre = 'María Pérez';
  pedido.clienteTelefono = '3001234567';

  // Detalles del pedido (simula tabla pedido_detalles)
  const detalles = [
    crearDetallePedido(1, 1, 2), // producto 1, cantidad 2
    crearDetallePedido(1, 2, 1)  // producto 2, cantidad 1
  ];

  const repoPedidos = new InMemoryPedidoRepartidorRepository([pedido], detalles);
  const useCase = new ObtenerDetallePedidoAdminUseCase(repoPedidos);

  const detalleAdmin = await useCase.ejecutar(1);

  expect(detalleAdmin.id_pedido).toBe(1);
  expect(detalleAdmin.cliente.nombre).toBe('María Pérez');
  expect(detalleAdmin.cliente.telefono).toBe('3001234567');
  expect(detalleAdmin.direccion_entrega).toBe('Calle 123');
  expect(detalleAdmin.total).toBe(50000);
  expect(detalleAdmin.estado).toBe('CONFIRMADO');
  expect(detalleAdmin.productos).toHaveLength(2);
  expect(detalleAdmin.productos[0]).toMatchObject({
    id_producto: 1,
    cantidad: 2
  });
  expect(detalleAdmin.productos[1]).toMatchObject({
    id_producto: 2,
    cantidad: 1
  });
  });

  test('Verificar la consulta de órdenes con paginación y filtrado por estado CONFIRMADO', async () => {
  const repo = new InMemoryPedidoRepartidorRepository([
    crearPedido({ id_pedido: 1, estado: 'CONFIRMADO', id_usuario: 100, id_repartidor: null, fecha_pedido: '2026-08-15T08:00:00' }),
    crearPedido({ id_pedido: 2, estado: 'CONFIRMADO', id_usuario: 101, id_repartidor: null, fecha_pedido: '2026-08-15T09:00:00' }),
    crearPedido({ id_pedido: 3, estado: 'CONFIRMADO', id_usuario: 102, id_repartidor: null, fecha_pedido: '2026-08-15T10:00:00' }),
    crearPedido({ id_pedido: 4, estado: 'PENDIENTE', id_usuario: 103, id_repartidor: null, fecha_pedido: '2026-08-15T11:00:00' })
  ]);

  const useCase = new ObtenerTodosPedidosUseCase(repo);

  const resultado = await useCase.ejecutar({
    estado: 'CONFIRMADO',
    page: 1,
    limit: 2
  });

  expect(resultado.total).toBe(3);
  expect(resultado.page).toBe(1);
  expect(resultado.limit).toBe(2);
  expect(resultado.data).toHaveLength(2);
  expect(resultado.data[0].id_pedido).toBe(1);
  expect(resultado.data[1].id_pedido).toBe(2);
  });

  test('Falla al liberar repartidor, pero el pedido se cancela y el error se propaga', async () => {
  const repoPedidos = new InMemoryPedidoRepartidorRepository(
    [crearPedido({ id_pedido: 1, estado: 'CONFIRMADO', id_usuario: 100, id_repartidor: 10 })],
    [crearDetallePedido(1, 1, 2)]
  );
  const repoProductos = new InMemoryProductoRepository([crearProducto(1, 10)]);

  // Repartidor ocupado y con marcarDisponible roto
  const repoRepartidores = new InMemoryRepartidorRepository([
    { id_usuario: 10, estado: 'OCUPADO' }
  ]);
  repoRepartidores.marcarDisponible = jest.fn().mockRejectedValue(new Error('Fallo al actualizar contador'));

  const useCase = new CancelarPedidoAdminUseCase(repoPedidos, repoProductos, repoRepartidores);

  // El pedido se cancela antes de fallar la liberación
  await expect(
    useCase.ejecutar(1, 'Cliente solicitó anulación', { reintegrar_stock: true })
  ).rejects.toThrow('Fallo al actualizar contador');

  // Verificar que el pedido quedó cancelado a pesar del fallo
  const pedido = await repoPedidos.obtenerDetallePedido(1);
  expect(pedido.estado).toBe('CANCELADO');
});
});
