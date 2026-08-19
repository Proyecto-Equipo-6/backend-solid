const bcrypt = require('bcrypt');
const SolicitarRecuperacionUseCase = require('../../application/SolicitarRecuperacionUseCase');
const RestablecerContrasenaUseCase = require('../../application/RestablecerContrasenaUseCase');
const InMemoryUserRepository = require('../../infraestructure/repositories/in-memory/InMemoryUserRepository');
const InMemoryTokensRecuperacionRepository = require('../../infraestructure/repositories/in-memory/InMemoryTokensRecuperacionRepository');

const MENSAJE_GENERICO =
  'Recibirá un enlace de recuperación a su correo electrónico';

async function crearUsuario(repositorio, { email = 'ana@example.com', password = 'Abcd1234' } = {}) {
  const usuario = {
    id: repositorio.users.length + 1,
    id_rol: 2,
    nombre_apellido: 'Ana Torres',
    tipo_documento: 'CC',
    numero_documento: `10000000${repositorio.users.length}`,
    email,
    password: await bcrypt.hash(password, 4),
    telefono: '3001234567',
    direccion: 'Calle 10 # 5-20, Medellín',
    activo: 1,
  };
  return repositorio.save(usuario);
}

describe('CU-006 Recuperar contraseña (SolicitarRecuperacionUseCase)', () => {
  let repositorio;
  let tokensRepositorio;
  let emailSender;
  let casoUso;

  beforeEach(() => {
    repositorio = new InMemoryUserRepository();
    tokensRepositorio = new InMemoryTokensRecuperacionRepository();
    emailSender = { enviarRecuperacion: jest.fn().mockResolvedValue(true) };
    casoUso = new SolicitarRecuperacionUseCase(repositorio, tokensRepositorio, emailSender);
  });

  it('genera token válido por 15 minutos y envía el correo para un correo existente', async () => {
    await crearUsuario(repositorio);

    const antes = Date.now();
    const resultado = await casoUso.execute({ email: 'ana@example.com' });
    const despues = Date.now();

    expect(resultado.mensaje).toBe(MENSAJE_GENERICO);
    expect(tokensRepositorio.tokens).toHaveLength(1);

    const registro = tokensRepositorio.tokens[0];
    expect(registro.usado).toBe(0);
    expect(registro.expira_en.getTime() - antes).toBeGreaterThan(14 * 60 * 1000);
    expect(registro.expira_en.getTime() - despues).toBeLessThan(16 * 60 * 1000);

    expect(emailSender.enviarRecuperacion).toHaveBeenCalledTimes(1);
    expect(emailSender.enviarRecuperacion).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'ana@example.com',
        nombre: 'Ana Torres',
      })
    );
    const { token } = emailSender.enviarRecuperacion.mock.calls[0][0];
    expect(token).toBe(registro.token);
  });

  it('no genera token ni envía correo para un correo no registrado (mismo mensaje)', async () => {
    const resultado = await casoUso.execute({ email: 'nadie@example.com' });

    expect(resultado.mensaje).toBe(MENSAJE_GENERICO);
    expect(tokensRepositorio.tokens).toHaveLength(0);
    expect(emailSender.enviarRecuperacion).not.toHaveBeenCalled();
  });

  it('lanza error cuando el envío del correo falla (CP-006-05)', async () => {
    await crearUsuario(repositorio, { email: 'ana@example.com' });

    emailSender.enviarRecuperacion = jest.fn().mockRejectedValue(new Error('Fallo SMTP'));

    const error = await casoUso.execute({ email: 'ana@example.com' }).catch((e) => e);

    expect(error.message).toBe('No se pudo enviar el correo de recuperación. Inténtalo de nuevo más tarde.');
  });
});

describe('CU-006 Recuperar contraseña (RestablecerContrasenaUseCase)', () => {
  let repositorio;
  let tokensRepositorio;
  let casoUso;
  let usuario;

  beforeEach(async () => {
    repositorio = new InMemoryUserRepository();
    tokensRepositorio = new InMemoryTokensRecuperacionRepository();
    casoUso = new RestablecerContrasenaUseCase(repositorio, tokensRepositorio);
    usuario = await crearUsuario(repositorio, { email: 'ana@example.com', password: 'Abcd1234' });
  });

  async function guardarToken(token = 'token-valido-123', expiraEn = null) {
    return tokensRepositorio.save({
      id_usuario: usuario.id,
      token,
      expira_en: expiraEn || new Date(Date.now() + 15 * 60 * 1000),
    });
  }

  it('actualiza la contraseña cifrada e invalida el token con uno válido', async () => {
    const passwordOriginal = usuario.password;
    await guardarToken();

    const resultado = await casoUso.execute({ token: 'token-valido-123', nueva_password: 'Nueva1234' });

    expect(resultado.mensaje).toBe(
      'Contraseña actualizada correctamente. Por favor inicie sesión'
    );
    expect((await tokensRepositorio.findByToken('token-valido-123')).usado).toBe(1);
    expect(repositorio.users[0].password).not.toBe(passwordOriginal);
    expect(await bcrypt.compare('Nueva1234', repositorio.users[0].password)).toBe(true);
  });

  it('rechaza con 400 un token expirado', async () => {
    await guardarToken('token-expirado', new Date(Date.now() - 1000));

    const error = await casoUso
      .execute({ token: 'token-expirado', nueva_password: 'Nueva1234' })
      .catch((e) => e);

    expect(error.status).toBe(400);
    expect(error.message).toBe('El token de recuperación ha expirado. Solicitelo nuevamente');
    expect(repositorio.users[0].password).toBe(usuario.password);
  });

  it('rechaza con 400 un token ya utilizado', async () => {
    await guardarToken('token-usado');
    await tokensRepositorio.marcarUsado('token-usado');

    const error = await casoUso
      .execute({ token: 'token-usado', nueva_password: 'Nueva1234' })
      .catch((e) => e);

    expect(error.status).toBe(400);
    expect(error.message).toBe('El token de recuperación ha expirado. Solicitelo nuevamente');
  });

  it('rechaza con 400 un token inexistente', async () => {
    const error = await casoUso
      .execute({ token: 'no-existe', nueva_password: 'Nueva1234' })
      .catch((e) => e);

    expect(error.status).toBe(400);
    expect(error.message).toBe('El token de recuperación ha expirado. Solicitelo nuevamente');
  });

  it('rechaza una contraseña débil (sin mayúscula, sin número o menor a 8 caracteres)', async () => {
    await guardarToken();

    const sinMayuscula = await casoUso
      .execute({ token: 'token-valido-123', nueva_password: 'abcdefg1' })
      .catch((e) => e);

    const sinNumero = await casoUso
      .execute({ token: 'token-valido-123', nueva_password: 'Abcdefgh' })
      .catch((e) => e);

    const corta = await casoUso
      .execute({ token: 'token-valido-123', nueva_password: 'Ab1' })
      .catch((e) => e);

    expect(sinMayuscula.message).toBe('La contraseña debe tener mínimo 8 caracteres, una mayúscula y un número');
    expect(sinNumero.message).toBe('La contraseña debe tener mínimo 8 caracteres, una mayúscula y un número');
    expect(corta.message).toBe('La contraseña debe tener mínimo 8 caracteres, una mayúscula y un número');
  });
});