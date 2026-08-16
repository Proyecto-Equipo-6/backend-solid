class EditarCategoriaUseCase {
  constructor(categoriaRepo) {
    this.categoriaRepo = categoriaRepo;
  }

  async ejecutar(id_categoria, { nombre, descripcion, estado }) {
    const categoria = await this.categoriaRepo.buscarPorId(id_categoria);
    if (!categoria) {
      throw new Error('Categoría no encontrada');
    }

    if (!nombre || nombre.trim() === '') {
      throw new Error('Complete los campos obligatorios'); // FA-002
    }

    const existente = await this.categoriaRepo.buscarPorNombre(nombre.trim());
    if (existente && existente.id_categoria !== id_categoria) {
      throw new Error('Ya existe una categoría con ese nombre'); // RN-092
    }

    // Validar y convertir estado
    let estadoNumerico = categoria.estado;
    if (estado !== undefined) {
      if (estado === 'Activo') estadoNumerico = 1;
      else if (estado === 'Inactivo') estadoNumerico = 0;
      else if ([0, 1].includes(estado)) estadoNumerico = estado;
      else throw new Error('Estado inválido');
    }

    return await this.categoriaRepo.actualizar(id_categoria, {
      nombre: nombre.trim(),
      descripcion: descripcion !== undefined ? descripcion : categoria.descripcion,
      estado: estadoNumerico
    });
  }
}

module.exports = EditarCategoriaUseCase;