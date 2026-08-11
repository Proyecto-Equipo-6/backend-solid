const ListarProductosPublicosUseCase = require('../application/ListarProductosPublicosUseCase');
const ObtenerProductoPublicoUseCase = require('../application/ObtenerProductoPublicoUseCase');
const ListarCategoriasUseCase = require('../application/ListarCategoriasUseCase');
const InMemoryProductoRepository = require('../infraestructure/repositories/in-memory/InMemoryProductoRepository');
const InMemoryCategoriaRepository = require('../infraestructure/repositories/in-memory/InMemoryCategoriaRepository');

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

describe('ListarProductosPublicosUseCase', () => {
  it('devuelve solo los productos activos (RN-001) en orden de registro', async () => {
    const repositorio = crearRepositorioConProductos([
      PRODUCTO_ACTIVO,
      { ...PRODUCTO_ACTIVO, id_producto: 2, sku: 'ELE-PARL-03', estado: 1 },
      { ...PRODUCTO_ACTIVO, id_producto: 3, sku: 'HOG-MASA-02', estado: 0 },
    ]);
    const casoUso = new ListarProductosPublicosUseCase(repositorio);

    const productos = await casoUso.execute();

    expect(productos).toHaveLength(2);
    expect(productos.map((p) => p.id_producto)).toEqual([1, 2]);
    expect(productos[0].categoria).toBe('Cocina');
    expect(productos[0].proveedor).toBe('Mega Plásticos S.A.S.');
  });

  it('devuelve lista vacía si no hay productos activos', async () => {
    const repositorio = crearRepositorioConProductos([
      { ...PRODUCTO_ACTIVO, id_producto: 1, estado: 0 },
    ]);
    const casoUso = new ListarProductosPublicosUseCase(repositorio);

    const productos = await casoUso.execute();

    expect(productos).toEqual([]);
  });
});

describe('ObtenerProductoPublicoUseCase', () => {
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

describe('ListarCategoriasUseCase', () => {
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
