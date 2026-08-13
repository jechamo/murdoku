/**
 * Elección de la verdad del caso: dónde estaba cada uno.
 *
 * Los n ocupantes (víctima + n-1 sospechosos) forman una permutación: exactamente uno por
 * fila y uno por columna, siempre sobre casillas no bloqueadas. Además se exige que
 * **exactamente un sospechoso** comparta habitación con la víctima, que es lo que convierte
 * la rejilla resuelta en una acusación sin discusión posible.
 */

import { ELENCO } from '../data/cast';
import { aCelda } from './types';
import type { Rng } from './rng';
import type { Celda, Plano, Reparto } from './types';

/** Una permutación válida, con la casilla del cadáver ya separada del resto. */
export type Colocacion = {
  /** Las n casillas ocupadas, una por fila y columna. */
  celdas: Celda[];
  victimaEn: Celda;
  /** Las n-1 casillas restantes, para los sospechosos. */
  deSospechosos: Celda[];
};

/** Permutación al azar sobre casillas libres, por backtracking con órdenes barajados. */
function permutacionAlAzar(rng: Rng, plano: Plano): Celda[] | null {
  const { n, bloqueada } = plano;
  const filas = rng.baraja(Array.from({ length: n }, (_, i) => i));
  const colsUsadas = new Set<number>();
  const elegidas: Celda[] = [];

  const buscar = (i: number): boolean => {
    if (i === filas.length) return true;
    const f = filas[i]!;
    for (const c of rng.baraja(Array.from({ length: n }, (_, j) => j))) {
      if (colsUsadas.has(c)) continue;
      const celda = aCelda(f, c, n);
      if (bloqueada[celda]) continue;
      colsUsadas.add(c);
      elegidas.push(celda);
      if (buscar(i + 1)) return true;
      elegidas.pop();
      colsUsadas.delete(c);
    }
    return false;
  };

  return buscar(0) ? [...elegidas] : null;
}

/**
 * Elige una colocación completa. Devuelve null si con esta permutación ninguna casilla sirve
 * como escena del crimen (es decir, no hay ninguna que deje exactamente un sospechoso en su
 * habitación); el generador simplemente vuelve a tirar.
 */
export function elegirColocacion(rng: Rng, plano: Plano): Colocacion | null {
  const celdas = permutacionAlAzar(rng, plano);
  if (celdas === null) return null;

  const candidatas = celdas.filter((victimaEn) => {
    const hab = plano.habitacionDe[victimaEn];
    const acompanantes = celdas.filter(
      (c) => c !== victimaEn && plano.habitacionDe[c] === hab,
    );
    return acompanantes.length === 1;
  });
  if (candidatas.length === 0) return null;

  const victimaEn = rng.elige(candidatas);
  return {
    celdas,
    victimaEn,
    deSospechosos: celdas.filter((c) => c !== victimaEn),
  };
}

/** Reparte n personajes del elenco: uno hace de víctima y el resto de sospechosos. */
export function repartirPersonajes(rng: Rng, n: number): Reparto {
  if (n > ELENCO.length) {
    throw new Error(`El elenco tiene ${ELENCO.length} personajes y hacen falta ${n}`);
  }
  const elegidos = rng.baraja(ELENCO.map((p) => p.id)).slice(0, n);
  return { victima: elegidos[0]!, sospechosos: elegidos.slice(1) };
}

/** Quién comparte habitación con la víctima. Por construcción es exactamente uno. */
export function hallarAsesino(
  plano: Plano,
  victimaEn: Celda,
  posiciones: Record<string, Celda>,
): string {
  const habVictima = plano.habitacionDe[victimaEn];
  const culpables = Object.entries(posiciones)
    .filter(([, celda]) => plano.habitacionDe[celda] === habVictima)
    .map(([id]) => id);
  if (culpables.length !== 1) {
    throw new Error(
      `La escena deja ${culpables.length} sospechosos con la víctima; debería ser exactamente 1`,
    );
  }
  return culpables[0]!;
}
