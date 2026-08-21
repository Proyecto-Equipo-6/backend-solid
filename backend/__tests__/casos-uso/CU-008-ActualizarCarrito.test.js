import ActualizarCarritoUseCase from '../../application/ActualizarCarritoUseCase';
import InMemoryCarritoRepository from '../../infraestructure/repositories/in-memory/InMemoryCarritoRepository';
import InMemoryProductoRepository from '../../infraestructure/repositories/in-memory/InMemoryProductoRepository';

const CLIENTE = { id_usuario: 2, id_rol: 2, email: 'juan@email.com' };

const PRODUCTO_CARRITO = {
  id: 1,
  titulo: 'Juego Utensilios Pro',
  imagen: null,
  precio: 250000,
  stock: 100,
  garantia: '6 meses',
};

const PRODUCTO_BD = {
  id_producto: 1,
  nombre: 'Juego Utensilios Pro',
  precio: 250000,
  stock: 100,
};

function crearRepositorios(cantidadEnCarrito = 1) {
  const carritoRepository = new InMemoryCarritoRepository();
  if (cantidadEnCarrito > 0) {
    carritoRepository.agregarProducto(CLIENTE.id_usuario, PRODUCTO_CARRITO, cantidadEnCarrito);
  }
  const productoRepository = new InMemoryProductoRepository();
  productoRepository.productos.push(PRODUCTO_BD);
  return { carritoRepository, productoRepository };
}

function crearCasoUso(carritoRepository, productoRepository) {
  return new ActualizarCarritoUseCase(carritoRepository, productoRepository);
}

describe('CU-008 Actualizar producto añadido al carrito (ActualizarCarritoUseCase)', () => {
  it('CP-CU-008-01 / CP-RF-004.3-01 / CP-HU-004.3-01: actualiza cantidad y recalcula total', async () => {
    // Arrange
    const { carritoRepository, productoRepository } = crearRepositorios(1);
    const casoUso = crearCasoUso(carritoRepository, productoRepository);

    // Act
    const resultado = await casoUso.execute(CLIENTE, 1, { cantidad: 3 });

    // Assert
    expect(resultado.mensaje).toBe('Cantidad actualizada');
    expect(resultado.carrito.items[0].cantidad).toBe(3);
    expect(resultado.carrito.total).toBe(750000);
    expect(resultado.carrito.vacio).toBe(false);
  });

  it('CP-CU-008-03: rechaza cantidad 0 y sugiere eliminar', async () => {
    // Arrange
    const { carritoRepository, productoRepository } = crearRepositorios(1);
    const casoUso = crearCasoUso(carritoRepository, productoRepository);

    // Act & Assert
    await expect(
      casoUso.execute(CLIENTE, 1, { cantidad: 0 })
    ).rejects.toMatchObject({ status: 400 });
    await expect(
      casoUso.execute(CLIENTE, 1, { cantidad: 0 })
    ).rejects.toThrow(/La cantidad mínima es 1/);
  });

  it('CP-CU-008-03 / CP-HU-004.3-03: rechaza negativos y decimales', async () => {
    // Arrange
    const { carritoRepository, productoRepository } = crearRepositorios(1);
    const casoUso = crearCasoUso(carritoRepository, productoRepository);

    // Act & Assert
    for (const cantidad of [-2, 2.5]) {
      await expect(
        casoUso.execute(CLIENTE, 1, { cantidad })
      ).rejects.toMatchObject({ status: 400 });
      await expect(
        casoUso.execute(CLIENTE, 1, { cantidad })
      ).rejects.toThrow('La cantidad debe ser un entero mayor o igual a 1');
    }
  });

  it('rechaza producto inexistente', async () => {
    // Arrange
    const { carritoRepository, productoRepository } = crearRepositorios(1);
    const casoUso = crearCasoUso(carritoRepository, productoRepository);

    // Act & Assert
    await expect(
      casoUso.execute(CLIENTE, 999, { cantidad: 2 })
    ).rejects.toMatchObject({ status: 404 });
    await expect(
      casoUso.execute(CLIENTE, 999, { cantidad: 2 })
    ).rejects.toThrow('Producto no encontrado');
  });

  it('CP-CU-008-02 / CP-RF-004.3-02: rechaza cantidad mayor al stock', async () => {
    // Arrange
    const { carritoRepository, productoRepository } = crearRepositorios(1);
    const casoUso = crearCasoUso(carritoRepository, productoRepository);

    // Act & Assert
    await expect(
      casoUso.execute(CLIENTE, 1, { cantidad: 101 })
    ).rejects.toMatchObject({ status: 409 });
    await expect(
      casoUso.execute(CLIENTE, 1, { cantidad: 101 })
    ).rejects.toThrow('No hay unidades suficientes');
  });

  it('rechaza producto que no está en el carrito del cliente', async () => {
    // Arrange
    const { carritoRepository, productoRepository } = crearRepositorios(1);
    productoRepository.productos.push({ id_producto: 2, nombre: 'Otro', precio: 50000, stock: 10 });
    const casoUso = crearCasoUso(carritoRepository, productoRepository);

    // Act & Assert
    await expect(
      casoUso.execute(CLIENTE, 2, { cantidad: 2 })
    ).rejects.toMatchObject({ status: 404 });
    await expect(
      casoUso.execute(CLIENTE, 2, { cantidad: 2 })
    ).rejects.toThrow('El producto no se encuentra en tu carrito');
  });

  it('solo afecta el carrito del cliente autenticado', async () => {
    // Arrange
    const { carritoRepository, productoRepository } = crearRepositorios(0);
    carritoRepository.agregarProducto(99, PRODUCTO_CARRITO, 1);
    const casoUso = crearCasoUso(carritoRepository, productoRepository);

    // Act
    const resultado = await casoUso.execute({ id_usuario: 99 }, 1, { cantidad: 4 });

    // Assert
    expect(resultado.carrito.items[0].cantidad).toBe(4);

    const carritoCliente = await carritoRepository.obtenerCarrito(CLIENTE.id_usuario);
    expect(carritoCliente.items).toHaveLength(0);
  });

  it('CP-CU-008-05: maneja error de conexión al actualizar', async () => {
    // Arrange
    const { productoRepository } = crearRepositorios(1);
    const carritoFalso = {
      obtenerCantidad: jest.fn().mockResolvedValue(1),
      actualizarCantidad: jest.fn().mockRejectedValue(new Error('Error de conexión')),
    };
    const casoUso = crearCasoUso(carritoFalso, productoRepository);

    // Act & Assert
    await expect(
      casoUso.execute(CLIENTE, 1, { cantidad: 2 })
    ).rejects.toThrow('Error de conexión');
  });
});