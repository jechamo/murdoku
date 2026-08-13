/**
 * Construcción del plano: reparto del tablero en habitaciones contiguas y amueblado.
 *
 * Invariantes que garantiza este módulo:
 *  - toda habitación es contigua y tiene al menos 3 casillas;
 *  - cada `id` de mueble aparece como mucho una vez en todo el tablero (las pistas del tipo
 *    "junto al televisor" dependen de ello para no ser ambiguas);
 *  - queda al menos una colocación válida de n ocupantes, uno por fila y uno por columna,
 *    sobre casillas no bloqueadas.
 */

import { ESCENARIOS, habitacion } from '../data/rooms';
import { emparejamientoPerfecto, esContigua, todasLasCeldas, vecinos } from './grid';
import type { Rng } from './rng';
import type { Celda, Plano } from './types';

/** Número de habitaciones según el tamaño del tablero. */
function cuantasHabitaciones(rng: Rng, n: number): number {
  if (n <= 6) return 4 + rng.entero(2); // 4-5
  if (n === 7) return 5 + rng.entero(2); // 5-6
  return 5 + rng.entero(3); // 5-7
}

/**
 * Crecimiento de regiones desde semillas dispersas. En cada paso hace crecer una región con
 * frontera libre, casi siempre la más pequeña, lo que produce habitaciones de tamaño parecido
 * sin que lleguen a parecer un patrón regular.
 */
function repartirRegiones(rng: Rng, n: number, k: number): number[] | null {
  const total = n * n;
  const region = new Array<number>(total).fill(-1);
  const tamano = new Array<number>(k).fill(0);

  const semillas = rng.baraja(todasLasCeldas(n)).slice(0, k);
  semillas.forEach((celda, i) => {
    region[celda] = i;
    tamano[i] = 1;
  });

  let pendientes = total - k;
  while (pendientes > 0) {
    // Frontera de cada región: casillas sin asignar pegadas a ella.
    const fronteras: Celda[][] = Array.from({ length: k }, () => []);
    for (let celda = 0; celda < total; celda++) {
      if (region[celda] !== -1) continue;
      for (const v of vecinos(celda, n)) {
        const r = region[v]!;
        if (r !== -1 && !fronteras[r]!.includes(celda)) fronteras[r]!.push(celda);
      }
    }

    const conFrontera = fronteras
      .map((f, i) => ({ i, f }))
      .filter((x) => x.f.length > 0);
    if (conFrontera.length === 0) return null; // región aislada: plano inservible

    // Sesgo hacia la región más pequeña, con algo de azar para que no salgan todas iguales.
    let elegida: { i: number; f: Celda[] };
    if (rng.quiza(0.75)) {
      const minimo = Math.min(...conFrontera.map((x) => tamano[x.i]!));
      elegida = rng.elige(conFrontera.filter((x) => tamano[x.i] === minimo));
    } else {
      elegida = rng.elige(conFrontera);
    }

    const celda = rng.elige(elegida.f);
    region[celda] = elegida.i;
    tamano[elegida.i]!++;
    pendientes--;
  }

  if (tamano.some((t) => t < 3)) return null;
  return region;
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

    // Entre un cuarto y un tercio largo de la habitación queda ocupada por muebles grandes,
    // dejando siempre al menos una casilla libre donde pueda haber alguien.
    const densidad = 0.25 + rng.siguiente() * 0.15;
    const cuantos = Math.min(
      hab.bloqueantes.length,
      celdas.length - 1,
      Math.max(1, Math.round(celdas.length * densidad)),
    );

    const grandes = rng.baraja(hab.bloqueantes).slice(0, cuantos);
    grandes.forEach((idMueble, j) => {
      const celda = celdas[j]!;
      muebleDe[celda] = idMueble;
      bloqueada[celda] = true;
    });

    // Un elemento de suelo, que sí se puede pisar, en una casilla libre.
    const libres = celdas.slice(cuantos);
    if (libres.length > 0 && hab.suelo.length > 0 && rng.quiza(0.8)) {
      muebleDe[rng.elige(libres)] = rng.elige(hab.suelo);
    }
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

  const idsHabitacion = rng.baraja(escenario.habitaciones).slice(0, k);
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

/** Casilla donde está un mueble concreto, o null. Los ids son únicos en el tablero. */
export function celdaDelMueble(plano: Plano, idMueble: string): Celda | null {
  const i = plano.muebleDe.indexOf(idMueble);
  return i === -1 ? null : i;
}
