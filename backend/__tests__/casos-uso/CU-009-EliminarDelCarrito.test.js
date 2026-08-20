const EliminarDelCarritoUseCase = require('../../application/EliminarDelCarritoUseCase');
const InMemoryCarritoRepository = require('../../infraestructure/repositories/in-memory/InMemoryCarritoRepository');

describe('CU-009 Eliminar producto del carrito (EliminarDelCarritoUseCase)', () => {
  const CLIENTE = { id_usuario: 2, id_rol: 2, email: 'juan@email.com' };

  const PRODUCTO = {
    id: 1,
    titulo: 'Juego Utensilios Pro',
    imagen: null,
    precio: 250000,
    stock: 100,
    garantia: '6 meses',
  };

  function crearRepositorioConProducto(cantidad = 1) {
    const carritoRepository = new InMemoryCarritoRepository();
    if (cantidad > 0) {
      carritoRepository.agregarProducto(CLIENTE.id_usuario, PRODUCTO, cantidad);
    }
    return carritoRepository;
  }

  it('CP-CU-009-01: elimina un producto del carrito exitosamente (RN-031, RN-032)', async () => {
    const carritoRepository = crearRepositorioConProducto(2);
    const casoUso = new EliminarDelCarritoUseCase(carritoRepository);

    const resultado = await casoUso.execute(CLIENTE, 1);

    expect(resultado.mensaje).toBe('Producto eliminado correctamente');
    expect(resultado.carrito.items).toHaveLength(0);
    expect(resultado.carrito.total).toBe(0);
    expect(resultado.carrito.vacio).toBe(true);
  });

  it('CP-CU-009-02: eliminar el último producto muestra carrito vacío (FA-001)', async () => {
    const carritoRepository = crearRepositorioConProducto(1);
    const casoUso = new EliminarDelCarritoUseCase(carritoRepository);

    const resultado = await casoUso.execute(CLIENTE, 1);

    expect(resultado.carrito.vacio).toBe(true);
    expect(resultado.carrito.items).toEqual([]);
  });

  it('CP-CU-009-03: rechaza eliminar un producto que no está en el carrito (FE-002, RN-032)', async () => {
    const carritoRepository = crearRepositorioConProducto(1);
    const casoUso = new EliminarDelCarritoUseCase(carritoRepository);

    const error = await casoUso.execute(CLIENTE, 999).catch((e) => e);

    expect(error.status).toBe(404);
    expect(error.message).toBe('El producto no se encuentra en tu carrito');
  });

  it('CP-CU-009-04: rechaza eliminar sin indicar producto', async () => {
    const carritoRepository = crearRepositorioConProducto(1);
    const casoUso = new EliminarDelCarritoUseCase(carritoRepository);

    const error = await casoUso.execute(CLIENTE, null).catch((e) => e);

    expect(error.status).toBe(400);
    expect(error.message).toBe('Debes indicar el producto');
  });

  it('CP-CU-009-05: solo afecta el carrito del cliente autenticado (RN-031)', async () => {
    const carritoRepository = crearRepositorioConProducto(1);
    carritoRepository.agregarProducto(99, PRODUCTO, 1);
    const casoUso = new EliminarDelCarritoUseCase(carritoRepository);

    await casoUso.execute(CLIENTE, 1);

    const carritoOtro = await carritoRepository.obtenerCarrito(99);
    expect(carritoOtro.items).toHaveLength(1);
  });
});