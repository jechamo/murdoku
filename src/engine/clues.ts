/**
 * Catálogo de pistas: evaluación, redacción en castellano y generación del banco.
 *
 * Cada pista sabe hacer tres cosas:
 *  1. evaluarse contra una asignación (`satisface`),
 *  2. decir a qué sospechosos menciona (`actoresDe`), que es lo que el solver usa para saber
 *     si es unaria, binaria o global,
 *  3. redactarse como declaración de testigo (`redactar`).
 *
 * La víctima es un actor más, pero su casilla se conoce desde el principio: toda pista que
 * solo la mencione a ella y a un sospechoso es, en la práctica, una restricción unaria.
 */

import { personaje } from '../data/cast';
import { conArticuloHab, enHab, habitacion } from '../data/rooms';
import { juntoA, mueble, sobre } from '../data/furniture';
import { distancia, esEsquina, esPerimetro, vecinos } from './grid';
import type { Rng } from './rng';
import {
  columna,
  fila,
  VICTIMA,
  type Asignacion,
  type Celda,
  type Direccion,
  type Pista,
  type Plano,
} from './types';

export type Contexto = {
  plano: Plano;
  victimaEn: Celda;
  sospechosos: string[];
};

/** Resolutor de posición: la víctima siempre se conoce; los sospechosos, según la asignación. */
function posicion(actor: string, asig: Asignacion, ctx: Contexto): Celda | undefined {
  return actor === VICTIMA ? ctx.victimaEn : asig[actor];
}

/** Sospechosos mencionados por la pista (la víctima no cuenta: su casilla es conocida). */
export function actoresDe(pista: Pista): string[] {
  switch (pista.tipo) {
    case 'habitacion':
    case 'juntoAMueble':
    case 'sobreMueble':
    case 'perimetro':
    case 'esquina':
    case 'noEnFila':
    case 'noEnColumna':
    case 'aSolas':
      return [pista.actor];
    case 'direccion':
      return [pista.actor, pista.otro].filter((a) => a !== VICTIMA);
    case 'diagonal':
    case 'distancia':
    case 'mismaHabitacion':
      return [pista.a, pista.b].filter((a) => a !== VICTIMA);
    case 'masCerca':
      return [pista.cerca, pista.lejos].filter((a) => a !== VICTIMA);
    case 'recuento':
      return [];
  }
}

/**
 * Una pista es global cuando su verdad depende de dónde están *todos* los sospechosos, no solo
 * de los que nombra. El solver las trata aparte.
 */
export function esGlobal(pista: Pista): boolean {
  return pista.tipo === 'recuento' || pista.tipo === 'aSolas';
}

/**
 * ¿Se cumple la pista? `undefined` cuando falta información para decidirlo.
 *
 * Devolver `undefined` en vez de `false` es lo que permite usar la misma función tanto para
 * comprobar una solución completa como para podar durante la búsqueda.
 */
export function satisface(
  pista: Pista,
  ctx: Contexto,
  asig: Asignacion,
): boolean | undefined {
  const { plano } = ctx;
  const n = plano.n;
  const p = (actor: string) => posicion(actor, asig, ctx);

  switch (pista.tipo) {
    case 'habitacion': {
      const a = p(pista.actor);
      if (a === undefined) return undefined;
      return (plano.habitacionDe[a] === pista.habitacion) !== pista.negada;
    }

    case 'juntoAMueble': {
      const a = p(pista.actor);
      if (a === undefined) return undefined;
      const contiguo = vecinos(a, n).some((v) => plano.muebleDe[v] === pista.mueble);
      return contiguo !== pista.negada;
    }

    case 'sobreMueble': {
      const a = p(pista.actor);
      if (a === undefined) return undefined;
      return plano.muebleDe[a] === pista.mueble;
    }

    case 'direccion': {
      const a = p(pista.actor);
      const b = p(pista.otro);
      if (a === undefined || b === undefined) return undefined;
      switch (pista.dir) {
        case 'norte':
          return fila(a, n) < fila(b, n);
        case 'sur':
          return fila(a, n) > fila(b, n);
        case 'oeste':
          return columna(a, n) < columna(b, n);
        case 'este':
          return columna(a, n) > columna(b, n);
      }
    }

    case 'diagonal': {
      const a = p(pista.a);
      const b = p(pista.b);
      if (a === undefined || b === undefined) return undefined;
      const toca =
        Math.abs(fila(a, n) - fila(b, n)) === 1 && Math.abs(columna(a, n) - columna(b, n)) === 1;
      return toca !== pista.negada;
    }

    case 'distancia': {
      const a = p(pista.a);
      const b = p(pista.b);
      if (a === undefined || b === undefined) return undefined;
      return distancia(a, b, n) === pista.pasos;
    }

    case 'masCerca': {
      const a = p(pista.cerca);
      const b = p(pista.lejos);
      const r = p(pista.ref);
      if (a === undefined || b === undefined || r === undefined) return undefined;
      return distancia(a, r, n) < distancia(b, r, n);
    }

    case 'perimetro': {
      const a = p(pista.actor);
      if (a === undefined) return undefined;
      return esPerimetro(a, n) !== pista.negada;
    }

    case 'esquina': {
      const a = p(pista.actor);
      if (a === undefined) return undefined;
      return esEsquina(a, n) !== pista.negada;
    }

    case 'mismaHabitacion': {
      const a = p(pista.a);
      const b = p(pista.b);
      if (a === undefined || b === undefined) return undefined;
      return (plano.habitacionDe[a] === plano.habitacionDe[b]) !== pista.negada;
    }

    case 'aSolas': {
      const a = p(pista.actor);
      if (a === undefined) return undefined;
      const hab = plano.habitacionDe[a];
      if (plano.habitacionDe[ctx.victimaEn] === hab) return false;
      for (const otro of ctx.sospechosos) {
        if (otro === pista.actor) continue;
        const b = asig[otro];
        if (b === undefined) return undefined;
        if (plano.habitacionDe[b] === hab) return false;
      }
      return true;
    }

    case 'recuento': {
      let cuantos = 0;
      for (const s of ctx.sospechosos) {
        const c = asig[s];
        if (c === undefined) return undefined;
        if (plano.habitacionDe[c] === pista.habitacion) cuantos++;
      }
      return cuantos === pista.cuantos;
    }

    case 'noEnFila': {
      const a = p(pista.actor);
      if (a === undefined) return undefined;
      return fila(a, n) !== pista.f;
    }

    case 'noEnColumna': {
      const a = p(pista.actor);
      if (a === undefined) return undefined;
      return columna(a, n) !== pista.c;
    }
  }
}

/** ¿Cumple la asignación completa todas las pistas? */
export function cumpleTodas(pistas: readonly Pista[], ctx: Contexto, asig: Asignacion): boolean {
  return pistas.every((pista) => satisface(pista, ctx, asig) === true);
}

// ————————————————————————————————————————————————————————————————
// Redacción
// ————————————————————————————————————————————————————————————————

const NUMEROS = [
  'ningún',
  'un',
  'dos',
  'tres',
  'cuatro',
  'cinco',
  'seis',
  'siete',
  'ocho',
];

function nombre(actor: string): string {
  return actor === VICTIMA ? 'la víctima' : personaje(actor).nombre;
}

function letraColumna(c: number): string {
  return String.fromCharCode(65 + c);
}

const PREPOSICION_DIR: Record<Direccion, string> = {
  norte: 'al norte de',
  sur: 'al sur de',
  este: 'al este de',
  oeste: 'al oeste de',
};

export function redactar(pista: Pista): string {
  switch (pista.tipo) {
    case 'habitacion': {
      const h = habitacion(pista.habitacion);
      return pista.negada
        ? `${nombre(pista.actor)} no pisó ${conArticuloHab(h)}.`
        : `${nombre(pista.actor)} estaba ${enHab(h)}.`;
    }

    case 'juntoAMueble': {
      const m = mueble(pista.mueble);
      return pista.negada
        ? `${nombre(pista.actor)} no estaba ${juntoA(m)}.`
        : `${nombre(pista.actor)} estaba ${juntoA(m)}.`;
    }

    case 'sobreMueble':
      return `${nombre(pista.actor)} estaba ${sobre(mueble(pista.mueble))}.`;

    case 'direccion':
      return `${nombre(pista.actor)} estaba ${PREPOSICION_DIR[pista.dir]} ${nombre(pista.otro)}.`;

    case 'diagonal':
      return pista.negada
        ? `${nombre(pista.a)} y ${nombre(pista.b)} no se tocaban por la esquina.`
        : `${nombre(pista.a)} y ${nombre(pista.b)} ocupaban casillas que se tocan por la esquina.`;

    case 'distancia': {
      const pasos = pista.pasos === 1 ? 'un paso' : `${pista.pasos} pasos`;
      return `De ${nombre(pista.a)} a ${nombre(pista.b)} había ${pasos}.`;
    }

    case 'masCerca':
      return `${nombre(pista.cerca)} estaba más cerca de ${nombre(pista.ref)} que ${nombre(pista.lejos)}.`;

    case 'perimetro':
      return pista.negada
        ? `${nombre(pista.actor)} no daba a ninguna pared exterior.`
        : `${nombre(pista.actor)} estaba pegando a una pared exterior.`;

    case 'esquina':
      return pista.negada
        ? `${nombre(pista.actor)} no estaba en ninguna esquina del plano.`
        : `${nombre(pista.actor)} estaba en una esquina del plano.`;

    case 'mismaHabitacion':
      return pista.negada
        ? `${nombre(pista.a)} y ${nombre(pista.b)} no coincidieron en ninguna habitación.`
        : `${nombre(pista.a)} y ${nombre(pista.b)} estaban en la misma habitación.`;

    case 'aSolas':
      return `${nombre(pista.actor)} estaba a solas en su habitación.`;

    case 'recuento': {
      const h = conArticuloHab(habitacion(pista.habitacion));
      if (pista.cuantos === 0) return `No había ningún sospechoso en ${h}.`;
      if (pista.cuantos === 1) return `Había un solo sospechoso en ${h}.`;
      return `Había ${NUMEROS[pista.cuantos] ?? pista.cuantos} sospechosos en ${h}.`;
    }

    case 'noEnFila':
      return `${nombre(pista.actor)} no estaba en la fila ${pista.f + 1}.`;

    case 'noEnColumna':
      return `${nombre(pista.actor)} no estaba en la columna ${letraColumna(pista.c)}.`;
  }
}

// ————————————————————————————————————————————————————————————————
// Banco de pistas
// ————————————————————————————————————————————————————————————————

/** Toma como mucho `max` elementos al azar. */
function muestra<T>(rng: Rng, xs: readonly T[], max: number): T[] {
  return xs.length <= max ? [...xs] : rng.baraja(xs).slice(0, max);
}

/**
 * Enumera pistas **verdaderas** bajo la solución dada.
 *
 * El banco incluye siempre el juego completo de `noEnFila` y `noEnColumna`, que por sí solo ya
 * determina la solución: eso garantiza que el punto de partida de la minimización sea un caso
 * con solución única y resoluble por propagación pura. El resto de tipos se muestrean para que
 * el banco no crezca sin necesidad.
 */
export function generarBanco(rng: Rng, ctx: Contexto, asig: Asignacion): Pista[] {
  const { plano, sospechosos, victimaEn } = ctx;
  const n = plano.n;
  const banco: Pista[] = [];
  const añadir = (pista: Pista) => {
    if (satisface(pista, ctx, asig) === true) banco.push(pista);
  };

  const muebles = plano.muebleDe.filter((m): m is string => m !== null);

  for (const s of sospechosos) {
    const celda = asig[s]!;

    // — Fila y columna descartadas: el andamio que asegura la unicidad de partida.
    for (let f = 0; f < n; f++) if (f !== fila(celda, n)) añadir({ tipo: 'noEnFila', actor: s, f });
    for (let c = 0; c < n; c++) {
      if (c !== columna(celda, n)) añadir({ tipo: 'noEnColumna', actor: s, c });
    }

    // — Habitación, en positivo y en negativo.
    añadir({ tipo: 'habitacion', actor: s, habitacion: plano.habitacionDe[celda]!, negada: false });
    for (const h of muestra(rng, plano.habitaciones, 3)) {
      añadir({ tipo: 'habitacion', actor: s, habitacion: h, negada: true });
    }

    // — Mobiliario contiguo y pisado.
    for (const m of muestra(rng, muebles, 10)) {
      añadir({ tipo: 'juntoAMueble', actor: s, mueble: m, negada: false });
      añadir({ tipo: 'juntoAMueble', actor: s, mueble: m, negada: true });
    }
    const encima = plano.muebleDe[celda];
    if (encima) añadir({ tipo: 'sobreMueble', actor: s, mueble: encima });

    // — Posición en el plano.
    añadir({ tipo: 'perimetro', actor: s, negada: false });
    añadir({ tipo: 'perimetro', actor: s, negada: true });
    añadir({ tipo: 'esquina', actor: s, negada: false });
    añadir({ tipo: 'esquina', actor: s, negada: true });

    // — Respecto al cadáver.
    for (const dir of ['norte', 'sur', 'este', 'oeste'] as Direccion[]) {
      añadir({ tipo: 'direccion', actor: s, otro: VICTIMA, dir });
    }
    añadir({ tipo: 'distancia', a: s, b: VICTIMA, pasos: distancia(celda, victimaEn, n) });
    añadir({ tipo: 'diagonal', a: s, b: VICTIMA, negada: false });
    // Solo la forma negada: decir que alguien compartía habitación con la víctima sería
    // señalar al asesino con el dedo, y el caso perdería su remate.
    añadir({ tipo: 'mismaHabitacion', a: s, b: VICTIMA, negada: true });
    añadir({ tipo: 'aSolas', actor: s });
  }

  // — Entre sospechosos.
  for (let i = 0; i < sospechosos.length; i++) {
    for (let j = i + 1; j < sospechosos.length; j++) {
      const a = sospechosos[i]!;
      const b = sospechosos[j]!;
      for (const dir of ['norte', 'sur', 'este', 'oeste'] as Direccion[]) {
        añadir({ tipo: 'direccion', actor: a, otro: b, dir });
      }
      añadir({ tipo: 'diagonal', a, b, negada: false });
      añadir({ tipo: 'diagonal', a, b, negada: true });
      añadir({ tipo: 'mismaHabitacion', a, b, negada: false });
      añadir({ tipo: 'mismaHabitacion', a, b, negada: true });
      añadir({ tipo: 'distancia', a, b, pasos: distancia(asig[a]!, asig[b]!, n) });
      añadir({ tipo: 'masCerca', cerca: a, lejos: b, ref: VICTIMA });
      añadir({ tipo: 'masCerca', cerca: b, lejos: a, ref: VICTIMA });
    }
  }

  // — Recuentos por habitación.
  for (const h of plano.habitaciones) {
    const cuantos = sospechosos.filter((s) => plano.habitacionDe[asig[s]!] === h).length;
    // El recuento de la habitación del crimen desvela dónde está el asesino sin decir quién es;
    // es una pista legítima y da mucho juego, así que se queda.
    añadir({ tipo: 'recuento', habitacion: h, cuantos });
  }

  return banco;
}
