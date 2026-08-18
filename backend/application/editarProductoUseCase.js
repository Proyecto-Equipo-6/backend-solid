const {
  validarCamposObligatoriosProducto,
  validarValoresNumericosProducto,
  validarUnicidadProducto,
  validarRelacionesProducto,
  validarEstadoProducto
} = require('./productoValidationsHelper');

class EditarProductoUseCase {
  constructor(productoRepo, categoriaRepo, proveedorRepo) {
    this.productoRepo = productoRepo;
    this.categoriaRepo = categoriaRepo;
    this.proveedorRepo = proveedorRepo;
  }
  
async ejecutar(id_producto, {
  sku,
  id_categoria,
  id_proveedor,
  nombre,
  descripcion = '',
  precio,
  stock,
  imagen_url,
  estado
}) {
  const producto = await this.productoRepo.findById(id_producto);
  if (!producto) {
    throw new Error('Producto no encontrado');
  }

    validarCamposObligatoriosProducto({ sku, nombre, precio, stock });
    validarValoresNumericosProducto(precio, stock);
    await validarUnicidadProducto(this.productoRepo, sku, nombre, id_producto);
    await validarRelacionesProducto(
      this.categoriaRepo,
      this.proveedorRepo,
      id_categoria,
      id_proveedor
    );

    const estadoNumerico = validarEstadoProducto(estado, producto.estado);

    const imagenFinal =
      imagen_url && imagen_url.trim() !== ''
        ? imagen_url.trim()
        : producto.imagen_url;

    return await this.productoRepo.actualizar(id_producto, {
      sku: sku.trim(),
      id_categoria,
      id_proveedor,
      nombre: nombre.trim(),
      descripcion: descripcion || '',
      precio,
      stock,
      imagen_url: imagenFinal,
      estado: estadoNumerico
    });
  }
}

module.exports = EditarProductoUseCase;