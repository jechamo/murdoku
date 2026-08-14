import { capitalizar } from '../data/cast';
import { mueble } from '../data/furniture';
import { habitacion } from '../data/rooms';
import { nombreCelda, type Plano } from '../engine/types';
import { colorDeHabitacion } from './paleta';
import { IconoMueble } from './Sprite';
import { useJuego } from '../state/store';

/**
 * Qué hay en la casa: el mobiliario que ha salido en **este** plano, por habitaciones, y si
 * cabe alguien en cada cosa.
 *
 * Es información que ya está en el tablero, pero ahí solo se ve el dibujo: no dice cómo se
 * llama —y las pistas lo nombran— ni si admite persona, que es la regla que más se atraganta
 * («¿por qué no me deja poner a nadie en el armario?»). Va plegado y debajo del plano para que
 * esté a mano sin ocupar sitio mientras se juega.
 *
 * Cada entrada se toca y **enciende su casilla en el plano**. Eso es lo que hace que esto
 * funcione en un móvil: ahí no hay ratón con el que descubrir un mueble pasando por encima, y
 * la pulsación larga ya está cogida para descartar.
 */

type Pieza = { celda: number; idMueble: string };

/** Muebles de cada habitación, en el orden en que se leen en el plano. */
function porHabitacion(plano: Plano): { idHab: string; piezas: Pieza[] }[] {
  const piezasDe = new Map<string, Pieza[]>(plano.habitaciones.map((id) => [id, []]));
  plano.muebleDe.forEach((idMueble, celda) => {
    if (idMueble) piezasDe.get(plano.habitacionDe[celda]!)!.push({ celda, idMueble });
  });
  return plano.habitaciones
    .map((idHab) => ({ idHab, piezas: piezasDe.get(idHab)! }))
    .filter((g) => g.piezas.length > 0)
    // Por orden de lectura del plano, no por el orden interno de las habitaciones: buscar en la
    // lista tiene que parecerse a recorrer el dibujo de arriba abajo.
    .sort((a, b) => a.piezas[0]!.celda - b.piezas[0]!.celda);
}

function Marca({ ocupable }: { ocupable: boolean }) {
  return (
    <span
      className={`shrink-0 rounded-full px-1.5 py-px font-maquina text-[0.6rem] leading-[1.4] ${
        ocupable
          ? 'bg-ambar-400/15 text-ambar-400'
          : 'bg-tinta-700/70 text-papel-400'
      }`}
    >
      {ocupable ? 'cabe alguien' : 'no cabe'}
    </span>
  );
}

export function Inventario() {
  const plano = useJuego((s) => s.caso.plano);
  const focoMueble = useJuego((s) => s.focoMueble);
  const mirarMueble = useJuego((s) => s.mirarMueble);
  const grupos = porHabitacion(plano);
  const piezas = grupos.flatMap((g) => g.piezas);
  const conSitio = piezas.filter((p) => mueble(p.idMueble).ocupable).length;

  // En el móvil la lista queda por debajo del plano, así que encender una casilla sin subir la
  // pantalla no se vería: se enciende y se lleva la vista al tablero.
  const senalar = (celda: number) => {
    mirarMueble(celda);
    document.querySelector('.tablero')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <details className="ficha p-3 text-sm">
      <summary className="cursor-pointer font-titular text-papel-100">
        Qué hay en la casa{' '}
        <span className="font-maquina text-[0.7rem] font-normal text-papel-400">
          · {piezas.length} muebles, {conSitio} con sitio para alguien
        </span>
      </summary>

      <p className="mt-2 text-[0.78rem] leading-relaxed text-papel-400">
        En una cama, un sofá o una alfombra sí se puede colocar a alguien; un armario o una
        nevera llenan la casilla y no cabe nadie. Toca cualquiera para que se encienda en el
        plano.
      </p>

      <div className="mt-3 space-y-3">
        {grupos.map(({ idHab, piezas: delCuarto }) => (
          <section key={idHab}>
            <h3
              className="mb-1.5 flex items-center gap-1.5 border-l-2 pl-2 font-maquina text-[0.65rem]
                         uppercase tracking-[0.2em] text-papel-300"
              style={{ borderColor: colorDeHabitacion(plano, idHab) }}
            >
              {habitacion(idHab).nombre}
            </h3>
            <ul className="grid gap-1.5 sm:grid-cols-2">
              {delCuarto.map(({ celda, idMueble }) => {
                const m = mueble(idMueble);
                const encendido = focoMueble === celda;
                return (
                  <li key={celda}>
                    <button
                      type="button"
                      className={`flex w-full items-center gap-2 rounded border px-1 py-0.5 text-left
                                  transition focus-visible:outline-none focus-visible:shadow-foco ${
                                    encendido
                                      ? 'border-ambar-400 bg-ambar-400/10'
                                      : 'border-transparent hover:border-tinta-600 hover:bg-tinta-800/60'
                                  }`}
                      aria-pressed={encendido}
                      onClick={() => senalar(celda)}
                    >
                      <span
                        className="h-8 w-8 shrink-0 overflow-hidden rounded border border-tinta-600"
                        style={{ filter: 'brightness(1.22) contrast(1.06)' }}
                      >
                        <IconoMueble id={idMueble} />
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[0.8rem] text-papel-200">
                        {capitalizar(m.nombre)}{' '}
                        <span className="font-maquina text-[0.7rem] text-papel-400">
                          ({nombreCelda(celda, plano.n)})
                        </span>
                      </span>
                      <Marca ocupable={m.ocupable} />
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </details>
  );
}
