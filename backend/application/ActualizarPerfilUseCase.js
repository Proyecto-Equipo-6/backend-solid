const bcrypt = require('bcrypt');
const ErrorSesionExpirada = require('./errors/ErrorSesionExpirada');
const ErrorNoAutorizado = require('./errors/ErrorNoAutorizado');
const ErrorConflicto = require('./errors/ErrorConflicto');

const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REGEX_TELEFONO = /^\d{10}$/;

/**
 * Caso de Uso: ActualizarPerfilUseCase
 * Actualiza los datos editables del perfil del usuario autenticado (CU-005).
 * Verifica la identidad mediante la contraseña actual (FP-003, RN-019).
 * El documento de identidad no es modificable (RN-018).
 * El correo debe ser único (RN-016 / RN-017).
 * Nunca expone la contraseña (RN-015).
 */
class ActualizarPerfilUseCase {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async execute({ id_usuario, password, datos = {} }) {
    const usuario = await this.userRepository.findById(id_usuario);
    if (!usuario) {
      throw new ErrorSesionExpirada();
    }

    if (!password) {
      throw new ErrorNoAutorizado('La contraseña actual es obligatoria');
    }

    const coincide = await bcrypt.compare(password, usuario.password);
    if (!coincide) {
      throw new ErrorNoAutorizado('La contraseña actual no es correcta');
    }

    const datosNuevos = this.normalizar(datos);
    this.validar(datosNuevos);

    if (this.sinCambios(usuario, datosNuevos)) {
      return {
        mensaje: 'No hay cambios para guardar',
        perfil: this.datosPublicos(usuario),
      };
    }

    if (
      usuario.email.toLowerCase() !== datosNuevos.email.toLowerCase()
    ) {
      const usuarioPorEmail = await this.userRepository.findByEmail(datosNuevos.email);
      if (usuarioPorEmail) {
        throw new ErrorConflicto('El correo electrónico ya se encuentra registrado');
      }
    }

    await this.userRepository.updatePerfil(id_usuario, datosNuevos);

    const actualizado = await this.userRepository.findById(id_usuario);

    return {
      mensaje: 'Perfil actualizado correctamente',
      perfil: this.datosPublicos(actualizado),
    };
  }

  normalizar(datos) {
    return {
      nombre_apellido: String(datos.nombre_apellido || '').trim(),
      email: String(datos.email || '').trim(),
      telefono: String(datos.telefono || '').trim(),
      direccion: String(datos.direccion || '').trim(),
    };
  }

  validar(datos) {
    const faltantes = [];

    if (!datos.nombre_apellido) faltantes.push('nombre_apellido');
    if (!datos.email) faltantes.push('email');
    if (!datos.telefono) faltantes.push('telefono');
    if (!datos.direccion) faltantes.push('direccion');

    if (faltantes.length > 0) {
      throw new Error(`Los campos ${faltantes.join(', ')} son obligatorios`);
    }

    if (!REGEX_EMAIL.test(datos.email)) {
      throw new Error('El correo electrónico no es válido');
    }

    if (!REGEX_TELEFONO.test(datos.telefono)) {
      throw new Error('El teléfono debe contener exactamente 10 dígitos');
    }
  }

  sinCambios(usuario, datos) {
    return (
      (usuario.nombre_apellido || '') === datos.nombre_apellido &&
      (usuario.email || '') === datos.email &&
      (usuario.telefono || '') === datos.telefono &&
      (usuario.direccion || '') === datos.direccion
    );
  }

  datosPublicos(usuario) {
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

module.exports = ActualizarPerfilUseCase;
