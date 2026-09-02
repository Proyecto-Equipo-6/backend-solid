import jwt from 'jsonwebtoken';
import LoginUseCase from '../../application/LoginUseCase';
import { crearRepositorio, crearUsuario } from './helpers/usuarios.js';
import { configurarBcryptRounds } from './helpers/bcryptSetup.js';

const JWT_SECRET_PRUEBA = 'secreto-de-prueba';

function crearCasoUso(repositorio) {
  return new LoginUseCase(repositorio, JWT_SECRET_PRUEBA);
}

describe('CU-003 Iniciar sesión (LoginUseCase)', () => {
  let repositorio;
  let casoUso;

  configurarBcryptRounds();

  beforeEach(() => {
    repositorio = crearRepositorio();
    casoUso = crearCasoUso(repositorio);
  });

  it('autentica con credenciales válidas y devuelve token + usuario sin password', async () => {
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

  it('rechaza con 401 una contraseña incorrecta', async () => {
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

  it('rechaza con 401 un correo no registrado', async () => {
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

  it('rechaza con 401 campos faltantes', async () => {
    // Arrange
    const credenciales = { email: '', password: '' };

    // Act & Assert
    await expect(casoUso.execute(credenciales)).rejects.toMatchObject({ status: 401 });
  });

  it('rechaza con 403 cuenta inactiva', async () => {
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

  it('maneja error de conexión con la BD', async () => {
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

  it('expira el token JWT después de 30 minutos', async () => {
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

  it('devuelve id_rol para que el frontend redirija según rol', async () => {
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