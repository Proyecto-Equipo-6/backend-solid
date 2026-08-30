import InMemoryProductoRepository from '../../infraestructure/repositories/in-memory/InMemoryProductoRepository.js';
import AjustarStockProductoUseCase from '../../application/ajustarStockProductoUseCase.js';

describe('Módulo Ajuste de Stock (CU-023)', () => {
  const crearProducto = (id, stock) => ({
    id_producto: id,
    sku: `SKU-${id}`,
    id_categoria: 1,
    id_proveedor: 1,
    nombre: `Producto ${id}`,
    descripcion: 'Descripción',
    precio: 1000,
    stock,
    estado: 1,
    garantia: '6 meses',
    imagen_url: null,
    fecha_creacion: new Date().toISOString()
  });

  test('Ajustar stock exitosamente', async () => {
    const repo = new InMemoryProductoRepository([crearProducto(1, 50)]);
    const useCase = new AjustarStockProductoUseCase(repo);

    const resultado = await useCase.ejecutar(1, 75, 'Reposición de inventario', 1);

    expect(resultado.id_producto).toBe(1);
    expect(resultado.cantidad_anterior).toBe(50);
    expect(resultado.cantidad_nueva).toBe(75);
    expect(resultado.motivo).toBe('Reposición de inventario');
  });

  test('Rechazar si la cantidad no es un número', async () => {
    const repo = new InMemoryProductoRepository([crearProducto(1, 50)]);
    const useCase = new AjustarStockProductoUseCase(repo);

    await expect(
      useCase.ejecutar(1, 'no-es-numero', 'Motivo', 1)
    ).rejects.toThrow('La cantidad nueva debe ser un número válido');
  });

  test('Rechazar si falta el motivo', async () => {
    const repo = new InMemoryProductoRepository([crearProducto(1, 50)]);
    const useCase = new AjustarStockProductoUseCase(repo);

    await expect(
      useCase.ejecutar(1, 75, '', 1)
    ).rejects.toThrow('El motivo del ajuste es obligatorio');
  });

  test('Rechazar si el producto no existe', async () => {
    const repo = new InMemoryProductoRepository([crearProducto(1, 50)]);
    const useCase = new AjustarStockProductoUseCase(repo);

    await expect(
      useCase.ejecutar(999, 75, 'Motivo', 1)
    ).rejects.toThrow('Producto no encontrado');
  });

  test('Permitir stock en 0 (producto agotado)', async () => {
    const repo = new InMemoryProductoRepository([crearProducto(1, 50)]);
    const useCase = new AjustarStockProductoUseCase(repo);

    const resultado = await useCase.ejecutar(1, 0, 'Merma total', 1);

    expect(resultado.cantidad_nueva).toBe(0);

    const producto = await repo.findById(1);
    expect(producto.stock).toBe(0);
  });
});
