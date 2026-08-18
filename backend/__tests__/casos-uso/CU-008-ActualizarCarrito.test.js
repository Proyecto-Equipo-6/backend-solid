const ActualizarCarritoUseCase = require('../../application/ActualizarCarritoUseCase');
const InMemoryCarritoRepository = require('../../infraestructure/repositories/in-memory/InMemoryCarritoRepository');
const InMemoryProductoRepository = require('../../infraestructure/repositories/in-memory/InMemoryProductoRepository');

describe('CU-008 Actualizar producto añadido al carrito (ActualizarCarritoUseCase)', () => {
  const CLIENTE = { id_usuario: 2, id_rol: 2, email: 'juan@email.com' };

  const PRODUCTO_CARRITO = {
    id: 1,
    titulo: 'Juego Utensilios Pro',
    imagen: null,
    precio: 250000,
    stock: 100,
    garantia: '6 meses',
  };

  const PRODUCTO_BD = { id_producto: 1, nombre: 'Juego Utensilios Pro', precio: 250000, stock: 100 };

  function crearRepositorios(cantidadEnCarrito = 1) {
    const carritoRepository = new InMemoryCarritoRepository();
    if (cantidadEnCarrito > 0) {
      carritoRepository.agregarProducto(CLIENTE.id_usuario, PRODUCTO_CARRITO, cantidadEnCarrito);
    }
    const productoRepository = new InMemoryProductoRepository();
    productoRepository.productos.push(PRODUCTO_BD);
    return { carritoRepository, productoRepository };
  }

  it('actualiza la cantidad de un producto del carrito (CU-008, RN-027)', async () => {
    const { carritoRepository, productoRepository } = crearRepositorios(1);
    const casoUso = new ActualizarCarritoUseCase(carritoRepository, productoRepository);

    const resultado = await casoUso.execute(CLIENTE, 1, { cantidad: 3 });

    expect(resultado.mensaje).toBe('Cantidad actualizada');
    expect(resultado.carrito.items[0].cantidad).toBe(3);
    expect(resultado.carrito.total).toBe(750000);
    expect(resultado.carrito.vacio).toBe(false);
  });

  it('rechaza cantidad 0 y sugiere eliminar el producto (RN-026)', async () => {
    const { carritoRepository, productoRepository } = crearRepositorios(1);
    const casoUso = new ActualizarCarritoUseCase(carritoRepository, productoRepository);

    const error = await casoUso.execute(CLIENTE, 1, { cantidad: 0 }).catch((e) => e);

    expect(error.status).toBe(400);
    expect(error.message).toContain('La cantidad mínima es 1');
  });

  it('rechaza cantidades negativas o decimales (RN-029)', async () => {
    const { carritoRepository, productoRepository } = crearRepositorios(1);
    const casoUso = new ActualizarCarritoUseCase(carritoRepository, productoRepository);

    for (const cantidad of [-2, 2.5]) {
      const error = await casoUso.execute(CLIENTE, 1, { cantidad }).catch((e) => e);
      expect(error.status).toBe(400);
      expect(error.message).toBe('La cantidad debe ser un entero mayor o igual a 1');
    }
  });

  it('rechaza actualizar un producto inexistente', async () => {
    const { carritoRepository, productoRepository } = crearRepositorios(1);
    const casoUso = new ActualizarCarritoUseCase(carritoRepository, productoRepository);

    const error = await casoUso.execute(CLIENTE, 999, { cantidad: 2 }).catch((e) => e);

    expect(error.status).toBe(404);
    expect(error.message).toBe('Producto no encontrado');
  });

  it('rechaza cantidad mayor al stock disponible (RN-027)', async () => {
    const { carritoRepository, productoRepository } = crearRepositorios(1);
    const casoUso = new ActualizarCarritoUseCase(carritoRepository, productoRepository);

    const error = await casoUso.execute(CLIENTE, 1, { cantidad: 101 }).catch((e) => e);

    expect(error.status).toBe(409);
    expect(error.message).toBe('No hay unidades suficientes');
  });

  it('rechaza actualizar un producto que no está en el carrito del cliente', async () => {
    const { carritoRepository, productoRepository } = crearRepositorios(1);
    productoRepository.productos.push({ id_producto: 2, nombre: 'Otro', precio: 50000, stock: 10 });
    const casoUso = new ActualizarCarritoUseCase(carritoRepository, productoRepository);

    const error = await casoUso.execute(CLIENTE, 2, { cantidad: 2 }).catch((e) => e);

    expect(error.status).toBe(404);
    expect(error.message).toBe('El producto no se encuentra en tu carrito');
  });

  it('solo afecta el carrito del cliente autenticado (RN-028)', async () => {
    const { carritoRepository, productoRepository } = crearRepositorios(0);
    carritoRepository.agregarProducto(99, PRODUCTO_CARRITO, 1);
    const casoUso = new ActualizarCarritoUseCase(carritoRepository, productoRepository);

    const resultado = await casoUso.execute({ id_usuario: 99 }, 1, { cantidad: 4 });
    expect(resultado.carrito.items[0].cantidad).toBe(4);

    const carritoCliente = await carritoRepository.obtenerCarrito(CLIENTE.id_usuario);
    expect(carritoCliente.items).toHaveLength(0);
  });
});