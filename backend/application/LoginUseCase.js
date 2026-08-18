const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const ErrorNoAutorizado = require('./errors/ErrorNoAutorizado');
const ErrorAccesoDenegado = require('./errors/ErrorAccesoDenegado');

/**
 * Caso de Uso: LoginUseCase
 * Contiene la lógica de aplicación para iniciar sesión.
 * Solo depende de la abstracción (UserRepository) y del secreto JWT inyectado.
 */
class LoginUseCase {
  constructor(userRepository, jwtSecret, jwtExpiresIn = '30m') {
    this.userRepository = userRepository;
    this.jwtSecret = jwtSecret;
    this.jwtExpiresIn = jwtExpiresIn;
  }

  async execute({ email, password }) {
    if (!email || !password) {
      throw new ErrorNoAutorizado();
    }

    const usuario = await this.userRepository.findByEmail(email);
    if (!usuario) {
      throw new ErrorNoAutorizado();
    }

    if (usuario.activo !== 1) {
      throw new ErrorAccesoDenegado();
    }

    const coincide = await bcrypt.compare(password, usuario.password);
    if (!coincide) {
      throw new ErrorNoAutorizado();
    }

    const idUsuario = usuario.id_usuario ?? usuario.id;
    const payload = {
      id_usuario: idUsuario,
      id_rol: usuario.id_rol,
      email: usuario.email,
      nombre_apellido: usuario.nombre_apellido,
    };

    const token = jwt.sign(payload, this.jwtSecret, { expiresIn: this.jwtExpiresIn });

    const { password: _, ...datosPublicos } = usuario;
    return { token, usuario: { ...datosPublicos, id_usuario: idUsuario } };
  }
}

module.exports = LoginUseCase;
