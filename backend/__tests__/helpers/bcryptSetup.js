/**
 * Setup compartido de BCRYPT_ROUNDS para tests.
 * Encapsula el bloque beforeAll/afterAll idéntico en CU-002 y CU-003
 * (causa de duplicación detectada por SonarCloud).
 *
 * Uso (dentro de un describe):
 *   const { configurarBcryptRounds } = require('../../helpers/bcryptSetup');
 *   describe('...', () => {
 *     configurarBcryptRounds();
 *     ...
 *   });
 */
function configurarBcryptRounds() {
  let roundsOriginal;

  beforeAll(() => {
    roundsOriginal = process.env.BCRYPT_ROUNDS;
    process.env.BCRYPT_ROUNDS = '4';
  });

  afterAll(() => {
    if (roundsOriginal === undefined) {
      delete process.env.BCRYPT_ROUNDS;
    } else {
      process.env.BCRYPT_ROUNDS = roundsOriginal;
    }
  });
}

module.exports = { configurarBcryptRounds };