const User = require('../domain/models/User');

/**
 * Caso de Uso: CreateUserUseCase
 * Contiene la lógica de aplicación para crear un usuario.
 * Solo depende de la abstracción (UserRepository), no de bases de datos específicas.
 */
class CreateUserUseCase {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async execute(userData) {
    const { id, name, email } = userData;
    const user = new User(id, name, email);

    // Validación del dominio
    if (!user.isValid()) {
      throw new Error("Datos de usuario inválidos.");
    }

    // Regla de negocio: verificar si ya existe el email
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new Error("El email ya está registrado.");
    }

    // Guardar en repositorio a través del puerto
    return await this.userRepository.save(user);
  }
}

module.exports = CreateUserUseCase;
