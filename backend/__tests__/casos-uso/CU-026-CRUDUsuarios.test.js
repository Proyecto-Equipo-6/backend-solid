const bcrypt = require('bcrypt');
const CrearUsuarioAdminUseCase = require('../../application/crearUsuarioAdminUseCase');
const ActualizarUsuarioAdminUseCase = require('../../application/actualizarUsuarioAdminUseCase');
const EliminarUsuarioAdminUseCase = require('../../application/eliminarUsuarioAdminUseCase');
const ActualizarEstadoUsuarioUseCase = require('../../application/ActualizarEstadoUsuarioUseCase');
const InMemoryUserRepository = require('../../infraestructure/repositories/in-memory/InMemoryUserRepository');

describe('CU-026 CRUD usuarios (admin)', () => {
  let repo;

  beforeEach(() => {
    repo = new InMemoryUserRepository();
  });

  const datosValidos = {
    id_rol: 2,
    nombre_apellido: 'Ana Torres',
    tipo_documento: 'CC',
    numero_documento: '1000000001',
    email: 'ana@example.com',
    password: 'Abcd1234',
    telefono: '3001234567',
    direccion: 'Calle 10 # 5-20, Medellín',
  };

  describe('CrearUsuarioAdminUseCase', () => {
    it('crea un usuario con datos válidos (RF-009.1)', async () => {
      const casoUso = new CrearUsuarioAdminUseCase(repo);

      const resultado = await casoUso.execute(datosValidos);

      expect(resultado.usuario.email).toBe('ana@example.com');
      expect(resultado.usuario.password).toBeUndefined();
      expect(resultado.usuario.activo).toBe(1);
    });

    it('rechaza email duplicado (RN-109)', async () => {
      await repo.save({ ...datosValidos, id: 1 });
      const casoUso = new CrearUsuarioAdminUseCase(repo);

      const error = await casoUso.execute(datosValidos).catch((e) => e);

      expect(error.status).toBe(409);
      expect(error.message).toBe('El correo electrónico ya se encuentra registrado');
    });

    it('rechaza documento duplicado (RN-109)', async () => {
      await repo.save({ ...datosValidos, id: 1, email: 'otro@example.com' });
      const casoUso = new CrearUsuarioAdminUseCase(repo);

      const error = await casoUso.execute(datosValidos).catch((e) => e);

      expect(error.status).toBe(409);
      expect(error.message).toBe('El número de documento ya se encuentra registrado');
    });

    it('rechaza contraseña menor a 8 caracteres (RF-009.1)', async () => {
      const casoUso = new CrearUsuarioAdminUseCase(repo);

      const error = await casoUso
        .execute({ ...datosValidos, password: 'Abc1' })
        .catch((e) => e);

      expect(error.status).toBe(400);
      expect(error.message).toBe('La contraseña debe tener entre 8 y 20 caracteres, una mayúscula, una minúscula y un número');
    });

    it('rechaza teléfono inválido', async () => {
      const casoUso = new CrearUsuarioAdminUseCase(repo);

      const error = await casoUso
        .execute({ ...datosValidos, telefono: '123' })
        .catch((e) => e);

      expect(error.status).toBe(400);
      expect(error.message).toBe('El teléfono debe tener exactamente 10 dígitos');
    });
  });

  describe('ActualizarUsuarioAdminUseCase', () => {
    beforeEach(async () => {
      await repo.save({ ...datosValidos, id: 1 });
      await repo.save({ ...datosValidos, id: 2, email: 'luis@example.com', numero_documento: '1000000002' });
    });

    it('actualiza los datos de un usuario', async () => {
      const casoUso = new ActualizarUsuarioAdminUseCase(repo);

      const resultado = await casoUso.execute({ id: 1, nombre_apellido: 'Ana María Torres' });

      expect(resultado.usuario.nombre_apellido).toBe('Ana María Torres');
      expect(resultado.usuario.password).toBeUndefined();
    });

    it('rechaza cambiar el email a uno ya registrado (RN-109)', async () => {
      const casoUso = new ActualizarUsuarioAdminUseCase(repo);

      const error = await casoUso
        .execute({ id: 1, email: 'luis@example.com' })
        .catch((e) => e);

      expect(error.status).toBe(400);
      expect(error.message).toBe('El correo electrónico ya se encuentra registrado');
    });

    it('permite conservar el propio email sin marcarlo como duplicado', async () => {
      const casoUso = new ActualizarUsuarioAdminUseCase(repo);

      const resultado = await casoUso.execute({ id: 1, email: 'ana@example.com' });

      expect(resultado.usuario.email).toBe('ana@example.com');
    });

    it('rechaza actualizar un usuario inexistente', async () => {
      const casoUso = new ActualizarUsuarioAdminUseCase(repo);

      const error = await casoUso.execute({ id: 999, nombre_apellido: 'X' }).catch((e) => e);

      expect(error.status).toBe(404);
      expect(error.message).toBe('Usuario no encontrado');
    });
  });

  describe('EliminarUsuarioAdminUseCase', () => {
    it('desactiva un usuario (borrado lógico)', async () => {
      await repo.save({ ...datosValidos, id: 1 });
      const casoUso = new EliminarUsuarioAdminUseCase(repo);

      const resultado = await casoUso.execute({ id: 1, adminId: 99 });

      expect(resultado.activo).toBe(0);
    });

    it('impide desactivar la propia cuenta del admin (RN-111)', async () => {
      await repo.save({ ...datosValidos, id: 1 });
      const casoUso = new EliminarUsuarioAdminUseCase(repo);

      const error = await casoUso.execute({ id: 1, adminId: 1 }).catch((e) => e);

      expect(error.status).toBe(400);
      expect(error.message).toBe('No puedes desactivar tu propia cuenta de administrador');
    });
  });

  describe('ActualizarEstadoUsuarioUseCase', () => {
    it('activa/desactiva un usuario (CP-CU-026-02)', async () => {
      await repo.save({ ...datosValidos, id: 1 });
      const casoUso = new ActualizarEstadoUsuarioUseCase(repo);

      const desactivado = await casoUso.execute({ id_usuario: 1, activo: false, adminId: 99 });
      expect(desactivado.activo).toBe(0);

      const activado = await casoUso.execute({ id_usuario: 1, activo: true, adminId: 99 });
      expect(activado.activo).toBe(1);
    });

    it('impide auto-desactivación (RN-111)', async () => {
      await repo.save({ ...datosValidos, id: 1 });
      const casoUso = new ActualizarEstadoUsuarioUseCase(repo);

      const error = await casoUso
        .execute({ id_usuario: 1, activo: false, adminId: 1 })
        .catch((e) => e);

      expect(error.message).toBe('No puedes desactivar tu propia cuenta. Solicita a otro administrador.');
    });
  });

  });