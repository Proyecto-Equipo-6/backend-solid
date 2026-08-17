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

    // Validar SKU único (RN-011.4)
    const skuExistente = await this.productoRepo.buscarPorSKU(sku.trim());
    if (skuExistente) {
      throw new Error('Ya existe un producto con ese SKU');
    }

    // Validar nombre único
    const existente = await this.productoRepo.buscarPorNombre(nombre.trim());
    if (existente) {
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

    const imagenFinal = imagen_url && imagen_url.trim() !== '' ? imagen_url.trim() : 'sin_imagen.jpg';

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