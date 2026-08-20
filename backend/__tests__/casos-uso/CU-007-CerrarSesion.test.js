const AuthController = require('../../infraestructure/controllers/AuthController');
const LogoutUseCase = require('../../application/LogoutUseCase');
const InMemoryTokenBlacklistRepository = require('../../infraestructure/repositories/in-memory/InMemoryTokenBlacklistRepository');

describe('CU-007 Cerrar sesión (LogoutUseCase + AuthController.logout)', () => {
  function crearRespuestaFalsa() {
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      clearCookie: jest.fn().mockReturnThis(),
    };
    return res;
  }

  it('revoca el token en el servidor y limpia la cookie (RN-024)', async () => {
    const blacklist = new InMemoryTokenBlacklistRepository();
    const logoutUseCase = new LogoutUseCase(blacklist);
    const controlador = new AuthController(null, null, null, logoutUseCase);
    const token = 'token-de-prueba-123';
    const req = { cookies: { token } };
    const res = crearRespuestaFalsa();

    await controlador.logout(req, res);

    expect(await blacklist.estaRevocado(token)).toBe(true);
    expect(res.clearCookie).toHaveBeenCalledWith('token');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ mensaje: 'Sesión cerrada correctamente' });
  });

  it('no falla si no hay token en la cookie', async () => {
    const blacklist = new InMemoryTokenBlacklistRepository();
    const logoutUseCase = new LogoutUseCase(blacklist);
    const controlador = new AuthController(null, null, null, logoutUseCase);
    const req = { cookies: {} };
    const res = crearRespuestaFalsa();

    await controlador.logout(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('el middleware rechaza un token revocado con 401 (RF-002.3 CA-001)', async () => {
    const jwt = require('jsonwebtoken');
    const crearAutenticador = require('../../infraestructure/middlewares/autenticacion');
    const blacklist = new InMemoryTokenBlacklistRepository();
    const autenticar = crearAutenticador('secreto', blacklist);

    const token = jwt.sign({ id_usuario: 1, id_rol: 2 }, 'secreto', { expiresIn: '30m' });
    await blacklist.agregar(token, new Date(Date.now() + 30 * 60 * 1000));

    const req = { cookies: { token } };
    const res = {};
    const next = jest.fn();

    await autenticar(req, res, next);

    expect(next).toHaveBeenCalled();
    const error = next.mock.calls[0][0];
    expect(error.status).toBe(401);
  });

  it('el middleware acepta un token no revocado', async () => {
    const jwt = require('jsonwebtoken');
    const crearAutenticador = require('../../infraestructure/middlewares/autenticacion');
    const blacklist = new InMemoryTokenBlacklistRepository();
    const autenticar = crearAutenticador('secreto', blacklist);

    const token = jwt.sign({ id_usuario: 1, id_rol: 2 }, 'secreto', { expiresIn: '30m' });

    const req = { cookies: { token } };
    const res = {};
    const next = jest.fn();

    await autenticar(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(next.mock.calls[0][0]).toBeUndefined();
    expect(req.usuario.id_usuario).toBe(1);
  });
});