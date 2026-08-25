require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const MySQLUserRepository = require('./backend/infraestructure/repositories/mysql/MySQLUserRepository');
const CreateUserUseCase = require('./backend/application/CreateUserUseCase');
const UserController = require('./backend/infraestructure/controllers/UserController');
const createUserRouter = require('./backend/infraestructure/routes/userRoutes');
const MySQLRolesRepository = require('./backend/infraestructure/repositories/mysql/MySQLRolesRepository');
const UpdateRolUseCase = require('./backend/application/UpdateRolUseCase');
const AdminUpdateRolController = require('./backend/infraestructure/controllers/AdminUpdateRolController');
const createRolRouter = require('./backend/infraestructure/routes/rolRoutes');
const LoginUseCase = require('./backend/application/LoginUseCase');
const LogoutUseCase = require('./backend/application/LogoutUseCase');
const InMemoryTokenBlacklistRepository = require('./backend/infraestructure/repositories/in-memory/InMemoryTokenBlacklistRepository');
const AuthController = require('./backend/infraestructure/controllers/AuthController');
const createAuthRouter = require('./backend/infraestructure/routes/authRoutes');
const SolicitarRecuperacionUseCase = require('./backend/application/SolicitarRecuperacionUseCase');
const RestablecerContrasenaUseCase = require('./backend/application/RestablecerContrasenaUseCase');
const MySQLTokensRecuperacionRepository = require('./backend/infraestructure/repositories/mysql/MySQLTokensRecuperacionRepository');
const SmtpEmailSender = require('./backend/infraestructure/services/SmtpEmailSender');
const MySQLProductoRepository = require('./backend/infraestructure/repositories/mysql/MySQLProductoRepository');
const ListarProductosPublicosUseCase = require('./backend/application/ListarProductosPublicosUseCase');
const ListarTodosProductosUseCase = require('./backend/application/listarTodosProductosUseCase');
const ObtenerProductoPublicoUseCase = require('./backend/application/ObtenerProductoPublicoUseCase');
const CrearProductoUseCase = require('./backend/application/crearProductoUseCase');
const EditarProductoUseCase = require('./backend/application/editarProductoUseCase');
const EliminarProductoUseCase = require('./backend/application/eliminarProductoUseCase');
const BuscarProductosUseCase = require('./backend/application/BuscarProductosUseCase');
const ProductoController = require('./backend/infraestructure/controllers/ProductoController');
const createProductoRouter = require('./backend/infraestructure/routes/productoRoutes');
const MySQLCategoriaRepository = require('./backend/infraestructure/repositories/mysql/MySQLCategoriaRepository');
const ListarCategoriasUseCase = require('./backend/application/ListarCategoriasUseCase');
const ListarTodasCategoriasUseCase = require('./backend/application/listarTodasCategoriasUseCase');
const CrearCategoriaUseCase = require('./backend/application/crearCategoriaUseCase');
const EditarCategoriaUseCase = require('./backend/application/editarCategoriaUseCase');
const EliminarCategoriaUseCase = require('./backend/application/eliminarCategoriaUseCase');
const CategoriaController = require('./backend/infraestructure/controllers/CategoriaController');
const createCategoriaRouter = require('./backend/infraestructure/routes/categoriaRoutes');
const ObtenerPerfilUseCase = require('./backend/application/ObtenerPerfilUseCase');
const ActualizarPerfilUseCase = require('./backend/application/ActualizarPerfilUseCase');
const MySQLAnaliticaRepository = require('./backend/infraestructure/repositories/mysql/MySQLAnaliticaRepository');
const ObtenerResumenAnaliticaUseCase = require('./backend/application/ObtenerResumenAnaliticaUseCase');
const AnaliticaController = require('./backend/infraestructure/controllers/AnaliticaController');
const createAnaliticaRouter = require('./backend/infraestructure/routes/analiticaRoutes');
const crearAutenticador = require('./backend/infraestructure/middlewares/autenticacion');
const { crearRequerirCliente } = require('./backend/infraestructure/middlewares/autenticacion');
const { crearRequerirRepartidor } = require('./backend/infraestructure/middlewares/autenticacion');
const { crearRequerirAdmin } = require('./backend/infraestructure/middlewares/autenticacion');

// --- Módulos de Carrito (Fase 3) ---
const MySQLCarritoRepository = require('./backend/infraestructure/repositories/mysql/MySQLCarritoRepository');
const VerCarritoUseCase = require('./backend/application/VerCarritoUseCase');
const AgregarAlCarritoUseCase = require('./backend/application/AgregarAlCarritoUseCase');
const ActualizarCarritoUseCase = require('./backend/application/ActualizarCarritoUseCase');
const EliminarDelCarritoUseCase = require('./backend/application/EliminarDelCarritoUseCase');
const CarritoController = require('./backend/infraestructure/controllers/CarritoController');
const createCarritoRouter = require('./backend/infraestructure/routes/carritoRoutes');

// --- Módulos de Pedidos (Fase 4) ---
const MySQLPedidoRepository = require('./backend/infraestructure/repositories/mysql/MySQLPedidoRepository');
const CrearPedidoUseCase = require('./backend/application/CrearPedidoUseCase');
const VerPedidosUseCase = require('./backend/application/VerPedidosUseCase');
const CancelarPedidoUseCase = require('./backend/application/CancelarPedidoUseCase');
const PedidoController = require('./backend/infraestructure/controllers/PedidoController');
const createPedidoRouter = require('./backend/infraestructure/routes/pedidoRoutes');

// --- Módulos de Repartidor (CU-015 a CU-018) ---
const MySQLPedidoRepartidorRepository = require('./backend/infraestructure/repositories/mysql/MySQLPedidoRepartidorRepository');
const createPedidosRepartidorRouter = require('./backend/infraestructure/routes/pedidosRepartidorRoutes');
const RepartidorController = require('./backend/infraestructure/controllers/RepartidorController');
const VerDashboardPedidosUseCase = require('./backend/application/verDashboardPedidosUseCase');
const VerDetallePedidoUseCase = require('./backend/application/verDetallePedidoUseCase');
const VerHistorialPedidosUseCase = require('./backend/application/verHistorialPedidosUseCase');
const ActualizarEstadoPedidoUseCase = require('./backend/application/actualizarEstadoPedidoUseCase');

// --- Módulos de Proveedores (CU-025) ---
const MySQLProveedorRepository = require('./backend/infraestructure/repositories/mysql/MySQLProveedorRepository');
const CrearProveedorUseCase = require('./backend/application/crearProveedorUseCase');
const EditarProveedorUseCase = require('./backend/application/editarProveedorUseCase');
const EliminarProveedorUseCase = require('./backend/application/eliminarProveedorUseCase');
const ListarProveedoresActivosUseCase = require('./backend/application/listarProveedoresActivosUseCase');
const ListarTodosProveedoresUseCase = require('./backend/application/listarTodosProveedoresUseCase');
const ProveedorController = require('./backend/infraestructure/controllers/ProveedorController');
const createProveedorRouter = require('./backend/infraestructure/routes/proveedorRoutes');

// --- Módulos de Repartidores Admin (CU-021) ---
const MySQLRepartidorRepository = require('./backend/infraestructure/repositories/mysql/MySQLRepartidorRepository');
const ConsultarRepartidoresUseCase = require('./backend/application/consultarRepartidoresUseCase');
const CambiarEstadoOperativoRepartidorUseCase = require('./backend/application/cambiarEstadoOperativoRepartidorUseCase');
const RepartidorAdminController = require('./backend/infraestructure/controllers/RepartidorAdminController');
const createRepartidorAdminRouter = require('./backend/infraestructure/routes/repartidorAdminRoutes');

// --- Módulos de Pedidos Admin (CU-027) ---
const ObtenerTodosPedidosUseCase = require('./backend/application/obtenerTodosPedidosUseCase');
const ObtenerDetallePedidoAdminUseCase = require('./backend/application/obtenerDetallePedidoAdminUseCase');
const ActualizarEstadoPedidoAdminUseCase = require('./backend/application/actualizarEstadoPedidoAdminUseCase');
const CancelarPedidoAdminUseCase = require('./backend/application/cancelarPedidoAdminUseCase');
const AsignarRepartidorUseCase = require('./backend/application/asignarRepartidorUseCase');
const GenerarTicketPedidoUseCase = require('./backend/application/GenerarTicketPedidoUseCase');
const EntregarPedidoAdminUseCase = require('./backend/application/entregarPedidoAdminUseCase');
const PedidoAdminController = require('./backend/infraestructure/controllers/PedidoAdminController');
const createPedidoAdminRouter = require('./backend/infraestructure/routes/pedidoAdminRoutes');

// --- Módulos de Stock Admin (CU-023) ---
const AjustarStockProductoUseCase = require('./backend/application/ajustarStockProductoUseCase');

// --- Módulos de Usuarios Admin (CU-026) ---
const ListarUsuariosAdminUseCase = require('./backend/application/ListarUsuariosAdminUseCase');
const ActualizarEstadoUsuarioUseCase = require('./backend/application/ActualizarEstadoUsuarioUseCase');
const AdminUsuarioController = require('./backend/infraestructure/controllers/AdminUsuarioController');
const createUsuarioAdminRouter = require('./backend/infraestructure/routes/usuarioAdminRoutes');

const app = express();
app.disable('x-powered-by');
const corsOptions = {
  // En desarrollo (sin CORS_ORIGIN en .env) refleja el origen dinámicamente.
  // En producción usará el dominio exacto guardado en process.env.CORS_ORIGIN.
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : true,
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// --- Inyección de Dependencias (DIP) ---
// 1. Inicializamos el adaptador de infraestructura (Base de Datos / Repositorio)
const userRepository = new MySQLUserRepository();

// 2. Inicializamos el caso de uso inyectándole su dependencia (el Repositorio)
const createUserUseCase = new CreateUserUseCase(userRepository);

// --- Inyección de Dependencias para el Perfil (CU-004/CU-005, DIP) ---
const obtenerPerfilUseCase = new ObtenerPerfilUseCase(userRepository);
const actualizarPerfilUseCase = new ActualizarPerfilUseCase(userRepository);

// RN-024: lista negra de tokens revocados al cerrar sesión (se crea antes
// del autenticador porque el middleware la consulta en cada petición).
const tokenBlacklistRepository = new InMemoryTokenBlacklistRepository();
const autenticar = crearAutenticador(process.env.JWT_SECRET, tokenBlacklistRepository);

// 3. Inicializamos el controlador inyectándole el caso de uso
const userController = new UserController(
  createUserUseCase,
  obtenerPerfilUseCase,
  actualizarPerfilUseCase
);

// --- Inyección de Dependencias para Roles (DIP) ---
const CrearRolUseCase = require('./backend/application/crearRolUseCase');
const EliminarRolUseCase = require('./backend/application/eliminarRolUseCase');
const rolesRepository = new MySQLRolesRepository();
const updateRolUseCase = new UpdateRolUseCase(rolesRepository);
const crearRolUseCase = new CrearRolUseCase(rolesRepository);
const eliminarRolUseCase = new EliminarRolUseCase(rolesRepository, userRepository);
const adminUpdateRolController = new AdminUpdateRolController(
  updateRolUseCase,
  rolesRepository,
  crearRolUseCase,
  eliminarRolUseCase
);

// --- Inyección de Dependencias para Autenticación (DIP) ---
const loginUseCase = new LoginUseCase(
  userRepository,
  process.env.JWT_SECRET,
  process.env.JWT_EXPIRES_IN
);

const logoutUseCase = new LogoutUseCase(tokenBlacklistRepository);

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
  restablecerContrasenaUseCase,
  logoutUseCase
);

// --- Inyección de Dependencias para Categorías (CU-022, DIP) ---
const categoriaRepository = new MySQLCategoriaRepository();
const listarCategoriasUseCase = new ListarCategoriasUseCase(categoriaRepository);
const listarTodasCategoriasUseCase = new ListarTodasCategoriasUseCase(categoriaRepository);
const crearCategoriaUseCase = new CrearCategoriaUseCase(categoriaRepository);
const editarCategoriaUseCase = new EditarCategoriaUseCase(categoriaRepository);
const eliminarCategoriaUseCase = new EliminarCategoriaUseCase(categoriaRepository);
const categoriaController = new CategoriaController({
  listarCategoriasUseCase,
  listarTodasCategoriasUseCase,
  crearCategoriaUseCase,
  editarCategoriaUseCase,
  eliminarCategoriaUseCase,
});

// --- Inyección de Dependencias para Proveedores (CU-025, DIP) ---
const proveedorRepository = new MySQLProveedorRepository();
const crearProveedorUseCase = new CrearProveedorUseCase(proveedorRepository);
const editarProveedorUseCase = new EditarProveedorUseCase(proveedorRepository);
const eliminarProveedorUseCase = new EliminarProveedorUseCase(proveedorRepository);
const listarProveedoresActivosUseCase = new ListarProveedoresActivosUseCase(proveedorRepository);
const listarTodosProveedoresUseCase = new ListarTodosProveedoresUseCase(proveedorRepository);
const proveedorController = new ProveedorController({
  crearProveedorUseCase,
  editarProveedorUseCase,
  eliminarProveedorUseCase,
  listarProveedoresActivosUseCase,
  listarTodosProveedoresUseCase,
});

// --- Inyección de Dependencias para Productos (CU-023, DIP) ---
const productoRepository = new MySQLProductoRepository();
const ajustarStockProductoUseCase = new AjustarStockProductoUseCase(productoRepository);
const listarProductosUseCase = new ListarProductosPublicosUseCase(productoRepository);
const listarTodosProductosUseCase = new ListarTodosProductosUseCase(productoRepository);
const obtenerProductoUseCase = new ObtenerProductoPublicoUseCase(productoRepository);
const crearProductoUseCase = new CrearProductoUseCase(productoRepository, categoriaRepository, proveedorRepository);
const editarProductoUseCase = new EditarProductoUseCase(productoRepository, categoriaRepository, proveedorRepository);
const eliminarProductoUseCase = new EliminarProductoUseCase(productoRepository);
const buscarProductosUseCase = new BuscarProductosUseCase(productoRepository);
const productoController = new ProductoController({
  listarProductosUseCase,
  listarTodosProductosUseCase,
  obtenerProductoUseCase,
  crearProductoUseCase,
  editarProductoUseCase,
  eliminarProductoUseCase,
  ajustarStockProductoUseCase,
  buscarProductosUseCase,
});

// --- Inyección de Dependencias para Reportes del Panel (DIP) ---
const analiticaRepository = new MySQLAnaliticaRepository();
const obtenerResumenAnaliticaUseCase = new ObtenerResumenAnaliticaUseCase(analiticaRepository);
const analiticaController = new AnaliticaController(obtenerResumenAnaliticaUseCase);

// --- Inyección de Dependencias para Carrito (DIP) ---
const carritoRepository = new MySQLCarritoRepository();
const verCarritoUseCase = new VerCarritoUseCase(carritoRepository);
const agregarAlCarritoUseCase = new AgregarAlCarritoUseCase(carritoRepository, productoRepository);
const actualizarCarritoUseCase = new ActualizarCarritoUseCase(carritoRepository, productoRepository);
const eliminarDelCarritoUseCase = new EliminarDelCarritoUseCase(carritoRepository);
const carritoController = new CarritoController({
  verCarritoUseCase,
  agregarAlCarritoUseCase,
  actualizarCarritoUseCase,
  eliminarDelCarritoUseCase,
});

// --- Inyección de Dependencias para Pedidos (DIP) ---
const pedidoRepository = new MySQLPedidoRepository();
const crearPedidoUseCase = new CrearPedidoUseCase(carritoRepository, pedidoRepository);
const verPedidosUseCase = new VerPedidosUseCase(pedidoRepository);
const cancelarPedidoUseCase = new CancelarPedidoUseCase(pedidoRepository);
const pedidoController = new PedidoController({ crearPedidoUseCase, verPedidosUseCase, cancelarPedidoUseCase });

// --- Constantes del sistema ---
const { ROL_ADMIN, ROL_CLIENTE, ROL_REPARTIDOR } = require('./backend/constants');

// --- Middlewares de autorización (DIP) ---
const requerirCliente = crearRequerirCliente(ROL_CLIENTE);
const requerirRepartidor = crearRequerirRepartidor(ROL_REPARTIDOR);
const requerirAdmin = crearRequerirAdmin(ROL_ADMIN);

// --- Inyección de Dependencias para Repartidor (DIP) ---
const pedidoRepartidorRepository = new MySQLPedidoRepartidorRepository();

// --- Controller de Repartidor (CU-015 a CU-018) con casos de uso inyectados (DIP) ---
const repartidorController = new RepartidorController({
  verDashboard: new VerDashboardPedidosUseCase(pedidoRepartidorRepository),
  verDetalle: new VerDetallePedidoUseCase(pedidoRepartidorRepository),
  actualizarEstado: new ActualizarEstadoPedidoUseCase(pedidoRepartidorRepository),
  verHistorial: new VerHistorialPedidosUseCase(pedidoRepartidorRepository),
});

// --- Inyección de Dependencias para Repartidores Admin (CU-021, DIP) ---
const CrearRepartidorAdminUseCase = require('./backend/application/crearRepartidorAdminUseCase');
const ActualizarRepartidorAdminUseCase = require('./backend/application/actualizarRepartidorAdminUseCase');
const EliminarRepartidorAdminUseCase = require('./backend/application/eliminarRepartidorAdminUseCase');
const repartidorRepository = new MySQLRepartidorRepository();
const consultarRepartidoresUseCase = new ConsultarRepartidoresUseCase(repartidorRepository, pedidoRepartidorRepository);
const cambiarEstadoOperativoRepartidorUseCase = new CambiarEstadoOperativoRepartidorUseCase(repartidorRepository, pedidoRepartidorRepository);
const crearRepartidorAdminUseCase = new CrearRepartidorAdminUseCase(userRepository, repartidorRepository);
const actualizarRepartidorAdminUseCase = new ActualizarRepartidorAdminUseCase(userRepository, repartidorRepository);
const eliminarRepartidorAdminUseCase = new EliminarRepartidorAdminUseCase(userRepository, repartidorRepository);
const repartidorAdminController = new RepartidorAdminController({
  consultarRepartidoresUseCase,
  cambiarEstadoOperativoRepartidorUseCase,
  crearRepartidorAdminUseCase,
  actualizarRepartidorAdminUseCase,
  eliminarRepartidorAdminUseCase,
});

// --- Inyección de Dependencias para Pedidos Admin (CU-027, DIP) ---
const obtenerTodosPedidosUseCase = new ObtenerTodosPedidosUseCase(pedidoRepartidorRepository);
const obtenerDetallePedidoAdminUseCase = new ObtenerDetallePedidoAdminUseCase(pedidoRepartidorRepository);
const actualizarEstadoPedidoAdminUseCase = new ActualizarEstadoPedidoAdminUseCase(pedidoRepartidorRepository);
const cancelarPedidoAdminUseCase = new CancelarPedidoAdminUseCase(pedidoRepartidorRepository, productoRepository, repartidorRepository);
const asignarRepartidorUseCase = new AsignarRepartidorUseCase(pedidoRepartidorRepository, repartidorRepository);
const DesasignarRepartidorUseCase = require('./backend/application/desasignarRepartidorUseCase');
const desasignarRepartidorUseCase = new DesasignarRepartidorUseCase(pedidoRepartidorRepository, repartidorRepository);
const generarTicketPedidoUseCase = new GenerarTicketPedidoUseCase(pedidoRepartidorRepository);
const entregarPedidoAdminUseCase = new EntregarPedidoAdminUseCase(pedidoRepartidorRepository);
const pedidoAdminController = new PedidoAdminController({
  obtenerTodosPedidosUseCase,
  obtenerDetallePedidoAdminUseCase,
  actualizarEstadoPedidoAdminUseCase,
  cancelarPedidoAdminUseCase,
  asignarRepartidorUseCase,
  desasignarRepartidorUseCase,
  entregarPedidoAdminUseCase,
  generarTicketPedidoUseCase,
});

// --- Inyección de Dependencias para Usuarios Admin (CU-026, DIP) ---
const CrearUsuarioAdminUseCase = require('./backend/application/crearUsuarioAdminUseCase');
const ActualizarUsuarioAdminUseCase = require('./backend/application/actualizarUsuarioAdminUseCase');
const EliminarUsuarioAdminUseCase = require('./backend/application/eliminarUsuarioAdminUseCase');
const listarUsuariosAdminUseCase = new ListarUsuariosAdminUseCase(userRepository);
const actualizarEstadoUsuarioUseCase = new ActualizarEstadoUsuarioUseCase(userRepository);
const crearUsuarioAdminUseCase = new CrearUsuarioAdminUseCase(userRepository, repartidorRepository);
const actualizarUsuarioAdminUseCase = new ActualizarUsuarioAdminUseCase(userRepository, repartidorRepository);
const eliminarUsuarioAdminUseCase = new EliminarUsuarioAdminUseCase(userRepository);
const adminUsuarioController = new AdminUsuarioController({
  listarUsuariosAdminUseCase,
  actualizarEstadoUsuarioUseCase,
  crearUsuarioAdminUseCase,
  actualizarUsuarioAdminUseCase,
  eliminarUsuarioAdminUseCase,
});

// --- Rutas (Cargadas como Middleware) ---
app.use('/api/v1/users', createUserRouter(userController, autenticar));
app.use('/api/v1/roles', createRolRouter(adminUpdateRolController, autenticar, requerirAdmin));
app.use('/api/v1/auth', createAuthRouter(authController));
app.use('/api/v1/productos', createProductoRouter(productoController, autenticar, requerirAdmin));
app.use('/api/v1/categorias', createCategoriaRouter(categoriaController, autenticar, requerirAdmin));
app.use('/api/v1/analitica', createAnaliticaRouter(analiticaController, autenticar, requerirAdmin));
app.use('/api/v1/carrito', createCarritoRouter(carritoController, autenticar, requerirCliente));
app.use('/api/v1/pedidos', createPedidoRouter(pedidoController, autenticar, requerirCliente));
app.use('/api/v1/repartidor', createPedidosRepartidorRouter(repartidorController, autenticar, requerirRepartidor));
app.use('/api/v1/proveedores', createProveedorRouter(proveedorController, autenticar, requerirAdmin));
app.use('/api/v1/admin/repartidores', createRepartidorAdminRouter(repartidorAdminController, autenticar, requerirAdmin));
app.use('/api/v1/admin/pedidos', createPedidoAdminRouter(pedidoAdminController, autenticar, requerirAdmin));
app.use('/api/v1/admin/usuarios', createUsuarioAdminRouter(adminUsuarioController, autenticar, requerirAdmin));

// --- Archivos estáticos (evidencias guardadas localmente como fallback de Cloudinary) ---
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')));

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