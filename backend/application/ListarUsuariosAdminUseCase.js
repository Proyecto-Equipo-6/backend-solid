/**
 * Caso de Uso: ListarUsuariosAdminUseCase
 * Lista todos los usuarios con filtros (CU-026).
 */
class ListarUsuariosAdminUseCase {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async execute(filtros = {}) {
    return await this.userRepository.findAll(filtros);
  }
}

module.exports = ListarUsuariosAdminUseCase;
