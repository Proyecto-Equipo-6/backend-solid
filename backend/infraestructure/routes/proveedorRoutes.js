const express = require('express');
const multer = require('multer');

// Configuración de multer para subida de imágenes de proveedores
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const formatosPermitidos = ['image/jpeg', 'image/png', 'image/webp'];
    if (!formatosPermitidos.includes(file.mimetype)) {
      return cb(new Error('Formato no permitido. Solo se aceptan JPG, PNG o WebP'));
    }
    return cb(null, true);
  }
}).single('imagen');

/**
 * Función que configura las rutas del CRUD de proveedores (CU-025).
 * Recibe el controlador ya instanciado y los middlewares de autorización.
 * Todas las rutas requieren sesión de Administrador (id_rol = 1).
 */
function createProveedorRouter(proveedorController, autenticar, requerirAdmin) {
  const router = express.Router();

  router.use(autenticar);
  router.use(requerirAdmin);

  router.get('/', (req, res) => proveedorController.listarActivos(req, res));
  router.get('/todos', (req, res) => proveedorController.listarTodos(req, res));
  router.post('/', upload, (req, res) => proveedorController.crear(req, res));
  router.put('/:id', upload, (req, res) => proveedorController.editar(req, res));
  router.delete('/:id', (req, res) => proveedorController.eliminar(req, res));

  return router;
}

module.exports = createProveedorRouter;