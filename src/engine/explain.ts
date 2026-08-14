/**
 * Pistas para el jugador atascado.
 *
 * Se apoya en el mismo motor de propagación que valida los casos, así que la explicación
 * nunca puede mentir: si aquí dice que una casilla está forzada, es que lo está de verdad.
 * Y las pistas que señala como clave se comprueban quitándolas una a una y viendo si la
 * deducción se cae, no por parecido temático.
 */

import { personaje } from '../data/cast';
import { redactar } from './clues';
import { actoresAColocar, ctxDe, posicionesCompletas } from './generate';
import { dominiosIniciales, propagar, type Dominios, type Nivel } from './solver';
import { nombreCelda, VICTIMA, type Asignacion, type Caso, type Celda } from './types';

export type Paso = {
  actor: string;
  celda: Celda;
  /** Técnica mínima con la que sale la deducción. */
  nivel: Nivel;
  /** Índices (base 0) de las pistas sin las cuales esta deducción no sale. */
  pistasClave: number[];
  texto: string;
};

/** Actores colocados en una casilla que no es la suya. */
export function colocacionesErroneas(caso: Caso, colocados: Asignacion): string[] {
  const verdad = posicionesCompletas(caso);
  return Object.entries(colocados)
    .filter(([actor, celda]) => verdad[actor] !== celda)
    .map(([actor]) => actor);
}

/** ¿Está el caso resuelto del todo? Con el cadáver oculto, también hay que haberlo situado. */
export function estaResuelto(caso: Caso, colocados: Asignacion): boolean {
  const verdad = posicionesCompletas(caso);
  return actoresAColocar(caso).every((a) => colocados[a] === verdad[a]);
}

/** Dominios de partida con las colocaciones ya confirmadas por el jugador clavadas. */
function dominiosCon(caso: Caso, colocados: Asignacion): Dominios {
  const dom = dominiosIniciales(ctxDe(caso));
  for (const [actor, celda] of Object.entries(colocados)) {
    if (dom.has(actor)) dom.set(actor, new Set([celda]));
  }
  return dom;
}

const COMO_SALE: Record<Nivel, string> = {
  1: 'Con las pistas marcadas basta',
  2: 'Cruzando esas pistas con la regla de una persona por fila y por columna',
  3: 'Cruzando esas pistas entre sí y con el resto de sospechosos',
  4: 'Mirando qué filas y columnas les quedan libres al resto',
};

/**
 * Siguiente casilla que se puede deducir sin conjeturar, o null si no queda ninguna
 * (porque el caso ya está resuelto, o porque hay algo mal colocado).
 *
 * Busca de la técnica más sencilla a la más rebuscada, así que la pista que da es siempre
 * el paso más fácil disponible.
 */
export function siguientePaso(caso: Caso, colocados: Asignacion): Paso | null {
  const ctx = ctxDe(caso);
  if (colocacionesErroneas(caso, colocados).length > 0) return null;

  for (const nivel of [1, 2, 3, 4] as Nivel[]) {
    const dom = dominiosCon(caso, colocados);
    if (!propagar(caso.pistas, ctx, dom, nivel)) return null;

    for (const [actor, d] of dom) {
      if (colocados[actor] !== undefined || d.size !== 1) continue;
      const celda = [...d][0]!;

      // Una pista es clave si, quitándola, la casilla deja de estar forzada.
      const pistasClave: number[] = [];
      for (let i = 0; i < caso.pistas.length; i++) {
        const sinElla = caso.pistas.filter((_, j) => j !== i);
        const dom2 = dominiosCon(caso, colocados);
        const vive = propagar(sinElla, ctx, dom2, nivel);
        if (!vive || dom2.get(actor)!.size !== 1) pistasClave.push(i);
      }

      const nombre = personaje(actor === VICTIMA ? caso.reparto.victima : actor).nombre;
      const donde = nombreCelda(celda, caso.n);
      const referencias =
        pistasClave.length > 0
          ? ` (${pistasClave.map((i) => `pista ${i + 1}`).join(', ')})`
          : '';
      return {
        actor,
        celda,
        nivel,
        pistasClave,
        texto: `${COMO_SALE[nivel]}${referencias} para que ${nombre} solo pueda estar en ${donde}.`,
      };
    }
  }

  return null;
}

/** Texto largo del paso, con las pistas implicadas escritas enteras. */
export function detallarPaso(caso: Caso, paso: Paso): string[] {
  return paso.pistasClave.map((i) => `${i + 1}. ${redactar(caso.pistas[i]!)}`);
}
