import InMemoryCategoriaRepository from '../infraestructure/repositories/in-memory/InMemoryCategoriaRepository.js';
import CrearCategoriaUseCase from '../application/crearCategoriaUseCase.js';
import EditarCategoriaUseCase from '../application/editarCategoriaUseCase.js';
import EliminarCategoriaUseCase from '../application/eliminarCategoriaUseCase.js';

describe('Módulo CRUD categorías (CU-022)', () => {
  test('Registrar categoría con éxito y fecha_creacion automática', async () => {
    const repo = new InMemoryCategoriaRepository();
    const useCase = new CrearCategoriaUseCase(repo);

    const categoria = await useCase.ejecutar({ nombre: 'Electrónica', descripcion: 'Dispositivos' });

    expect(categoria.id_categoria).toBe(1);
    expect(categoria.nombre).toBe('Electrónica');
    expect(categoria.estado).toBe(1);
    expect(categoria.fecha_creacion).toBeDefined();
    expect(new Date(categoria.fecha_creacion).toString()).not.toBe('Invalid Date');
  });

  test('Rechazar categoría con nombre duplicado', async () => {
    const repo = new InMemoryCategoriaRepository();
    const useCase = new CrearCategoriaUseCase(repo);

    await useCase.ejecutar({ nombre: 'Hogar' });

    await expect(
      useCase.ejecutar({ nombre: 'Hogar' })
    ).rejects.toThrow('Ya existe una categoría con ese nombre');
  });

  test('Impedir eliminación si tiene productos asociados', async () => {
    const repo = new InMemoryCategoriaRepository();
    const crear = new CrearCategoriaUseCase(repo);
    const eliminar = new EliminarCategoriaUseCase(repo);

    const categoria = await crear.ejecutar({ nombre: 'Deportes' });
    repo.setProductosAsociados(categoria.id_categoria, 3);

    await expect(
      eliminar.ejecutar(categoria.id_categoria)
    ).rejects.toThrow('No se puede eliminar: la categoría tiene 3 productos asociados');
  });

  test('Editar estado de categoría a Inactivo', async () => {
    const repo = new InMemoryCategoriaRepository();
    const crear = new CrearCategoriaUseCase(repo);
    const editar = new EditarCategoriaUseCase(repo);

    const creada = await crear.ejecutar({ nombre: 'Limpieza' });
    const editada = await editar.ejecutar(creada.id_categoria, { nombre: 'Limpieza', estado: 'Inactivo' });

    expect(editada.estado).toBe(0);
  });
});