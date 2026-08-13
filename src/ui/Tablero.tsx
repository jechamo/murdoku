import { habitacion } from '../data/rooms';
import { columna, fila, nombreCelda } from '../engine/types';
import { Casilla, tinte, type Bordes } from './Casilla';
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

  // Casilla → sospechoso confirmado ahí.
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

  return (
    <div className="tablero w-full">
      <div
        className="grid gap-0"
        style={{ gridTemplateColumns: `1.4rem repeat(${n}, minmax(0, 1fr))` }}
      >
        {/* Esquina + letras de columna */}
        <div />
        {Array.from({ length: n }, (_, c) => (
          <div
            key={`col-${c}`}
            className={`${cabecera} pb-1 ${
              colsFuera.has(c) ? 'text-sangre-400/60 line-through' : 'text-papel-400'
            }`}
          >
            {String.fromCharCode(65 + c)}
          </div>
        ))}

        {Array.from({ length: n }, (_, f) => (
          <FilaTablero key={`fila-${f}`}>
            <div
              className={`${cabecera} pr-1 ${
                filasFuera.has(f) ? 'text-sangre-400/60 line-through' : 'text-papel-400'
              }`}
            >
              {f + 1}
            </div>
            {Array.from({ length: n }, (_, c) => {
              const celda = f * n + c;
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
          </FilaTablero>
        ))}
      </div>

      <Leyenda
        habitaciones={plano.habitaciones.map((h) => ({
          nombre: habitacion(h).nombre,
          color: colorDeHabitacion(plano, h),
        }))}
      />
    </div>
  );
}

/** `display: contents` para que las celdas caigan en la rejilla del padre. */
function FilaTablero({ children }: { children: React.ReactNode }) {
  return <div className="contents">{children}</div>;
}

function Leyenda({ habitaciones }: { habitaciones: { nombre: string; color: string }[] }) {
  return (
    <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
      {habitaciones.map((h) => (
        <li key={h.nombre} className="flex items-center gap-1.5 text-xs text-papel-300">
          <span
            className="h-3 w-3 rounded-sm border border-papel-400/40"
            style={{ background: tinte(h.color, 0.6) }}
          />
          {h.nombre}
        </li>
      ))}
    </ul>
  );
}
