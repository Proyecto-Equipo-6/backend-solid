import InMemoryPedidoRepartidorRepository from '../../infraestructure/repositories/in-memory/InMemoryPedidoRepartidorRepository.js';
import ObtenerTodosPedidosUseCase from '../../application/obtenerTodosPedidosUseCase.js';
import ActualizarEstadoPedidoAdminUseCase from '../../application/actualizarEstadoPedidoAdminUseCase.js';
import ObtenerDetallePedidoAdminUseCase from '../../application/obtenerDetallePedidoAdminUseCase.js';
const { crearPedido } = require('../helpers/pedidos');

const crearDetallePedido = (id_pedido, id_producto, cantidad) => ({
  id_detalle_pedido: 1,
  id_pedido,
  id_producto,
  cantidad,
  precio_unitario: 1000,
  subtotal: 1000 * cantidad
});

describe('CU-027 CRUD pedidos (admin) (ObtenerTodosPedidos / ActualizarEstadoPedidoAdmin / ObtenerDetallePedidoAdmin)', () => {
  test('Filtrado multi-criterio de pedidos por estado y fecha', async () => {
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

  test('Verificar la visualización completa del detalle de una orden administrativa', async () => {
    const pedido = crearPedido({ id_pedido: 1, estado: 'CONFIRMADO', id_usuario: 100, id_repartidor: null, fecha_pedido: '2026-08-15T08:00:00' });
    pedido.clienteNombre = 'María Pérez';
    pedido.clienteTelefono = '3001234567';

    const detalles = [
      crearDetallePedido(1, 1, 2),
      crearDetallePedido(1, 2, 1)
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
});