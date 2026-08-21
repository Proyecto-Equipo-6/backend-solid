import bcrypt from 'bcrypt';
import CreateUserUseCase from '../../application/CreateUserUseCase';
import InMemoryUserRepository from '../../infraestructure/repositories/in-memory/InMemoryUserRepository';

const datosValidos = {
  nombre_apellido: 'Ana Torres',
  tipo_documento: 'CC',
  numero_documento: '1000000001',
  email: 'ana@example.com',
  password: 'Abcd1234', // 8 caracteres, mayúscula y número
  telefono: '3001234567',
  direccion: 'Calle 10 # 5-20, Medellín',
};

function crearRepositorio() {
  return new InMemoryUserRepository();
}

function crearCasoUso(repositorio) {
  return new CreateUserUseCase(repositorio);
}

describe('CU-002 Registrar cuenta (CreateUserUseCase)', () => {
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

  it('CP-CU-002-01 / RF-001.1-01 / HU-001.1-01: registra un cliente con rol de cliente y retorna perfil sin contraseña', async () => {
    // Arrange
    const datos = { ...datosValidos };

    // Act
    const resultado = await casoUso.execute(datos);

    // Assert
    expect(resultado.id_rol).toBe(2);
    expect(resultado.email).toBe('ana@example.com');
    expect(resultado.password).toBeUndefined();
    expect(repositorio.users).toHaveLength(1);

    const guardado = repositorio.users[0];
    expect(guardado.password).not.toBe(datos.password);
    expect(await bcrypt.compare(datos.password, guardado.password)).toBe(true);
  });

  it('CP-CU-002-02 / RF-001.1-02 / HU-001.1-02: rechaza correo duplicado', async () => {
    // Arrange
    await repositorio.save({ ...datosValidos, id: 1 });

    // Act
    const promesa = casoUso.execute(datosValidos);

    // Assert
    await expect(promesa).rejects.toMatchObject({ status: 409 });
    await expect(casoUso.execute(datosValidos)).rejects.toThrow(
      'El correo electrónico ya se encuentra registrado'
    );
  });

  it('RF-001.1-03 / HU-001.1-03: rechaza número de documento duplicado', async () => {
    // Arrange
    await repositorio.save({
      ...datosValidos,
      id: 1,
      email: 'otro@example.com',
    });

    // Act
    const promesa = casoUso.execute(datosValidos);

    // Assert
    await expect(promesa).rejects.toMatchObject({ status: 409 });
    await expect(casoUso.execute(datosValidos)).rejects.toThrow(
      'El número de documento ya se encuentra registrado'
    );
  });

  it('CP-CU-002-03: rechaza campos obligatorios vacíos', async () => {
    // Arrange
    const camposObligatorios = [
      'nombre_apellido',
      'tipo_documento',
      'numero_documento',
      'email',
      'password',
      'telefono',
      'direccion',
    ];

    // Act & Assert
    for (const campo of camposObligatorios) {
      const datosInvalidos = { ...datosValidos, [campo]: '' };
      await expect(casoUso.execute(datosInvalidos)).rejects.toThrow(
        'Por favor verifique los campos del formulario'
      );
    }
    expect(repositorio.users).toHaveLength(0);
  });

  it('CP-CU-002-04: rechaza correo con formato inválido', async () => {
    // Arrange
    const datos = { ...datosValidos, email: 'correo-invalido' };

    // Act & Assert
    await expect(casoUso.execute(datos)).rejects.toThrow(
      'Por favor verifique los campos del formulario'
    );
    expect(repositorio.users).toHaveLength(0);
  });

  it('CP-CU-002-04: rechaza documento con caracteres no numéricos', async () => {
    // Arrange
    const datos = { ...datosValidos, numero_documento: 'ABC123' };

    // Act & Assert
    await expect(casoUso.execute(datos)).rejects.toThrow(
      'Por favor verifique los campos del formulario'
    );
    expect(repositorio.users).toHaveLength(0);
  });

  it('CP-CU-002-04: rechaza teléfono con formato inválido (menos de 10 dígitos)', async () => {
    // Arrange
    const datos = { ...datosValidos, telefono: '123' };

    // Act & Assert
    await expect(casoUso.execute(datos)).rejects.toThrow(
      'Por favor verifique los campos del formulario'
    );
    expect(repositorio.users).toHaveLength(0);
  });

  it('CP-CU-002-07: rechaza teléfono con más de 10 dígitos', async () => {
    // Arrange
    const datos = { ...datosValidos, telefono: '30012345678' }; // 11 dígitos

    // Act & Assert
    await expect(casoUso.execute(datos)).rejects.toThrow(
      'Por favor verifique los campos del formulario'
    );
    expect(repositorio.users).toHaveLength(0);
  });

  it('CP-CU-002-06: rechaza contraseña débil', async () => {
    // Arrange
    const casos = [
      'abcdefg1',  // sin mayúscula
      'Abcdefgh',  // sin número
      'Abc123',    // muy corta
    ];

    // Act & Assert
    for (const password of casos) {
      const datos = { ...datosValidos, password };
      await expect(casoUso.execute(datos)).rejects.toThrow(
        'Por favor verifique los campos del formulario'
      );
    }
    expect(repositorio.users).toHaveLength(0);
  });

  it('CP-CU-002-05: maneja error de conexión con BD', async () => {
    // Arrange
    const repositorioFalso = {
      findByEmail: jest.fn().mockRejectedValue(new Error('Error de conexión')),
      findByNumeroDocumento: jest.fn().mockResolvedValue(null),
      save: jest.fn(),
    };
    const casoUsoFalso = new CreateUserUseCase(repositorioFalso);

    // Act & Assert
    await expect(casoUsoFalso.execute(datosValidos)).rejects.toThrow(
      'Error de conexión'
    );
  });

  it('rechaza nombre con caracteres especiales o números (extra)', async () => {
    // Arrange
    const casos = [
      'Ana Torres 123',
      'Ana@Torres',
      'Ana_Torres',
    ];

    // Act & Assert
    for (const nombre_apellido of casos) {
      const datos = { ...datosValidos, nombre_apellido };
      await expect(casoUso.execute(datos)).rejects.toThrow(
        'Por favor verifique los campos del formulario'
      );
    }
    expect(repositorio.users).toHaveLength(0);
  });
});