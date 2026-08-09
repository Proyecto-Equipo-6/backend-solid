require('dotenv').config();
const express = require('express');
const InMemoryUserRepository = require('./backend/infraestructure/repositories/InMemoryUserRepository');
const CreateUserUseCase = require('./backend/application/CreateUserUseCase');
const UserController = require('./backend/infraestructure/controllers/UserController');
const createUserRouter = require('./backend/infraestructure/routes/userRoutes');
const InMemoryRolesRepository = require('./backend/infraestructure/repositories/InMemoryRolesRepository');
const UpdateRolUseCase = require('./backend/application/UpdateRolUseCase');
const AdminUpdateRolController = require('./backend/infraestructure/controllers/AdminUpdateRolController');
const createRolRouter = require('./backend/infraestructure/routes/rolRoutes');

const app = express();
app.disable('x-powered-by');
app.use(express.json());

// --- Inyección de Dependencias (DIP) ---
// 1. Inicializamos el adaptador de infraestructura (Base de Datos / Repositorio)
const userRepository = new InMemoryUserRepository();

// 2. Inicializamos el caso de uso inyectándole su dependencia (el Repositorio)
const createUserUseCase = new CreateUserUseCase(userRepository);

// 3. Inicializamos el controlador inyectándole el caso de uso
const userController = new UserController(createUserUseCase);

// --- Inyección de Dependencias para Roles (DIP) ---
const rolesRepository = new InMemoryRolesRepository();
const updateRolUseCase = new UpdateRolUseCase(rolesRepository);
const adminUpdateRolController = new AdminUpdateRolController(updateRolUseCase);

// --- Rutas (Cargadas como Middleware) ---
app.use('/api/v1/users', createUserRouter(userController));
app.use('/api/v1/roles', createRolRouter(adminUpdateRolController));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
