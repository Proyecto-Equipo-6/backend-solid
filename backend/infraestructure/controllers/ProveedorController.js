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

  async crear(req, res) {
    try {
      let imagen_url = null;

      // Si se subió una imagen, subirla a Cloudinary
      if (req.file) {
        const resultado = await subirEvidenciaFotografica(
          req.file.buffer,
          'nexbit/proveedores'
        );
        imagen_url = resultado.secure_url;
      }

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

      // Si se subió una nueva imagen, subirla a Cloudinary
      if (req.file) {
        const resultado = await subirEvidenciaFotografica(
          req.file.buffer,
          'nexbit/proveedores'
        );
        imagen_url = resultado.secure_url;
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
      return res.status(500).json({ error: error.message });
    }
  }

  async listarTodos(req, res) {
    try {
      const proveedores = await this.listarTodosProveedoresUseCase.ejecutar();
      return res.status(200).json(proveedores);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
}

module.exports = ProveedorController;