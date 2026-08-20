const CrearRolUseCase = require('../../application/crearRolUseCase');
const UpdateRolUseCase = require('../../application/UpdateRolUseCase');
const EliminarRolUseCase = require('../../application/eliminarRolUseCase');
const InMemoryRolesRepository = require('../../infraestructure/repositories/in-memory/InMemoryRolesRepository');
const InMemoryUserRepository = require('../../infraestructure/repositories/in-memory/InMemoryUserRepository');

describe('CU-024 Gestión de roles (crearRol / UpdateRol / eliminarRol)', () => {
  let rolesRepo;
  let userRepo;

  beforeEach(() => {
    rolesRepo = new InMemoryRolesRepository();
    userRepo = new InMemoryUserRepository();
  });

  describe('CrearRolUseCase', () => {
    it('CP-CU-024-01: crea un rol con nombre único (RN-104)', async () => {
      const casoUso = new CrearRolUseCase(rolesRepo);

      const rol = await casoUso.execute({ name: 'Vendedor', description: 'Ventas' });

      expect(rol.id).toBe(1);
      expect(rol.name).toBe('Vendedor');
    });

    it('rechaza un rol con nombre duplicado (RN-104)', async () => {
      const casoUso = new CrearRolUseCase(rolesRepo);
      await casoUso.execute({ name: 'Vendedor' });

      const error = await casoUso.execute({ name: 'vendedor' }).catch((e) => e);

      expect(error.status).toBe(409);
      expect(error.message).toBe('Ya existe un rol con ese nombre');
    });

    it('rechaza un rol sin nombre', async () => {
      const casoUso = new CrearRolUseCase(rolesRepo);

      const error = await casoUso.execute({ name: '' }).catch((e) => e);

      expect(error.message).toBe('El nombre del rol es obligatorio');
    });
  });

  describe('UpdateRolUseCase', () => {
    it('actualiza la descripción de un rol', async () => {
      const crear = new CrearRolUseCase(rolesRepo);
      const rol = await crear.execute({ name: 'Vendedor', description: 'Ventas' });
      const casoUso = new UpdateRolUseCase(rolesRepo);

      const actualizado = await casoUso.execute({ id: rol.id, name: 'Vendedor', description: 'Ventas y catálogo' });

      expect(actualizado.description).toBe('Ventas y catálogo');
    });

    it('rechaza renombrar un rol del sistema (RN-105 / RN-009-02)', async () => {
      rolesRepo.roles.push({ id: 1, name: 'Administrador', description: 'Admin' });
      const casoUso = new UpdateRolUseCase(rolesRepo);

      const error = await casoUso
        .execute({ id: 1, name: 'SuperAdmin', description: 'Admin' })
        .catch((e) => e);

      expect(error.status).toBe(409);
      expect(error.message).toBe('Los roles del sistema no pueden ser renombrados');
    });

    it('rechaza renombrar a un nombre duplicado (RN-104)', async () => {
      rolesRepo.roles.push({ id: 4, name: 'Cliente', description: 'Cliente' });
      rolesRepo.roles.push({ id: 5, name: 'Vendedor', description: 'Ventas' });
      const casoUso = new UpdateRolUseCase(rolesRepo);

      const error = await casoUso
        .execute({ id: 5, name: 'cliente', description: 'Ventas' })
        .catch((e) => e);

      expect(error.status).toBe(409);
      expect(error.message).toBe('Ya existe un rol con ese nombre');
    });
  });

  describe('EliminarRolUseCase', () => {
    it('elimina un rol sin usuarios asignados', async () => {
      rolesRepo.roles.push({ id: 4, name: 'Vendedor', description: 'Ventas' });
      const casoUso = new EliminarRolUseCase(rolesRepo, userRepo);

      const resultado = await casoUso.execute({ id: 4 });

      expect(resultado.eliminado).toBe(true);
    });

    it('rechaza eliminar un rol del sistema (RN-105 / RN-009-04)', async () => {
      rolesRepo.roles.push({ id: 1, name: 'Administrador', description: 'Admin' });
      rolesRepo.roles.push({ id: 2, name: 'Cliente', description: 'Cliente' });
      rolesRepo.roles.push({ id: 3, name: 'Repartidor', description: 'Repartidor' });
      const casoUso = new EliminarRolUseCase(rolesRepo, userRepo);

      for (const id of [1, 2, 3]) {
        const error = await casoUso.execute({ id }).catch((e) => e);
        expect(error.status).toBe(409);
        expect(error.message).toBe('Los roles del sistema no pueden ser eliminados');
      }
    });

    it('rechaza eliminar un rol asignado a usuarios', async () => {
      rolesRepo.roles.push({ id: 4, name: 'Vendedor', description: 'Ventas' });
      userRepo.users.push({ id: 1, id_rol: 4, email: 'a@a.com' });
      const casoUso = new EliminarRolUseCase(rolesRepo, userRepo);

      const error = await casoUso.execute({ id: 4 }).catch((e) => e);

      expect(error.status).toBe(409);
      expect(error.message).toBe('No se puede eliminar un rol que está asignado a usuarios');
    });
  });
});