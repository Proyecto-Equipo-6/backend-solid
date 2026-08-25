const ErrorConflicto = require('./errors/ErrorConflicto');
const ErrorValidacion = require('./errors/ErrorValidacion');
const { ROL_REPARTIDOR } = require('../constants');
const bcrypt = require('bcrypt');

/**
 * Caso de Uso: CrearRepartidorAdminUseCase
 * Crea un repartidor (usuario con rol repartidor + registro en la tabla repartidores).
 */
class CrearRepartidorAdminUseCase {
  constructor(userRepository, repartidorRepository) {
    this.userRepository = userRepository;
    this.repartidorRepository = repartidorRepository;
  }

  async execute(datos) {
    const { nombre_apellido, email, password, telefono, vehiculo = '', placa = '' } = datos;

    if (!nombre_apellido || !String(nombre_apellido).trim()) {
      throw new ErrorValidacion('El nombre es obligatorio');
    }
    if (!email || !String(email).includes('@')) {
      throw new ErrorValidacion('Correo electrónico inválido');
    }
    if (!password || String(password).length < 8 || String(password).length > 20) {
      throw new ErrorValidacion('La contraseña debe tener entre 8 y 20 caracteres');
    }
    if (!telefono || !/^\d{10}$/.test(String(telefono))) {
      throw new ErrorValidacion('El teléfono debe tener exactamente 10 dígitos');
    }

    const existenteEmail = await this.userRepository.findByEmail(email);
    if (existenteEmail) {
      throw new ErrorConflicto('El correo electrónico ya se encuentra registrado');
    }

    const saltRounds = Number(process.env.BCRYPT_ROUNDS) || 10;
    const passwordHash = await bcrypt.hash(String(password), saltRounds);

    const usuario = await this.userRepository.save({
      id_rol: ROL_REPARTIDOR,
      nombre_apellido: String(nombre_apellido).trim(),
      tipo_documento: 'CC',
      numero_documento: null,
      email: String(email).trim(),
      password: passwordHash,
      telefono: String(telefono).trim(),
      direccion: datos.direccion || null,
      activo: 1,
    });

    const idUsuario = usuario.id ?? usuario.id_usuario;
    await this.repartidorRepository.crear({
      id_usuario: idUsuario,
      vehiculo: String(vehiculo).trim(),
      placa: String(placa).trim(),
    });

    return { mensaje: 'Repartidor creado correctamente.', id_usuario: idUsuario };
  }
}

module.exports = CrearRepartidorAdminUseCase;