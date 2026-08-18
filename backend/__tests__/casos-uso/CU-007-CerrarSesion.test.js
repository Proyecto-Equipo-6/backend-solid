const AuthController = require('../../infraestructure/controllers/AuthController');

describe('CU-007 Cerrar sesión (AuthController.logout)', () => {
  function crearRespuestaFalsa() {
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      clearCookie: jest.fn().mockReturnThis(),
    };
    return res;
  }

  it('limpia la cookie de sesión y responde 200 con mensaje (CU-007)', async () => {
    const controlador = new AuthController(null, null, null);
    const req = {};
    const res = crearRespuestaFalsa();

    await controlador.logout(req, res);

    expect(res.clearCookie).toHaveBeenCalledWith('token');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ mensaje: 'Sesión cerrada correctamente' });
  });
});