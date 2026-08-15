const ErrorSesionExpirada = require('./errors/ErrorSesionExpirada');

/**
 * Caso de Uso: ObtenerPerfilUseCase
 * Consulta los datos del perfil del usuario autenticado (RN-014).
 * Solo depende de la abstracción (UserRepository).
 * Nunca expone la contraseña (RN-015).
 */
class ObtenerPerfilUseCase {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async execute({ id_usuario }) {
    const usuario = await this.userRepository.findById(id_usuario);
    if (!usuario) {
      throw new ErrorSesionExpirada();
    }

    return {
      id_usuario: usuario.id_usuario ?? usuario.id,
      id_rol: usuario.id_rol,
      nombre_apellido: usuario.nombre_apellido,
      tipo_documento: usuario.tipo_documento,
      numero_documento: usuario.numero_documento,
      email: usuario.email,
      telefono: usuario.telefono,
      direccion: usuario.direccion,
      activo: usuario.activo,
    };
  }
}

module.exports = ObtenerPerfilUseCase;
