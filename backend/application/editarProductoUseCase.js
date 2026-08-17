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

    if (!sku || sku.trim() === '') {
      throw new Error('El SKU es obligatorio');
    }
    if (!nombre || nombre.trim() === '') {
      throw new Error('Complete los campos obligatorios');
    }
    if (precio === undefined || precio === null || stock === undefined || stock === null) {
      throw new Error('Complete los campos obligatorios');
    }
    if (typeof precio !== 'number' || precio <= 0) {
      throw new Error('El precio debe ser un número mayor a cero');
    }
    if (typeof stock !== 'number' || stock < 0) {
      throw new Error('El stock no puede ser negativo');
    }

    // Validar SKU único, excluyendo el mismo producto
    const skuExistente = await this.productoRepo.buscarPorSKU(sku.trim());
    if (skuExistente && skuExistente.id_producto !== id_producto) {
      throw new Error('Ya existe un producto con ese SKU');
    }

    // Validar nombre único, excluyendo el mismo producto
    const nombreExistente = await this.productoRepo.buscarPorNombre(nombre.trim());
    if (nombreExistente && nombreExistente.id_producto !== id_producto) {
      throw new Error('Ya existe un producto con ese nombre');
    }

    // Validar categoría
    const categoria = await this.categoriaRepo.buscarPorId(id_categoria);
    if (!categoria) {
      throw new Error('La categoría asociada no existe');
    }

    // Validar proveedor
    const proveedor = await this.proveedorRepo.buscarPorId(id_proveedor);
    if (!proveedor) {
      throw new Error('El proveedor asociado no existe');
    }

    // Convertir estado
    let estadoNumerico = producto.estado;
    if (estado !== undefined) {
      if (estado === 'Activo') estadoNumerico = 1;
      else if (estado === 'Inactivo') estadoNumerico = 0;
      else if ([0, 1].includes(estado)) estadoNumerico = estado;
      else throw new Error('Estado inválido');
    }

    const imagenFinal = imagen_url && imagen_url.trim() !== '' ? imagen_url.trim() : producto.imagen_url;

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