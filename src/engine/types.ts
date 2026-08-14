/** Tipos compartidos por todo el motor. El motor no importa nada de React. */

export const N_MIN = 4;
export const N_MAX = 8;

/** Índice plano de casilla: fila * n + columna. */
export type Celda = number;

export type Dificultad = 'aprendiz' | 'facil' | 'medio' | 'dificil';

export const DIFICULTADES: Dificultad[] = ['aprendiz', 'facil', 'medio', 'dificil'];

export const NOMBRE_DIFICULTAD: Record<Dificultad, string> = {
  aprendiz: 'Aprendiz',
  facil: 'Fácil',
  medio: 'Medio',
  dificil: 'Difícil',
};

/**
 * Perfil de un nivel. La dificultad no es solo "qué técnica hace falta": para alguien que
 * empieza pesa más **de qué hablan las pistas**. «Estaba junto a la nevera» es mirar el plano;
 * «estaba a 5 pasos de la víctima» es una abstracción. Por eso cada nivel limita también el
 * vocabulario.
 */
export type PerfilDificultad = {
  /** Técnica deductiva más avanzada que se le va a exigir al jugador. */
  nivel: 1 | 2 | 3 | 4;
  /** Tipos de pista admitidos, o null para todos. */
  vocabulario: TipoPista[] | null;
  /** Si es true, la casilla del cadáver se da siempre; nunca hay que deducirla. */
  cadaverSiempreALaVista: boolean;
  /**
   * Si es true, el caso tiene que necesitar **exactamente** esa técnica, no menos.
   *
   * En los niveles de arriba importa: un «difícil» que se resuelve con singles de sudoku no es
   * difícil. Abajo no, porque lo que gradúa no es la técnica —Aprendiz y Fácil comparten
   * techo— sino el vocabulario y el tamaño del plano.
   */
  nivelExacto: boolean;
  /** Edad orientativa, para el menú. */
  desde: number;
};

/** Pistas que se leen mirando el plano, sin cuentas ni comparaciones. */
const VOCABULARIO_CONCRETO: TipoPista[] = [
  'habitacion',
  'juntoAMueble',
  'enMueble',
  'mismaHabitacion',
  'aSolas',
];

export const PERFILES: Record<Dificultad, PerfilDificultad> = {
  aprendiz: {
    nivel: 2,
    vocabulario: VOCABULARIO_CONCRETO,
    cadaverSiempreALaVista: true,
    nivelExacto: false,
    desde: 7,
  },
  facil: {
    nivel: 2,
    vocabulario: [...VOCABULARIO_CONCRETO, 'esquina', 'perimetro', 'recuento', 'noEnFila', 'noEnColumna'],
    cadaverSiempreALaVista: true,
    nivelExacto: false,
    desde: 10,
  },
  medio: { nivel: 3, vocabulario: null, cadaverSiempreALaVista: false, nivelExacto: true, desde: 13 },
  dificil: {
    nivel: 4,
    vocabulario: null,
    cadaverSiempreALaVista: false,
    nivelExacto: true,
    desde: 16,
  },
};

/** Nivel de técnica deductiva que hace falta para cerrar la rejilla. */
export const NIVEL_DE_DIFICULTAD: Record<Dificultad, 1 | 2 | 3 | 4> = {
  aprendiz: PERFILES.aprendiz.nivel,
  facil: PERFILES.facil.nivel,
  medio: PERFILES.medio.nivel,
  dificil: PERFILES.dificil.nivel,
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
 * Referencia a un actor dentro de una pista. La víctima se nombra con esta constante.
 *
 * Si el caso la revela, su casilla es conocida y toda pista que la mencione se convierte en la
 * práctica en una restricción unaria. Si no, es un ocupante más que hay que deducir.
 */
export const VICTIMA = '@victima';

export type Direccion = 'norte' | 'sur' | 'este' | 'oeste';

/**
 * Rasgos que puede contar una pista general. Todos son propiedades **de la casilla**, no de la
 * partida: eso es lo que permite al solver usarlas para podar dominios. Un rasgo como "estaba a
 * solas" dependería de dónde está todo el mundo y no se podría propagar, así que no entra: una
 * pista que el solver no sabe usar acabaría siendo redundante y la poda la quitaría igual.
 */
export type Rasgo = 'enMueble' | 'perimetro' | 'esquina';

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
  // Pista general: no nombra a nadie, cuenta cuántos sospechosos cumplen un rasgo. El
  // pasatiempo impreso las usa ("había exactamente una persona sobre una cama").
  | { tipo: 'recuentoRasgo'; rasgo: Rasgo; cuantos: number }
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
  /** Casilla donde apareció el cadáver. */
  victimaEn: Celda;
  /**
   * Si es `false`, la casilla del cadáver **no** se da: hay que deducirla como la de cualquier
   * otro. Sale sola al final, porque al colocar a los sospechosos queda libre una única fila y
   * una única columna, y el cadáver está en su cruce — es "la última casilla libre" del libro.
   */
  victimaRevelada: boolean;
  pistas: Pista[];
  solucion: Solucion;
};

/** Asignación (parcial o total) de sospechosos a casillas. */
export type Asignacion = Record<string, Celda>;
