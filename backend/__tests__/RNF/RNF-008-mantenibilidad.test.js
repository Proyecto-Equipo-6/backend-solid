const fs = require('fs');
const path = require('path');

const RAIZ_BACKEND = path.join(__dirname, '../../../backend');
const CAPAS = {
  domain: path.join(RAIZ_BACKEND, 'domain'),
  application: path.join(RAIZ_BACKEND, 'application'),
  infraestructure: path.join(RAIZ_BACKEND, 'infraestructure'),
};

function listarArchivosJs(directorio, resultado = []) {
  if (!fs.existsSync(directorio)) return resultado;
  for (const entrada of fs.readdirSync(directorio, { withFileTypes: true })) {
    const ruta = path.join(directorio, entrada.name);
    if (entrada.isDirectory()) {
      listarArchivosJs(ruta, resultado);
    } else if (entrada.name.endsWith('.js')) {
      resultado.push(ruta);
    }
  }
  return resultado;
}

function archivosDe(capa) {
  return listarArchivosJs(CAPAS[capa]);
}

describe('RNF-008 CP-RNF-008-01: bajo acoplamiento y buenas prácticas de mantenibilidad (análisis estático)', () => {
  test('la capa de aplicación no depende de la capa de infraestructura', () => {
    const violaciones = archivosDe('application')
      .map((archivo) => ({ archivo, contenido: fs.readFileSync(archivo, 'utf8') }))
      .filter(({ contenido }) => /infraestructure/.test(contenido))
      .map(({ archivo }) => archivo);

    expect(violaciones).toEqual([]);
  });

  test('la capa de dominio no depende de aplicación ni de infraestructura', () => {
    const violaciones = archivosDe('domain')
      .map((archivo) => ({ archivo, contenido: fs.readFileSync(archivo, 'utf8') }))
      .filter(({ contenido }) => /(application|infraestructure)/.test(contenido))
      .map(({ archivo }) => archivo);

    expect(violaciones).toEqual([]);
  });

  test('la dependencia entre capas es unidireccional (solo hacia el dominio)', () => {
    const dependenciaUnidireccional = (origen, prohibido) => {
      return archivosDe(origen)
        .map((archivo) => ({ archivo, contenido: fs.readFileSync(archivo, 'utf8') }))
        .filter(({ contenido }) => new RegExp(prohibido).test(contenido))
        .map(({ archivo }) => archivo);
    };

    expect(dependenciaUnidireccional('infraestructure', 'domain')).not.toEqual([]);
    expect(dependenciaUnidireccional('application', 'domain')).not.toEqual([]);
    expect(dependenciaUnidireccional('domain', 'application')).toEqual([]);
    expect(dependenciaUnidireccional('domain', 'infraestructure')).toEqual([]);
  });

  test('los puertos (interfaces) de dominio son independientes entre sí', () => {
    const archivosPuertos = archivosDe('domain').filter((archivo) =>
      archivo.includes(path.join('ports', path.sep))
    );
    expect(archivosPuertos.length).toBeGreaterThan(0);

    const acoplados = archivosPuertos.filter((archivo) => {
      const contenido = fs.readFileSync(archivo, 'utf8');
      const referencias = [...contenido.matchAll(/require\(['"]([^'"]+)['"]\)/g)].map((m) => m[1]);
      return referencias.some(
        (ref) => ref.includes('domain') && ref.includes('ports')
      );
    });

    expect(acoplados).toEqual([]);
  });
});

describe('RNF-008 CP-RNF-008-02: estructura modular para aislar, corregir y desplegar bugs', () => {
  test('cada caso de uso está en un módulo propio y desacoplado (inyección de dependencias)', () => {
    const casosDeUso = archivosDe('application');
    expect(casosDeUso.length).toBeGreaterThan(30);

    const acopladosAOtrosCasos = casosDeUso.filter((archivo) => {
      const contenido = fs.readFileSync(archivo, 'utf8');
      const referencias = [...contenido.matchAll(/require\(['"]([^'"]+)['"]\)/g)].map((m) => m[1]);
      return referencias.some((ref) => ref.includes('application/') && !ref.includes('application/errors/'));
    });

    expect(acopladosAOtrosCasos).toEqual([]);
  });

  test('los módulos del backend están organizados en capas separadas (domain, application, infraestructure)', () => {
    for (const [nombre, ruta] of Object.entries(CAPAS)) {
      expect(fs.existsSync(ruta)).toBe(true);
      expect(archivosDe(nombre).length).toBeGreaterThan(0);
    }
  });
});

describe('RNF-008 CP-RNF-008-01: métricas de mantenibilidad (duplicación, complejidad, documentación de API)', () => {
  const RAIZ_PROYECTO = path.join(__dirname, '../../..');

  function lineasLogicas(contenido) {
    return contenido
      .split('\n')
      .map((linea) => linea.trim())
      .filter(
        (linea) =>
          linea.length > 1 &&
          !linea.startsWith('//') &&
          !linea.startsWith('*') &&
          !linea.startsWith('/*') &&
          !/^[{}\];]+$/.test(linea)
      );
  }

  test('baja duplicación de código entre módulos (heurística de análisis estático)', () => {
    const MIN_BLOQUE = 6;
    const archivos = archivosDe('application').map((archivo) => ({
      archivo,
      lineas: lineasLogicas(fs.readFileSync(archivo, 'utf8')),
    }));

    const duplicadas = new Set();
    for (let a = 0; a < archivos.length; a++) {
      for (let b = a + 1; b < archivos.length; b++) {
        const LA = archivos[a].lineas;
        const LB = archivos[b].lineas;
        for (let i = 0; i < LA.length; i++) {
          for (let j = 0; j < LB.length; j++) {
            if (LA[i] !== LB[j]) continue;
            let k = 0;
            while (i + k < LA.length && j + k < LB.length && LA[i + k] === LB[j + k]) k++;
            if (k >= MIN_BLOQUE) {
              for (let t = 0; t < k; t++) duplicadas.add(`${a}#${i + t}`);
            }
          }
        }
      }
    }

    const totalLineas = archivos.reduce((acc, f) => acc + f.lineas.length, 0);
    const ratio = totalLineas ? duplicadas.size / totalLineas : 0;
    console.log(
      `[RNF-008] Duplicación (bloques >= ${MIN_BLOQUE} líneas idénticas): ${duplicadas.size}/${totalLineas} líneas (${(ratio * 100).toFixed(2)}%)`
    );

    expect(ratio).toBeLessThan(0.1);
  });

  test('complejidad ciclomática controlada (heurística por archivo)', () => {
    const DECISIONES = /\b(if|for|while|switch|case|catch)\b|\?|&&|\|\|/g;
    const complejidades = archivosDe('application').map((archivo) => {
      const contenido = fs.readFileSync(archivo, 'utf8');
      const complejidad = (contenido.match(DECISIONES) || []).length;
      return { archivo: path.basename(archivo), complejidad };
    });

    complejidades.sort((a, b) => b.complejidad - a.complejidad);
    const maximo = complejidades[0]?.complejidad || 0;

    console.log(
      `[RNF-008] Complejidad ciclomática (heurística): máximo ${maximo} ` +
        `en ${complejidades[0]?.archivo}; media ${(complejidades.reduce((a, b) => a + b.complejidad, 0) / complejidades.length).toFixed(1)}`
    );

    expect(maximo).toBeLessThanOrEqual(60);
  });

  test('la documentación de la API existe y es válida (colección Postman)', () => {
    const dirPostman = path.join(RAIZ_PROYECTO, 'postman');
    expect(fs.existsSync(dirPostman)).toBe(true);

    const colecciones = fs
      .readdirSync(dirPostman)
      .filter((nombre) => nombre.endsWith('.json'));

    expect(colecciones.length).toBeGreaterThan(0);

    for (const nombre of colecciones) {
      const ruta = path.join(dirPostman, nombre);
      const contenido = JSON.parse(fs.readFileSync(ruta, 'utf8'));
      expect(contenido.info).toBeDefined();
      expect(contenido.item).toBeInstanceOf(Array);
      expect(contenido.item.length).toBeGreaterThan(0);
      console.log(`[RNF-008] Colección Postman "${contenido.info?.name || nombre}": ${contenido.item.length} ítems.`);
    }
  });
});