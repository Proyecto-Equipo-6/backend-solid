/**
 * Caso de Uso: LogoutUseCase
 * Cierra la sesión de forma segura revocando el token JWT activo (RN-024).
 * RF-002.3 CA-001: cualquier intento posterior de consumir rutas protegidas
 * con el token anterior debe ser rechazado (401).
 */
class LogoutUseCase {
  constructor(tokenBlacklistRepository) {
    this.tokenBlacklistRepository = tokenBlacklistRepository;
  }

  async execute({ token }) {
    if (!token) {
      return { mensaje: 'Sesión cerrada correctamente' };
    }

    let expiraEn = null;

    try {
      const base64Payload = token.split('.')[1]
        .replace(/-/g, '+')
        .replace(/_/g, '/');

      const payload = JSON.parse(
        Buffer.from(base64Payload, 'base64').toString('utf8')
      );

      if (payload?.exp) {
        expiraEn = new Date(payload.exp * 1000);
      }
    } catch (error) {
      // No se pudo decodificar; se revoca sin expiración específica.
    }

    await this.tokenBlacklistRepository.agregar(token, expiraEn);
    return { mensaje: 'Sesión cerrada correctamente' };
  }
}

module.exports = LogoutUseCase;