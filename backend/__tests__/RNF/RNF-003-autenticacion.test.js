const jwt = require('jsonwebtoken');
const crearAutenticador = require('../../../backend/infraestructure/middlewares/autenticacion');
const {
  crearRequerirCliente,
  crearRequerirRepartidor,
} = require('../../../backend/infraestructure/middlewares/autenticacion');
const ErrorSesionExpirada = require('../../../backend/application/errors/ErrorSesionExpirada');

const JWT_SECRET = 'secreto-rnf-003';

describe('RNF-003 CP-RNF-003-02: bloqueo de Repartidor y de peticiones sin token', () => {
  test('una petición sin token es rechazada con ErrorSesionExpirada (HTTP 401)', async () => {
    const autenticar = crearAutenticador(JWT_SECRET);
    const req = { cookies: {}, headers: {} };
    const next = jest.fn();

    await autenticar(req, {}, next);

    expect(next).toHaveBeenCalledTimes(1);
    const error = next.mock.calls[0][0];
    expect(error).toBeInstanceOf(ErrorSesionExpirada);
    expect(error.status).toBe(401);
  });

  test('un token inválido o expirado también es rechazado con 401', async () => {
    const autenticar = crearAutenticador(JWT_SECRET);
    const token = jwt.sign({ id_usuario: 1, id_rol: 1 }, 'otro-secreto');
    const req = { cookies: {}, headers: { authorization: `Bearer ${token}` } };
    const next = jest.fn();

    await autenticar(req, {}, next);

    const error = next.mock.calls[0][0];
    expect(error.status).toBe(401);
    expect(req.usuario).toBeUndefined();
  });

  test('un usuario rol Repartidor queda bloqueado en rutas de Cliente (HTTP 403)', () => {
    const requerirCliente = crearRequerirCliente(2);
    const req = { usuario: { id_rol: 3 } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    requerirCliente(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test('un usuario sin sesión no pasa la restricción de rol (HTTP 403)', () => {
    const requerirCliente = crearRequerirCliente(2);
    const req = {};
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    requerirCliente(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test('un Repartidor sí accede a sus propias rutas', () => {
    const requerirRepartidor = crearRequerirRepartidor(3);
    const req = { usuario: { id_rol: 3 } };
    const next = jest.fn();

    requerirRepartidor(req, {}, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  test('un token válido de Repartidor adjunta el payload autenticado', async () => {
    const autenticar = crearAutenticador(JWT_SECRET);
    const token = jwt.sign({ id_usuario: 7, id_rol: 3 }, JWT_SECRET);
    const req = { cookies: {}, headers: { authorization: `Bearer ${token}` } };
    const next = jest.fn();

    await autenticar(req, {}, next);

    expect(req.usuario).toMatchObject({ id_usuario: 7, id_rol: 3 });
    expect(next).toHaveBeenCalledTimes(1);
  });

  test('un Cliente queda bloqueado en rutas de Repartidor (HTTP 403)', () => {
    const requerirRepartidor = crearRequerirRepartidor(3);
    const req = { usuario: { id_rol: 2 } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    requerirRepartidor(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});