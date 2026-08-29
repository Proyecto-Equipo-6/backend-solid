/**
 * Helpers compartidos de Usuario para tests (backend/__tests__/helpers/).
 * Extrae lo idéntico entre CU-002 (RegistrarCuenta) y CU-003 (IniciarSesion):
 * datos de usuario válidos, repositorio InMemory y creación de usuario con hash.
 *
 * NOTA: `crearCasoUso` NO va aquí porque cada test usa un use case distinto
 * (CreateUserUseCase vs LoginUseCase con JWT_SECRET_PRUEBA).
 */
const bcrypt = require('bcrypt');
const InMemoryUserRepository = require('../../infraestructure/repositories/in-memory/InMemoryUserRepository.js');

const datosValidos = {
  nombre_apellido: 'Ana Torres',
  tipo_documento: 'CC',
  numero_documento: '1000000001',
  email: 'ana@example.com',
  password: 'Abcd1234', // 8 caracteres, mayúscula y número
  telefono: '3001234567',
  direccion: 'Calle 10 # 5-20, Medellín',
};

function crearRepositorio() {
  return new InMemoryUserRepository();
}

/**
 * Crea y guarda un usuario en el repositorio con password hasheado.
 * @param {InMemoryUserRepository} repositorio
 * @param {Object} opts - { email, password, activo = 1, id_rol = 2 }
 * @returns {Promise<Object>} usuario guardado
 */
async function crearUsuario(repositorio, { email, password, activo = 1, id_rol = 2 }) {
  const usuario = {
    id: repositorio.users.length + 1,
    id_rol,
    nombre_apellido: 'Ana Torres',
    tipo_documento: 'CC',
    numero_documento: `10000000${repositorio.users.length}`,
    email,
    password: await bcrypt.hash(password, 4),
    telefono: '3001234567',
    direccion: 'Calle 10 # 5-20, Medellín',
    activo,
  };
  return repositorio.save(usuario);
}

module.exports = { datosValidos, crearRepositorio, crearUsuario };