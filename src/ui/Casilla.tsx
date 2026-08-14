import { capitalizar, personaje } from '../data/cast';
// El prop de la casilla se llama `mueble`, así que el catálogo entra con otro nombre.
import { mueble as datosMueble } from '../data/furniture';
import { Retrato, IconoMueble } from './Sprite';
import { VICTIMA, type Celda } from '../engine/types';

/** #rrggbb + alfa → rgba(). */
export function tinte(hex: string, alfa: number): string {
  const v = hex.replace('#', '');
  const n = parseInt(v, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alfa})`;
}

export type Bordes = { arriba: boolean; izquierda: boolean; derecha: boolean; abajo: boolean };

export type PropsCasilla = {
  celda: Celda;
  etiqueta: string;
  colorHabitacion: string;
  nombreHabitacion: string;
  bordes: Bordes;
  mueble: string | null;
  bloqueada: boolean;
  esVictima: boolean;
  victimaId: string;
  tachada: boolean;
  ocupante: string | null;
  candidatos: string[];
  descartado: boolean;
  seleccionado: string | null;
  puedeConfirmar: boolean;
  resaltada: boolean;
  error: boolean;
  onMarcar: () => void;
  onDescartar: () => void;
  onConfirmar: () => void;
};

/** Silueta de tiza: el hueco que dejó el cadáver. */
function Silueta() {
  return (
    <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden>
      <g
        fill="none"
        stroke="rgba(244,239,228,0.75)"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="7 5"
      >
        <circle cx="50" cy="24" r="11" />
        <path d="M50 35v30" />
        <path d="M50 41 27 55M50 41l23 14" />
        <path d="M50 64 34 88M50 64l16 24" />
      </g>
    </svg>
  );
}

export function Casilla(props: PropsCasilla) {
  // La víctima se nombra con una constante, no con un id de personaje: aquí se traduce para
  // poder pintar su retrato como el de cualquier otro.
  const retratoDe = (actor: string) => (actor === VICTIMA ? props.victimaId : actor);

  const {
    etiqueta,
    colorHabitacion,
    nombreHabitacion,
    bordes,
    mueble,
    bloqueada,
    esVictima,
    victimaId,
    tachada,
    ocupante,
    candidatos,
    descartado,
    seleccionado,
    puedeConfirmar,
    resaltada,
    error,
  } = props;

  // Una casilla admite marcas si no está llena de muebles, no es la escena del crimen y su
  // fila y columna siguen en juego.
  const jugable = !bloqueada && !esVictima && !tachada;
  const interactiva = jugable && seleccionado !== null;

  // Qué mueble hay y si cabe alguien en él. En el tablero solo se ve el dibujo, pero su nombre
  // es el que usan las pistas, y que admita persona o no es la regla que más despista.
  const m = mueble ? datosMueble(mueble) : null;
  const detalleMueble = m
    ? `${capitalizar(m.nombre)} · ${m.ocupable ? 'cabe alguien' : 'no cabe nadie'}`
    : null;

  // Las paredes entre habitaciones se dibujan gruesas y claras; las divisiones internas,
  // apenas insinuadas. Es lo que hace legible el plano de un vistazo.
  // El muro es ahora la señal principal de dónde empieza y acaba una estancia, porque el color
  // ya no se echa por encima del mobiliario. Tiene que verse sin lugar a dudas.
  const borde = (pared: boolean) =>
    pared ? '3px solid rgba(246,241,230,0.92)' : '1px solid rgba(255,255,255,0.04)';

  return (
    <div
      className="relative aspect-square select-none overflow-hidden"
      // El título va aquí y no en el botón porque el botón se deshabilita en cuanto la casilla
      // deja de admitir marcas, y un botón deshabilitado no llega a mostrarlo.
      title={[`${etiqueta} · ${nombreHabitacion}`, detalleMueble].filter(Boolean).join(' · ')}
      style={{
        containerType: 'size',
        borderTop: borde(bordes.arriba),
        borderLeft: borde(bordes.izquierda),
        borderRight: bordes.derecha ? borde(true) : 'none',
        borderBottom: bordes.abajo ? borde(true) : 'none',
      }}
    >
      {/*
       * Escenografía de la casilla: habitación y mobiliario. Va toda dentro de una capa propia
       * porque cuando la fila o la columna quedan resueltas basta con apagar esta capa —
       * desaturada y a oscuras— y todo lo que se dibuje después (el cadáver, un sospechoso
       * confirmado) sigue a plena luz por delante.
       *
       * Apagar en vez de rayar es deliberado: con media rejilla resuelta, una trama roja sobre
       * el 80% del tablero convertía en lo más ruidoso de la pantalla justo la parte que ya no
       * importa, y tapaba las habitaciones, que son información hasta el último momento.
       */}
      <div
        className="pointer-events-none absolute inset-0 transition-[filter] duration-300"
        style={{
          // El tinte solo pinta el SUELO de la estancia. La habitación se reconoce por su muro
          // y por su rótulo, como en el plano de un Murdoku impreso; el color es un apoyo, no
          // el mecanismo, y por eso no se echa por encima del mobiliario.
          background: tinte(colorHabitacion, 0.22),
          filter: tachada && !esVictima ? 'grayscale(0.5) brightness(0.62)' : undefined,
        }}
        aria-hidden
      >
        {/*
         * El mueble se ve tal cual, sin película de color por encima: es una ilustración que
         * llena la casilla. Los elementos que admiten persona (la cama, la butaca, la alfombra)
         * van algo más tenues, porque encima de ellos van a caer retratos y marcas.
         */}
        {/* Un punto de brillo: la ilustración viene muy oscura de origen y sobre el fondo noir
            del tablero se apagaba demasiado. */}
        {mueble && (
          <div
            className={`absolute inset-0 ${bloqueada ? '' : 'opacity-70'}`}
            style={{ filter: 'brightness(1.22) contrast(1.06)' }}
          >
            <IconoMueble id={mueble} />
          </div>
        )}
      </div>

      {/*
       * Fila y columna descartadas: una X a lápiz en cada casilla, que es como se marca en el
       * pasatiempo impreso. No se pinta sobre la casilla del propio sospechoso —ahí se le ve a
       * él— ni sobre la escena del crimen.
       */}
      {tachada && !esVictima && !ocupante && (
        <svg
          viewBox="0 0 100 100"
          className="pointer-events-none absolute inset-[32%] h-[36%] w-[36%] animate-aparecer"
          aria-hidden
        >
          <path
            d="M8 8 92 92M92 8 8 92"
            stroke="rgba(244,239,228,0.4)"
            strokeWidth="9"
            strokeLinecap="round"
          />
        </svg>
      )}

      {esVictima && (
        <>
          <div className="absolute inset-0 bg-sangre-600/20" aria-hidden />
          <Silueta />
          <div className="absolute bottom-[6%] right-[6%] h-[30%] w-[30%] overflow-hidden rounded-full opacity-70 ring-1 ring-papel-300/60 grayscale">
            <Retrato id={victimaId} />
          </div>
        </>
      )}

      {ocupante && (
        <div
          className="absolute inset-[10%] animate-aparecer overflow-hidden rounded-md shadow-ficha"
          style={{ outline: `2px solid ${personaje(ocupante).color}`, outlineOffset: '1px' }}
        >
          <Retrato id={ocupante} />
          {error && (
            <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full bg-sangre-600/70">
              <text
                x="50"
                y="52"
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="62"
                fontWeight="900"
                fill="#f4efe4"
              >
                ?
              </text>
            </svg>
          )}
        </div>
      )}

      {!ocupante && candidatos.length > 0 && (
        <div className="pointer-events-none absolute inset-x-[6%] bottom-[6%] flex flex-wrap gap-[3%]">
          {candidatos.map((id) => (
            <span
              key={id}
              className="overflow-hidden rounded-full ring-1 ring-tinta-950/70"
              style={{
                width: candidatos.length > 3 ? '22%' : '28%',
                aspectRatio: '1',
                opacity: seleccionado === null || seleccionado === id ? 0.95 : 0.45,
              }}
              title={personaje(retratoDe(id)).nombre}
            >
              <Retrato id={retratoDe(id)} />
            </span>
          ))}
        </div>
      )}

      {descartado && !ocupante && (
        <svg
          viewBox="0 0 100 100"
          className="pointer-events-none absolute inset-[26%] h-[48%] w-[48%]"
          aria-hidden
        >
          <path
            d="M12 12 88 88M88 12 12 88"
            stroke="rgba(224,82,74,0.9)"
            strokeWidth="15"
            strokeLinecap="round"
          />
        </svg>
      )}

      {resaltada && (
        <div
          className="pointer-events-none absolute inset-0 animate-latido ring-2 ring-inset ring-ambar-400"
          aria-hidden
        />
      )}

      {/* Zona de clic. Es un botón de verdad para que funcione con teclado. */}
      <button
        type="button"
        className={`absolute inset-0 h-full w-full focus-visible:outline-none
                    focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ambar-400
                    ${interactiva ? 'cursor-pointer hover:bg-papel-100/10' : 'cursor-default'}`}
        aria-label={
          `Casilla ${etiqueta}, ${nombreHabitacion}` +
          (detalleMueble ? `, ${detalleMueble}` : '') +
          (esVictima ? ', escena del crimen' : '') +
          (ocupante ? `, aquí está ${personaje(ocupante).nombre}` : '') +
          (candidatos.length > 0
            ? `, marcada como posible para ${candidatos
                .map((c) => personaje(retratoDe(c)).nombre)
                .join(', ')}`
            : '')
        }
        disabled={!interactiva}
        onClick={props.onMarcar}
        onContextMenu={(e) => {
          e.preventDefault();
          props.onDescartar();
        }}
      />

      {/* Confirmar: aparece sobre la marca del sospechoso seleccionado. */}
      {puedeConfirmar && (
        <button
          type="button"
          className="absolute right-[4%] top-[4%] z-10 flex items-center justify-center rounded
                     border border-ambar-400 bg-tinta-950/90 font-black text-ambar-400
                     shadow-foco transition hover:bg-ambar-400 hover:text-tinta-950
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-papel-100"
          style={{ width: '34%', height: '34%' }}
          onClick={props.onConfirmar}
          title={`Confirmar a ${personaje(retratoDe(seleccionado!)).nombre} en ${etiqueta}`}
          aria-label={`Confirmar a ${personaje(retratoDe(seleccionado!)).nombre} en ${etiqueta}`}
        >
          <svg viewBox="0 0 100 100" className="h-[70%] w-[70%]" aria-hidden>
            <path
              d="M20 52 42 74 80 26"
              fill="none"
              stroke="currentColor"
              strokeWidth="16"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
