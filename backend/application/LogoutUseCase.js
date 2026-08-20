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
      // El payload JWT está en base64url, convertir a base64 estándar
      const base64Payload = token.split('.')[1]
        .replace(/-/g, '+')
        .replace(/_/g, '/');
      
      // Decodificar y parsear
      const payload = JSON.parse(
        Buffer.from(base64Payload, 'base64').toString('utf8')
      );
      
      if (payload?.exp) {
        expiraEn = new Date(payload.exp * 1000);
      }
    } catch (error) {
      // Si el token no se puede decodificar, se revoca igualmente sin expiración.
      // Puedes loggear el error si es necesario para depuración
      console.debug('Error decodificando token:', error.message);
    }

    // IMPORTANTE: Esta línea estaba dentro del catch, debe estar fuera
    await this.tokenBlacklistRepository.agregar(token, expiraEn);
    return { mensaje: 'Sesión cerrada correctamente' };
  }
}

module.exports = LogoutUseCase;