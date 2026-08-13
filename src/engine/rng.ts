/**
 * Generador pseudoaleatorio determinista.
 *
 * Todo el caso se deriva de una semilla, así que la misma semilla produce siempre el mismo
 * Murdoku. Eso es lo que permite compartir un caso por URL y lo que hace reproducibles los tests.
 */

export type Rng = {
  /** Flotante en [0, 1). */
  siguiente(): number;
  /** Entero en [0, n). */
  entero(n: number): number;
  /** Elemento al azar. Lanza si la lista está vacía. */
  elige<T>(xs: readonly T[]): T;
  /** Copia barajada (Fisher-Yates). */
  baraja<T>(xs: readonly T[]): T[];
  /** true con probabilidad p. */
  quiza(p: number): boolean;
};

/** Hash de cadena a entero de 32 bits (variante de xmur3). */
function hashSemilla(semilla: string): number {
  let h = 1779033703 ^ semilla.length;
  for (let i = 0; i < semilla.length; i++) {
    h = Math.imul(h ^ semilla.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^= h >>> 16) >>> 0;
}

export function crearRng(semilla: string): Rng {
  let estado = hashSemilla(semilla);

  const siguiente = (): number => {
    estado = (estado + 0x6d2b79f5) >>> 0;
    let t = estado;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const entero = (n: number): number => Math.floor(siguiente() * n);

  return {
    siguiente,
    entero,
    elige<T>(xs: readonly T[]): T {
      if (xs.length === 0) throw new Error('elige() sobre una lista vacía');
      return xs[entero(xs.length)]!;
    },
    baraja<T>(xs: readonly T[]): T[] {
      const copia = [...xs];
      for (let i = copia.length - 1; i > 0; i--) {
        const j = entero(i + 1);
        [copia[i], copia[j]] = [copia[j]!, copia[i]!];
      }
      return copia;
    },
    quiza(p: number): boolean {
      return siguiente() < p;
    },
  };
}

const ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** Semilla legible y fácil de dictar: sin caracteres ambiguos (I, O, 0, 1). */
export function semillaAleatoria(longitud = 6): string {
  let s = '';
  for (let i = 0; i < longitud; i++) {
    s += ALFABETO[Math.floor(Math.random() * ALFABETO.length)];
  }
  return s;
}
