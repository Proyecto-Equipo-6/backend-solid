import ListarProductosPublicosUseCase from '../../application/ListarProductosPublicosUseCase';
import ObtenerProductoPublicoUseCase from '../../application/ObtenerProductoPublicoUseCase';
import ListarCategoriasUseCase from '../../application/ListarCategoriasUseCase';
import ListarProductosPorCategoriaUseCase from '../../application/ListarProductosPorCategoriaUseCase';
import BuscarProductosUseCase from '../../application/BuscarProductosUseCase';
import InMemoryProductoRepository from '../../infraestructure/repositories/in-memory/InMemoryProductoRepository';
import InMemoryCategoriaRepository from '../../infraestructure/repositories/in-memory/InMemoryCategoriaRepository';

const PRODUCTO_ACTIVO = {
  id_producto: 1,
  sku: 'COC-UTEN-01',
  nombre: 'Juego Utensilios Pro',
  descripcion: 'Juego completo de utensilios de cocina en silicona.',
  precio: 250000,
  stock: 100,
  garantia: '6 meses',
  imagen_url: null,
  estado: 1,
  categoria: 'Cocina',
  proveedor: 'Mega Plásticos S.A.S.',
};

function crearRepositorioConProductos(productos) {
  const repositorio = new InMemoryProductoRepository();
  repositorio.productos.push(...productos);
  return repositorio;
}

function crearRepositorioConCategorias(categorias) {
  const repositorio = new InMemoryCategoriaRepository();
  repositorio.categorias.push(...categorias);
  return repositorio;
}

describe('CU-001 Visualizar catálogo (ListarProductosPublicosUseCase)', () => {
  it('devuelve solo los productos activos (RN-001) en orden de registro', async () => {
    // Arrange
    const repositorio = crearRepositorioConProductos([
      PRODUCTO_ACTIVO,
      { ...PRODUCTO_ACTIVO, id_producto: 2, sku: 'ELE-PARL-03', estado: 1 },
      { ...PRODUCTO_ACTIVO, id_producto: 3, sku: 'HOG-MASA-02', estado: 0 },
    ]);
    const casoUso = new ListarProductosPublicosUseCase(repositorio);

    // Act
    const resultado = await casoUso.execute();

    // Assert
    expect(resultado.items).toHaveLength(2);
    expect(resultado.items.map((p) => p.id_producto)).toEqual([1, 2]);
    expect(resultado.items[0].categoria).toBe('Cocina');
    expect(resultado.items[0].proveedor).toBe('Mega Plásticos S.A.S.');
    expect(resultado.total).toBe(2);
    expect(resultado.pagina).toBe(1);
    expect(resultado.totalPaginas).toBe(1);
  });

  it('devuelve lista vacía si no hay productos activos', async () => {
    // Arrange
    const repositorio = crearRepositorioConProductos([
      { ...PRODUCTO_ACTIVO, id_producto: 1, estado: 0 },
    ]);
    const casoUso = new ListarProductosPublicosUseCase(repositorio);

    // Act
    const resultado = await casoUso.execute();

    // Assert
    expect(resultado.items).toEqual([]);
    expect(resultado.total).toBe(0);
  });

  it('aplica paginación server-side con límite por defecto de 12 (RN-011)', async () => {
    // Arrange
    const repositorio = crearRepositorioConProductos(
      Array.from({ length: 15 }, (_, i) => ({
        ...PRODUCTO_ACTIVO,
        id_producto: i + 1,
        sku: `SKU-${i + 1}`,
      }))
    );
    const casoUso = new ListarProductosPublicosUseCase(repositorio);

    // Act
    const pagina1 = await casoUso.execute({ pagina: 1 });
    const pagina2 = await casoUso.execute({ pagina: 2 });

    // Assert
    expect(pagina1.items).toHaveLength(12);
    expect(pagina1.total).toBe(15);
    expect(pagina1.totalPaginas).toBe(2);
    expect(pagina2.items).toHaveLength(3);
  });

  it('lanza error de conexión cuando el repositorio falla', async () => {
    // Arrange
    const repositorioFalso = {
      findActivos: jest.fn().mockRejectedValue(new Error('Error de conexión')),
    };
    const casoUso = new ListarProductosPublicosUseCase(repositorioFalso);

    // Act & Assert
    await expect(casoUso.execute()).rejects.toThrow('Error de conexión');
  });
});

describe('CU-001 Visualizar catálogo (ObtenerProductoPublicoUseCase)', () => {
  it('devuelve el producto activo con su ficha técnica', async () => {
    // Arrange
    const repositorio = crearRepositorioConProductos([PRODUCTO_ACTIVO]);
    const casoUso = new ObtenerProductoPublicoUseCase(repositorio);

    // Act
    const producto = await casoUso.execute({ id: 1 });

    // Assert
    expect(producto.sku).toBe('COC-UTEN-01');
    expect(producto.proveedor).toBe('Mega Plásticos S.A.S.');
    expect(producto.categoria).toBe('Cocina');
    expect(producto.garantia).toBe('6 meses');
  });

  it('lanza 404 si el producto no existe', async () => {
    // Arrange
    const repositorio = crearRepositorioConProductos([PRODUCTO_ACTIVO]);
    const casoUso = new ObtenerProductoPublicoUseCase(repositorio);

    // Act & Assert
    await expect(casoUso.execute({ id: 999 })).rejects.toMatchObject({ status: 404 });
  });

  it('lanza 404 si el producto no está activo', async () => {
    // Arrange
    const repositorio = crearRepositorioConProductos([
      { ...PRODUCTO_ACTIVO, estado: 0 },
    ]);
    const casoUso = new ObtenerProductoPublicoUseCase(repositorio);

    // Act & Assert
    await expect(casoUso.execute({ id: 1 })).rejects.toMatchObject({ status: 404 });
  });

  it('devuelve garantia null cuando no hay ficha técnica', async () => {
    // Arrange
    const productoIncompleto = {
      ...PRODUCTO_ACTIVO,
      garantia: null,
      proveedor: null,
    };
    const repositorio = crearRepositorioConProductos([productoIncompleto]);
    const casoUso = new ObtenerProductoPublicoUseCase(repositorio);

    // Act
    const producto = await casoUso.execute({ id: 1 });

    // Assert
    expect(producto.garantia).toBeNull();
    expect(producto.proveedor).toBeNull();
  });
});

describe('CU-001 Visualizar catálogo (ListarCategoriasUseCase)', () => {
  it('devuelve solo las categorías activas', async () => {
    // Arrange
    const repositorio = crearRepositorioConCategorias([
      { id_categoria: 1, nombre: 'Cocina', descripcion: 'Artículos de cocina', estado: 1 },
      { id_categoria: 2, nombre: 'Hogar', descripcion: 'Decoración', estado: 0 },
    ]);
    const casoUso = new ListarCategoriasUseCase(repositorio);

    // Act
    const categorias = await casoUso.execute();

    // Assert
    expect(categorias).toHaveLength(1);
    expect(categorias[0].nombre).toBe('Cocina');
  });
});

describe('CU-001 Visualizar catálogo (filtro por categoría y búsqueda)', () => {
  it('filtra productos por categoría', async () => {
    // Arrange
    const repositorio = crearRepositorioConProductos([
      { ...PRODUCTO_ACTIVO, id_producto: 1, id_categoria: 1, nombre: 'Juego Utensilios Pro' },
      { ...PRODUCTO_ACTIVO, id_producto: 2, id_categoria: 2, nombre: 'Parlante Bluetooth' },
    ]);
    const casoUso = new ListarProductosPorCategoriaUseCase(repositorio);

    // Act
    const productos = await casoUso.execute(1);

    // Assert
    expect(productos).toHaveLength(1);
    expect(productos[0].id_producto).toBe(1);
  });

  it('búsqueda predictiva con autocompletado', async () => {
    // Arrange
    const repositorio = crearRepositorioConProductos([
      { ...PRODUCTO_ACTIVO, id_producto: 1, nombre: 'Juego Utensilios Pro' },
      { ...PRODUCTO_ACTIVO, id_producto: 2, nombre: 'Parlante Bluetooth' },
    ]);
    const casoUso = new BuscarProductosUseCase(repositorio);

    // Act
    const resultado = await casoUso.execute({ termino: 'Juego' });

    // Assert
    expect(resultado.sugerencias).toHaveLength(1);
    expect(resultado.items).toHaveLength(1);
    expect(resultado.items[0].nombre).toBe('Juego Utensilios Pro');
  });

  it('retorna array vacío para categoría sin productos', async () => {
    // Arrange
    const repositorio = crearRepositorioConProductos([
      { ...PRODUCTO_ACTIVO, id_producto: 1, id_categoria: 1 },
    ]);
    const casoUso = new ListarProductosPorCategoriaUseCase(repositorio);

    // Act
    const productos = await casoUso.execute(999);

    // Assert
    expect(productos).toEqual([]);
  });

  it('filtra por categoría y ordena por menor precio', async () => {
  // Arrange
  const repositorio = crearRepositorioConProductos([
    { ...PRODUCTO_ACTIVO, id_producto: 1, nombre: 'Café Suave', id_categoria: 1, precio: 10000, estado: 1 },
    { ...PRODUCTO_ACTIVO, id_producto: 2, nombre: 'Café Fuerte', id_categoria: 1, precio: 5000, estado: 1 },
    { ...PRODUCTO_ACTIVO, id_producto: 3, nombre: 'Café Tostado', id_categoria: 1, precio: 8000, estado: 1 },
    { ...PRODUCTO_ACTIVO, id_producto: 4, nombre: 'Té Verde', id_categoria: 2, precio: 15000, estado: 1 },
  ]);
  const casoUso = new BuscarProductosUseCase(repositorio);

  // Act
  const resultado = await casoUso.execute({
    termino: 'Café',
    filtros: { categoria: 1, orden: 'precio_asc' },
  });

  // Assert
  expect(resultado.items).toHaveLength(3);
  expect(resultado.items[0].id_producto).toBe(2); // 5000
  expect(resultado.items[1].id_producto).toBe(3); // 8000
  expect(resultado.items[2].id_producto).toBe(1); // 10000
});

it('filtros sin resultados devuelve array vacío y total 0', async () => {
  // Arrange
  const repositorio = crearRepositorioConProductos([
    { ...PRODUCTO_ACTIVO, id_producto: 1, nombre: 'Juego Utensilios Pro', id_categoria: 1, precio: 250000, estado: 1 },
    { ...PRODUCTO_ACTIVO, id_producto: 2, nombre: 'Parlante Bluetooth', id_categoria: 2, precio: 100000, estado: 1 },
  ]);
  const casoUso = new BuscarProductosUseCase(repositorio);

  // Act
  const resultado = await casoUso.execute({
    termino: 'Juego',
    filtros: { categoria: 2, precioMin: 300000, precioMax: 400000 },
  });

  // Assert
  expect(resultado.items).toEqual([]);
  expect(resultado.total).toBe(0);
  });

  it('excluye productos inactivos de sugerencias y resultados', async () => {
    // Arrange
    const repositorio = crearRepositorioConProductos([
      { ...PRODUCTO_ACTIVO, id_producto: 1, nombre: 'Juego Utensilios Pro', estado: 1 },
      { ...PRODUCTO_ACTIVO, id_producto: 2, nombre: 'Juego de té', estado: 0 },
    ]);
    const casoUso = new BuscarProductosUseCase(repositorio);

    // Act
    const resultado = await casoUso.execute({ termino: 'Juego' });

    // Assert
    expect(resultado.sugerencias).toHaveLength(1);
    expect(resultado.items).toHaveLength(1);
    expect(resultado.items[0].id_producto).toBe(1);
  });

  it('búsqueda insensible a mayúsculas y tildes', async () => {
    // Arrange
    const repositorio = crearRepositorioConProductos([
      { ...PRODUCTO_ACTIVO, id_producto: 1, nombre: 'Café' },
    ]);
    const casoUso = new BuscarProductosUseCase(repositorio);

    // Act
    const resultado = await casoUso.execute({ termino: 'cafe' });

    // Assert
    expect(resultado.items).toHaveLength(1);
    expect(resultado.items[0].nombre).toBe('Café');
  });

  it('rechaza búsqueda con menos de 3 caracteres', async () => {
    // Arrange
    const repositorio = crearRepositorioConProductos([PRODUCTO_ACTIVO]);
    const casoUso = new BuscarProductosUseCase(repositorio);

    // Act & Assert
    await expect(casoUso.execute({ termino: 'ab' })).rejects.toThrow(
      'Por favor, ingresa al menos 3 caracteres para buscar'
    );
  });
});