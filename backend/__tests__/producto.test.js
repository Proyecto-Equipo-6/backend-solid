import InMemoryProductoRepository from '../infraestructure/repositories/in-memory/InMemoryProductoRepository.js';
import InMemoryCategoriaRepository from '../infraestructure/repositories/in-memory/InMemoryCategoriaRepository.js';
import CrearCategoriaUseCase from '../application/crearCategoriaUseCase.js';
import CrearProductoUseCase from '../application/crearProductoUseCase.js';
import EditarProductoUseCase from '../application/editarProductoUseCase.js';
import EliminarProductoUseCase from '../application/eliminarProductoUseCase.js';

// Helper para crear la categoría "Aseo"
async function crearCategoriaAseo(repoCategoria) {
  const useCase = new CrearCategoriaUseCase(repoCategoria);
  return await useCase.ejecutar({ nombre: 'Aseo', descripcion: 'Productos de limpieza' });
}

describe('Módulo CRUD productos - Aseo (CU-023)', () => {
  test('Crear producto con éxito (flujo feliz, estado 1 y fecha automática)', async () => {
    const repoProductos = new InMemoryProductoRepository();
    const repoCategorias = new InMemoryCategoriaRepository();
    const categoria = await crearCategoriaAseo(repoCategorias);

    const useCase = new CrearProductoUseCase(repoProductos, repoCategorias);
    const producto = await useCase.ejecutar({
      id_categoria: categoria.id_categoria,
      nombre: 'Jabón Líquido',
      descripcion: 'Rinde 5 litros',
      precio: 15000,
      stock: 50
    });

    expect(producto.id_producto).toBe(1);
    expect(producto.nombre).toBe('Jabón Líquido');
    expect(producto.estado).toBe(1);
    expect(producto.fecha_creacion).toBeDefined();
    expect(new Date(producto.fecha_creacion).toString()).not.toBe('Invalid Date');
  });

  test('Rechazar si el nombre está duplicado', async () => {
    const repoProductos = new InMemoryProductoRepository();
    const repoCategorias = new InMemoryCategoriaRepository();
    const categoria = await crearCategoriaAseo(repoCategorias);

    const useCase = new CrearProductoUseCase(repoProductos, repoCategorias);

    await useCase.ejecutar({
      id_categoria: categoria.id_categoria,
      nombre: 'Detergente en Polvo',
      descripcion: 'Bolsa 3 kg',
      precio: 25000,
      stock: 30
    });

    await expect(
      useCase.ejecutar({
        id_categoria: categoria.id_categoria,
        nombre: 'Detergente en Polvo',
        descripcion: 'Bolsa 5 kg',
        precio: 40000,
        stock: 15
      })
    ).rejects.toThrow('Ya existe un producto con ese nombre');
  });

  test('Rechazar si el precio o el stock son negativos', async () => {
    const repoProductos = new InMemoryProductoRepository();
    const repoCategorias = new InMemoryCategoriaRepository();
    const categoria = await crearCategoriaAseo(repoCategorias);

    const useCase = new CrearProductoUseCase(repoProductos, repoCategorias);

    await expect(
      useCase.ejecutar({
        id_categoria: categoria.id_categoria,
        nombre: 'Limpiavidrios',
        descripcion: 'Frasco 500 ml',
        precio: -500,
        stock: 10
      })
    ).rejects.toThrow('El precio y el stock no pueden ser negativos');

    await expect(
      useCase.ejecutar({
        id_categoria: categoria.id_categoria,
        nombre: 'Cloro',
        descripcion: 'Galón 1 L',
        precio: 5000,
        stock: -2
      })
    ).rejects.toThrow('El precio y el stock no pueden ser negativos');
  });

  test('Rechazar si la categoría asociada no existe', async () => {
    const repoProductos = new InMemoryProductoRepository();
    const repoCategorias = new InMemoryCategoriaRepository(); // vacío

    const useCase = new CrearProductoUseCase(repoProductos, repoCategorias);

    await expect(
      useCase.ejecutar({
        id_categoria: 999,
        nombre: 'Desinfectante',
        descripcion: 'Aroma floral',
        precio: 12000,
        stock: 40
      })
    ).rejects.toThrow('La categoría asociada no existe');
  });

  test('Editar producto actualiza sus datos y estado', async () => {
    const repoProductos = new InMemoryProductoRepository();
    const repoCategorias = new InMemoryCategoriaRepository();
    const categoria = await crearCategoriaAseo(repoCategorias);

    const crear = new CrearProductoUseCase(repoProductos, repoCategorias);
    const editar = new EditarProductoUseCase(repoProductos, repoCategorias);

    const producto = await crear.ejecutar({
      id_categoria: categoria.id_categoria,
      nombre: 'Cepillo de dientes',
      descripcion: 'Suave',
      precio: 5000,
      stock: 100
    });

    const editado = await editar.ejecutar(producto.id_producto, {
      id_categoria: categoria.id_categoria,
      nombre: 'Cepillo de dientes Premium',
      descripcion: 'Suave con protector',
      precio: 7000,
      stock: 80,
      estado: 'Inactivo'
    });

    expect(editado.nombre).toBe('Cepillo de dientes Premium');
    expect(editado.estado).toBe(0);
  });

  test('Eliminar producto lo desactiva (borrado lógico, RN-101)', async () => {
    const repoProductos = new InMemoryProductoRepository();
    const repoCategorias = new InMemoryCategoriaRepository();
    const categoria = await crearCategoriaAseo(repoCategorias);

    const crear = new CrearProductoUseCase(repoProductos, repoCategorias);
    const producto = await crear.ejecutar({
      id_categoria: categoria.id_categoria,
      nombre: 'Escoba',
      descripcion: 'Cerdas suaves',
      precio: 8000,
      stock: 20
    });

    const eliminar = new EliminarProductoUseCase(repoProductos);
    await eliminar.ejecutar(producto.id_producto);

    const productoDesactivado = await repoProductos.findById(producto.id_producto);
    expect(productoDesactivado.estado).toBe(0);
  });
});