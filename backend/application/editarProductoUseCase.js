class EditarProductoUseCase {
  constructor(productoRepo, categoriaRepo) {
    this.productoRepo = productoRepo;
    this.categoriaRepo = categoriaRepo;
  }

  async ejecutar(id_producto, { id_categoria, id_proveedor, nombre, descripcion, precio, stock, estado }) {
    const producto = await this.productoRepo.findById(id_producto);
    if (!producto) {
      throw new Error('Producto no encontrado');
    }

    if (!nombre || nombre.trim() === '' ||
    precio === undefined || precio === null ||
    stock === undefined || stock === null ||
    id_categoria === undefined || id_categoria === null) {
    throw new Error('Complete los campos obligatorios');
    }
    
    if (precio < 0 || stock < 0) {
      throw new Error('El precio y el stock no pueden ser negativos');
    }

    // Validar nombre único, excluyendo el mismo producto
    const existente = await this.productoRepo.buscarPorNombre(nombre.trim());
    if (existente && existente.id_producto !== id_producto) {
      throw new Error('Ya existe un producto con ese nombre');
    }

    // Verificar que la categoría exista
    const categoria = await this.categoriaRepo.buscarPorId(id_categoria);
    if (!categoria) {
      throw new Error('La categoría asociada no existe');
    }

    // Convertir estado
    let estadoNumerico = producto.estado;
    if (estado !== undefined) {
      if (estado === 'Activo') estadoNumerico = 1;
      else if (estado === 'Inactivo') estadoNumerico = 0;
      else if ([0, 1].includes(estado)) estadoNumerico = estado;
      else throw new Error('Estado inválido');
    }

    return await this.productoRepo.actualizar(id_producto, {
      id_categoria,
      id_proveedor,
      nombre: nombre.trim(),
      descripcion: descripcion || '',
      precio,
      stock,
      estado: estadoNumerico
    });
  }
}

module.exports = EditarProductoUseCase;