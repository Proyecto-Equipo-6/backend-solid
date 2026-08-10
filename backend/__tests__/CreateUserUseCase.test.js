const CreateUserUseCase = require('../application/CreateUserUseCase');
const InMemoryUserRepository = require('../infraestructure/repositories/in-memory/InMemoryUserRepository');

const datosValidos = {
  nombre_apellido: 'Ana Torres',
  tipo_documento: 'CC',
  numero_documento: '1234567890',
  email: 'ana@example.com',
  password: 'abcd1234',
  telefono: '3001234567',
  direccion: 'Calle 10 # 5-20, Medellín',
};

describe('CreateUserUseCase', () => {
  let repositorio;
  let casoUso;

  beforeEach(() => {
    repositorio = new InMemoryUserRepository();
    casoUso = new CreateUserUseCase(repositorio);
  });

  it('registra un usuario con rol Cliente, contraseña cifrada y sin exponer el hash', async () => {
    const resultado = await casoUso.execute(datosValidos);

    expect(resultado.email).toBe('ana@example.com');
    expect(resultado.password).toBeUndefined();
    expect(resultado.id_rol).toBe(2);

    const guardado = repositorio.users[0];
    expect(guardado.password).toMatch(/^\$2[aby]\$/);
    expect(guardado.password).not.toBe(datosValidos.password);
  });

  it('rechaza un correo ya registrado con estado 409', async () => {
    await casoUso.execute(datosValidos);

    const error = await casoUso
      .execute({ ...datosValidos, numero_documento: '9999999999' })
      .catch((e) => e);

    expect(error.status).toBe(409);
    expect(error.message).toBe('El correo electrónico ya se encuentra registrado');
  });

  it('rechaza un número de documento ya registrado con estado 409', async () => {
    await casoUso.execute(datosValidos);

    const error = await casoUso
      .execute({ ...datosValidos, email: 'otro@example.com' })
      .catch((e) => e);

    expect(error.status).toBe(409);
    expect(error.message).toBe('El número de documento ya se encuentra registrado');
  });

  it('rechaza datos inválidos con el mensaje genérico del formulario', async () => {
    const invalidos = {
      ...datosValidos,
      password: '123',
      telefono: '12345',
      direccion: '',
    };

    const error = await casoUso.execute(invalidos).catch((e) => e);

    expect(error.message).toBe('Por favor verifique los campos del formulario');
  });

  it('no registra nada cuando los datos son inválidos', async () => {
    const invalidos = { ...datosValidos, email: 'sin-arroba' };

    await casoUso.execute(invalidos).catch(() => {});

    expect(repositorio.users).toHaveLength(0);
  });
});
