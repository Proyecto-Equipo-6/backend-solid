class CrearProductoUseCase {
  constructor(productoRepo, categoriaRepo) {
    this.productoRepo = productoRepo;
    this.categoriaRepo = categoriaRepo;
  }

  async ejecutar({ id_categoria, nombre, descripcion = '', precio, stock }) {
    if (!nombre || nombre.trim() === '') {
      throw new Error('Complete los campos obligatorios');
    }
    if (precio === undefined || stock === undefined) {
      throw new Error('Complete los campos obligatorios');
    }
    if (precio < 0 || stock < 0) {
      throw new Error('El precio y el stock no pueden ser negativos');
    }

    const existente = await this.productoRepo.buscarPorNombre(nombre.trim());
    if (existente) {
      throw new Error('Ya existe un producto con ese nombre');
    }

    const categoria = await this.categoriaRepo.buscarPorId(id_categoria);
    if (!categoria) {
      throw new Error('La categoría asociada no existe');
    }

    return await this.productoRepo.guardar({
      id_categoria,
      nombre: nombre.trim(),
      descripcion: descripcion || '',
      precio,
      stock,
      estado: 1
    });
  }
}

module.exports = CrearProductoUseCase;