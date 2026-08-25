const { ROL_REPARTIDOR } = require('../constants');
const {
  validarNombreObligatorio,
  validarEmailFormato,
  validarPasswordLongitud,
  validarTelefono,
  validarEmailUnico,
  hashPassword,
} = require('./usuarioValidationsHelper');

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
    const { nombre_apellido, email, password, telefono } = datos;

    validarNombreObligatorio(nombre_apellido);
    validarEmailFormato(email);
    validarPasswordLongitud(password, 'La contraseña debe tener entre 8 y 20 caracteres, una mayúscula, una minúscula y un número');
    validarTelefono(telefono);

    await validarEmailUnico(this.userRepository, email);

    const passwordHash = await hashPassword(password);

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
    await this.repartidorRepository.crear({ id_usuario: idUsuario });

    return { mensaje: 'Repartidor creado correctamente.', id_usuario: idUsuario };
  }
}

module.exports = CrearRepartidorAdminUseCase;