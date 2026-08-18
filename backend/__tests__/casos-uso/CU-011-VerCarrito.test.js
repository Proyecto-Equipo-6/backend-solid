const VerCarritoUseCase = require('../../application/VerCarritoUseCase');
const InMemoryCarritoRepository = require('../../infraestructure/repositories/in-memory/InMemoryCarritoRepository');

describe('CU-011 Ver carrito (VerCarritoUseCase)', () => {
  const CLIENTE = { id_usuario: 2, id_rol: 2, email: 'juan@email.com' };

  const PRODUCTO = {
    id: 1,
    titulo: 'Juego Utensilios Pro',
    imagen: null,
    precio: 250000,
    stock: 100,
    garantia: '6 meses',
  };

  it('devuelve el carrito vacío cuando no hay productos (CU-011)', async () => {
    const carritoRepository = new InMemoryCarritoRepository();
    const casoUso = new VerCarritoUseCase(carritoRepository);

    const resultado = await casoUso.execute(CLIENTE);

    expect(resultado.usuarioId).toBe(CLIENTE.id_usuario);
    expect(resultado.items).toEqual([]);
    expect(resultado.total).toBe(0);
    expect(resultado.vacio).toBe(true);
  });

  it('devuelve los items del carrito con su subtotal y total (CU-011, RN-038)', async () => {
    const carritoRepository = new InMemoryCarritoRepository();
    carritoRepository.agregarProducto(CLIENTE.id_usuario, PRODUCTO, 2);
    const casoUso = new VerCarritoUseCase(carritoRepository);

    const resultado = await casoUso.execute(CLIENTE);

    expect(resultado.items).toHaveLength(1);
    expect(resultado.items[0].idProducto).toBe(1);
    expect(resultado.items[0].cantidad).toBe(2);
    expect(resultado.items[0].subtotal).toBe(500000);
    expect(resultado.total).toBe(500000);
    expect(resultado.vacio).toBe(false);
  });

  it('acumula subtotales de varios productos (CU-011)', async () => {
    const carritoRepository = new InMemoryCarritoRepository();
    carritoRepository.agregarProducto(CLIENTE.id_usuario, PRODUCTO, 1);
    carritoRepository.agregarProducto(CLIENTE.id_usuario, { ...PRODUCTO, id: 2, titulo: 'Batidora', precio: 100000 }, 3);
    const casoUso = new VerCarritoUseCase(carritoRepository);

    const resultado = await casoUso.execute(CLIENTE);

    expect(resultado.items).toHaveLength(2);
    expect(resultado.total).toBe(550000);
  });

  it('persiste el carrito aunque cambie la instancia del caso de uso (RN-040)', async () => {
    const carritoRepository = new InMemoryCarritoRepository();
    carritoRepository.agregarProducto(CLIENTE.id_usuario, PRODUCTO, 1);

    const primeraVista = await new VerCarritoUseCase(carritoRepository).execute(CLIENTE);
    const segundaVista = await new VerCarritoUseCase(carritoRepository).execute(CLIENTE);

    expect(primeraVista.items).toHaveLength(1);
    expect(segundaVista.items).toHaveLength(1);
    expect(segundaVista.items[0].idProducto).toBe(1);
  });
});