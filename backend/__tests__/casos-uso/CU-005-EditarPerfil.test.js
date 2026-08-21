import bcrypt from 'bcrypt';
import ActualizarPerfilUseCase from '../../application/ActualizarPerfilUseCase';
import InMemoryUserRepository from '../../infraestructure/repositories/in-memory/InMemoryUserRepository';

const datosValidos = {
  nombre_apellido: 'Ana María Torres',
  email: 'ana.nueva@example.com',
  telefono: '3109876543',
  direccion: 'Av. El Poblado # 1-10, Medellín',
};

function crearRepositorio() {
  return new InMemoryUserRepository();
}

function crearCasoUso(repositorio) {
  return new ActualizarPerfilUseCase(repositorio);
}

async function guardarUsuario(repositorio, {
  id,
  id_rol = 2,
  nombre_apellido,
  tipo_documento = 'CC',
  numero_documento,
  email,
  password,
  telefono,
  direccion,
  activo = 1,
}) {
  const hash = await bcrypt.hash(password, 4);
  await repositorio.save({
    id,
    id_rol,
    nombre_apellido,
    tipo_documento,
    numero_documento,
    email,
    password: hash,
    telefono,
    direccion,
    activo,
  });
}

describe('CU-005 Editar perfil (ActualizarPerfilUseCase)', () => {
  let repositorio;
  let casoUso;

  beforeEach(async () => {
    repositorio = crearRepositorio();
    casoUso = crearCasoUso(repositorio);

    await guardarUsuario(repositorio, {
      id: 1,
      nombre_apellido: 'Ana Torres',
      numero_documento: '1000000001',
      email: 'ana@example.com',
      password: 'Abcd1234',
      telefono: '3001234567',
      direccion: 'Calle 10 # 5-20, Medellín',
    });

    await guardarUsuario(repositorio, {
      id: 2,
      nombre_apellido: 'Luis Mora',
      numero_documento: '1000000002',
      email: 'luis@example.com',
      password: 'Abcd1234',
      telefono: '3001234568',
      direccion: 'Carrera 15 # 20-30, Bogotá',
    });
  });

  it('CP-CU-005-01: actualiza los datos editables y retorna el perfil sin contraseña', async () => {
    // Arrange
    const datos = { ...datosValidos };

    // Act
    const resultado = await casoUso.execute({
      id_usuario: 1,
      password: 'Abcd1234',
      datos,
    });

    // Assert
    expect(resultado.mensaje).toBe('Perfil actualizado correctamente');
    expect(resultado.perfil).toMatchObject(datos);
    expect(resultado.perfil.password).toBeUndefined();
    expect(resultado.perfil.numero_documento).toBe('1000000001');
  });

  it('CP-CU-005-02: rechaza el cambio de correo a uno ya registrado por otro usuario', async () => {
    // Arrange
    const datos = { ...datosValidos, email: 'luis@example.com' };

    // Act & Assert
    await expect(
      casoUso.execute({ id_usuario: 1, password: 'Abcd1234', datos })
    ).rejects.toMatchObject({ status: 409 });
    await expect(
      casoUso.execute({ id_usuario: 1, password: 'Abcd1234', datos })
    ).rejects.toThrow('El correo electrónico ya se encuentra registrado');
  });

  it('CP-CU-005-03: rechaza campos obligatorios vacíos al editar', async () => {
    // Arrange
    const camposObligatorios = ['nombre_apellido', 'email', 'telefono', 'direccion'];

    // Act & Assert
    for (const campo of camposObligatorios) {
      const datosInvalidos = { ...datosValidos, [campo]: '' };
      await expect(
        casoUso.execute({ id_usuario: 1, password: 'Abcd1234', datos: datosInvalidos })
      ).rejects.toMatchObject({ status: 400 });
    }
  });

  it('rechaza actualización con teléfono inválido y error 400', async () => {
    // Arrange
    const datosInvalidos = { ...datosValidos, telefono: 'letras123' };

    // Act & Assert
    await expect(
      casoUso.execute({ id_usuario: 1, password: 'Abcd1234', datos: datosInvalidos })
    ).rejects.toMatchObject({ status: 400 });
    await expect(
      casoUso.execute({ id_usuario: 1, password: 'Abcd1234', datos: datosInvalidos })
    ).rejects.toThrow('El teléfono debe contener exactamente 10 dígitos');
  });

  it('CP-CU-005-04: notifica cuando no hay cambios que guardar', async () => {
    // Arrange
    const datosSinCambios = {
      nombre_apellido: 'Ana Torres',
      email: 'ana@example.com',
      telefono: '3001234567',
      direccion: 'Calle 10 # 5-20, Medellín',
    };

    // Act
    const resultado = await casoUso.execute({
      id_usuario: 1,
      password: 'Abcd1234',
      datos: datosSinCambios,
    });

    // Assert
    expect(resultado.mensaje).toBe('No hay cambios para guardar');
  });

  it('CP-CU-005-05: el documento de identidad no se modifica aunque se envíe un valor nuevo', async () => {
    // Arrange
    const datos = { ...datosValidos, numero_documento: '999999999' };

    // Act
    const resultado = await casoUso.execute({
      id_usuario: 1,
      password: 'Abcd1234',
      datos,
    });

    // Assert
    expect(resultado.perfil.numero_documento).toBe('1000000001');
  });

  it('rechaza la edición si la contraseña actual no es correcta', async () => {
    // Arrange
    const datos = { ...datosValidos };

    // Act & Assert
    await expect(
      casoUso.execute({ id_usuario: 1, password: 'incorrecta', datos })
    ).rejects.toMatchObject({ status: 401 });
    await expect(
      casoUso.execute({ id_usuario: 1, password: 'incorrecta', datos })
    ).rejects.toThrow('La contraseña actual no es correcta');
  });

  it('permite conservar el propio correo sin marcarlo como duplicado', async () => {
    // Arrange
    const datos = { ...datosValidos, email: 'ana@example.com' };

    // Act
    const resultado = await casoUso.execute({
      id_usuario: 1,
      password: 'Abcd1234',
      datos,
    });

    // Assert
    expect(resultado.mensaje).toBe('Perfil actualizado correctamente');
    expect(resultado.perfil.email).toBe('ana@example.com');
  });

  it('actualiza solo la dirección sin exigir contraseña actual', async () => {
    // Arrange
    const datos = { direccion: 'Calle 80 # 45-10, Envigado' };

    // Act
    const resultado = await casoUso.execute({
      id_usuario: 1,
      datos,
    });

    // Assert
    expect(resultado.mensaje).toBe('Perfil actualizado correctamente');
    expect(resultado.perfil.direccion).toBe('Calle 80 # 45-10, Envigado');
    expect(resultado.perfil.nombre_apellido).toBe('Ana Torres');
  });

  it('lanza 401 si el usuario autenticado ya no existe', async () => {
    // Arrange
    const idUsuario = 999;

    // Act & Assert
    await expect(
      casoUso.execute({ id_usuario: idUsuario, password: 'Abcd1234', datos: datosValidos })
    ).rejects.toMatchObject({ status: 401 });
  });
});