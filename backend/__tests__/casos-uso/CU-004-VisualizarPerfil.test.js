import bcrypt from 'bcrypt';
import ObtenerPerfilUseCase from '../../application/ObtenerPerfilUseCase';
import InMemoryUserRepository from '../../infraestructure/repositories/in-memory/InMemoryUserRepository';

function crearRepositorio() {
  return new InMemoryUserRepository();
}

async function crearUsuario(repositorio, {
  id = 1,
  id_rol = 2,
  nombre_apellido = 'Ana Torres',
  tipo_documento = 'CC',
  numero_documento = '1000000001',
  email = 'ana@example.com',
  password = 'Abcd1234',
  telefono = '3001234567',
  direccion = 'Calle 10 # 5-20, Medellín',
  activo = 1,
} = {}) {
  const usuario = {
    id,
    id_rol,
    nombre_apellido,
    tipo_documento,
    numero_documento,
    email,
    password: await bcrypt.hash(password, 4),
    telefono,
    direccion,
    activo,
  };
  return repositorio.save(usuario);
}

function crearCasoUso(repositorio) {
  return new ObtenerPerfilUseCase(repositorio);
}

describe('CU-004 Visualizar perfil (ObtenerPerfilUseCase)', () => {
  let repositorio;
  let casoUso;

  beforeEach(async () => {
    repositorio = crearRepositorio();
    await crearUsuario(repositorio);
    casoUso = crearCasoUso(repositorio);
  });

  it('CP-CU-004-01 / CP-CU-004-02: devuelve los datos del perfil sin contraseña', async () => {
    // Arrange
    const idUsuario = 1;

    // Act
    const perfil = await casoUso.execute({ id_usuario: idUsuario });

    // Assert
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

  it('CP-CU-004-03: devuelve perfil sin datos opcionales (perfil incompleto)', async () => {
    // Arrange
    const repositorioIncompleto = crearRepositorio();
    await repositorioIncompleto.save({
      id: 2,
      id_rol: 2,
      nombre_apellido: 'Usuario Incompleto',
      tipo_documento: 'CC',
      numero_documento: '2000000002',
      email: 'incompleto@example.com',
      password: await bcrypt.hash('Abcd1234', 4),
      telefono: '',
      direccion: '',
      activo: 1,
    });
    const casoUsoIncompleto = crearCasoUso(repositorioIncompleto);

    // Act
    const perfil = await casoUsoIncompleto.execute({ id_usuario: 2 });

    // Assert
    expect(perfil.telefono).toBe('');
    expect(perfil.direccion).toBe('');
    expect(perfil.nombre_apellido).toBe('Usuario Incompleto');
  });

  it('CP-CU-004-04: lanza 401 si la sesión expiró (usuario no existe)', async () => {
    // Arrange
    const idUsuarioInexistente = 999;

    // Act & Assert
    await expect(
      casoUso.execute({ id_usuario: idUsuarioInexistente })
    ).rejects.toMatchObject({ status: 401 });
    await expect(
      casoUso.execute({ id_usuario: idUsuarioInexistente })
    ).rejects.toThrow('Su sesión ha expirado. Inicie sesión nuevamente');
  });

  it('CP-CU-004-05: maneja error de conexión con la BD', async () => {
    // Arrange
    const repositorioFalso = {
      findById: jest.fn().mockRejectedValue(new Error('Error de conexión')),
    };
    const casoUsoFalso = crearCasoUso(repositorioFalso);

    // Act & Assert
    await expect(
      casoUsoFalso.execute({ id_usuario: 1 })
    ).rejects.toThrow('Error de conexión');
  });
});