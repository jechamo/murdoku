/** Tipos compartidos por todo el motor. El motor no importa nada de React. */

export const N_MIN = 6;
export const N_MAX = 8;

/** Índice plano de casilla: fila * n + columna. */
export type Celda = number;

export type Dificultad = 'facil' | 'medio' | 'dificil';

export const DIFICULTADES: Dificultad[] = ['facil', 'medio', 'dificil'];

export const NOMBRE_DIFICULTAD: Record<Dificultad, string> = {
  facil: 'Fácil',
  medio: 'Medio',
  dificil: 'Difícil',
};

/** Nivel de técnica deductiva que hace falta para cerrar la rejilla. */
export const NIVEL_DE_DIFICULTAD: Record<Dificultad, 1 | 2 | 3 | 4> = {
  facil: 2,
  medio: 3,
  dificil: 4,
};

export function fila(celda: Celda, n: number): number {
  return Math.floor(celda / n);
}

export function columna(celda: Celda, n: number): number {
  return celda % n;
}

export function aCelda(f: number, c: number, n: number): Celda {
  return f * n + c;
}

/** Nombre de casilla al estilo tablero: A1, D6... Columna en letra, fila en número. */
export function nombreCelda(celda: Celda, n: number): string {
  return `${String.fromCharCode(65 + columna(celda, n))}${fila(celda, n) + 1}`;
}

/** El plano del escenario: qué habitación y qué mueble hay en cada casilla. */
export type Plano = {
  n: number;
  /** id del escenario (ver data/rooms.ts). */
  escenario: string;
  /** id de habitación de cada casilla. */
  habitacionDe: string[];
  /** ids de las habitaciones presentes, sin repetir. */
  habitaciones: string[];
  /** id de mueble de cada casilla, o null. */
  muebleDe: (string | null)[];
  /** true si la casilla no admite personaje (mueble que llena la casilla). */
  bloqueada: boolean[];
};

/** Quién juega en este caso. */
export type Reparto = {
  /** id de personaje de la víctima. */
  victima: string;
  /** ids de los sospechosos, N-1 de ellos. */
  sospechosos: string[];
};

/** La verdad del caso. */
export type Solucion = {
  /** Casilla de cada sospechoso, por id. */
  posiciones: Record<string, Celda>;
  /** id del sospechoso que comparte habitación con la víctima. */
  asesino: string;
};

/**
 * Referencia a un actor dentro de una pista. La víctima se nombra con esta constante,
 * y como su casilla es conocida desde el principio, cualquier pista que la mencione
 * es en la práctica una restricción unaria.
 */
export const VICTIMA = '@victima';

export type Direccion = 'norte' | 'sur' | 'este' | 'oeste';

export type Pista =
  | { tipo: 'habitacion'; actor: string; habitacion: string; negada: boolean }
  | { tipo: 'juntoAMueble'; actor: string; mueble: string; negada: boolean }
  | { tipo: 'enMueble'; actor: string; mueble: string }
  | { tipo: 'direccion'; actor: string; otro: string; dir: Direccion }
  // Ojo: dos ocupantes nunca comparten fila ni columna, así que no pueden ser contiguos en
  // ortogonal. La única vecindad posible entre ellos es la diagonal.
  | { tipo: 'diagonal'; a: string; b: string; negada: boolean }
  | { tipo: 'distancia'; a: string; b: string; pasos: number }
  | { tipo: 'masCerca'; cerca: string; lejos: string; ref: string }
  | { tipo: 'perimetro'; actor: string; negada: boolean }
  // Esquina de SU habitación, no del plano: es como lo plantea el pasatiempo impreso,
  // y con habitaciones rectangulares sale una pista mucho más jugosa.
  | { tipo: 'esquina'; actor: string; negada: boolean }
  | { tipo: 'mismaHabitacion'; a: string; b: string; negada: boolean }
  | { tipo: 'aSolas'; actor: string }
  | { tipo: 'recuento'; habitacion: string; cuantos: number }
  | { tipo: 'noEnFila'; actor: string; f: number }
  | { tipo: 'noEnColumna'; actor: string; c: number };

export type TipoPista = Pista['tipo'];

/** Un caso completo, todo derivado de la semilla. */
export type Caso = {
  semilla: string;
  n: number;
  dificultad: Dificultad;
  plano: Plano;
  reparto: Reparto;
  /** Casilla donde apareció el cadáver. Se revela desde el inicio. */
  victimaEn: Celda;
  pistas: Pista[];
  solucion: Solucion;
};

/** Asignación (parcial o total) de sospechosos a casillas. */
export type Asignacion = Record<string, Celda>;
