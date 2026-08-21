const express = require('express');
const multer = require('multer');
const { subirEvidenciaFotografica } = require('../middlewares/uploadMiddleware');

// Multer para subida de imágenes de productos (usa memoryStorage para Cloudinary)
const uploadProductoImagen = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const formatosPermitidos = ['image/jpeg', 'image/png', 'image/webp'];
    if (!formatosPermitidos.includes(file.mimetype)) {
      return cb(new Error('Formato no permitido. Solo se aceptan JPG, PNG o WebP'));
    }
    return cb(null, true);
  },
}).single('fotoEvidencia');

/**
 * Función que configura las rutas de productos.
 * GET /publico y GET /:id son públicos (catálogo). El CRUD administrativo
 * (CU-023) requiere sesión de Administrador (id_rol = 1).
 */
function createProductoRouter(productoController, autenticar, requerirAdmin) {
  const router = express.Router();

  router.get('/publico', (req, res) => productoController.listarPublicos(req, res));
  router.get('/:id', (req, res) => productoController.obtenerPorId(req, res));

  router.get('/', autenticar, requerirAdmin, (req, res) => productoController.listarTodos(req, res));
  router.post('/', autenticar, requerirAdmin, (req, res) => productoController.crear(req, res));
  router.put('/:id', autenticar, requerirAdmin, (req, res) => productoController.editar(req, res));
  router.delete('/:id', autenticar, requerirAdmin, (req, res) => productoController.eliminar(req, res));
  router.put('/:id/ajustar-stock', autenticar, requerirAdmin, (req, res) => productoController.ajustarStock(req, res));

  // Subida de imagen de producto a Cloudinary (para admin panel mobile)
  router.post('/imagen', autenticar, requerirAdmin, (req, res, next) => {
    console.log('[UPLOAD] Incoming request:', {
      contentType: req.headers['content-type'],
      hasAuth: !!req.headers.authorization,
      user: req.usuario
    });
    uploadProductoImagen(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        console.log('[UPLOAD] Multer error:', err.code, err.message);
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'Archivo demasiado grande. Máximo 5MB' });
        }
        return res.status(400).json({ error: `Error de subida: ${err.message}` });
      }
      if (err) {
        console.log('[UPLOAD] File filter error:', err.message);
        return res.status(400).json({ error: err.message });
      }
      console.log('[UPLOAD] File received:', req.file ? { fieldname: req.file.fieldname, mimetype: req.file.mimetype, size: req.file.size } : 'NO FILE');
      next();
    });
  }, async (req, res) => {
    try {
      if (!req.file || !req.file.buffer) {
        console.log('[UPLOAD] No file in request');
        return res.status(400).json({ 
          error: 'No se recibió archivo válido. Verifica que el campo se llame "fotoEvidencia" y sea una imagen JPG/PNG/WebP.' 
        });
      }
      const resultado = await subirEvidenciaFotografica(req.file.buffer, 'nexbit/productos');
      return res.status(200).json({ imagen_url: resultado.secure_url });
    } catch (error) {
      console.error('Error subiendo imagen producto:', error);
      return res.status(500).json({ error: 'Error al subir la imagen a Cloudinary' });
    }
  });

  return router;
}

module.exports = createProductoRouter;