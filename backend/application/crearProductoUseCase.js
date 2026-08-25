const {
  validarCamposObligatoriosProducto,
  validarValoresNumericosProducto,
  validarUnicidadProducto,
  validarRelacionesProducto
} = require('./productoValidationsHelper');

class CrearProductoUseCase {
  constructor(productoRepo, categoriaRepo, proveedorRepo) {
    this.productoRepo = productoRepo;
    this.categoriaRepo = categoriaRepo;
    this.proveedorRepo = proveedorRepo;
  }

  async ejecutar({
    sku,
    id_categoria,
    id_proveedor,
    nombre,
    descripcion = '',
    precio,
    stock,
    imagen_url = null
  }) {
    validarCamposObligatoriosProducto({ sku, nombre, precio, stock });
    validarValoresNumericosProducto(precio, stock);
    await validarUnicidadProducto(this.productoRepo, sku, nombre);
    await validarRelacionesProducto(
      this.categoriaRepo,
      this.proveedorRepo,
      id_categoria,
      id_proveedor
    );

    const imagenFinal =
      imagen_url && imagen_url.trim() !== '' ? imagen_url.trim() : null;

    return await this.productoRepo.guardar({
      sku: sku.trim(),
      id_categoria,
      id_proveedor,
      nombre: nombre.trim(),
      descripcion: descripcion || '',
      precio,
      stock,
      imagen_url: imagenFinal,
      estado: 1
    });
  }
}

module.exports = CrearProductoUseCase;