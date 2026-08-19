const User = require('../domain/models/User');
const ErrorConflicto = require('./errors/ErrorConflicto');
const bcrypt = require('bcrypt');

const ID_ROL_CLIENTE = 2;

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
    // Sanitizar: solo campos permitidos, ignorar id_rol del body
    const allowedFields = {
      nombre_apellido: userData.nombre_apellido,
      tipo_documento: userData.tipo_documento,
      numero_documento: userData.numero_documento,
      email: userData.email,
      password: userData.password,
      telefono: userData.telefono,
      direccion: userData.direccion,
    };
    const user = new User(allowedFields);

    if (!user.isValid()) {
      throw new Error('Por favor verifique los campos del formulario');
    }

    const usuarioPorEmail = await this.userRepository.findByEmail(user.email);
    if (usuarioPorEmail) {
      throw new ErrorConflicto('El correo electrónico ya se encuentra registrado');
    }

    const usuarioPorDocumento = await this.userRepository.findByNumeroDocumento(
      user.numero_documento
    );
    if (usuarioPorDocumento) {
      throw new ErrorConflicto('El número de documento ya se encuentra registrado');
    }

    const saltRounds = Number(process.env.BCRYPT_ROUNDS) || 10;
    user.password = await bcrypt.hash(user.password, saltRounds);
    user.id_rol = ID_ROL_CLIENTE;

    const guardado = await this.userRepository.save(user);

    const { password, ...datosPublicos } = guardado;
    return datosPublicos;
  }
}

module.exports = CreateUserUseCase;
