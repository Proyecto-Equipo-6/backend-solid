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

    // Decodificar el payload sin verificar firma para conocer la expiración.
    let expiraEn = null;
    try {
      const payload any = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8'));
      if (payload && payload.exp) expiraEn = new Date(payload.exp * 1000);
    } catch {
      // Si el token no se puede decodificar, se revoca igualmente sin expiración.
    }

    await this.tokenBlacklistRepository.agregar(token, expiraEn);

    return { mensaje: 'Sesión cerrada correctamente' };
  }
}

module.exports = LogoutUseCase;