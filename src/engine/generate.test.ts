/**
 * Verificación del generador sobre un lote de semillas.
 *
 * El test que de verdad importa es el de unicidad: se cuenta **por fuerza bruta y sin apoyarse
 * en la propagación** cuántas asignaciones cumplen todas las pistas. Si el solver deductivo
 * tuviera un fallo, este conteo lo delataría, porque los dos caminos son independientes.
 */

import { describe, expect, it } from 'vitest';

import { celdasDeHabitacion } from './layout';
import { ctxDe, generarCaso, codigoDeCaso, leerCodigo } from './generate';
import { cumpleTodas, redactar, satisface } from './clues';
import {
  contarSoluciones,
  dominiosIniciales,
  nivelRequerido,
  propagar,
  resolverPorDeduccion,
} from './solver';
import { esContigua, todasLasCeldas } from './grid';
import {
  columna,
  fila,
  DIFICULTADES,
  NIVEL_DE_DIFICULTAD,
  type Caso,
  type Dificultad,
} from './types';

/** 20 semillas × 3 tamaños × 3 dificultades = 180 casos. */
const SEMILLAS = Array.from({ length: 20 }, (_, i) => `S${i}`);
const TAMANOS = [6, 7, 8];

const CASOS: { caso: Caso; etiqueta: string }[] = [];
for (const n of TAMANOS) {
  for (const dificultad of DIFICULTADES) {
    for (const semilla of SEMILLAS) {
      CASOS.push({
        caso: generarCaso({ semilla, n, dificultad }),
        etiqueta: `${n}×${n} ${dificultad} ${semilla}`,
      });
    }
  }
}

describe('el generador produce casos válidos', () => {
  it('genera los 180 casos del lote', () => {
    expect(CASOS).toHaveLength(180);
  });

  it('la solución declarada cumple todas las pistas emitidas', () => {
    for (const { caso, etiqueta } of CASOS) {
      const ctx = ctxDe(caso);
      expect(cumpleTodas(caso.pistas, ctx, caso.solucion.posiciones), etiqueta).toBe(true);
    }
  });

  it('cada caso tiene exactamente una solución (conteo exhaustivo, sin propagación)', () => {
    for (const { caso, etiqueta } of CASOS) {
      const ctx = ctxDe(caso);
      // Dominios crudos: solo casillas libres fuera de la fila y columna del cadáver.
      const dom = dominiosIniciales(ctx);
      expect(contarSoluciones(caso.pistas, ctx, dom, 5), etiqueta).toBe(1);
    }
  });

  it('se resuelve por deducción pura, sin backtracking', () => {
    for (const { caso, etiqueta } of CASOS) {
      const ctx = ctxDe(caso);
      const nivel = NIVEL_DE_DIFICULTAD[caso.dificultad];
      expect(resolverPorDeduccion(caso.pistas, ctx, nivel).cerrado, etiqueta).toBe(true);
    }
  });

  it('la dificultad pedida es la que realmente hace falta', () => {
    for (const { caso, etiqueta } of CASOS) {
      expect(nivelRequerido(caso.pistas, ctxDe(caso)), etiqueta).toBe(
        NIVEL_DE_DIFICULTAD[caso.dificultad],
      );
    }
  });

  it('el conjunto de pistas es irredundante: quitar cualquiera rompe el caso', () => {
    for (const { caso, etiqueta } of CASOS) {
      const ctx = ctxDe(caso);
      const nivel = NIVEL_DE_DIFICULTAD[caso.dificultad];
      for (let i = 0; i < caso.pistas.length; i++) {
        const sinElla = caso.pistas.filter((_, j) => j !== i);
        expect(
          resolverPorDeduccion(sinElla, ctx, nivel).cerrado,
          `${etiqueta}: sobra la pista ${i + 1} — ${redactar(caso.pistas[i]!)}`,
        ).toBe(false);
      }
    }
  });

  it('la propagación es sólida: nunca descarta la casilla verdadera', () => {
    for (const { caso, etiqueta } of CASOS) {
      const ctx = ctxDe(caso);
      const dom = dominiosIniciales(ctx);
      expect(propagar(caso.pistas, ctx, dom, 4), etiqueta).toBe(true);
      for (const [actor, celda] of Object.entries(caso.solucion.posiciones)) {
        expect(dom.get(actor)!.has(celda), `${etiqueta}: ${actor}`).toBe(true);
      }
    }
  });
});

describe('el plano respeta las reglas del escenario', () => {
  it('los ocupantes forman una permutación sobre casillas libres', () => {
    for (const { caso, etiqueta } of CASOS) {
      const celdas = [...Object.values(caso.solucion.posiciones), caso.victimaEn];
      expect(celdas, etiqueta).toHaveLength(caso.n);

      const filas = new Set(celdas.map((c) => fila(c, caso.n)));
      const cols = new Set(celdas.map((c) => columna(c, caso.n)));
      expect(filas.size, `${etiqueta}: filas repetidas`).toBe(caso.n);
      expect(cols.size, `${etiqueta}: columnas repetidas`).toBe(caso.n);

      for (const c of celdas) {
        expect(caso.plano.bloqueada[c], `${etiqueta}: ocupante en casilla bloqueada`).toBe(false);
      }
    }
  });

  it('las habitaciones son contiguas y tienen al menos 3 casillas', () => {
    for (const { caso, etiqueta } of CASOS) {
      for (const h of caso.plano.habitaciones) {
        const celdas = celdasDeHabitacion(caso.plano, h);
        expect(celdas.length, `${etiqueta}: ${h} demasiado pequeña`).toBeGreaterThanOrEqual(3);
        expect(esContigua(celdas, caso.n), `${etiqueta}: ${h} partida en trozos`).toBe(true);
      }
      // Toda casilla pertenece a una habitación declarada.
      for (const c of todasLasCeldas(caso.n)) {
        expect(caso.plano.habitaciones).toContain(caso.plano.habitacionDe[c]);
      }
    }
  });

  it('ningún mueble aparece dos veces en el mismo tablero', () => {
    for (const { caso, etiqueta } of CASOS) {
      const puestos = caso.plano.muebleDe.filter((m): m is string => m !== null);
      expect(new Set(puestos).size, `${etiqueta}: mueble repetido`).toBe(puestos.length);
    }
  });

  it('una casilla está bloqueada exactamente cuando su mueble llena la casilla', () => {
    for (const { caso, etiqueta } of CASOS) {
      for (const c of todasLasCeldas(caso.n)) {
        if (caso.plano.bloqueada[c]) {
          expect(caso.plano.muebleDe[c], `${etiqueta}: bloqueo sin mueble`).not.toBeNull();
        }
      }
    }
  });
});

describe('el crimen tiene un único culpable', () => {
  it('exactamente un sospechoso comparte habitación con la víctima', () => {
    for (const { caso, etiqueta } of CASOS) {
      const habVictima = caso.plano.habitacionDe[caso.victimaEn];
      const acompanantes = Object.entries(caso.solucion.posiciones).filter(
        ([, c]) => caso.plano.habitacionDe[c] === habVictima,
      );
      expect(acompanantes, etiqueta).toHaveLength(1);
      expect(acompanantes[0]![0], etiqueta).toBe(caso.solucion.asesino);
    }
  });

  it('la víctima y los sospechosos son personajes distintos', () => {
    for (const { caso, etiqueta } of CASOS) {
      const todos = [caso.reparto.victima, ...caso.reparto.sospechosos];
      expect(new Set(todos).size, etiqueta).toBe(caso.n);
      expect(caso.reparto.sospechosos, etiqueta).toHaveLength(caso.n - 1);
    }
  });

  it('ninguna pista delata directamente al asesino', () => {
    for (const { caso, etiqueta } of CASOS) {
      for (const pista of caso.pistas) {
        const señala =
          pista.tipo === 'mismaHabitacion' && !pista.negada && pista.b === '@victima';
        expect(señala, `${etiqueta}: ${redactar(pista)}`).toBe(false);
      }
    }
  });
});

describe('todas las pistas se pueden leer', () => {
  it('cada pista se redacta como una frase no vacía', () => {
    for (const { caso, etiqueta } of CASOS) {
      for (const pista of caso.pistas) {
        const texto = redactar(pista);
        expect(texto.length, etiqueta).toBeGreaterThan(10);
        expect(texto, `${etiqueta}: "${texto}"`).not.toContain('undefined');
        expect(texto.endsWith('.'), `${etiqueta}: "${texto}"`).toBe(true);
      }
    }
  });

  it('una pista falsa se detecta como falsa', () => {
    const { caso } = CASOS[0]!;
    const ctx = ctxDe(caso);
    const sospechoso = caso.reparto.sospechosos[0]!;
    const suya = caso.plano.habitacionDe[caso.solucion.posiciones[sospechoso]!]!;
    const otra = caso.plano.habitaciones.find((h) => h !== suya)!;
    expect(
      satisface(
        { tipo: 'habitacion', actor: sospechoso, habitacion: otra, negada: false },
        ctx,
        caso.solucion.posiciones,
      ),
    ).toBe(false);
  });
});

describe('la semilla determina el caso', () => {
  it('la misma semilla produce exactamente el mismo caso', () => {
    for (const n of TAMANOS) {
      for (const dificultad of DIFICULTADES) {
        const a = generarCaso({ semilla: 'REPETIBLE', n, dificultad });
        const b = generarCaso({ semilla: 'REPETIBLE', n, dificultad });
        expect(JSON.stringify(b)).toBe(JSON.stringify(a));
      }
    }
  });

  it('semillas distintas producen casos distintos', () => {
    const codigos = SEMILLAS.slice(0, 10).map((semilla) =>
      JSON.stringify(generarCaso({ semilla, n: 7, dificultad: 'medio' }).solucion),
    );
    expect(new Set(codigos).size).toBeGreaterThan(8);
  });

  it('el código del caso va y vuelve sin perder nada', () => {
    for (const { caso } of CASOS.slice(0, 20)) {
      const leido = leerCodigo(codigoDeCaso(caso));
      expect(leido).toEqual({
        n: caso.n,
        dificultad: caso.dificultad,
        semilla: caso.semilla,
      });
    }
    expect(leerCodigo('basura')).toBeNull();
    expect(leerCodigo('9x9-facil-ABC123')).toBeNull();
    expect(leerCodigo('6x7-facil-ABC123')).toBeNull();
  });
});

describe('rendimiento', () => {
  it('un 8×8 difícil se genera en menos de 1,5 s', () => {
    const t0 = performance.now();
    generarCaso({ semilla: 'CRONO', n: 8, dificultad: 'dificil' });
    expect(performance.now() - t0).toBeLessThan(1500);
  });

  it('cubre las tres dificultades en los tres tamaños', () => {
    const combos = new Set(CASOS.map(({ caso }) => `${caso.n}-${caso.dificultad}`));
    expect(combos.size).toBe(TAMANOS.length * DIFICULTADES.length);
    for (const d of DIFICULTADES as Dificultad[]) {
      expect(CASOS.some(({ caso }) => caso.dificultad === d)).toBe(true);
    }
  });
});
