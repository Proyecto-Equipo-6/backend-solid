const {
  validarCamposObligatoriosProducto,
  validarValoresNumericosProducto,
  validarUnicidadProducto,
  validarRelacionesProducto
} = require('./productoValidationsHelper');
const { generarSkuSistema } = require('./skuHelper');

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
    validarValoresNumericosProducto(precio, stock);
    await validarRelacionesProducto(
      this.categoriaRepo,
      this.proveedorRepo,
      id_categoria,
      id_proveedor
    );

    if (!sku || sku.trim() === '') {
      sku = await generarSkuSistema(
        this.categoriaRepo,
        this.productoRepo,
        id_categoria,
        nombre
      );
    }

    validarCamposObligatoriosProducto({ sku, nombre, precio, stock });
    await validarUnicidadProducto(this.productoRepo, sku, nombre);

    const imagenFinal =
      imagen_url && imagen_url.trim() !== '' ? imagen_url.trim() : 'sin_imagen.jpg';

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