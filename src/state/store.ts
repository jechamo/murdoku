import { create } from 'zustand';

import { generarCaso, codigoDeCaso, leerCodigo, type OpcionesCaso } from '../engine/generate';
import { colocacionesErroneas, estaResuelto, siguientePaso, type Paso } from '../engine/explain';
import { columna, fila, type Asignacion, type Caso, type Celda, type Dificultad } from '../engine/types';

/** Lo que se guarda para poder deshacer. */
type Instantanea = {
  candidatos: Record<string, Celda[]>;
  descartes: Record<string, Celda[]>;
  confirmados: Asignacion;
  pistasUsadas: number[];
};

export type Fase = 'jugando' | 'acusando' | 'veredicto';

/**
 * En escritorio se marca con el clic izquierdo y se descarta con el derecho. En táctil no hay
 * clic derecho fiable, así que hay un interruptor de modo.
 */
export type Modo = 'marcar' | 'descartar';

type Estado = Instantanea & {
  caso: Caso;
  generando: boolean;
  modo: Modo;
  seleccionado: string | null;
  historial: Instantanea[];
  fase: Fase;
  acusado: string | null;
  ayuda: Paso | null;
  /** Sospechosos señalados por el botón de comprobar. */
  errores: string[];

  nuevoCaso: (opciones?: OpcionesCaso) => void;
  reiniciar: () => void;
  cambiarModo: (modo: Modo) => void;
  seleccionar: (actor: string | null) => void;
  alternarCandidato: (actor: string, celda: Celda) => void;
  alternarDescarte: (actor: string, celda: Celda) => void;
  confirmar: (actor: string, celda: Celda) => void;
  soltar: (actor: string) => void;
  alternarPista: (i: number) => void;
  deshacer: () => void;
  comprobar: () => void;
  pedirAyuda: () => void;
  aplicarAyuda: () => void;
  abrirAcusacion: () => void;
  cancelarAcusacion: () => void;
  acusar: (actor: string) => void;
  revelar: () => void;
};

const VACIO: Instantanea = {
  candidatos: {},
  descartes: {},
  confirmados: {},
  pistasUsadas: [],
};

function instantanea(s: Instantanea): Instantanea {
  return {
    candidatos: Object.fromEntries(Object.entries(s.candidatos).map(([k, v]) => [k, [...v]])),
    descartes: Object.fromEntries(Object.entries(s.descartes).map(([k, v]) => [k, [...v]])),
    confirmados: { ...s.confirmados },
    pistasUsadas: [...s.pistasUsadas],
  };
}

function alternar(lista: Celda[] | undefined, celda: Celda): Celda[] {
  const actual = lista ?? [];
  return actual.includes(celda) ? actual.filter((c) => c !== celda) : [...actual, celda];
}

/** Lee el caso del fragmento de URL, si lo hay. */
function casoDeLaUrl(): OpcionesCaso | null {
  const m = /^#\/caso\/(.+)$/.exec(window.location.hash);
  return m ? leerCodigo(decodeURIComponent(m[1]!)) : null;
}

function fijarUrl(caso: Caso): void {
  const nuevo = `#/caso/${codigoDeCaso(caso)}`;
  if (window.location.hash !== nuevo) {
    window.history.replaceState(null, '', nuevo);
  }
}

const casoInicial = generarCaso(casoDeLaUrl() ?? { n: 7, dificultad: 'medio' });
fijarUrl(casoInicial);

export const useJuego = create<Estado>((set, get) => ({
  ...VACIO,
  caso: casoInicial,
  generando: false,
  modo: 'marcar',
  seleccionado: null,
  historial: [],
  fase: 'jugando',
  acusado: null,
  ayuda: null,
  errores: [],

  nuevoCaso: (opciones) => {
    const anterior = get().caso;
    const caso = generarCaso({
      n: opciones?.n ?? anterior.n,
      dificultad: opciones?.dificultad ?? anterior.dificultad,
      semilla: opciones?.semilla,
    });
    fijarUrl(caso);
    set({
      ...VACIO,
      caso,
      seleccionado: null,
      historial: [],
      fase: 'jugando',
      acusado: null,
      ayuda: null,
      errores: [],
    });
  },

  reiniciar: () =>
    set({
      ...VACIO,
      seleccionado: null,
      historial: [],
      fase: 'jugando',
      acusado: null,
      ayuda: null,
      errores: [],
    }),

  cambiarModo: (modo) => set({ modo }),

  seleccionar: (actor) => set((s) => ({ seleccionado: s.seleccionado === actor ? null : actor })),

  alternarCandidato: (actor, celda) =>
    set((s) => {
      if (s.confirmados[actor] !== undefined) return {};
      return {
        historial: [...s.historial, instantanea(s)],
        candidatos: { ...s.candidatos, [actor]: alternar(s.candidatos[actor], celda) },
        // Marcar como posible y como descartada a la vez no tiene sentido.
        descartes: {
          ...s.descartes,
          [actor]: (s.descartes[actor] ?? []).filter((c) => c !== celda),
        },
        ayuda: null,
      };
    }),

  alternarDescarte: (actor, celda) =>
    set((s) => {
      if (s.confirmados[actor] !== undefined) return {};
      return {
        historial: [...s.historial, instantanea(s)],
        descartes: { ...s.descartes, [actor]: alternar(s.descartes[actor], celda) },
        candidatos: {
          ...s.candidatos,
          [actor]: (s.candidatos[actor] ?? []).filter((c) => c !== celda),
        },
        ayuda: null,
      };
    }),

  confirmar: (actor, celda) =>
    set((s) => {
      const n = s.caso.n;
      const f = fila(celda, n);
      const c = columna(celda, n);

      // Al fijar a alguien, su fila y su columna quedan tachadas: se limpian las marcas de los
      // demás que caigan ahí, y las propias del sospechoso en otras casillas.
      const candidatos: Record<string, Celda[]> = {};
      const descartes: Record<string, Celda[]> = {};
      for (const otro of s.caso.reparto.sospechosos) {
        if (otro === actor) continue;
        candidatos[otro] = (s.candidatos[otro] ?? []).filter(
          (x) => fila(x, n) !== f && columna(x, n) !== c,
        );
        descartes[otro] = (s.descartes[otro] ?? []).filter(
          (x) => fila(x, n) !== f && columna(x, n) !== c,
        );
      }
      candidatos[actor] = [];
      descartes[actor] = [];

      return {
        historial: [...s.historial, instantanea(s)],
        confirmados: { ...s.confirmados, [actor]: celda },
        candidatos,
        descartes,
        seleccionado: null,
        ayuda: null,
        errores: s.errores.filter((e) => e !== actor),
      };
    }),

  soltar: (actor) =>
    set((s) => {
      const { [actor]: _fuera, ...resto } = s.confirmados;
      return {
        historial: [...s.historial, instantanea(s)],
        confirmados: resto,
        errores: s.errores.filter((e) => e !== actor),
        ayuda: null,
      };
    }),

  alternarPista: (i) =>
    set((s) => ({
      historial: [...s.historial, instantanea(s)],
      pistasUsadas: s.pistasUsadas.includes(i)
        ? s.pistasUsadas.filter((x) => x !== i)
        : [...s.pistasUsadas, i],
    })),

  deshacer: () =>
    set((s) => {
      const previa = s.historial[s.historial.length - 1];
      if (!previa) return {};
      return {
        ...previa,
        historial: s.historial.slice(0, -1),
        ayuda: null,
        errores: [],
      };
    }),

  comprobar: () =>
    set((s) => ({ errores: colocacionesErroneas(s.caso, s.confirmados), ayuda: null })),

  pedirAyuda: () =>
    set((s) => {
      const errores = colocacionesErroneas(s.caso, s.confirmados);
      if (errores.length > 0) return { errores, ayuda: null };
      return { ayuda: siguientePaso(s.caso, s.confirmados), errores: [] };
    }),

  aplicarAyuda: () => {
    const { ayuda, confirmar } = get();
    if (ayuda) confirmar(ayuda.actor, ayuda.celda);
  },

  abrirAcusacion: () => set({ fase: 'acusando', ayuda: null, seleccionado: null }),

  cancelarAcusacion: () => set({ fase: 'jugando' }),

  acusar: (actor) => set({ acusado: actor, fase: 'veredicto' }),

  /** Rendirse: se vuelca la verdad sobre el tablero. */
  revelar: () =>
    set((s) => ({
      historial: [...s.historial, instantanea(s)],
      confirmados: { ...s.caso.solucion.posiciones },
      candidatos: {},
      descartes: {},
      errores: [],
      ayuda: null,
      seleccionado: null,
    })),
}));

// ————————————————————————————————————————————————————————————————
// Selectores derivados
// ————————————————————————————————————————————————————————————————

/** Filas tachadas: la del cadáver y las de todo sospechoso ya confirmado. */
export function filasTachadas(caso: Caso, confirmados: Asignacion): Set<number> {
  const set = new Set<number>([fila(caso.victimaEn, caso.n)]);
  for (const celda of Object.values(confirmados)) set.add(fila(celda, caso.n));
  return set;
}

export function columnasTachadas(caso: Caso, confirmados: Asignacion): Set<number> {
  const set = new Set<number>([columna(caso.victimaEn, caso.n)]);
  for (const celda of Object.values(confirmados)) set.add(columna(celda, caso.n));
  return set;
}

/** Todos los sospechosos colocados: se puede acusar. */
export function listoParaAcusar(caso: Caso, confirmados: Asignacion): boolean {
  return caso.reparto.sospechosos.every((s) => confirmados[s] !== undefined);
}

export { estaResuelto };
export type { Dificultad };
