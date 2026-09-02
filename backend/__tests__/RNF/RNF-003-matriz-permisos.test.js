const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const crearAutenticador = require('../../../backend/infraestructure/middlewares/autenticacion');
const { crearRequerirAdmin } = require('../../../backend/infraestructure/middlewares/autenticacion');
const createRolRouter = require('../../../backend/infraestructure/routes/rolRoutes');
const createUsuarioAdminRouter = require('../../../backend/infraestructure/routes/usuarioAdminRoutes');

const JWT_SECRET = 'secreto-rnf-003-03';

const controladorStub = {
  listar: (req, res) => res.status(200).json({ ok: true, roles: [] }),
  crear: (req, res) => res.status(201).json({ ok: true }),
  update: (req, res) => res.status(200).json({ ok: true }),
  eliminar: (req, res) => res.status(200).json({ ok: true }),
};

const controladorUsuariosStub = {
  listar: (req, res) => res.status(200).json({ ok: true, usuarios: [] }),
  crear: (req, res) => res.status(201).json({ ok: true }),
  actualizar: (req, res) => res.status(200).json({ ok: true }),
  actualizarEstado: (req, res) => res.status(200).json({ ok: true }),
  eliminar: (req, res) => res.status(200).json({ ok: true }),
};

function crearApp() {
  const app = express();
  app.use(express.json());

  const autenticar = crearAutenticador(JWT_SECRET);
  const requerirAdmin = crearRequerirAdmin(1);
  app.use('/api/v1/roles', createRolRouter(controladorStub, autenticar, requerirAdmin));
  app.use('/api/v1/admin/usuarios', createUsuarioAdminRouter(controladorUsuariosStub, autenticar, requerirAdmin));

  app.use((err, req, res, next) => {
    res.status(err.status || err.statusCode || 500).json({ error: err.message });
  });

  return app;
}

function tokenDeRol(idRol) {
  return jwt.sign({ id_usuario: 1, id_rol: idRol }, JWT_SECRET);
}

describe('RNF-003 CP-RNF-003-03: solo el rol Administrador gestiona la matriz de permisos', () => {
  const app = crearApp();

  test('una petición sin token es rechazada con 401', async () => {
    const res = await request(app).get('/api/v1/roles');
    expect(res.status).toBe(401);
  });

  test('un rol Cliente queda bloqueado con 403', async () => {
    const res = await request(app)
      .get('/api/v1/roles')
      .set('Authorization', `Bearer ${tokenDeRol(2)}`);
    expect(res.status).toBe(403);
    expect(res.body.error).toContain('Administrador');
  });

  test('un rol Repartidor queda bloqueado con 403', async () => {
    const res = await request(app)
      .get('/api/v1/roles')
      .set('Authorization', `Bearer ${tokenDeRol(3)}`);
    expect(res.status).toBe(403);
    expect(res.body.error).toContain('Administrador');
  });

  test('un rol inexistente queda bloqueado con 403', async () => {
    const res = await request(app)
      .get('/api/v1/roles')
      .set('Authorization', `Bearer ${tokenDeRol(99)}`);
    expect(res.status).toBe(403);
  });

  test('solo el rol Administrador (1) accede a la matriz de permisos', async () => {
    const res = await request(app)
      .get('/api/v1/roles')
      .set('Authorization', `Bearer ${tokenDeRol(1)}`);
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  test('la mutación de la matriz de permisos exige rol Administrador', async () => {
    const resCliente = await request(app)
      .post('/api/v1/roles')
      .set('Authorization', `Bearer ${tokenDeRol(2)}`)
      .send({ nombre: 'Nuevo' });
    expect(resCliente.status).toBe(403);

    const resAdmin = await request(app)
      .post('/api/v1/roles')
      .set('Authorization', `Bearer ${tokenDeRol(1)}`)
      .send({ nombre: 'Nuevo' });
    expect(resAdmin.status).toBe(201);
  });
});

describe('RNF-003 CP-RNF-003-01: un Cliente no puede modificar permisos ni funciones críticas', () => {
  const app = crearApp();

  test('un Cliente queda bloqueado al consultar la gestión de usuarios (403)', async () => {
    const res = await request(app)
      .get('/api/v1/admin/usuarios')
      .set('Authorization', `Bearer ${tokenDeRol(2)}`);
    expect(res.status).toBe(403);
  });

  test('un Cliente queda bloqueado al crear o editar usuarios (403)', async () => {
    const resCrear = await request(app)
      .post('/api/v1/admin/usuarios')
      .set('Authorization', `Bearer ${tokenDeRol(2)}`)
      .send({ email: 'x@example.com', password: 'Abcd1234' });
    expect(resCrear.status).toBe(403);

    const resEditar = await request(app)
      .put('/api/v1/admin/usuarios/1')
      .set('Authorization', `Bearer ${tokenDeRol(2)}`)
      .send({ email: 'x@example.com' });
    expect(resEditar.status).toBe(403);
  });

  test('una petición sin token a gestión de usuarios responde 401', async () => {
    const res = await request(app).get('/api/v1/admin/usuarios');
    expect(res.status).toBe(401);
  });

  test('solo el rol Administrador accede a la gestión de usuarios', async () => {
    const res = await request(app)
      .get('/api/v1/admin/usuarios')
      .set('Authorization', `Bearer ${tokenDeRol(1)}`);
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});