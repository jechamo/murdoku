import { useEffect, useState } from 'react';

import { Pistas } from './Pistas';
import { useJuego } from '../state/store';

/**
 * Cajón de declaraciones para móvil: sale del lateral derecho tirando de una pestaña.
 *
 * En un móvil la columna de la derecha cae al final de la página: medido en un 390×844, el
 * título «Declaraciones» queda 1214 px por debajo del plano, o sea que hay que subir y bajar
 * entre leer una pista y marcar la casilla, y las dos cosas no se ven nunca a la vez. Aquí las
 * pistas van fijas, se abren y se cierran donde estés, y llevan su propio scroll.
 *
 * Dos detalles deliberados:
 *
 *  - **No hay velo que bloquee el fondo.** Con el cajón abierto se puede seguir tocando el
 *    plano en la parte que queda a la vista, que es lo que se hace al leer una pista.
 *  - **Se queda por debajo de la barra de sospechosos** (que va en z-40), y su contenido lleva
 *    hueco al pie para no esconder la última pista tras ella. Así se puede cambiar de
 *    sospechoso con el cajón abierto.
 */
export function CajonPistas() {
  const { caso, pistasUsadas, fase } = useJuego();
  const [abierto, setAbierto] = useState(false);

  // Un caso nuevo empieza con el cajón cerrado: lo primero que se mira es el plano.
  useEffect(() => setAbierto(false), [caso.semilla, caso.n, caso.dificultad]);

  if (fase !== 'jugando') return null;

  const pendientes = caso.pistas.length - pistasUsadas.length;

  return (
    <div
      className={`fixed inset-y-0 right-0 z-30 w-[86%] max-w-[340px] transition-transform
                  duration-300 ease-out lg:hidden ${abierto ? '' : 'translate-x-full'}`}
    >
      {/* Pestaña: cuelga por fuera del panel, así que con el cajón cerrado queda pegada al
          borde de la pantalla y con él abierto viaja hasta su canto. */}
      <button
        type="button"
        // Apilada en vertical para que ocupe lo mínimo de ancho: es un carril que la página se
        // reserva entero (ver el `pr` de <main>), así que cada píxel que mide se lo quita al
        // plano.
        className="absolute left-0 top-1/3 flex w-7 -translate-x-full flex-col items-center gap-1
                   rounded-l-lg border border-r-0 border-ambar-400/70 bg-tinta-900/95 py-2.5
                   shadow-ficha focus-visible:outline-none focus-visible:shadow-foco"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        aria-controls="cajon-declaraciones"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-ambar-400" aria-hidden>
          <path
            d={abierto ? 'M9 5l7 7-7 7' : 'M15 5l-7 7 7 7'}
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span
          className="font-maquina text-[0.6rem] font-bold uppercase tracking-[0.2em] text-papel-200"
          style={{ writingMode: 'vertical-rl' }}
        >
          Pistas
        </span>
        {!abierto && pendientes > 0 && (
          <span className="font-maquina text-[0.7rem] font-bold text-ambar-400">
            {pendientes}
          </span>
        )}
        <span className="sr-only">
          {abierto ? 'Cerrar las declaraciones' : 'Ver las declaraciones'}
        </span>
      </button>

      <div
        id="cajon-declaraciones"
        // Fondo opaco a propósito: con transparencia, las fichas de sospechoso de detrás se
        // colaban entre las declaraciones y no había quien las leyera.
        className="flex h-full flex-col border-l border-tinta-600 bg-tinta-950 shadow-[-12px_0_28px_-8px_rgba(0,0,0,0.9)]"
      >
        <h2 className="flex items-baseline gap-2 border-b border-tinta-700 px-3 py-2.5">
          <span className="font-titular text-lg text-papel-100">Declaraciones</span>
          <span className="font-maquina text-[0.7rem] text-papel-400">
            {caso.pistas.length}
          </span>
        </h2>
        {/* El hueco al pie deja libre la barra de sospechosos, que va fija por encima. */}
        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3 pb-28">
          <Pistas />
          <p className="mt-3 font-maquina text-[0.7rem] leading-relaxed text-papel-400">
            Toca una declaración para tacharla cuando la hayas gastado.
          </p>
        </div>
      </div>
    </div>
  );
}
