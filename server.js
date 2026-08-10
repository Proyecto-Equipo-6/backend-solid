require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const MySQLUserRepository = require('./backend/infraestructure/repositories/mysql/MySQLUserRepository');
const CreateUserUseCase = require('./backend/application/CreateUserUseCase');
const UserController = require('./backend/infraestructure/controllers/UserController');
const createUserRouter = require('./backend/infraestructure/routes/userRoutes');
const MySQLRolesRepository = require('./backend/infraestructure/repositories/mysql/MySQLRolesRepository');
const UpdateRolUseCase = require('./backend/application/UpdateRolUseCase');
const AdminUpdateRolController = require('./backend/infraestructure/controllers/AdminUpdateRolController');
const createRolRouter = require('./backend/infraestructure/routes/rolRoutes');
const LoginUseCase = require('./backend/application/LoginUseCase');
const AuthController = require('./backend/infraestructure/controllers/AuthController');
const createAuthRouter = require('./backend/infraestructure/routes/authRoutes');

const app = express();
app.disable('x-powered-by');
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// --- Inyección de Dependencias (DIP) ---
// 1. Inicializamos el adaptador de infraestructura (Base de Datos / Repositorio)
const userRepository = new MySQLUserRepository();

// 2. Inicializamos el caso de uso inyectándole su dependencia (el Repositorio)
const createUserUseCase = new CreateUserUseCase(userRepository);

// 3. Inicializamos el controlador inyectándole el caso de uso
const userController = new UserController(createUserUseCase);

// --- Inyección de Dependencias para Roles (DIP) ---
const rolesRepository = new MySQLRolesRepository();
const updateRolUseCase = new UpdateRolUseCase(rolesRepository);
const adminUpdateRolController = new AdminUpdateRolController(updateRolUseCase);

// --- Inyección de Dependencias para Autenticación (DIP) ---
const loginUseCase = new LoginUseCase(
  userRepository,
  process.env.JWT_SECRET,
  process.env.JWT_EXPIRES_IN
);
const authController = new AuthController(loginUseCase);

// --- Rutas (Cargadas como Middleware) ---
app.use('/api/v1/users', createUserRouter(userController));
app.use('/api/v1/roles', createRolRouter(adminUpdateRolController));
app.use('/api/v1/auth', createAuthRouter(authController));

// --- 404 ---
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// --- Manejo de errores ---
app.use((err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  if (status >= 500) console.error(err);
  let message = 'Error interno del servidor';
  if (status < 500) {
    message = err.type === 'entity.parse.failed'
      ? 'JSON inválido en el cuerpo de la petición.'
      : err.message;
  }
  res.status(status).json({ error: message });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
