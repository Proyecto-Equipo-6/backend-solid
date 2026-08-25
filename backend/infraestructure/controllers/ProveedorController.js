const { subirEvidenciaFotografica } = require('../middlewares/uploadMiddleware');

/**
 * Adaptador de Infraestructura: ProveedorController
 * Traduce HTTP <-> Casos de Uso del CRUD de proveedores (CU-025).
 */
class ProveedorController {
  constructor({
    crearProveedorUseCase,
    editarProveedorUseCase,
    eliminarProveedorUseCase,
    listarProveedoresActivosUseCase,
    listarTodosProveedoresUseCase,
  }) {
    this.crearProveedorUseCase = crearProveedorUseCase;
    this.editarProveedorUseCase = editarProveedorUseCase;
    this.eliminarProveedorUseCase = eliminarProveedorUseCase;
    this.listarProveedoresActivosUseCase = listarProveedoresActivosUseCase;
    this.listarTodosProveedoresUseCase = listarTodosProveedoresUseCase;
  }

  /**
   * Sube imagen a Cloudinary si está configurado, sino devuelve null sin fallar.
   * Permite que el CRUD funcione aunque falten variables de Cloudinary.
   */
  async _subirImagenSegura(buffer, carpeta) {
    if (!buffer) return null;
    // Verificar configuración básica de Cloudinary
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.warn('Cloudinary no configurado - omitiendo subida de imagen');
      return null;
    }
    try {
      const resultado = await subirEvidenciaFotografica(buffer, carpeta);
      return resultado.secure_url;
    } catch (error) {
      console.error('Error subiendo a Cloudinary:', error.message);
      return null; // No bloquear el request por fallo de imagen
    }
  }

  async crear(req, res) {
    try {
      const imagen_url = await this._subirImagenSegura(req.file?.buffer, 'nexbit/proveedores');

      const datosProveedor = {
        ...req.body,
        imagen_url
      };

      const proveedor = await this.crearProveedorUseCase.ejecutar(datosProveedor);
      return res.status(201).json(proveedor);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  async editar(req, res) {
    try {
      let imagen_url = req.body.imagen_url || null;

      // Si se subió una nueva imagen, intentar subirla a Cloudinary
      if (req.file?.buffer) {
        const nuevaUrl = await this._subirImagenSegura(req.file.buffer, 'nexbit/proveedores');
        if (nuevaUrl) imagen_url = nuevaUrl;
      }

      const datosProveedor = {
        ...req.body,
        imagen_url
      };

      const proveedor = await this.editarProveedorUseCase.ejecutar(
        Number(req.params.id),
        datosProveedor
      );
      return res.status(200).json(proveedor);
    } catch (error) {
      const status = error.message === 'Proveedor no encontrado' ? 404 : 400;
      return res.status(status).json({ error: error.message });
    }
  }

  async eliminar(req, res) {
    try {
      const resultado = await this.eliminarProveedorUseCase.ejecutar(Number(req.params.id));
      return res.status(200).json(resultado);
    } catch (error) {
      const status = error.message === 'Proveedor no encontrado' ? 404 : 400;
      return res.status(status).json({ error: error.message });
    }
  }

  async listarActivos(req, res) {
    try {
      const proveedores = await this.listarProveedoresActivosUseCase.ejecutar();
      return res.status(200).json(proveedores);
    } catch (error) {
      console.error('Error listando proveedores activos:', error);
      return res.status(500).json({ error: 'Error interno listando proveedores' });
    }
  }

  async listarTodos(req, res) {
    try {
      const proveedores = await this.listarTodosProveedoresUseCase.ejecutar();
      return res.status(200).json(proveedores);
    } catch (error) {
      console.error('Error listando todos los proveedores:', error);
      return res.status(500).json({ error: 'Error interno listando proveedores' });
    }
  }
}

module.exports = ProveedorController;