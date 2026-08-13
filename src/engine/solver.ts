/**
 * Solver. Hace dos trabajos que conviene no confundir:
 *
 *  1. `contarSoluciones` — cuenta soluciones por búsqueda exhaustiva. Con n ≤ 8 el espacio son
 *     como mucho 8! = 40 320 permutaciones, así que la unicidad se decide de forma exacta y no
 *     por heurística. Es la garantía de que el caso es inequívoco.
 *
 *  2. `resolverPorDeduccion` — intenta cerrar la rejilla con propagación pura, sin backtracking
 *     ni una sola conjetura, por niveles de técnica. Es la garantía de que el jugador puede
 *     llegar a la solución razonando, sin tener que probar suerte.
 *
 * Todas las reglas de propagación son **sólidas**: solo descartan casillas que no pueden estar
 * en ninguna solución. Por eso es seguro podar los dominios antes de contar.
 *
 * Niveles:
 *   1 — filtrado por pistas unarias (incluidas las que se apoyan en la víctima, cuya casilla
 *       se conoce desde el principio)
 *   2 — unicidad de fila y columna: singles desnudos y ocultos, como en el sudoku
 *   3 — consistencia de arcos sobre pistas binarias
 *   4 — conjuntos de Hall en filas y columnas, y restricciones de recuento por habitación
 */

import { celdasDeHabitacion } from './layout';
import { actoresDe, cumpleTodas, esGlobal, satisface, type Contexto } from './clues';
import { columna, fila, VICTIMA, type Asignacion, type Celda, type Pista } from './types';

export type Nivel = 1 | 2 | 3 | 4;

export type Dominios = Map<string, Set<Celda>>;

export function clonarDominios(d: Dominios): Dominios {
  return new Map([...d].map(([k, v]) => [k, new Set(v)]));
}

/**
 * Dominio de partida: toda casilla libre que no esté en la fila ni en la columna del cadáver.
 * La víctima ocupa su fila y su columna igual que cualquier otro ocupante.
 */
export function dominiosIniciales(ctx: Contexto): Dominios {
  const { plano, victimaEn, sospechosos } = ctx;
  const n = plano.n;
  const fv = fila(victimaEn, n);
  const cv = columna(victimaEn, n);

  const disponibles: Celda[] = [];
  for (let celda = 0; celda < n * n; celda++) {
    if (plano.bloqueada[celda]) continue;
    if (fila(celda, n) === fv || columna(celda, n) === cv) continue;
    disponibles.push(celda);
  }

  return new Map(sospechosos.map((s) => [s, new Set(disponibles)]));
}

/** Filas y columnas que deben quedar ocupadas por los sospechosos. */
function lineasLibres(ctx: Contexto): { filas: number[]; columnas: number[] } {
  const n = ctx.plano.n;
  const fv = fila(ctx.victimaEn, n);
  const cv = columna(ctx.victimaEn, n);
  const filas: number[] = [];
  const columnas: number[] = [];
  for (let i = 0; i < n; i++) {
    if (i !== fv) filas.push(i);
    if (i !== cv) columnas.push(i);
  }
  return { filas, columnas };
}

type Resultado = { ok: boolean; cambio: boolean };

const SIN_CAMBIO: Resultado = { ok: true, cambio: false };

function quitar(dom: Set<Celda>, celdas: Iterable<Celda>): boolean {
  let cambio = false;
  for (const c of celdas) if (dom.delete(c)) cambio = true;
  return cambio;
}

// ————————————————————————————————————————————————————————————————
// Nivel 1 — pistas unarias
// ————————————————————————————————————————————————————————————————

function nivel1(pistas: readonly Pista[], ctx: Contexto, dom: Dominios): Resultado {
  let cambio = false;
  for (const pista of pistas) {
    if (esGlobal(pista)) continue;
    const actores = actoresDe(pista);
    if (actores.length !== 1) continue;
    const actor = actores[0]!;
    const d = dom.get(actor);
    if (!d) continue;
    for (const celda of [...d]) {
      if (satisface(pista, ctx, { [actor]: celda }) === false) {
        d.delete(celda);
        cambio = true;
      }
    }
    if (d.size === 0) return { ok: false, cambio };
  }
  return { ok: true, cambio };
}

// ————————————————————————————————————————————————————————————————
// Nivel 2 — unicidad de fila y columna
// ————————————————————————————————————————————————————————————————

function nivel2(ctx: Contexto, dom: Dominios): Resultado {
  const n = ctx.plano.n;
  const { filas, columnas } = lineasLibres(ctx);
  let cambio = false;

  // Single desnudo: un sospechoso con una sola casilla posible expulsa al resto de su fila y
  // de su columna.
  for (const [actor, d] of dom) {
    if (d.size !== 1) continue;
    const celda = [...d][0]!;
    const f = fila(celda, n);
    const c = columna(celda, n);
    for (const [otro, d2] of dom) {
      if (otro === actor) continue;
      const fuera = [...d2].filter((x) => fila(x, n) === f || columna(x, n) === c);
      if (quitar(d2, fuera)) cambio = true;
      if (d2.size === 0) return { ok: false, cambio };
    }
  }

  // Single oculto: si una fila (o columna) que debe estar ocupada solo la alcanza un
  // sospechoso, ese sospechoso está ahí.
  const ocultos = (
    lineas: number[],
    indice: (celda: Celda) => number,
  ): Resultado => {
    for (const l of lineas) {
      const candidatos = [...dom].filter(([, d]) => [...d].some((x) => indice(x) === l));
      if (candidatos.length === 0) return { ok: false, cambio };
      if (candidatos.length !== 1) continue;
      const [, d] = candidatos[0]!;
      const fuera = [...d].filter((x) => indice(x) !== l);
      if (quitar(d, fuera)) cambio = true;
      if (d.size === 0) return { ok: false, cambio };
    }
    return { ok: true, cambio };
  };

  const rf = ocultos(filas, (celda) => fila(celda, n));
  if (!rf.ok) return rf;
  const rc = ocultos(columnas, (celda) => columna(celda, n));
  if (!rc.ok) return rc;

  return { ok: true, cambio };
}

// ————————————————————————————————————————————————————————————————
// Nivel 3 — consistencia de arcos sobre pistas binarias
// ————————————————————————————————————————————————————————————————

/** Dos ocupantes nunca comparten fila ni columna: cualquier soporte debe respetarlo. */
function compatibles(a: Celda, b: Celda, n: number): boolean {
  return a !== b && fila(a, n) !== fila(b, n) && columna(a, n) !== columna(b, n);
}

function arcoBinario(
  ctx: Contexto,
  dom: Dominios,
  a: string,
  b: string,
  admite: (ca: Celda, cb: Celda) => boolean,
): Resultado {
  const n = ctx.plano.n;
  const da = dom.get(a);
  const db = dom.get(b);
  if (!da || !db) return SIN_CAMBIO;
  let cambio = false;

  for (const [origen, destino, orden] of [
    [da, db, true],
    [db, da, false],
  ] as const) {
    for (const c1 of [...origen]) {
      const hayApoyo = [...destino].some((c2) => {
        if (!compatibles(c1, c2, n)) return false;
        return orden ? admite(c1, c2) : admite(c2, c1);
      });
      if (!hayApoyo) {
        origen.delete(c1);
        cambio = true;
      }
    }
    if (origen.size === 0) return { ok: false, cambio };
  }
  return { ok: true, cambio };
}

function nivel3(pistas: readonly Pista[], ctx: Contexto, dom: Dominios): Resultado {
  let cambio = false;

  for (const pista of pistas) {
    if (pista.tipo === 'aSolas') {
      // "A solas" se descompone en una negación de habitación compartida contra cada uno de
      // los demás sospechosos, y eso sí es un arco binario.
      for (const otro of ctx.sospechosos) {
        if (otro === pista.actor) continue;
        const r = arcoBinario(ctx, dom, pista.actor, otro, (ca, cb) => {
          return ctx.plano.habitacionDe[ca] !== ctx.plano.habitacionDe[cb];
        });
        if (r.cambio) cambio = true;
        if (!r.ok) return { ok: false, cambio };
      }
      continue;
    }

    if (esGlobal(pista)) continue;
    const actores = actoresDe(pista);
    if (actores.length !== 2) continue;
    const [a, b] = actores as [string, string];

    const r = arcoBinario(ctx, dom, a, b, (ca, cb) =>
      satisface(pista, ctx, { [a]: ca, [b]: cb }) === true,
    );
    if (r.cambio) cambio = true;
    if (!r.ok) return { ok: false, cambio };
  }

  // La incompatibilidad fila/columna también es un arco por sí sola: si un sospechoso solo
  // puede estar en una fila, ningún otro puede usarla.
  const n = ctx.plano.n;
  for (const [actor, d] of dom) {
    for (const indice of [fila, columna]) {
      const lineas = new Set([...d].map((c) => indice(c, n)));
      if (lineas.size !== 1) continue;
      const l = [...lineas][0]!;
      for (const [otro, d2] of dom) {
        if (otro === actor) continue;
        if (quitar(d2, [...d2].filter((c) => indice(c, n) === l))) cambio = true;
        if (d2.size === 0) return { ok: false, cambio };
      }
    }
  }

  return { ok: true, cambio };
}

// ————————————————————————————————————————————————————————————————
// Nivel 4 — conjuntos de Hall y recuentos
// ————————————————————————————————————————————————————————————————

function hall(ctx: Contexto, dom: Dominios, indice: (c: Celda, n: number) => number): Resultado {
  const n = ctx.plano.n;
  const actores = [...dom.keys()];
  const lineasDe = new Map(
    actores.map((a) => [a, new Set([...dom.get(a)!].map((c) => indice(c, n)))]),
  );
  let cambio = false;

  // Con 7 sospechosos como mucho, recorrer los 127 subconjuntos no cuesta nada.
  for (let mascara = 1; mascara < 1 << actores.length; mascara++) {
    const grupo = actores.filter((_, i) => mascara & (1 << i));
    const union = new Set<number>();
    for (const a of grupo) for (const l of lineasDe.get(a)!) union.add(l);

    if (union.size < grupo.length) return { ok: false, cambio }; // Hall: no hay hueco para todos
    if (union.size !== grupo.length) continue;

    // El grupo se queda esas líneas en exclusiva.
    for (const otro of actores) {
      if (grupo.includes(otro)) continue;
      const d = dom.get(otro)!;
      if (quitar(d, [...d].filter((c) => union.has(indice(c, n))))) cambio = true;
      if (d.size === 0) return { ok: false, cambio };
    }
  }
  return { ok: true, cambio };
}

function recuentos(pistas: readonly Pista[], ctx: Contexto, dom: Dominios): Resultado {
  let cambio = false;

  for (const pista of pistas) {
    if (pista.tipo !== 'recuento') continue;
    const celdas = new Set(celdasDeHabitacion(ctx.plano, pista.habitacion));

    const seguros: string[] = [];
    const posibles: string[] = [];
    for (const [actor, d] of dom) {
      const dentro = [...d].filter((c) => celdas.has(c));
      if (dentro.length > 0) posibles.push(actor);
      if (dentro.length === d.size) seguros.push(actor);
    }

    if (seguros.length > pista.cuantos) return { ok: false, cambio };
    if (posibles.length < pista.cuantos) return { ok: false, cambio };

    // Ya están todos los que caben: el resto queda fuera de la habitación.
    if (seguros.length === pista.cuantos) {
      for (const [actor, d] of dom) {
        if (seguros.includes(actor)) continue;
        if (quitar(d, [...d].filter((c) => celdas.has(c)))) cambio = true;
        if (d.size === 0) return { ok: false, cambio };
      }
    }

    // Justo los que pueden entrar son los que hacen falta: todos ellos entran.
    if (posibles.length === pista.cuantos) {
      for (const actor of posibles) {
        const d = dom.get(actor)!;
        if (quitar(d, [...d].filter((c) => !celdas.has(c)))) cambio = true;
        if (d.size === 0) return { ok: false, cambio };
      }
    }
  }

  return { ok: true, cambio };
}

function nivel4(pistas: readonly Pista[], ctx: Contexto, dom: Dominios): Resultado {
  let cambio = false;
  for (const paso of [
    () => hall(ctx, dom, fila),
    () => hall(ctx, dom, columna),
    () => recuentos(pistas, ctx, dom),
  ]) {
    const r = paso();
    if (r.cambio) cambio = true;
    if (!r.ok) return { ok: false, cambio };
  }
  return { ok: true, cambio };
}

// ————————————————————————————————————————————————————————————————
// Propagación
// ————————————————————————————————————————————————————————————————

/** Propaga hasta punto fijo con las técnicas de nivel ≤ `nivelMax`. Muta `dom`. */
export function propagar(
  pistas: readonly Pista[],
  ctx: Contexto,
  dom: Dominios,
  nivelMax: Nivel,
): boolean {
  const r1 = nivel1(pistas, ctx, dom);
  if (!r1.ok) return false;

  for (let vuelta = 0; vuelta < 200; vuelta++) {
    let cambio = false;

    const r2 = nivel2(ctx, dom);
    if (!r2.ok) return false;
    cambio ||= r2.cambio;

    if (nivelMax >= 3) {
      const r3 = nivel3(pistas, ctx, dom);
      if (!r3.ok) return false;
      cambio ||= r3.cambio;
    }

    if (nivelMax >= 4) {
      const r4 = nivel4(pistas, ctx, dom);
      if (!r4.ok) return false;
      cambio ||= r4.cambio;
    }

    if (!cambio) break;
  }
  return true;
}

export type ResultadoDeduccion = {
  /** true si la rejilla queda completamente determinada sin conjeturar. */
  cerrado: boolean;
  dominios: Dominios;
};

export function resolverPorDeduccion(
  pistas: readonly Pista[],
  ctx: Contexto,
  nivelMax: Nivel,
): ResultadoDeduccion {
  const dom = dominiosIniciales(ctx);
  const ok = propagar(pistas, ctx, dom, nivelMax);
  if (!ok) return { cerrado: false, dominios: dom };

  const cerrado = [...dom.values()].every((d) => d.size === 1);
  if (!cerrado) return { cerrado: false, dominios: dom };

  // Cinturón y tirantes: la asignación resultante tiene que cumplir de verdad todas las pistas.
  const asig: Asignacion = {};
  for (const [actor, d] of dom) asig[actor] = [...d][0]!;
  return { cerrado: cumpleTodas(pistas, ctx, asig), dominios: dom };
}

/**
 * Nivel mínimo de técnica con el que se cierra la rejilla, o null si no se cierra ni con todas.
 * Es la medida de dificultad del caso.
 */
export function nivelRequerido(pistas: readonly Pista[], ctx: Contexto): Nivel | null {
  for (const nivel of [2, 3, 4] as Nivel[]) {
    if (resolverPorDeduccion(pistas, ctx, nivel).cerrado) return nivel;
  }
  return null;
}

// ————————————————————————————————————————————————————————————————
// Conteo exacto
// ————————————————————————————————————————————————————————————————

/**
 * Cuenta soluciones, parando en `limite` (2 basta para decidir la unicidad).
 *
 * Se apoya en los dominios ya podados: como toda regla de propagación es sólida, podar antes
 * de contar no puede perder ninguna solución.
 */
export function contarSoluciones(
  pistas: readonly Pista[],
  ctx: Contexto,
  dom: Dominios,
  limite = 2,
): number {
  const n = ctx.plano.n;
  // De dominio más pequeño a más grande: poda antes y ramifica menos.
  const actores = [...dom.keys()].sort((a, b) => dom.get(a)!.size - dom.get(b)!.size);
  const asig: Asignacion = {};
  const filasUsadas = new Set<number>();
  const colsUsadas = new Set<number>();
  let total = 0;

  // Pistas ya comprobables en cuanto todos sus actores estén colocados.
  const locales = pistas.filter((p) => !esGlobal(p));

  const violaAlguna = (): boolean =>
    locales.some((p) => satisface(p, ctx, asig) === false);

  const buscar = (i: number): void => {
    if (total >= limite) return;
    if (i === actores.length) {
      if (cumpleTodas(pistas, ctx, asig)) total++;
      return;
    }
    const actor = actores[i]!;
    for (const celda of dom.get(actor)!) {
      const f = fila(celda, n);
      const c = columna(celda, n);
      if (filasUsadas.has(f) || colsUsadas.has(c)) continue;

      asig[actor] = celda;
      filasUsadas.add(f);
      colsUsadas.add(c);
      if (!violaAlguna()) buscar(i + 1);
      filasUsadas.delete(f);
      colsUsadas.delete(c);
      delete asig[actor];

      if (total >= limite) return;
    }
  };

  buscar(0);
  return total;
}

/** ¿Tiene el caso exactamente una solución? */
export function esUnico(pistas: readonly Pista[], ctx: Contexto): boolean {
  const dom = dominiosIniciales(ctx);
  // Propagar antes solo acelera; si detecta contradicción, no hay soluciones.
  if (!propagar(pistas, ctx, dom, 4)) return false;
  return contarSoluciones(pistas, ctx, dom, 2) === 1;
}

export { VICTIMA };
