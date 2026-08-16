const ListarBancosUseCase = require('../application/ListarBancosUseCase');
const InMemoryBancoRepository = require('../infraestructure/repositories/in-memory/InMemoryBancoRepository');

describe('ListarBancosUseCase', () => {
  it('devuelve solo los bancos activos con su información de pago', async () => {
    const repositorio = new InMemoryBancoRepository();
    repositorio.bancos.push(
      { id_banco: 1, id_metodo_pago: 2, nombre: 'Nequi', descripcion: 'Monedero virtual', numero_cuenta: '3001234567', activo: 1 },
      { id_banco: 2, id_metodo_pago: 2, nombre: 'Daviplata', descripcion: 'Monedero virtual (llave)', numero_cuenta: '3001234567', activo: 1 },
      { id_banco: 3, id_metodo_pago: 2, nombre: 'Bancolombia', descripcion: 'Cuenta de ahorros', numero_cuenta: '123456789', activo: 0 }
    );
    const casoUso = new ListarBancosUseCase(repositorio);

    const bancos = await casoUso.execute();

    expect(bancos).toHaveLength(2);
    expect(bancos.map((b) => b.id_banco)).toEqual([1, 2]);
    expect(bancos[0].nombre).toBe('Nequi');
    expect(bancos[0].numero_cuenta).toBe('3001234567');
  });

  it('devuelve lista vacía si no hay bancos activos', async () => {
    const repositorio = new InMemoryBancoRepository();
    repositorio.bancos.push(
      { id_banco: 1, id_metodo_pago: 2, nombre: 'Nequi', descripcion: 'Monedero virtual', numero_cuenta: '3001234567', activo: 0 }
    );
    const casoUso = new ListarBancosUseCase(repositorio);

    const bancos = await casoUso.execute();

    expect(bancos).toEqual([]);
  });
});