/**
 * Construcción del plano: reparto del tablero en habitaciones contiguas y amueblado.
 *
 * Invariantes que garantiza este módulo:
 *  - toda habitación es un rectángulo de al menos 2×2, como en el plano de una casa;
 *  - cada `id` de mueble aparece como mucho una vez en todo el tablero (las pistas del tipo
 *    "junto al televisor" dependen de ello para no ser ambiguas);
 *  - queda al menos una colocación válida de n ocupantes, uno por fila y uno por columna,
 *    sobre casillas no bloqueadas.
 */

import { ESCENARIOS, habitacion } from '../data/rooms';
import { mueble } from '../data/furniture';
import { emparejamientoPerfecto, esContigua, todasLasCeldas } from './grid';
import type { Rng } from './rng';
import type { Celda, Plano } from './types';

/**
 * Número de habitaciones según el tamaño del tablero.
 *
 * Toda estancia es un rectángulo de 2×2 como mínimo, así que en un plano de n×n no caben más
 * de n²/4: pedir más sería pedir imposibles. En un 4×4 entran exactamente 4.
 */
function cuantasHabitaciones(rng: Rng, n: number): number {
  const techo = Math.floor((n * n) / 4);
  if (n <= 5) return Math.min(4, techo);
  if (n === 6) return Math.min(4 + rng.entero(2), techo);
  if (n === 7) return Math.min(5 + rng.entero(2), techo);
  return Math.min(5 + rng.entero(3), techo);
}

type Rect = { x: number; y: number; w: number; h: number };

/**
 * Reparto en habitaciones **rectangulares**, por cortes sucesivos del plano.
 *
 * Antes esto crecía regiones desde semillas dispersas, y salían estancias con forma de
 * serpiente de una casilla de ancho: correcto para el motor, pero no parecía una casa. Los
 * Murdokus impresos reparten la planta en bloques compactos separados por muros, y con cortes
 * rectos se consigue exactamente eso.
 *
 * En cada paso se parte el rectángulo más grande por su lado largo, evitando lonjas
 * estrechas: ninguna habitación baja de 2 casillas de lado.
 */
function repartirRegiones(rng: Rng, n: number, k: number): number[] | null {
  // Devuelve el reparto y, con él, **cuántas piezas han salido de verdad**: puede ser menos de
  // las pedidas si no caben. Quien llama tiene que quedarse con esa cifra, no con la pedida.
  const LADO_MINIMO = 2;
  let piezas: Rect[] = [{ x: 0, y: 0, w: n, h: n }];

  while (piezas.length < k) {
    // Se corta la mayor de las que todavía admiten corte.
    const cortables = piezas.filter(
      (r) => Math.max(r.w, r.h) >= LADO_MINIMO * 2,
    );
    if (cortables.length === 0) break;

    const mayor = Math.max(...cortables.map((r) => r.w * r.h));
    const objetivo = rng.elige(cortables.filter((r) => r.w * r.h === mayor));

    // Por el lado largo, para que no salgan pasillos alargados.
    const vertical = objetivo.w === objetivo.h ? rng.quiza(0.5) : objetivo.w > objetivo.h;
    const largo = vertical ? objetivo.w : objetivo.h;
    if (largo < LADO_MINIMO * 2) break;

    // El corte cae en la zona central: partir por el borde daría habitaciones de una tira.
    const corte = LADO_MINIMO + rng.entero(largo - LADO_MINIMO * 2 + 1);

    piezas = piezas.filter((r) => r !== objetivo);
    piezas.push(
      vertical
        ? { x: objetivo.x, y: objetivo.y, w: corte, h: objetivo.h }
        : { x: objetivo.x, y: objetivo.y, w: objetivo.w, h: corte },
      vertical
        ? { x: objetivo.x + corte, y: objetivo.y, w: objetivo.w - corte, h: objetivo.h }
        : { x: objetivo.x, y: objetivo.y + corte, w: objetivo.w, h: objetivo.h - corte },
    );
  }

  if (piezas.length < 4) return null;

  const region = new Array<number>(n * n).fill(-1);
  piezas.forEach((r, i) => {
    for (let y = r.y; y < r.y + r.h; y++) {
      for (let x = r.x; x < r.x + r.w; x++) region[y * n + x] = i;
    }
  });
  if (region.some((r) => r === -1)) return null;
  return region;
}

/** Cuántas regiones distintas hay en un reparto. */
function cuantasRegiones(region: readonly number[]): number {
  return new Set(region).size;
}

/** Coloca mobiliario temático y garantiza que el plano siga admitiendo una colocación válida. */
function amueblar(
  rng: Rng,
  n: number,
  region: number[],
  idsHabitacion: string[],
): { muebleDe: (string | null)[]; bloqueada: boolean[] } {
  const total = n * n;
  const muebleDe = new Array<string | null>(total).fill(null);
  const bloqueada = new Array<boolean>(total).fill(false);

  const celdasDeRegion: Celda[][] = idsHabitacion.map(() => []);
  for (let celda = 0; celda < total; celda++) celdasDeRegion[region[celda]!]!.push(celda);

  idsHabitacion.forEach((idHab, i) => {
    const hab = habitacion(idHab);
    const celdas = rng.baraja(celdasDeRegion[i]!);

    // Se amuebla entre un tercio y la mitad de la estancia. Que la casilla quede libre o no
    // lo decide el mueble: en la cama o en la butaca sí cabe alguien, en el armario no.
    const densidad = 0.35 + rng.siguiente() * 0.2;
    const cuantos = Math.min(
      hab.muebles.length,
      celdas.length - 1,
      Math.max(1, Math.round(celdas.length * densidad)),
    );

    rng.baraja(hab.muebles)
      .slice(0, cuantos)
      .forEach((idMueble, j) => {
        const celda = celdas[j]!;
        muebleDe[celda] = idMueble;
        bloqueada[celda] = !mueble(idMueble).ocupable;
      });
  });

  // Reparación: si el amueblado ha dejado el tablero sin colocación posible, se van liberando
  // casillas bloqueadas al azar hasta que vuelva a haberla.
  const libre = bloqueada.map((b) => !b);
  let intentos = 0;
  while (emparejamientoPerfecto(libre, n) === null && intentos < total) {
    const ocupadas = todasLasCeldas(n).filter((c) => bloqueada[c]);
    if (ocupadas.length === 0) break;
    const soltar = rng.elige(ocupadas);
    bloqueada[soltar] = false;
    libre[soltar] = true;
    muebleDe[soltar] = null;
    intentos++;
  }

  return { muebleDe, bloqueada };
}

/** Genera un plano completo, o null si el reparto en regiones no ha cuajado con esta semilla. */
export function generarPlano(rng: Rng, n: number): Plano | null {
  const escenario = rng.elige(ESCENARIOS);
  const k = Math.min(cuantasHabitaciones(rng, n), escenario.habitaciones.length);

  const region = repartirRegiones(rng, n, k);
  if (region === null) return null;

  // Se nombran tantas habitaciones como piezas hayan salido, no como se pidieron. Si se usara
  // `k` a secas, un plano pequeño declararía estancias sin ninguna casilla, y a la primera que
  // alguien pidiera su rectángulo saldría un Math.min() sobre una lista vacía.
  const idsHabitacion = rng.baraja(escenario.habitaciones).slice(0, cuantasRegiones(region));
  const { muebleDe, bloqueada } = amueblar(rng, n, region, idsHabitacion);

  const habitacionDe = region.map((r) => idsHabitacion[r]!);

  // Comprobación de contigüidad: el crecimiento la garantiza, pero es barata y evita que un
  // cambio futuro en el reparto rompa las pistas de habitación sin que nos enteremos.
  for (const idHab of idsHabitacion) {
    const celdas = todasLasCeldas(n).filter((c) => habitacionDe[c] === idHab);
    if (!esContigua(celdas, n)) return null;
  }

  return {
    n,
    escenario: escenario.id,
    habitacionDe,
    habitaciones: idsHabitacion,
    muebleDe,
    bloqueada,
  };
}

/** Casillas de una habitación. */
export function celdasDeHabitacion(plano: Plano, idHab: string): Celda[] {
  return todasLasCeldas(plano.n).filter((c) => plano.habitacionDe[c] === idHab);
}

/**
 * Rectángulo que ocupa una habitación. Como el reparto es por cortes rectos, la caja
 * envolvente **es** la habitación.
 */
export function rectanguloDeHabitacion(
  plano: Plano,
  idHab: string,
): { f0: number; c0: number; f1: number; c1: number } {
  const celdas = celdasDeHabitacion(plano, idHab);
  const filas = celdas.map((c) => Math.floor(c / plano.n));
  const cols = celdas.map((c) => c % plano.n);
  return {
    f0: Math.min(...filas),
    c0: Math.min(...cols),
    f1: Math.max(...filas),
    c1: Math.max(...cols),
  };
}

/**
 * ¿Está la casilla en una de las cuatro esquinas de **su habitación**?
 *
 * El pasatiempo impreso usa la esquina de la estancia, no la del plano, y es mucho mejor
 * pista: la del plano solo señala 4 casillas de todo el tablero.
 */
export function esEsquinaDeHabitacion(plano: Plano, celda: Celda): boolean {
  const r = rectanguloDeHabitacion(plano, plano.habitacionDe[celda]!);
  const f = Math.floor(celda / plano.n);
  const c = celda % plano.n;
  return (f === r.f0 || f === r.f1) && (c === r.c0 || c === r.c1);
}

/** Casilla donde está un mueble concreto, o null. Los ids son únicos en el tablero. */
export function celdaDelMueble(plano: Plano, idMueble: string): Celda | null {
  const i = plano.muebleDe.indexOf(idMueble);
  return i === -1 ? null : i;
}
