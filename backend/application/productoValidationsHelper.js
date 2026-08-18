/**
 * Helpers de validación compartidos para la gestión de productos.
 * Se extraen aquí las validaciones comunes entre creación y edición
 * para reducir duplicación y mejorar mantenibilidad (SonarQube).
 */

function validarCamposObligatoriosProducto({ sku, nombre, precio, stock }) {
  if (!sku || sku.trim() === '') {
    throw new Error('El SKU es obligatorio');
  }
  if (!nombre || nombre.trim() === '') {
    throw new Error('Complete los campos obligatorios');
  }
  if (precio === undefined || precio === null || stock === undefined || stock === null) {
    throw new Error('Complete los campos obligatorios');
  }
}

function validarValoresNumericosProducto(precio, stock) {
  if (typeof precio !== 'number' || precio <= 0) {
    throw new Error('El precio debe ser un número mayor a cero');
  }
  if (typeof stock !== 'number' || stock < 0) {
    throw new Error('El stock no puede ser negativo');
  }
}

async function validarUnicidadProducto(productoRepo, sku, nombre, idProductoExcluido = null) {
  const skuExistente = await productoRepo.buscarPorSKU(sku.trim());
  if (skuExistente && skuExistente.id_producto !== idProductoExcluido) {
    throw new Error('Ya existe un producto con ese SKU');
  }

  const nombreExistente = await productoRepo.buscarPorNombre(nombre.trim());
  if (nombreExistente && nombreExistente.id_producto !== idProductoExcluido) {
    throw new Error('Ya existe un producto con ese nombre');
  }
}

async function validarRelacionesProducto(categoriaRepo, proveedorRepo, idCategoria, idProveedor) {
  const categoria = await categoriaRepo.buscarPorId(idCategoria);
  if (!categoria) {
    throw new Error('La categoría asociada no existe');
  }

  const proveedor = await proveedorRepo.buscarPorId(idProveedor);
  if (!proveedor) {
    throw new Error('El proveedor asociado no existe');
  }
}

function validarEstadoProducto(estado, estadoActual) {
  if (estado === undefined) return estadoActual;
  if (estado === 'Activo') return 1;
  if (estado === 'Inactivo') return 0;
  if ([0, 1].includes(estado)) return estado;
  throw new Error('Estado inválido');
}

module.exports = {
  validarCamposObligatoriosProducto,
  validarValoresNumericosProducto,
  validarUnicidadProducto,
  validarRelacionesProducto,
  validarEstadoProducto
};