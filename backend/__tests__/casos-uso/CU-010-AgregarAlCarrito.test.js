const AgregarAlCarritoUseCase = require('../../application/AgregarAlCarritoUseCase');
const InMemoryCarritoRepository = require('../../infraestructure/repositories/in-memory/InMemoryCarritoRepository');
const InMemoryProductoRepository = require('../../infraestructure/repositories/in-memory/InMemoryProductoRepository');

describe('CU-010 Agregar producto al carrito (AgregarAlCarritoUseCase)', () => {
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

  it('CP-CU-010-01: agrega un producto al carrito exitosamente (RN-033, RN-037)', async () => {
    const { carritoRepository, productoRepository } = crearRepositorios();
    const casoUso = new AgregarAlCarritoUseCase(carritoRepository, productoRepository);

    const resultado = await casoUso.execute(CLIENTE, { productoId: 1, cantidad: 2 });

    expect(resultado.mensaje).toBe('Producto añadido');
    expect(resultado.carrito.items).toHaveLength(1);
    expect(resultado.carrito.items[0].cantidad).toBe(2);
    expect(resultado.carrito.total).toBe(500000);
  });

  it('CP-CU-010-02: notifica stock insuficiente al superar el stock (FA-001, RN-035)', async () => {
    const { carritoRepository, productoRepository } = crearRepositorios(5);
    const casoUso = new AgregarAlCarritoUseCase(carritoRepository, productoRepository);

    const error = await casoUso
      .execute(CLIENTE, { productoId: 1, cantidad: 6 })
      .catch((e) => e);

    expect(error.status).toBe(409);
    expect(error.message).toBe('No hay unidades suficientes');
  });

  it('CP-CU-010-03: no duplica un producto ya existente, incrementa la cantidad (FA-002, RN-036)', async () => {
    const { carritoRepository, productoRepository } = crearRepositorios(10);
    const casoUso = new AgregarAlCarritoUseCase(carritoRepository, productoRepository);

    await casoUso.execute(CLIENTE, { productoId: 1, cantidad: 2 });
    const resultado = await casoUso.execute(CLIENTE, { productoId: 1, cantidad: 3 });

    expect(resultado.mensaje).toBe('Producto actualizado en tu carrito');
    expect(resultado.carrito.items).toHaveLength(1);
    expect(resultado.carrito.items[0].cantidad).toBe(5);
  });

  it('CP-CU-010-04: rechaza cantidad inválida (negativa, decimal o cero)', async () => {
    const { carritoRepository, productoRepository } = crearRepositorios();
    const casoUso = new AgregarAlCarritoUseCase(carritoRepository, productoRepository);

    for (const cantidad of [0, -2, 2.5]) {
      const error = await casoUso
        .execute(CLIENTE, { productoId: 1, cantidad })
        .catch((e) => e);
      expect(error.status).toBe(400);
      expect(error.message).toBe('La cantidad debe ser un entero mayor o igual a 1');
    }
  });

  it('CP-CU-010-05: rechaza producto inexistente (FE-001)', async () => {
    const { carritoRepository, productoRepository } = crearRepositorios();
    const casoUso = new AgregarAlCarritoUseCase(carritoRepository, productoRepository);

    const error = await casoUso
      .execute(CLIENTE, { productoId: 999, cantidad: 1 })
      .catch((e) => e);

    expect(error.status).toBe(404);
    expect(error.message).toBe('Producto no encontrado');
  });

  it('CP-CU-010-06: persiste el carrito entre instancias del caso de uso (RN-034, RN-040)', async () => {
    const { carritoRepository, productoRepository } = crearRepositorios();
    const casoUso = new AgregarAlCarritoUseCase(carritoRepository, productoRepository);

    await casoUso.execute(CLIENTE, { productoId: 1, cantidad: 1 });

    const segundaInstancia = new AgregarAlCarritoUseCase(carritoRepository, productoRepository);
    const resultado = await segundaInstancia.execute(CLIENTE, { productoId: 1, cantidad: 1 });

    expect(resultado.carrito.items).toHaveLength(1);
    expect(resultado.carrito.items[0].cantidad).toBe(2);
  });
});