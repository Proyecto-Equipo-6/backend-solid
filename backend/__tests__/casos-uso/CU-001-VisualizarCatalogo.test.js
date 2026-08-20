const ListarProductosPublicosUseCase = require('../../application/ListarProductosPublicosUseCase');
const ObtenerProductoPublicoUseCase = require('../../application/ObtenerProductoPublicoUseCase');
const ListarCategoriasUseCase = require('../../application/ListarCategoriasUseCase');
const ListarProductosPorCategoriaUseCase = require('../../application/ListarProductosPorCategoriaUseCase');
const BuscarProductosUseCase = require('../../application/BuscarProductosUseCase');
const InMemoryProductoRepository = require('../../infraestructure/repositories/in-memory/InMemoryProductoRepository');
const InMemoryCategoriaRepository = require('../../infraestructure/repositories/in-memory/InMemoryCategoriaRepository');

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

describe('CU-001 Visualizar catálogo (ListarProductosPublicosUseCase)', () => {
  it('devuelve solo los productos activos (RN-001) en orden de registro', async () => {
    const repositorio = crearRepositorioConProductos([
      PRODUCTO_ACTIVO,
      { ...PRODUCTO_ACTIVO, id_producto: 2, sku: 'ELE-PARL-03', estado: 1 },
      { ...PRODUCTO_ACTIVO, id_producto: 3, sku: 'HOG-MASA-02', estado: 0 },
    ]);
    const casoUso = new ListarProductosPublicosUseCase(repositorio);

    const resultado = await casoUso.execute();
    const productos = resultado.items;

    expect(productos).toHaveLength(2);
    expect(productos.map((p) => p.id_producto)).toEqual([1, 2]);
    expect(productos[0].categoria).toBe('Cocina');
    expect(productos[0].proveedor).toBe('Mega Plásticos S.A.S.');
    expect(resultado.total).toBe(2);
    expect(resultado.pagina).toBe(1);
    expect(resultado.totalPaginas).toBe(1);
  });

  it('devuelve lista vacía si no hay productos activos', async () => {
    const repositorio = crearRepositorioConProductos([
      { ...PRODUCTO_ACTIVO, id_producto: 1, estado: 0 },
    ]);
    const casoUso = new ListarProductosPublicosUseCase(repositorio);

    const resultado = await casoUso.execute();

    expect(resultado.items).toEqual([]);
    expect(resultado.total).toBe(0);
  });

  it('aplica paginación server-side con límite por defecto de 12 (RN-011)', async () => {
    const repositorio = crearRepositorioConProductos(
      Array.from({ length: 15 }, (_, i) => ({
        ...PRODUCTO_ACTIVO,
        id_producto: i + 1,
        sku: `SKU-${i + 1}`,
      }))
    );
    const casoUso = new ListarProductosPublicosUseCase(repositorio);

    const pagina1 = await casoUso.execute({ pagina: 1 });
    expect(pagina1.items).toHaveLength(12);
    expect(pagina1.total).toBe(15);
    expect(pagina1.totalPaginas).toBe(2);

    const pagina2 = await casoUso.execute({ pagina: 2 });
    expect(pagina2.items).toHaveLength(3);
  });
});

describe('CU-001 Visualizar catálogo (ObtenerProductoPublicoUseCase)', () => {
  it('devuelve el producto activo con su ficha técnica', async () => {
    const repositorio = crearRepositorioConProductos([PRODUCTO_ACTIVO]);
    const casoUso = new ObtenerProductoPublicoUseCase(repositorio);

    const producto = await casoUso.execute({ id: 1 });

    expect(producto.sku).toBe('COC-UTEN-01');
    expect(producto.proveedor).toBe('Mega Plásticos S.A.S.');
  });

  it('lanza 404 si el producto no existe', async () => {
    const repositorio = crearRepositorioConProductos([PRODUCTO_ACTIVO]);
    const casoUso = new ObtenerProductoPublicoUseCase(repositorio);

    const error = await casoUso.execute({ id: 999 }).catch((e) => e);

    expect(error.status).toBe(404);
  });

  it('lanza 404 si el producto no está activo', async () => {
    const repositorio = crearRepositorioConProductos([
      { ...PRODUCTO_ACTIVO, estado: 0 },
    ]);
    const casoUso = new ObtenerProductoPublicoUseCase(repositorio);

    const error = await casoUso.execute({ id: 1 }).catch((e) => e);

    expect(error.status).toBe(404);
  });
});

describe('CU-001 Visualizar catálogo (ListarCategoriasUseCase)', () => {
  it('devuelve solo las categorías activas', async () => {
    const repositorio = new InMemoryCategoriaRepository();
    repositorio.categorias.push(
      { id_categoria: 1, nombre: 'Cocina', descripcion: 'Artículos de cocina', estado: 1 },
      { id_categoria: 2, nombre: 'Hogar', descripcion: 'Decoración', estado: 0 }
    );
    const casoUso = new ListarCategoriasUseCase(repositorio);

    const categorias = await casoUso.execute();

    expect(categorias).toHaveLength(1);
    expect(categorias[0].nombre).toBe('Cocina');
  });
});

describe('CU-001 Visualizar catálogo (filtro por categoría y búsqueda)', () => {
  test('CP-CU-001-02: filtra productos por categoría', async () => {
    const repositorio = new InMemoryProductoRepository();
    repositorio.productos.push(
      { ...PRODUCTO_ACTIVO, id_producto: 1, id_categoria: 1, nombre: 'Juego Utensilios Pro' },
      { ...PRODUCTO_ACTIVO, id_producto: 2, id_categoria: 2, nombre: 'Parlante Bluetooth' },
    );

    const casoUso = new ListarProductosPorCategoriaUseCase(repositorio);
    const productos = await casoUso.execute(1);

    expect(productos).toHaveLength(1);
    expect(productos[0].id_producto).toBe(1);
  });

  test('CP-CU-001-03: búsqueda predictiva con autocompletado', async () => {
    const repositorio = new InMemoryProductoRepository();
    repositorio.productos.push(
      { ...PRODUCTO_ACTIVO, id_producto: 1, nombre: 'Juego Utensilios Pro' },
      { ...PRODUCTO_ACTIVO, id_producto: 2, nombre: 'Parlante Bluetooth' },
    );

    const casoUso = new BuscarProductosUseCase(repositorio);
    const resultado = await casoUso.execute({ termino: 'Juego' });

    expect(resultado.sugerencias).toHaveLength(1);
    expect(resultado.items).toHaveLength(1);
    expect(resultado.items[0].nombre).toBe('Juego Utensilios Pro');
  });
});