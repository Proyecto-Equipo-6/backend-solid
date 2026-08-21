import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import LoginUseCase from '../../application/LoginUseCase';
import InMemoryUserRepository from '../../infraestructure/repositories/in-memory/InMemoryUserRepository';

const JWT_SECRET_PRUEBA = 'secreto-de-prueba';

function crearRepositorio() {
  return new InMemoryUserRepository();
}

function crearCasoUso(repositorio) {
  return new LoginUseCase(repositorio, JWT_SECRET_PRUEBA);
}

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
  let roundsOriginal;

  beforeAll(() => {
    roundsOriginal = process.env.BCRYPT_ROUNDS;
    process.env.BCRYPT_ROUNDS = '4';
  });

  afterAll(() => {
    if (roundsOriginal === undefined) {
      delete process.env.BCRYPT_ROUNDS;
    } else {
      process.env.BCRYPT_ROUNDS = roundsOriginal;
    }
  });

  beforeEach(() => {
    repositorio = crearRepositorio();
    casoUso = crearCasoUso(repositorio);
  });

  it('CP-CU-003-01 / CP-RF-002.1-01 / CP-HU-002.1-01: autentica con credenciales válidas y devuelve token + usuario sin password', async () => {
    // Arrange
    await crearUsuario(repositorio, { email: 'ana@example.com', password: 'Abcd1234' });

    // Act
    const resultado = await casoUso.execute({ email: 'ana@example.com', password: 'Abcd1234' });

    // Assert
    expect(resultado.token).toEqual(expect.any(String));
    expect(resultado.usuario.id_usuario).toBe(1);
    expect(resultado.usuario.id_rol).toBe(2);
    expect(resultado.usuario.password).toBeUndefined();
  });

  it('CP-CU-003-02 / CP-RF-002.1-02 / CP-HU-002.1-02: rechaza con 401 una contraseña incorrecta', async () => {
    // Arrange
    await crearUsuario(repositorio, { email: 'ana@example.com', password: 'Abcd1234' });

    // Act & Assert
    await expect(
      casoUso.execute({ email: 'ana@example.com', password: 'Incorrecta123' })
    ).rejects.toMatchObject({ status: 401 });
    await expect(
      casoUso.execute({ email: 'ana@example.com', password: 'Incorrecta123' })
    ).rejects.toThrow('Correo electrónico o contraseña incorrectos');
  });

  it('CP-CU-003-02: rechaza con 401 un correo no registrado', async () => {
    // Arrange
    const email = 'nadie@example.com';

    // Act & Assert
    await expect(
      casoUso.execute({ email, password: 'Abcd1234' })
    ).rejects.toMatchObject({ status: 401 });
    await expect(
      casoUso.execute({ email, password: 'Abcd1234' })
    ).rejects.toThrow('Correo electrónico o contraseña incorrectos');
  });

  it('CP-CU-003-03: rechaza con 401 campos faltantes', async () => {
    // Arrange
    const credenciales = { email: '', password: '' };

    // Act & Assert
    await expect(casoUso.execute(credenciales)).rejects.toMatchObject({ status: 401 });
  });

  it('CP-RF-002.1-03 / CP-HU-002.1-03: rechaza con 403 cuenta inactiva', async () => {
    // Arrange
    await crearUsuario(repositorio, {
      email: 'inactivo@example.com',
      password: 'Abcd1234',
      activo: 0,
    });

    // Act & Assert
    await expect(
      casoUso.execute({ email: 'inactivo@example.com', password: 'Abcd1234' })
    ).rejects.toMatchObject({ status: 403 });
    await expect(
      casoUso.execute({ email: 'inactivo@example.com', password: 'Abcd1234' })
    ).rejects.toThrow('Su cuenta se encuentra suspendida. Comuníquese con administración');
  });

  it('CP-CU-003-05: maneja error de conexión con la BD', async () => {
    // Arrange
    const repositorioFalso = {
      findByEmail: jest.fn().mockRejectedValue(new Error('Error de conexión a BD')),
    };
    const casoUsoFalso = new LoginUseCase(repositorioFalso, JWT_SECRET_PRUEBA);

    // Act & Assert
    await expect(
      casoUsoFalso.execute({ email: 'ana@example.com', password: 'Abcd1234' })
    ).rejects.toThrow('Error de conexión a BD');
  });

  it('CP-CU-003-06: expira el token JWT después de 30 minutos', async () => {
    // Arrange
    await crearUsuario(repositorio, {
      email: 'ana@example.com',
      password: 'Abcd1234'
    });

    const { token } = await casoUso.execute({
      email: 'ana@example.com',
      password: 'Abcd1234'
    });

    // Act
    const payloadActual = jwt.verify(token, JWT_SECRET_PRUEBA);
    const futuro = Math.floor(Date.now() / 1000) + 31 * 60;

    // Assert
    expect(payloadActual.email).toBe('ana@example.com');
    expect(() =>
      jwt.verify(token, JWT_SECRET_PRUEBA, { clockTimestamp: futuro })
    ).toThrow(jwt.TokenExpiredError);
  });

  it('CP-RF-002.1-01: devuelve id_rol para que el frontend redirija según rol', async () => {
    // Arrange
    await crearUsuario(repositorio, { email: 'cliente@example.com', password: 'Abcd1234', id_rol: 2 });

    // Act
    const resultado = await casoUso.execute({
      email: 'cliente@example.com',
      password: 'Abcd1234'
    });

    // Assert
    expect(resultado.usuario.id_rol).toBe(2);
    expect(resultado.token).toBeDefined();
  });
});