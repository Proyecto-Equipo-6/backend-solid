class ListarTodasCategoriasUseCase {
  constructor(categoriaRepository) {
    this.categoriaRepository = categoriaRepository;
  }

  async execute() {
    const categorias = await this.categoriaRepository.findAll();
    return categorias.map((categoria) => ({
      id_categoria: categoria.id_categoria,
      nombre: categoria.nombre,
      descripcion: categoria.descripcion,
      estado: categoria.estado,
    }));
  }
}

module.exports = ListarTodasCategoriasUseCase;