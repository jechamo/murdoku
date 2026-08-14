import { capitalizar, conOficio, personaje } from '../data/cast';
import { habitacion } from '../data/rooms';
import { nombreCelda, VICTIMA } from '../engine/types';
import { Retrato } from './Sprite';
import { actoresAColocar, celdaDelCadaver, useJuego } from '../state/store';

/**
 * Ficha de la víctima.
 *
 * Si el caso revela dónde apareció el cadáver, es solo informativa. Si no, **se selecciona y se
 * coloca igual que un sospechoso**: su casilla es una incógnita más y sale por eliminación, al
 * quedar libres una única fila y una única columna.
 */
export function FichaVictima() {
  const { caso, seleccionado, candidatos, confirmados, errores, fase, seleccionar, soltar } =
    useJuego();
  const v = personaje(caso.reparto.victima);
  const celda = celdaDelCadaver(caso, confirmados);
  const hab = celda === null ? null : habitacion(caso.plano.habitacionDe[celda]!);
  const activo = seleccionado === VICTIMA;
  const fallo = errores.includes(VICTIMA);

  const cuerpo = (
    <>
      <span
        className={`h-14 w-14 shrink-0 overflow-hidden rounded-md ring-2 ring-sangre-500/70 ${
          celda === null ? 'opacity-60 grayscale' : 'grayscale'
        }`}
      >
        <Retrato id={v.id} />
      </span>
      <span className="min-w-0 text-left">
        <span className="block font-maquina text-[0.65rem] uppercase tracking-[0.2em] text-sangre-400">
          La víctima
        </span>
        <span className="block truncate font-titular text-lg leading-tight text-papel-100">
          {v.nombre}
        </span>
        <span className="block truncate text-xs text-papel-300">
          {v.art === 'el' ? 'El' : 'La'} {v.oficio}
          {celda !== null && hab ? (
            ` · ${nombreCelda(celda, caso.n)} · ${hab.nombre}`
          ) : (
            <span className="text-sangre-400"> · sin localizar</span>
          )}
        </span>
      </span>
    </>
  );

  if (caso.victimaRevelada) {
    return (
      <article className="ficha flex items-center gap-3 border-sangre-600/60 bg-sangre-600/10 p-3">
        {cuerpo}
      </article>
    );
  }

  return (
    <div
      className={`ficha overflow-hidden border-sangre-600/60 bg-sangre-600/10 transition ${
        activo ? 'border-ambar-400 shadow-foco' : ''
      } ${fallo ? 'border-sangre-500' : ''}`}
    >
      <button
        type="button"
        className="flex w-full items-center gap-3 p-3 text-left focus-visible:outline-none"
        onClick={() => seleccionar(VICTIMA)}
        aria-pressed={activo}
        disabled={fase !== 'jugando'}
      >
        {cuerpo}
        <span className="ml-auto shrink-0 font-maquina text-xs text-papel-400">
          {celda !== null ? '' : (candidatos[VICTIMA] ?? []).length || '—'}
        </span>
      </button>
      {celda !== null && fase === 'jugando' && (
        <button
          type="button"
          className="w-full border-t border-tinta-700 bg-tinta-800/60 px-2 py-1 text-[0.7rem]
                     font-semibold text-papel-400 transition hover:bg-tinta-700 hover:text-sangre-400"
          onClick={() => soltar(VICTIMA)}
        >
          Soltar
        </button>
      )}
    </div>
  );
}

/** Fichas de los sospechosos. Al seleccionar una, el tablero pasa a marcar a esa persona. */
export function FichasSospechosos() {
  const {
    caso,
    seleccionado,
    candidatos,
    confirmados,
    errores,
    fase,
    seleccionar,
    soltar,
  } = useJuego();

  return (
    <ul className="grid grid-cols-2 gap-2 lg:grid-cols-1">
      {caso.reparto.sospechosos.map((id) => {
        const p = personaje(id);
        const celda = confirmados[id];
        const colocado = celda !== undefined;
        const activo = seleccionado === id;
        const fallo = errores.includes(id);

        return (
          <li key={id}>
            <div
              className={`ficha overflow-hidden transition ${
                activo ? 'border-ambar-400 shadow-foco' : ''
              } ${fallo ? 'border-sangre-500' : ''}`}
            >
              <button
                type="button"
                className="flex w-full items-center gap-2.5 p-2 text-left focus-visible:outline-none"
                onClick={() => seleccionar(id)}
                aria-pressed={activo}
                disabled={fase !== 'jugando'}
              >
                <span
                  className="h-11 w-11 shrink-0 overflow-hidden rounded"
                  style={{ outline: `2px solid ${p.color}`, outlineOffset: '-1px' }}
                >
                  <Retrato id={id} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-titular text-base leading-tight text-papel-100">
                    {p.nombre}
                  </span>
                  <span className="block truncate text-[0.7rem] capitalize text-papel-400">
                    {p.oficio}
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  {colocado ? (
                    <span
                      className={`font-maquina text-sm font-bold ${
                        fallo ? 'text-sangre-400' : 'text-ambar-400'
                      }`}
                    >
                      {nombreCelda(celda, caso.n)}
                    </span>
                  ) : (
                    <span className="font-maquina text-xs text-papel-400">
                      {(candidatos[id] ?? []).length || '—'}
                    </span>
                  )}
                </span>
              </button>

              {colocado && fase === 'jugando' && (
                <button
                  type="button"
                  className="w-full border-t border-tinta-700 bg-tinta-800/60 px-2 py-1
                             text-[0.7rem] font-semibold text-papel-400 transition
                             hover:bg-tinta-700 hover:text-sangre-400"
                  onClick={() => soltar(id)}
                >
                  Soltar
                </button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Selector compacto fijo al pie, solo en pantallas pequeñas. Sin él habría que subir y bajar
 * la página entera cada vez que se cambia de sospechoso, que es lo que más se hace jugando.
 */
export function BarraSospechosos() {
  const { caso, seleccionado, candidatos, confirmados, fase, seleccionar } = useJuego();
  if (fase !== 'jugando') return null;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-tinta-600 bg-tinta-900/95
                 px-2 py-2 backdrop-blur-sm lg:hidden"
      aria-label="Elegir sospechoso"
    >
      <ul className="flex gap-2 overflow-x-auto pb-1">
        {actoresAColocar(caso).map((actor) => {
          const id = actor === VICTIMA ? caso.reparto.victima : actor;
          const p = personaje(id);
          const celda = confirmados[actor];
          const activo = seleccionado === actor;
          return (
            <li key={actor} className="shrink-0">
              <button
                type="button"
                className={`flex w-16 flex-col items-center gap-1 rounded-md border p-1.5 transition
                            ${
                              activo
                                ? 'border-ambar-400 bg-ambar-400/15'
                                : 'border-tinta-600 bg-tinta-800/70'
                            }`}
                onClick={() => seleccionar(actor)}
                aria-pressed={activo}
              >
                <span
                  className={`h-9 w-9 overflow-hidden rounded ${
                    actor === VICTIMA ? 'grayscale' : ''
                  }`}
                  style={{ outline: `2px solid ${p.color}`, outlineOffset: '-1px' }}
                >
                  <Retrato id={id} />
                </span>
                <span className="w-full truncate text-center text-[0.6rem] leading-none text-papel-300">
                  {p.nombre}
                </span>
                <span
                  className={`font-maquina text-[0.6rem] leading-none ${
                    celda !== undefined ? 'text-ambar-400' : 'text-papel-400'
                  }`}
                >
                  {celda !== undefined
                    ? nombreCelda(celda, caso.n)
                    : (candidatos[actor] ?? []).length || '·'}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Coartadas: sabor puro, no aportan información deductiva. */
export function Coartadas() {
  const caso = useJuego((s) => s.caso);
  return (
    <ul className="space-y-2">
      {[caso.reparto.victima, ...caso.reparto.sospechosos].map((id) => {
        const p = personaje(id);
        return (
          <li key={id} className="text-xs leading-relaxed text-papel-300">
            <span className="font-semibold text-papel-200">{capitalizar(conOficio(p))}.</span>{' '}
            {p.coartada}
          </li>
        );
      })}
    </ul>
  );
}
