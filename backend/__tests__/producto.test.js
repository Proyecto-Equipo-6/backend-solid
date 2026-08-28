import InMemoryProductoRepository from '../infraestructure/repositories/in-memory/InMemoryProductoRepository.js';
import InMemoryCategoriaRepository from '../infraestructure/repositories/in-memory/InMemoryCategoriaRepository.js';
import InMemoryProveedorRepository from '../infraestructure/repositories/in-memory/InMemoryProveedorRepository.js';
import CrearCategoriaUseCase from '../application/crearCategoriaUseCase.js';
import CrearProductoUseCase from '../application/crearProductoUseCase.js';
import EditarProductoUseCase from '../application/editarProductoUseCase.js';
import EliminarProductoUseCase from '../application/eliminarProductoUseCase.js';
import AjustarStockProductoUseCase from '../application/ajustarStockProductoUseCase.js';

// Helpers

async function crearCategoria(repoCategoria, nombre = 'Aseo') {
  const useCase = new CrearCategoriaUseCase(repoCategoria);
  return await useCase.ejecutar({ nombre, descripcion: 'Productos de limpieza' });
}

function crearProveedor(repoProveedor, id = 1, nombre = 'Proveedor Test') {
  repoProveedor.proveedores.push({
    id_proveedor: id,
    nit_proveedor: '900123456-7',
    razon_social: nombre,
    telefono: '6012345678',
    email: 'proveedor@test.com',
    estado: 1,
    fecha_creacion: new Date().toISOString()
  });
}

describe('Módulo CRUD productos - Aseo (CU-023)', () => {
  test('CP-CU-023-01: Crear producto feliz con SKU único, categoría y proveedor existentes, sin imagen por defecto', async () => {
    const repoProductos = new InMemoryProductoRepository();
    const repoCategorias = new InMemoryCategoriaRepository();
    const repoProveedores = new InMemoryProveedorRepository();

    const categoria = await crearCategoria(repoCategorias);
    crearProveedor(repoProveedores, 1, 'Proveedor Test');

    const useCase = new CrearProductoUseCase(repoProductos, repoCategorias, repoProveedores);
    const producto = await useCase.ejecutar({
      sku: 'ASE-JAB-01',
      id_categoria: categoria.id_categoria,
      id_proveedor: 1,
      nombre: 'Jabón Líquido',
      descripcion: 'Rinde 5 litros',
      precio: 15000,
      stock: 50
    });

    expect(producto.id_producto).toBe(1);
    expect(producto.sku).toBe('ASE-JAB-01');
    expect(producto.nombre).toBe('Jabón Líquido');
    expect(producto.estado).toBe(1);
    expect(producto.imagen_url).toBe('sin_imagen.jpg');
    expect(producto.fecha_creacion).toBeDefined();
  });

  test('Generar SKU automáticamente (CAT-NOM-N) cuando no se envía SKU', async () => {
    const repoCategorias = new InMemoryCategoriaRepository();
    const repoProveedores = new InMemoryProveedorRepository();
    const repoProductos = new InMemoryProductoRepository(
      Array.from({ length: 5 }, (_, i) => ({
        id_producto: i + 1,
        sku: `PROD-${i + 1}`,
        id_categoria: 1,
        id_proveedor: 1,
        nombre: `Producto ${i + 1}`,
        descripcion: '',
        precio: 10000,
        stock: 10,
        estado: 1
      }))
    );

    const categoria = await crearCategoria(repoCategorias, 'Cocina');
    crearProveedor(repoProveedores, 1, 'Proveedor Test');

    const useCase = new CrearProductoUseCase(repoProductos, repoCategorias, repoProveedores);
    const producto = await useCase.ejecutar({
      id_categoria: categoria.id_categoria,
      id_proveedor: 1,
      nombre: 'Licuadora',
      descripcion: 'Potente',
      precio: 120000,
      stock: 15
    });

    expect(producto.sku).toBe('COC-LICU-6');
  });

  test('Rechazar creación si el SKU ya existe (FA-02)', async () => {
    const repoProductos = new InMemoryProductoRepository();
    const repoCategorias = new InMemoryCategoriaRepository();
    const repoProveedores = new InMemoryProveedorRepository();

    const categoria = await crearCategoria(repoCategorias);
    crearProveedor(repoProveedores, 1, 'Proveedor Test');

    const useCase = new CrearProductoUseCase(repoProductos, repoCategorias, repoProveedores);

    await useCase.ejecutar({
      sku: 'ASE-DET-02',
      id_categoria: categoria.id_categoria,
      id_proveedor: 1,
      nombre: 'Detergente en Polvo',
      descripcion: 'Bolsa 3 kg',
      precio: 25000,
      stock: 30
    });

    await expect(
      useCase.ejecutar({
        sku: 'ASE-DET-02',
        id_categoria: categoria.id_categoria,
        id_proveedor: 1,
        nombre: 'Detergente Líquido',
        descripcion: 'Botella 2 L',
        precio: 20000,
        stock: 20
      })
    ).rejects.toThrow('Ya existe un producto con ese SKU');
  });

  test('Rechazar si el nombre está duplicado', async () => {
    const repoProductos = new InMemoryProductoRepository();
    const repoCategorias = new InMemoryCategoriaRepository();
    const repoProveedores = new InMemoryProveedorRepository();

    const categoria = await crearCategoria(repoCategorias);
    crearProveedor(repoProveedores, 1, 'Proveedor Test');

    const useCase = new CrearProductoUseCase(repoProductos, repoCategorias, repoProveedores);

    await useCase.ejecutar({
      sku: 'ASE-POL-03',
      id_categoria: categoria.id_categoria,
      id_proveedor: 1,
      nombre: 'Detergente en Polvo',
      descripcion: 'Bolsa 3 kg',
      precio: 25000,
      stock: 30
    });

    await expect(
      useCase.ejecutar({
        sku: 'ASE-POL-04',
        id_categoria: categoria.id_categoria,
        id_proveedor: 1,
        nombre: 'Detergente en Polvo',
        descripcion: 'Bolsa 5 kg',
        precio: 40000,
        stock: 15
      })
    ).rejects.toThrow('Ya existe un producto con ese nombre');
  });

  test('Rechazar precio cero o stock negativo', async () => {
    const repoProductos = new InMemoryProductoRepository();
    const repoCategorias = new InMemoryCategoriaRepository();
    const repoProveedores = new InMemoryProveedorRepository();

    const categoria = await crearCategoria(repoCategorias);
    crearProveedor(repoProveedores, 1, 'Proveedor Test');

    const useCase = new CrearProductoUseCase(repoProductos, repoCategorias, repoProveedores);

    await expect(
      useCase.ejecutar({
        sku: 'ASE-VID-05',
        id_categoria: categoria.id_categoria,
        id_proveedor: 1,
        nombre: 'Limpiavidrios',
        descripcion: 'Frasco 500 ml',
        precio: 0,
        stock: 10
      })
    ).rejects.toThrow('El precio debe ser mayor a cero');

    await expect(
      useCase.ejecutar({
        sku: 'ASE-CLO-06',
        id_categoria: categoria.id_categoria,
        id_proveedor: 1,
        nombre: 'Cloro',
        descripcion: 'Galón 1 L',
        precio: 5000,
        stock: -2
      })
    ).rejects.toThrow('El stock no puede ser negativo');
  });

  test('Rechazar si la categoría asociada no existe', async () => {
    const repoProductos = new InMemoryProductoRepository();
    const repoCategorias = new InMemoryCategoriaRepository();
    const repoProveedores = new InMemoryProveedorRepository();

    crearProveedor(repoProveedores, 1, 'Proveedor Test');

    const useCase = new CrearProductoUseCase(repoProductos, repoCategorias, repoProveedores);

    await expect(
      useCase.ejecutar({
        sku: 'ASE-DES-07',
        id_categoria: 999,
        id_proveedor: 1,
        nombre: 'Desinfectante',
        descripcion: 'Aroma floral',
        precio: 12000,
        stock: 40
      })
    ).rejects.toThrow('La categoría asociada no existe');
  });

  test('Rechazar si el proveedor asociado no existe', async () => {
    const repoProductos = new InMemoryProductoRepository();
    const repoCategorias = new InMemoryCategoriaRepository();
    const repoProveedores = new InMemoryProveedorRepository();

    const categoria = await crearCategoria(repoCategorias);

    const useCase = new CrearProductoUseCase(repoProductos, repoCategorias, repoProveedores);

    await expect(
      useCase.ejecutar({
        sku: 'ASE-DES-08',
        id_categoria: categoria.id_categoria,
        id_proveedor: 999,
        nombre: 'Desinfectante',
        descripcion: 'Aroma floral',
        precio: 12000,
        stock: 40
      })
    ).rejects.toThrow('El proveedor asociado no existe');
  });

  test('Editar producto actualiza sus datos y estado', async () => {
    const repoProductos = new InMemoryProductoRepository();
    const repoCategorias = new InMemoryCategoriaRepository();
    const repoProveedores = new InMemoryProveedorRepository();

    const categoria = await crearCategoria(repoCategorias);
    crearProveedor(repoProveedores, 1, 'Proveedor Test');

    const crear = new CrearProductoUseCase(repoProductos, repoCategorias, repoProveedores);
    const editar = new EditarProductoUseCase(repoProductos, repoCategorias, repoProveedores);

    const producto = await crear.ejecutar({
      sku: 'ASE-CEP-09',
      id_categoria: categoria.id_categoria,
      id_proveedor: 1,
      nombre: 'Cepillo de dientes',
      descripcion: 'Suave',
      precio: 5000,
      stock: 100
    });

    const editado = await editar.ejecutar(producto.id_producto, {
      sku: 'ASE-CEP-09',
      id_categoria: categoria.id_categoria,
      id_proveedor: 1,
      nombre: 'Cepillo de dientes Premium',
      descripcion: 'Suave con protector',
      precio: 7000,
      stock: 80,
      estado: 'Inactivo'
    });

    expect(editado.nombre).toBe('Cepillo de dientes Premium');
    expect(editado.estado).toBe(0);
  });

  test('CP-RF-007.2-02: Eliminar producto con historial de ventas lo desactiva y devuelve mensaje informativo', async () => {
  const repoProductos = new InMemoryProductoRepository();
  const repoCategorias = new InMemoryCategoriaRepository();
  const repoProveedores = new InMemoryProveedorRepository();

  const categoria = await crearCategoria(repoCategorias);
  crearProveedor(repoProveedores, 1, 'Proveedor Test');

  const crear = new CrearProductoUseCase(repoProductos, repoCategorias, repoProveedores);
  const producto = await crear.ejecutar({
    sku: 'ASE-ESC-10',
    id_categoria: categoria.id_categoria,
    id_proveedor: 1,
    nombre: 'Escoba',
    descripcion: 'Cerdas suaves',
    precio: 8000,
    stock: 20
  });

  // Simulamos que tiene historial de ventas
  repoProductos.marcarConHistorial(producto.id_producto);

  const eliminar = new EliminarProductoUseCase(repoProductos);
  const resultado = await eliminar.ejecutar(producto.id_producto);

  expect(resultado.mensaje).toBe('El producto registra ventas en el historial; se ha inactivado del catálogo comercial.');

  const productoDesactivado = await repoProductos.findById(producto.id_producto);
  expect(productoDesactivado.estado).toBe(0);
});

  test('CP-HU007.2-03: Ejecutar un ajuste rápido de stock con éxito y verificar auditoría', async () => {
    const repoProductos = new InMemoryProductoRepository([
      {
        id_producto: 1,
        sku: 'ASE-JAB-01',
        id_categoria: 1,
        id_proveedor: 1,
        nombre: 'Jabón Líquido',
        descripcion: 'Rinde 5 litros',
        precio: 15000,
        stock: 50,
        garantia: null,
        imagen_url: null,
        estado: 1,
        fecha_creacion: new Date().toISOString()
      }
    ]);

    const useCase = new AjustarStockProductoUseCase(repoProductos);

    const resultado = await useCase.ejecutar(1, 80, 'Ingreso de mercancía', 1);

    expect(resultado.cantidad_anterior).toBe(50);
    expect(resultado.cantidad_nueva).toBe(80);

    const producto = await repoProductos.findById(1);
    expect(producto.stock).toBe(80);

    expect(repoProductos.historialStock).toHaveLength(1);
    expect(repoProductos.historialStock[0]).toMatchObject({
      id_producto: 1,
      cantidad_anterior: 50,
      cantidad_nueva: 80,
      motivo: 'Ingreso de mercancía'
    });
  });
  test('CP-HU007.2-04: Productos inactivos no se retornan en catálogo público', async () => {
  const repoProductos = new InMemoryProductoRepository([
    {
      id_producto: 1,
      sku: 'ASE-ACT-01',
      id_categoria: 1,
      id_proveedor: 1,
      nombre: 'Producto Activo',
      descripcion: 'Desc',
      precio: 1000,
      stock: 10,
      estado: 1,
      imagen_url: null,
      fecha_creacion: new Date().toISOString()
    },
    {
      id_producto: 2,
      sku: 'ASE-INA-02',
      id_categoria: 1,
      id_proveedor: 1,
      nombre: 'Producto Inactivo',
      descripcion: 'Desc',
      precio: 2000,
      stock: 5,
      estado: 0,
      imagen_url: null,
      fecha_creacion: new Date().toISOString()
    }
  ]);

  const activos = await repoProductos.findActivos();
  expect(activos).toHaveLength(1);
  expect(activos[0].id_producto).toBe(1);
  });

});