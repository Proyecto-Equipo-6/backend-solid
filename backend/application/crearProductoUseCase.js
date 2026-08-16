class CrearProductoUseCase {
  constructor(productoRepo, categoriaRepo) {
    this.productoRepo = productoRepo;
    this.categoriaRepo = categoriaRepo;
  }

  async ejecutar({ id_categoria, nombre, descripcion = '', precio, stock, imagen_url }) {
    if (!nombre || nombre.trim() === '') {
      throw new Error('Complete los campos obligatorios');
    }
    if (precio === undefined || stock === undefined) {
      throw new Error('Complete los campos obligatorios');
    }

    // Validaciones acordes a BD: precio > 0, stock >= 0
    if (typeof precio !== 'number' || precio <= 0) {
      throw new Error('El precio debe ser un número mayor a cero');
    }
    if (typeof stock !== 'number' || stock < 0) {
      throw new Error('El stock no puede ser negativo');
    }

    const existente = await this.productoRepo.buscarPorNombre(nombre.trim());
    if (existente) {
      throw new Error('Ya existe un producto con ese nombre');
    }

    const categoria = await this.categoriaRepo.buscarPorId(id_categoria);
    if (!categoria) {
      throw new Error('La categoría asociada no existe');
    }

    // CP-CU-023-03: imagen por defecto si no se envía
    const imagenFinal = imagen_url && imagen_url.trim() !== '' ? imagen_url.trim() : 'sin_imagen.jpg';

    return await this.productoRepo.guardar({
      id_categoria,
      nombre: nombre.trim(),
      descripcion: descripcion || '',
      precio,
      stock,
      imagen_url: imagenFinal,
      estado: 1 // Activo por defecto (RN-100)
    });
  }
}

module.exports = CrearProductoUseCase;