import EliminarDelCarritoUseCase from '../../application/EliminarDelCarritoUseCase';
import InMemoryCarritoRepository from '../../infraestructure/repositories/in-memory/InMemoryCarritoRepository';

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

function crearCasoUso(carritoRepository) {
  return new EliminarDelCarritoUseCase(carritoRepository);
}

describe('CU-009 Eliminar producto del carrito (EliminarDelCarritoUseCase)', () => {
  it('elimina un producto y recalcula total', async () => {
    // Arrange
    const carritoRepository = crearRepositorioConProducto(2);
    const casoUso = crearCasoUso(carritoRepository);

    // Act
    const resultado = await casoUso.execute(CLIENTE, 1);

    // Assert
    expect(resultado.mensaje).toBe('Producto eliminado correctamente');
    expect(resultado.carrito.items).toHaveLength(0);
    expect(resultado.carrito.total).toBe(0);
    expect(resultado.carrito.vacio).toBe(true);
  });

  it('eliminar el último producto muestra carrito vacío', async () => {
    // Arrange
    const carritoRepository = crearRepositorioConProducto(1);
    const casoUso = crearCasoUso(carritoRepository);

    // Act
    const resultado = await casoUso.execute(CLIENTE, 1);

    // Assert
    expect(resultado.carrito.vacio).toBe(true);
    expect(resultado.carrito.items).toEqual([]);
  });

  it('maneja error de conexión al eliminar', async () => {
    // Arrange
    const carritoRepositoryFalso = {
      obtenerCantidad: jest.fn().mockResolvedValue(1),
      eliminarProducto: jest.fn().mockRejectedValue(new Error('Error de conexión')),
    };
    const casoUso = new EliminarDelCarritoUseCase(carritoRepositoryFalso);

    // Act & Assert
    await expect(
      casoUso.execute(CLIENTE, 1)
    ).rejects.toThrow('Error de conexión');
  });

  it('rechaza eliminar un producto que no está en el carrito', async () => {
    // Arrange
    const carritoRepository = crearRepositorioConProducto(1);
    const casoUso = crearCasoUso(carritoRepository);

    // Act & Assert
    await expect(
      casoUso.execute(CLIENTE, 999)
    ).rejects.toMatchObject({ status: 404 });
    await expect(
      casoUso.execute(CLIENTE, 999)
    ).rejects.toThrow('El producto no se encuentra en tu carrito');
  });

  it('rechaza eliminar sin indicar producto', async () => {
    // Arrange
    const carritoRepository = crearRepositorioConProducto(1);
    const casoUso = crearCasoUso(carritoRepository);

    // Act & Assert
    await expect(
      casoUso.execute(CLIENTE, null)
    ).rejects.toMatchObject({ status: 400 });
    await expect(
      casoUso.execute(CLIENTE, null)
    ).rejects.toThrow('Debes indicar el producto');
  });

  it('solo afecta el carrito del cliente autenticado', async () => {
    // Arrange
    const carritoRepository = crearRepositorioConProducto(1);
    carritoRepository.agregarProducto(99, PRODUCTO, 1);
    const casoUso = crearCasoUso(carritoRepository);

    // Act
    await casoUso.execute(CLIENTE, 1);

    // Assert
    const carritoOtro = await carritoRepository.obtenerCarrito(99);
    expect(carritoOtro.items).toHaveLength(1);
  });
});