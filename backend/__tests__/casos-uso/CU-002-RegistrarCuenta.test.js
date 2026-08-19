const bcrypt = require('bcrypt');
const CreateUserUseCase = require('../../application/CreateUserUseCase');
const InMemoryUserRepository = require('../../infraestructure/repositories/in-memory/InMemoryUserRepository');

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
    repositorio = new InMemoryUserRepository();
    casoUso = new CreateUserUseCase(repositorio);
  });

  const datosValidos = {
  nombre_apellido: 'Ana Torres',
  tipo_documento: 'CC',
  numero_documento: '1000000001',
  email: 'ana@example.com',
  password: 'Abcd1234', // 8 caracteres, al menos una letra mayúscula y un número
  telefono: '3001234567',
  direccion: 'Calle 10 # 5-20, Medellín',
};

  it('registra un cliente con rol de cliente y devuelve el perfil sin contraseña (CU-002)', async () => {
    const resultado = await casoUso.execute(datosValidos);

    expect(resultado.id_rol).toBe(2);
    expect(resultado.email).toBe('ana@example.com');
    expect(resultado.password).toBeUndefined();

    expect(repositorio.users).toHaveLength(1);
    const guardado = repositorio.users[0];
    expect(guardado.password).not.toBe(datosValidos.password);
    expect(await bcrypt.compare(datosValidos.password, guardado.password)).toBe(true);
  });

  it('rechaza datos de formulario inválidos', async () => {
    const error = await casoUso
      .execute({ ...datosValidos, telefono: '123' })
      .catch((e) => e);

    expect(error.message).toBe('Por favor verifique los campos del formulario');
    expect(repositorio.users).toHaveLength(0);
  });

  it('rechaza un correo ya registrado por otro usuario', async () => {
    await repositorio.save({ ...datosValidos, id: 1 });

    const error = await casoUso.execute(datosValidos).catch((e) => e);

    expect(error.name).toBe('ErrorConflicto');
    expect(error.status).toBe(409);
    expect(error.message).toBe('El correo electrónico ya se encuentra registrado');
  });

  it('rechaza un número de documento ya registrado', async () => {
    await repositorio.save({
      ...datosValidos,
      id: 1,
      email: 'otro@example.com',
    });

    const error = await casoUso.execute(datosValidos).catch((e) => e);

    expect(error.name).toBe('ErrorConflicto');
    expect(error.status).toBe(409);
    expect(error.message).toBe('El número de documento ya se encuentra registrado');
  });

    it('rechaza campos obligatorios vacíos (CP-002-03)', async () => {
    const camposObligatorios = [
      'nombre_apellido',
      'tipo_documento',
      'numero_documento',
      'email',
      'password',
      'telefono',
      'direccion',
    ];

    for (const campo of camposObligatorios) {
      const datosInvalidos = { ...datosValidos, [campo]: '' };
      const error = await casoUso.execute(datosInvalidos).catch((e) => e);
      expect(error.message).toBe('Por favor verifique los campos del formulario');
    }
    expect(repositorio.users).toHaveLength(0);
  });

  it('rechaza correo con formato inválido (CP-002-04)', async () => {
    const error = await casoUso
      .execute({ ...datosValidos, email: 'correo-invalido' })
      .catch((e) => e);

    expect(error.message).toBe('Por favor verifique los campos del formulario');
    expect(repositorio.users).toHaveLength(0);
  });

  it('rechaza documento con letras o caracteres no numéricos (CP-002-04)', async () => {
    const error = await casoUso
      .execute({ ...datosValidos, numero_documento: 'ABC123' })
      .catch((e) => e);

    expect(error.message).toBe('Por favor verifique los campos del formulario');
    expect(repositorio.users).toHaveLength(0);
  });

  it('rechaza contraseña débil sin mayúscula o sin número (CP-002-06)', async () => {
    const casos = [
      'abcdefg1',  // 8 chars, sin mayúscula
      'Abcdefgh',  // 8 chars, sin número
      'Abc123',    // 6 chars
    ];

    for (const password of casos) {
      const error = await casoUso
        .execute({ ...datosValidos, password })
        .catch((e) => e);
      expect(error.message).toBe('Por favor verifique los campos del formulario');
    }
    expect(repositorio.users).toHaveLength(0);
  });

  it('rechaza teléfono con más de 10 dígitos (CP-002-07)', async () => {
    const error = await casoUso
      .execute({ ...datosValidos, telefono: '30012345678' }) // 11 dígitos
      .catch((e) => e);

    expect(error.message).toBe('Por favor verifique los campos del formulario');
    expect(repositorio.users).toHaveLength(0);
  });
});