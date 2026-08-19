const bcrypt = require('bcrypt');
const ObtenerPerfilUseCase = require('../../application/ObtenerPerfilUseCase');
const InMemoryUserRepository = require('../../infraestructure/repositories/in-memory/InMemoryUserRepository');

describe('CU-004 Visualizar perfil (ObtenerPerfilUseCase)', () => {
  let repositorio;
  let casoUso;

  beforeEach(async () => {
    repositorio = new InMemoryUserRepository();
    const usuario = {
      id: 1,
      id_rol: 2,
      nombre_apellido: 'Ana Torres',
      tipo_documento: 'CC',
      numero_documento: '1000000001',
      email: 'ana@example.com',
      password: await bcrypt.hash('Abcd1234', 4),
      telefono: '3001234567',
      direccion: 'Calle 10 # 5-20, Medellín',
      activo: 1,
    };
    await repositorio.save(usuario);
    casoUso = new ObtenerPerfilUseCase(repositorio);
  });

  it('devuelve los datos del perfil del usuario autenticado sin la contraseña (RN-015)', async () => {
    const perfil = await casoUso.execute({ id_usuario: 1 });

    expect(perfil).toEqual({
      id_usuario: 1,
      id_rol: 2,
      nombre_apellido: 'Ana Torres',
      tipo_documento: 'CC',
      numero_documento: '1000000001',
      email: 'ana@example.com',
      telefono: '3001234567',
      direccion: 'Calle 10 # 5-20, Medellín',
      activo: 1,
    });
    expect(perfil.password).toBeUndefined();
  });

  it('lanza 401 si el usuario autenticado ya no existe', async () => {
    const error = await casoUso.execute({ id_usuario: 999 }).catch((e) => e);

    expect(error.status).toBe(401);
    expect(error.message).toBe('Su sesión ha expirado. Inicie sesión nuevamente');
  });
});
