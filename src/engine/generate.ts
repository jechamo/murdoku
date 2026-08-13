/**
 * Orquestador del generador.
 *
 * Escenario → solución → banco de pistas → conjunto mínimo, verificando en cada paso que el
 * caso siga teniendo **solución única** y siga siendo **resoluble sin conjeturar**.
 *
 * Sobre el orden de la minimización: primero se construye un conjunto suficiente añadiendo
 * pistas de más informativas a menos, y después se hace una pasada de eliminación probando a
 * quitar primero las más sosas. Así el caso queda con pocas pistas y con las interesantes.
 */

import { generarPlano } from './layout';
import { elegirColocacion, hallarAsesino, repartirPersonajes } from './solution';
import { generarBanco, type Contexto } from './clues';
import {
  contarSoluciones,
  dominiosIniciales,
  propagar,
  resolverPorDeduccion,
  nivelRequerido,
  type Nivel,
} from './solver';
import { crearRng, semillaAleatoria, type Rng } from './rng';
import {
  NIVEL_DE_DIFICULTAD,
  type Asignacion,
  type Caso,
  type Dificultad,
  type Pista,
} from './types';

/**
 * Cuánto aporta cada tipo de pista al disfrute del caso. Se usa dos veces y en sentidos
 * opuestos: para añadir primero lo bueno y para intentar quitar primero lo soso.
 */
const INTERES: Record<Pista['tipo'], number> = {
  aSolas: 9,
  recuento: 9,
  sobreMueble: 8,
  masCerca: 8,
  mismaHabitacion: 7,
  juntoAMueble: 7,
  distancia: 6,
  diagonal: 6,
  direccion: 5,
  habitacion: 5,
  esquina: 3,
  perimetro: 3,
  noEnColumna: 1,
  noEnFila: 1,
};

function interes(pista: Pista): number {
  const base = INTERES[pista.tipo];
  // Las formas negadas dicen menos que las afirmativas.
  const negada = 'negada' in pista && pista.negada;
  return negada ? base - 2 : base;
}

/** Baraja el banco pero respetando el orden de interés, de mayor a menor. */
function ordenarPorInteres(rng: Rng, banco: readonly Pista[], descendente: boolean): Pista[] {
  return rng
    .baraja(banco)
    .sort((a, b) => (descendente ? interes(b) - interes(a) : interes(a) - interes(b)));
}

/**
 * Orden de construcción: por interés, pero penalizando repetir un tipo ya elegido. Sin esto
 * salen casos correctos pero monótonos, del estilo de cuatro pistas seguidas de "junto a".
 */
function ordenDeConstruccion(rng: Rng, banco: readonly Pista[]): Pista[] {
  const restantes = ordenarPorInteres(rng, banco, true);
  const usos = new Map<Pista['tipo'], number>();
  const orden: Pista[] = [];

  while (restantes.length > 0) {
    let mejor = 0;
    let mejorPuntos = -Infinity;
    for (let i = 0; i < restantes.length; i++) {
      const pista = restantes[i]!;
      const puntos = interes(pista) - 2.5 * (usos.get(pista.tipo) ?? 0);
      if (puntos > mejorPuntos) {
        mejorPuntos = puntos;
        mejor = i;
      }
    }
    const elegida = restantes.splice(mejor, 1)[0]!;
    usos.set(elegida.tipo, (usos.get(elegida.tipo) ?? 0) + 1);
    orden.push(elegida);
  }
  return orden;
}

/** ¿Cierra la rejilla la deducción pura con este conjunto de pistas? */
function cierra(pistas: readonly Pista[], ctx: Contexto, nivel: Nivel): boolean {
  return resolverPorDeduccion(pistas, ctx, nivel).cerrado;
}

/**
 * Construye un conjunto de pistas suficiente y luego lo poda hasta dejarlo irredundante:
 * al terminar, quitar cualquiera de las pistas que quedan rompe la resolubilidad.
 */
function construirYPodar(
  rng: Rng,
  banco: readonly Pista[],
  ctx: Contexto,
  nivel: Nivel,
): Pista[] | null {
  // — Construcción: se van añadiendo pistas, las más jugosas primero, hasta que el caso cierra.
  const candidatas = ordenDeConstruccion(rng, banco);
  const elegidas: Pista[] = [];
  let suficiente = false;
  for (const pista of candidatas) {
    elegidas.push(pista);
    if (cierra(elegidas, ctx, nivel)) {
      suficiente = true;
      break;
    }
  }
  if (!suficiente) return null;

  // — Poda: se intenta quitar cada pista, empezando por las más sosas.
  let actual = elegidas;
  for (const pista of ordenarPorInteres(rng, actual, false)) {
    const sinElla = actual.filter((p) => p !== pista);
    if (sinElla.length > 0 && cierra(sinElla, ctx, nivel)) actual = sinElla;
  }
  return actual;
}

export type OpcionesCaso = {
  semilla?: string;
  n?: number;
  dificultad?: Dificultad;
};

/** Cuántas veces se reintenta afinar la dificultad antes de conformarse con lo que haya. */
const INTENTOS_AFINADO = 6;
const INTENTOS_ESCENARIO = 60;

export function generarCaso(opciones: OpcionesCaso = {}): Caso {
  const semilla = opciones.semilla ?? semillaAleatoria();
  const n = opciones.n ?? 7;
  const dificultad = opciones.dificultad ?? 'medio';
  const nivelObjetivo = NIVEL_DE_DIFICULTAD[dificultad];

  const rng = crearRng(`${semilla}|${n}|${dificultad}`);

  let mejor: Caso | null = null;

  for (let intento = 0; intento < INTENTOS_ESCENARIO; intento++) {
    const plano = generarPlano(rng, n);
    if (plano === null) continue;

    const colocacion = elegirColocacion(rng, plano);
    if (colocacion === null) continue;

    const reparto = repartirPersonajes(rng, n);
    const asignacion: Asignacion = {};
    reparto.sospechosos.forEach((s, i) => {
      asignacion[s] = colocacion.deSospechosos[i]!;
    });

    const ctx: Contexto = {
      plano,
      victimaEn: colocacion.victimaEn,
      sospechosos: reparto.sospechosos,
    };

    const banco = generarBanco(rng, ctx, asignacion);

    for (let afinado = 0; afinado < INTENTOS_AFINADO; afinado++) {
      const pistas = construirYPodar(rng, banco, ctx, nivelObjetivo);
      if (pistas === null) break;

      const nivel = nivelRequerido(pistas, ctx);
      if (nivel === null) continue; // no debería ocurrir: acaba de cerrar

      const caso: Caso = {
        semilla,
        n,
        dificultad,
        plano,
        reparto,
        victimaEn: colocacion.victimaEn,
        pistas,
        solucion: {
          posiciones: { ...asignacion },
          asesino: hallarAsesino(plano, colocacion.victimaEn, asignacion),
        },
      };

      // Verificación independiente de la propagación: conteo exhaustivo de soluciones.
      const dom = dominiosIniciales(ctx);
      if (!propagar(pistas, ctx, dom, 4)) continue;
      if (contarSoluciones(pistas, ctx, dom, 2) !== 1) continue;

      if (nivel === nivelObjetivo) return caso;
      // Guarda el más parecido a la dificultad pedida por si ninguno acierta de pleno.
      if (mejor === null) mejor = caso;
      else {
        const dMejor = Math.abs(nivelRequerido(mejor.pistas, ctxDe(mejor))! - nivelObjetivo);
        if (Math.abs(nivel - nivelObjetivo) < dMejor) mejor = caso;
      }
    }
  }

  if (mejor !== null) return mejor;
  throw new Error(
    `No se ha podido generar un caso de ${n}×${n} (${dificultad}) con la semilla "${semilla}"`,
  );
}

/** Reconstruye el contexto del solver a partir de un caso ya generado. */
export function ctxDe(caso: Caso): Contexto {
  return {
    plano: caso.plano,
    victimaEn: caso.victimaEn,
    sospechosos: caso.reparto.sospechosos,
  };
}

/** Identificador compartible: 8x8-dificil-A3F91C */
export function codigoDeCaso(caso: Caso): string {
  return `${caso.n}x${caso.n}-${caso.dificultad}-${caso.semilla}`;
}

export function leerCodigo(codigo: string): OpcionesCaso | null {
  const m = /^(\d)x\1-(facil|medio|dificil)-([A-Za-z0-9]{1,16})$/.exec(codigo.trim());
  if (!m) return null;
  const n = Number(m[1]);
  if (n < 6 || n > 8) return null;
  // La semilla se respeta tal cual: distinta caja, distinto caso.
  return { n, dificultad: m[2] as Dificultad, semilla: m[3]! };
}
