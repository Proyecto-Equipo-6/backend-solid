import bcrypt from 'bcrypt';
import SolicitarRecuperacionUseCase from '../../application/SolicitarRecuperacionUseCase';
import RestablecerContrasenaUseCase from '../../application/RestablecerContrasenaUseCase';
import InMemoryTokensRecuperacionRepository from '../../infraestructure/repositories/in-memory/InMemoryTokensRecuperacionRepository';
import { crearRepositorio, crearUsuario } from './helpers/usuarios';

const MENSAJE_GENERICO = 'Recibirá un enlace de recuperación a su correo electrónico';

function crearTokensRepositorio() {
  return new InMemoryTokensRecuperacionRepository();
}

function crearEmailSender() {
  return { enviarRecuperacion: jest.fn().mockResolvedValue(true) };
}

describe('CU-006 Recuperar contraseña (SolicitarRecuperacionUseCase)', () => {
  let repositorio;
  let tokensRepositorio;
  let emailSender;
  let casoUso;

  beforeEach(() => {
    repositorio = crearRepositorio();
    tokensRepositorio = crearTokensRepositorio();
    emailSender = crearEmailSender();
    casoUso = new SolicitarRecuperacionUseCase(repositorio, tokensRepositorio, emailSender);
  });

  it('genera token válido y envía correo', async () => {
    // Arrange
    await crearUsuario(repositorio, { email: 'ana@example.com', password: 'Abcd1234' });
    const antes = Date.now();

    // Act
    const resultado = await casoUso.execute({ email: 'ana@example.com' });
    const despues = Date.now();

    // Assert
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

  it('no revela si el correo no existe', async () => {
    // Arrange
    const email = 'nadie@example.com';

    // Act
    const resultado = await casoUso.execute({ email });

    // Assert
    expect(resultado.mensaje).toBe(MENSAJE_GENERICO);
    expect(tokensRepositorio.tokens).toHaveLength(0);
    expect(emailSender.enviarRecuperacion).not.toHaveBeenCalled();
  });

  it('lanza error cuando el envío del correo falla', async () => {
    // Arrange
    await crearUsuario(repositorio, { email: 'ana@example.com', password: 'Abcd1234' });
    emailSender.enviarRecuperacion = jest.fn().mockRejectedValue(new Error('Fallo SMTP'));

    // Act & Assert
    await expect(
      casoUso.execute({ email: 'ana@example.com' })
    ).rejects.toThrow('No se pudo enviar el correo de recuperación. Inténtalo de nuevo más tarde.');
  });
});

describe('CU-006 Recuperar contraseña (RestablecerContrasenaUseCase)', () => {
  let repositorio;
  let tokensRepositorio;
  let casoUso;
  let usuario;

  beforeEach(async () => {
    repositorio = crearRepositorio();
    tokensRepositorio = crearTokensRepositorio();
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

  it('restablece contraseña y invalida token', async () => {
    // Arrange
    await guardarToken();
    const passwordOriginal = usuario.password;

    // Act
    const resultado = await casoUso.execute({
      token: 'token-valido-123',
      nueva_password: 'Nueva1234',
    });

    // Assert
    expect(resultado.mensaje).toBe('Contraseña actualizada correctamente. Por favor inicie sesión');
    expect((await tokensRepositorio.findByToken('token-valido-123')).usado).toBe(1);
    expect(repositorio.users[0].password).not.toBe(passwordOriginal);
    expect(await bcrypt.compare('Nueva1234', repositorio.users[0].password)).toBe(true);
  });

  it('rechaza token expirado', async () => {
    // Arrange
    await guardarToken('token-expirado', new Date(Date.now() - 1000));

    // Act & Assert
    await expect(
      casoUso.execute({ token: 'token-expirado', nueva_password: 'Nueva1234' })
    ).rejects.toMatchObject({ status: 400 });
    await expect(
      casoUso.execute({ token: 'token-expirado', nueva_password: 'Nueva1234' })
    ).rejects.toThrow('El token de recuperación ha expirado. Solicitelo nuevamente');
    expect(repositorio.users[0].password).toBe(usuario.password);
  });

  it('rechaza token ya utilizado', async () => {
    // Arrange
    await guardarToken('token-usado');
    await tokensRepositorio.marcarUsado('token-usado');

    // Act & Assert
    await expect(
      casoUso.execute({ token: 'token-usado', nueva_password: 'Nueva1234' })
    ).rejects.toMatchObject({ status: 400 });
    await expect(
      casoUso.execute({ token: 'token-usado', nueva_password: 'Nueva1234' })
    ).rejects.toThrow('El token de recuperación ha expirado. Solicitelo nuevamente');
  });

  it('rechaza token inexistente', async () => {
    // Arrange
    const token = 'no-existe';

    // Act & Assert
    await expect(
      casoUso.execute({ token, nueva_password: 'Nueva1234' })
    ).rejects.toMatchObject({ status: 400 });
    await expect(
      casoUso.execute({ token, nueva_password: 'Nueva1234' })
    ).rejects.toThrow('El token de recuperación ha expirado. Solicitelo nuevamente');
  });

  it('rechaza contraseña débil', async () => {
    // Arrange
    await guardarToken();
    const casos = ['abcdefg1', 'Abcdefgh', 'Ab1'];

    // Act & Assert
    for (const password of casos) {
      await expect(
        casoUso.execute({ token: 'token-valido-123', nueva_password: password })
      ).rejects.toMatchObject({ status: 400 });
      await expect(
        casoUso.execute({ token: 'token-valido-123', nueva_password: password })
      ).rejects.toThrow('La contraseña debe tener mínimo 8 caracteres, una mayúscula y un número');
    }
  });

  it('RN-021: rechaza si la nueva contraseña es igual a la anterior', async () => {
    // Arrange
    await guardarToken();

    // Act & Assert
    await expect(
      casoUso.execute({ token: 'token-valido-123', nueva_password: 'Abcd1234' })
    ).rejects.toMatchObject({ status: 400 });
    await expect(
      casoUso.execute({ token: 'token-valido-123', nueva_password: 'Abcd1234' })
    ).rejects.toThrow('La nueva contraseña debe ser diferente a la anterior');
    expect(repositorio.users[0].password).toBe(usuario.password);
  });
});
