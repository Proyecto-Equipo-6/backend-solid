const bcrypt = require('bcrypt');
const LoginUseCase = require('../../application/LoginUseCase');
const InMemoryUserRepository = require('../../infraestructure/repositories/in-memory/InMemoryUserRepository');

const JWT_SECRET_PRUEBA = 'secreto-de-prueba';

async function crearUsuario(repositorio, { email, password, activo = 1, id_rol = 2 }) {
  const usuario = {
    id: repositorio.users.length + 1,
    id_rol,
    nombre_apellido: 'Ana Torres',
    tipo_documento: 'CC',
    numero_documento: `10000000${repositorio.users.length}`,
    email,
    password: await bcrypt.hash(password, 4),
    telefono: '3001234567',
    direccion: 'Calle 10 # 5-20, Medellín',
    activo,
  };
  return repositorio.save(usuario);
}

describe('CU-003 Iniciar sesión (LoginUseCase)', () => {
  let repositorio;
  let casoUso;

  beforeEach(() => {
    repositorio = new InMemoryUserRepository();
    casoUso = new LoginUseCase(repositorio, JWT_SECRET_PRUEBA);
  });

  it('autentica con credenciales válidas y devuelve token + usuario sin password', async () => {
    await crearUsuario(repositorio, { email: 'ana@example.com', password: 'abcd1234' });

    const resultado = await casoUso.execute({ email: 'ana@example.com', password: 'abcd1234' });

    expect(resultado.token).toEqual(expect.any(String));
    expect(resultado.usuario.id_usuario).toBe(1);
    expect(resultado.usuario.id_rol).toBe(2);
    expect(resultado.usuario.password).toBeUndefined();
  });

  it('rechaza con 401 una contraseña incorrecta', async () => {
    await crearUsuario(repositorio, { email: 'ana@example.com', password: 'abcd1234' });

    const error = await casoUso
      .execute({ email: 'ana@example.com', password: 'incorrecta' })
      .catch((e) => e);

    expect(error.status).toBe(401);
    expect(error.message).toBe('Correo electrónico o contraseña incorrectos');
  });

  it('rechaza con 401 un correo no registrado', async () => {
    const error = await casoUso
      .execute({ email: 'nadie@example.com', password: 'abcd1234' })
      .catch((e) => e);

    expect(error.status).toBe(401);
    expect(error.message).toBe('Correo electrónico o contraseña incorrectos');
  });

  it('rechaza con 403 una cuenta inactiva', async () => {
    await crearUsuario(repositorio, {
      email: 'inactivo@example.com',
      password: 'abcd1234',
      activo: 0,
    });

    const error = await casoUso
      .execute({ email: 'inactivo@example.com', password: 'abcd1234' })
      .catch((e) => e);

    expect(error.status).toBe(403);
    expect(error.message).toBe(
      'Su cuenta se encuentra suspendida. Comuníquese con administración'
    );
  });

  it('rechaza con 401 campos faltantes', async () => {
    const error = await casoUso.execute({ email: '', password: '' }).catch((e) => e);

    expect(error.status).toBe(401);
  });
});
