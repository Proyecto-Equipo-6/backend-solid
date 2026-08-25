import jwt from 'jsonwebtoken';
import AuthController from '../../infraestructure/controllers/AuthController';
import LogoutUseCase from '../../application/LogoutUseCase';
import InMemoryTokenBlacklistRepository from '../../infraestructure/repositories/in-memory/InMemoryTokenBlacklistRepository';
import crearAutenticador from '../../infraestructure/middlewares/autenticacion';

function crearRespuestaFalsa() {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    clearCookie: jest.fn().mockReturnThis(),
  };
  return res;
}

describe('CU-007 Cerrar sesión (LogoutUseCase + AuthController.logout)', () => {
  it('CP-CU-007-01 / CP-RF-002.3-01 / CP-HU-002.3-01: revoca token y limpia cookie', async () => {
    // Arrange
    const blacklist = new InMemoryTokenBlacklistRepository();
    const logoutUseCase = new LogoutUseCase(blacklist);
    const controlador = new AuthController(null, null, null, logoutUseCase);
    const token = 'token-de-prueba-123';
    const req = { cookies: { token } };
    const res = crearRespuestaFalsa();

    // Act
    await controlador.logout(req, res);

    // Assert
    await expect(blacklist.estaRevocado(token)).resolves.toBe(true);
    expect(res.clearCookie).toHaveBeenCalledWith('token');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ mensaje: 'Sesión cerrada correctamente' });
  });

  it('CP-CU-007-03: no falla si no hay token en la cookie', async () => {
    // Arrange
    const blacklist = new InMemoryTokenBlacklistRepository();
    const logoutUseCase = new LogoutUseCase(blacklist);
    const controlador = new AuthController(null, null, null, logoutUseCase);
    const req = { cookies: {} };
    const res = crearRespuestaFalsa();

    // Act
    await controlador.logout(req, res);

    // Assert
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('CP-HU-002.3-02: middleware rechaza token revocado con 401', async () => {
    // Arrange
    const blacklist = new InMemoryTokenBlacklistRepository();
    const autenticar = crearAutenticador('secreto', blacklist);
    const token = jwt.sign({ id_usuario: 1, id_rol: 2 }, 'secreto', { expiresIn: '30m' });
    await blacklist.agregar(token, new Date(Date.now() + 30 * 60 * 1000));

    const req = { cookies: { token } };
    const res = {};
    const next = jest.fn();

    // Act
    await autenticar(req, res, next);

    // Assert
    expect(next).toHaveBeenCalled();
    expect(next.mock.calls[0][0]).toMatchObject({ status: 401 });
  });

  it('acepta token no revocado y asigna usuario', async () => {
    // Arrange
    const blacklist = new InMemoryTokenBlacklistRepository();
    const autenticar = crearAutenticador('secreto', blacklist);
    const token = jwt.sign({ id_usuario: 1, id_rol: 2 }, 'secreto', { expiresIn: '30m' });

    const req = { cookies: { token } };
    const res = {};
    const next = jest.fn();

    // Act
    await autenticar(req, res, next);

    // Assert
    expect(next).toHaveBeenCalled();
    expect(next.mock.calls[0][0]).toBeUndefined();
    expect(req.usuario.id_usuario).toBe(1);
  });
});