import AgregarAlCarritoUseCase from '../../application/AgregarAlCarritoUseCase';
import InMemoryCarritoRepository from '../../infraestructure/repositories/in-memory/InMemoryCarritoRepository';
import InMemoryProductoRepository from '../../infraestructure/repositories/in-memory/InMemoryProductoRepository';

const CLIENTE = { id_usuario: 2, id_rol: 2, email: 'juan@email.com' };

const PRODUCTO_BD = {
  id_producto: 1,
  nombre: 'Juego Utensilios Pro',
  precio: 250000,
  stock: 10,
  garantia: '6 meses',
};

function crearRepositorios(stock = 10) {
  const carritoRepository = new InMemoryCarritoRepository();
  const productoRepository = new InMemoryProductoRepository();
  productoRepository.productos.push({ ...PRODUCTO_BD, stock });
  return { carritoRepository, productoRepository };
}

function crearCasoUso(carritoRepo, productoRepo) {
  return new AgregarAlCarritoUseCase(carritoRepo, productoRepo);
}

describe('CU-010 Agregar producto al carrito (AgregarAlCarritoUseCase)', () => {
  it('CP-CU-010-01 / CP-HU-004.2-01: agrega un producto al carrito exitosamente', async () => {
    // Arrange
    const { carritoRepository, productoRepository } = crearRepositorios();
    const casoUso = crearCasoUso(carritoRepository, productoRepository);

    // Act
    const resultado = await casoUso.execute(CLIENTE, { productoId: 1, cantidad: 2 });

    // Assert
    expect(resultado.mensaje).toBe('Producto añadido');
    expect(resultado.carrito.items).toHaveLength(1);
    expect(resultado.carrito.items[0].cantidad).toBe(2);
    expect(resultado.carrito.total).toBe(500000);
  });

  it('CP-CU-010-02 / CP-RF-004.2-02 / CP-HU-004.2-03: rechaza stock insuficiente', async () => {
    // Arrange
    const { carritoRepository, productoRepository } = crearRepositorios(5);
    const casoUso = crearCasoUso(carritoRepository, productoRepository);

    // Act & Assert
    await expect(
      casoUso.execute(CLIENTE, { productoId: 1, cantidad: 6 })
    ).rejects.toMatchObject({ status: 409 });
    await expect(
      casoUso.execute(CLIENTE, { productoId: 1, cantidad: 6 })
    ).rejects.toThrow('No hay unidades suficientes');
  });

  it('CP-CU-010-03 / CP-RF-004.2-01 / CP-HU-004.2-02: no duplica producto, incrementa cantidad', async () => {
    // Arrange
    const { carritoRepository, productoRepository } = crearRepositorios();
    const casoUso = crearCasoUso(carritoRepository, productoRepository);
    await casoUso.execute(CLIENTE, { productoId: 1, cantidad: 2 });

    // Act
    const resultado = await casoUso.execute(CLIENTE, { productoId: 1, cantidad: 3 });

    // Assert
    expect(resultado.mensaje).toBe('Producto actualizado en tu carrito');
    expect(resultado.carrito.items).toHaveLength(1);
    expect(resultado.carrito.items[0].cantidad).toBe(5);
  });

  it('rechaza cantidad inválida (negativa, decimal o cero)', async () => {
    // Arrange
    const { carritoRepository, productoRepository } = crearRepositorios();
    const casoUso = crearCasoUso(carritoRepository, productoRepository);

    // Act & Assert
    for (const cantidad of [0, -2, 2.5]) {
      await expect(
        casoUso.execute(CLIENTE, { productoId: 1, cantidad })
      ).rejects.toMatchObject({ status: 400 });
      await expect(
        casoUso.execute(CLIENTE, { productoId: 1, cantidad })
      ).rejects.toThrow('La cantidad debe ser un entero mayor o igual a 1');
    }
  });

  it('rechaza producto inexistente', async () => {
    // Arrange
    const { carritoRepository, productoRepository } = crearRepositorios();
    const casoUso = crearCasoUso(carritoRepository, productoRepository);

    // Act & Assert
    await expect(
      casoUso.execute(CLIENTE, { productoId: 999, cantidad: 1 })
    ).rejects.toMatchObject({ status: 404 });
    await expect(
      casoUso.execute(CLIENTE, { productoId: 999, cantidad: 1 })
    ).rejects.toThrow('Producto no encontrado');
  });

  it('CP-CU-010-04: maneja error de conexión al agregar', async () => {
    // Arrange
    const carritoRepositoryFalso = {
    obtenerCantidad: jest.fn().mockResolvedValue(0),
    agregarProducto: jest.fn().mockRejectedValue(new Error('Error de conexión')),
    };
    const productoRepository = new InMemoryProductoRepository();
    productoRepository.productos.push(PRODUCTO_BD);
    const casoUso = new AgregarAlCarritoUseCase(carritoRepositoryFalso, productoRepository);

    // Act & Assert
    await expect(
      casoUso.execute(CLIENTE, { productoId: 1, cantidad: 1 })
    ).rejects.toThrow('Error de conexión');
  });

  it('CP-CU-010-05: rechaza usuario sin sesión', async () => {
    // Arrange
    const { carritoRepository, productoRepository } = crearRepositorios();
    const casoUso = crearCasoUso(carritoRepository, productoRepository);

    // Act & Assert
    await expect(
      casoUso.execute(null, { productoId: 1, cantidad: 1 })
    ).rejects.toMatchObject({ status: 400 });
    await expect(
      casoUso.execute(null, { productoId: 1, cantidad: 1 })
    ).rejects.toThrow(/iniciar sesión/i);
  });

  it('CP-CU-010-06: el carrito persiste entre instancias del caso de uso', async () => {
    // Arrange
    const { carritoRepository, productoRepository } = crearRepositorios();
    const casoUso = crearCasoUso(carritoRepository, productoRepository);
    await casoUso.execute(CLIENTE, { productoId: 1, cantidad: 1 });

    // Act
    const segundaInstancia = crearCasoUso(carritoRepository, productoRepository);
    const resultado = await segundaInstancia.execute(CLIENTE, { productoId: 1, cantidad: 1 });

    // Assert
    expect(resultado.carrito.items).toHaveLength(1);
    expect(resultado.carrito.items[0].cantidad).toBe(2);
  });
});