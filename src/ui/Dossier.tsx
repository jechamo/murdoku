import { capitalizar, conOficio, personaje } from '../data/cast';
import { habitacion } from '../data/rooms';
import { nombreCelda } from '../engine/types';
import { Retrato } from './Sprite';
import { useJuego } from '../state/store';

/** Ficha de la víctima: siempre visible, con su casilla, que se conoce desde el principio. */
export function FichaVictima() {
  const caso = useJuego((s) => s.caso);
  const v = personaje(caso.reparto.victima);
  const hab = habitacion(caso.plano.habitacionDe[caso.victimaEn]!);

  return (
    <article className="ficha flex items-center gap-3 border-sangre-600/60 bg-sangre-600/10 p-3">
      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md grayscale ring-2 ring-sangre-500/70">
        <Retrato id={v.id} />
      </div>
      <div className="min-w-0">
        <p className="font-maquina text-[0.65rem] uppercase tracking-[0.2em] text-sangre-400">
          La víctima
        </p>
        <p className="truncate font-titular text-lg leading-tight text-papel-100">
          {v.nombre}
        </p>
        <p className="text-xs text-papel-300">
          {v.art === 'el' ? 'El' : 'La'} {v.oficio} · {nombreCelda(caso.victimaEn, caso.n)} ·{' '}
          {hab.nombre}
        </p>
      </div>
    </article>
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
        {caso.reparto.sospechosos.map((id) => {
          const p = personaje(id);
          const celda = confirmados[id];
          const activo = seleccionado === id;
          return (
            <li key={id} className="shrink-0">
              <button
                type="button"
                className={`flex w-16 flex-col items-center gap-1 rounded-md border p-1.5 transition
                            ${
                              activo
                                ? 'border-ambar-400 bg-ambar-400/15'
                                : 'border-tinta-600 bg-tinta-800/70'
                            }`}
                onClick={() => seleccionar(id)}
                aria-pressed={activo}
              >
                <span
                  className="h-9 w-9 overflow-hidden rounded"
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
                    : (candidatos[id] ?? []).length || '·'}
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
