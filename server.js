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
const SolicitarRecuperacionUseCase = require('./backend/application/SolicitarRecuperacionUseCase');
const RestablecerContrasenaUseCase = require('./backend/application/RestablecerContrasenaUseCase');
const MySQLTokensRecuperacionRepository = require('./backend/infraestructure/repositories/mysql/MySQLTokensRecuperacionRepository');
const SmtpEmailSender = require('./backend/infraestructure/services/SmtpEmailSender');
const MySQLProductoRepository = require('./backend/infraestructure/repositories/mysql/MySQLProductoRepository');
const ListarProductosPublicosUseCase = require('./backend/application/ListarProductosPublicosUseCase');
const ObtenerProductoPublicoUseCase = require('./backend/application/ObtenerProductoPublicoUseCase');
const ProductoController = require('./backend/infraestructure/controllers/ProductoController');
const createProductoRouter = require('./backend/infraestructure/routes/productoRoutes');
const MySQLCategoriaRepository = require('./backend/infraestructure/repositories/mysql/MySQLCategoriaRepository');
const ListarCategoriasUseCase = require('./backend/application/ListarCategoriasUseCase');
const CategoriaController = require('./backend/infraestructure/controllers/CategoriaController');
const createCategoriaRouter = require('./backend/infraestructure/routes/categoriaRoutes');
const ObtenerPerfilUseCase = require('./backend/application/ObtenerPerfilUseCase');
const ActualizarPerfilUseCase = require('./backend/application/ActualizarPerfilUseCase');
const crearAutenticador = require('./backend/infraestructure/middlewares/autenticacion');
const pedidosRepartidorRouter = require('./backend/infraestructure/routes/pedidosRepartidorRoutes');

const app = express();
app.disable('x-powered-by');
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || true,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// --- Inyección de Dependencias (DIP) ---
// 1. Inicializamos el adaptador de infraestructura (Base de Datos / Repositorio)
const userRepository = new MySQLUserRepository();

// 2. Inicializamos el caso de uso inyectándole su dependencia (el Repositorio)
const createUserUseCase = new CreateUserUseCase(userRepository);

// --- Inyección de Dependencias para el Perfil (CU-004/CU-005, DIP) ---
const obtenerPerfilUseCase = new ObtenerPerfilUseCase(userRepository);
const actualizarPerfilUseCase = new ActualizarPerfilUseCase(userRepository);
const autenticar = crearAutenticador(process.env.JWT_SECRET);

// 3. Inicializamos el controlador inyectándole el caso de uso
const userController = new UserController(
  createUserUseCase,
  obtenerPerfilUseCase,
  actualizarPerfilUseCase
);

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

// --- Inyección de Dependencias para Recuperación de Contraseña (DIP) ---
const tokensRecuperacionRepository = new MySQLTokensRecuperacionRepository();
const emailSender = new SmtpEmailSender();
const solicitarRecuperacionUseCase = new SolicitarRecuperacionUseCase(
  userRepository,
  tokensRecuperacionRepository,
  emailSender
);
const restablecerContrasenaUseCase = new RestablecerContrasenaUseCase(
  userRepository,
  tokensRecuperacionRepository
);

const authController = new AuthController(
  loginUseCase,
  solicitarRecuperacionUseCase,
  restablecerContrasenaUseCase
);

// --- Inyección de Dependencias para el Catálogo de Productos (DIP) ---
const productoRepository = new MySQLProductoRepository();
const listarProductosUseCase = new ListarProductosPublicosUseCase(productoRepository);
const obtenerProductoUseCase = new ObtenerProductoPublicoUseCase(productoRepository);
const productoController = new ProductoController(
  listarProductosUseCase,
  obtenerProductoUseCase
);

// --- Inyección de Dependencias para Categorías (DIP) ---
const categoriaRepository = new MySQLCategoriaRepository();
const listarCategoriasUseCase = new ListarCategoriasUseCase(categoriaRepository);
const categoriaController = new CategoriaController(listarCategoriasUseCase);

// --- Rutas (Cargadas como Middleware) ---
app.use('/api/v1/users', createUserRouter(userController, autenticar));
app.use('/api/v1/roles', createRolRouter(adminUpdateRolController));
app.use('/api/v1/auth', createAuthRouter(authController));
app.use('/api/v1/productos', createProductoRouter(productoController));
app.use('/api/v1/categorias', createCategoriaRouter(categoriaController));

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

app.use('/api/v1/repartidor', pedidosRepartidorRouter);

// --- 404 ---
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});
