const bcrypt = require('bcrypt');
const ActualizarPerfilUseCase = require('../../application/ActualizarPerfilUseCase');
const InMemoryUserRepository = require('../../infraestructure/repositories/in-memory/InMemoryUserRepository');

describe('CU-005 Editar perfil (ActualizarPerfilUseCase)', () => {
  let repositorio;
  let casoUso;

  beforeEach(async () => {
    repositorio = new InMemoryUserRepository();
    const password = await bcrypt.hash('abcd1234', 4);
    await repositorio.save({
      id: 1,
      id_rol: 2,
      nombre_apellido: 'Ana Torres',
      tipo_documento: 'CC',
      numero_documento: '1000000001',
      email: 'ana@example.com',
      password,
      telefono: '3001234567',
      direccion: 'Calle 10 # 5-20, Medellín',
      activo: 1,
    });
    await repositorio.save({
      id: 2,
      id_rol: 2,
      nombre_apellido: 'Luis Mora',
      tipo_documento: 'CC',
      numero_documento: '1000000002',
      email: 'luis@example.com',
      password,
      telefono: '3001234568',
      direccion: 'Carrera 15 # 20-30, Bogotá',
      activo: 1,
    });
    casoUso = new ActualizarPerfilUseCase(repositorio);
  });

  const datosValidos = {
    nombre_apellido: 'Ana María Torres',
    email: 'ana.nueva@example.com',
    telefono: '3109876543',
    direccion: 'Av. El Poblado # 1-10, Medellín',
  };

  it('actualiza los datos editables y retorna el perfil sin la contraseña (CU-005, RN-015)', async () => {
    const resultado = await casoUso.execute({
      id_usuario: 1,
      password: 'abcd1234',
      datos: datosValidos,
    });

    expect(resultado.mensaje).toBe('Perfil actualizado correctamente');
    expect(resultado.perfil).toMatchObject(datosValidos);
    expect(resultado.perfil.password).toBeUndefined();
    expect(resultado.perfil.numero_documento).toBe('1000000001');
  });

  it('rechaza la edición si la contraseña actual no es correcta (FP-003)', async () => {
    const error = await casoUso
      .execute({ id_usuario: 1, password: 'incorrecta', datos: datosValidos })
      .catch((e) => e);

    expect(error.status).toBe(401);
    expect(error.message).toBe('La contraseña actual no es correcta');
  });

  it('rechaza el cambio de correo a uno ya registrado por otro usuario (RN-016/RN-017)', async () => {
    const error = await casoUso
      .execute({
        id_usuario: 1,
        password: 'abcd1234',
        datos: { ...datosValidos, email: 'luis@example.com' },
      })
      .catch((e) => e);

    expect(error.status).toBe(409);
    expect(error.message).toBe('El correo electrónico ya se encuentra registrado');
  });

  it('permite conservar el propio correo sin marcarlo como duplicado', async () => {
    const resultado = await casoUso.execute({
      id_usuario: 1,
      password: 'abcd1234',
      datos: { ...datosValidos, email: 'ana@example.com' },
    });

    expect(resultado.mensaje).toBe('Perfil actualizado correctamente');
    expect(resultado.perfil.email).toBe('ana@example.com');
  });

  it('notifica cuando no hay cambios que guardar (FA-003)', async () => {
    const resultado = await casoUso.execute({
      id_usuario: 1,
      password: 'abcd1234',
      datos: {
        nombre_apellido: 'Ana Torres',
        email: 'ana@example.com',
        telefono: '3001234567',
        direccion: 'Calle 10 # 5-20, Medellín',
      },
    });

    expect(resultado.mensaje).toBe('No hay cambios para guardar');
  });

  it('valida campos obligatorios (FA-002)', async () => {
    const error = await casoUso
      .execute({
        id_usuario: 1,
        password: 'abcd1234',
        datos: { ...datosValidos, direccion: '' },
      })
      .catch((e) => e);

    expect(error.message).toContain('direccion');
  });

  it('actualiza solo la dirección sin pedir contraseña actual', async () => {
    const resultado = await casoUso.execute({
      id_usuario: 1,
      datos: { direccion: 'Calle 80 # 45-10, Envigado' },
    });

    expect(resultado.mensaje).toBe('Perfil actualizado correctamente');
    expect(resultado.perfil.direccion).toBe('Calle 80 # 45-10, Envigado');
    expect(resultado.perfil.nombre_apellido).toBe('Ana Torres');
  });

  it('lanza 401 si el usuario autenticado ya no existe', async () => {
    const error = await casoUso
      .execute({ id_usuario: 999, password: 'abcd1234', datos: datosValidos })
      .catch((e) => e);

    expect(error.status).toBe(401);
  });
});
