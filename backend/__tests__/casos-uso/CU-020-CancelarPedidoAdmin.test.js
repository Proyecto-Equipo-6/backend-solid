import InMemoryPedidoRepartidorRepository from '../../infraestructure/repositories/in-memory/InMemoryPedidoRepartidorRepository.js';
import InMemoryProductoRepository from '../../infraestructure/repositories/in-memory/InMemoryProductoRepository.js';
import InMemoryRepartidorRepository from '../../infraestructure/repositories/in-memory/InMemoryRepartidorRepository.js';
import CancelarPedidoAdminUseCase from '../../application/cancelarPedidoAdminUseCase.js';
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

describe('CU-020 Cancelar pedido (admin) (CancelarPedidoAdminUseCase)', () => {
  test('Cancelación directa exitosa con motivo predefinido', async () => {
    const repoPedidos = new InMemoryPedidoRepartidorRepository([crearPedido({ id_pedido: 1, estado: 'CONFIRMADO', id_usuario: 100 })]);
    const repoProductos = new InMemoryProductoRepository([crearProducto(1, 10)]);
    const repoRepartidores = crearRepoRepartidores();
    const useCase = new CancelarPedidoAdminUseCase(repoPedidos, repoProductos, repoRepartidores);

    const cancelado = await useCase.ejecutar(1, 'Producto no disponible');
    expect(cancelado.estado).toBe('CANCELADO');
    expect(cancelado.motivo_cancelacion).toBe('Producto no disponible');
  });

  test('Validación de observación obligatoria para motivo "Otro"', async () => {
    const repoPedidos = new InMemoryPedidoRepartidorRepository([crearPedido({ id_pedido: 1, estado: 'CONFIRMADO', id_usuario: 100 })]);
    const repoProductos = new InMemoryProductoRepository([crearProducto(1, 10)]);
    const repoRepartidores = crearRepoRepartidores();
    const useCase = new CancelarPedidoAdminUseCase(repoPedidos, repoProductos, repoRepartidores);

    await expect(
      useCase.ejecutar(1, 'Otro')
    ).rejects.toThrow('Debe especificar el motivo en la observación');
  });

  test('Bloqueo de cancelación en estado EN_CAMINO', async () => {
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

  test('Falla al liberar repartidor, pero el pedido se cancela y el error se propaga', async () => {
    const repoPedidos = new InMemoryPedidoRepartidorRepository(
      [crearPedido({ id_pedido: 1, estado: 'CONFIRMADO', id_usuario: 100, id_repartidor: 10 })],
      [crearDetallePedido(1, 1, 2)]
    );
    const repoProductos = new InMemoryProductoRepository([crearProducto(1, 10)]);

    const repoRepartidores = new InMemoryRepartidorRepository([
      { id_usuario: 10, estado: 'OCUPADO' }
    ]);
    repoRepartidores.marcarDisponible = jest.fn().mockRejectedValue(new Error('Fallo al actualizar contador'));

    const useCase = new CancelarPedidoAdminUseCase(repoPedidos, repoProductos, repoRepartidores);

    await expect(
      useCase.ejecutar(1, 'Cliente solicitó anulación', { reintegrar_stock: true })
    ).rejects.toThrow('Fallo al actualizar contador');

    const pedido = await repoPedidos.obtenerDetallePedido(1);
    expect(pedido.estado).toBe('CANCELADO');
  });
});