/**
 * Adaptador de Infraestructura: AuthController
 * Maneja las peticiones HTTP de autenticación y las delega al Caso de Uso.
 */
class AuthController {
  constructor(loginUseCase, solicitarRecuperacionUseCase, restablecerContrasenaUseCase) {
    this.loginUseCase = loginUseCase;
    this.solicitarRecuperacionUseCase = solicitarRecuperacionUseCase;
    this.restablecerContrasenaUseCase = restablecerContrasenaUseCase;
  }

  async login(req, res) {
    try {
      const { token, usuario } = await this.loginUseCase.execute(req.body);

      const duracionMinutos = Number(process.env.JWT_EXPIRES_IN_MIN) || 30;
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: duracionMinutos * 60 * 1000,
      });

      return res.status(200).json({ usuario });
    } catch (error) {
      const status = error.status || 401;
      return res.status(status).json({ error: error.message });
    }
  }

  async logout(req, res) {
    try {
      res.clearCookie('token');
      return res.status(200).json({ mensaje: 'Sesión cerrada correctamente' });
    } catch (error) {
      console.error('Error al cerrar la sesión:', error);
      return res.status(500).json({ error: 'Error al cerrar la sesión' });
    }
  }

  async recuperar(req, res) {
    try {
      const resultado = await this.solicitarRecuperacionUseCase.execute(req.body);
      return res.status(200).json(resultado);
    } catch (error) {
      const status = error.status || 500;
      return res.status(status).json({ error: error.message });
    }
  }

  async restablecer(req, res) {
    try {
      const resultado = await this.restablecerContrasenaUseCase.execute(req.body);
      return res.status(200).json(resultado);
    } catch (error) {
      const status = error.status || 400;
      return res.status(status).json({ error: error.message });
    }
  }
}

module.exports = AuthController;
