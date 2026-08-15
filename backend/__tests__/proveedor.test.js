import InMemoryProveedorRepository from '../infraestructure/repositories/in-memory/InMemoryProveedorRepository.js';
import CrearProveedorUseCase from '../application/crearProveedorUseCase.js';
import EditarProveedorUseCase from '../application/editarProveedorUseCase.js';
import EliminarProveedorUseCase from '../application/eliminarProveedorUseCase.js';

describe('Módulo CRUD proveedores (CU-025)', () => {
  test('Registrar proveedor con éxito (flujo feliz, estado 1 y fecha automática)', async () => {
    const repo = new InMemoryProveedorRepository();
    const useCase = new CrearProveedorUseCase(repo);

    const proveedor = await useCase.ejecutar({
      nit_proveedor: '900123456-7',
      razon_social: 'Aseo Total S.A.S.',
      telefono: '6012345678',
      email: 'ventas@aseototal.com'
    });

    expect(proveedor.id_proveedor).toBe(1);
    expect(proveedor.nit_proveedor).toBe('900123456-7');
    expect(proveedor.razon_social).toBe('Aseo Total S.A.S.');
    expect(proveedor.estado).toBe(1);
    expect(proveedor.fecha_creacion).toBeDefined();
    expect(new Date(proveedor.fecha_creacion).toString()).not.toBe('Invalid Date');
  });

  test('Rechazar si el NIT está duplicado', async () => {
    const repo = new InMemoryProveedorRepository();
    const useCase = new CrearProveedorUseCase(repo);

    await useCase.ejecutar({
      nit_proveedor: '901987654-3',
      razon_social: 'Distribuciones La Roca',
      telefono: '6034567890',
      email: 'contacto@laroca.com'
    });

    await expect(
      useCase.ejecutar({
        nit_proveedor: '901987654-3',
        razon_social: 'La Roca S.A.S.',
        telefono: '6031112233',
        email: 'info@laroca.com'
      })
    ).rejects.toThrow('El NIT ingresado ya está registrado por otro proveedor');
  });

  test('Rechazar si faltan campos obligatorios', async () => {
    const repo = new InMemoryProveedorRepository();
    const useCase = new CrearProveedorUseCase(repo);

    await expect(
      useCase.ejecutar({
        nit_proveedor: '900555000-1',
        razon_social: '',
        telefono: '6051234567',
        email: 'correo@proveedor.com'
      })
    ).rejects.toThrow('Complete los campos obligatorios');
  });

  test('Editar proveedor actualiza sus datos y estado', async () => {
    const repo = new InMemoryProveedorRepository();
    const crear = new CrearProveedorUseCase(repo);
    const editar = new EditarProveedorUseCase(repo);

    const proveedor = await crear.ejecutar({
      nit_proveedor: '900111222-3',
      razon_social: 'Limpieza y Brillo',
      telefono: '6012345678',
      email: 'info@limpiezaybrillo.com'
    });

    const editado = await editar.ejecutar(proveedor.id_proveedor, {
      nit_proveedor: '900111222-3',
      razon_social: 'Limpieza y Brillo S.A.S.',
      telefono: '6019998877',
      email: 'ventas@limpiezaybrillo.com',
      estado: 'Inactivo'
    });

    expect(editado.razon_social).toBe('Limpieza y Brillo S.A.S.');
    expect(editado.estado).toBe(0);
  });

  test('Eliminar proveedor lo desactiva (borrado lógico)', async () => {
    const repo = new InMemoryProveedorRepository();
    const crear = new CrearProveedorUseCase(repo);
    const eliminar = new EliminarProveedorUseCase(repo);

    const proveedor = await crear.ejecutar({
      nit_proveedor: '902222333-4',
      razon_social: 'Proveedora Nacional',
      telefono: '6047654321',
      email: 'ventas@proveedoranacional.com'
    });

    await eliminar.ejecutar(proveedor.id_proveedor);

    const proveedorDesactivado = await repo.buscarPorId(proveedor.id_proveedor);
    expect(proveedorDesactivado.estado).toBe(0);
  });
});