import { habitacion } from '../data/rooms';
import { rectanguloDeHabitacion } from '../engine/layout';
import { columna, fila, nombreCelda, type Plano } from '../engine/types';
import { Casilla, type Bordes } from './Casilla';
import { colorDeHabitacion } from './paleta';
import { columnasTachadas, filasTachadas, useJuego } from '../state/store';

export function Tablero() {
  const {
    caso,
    modo,
    seleccionado,
    candidatos,
    descartes,
    confirmados,
    ayuda,
    errores,
    alternarCandidato,
    alternarDescarte,
    confirmar,
  } = useJuego();

  const { n, plano } = caso;
  const filasFuera = filasTachadas(caso, confirmados);
  const colsFuera = columnasTachadas(caso, confirmados);

  const ocupantes = new Map<number, string>();
  for (const [actor, celda] of Object.entries(confirmados)) ocupantes.set(celda, actor);

  const bordesDe = (celda: number): Bordes => {
    const f = fila(celda, n);
    const c = columna(celda, n);
    const hab = plano.habitacionDe[celda];
    return {
      arriba: f === 0 || plano.habitacionDe[celda - n] !== hab,
      izquierda: c === 0 || plano.habitacionDe[celda - 1] !== hab,
      derecha: c === n - 1,
      abajo: f === n - 1,
    };
  };

  const cabecera = 'flex items-center justify-center font-maquina text-[0.7rem] sm:text-xs';
  const rejilla = { gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` };

  return (
    <div className="tablero w-full">
      <div className="grid" style={{ gridTemplateColumns: '1.35rem minmax(0, 1fr)' }}>
        <div />
        <div className="grid pb-1" style={rejilla}>
          {Array.from({ length: n }, (_, c) => (
            <div
              key={`col-${c}`}
              className={`${cabecera} ${
                colsFuera.has(c) ? 'text-sangre-400/60 line-through' : 'text-papel-400'
              }`}
            >
              {String.fromCharCode(65 + c)}
            </div>
          ))}
        </div>

        <div className="grid pr-1" style={{ gridTemplateRows: `repeat(${n}, minmax(0, 1fr))` }}>
          {Array.from({ length: n }, (_, f) => (
            <div
              key={`fila-${f}`}
              className={`${cabecera} ${
                filasFuera.has(f) ? 'text-sangre-400/60 line-through' : 'text-papel-400'
              }`}
            >
              {f + 1}
            </div>
          ))}
        </div>

        {/* Zona de casillas. Es `relative` para poder colgar los rótulos encima sin que
            entren en la rejilla ni descoloquen nada. */}
        <div className="relative">
          <div className="grid" style={rejilla}>
            {Array.from({ length: n * n }, (_, celda) => {
              const f = fila(celda, n);
              const c = columna(celda, n);
              const hab = habitacion(plano.habitacionDe[celda]!);
              const tachada = filasFuera.has(f) || colsFuera.has(c);
              const marcados = caso.reparto.sospechosos.filter((s) =>
                (candidatos[s] ?? []).includes(celda),
              );
              const ocupante = ocupantes.get(celda) ?? null;

              return (
                <Casilla
                  key={celda}
                  celda={celda}
                  etiqueta={nombreCelda(celda, n)}
                  colorHabitacion={colorDeHabitacion(plano, hab.id)}
                  nombreHabitacion={hab.nombre}
                  bordes={bordesDe(celda)}
                  mueble={plano.muebleDe[celda] ?? null}
                  bloqueada={plano.bloqueada[celda]!}
                  esVictima={celda === caso.victimaEn}
                  victimaId={caso.reparto.victima}
                  tachada={tachada}
                  ocupante={ocupante}
                  candidatos={marcados}
                  descartado={
                    seleccionado !== null && (descartes[seleccionado] ?? []).includes(celda)
                  }
                  seleccionado={seleccionado}
                  puedeConfirmar={
                    seleccionado !== null &&
                    !tachada &&
                    (candidatos[seleccionado] ?? []).includes(celda)
                  }
                  resaltada={ayuda?.celda === celda}
                  error={ocupante !== null && errores.includes(ocupante)}
                  onMarcar={() => {
                    if (!seleccionado) return;
                    if (modo === 'descartar') alternarDescarte(seleccionado, celda);
                    else alternarCandidato(seleccionado, celda);
                  }}
                  onDescartar={() => seleccionado && alternarDescarte(seleccionado, celda)}
                  onConfirmar={() => seleccionado && confirmar(seleccionado, celda)}
                />
              );
            })}
          </div>

          <Rotulos plano={plano} />
        </div>
      </div>
    </div>
  );
}

/**
 * Nombre de cada estancia rotulado sobre el plano, como en el pasatiempo impreso. Con esto la
 * leyenda de colores sobra: el color ya solo separa regiones, y quién es cada habitación lo
 * dice el rótulo.
 *
 * Se puede colocar por porcentajes porque toda habitación es un rectángulo macizo.
 */
function Rotulos({ plano }: { plano: Plano }) {
  const { n } = plano;
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      {plano.habitaciones.map((id) => {
        const r = rectanguloDeHabitacion(plano, id);
        return (
          <span
            key={id}
            className="absolute whitespace-nowrap rounded-full border border-papel-300/25
                       bg-tinta-950/85 px-1.5 py-px text-[0.5rem] font-semibold uppercase
                       tracking-wider text-papel-200 shadow-ficha sm:text-[0.6rem]"
            style={{
              left: `${((r.c0 + r.c1 + 1) / 2 / n) * 100}%`,
              top: `${((r.f1 + 1) / n) * 100}%`,
              transform: 'translate(-50%, -145%)',
            }}
          >
            {habitacion(id).nombre}
          </span>
        );
      })}
    </div>
  );
}
