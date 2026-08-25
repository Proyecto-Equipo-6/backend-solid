const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

// Configuración de Cloudinary (variables en .env)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const DIRECTORIO_EVIDENCIAS = path.join(__dirname, '../../../uploads/evidencias');

/**
 * Middleware de subida de evidencia fotográfica (CU-017).
 * RN-066: la foto es obligatoria para marcar "Entregado".
 * Acepta JPG/PNG/PDF, máx 5MB (mismo criterio que RN-045).
 * Guarda el archivo en memoria (req.file.buffer) para subirlo a Cloudinary
 * desde el controlador, sin depender de disco.
 */
const uploadEvidencia = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const formatosPermitidos = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!formatosPermitidos.includes(file.mimetype)) {
      return cb(new Error('Formato no permitido. Solo se aceptan JPG, PNG o PDF'));
    }
    return cb(null, true);
  },
}).single('fotoEvidencia');

/**
 * Middleware de subida de imágenes de productos.
 * Acepta JPG/PNG/WebP, máx 5MB.
 * Guarda el archivo en memoria (req.file.buffer) para subirlo a Cloudinary desde el controlador.
 */
const uploadProducto = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const formatosPermitidos = ['image/jpeg', 'image/png', 'image/webp'];
    if (!formatosPermitidos.includes(file.mimetype)) {
      return cb(new Error('Formato no permitido. Solo se aceptan JPG, PNG o WebP'));
    }
    return cb(null, true);
  },
}).single('fotoEvidencia');

/**
 * Sube un buffer a Cloudinary y devuelve la URL segura.
 * @param {Buffer} buffer - contenido del archivo
 * @param {string} carpeta - carpeta destino en Cloudinary (ej. 'nexbit/evidencias')
 * @returns {Promise<{ secure_url: string, url: string }>}
 */
async function subirEvidenciaFotografica(buffer, carpeta = 'nexbit/evidencias') {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: carpeta, resource_type: 'auto' },
      (error, resultado) => {
        if (error) return reject(error);
        return resolve(resultado);
      }
    );
    stream.end(buffer);
  });
}

/**
 * Guarda la evidencia en el servidor local (fallback cuando Cloudinary no está
 * disponible) y devuelve la ruta pública relativa.
 * @param {Buffer} buffer - contenido del archivo
 * @param {string} mimetype - tipo MIME del archivo
 * @param {string} idPedido - id del pedido para nombrar el archivo
 * @returns {string} ruta relativa accesible por HTTP (ej. /api/uploads/evidencias/...)
 */
function guardarEvidenciaLocal(buffer, mimetype, idPedido) {
  if (!fs.existsSync(DIRECTORIO_EVIDENCIAS)) {
    fs.mkdirSync(DIRECTORIO_EVIDENCIAS, { recursive: true });
  }

  const extension = mimetype === 'image/png' ? 'png' : mimetype === 'application/pdf' ? 'pdf' : 'jpg';
  const nombreArchivo = `pedido_${idPedido}_${Date.now()}.${extension}`;
  const rutaCompleta = path.join(DIRECTORIO_EVIDENCIAS, nombreArchivo);
  fs.writeFileSync(rutaCompleta, buffer);

  return `/api/uploads/evidencias/${nombreArchivo}`;
}

module.exports = { uploadEvidencia, uploadProducto, subirEvidenciaFotografica, guardarEvidenciaLocal };
