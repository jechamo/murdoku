import { useEffect } from 'react';

import { capitalizar, conOficio, personaje } from '../data/cast';
import { habitacion } from '../data/rooms';
import { estaResuelto } from '../engine/explain';
import { nombreCelda, VICTIMA } from '../engine/types';
import { Retrato } from './Sprite';
import { useJuego } from '../state/store';

function Modal({ children, onCerrar }: { children: React.ReactNode; onCerrar?: () => void }) {
  useEffect(() => {
    if (!onCerrar) return;
    const alPulsar = (e: KeyboardEvent) => e.key === 'Escape' && onCerrar();
    window.addEventListener('keydown', alPulsar);
    return () => window.removeEventListener('keydown', alPulsar);
  }, [onCerrar]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto
                 bg-tinta-950/85 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={(e) => onCerrar && e.target === e.currentTarget && onCerrar()}
    >
      <div className="ficha my-auto w-full max-w-lg animate-aparecer p-5 sm:p-6">{children}</div>
    </div>
  );
}

/** Elección del culpable, una vez colocados todos los sospechosos. */
function PanelAcusacion() {
  const { caso, confirmados, acusar, cancelarAcusacion } = useJuego();

  return (
    <Modal onCerrar={cancelarAcusacion}>
      <p className="font-maquina text-[0.65rem] uppercase tracking-[0.25em] text-sangre-400">
        Momento de la acusación
      </p>
      <h2 className="titulo-caso mt-1 text-2xl text-papel-100">¿Quién lo hizo?</h2>
      <p className="mt-2 text-sm leading-relaxed text-papel-300">
        Quien se quedó a solas con {conOficio(personaje(caso.reparto.victima))}
        {/* Con el cadáver por localizar no se puede nombrar la estancia sin destripar dónde
            está: la reconstrucción del jugador podría ser errónea. */}
        {caso.victimaRevelada
          ? ` en ${habitacion(caso.plano.habitacionDe[caso.victimaEn]!).art} ${
              habitacion(caso.plano.habitacionDe[caso.victimaEn]!).nombre
            }`
          : ' en su misma habitación'}{' '}
        es el asesino. Señala a alguien.
      </p>

      <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {caso.reparto.sospechosos.map((id) => {
          const p = personaje(id);
          const celda = confirmados[id]!;
          const hab = habitacion(caso.plano.habitacionDe[celda]!);
          return (
            <li key={id}>
              <button
                type="button"
                className="flex w-full items-center gap-2.5 rounded-md border border-tinta-600
                           bg-tinta-800/70 p-2 text-left transition hover:border-sangre-500
                           hover:bg-sangre-600/15 focus-visible:outline-none focus-visible:shadow-foco"
                onClick={() => acusar(id)}
              >
                <span
                  className="h-10 w-10 shrink-0 overflow-hidden rounded"
                  style={{ outline: `2px solid ${p.color}`, outlineOffset: '-1px' }}
                >
                  <Retrato id={id} />
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-titular text-papel-100">{p.nombre}</span>
                  <span className="block truncate text-[0.7rem] text-papel-400">
                    {nombreCelda(celda, caso.n)} · {hab.nombre}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <button type="button" className="boton-secundario mt-4 w-full" onClick={cancelarAcusacion}>
        Todavía no, déjame repasar
      </button>
    </Modal>
  );
}

/** Desenlace: se compara la reconstrucción del jugador con la verdad del caso. */
function PanelVeredicto() {
  const { caso, confirmados, acusado, nuevoCaso, revelar, cancelarAcusacion } = useJuego();
  if (!acusado) return null;

  const planoCorrecto = estaResuelto(caso, confirmados);
  const culpableCorrecto = acusado === caso.solucion.asesino;
  const victoria = planoCorrecto && culpableCorrecto;

  const asesino = personaje(caso.solucion.asesino);
  const victima = personaje(caso.reparto.victima);
  const habCrimen = habitacion(caso.plano.habitacionDe[caso.victimaEn]!);

  const titulo = victoria
    ? 'Caso cerrado'
    : planoCorrecto
      ? 'Persona equivocada'
      : 'La reconstrucción no se sostiene';

  const explicacion = victoria
    ? `Los hechos encajan. ${capitalizar(conOficio(asesino))} se quedó a solas con ${conOficio(victima)} en ${habCrimen.art} ${habCrimen.nombre}, y no hay otra colocación posible con estas pistas.`
    : planoCorrecto
      ? `El plano estaba bien resuelto, pero el dedo apuntó mal. Quien compartía ${habCrimen.art} ${habCrimen.nombre} con ${conOficio(victima)} era ${conOficio(asesino)}.`
      : `Alguna colocación no cuadra con las pistas, así que la acusación se apoya en un plano falso. La verdad es que ${conOficio(asesino)} estaba con ${conOficio(victima)} en ${habCrimen.art} ${habCrimen.nombre}.`;

  return (
    <Modal>
      <p
        className={`font-maquina text-[0.65rem] uppercase tracking-[0.25em] ${
          victoria ? 'text-ambar-400' : 'text-sangre-400'
        }`}
      >
        Veredicto
      </p>
      <h2 className="titulo-caso mt-1 text-3xl text-papel-100">{titulo}</h2>

      <div className="mt-4 flex items-center gap-4">
        <div
          className="h-20 w-20 shrink-0 overflow-hidden rounded-md shadow-ficha"
          style={{ outline: `3px solid ${asesino.color}`, outlineOffset: '-1px' }}
        >
          <Retrato id={asesino.id} />
        </div>
        <div className="min-w-0">
          <p className="font-maquina text-[0.65rem] uppercase tracking-[0.2em] text-papel-400">
            El asesino
          </p>
          <p className="font-titular text-2xl leading-tight text-papel-100">{asesino.nombre}</p>
          <p className="text-xs text-papel-300 first-letter:uppercase">
            {asesino.art} {asesino.oficio} ·{' '}
            {nombreCelda(caso.solucion.posiciones[caso.solucion.asesino]!, caso.n)}
          </p>
        </div>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-papel-200">{explicacion}</p>

      <ul className="mt-4 space-y-1 border-l-2 border-tinta-600 pl-3">
        <li
          className={`font-maquina text-xs ${
            caso.victimaRevelada || confirmados[VICTIMA] === caso.victimaEn
              ? 'text-papel-300'
              : 'text-sangre-400'
          }`}
        >
          † {victima.nombre} — {nombreCelda(caso.victimaEn, caso.n)} · {habCrimen.nombre}
          {!caso.victimaRevelada && confirmados[VICTIMA] !== caso.victimaEn
            ? confirmados[VICTIMA] !== undefined
              ? `  (tú pusiste ${nombreCelda(confirmados[VICTIMA]!, caso.n)})`
              : '  (no llegaste a situarlo)'
            : ''}
        </li>
        {caso.reparto.sospechosos.map((id) => {
          const celda = caso.solucion.posiciones[id]!;
          const bien = confirmados[id] === celda;
          return (
            <li
              key={id}
              className={`font-maquina text-xs ${bien ? 'text-papel-300' : 'text-sangre-400'}`}
            >
              {personaje(id).nombre} — {nombreCelda(celda, caso.n)} ·{' '}
              {habitacion(caso.plano.habitacionDe[celda]!).nombre}
              {bien ? '' : `  (tú pusiste ${nombreCelda(confirmados[id]!, caso.n)})`}
            </li>
          );
        })}
      </ul>

      <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <button type="button" className="boton-primario" onClick={() => nuevoCaso()}>
          Siguiente caso
        </button>
        <button
          type="button"
          className="boton-secundario"
          onClick={() => {
            revelar();
            cancelarAcusacion();
          }}
        >
          Ver la solución en el plano
        </button>
      </div>
    </Modal>
  );
}

export function CapaFinal() {
  const fase = useJuego((s) => s.fase);
  if (fase === 'acusando') return <PanelAcusacion />;
  if (fase === 'veredicto') return <PanelVeredicto />;
  return null;
}
