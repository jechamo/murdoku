import { useState } from 'react';

import { personaje } from '../data/cast';
import { codigoDeCaso } from '../engine/generate';
import { detallarPaso } from '../engine/explain';
import { N_MAX, N_MIN, NOMBRE_DIFICULTAD, DIFICULTADES, type Dificultad } from '../engine/types';
import { listoParaAcusar, useJuego } from '../state/store';

const TAMANOS = Array.from({ length: N_MAX - N_MIN + 1 }, (_, i) => N_MIN + i);

function Grupo({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 font-maquina text-[0.65rem] uppercase tracking-[0.2em] text-papel-400">
        {titulo}
      </p>
      {children}
    </div>
  );
}

/** Selector segmentado. */
function Segmentos<T extends string | number>({
  opciones,
  valor,
  onCambio,
  etiqueta,
}: {
  opciones: { valor: T; texto: string }[];
  valor: T;
  onCambio: (v: T) => void;
  etiqueta: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={etiqueta}
      className="flex overflow-hidden rounded-md border border-tinta-600"
    >
      {opciones.map((o) => (
        <button
          key={String(o.valor)}
          type="button"
          role="radio"
          aria-checked={o.valor === valor}
          className={`flex-1 px-2 py-1.5 text-xs font-semibold transition
                      focus-visible:outline-none focus-visible:shadow-foco ${
                        o.valor === valor
                          ? 'bg-ambar-500 text-tinta-950'
                          : 'bg-tinta-800 text-papel-300 hover:bg-tinta-700'
                      }`}
          onClick={() => onCambio(o.valor)}
        >
          {o.texto}
        </button>
      ))}
    </div>
  );
}

export function Controles() {
  const {
    caso,
    modo,
    ayuda,
    errores,
    confirmados,
    historial,
    fase,
    cambiarModo,
    nuevoCaso,
    reiniciar,
    deshacer,
    comprobar,
    pedirAyuda,
    aplicarAyuda,
    abrirAcusacion,
  } = useJuego();

  const [tamano, setTamano] = useState<number>(caso.n);
  const [dificultad, setDificultad] = useState<Dificultad>(caso.dificultad);
  const [copiado, setCopiado] = useState(false);

  const codigo = codigoDeCaso(caso);
  const puedeAcusar = listoParaAcusar(caso, confirmados);

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}#/caso/${codigo}`);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1800);
    } catch {
      setCopiado(false);
    }
  };

  return (
    <div className="space-y-4">
      <Grupo titulo="Lápiz">
        <Segmentos
          etiqueta="Modo del lápiz"
          opciones={[
            { valor: 'marcar' as const, texto: 'Marcar posible' },
            { valor: 'descartar' as const, texto: 'Descartar ✗' },
          ]}
          valor={modo}
          onCambio={cambiarModo}
        />
        <p className="mt-1.5 text-[0.7rem] leading-snug text-papel-400">
          En ordenador, el clic derecho descarta sin cambiar de modo.
        </p>
      </Grupo>

      <Grupo titulo="Investigación">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            className="boton-secundario"
            onClick={deshacer}
            disabled={historial.length === 0}
          >
            Deshacer
          </button>
          <button type="button" className="boton-secundario" onClick={reiniciar}>
            Empezar de cero
          </button>
          <button
            type="button"
            className="boton-secundario"
            onClick={comprobar}
            disabled={Object.keys(confirmados).length === 0}
          >
            Comprobar
          </button>
          <button
            type="button"
            className="boton-secundario"
            onClick={pedirAyuda}
            disabled={fase !== 'jugando'}
          >
            Dame una pista
          </button>
        </div>
      </Grupo>

      <button
        type="button"
        className="boton-primario w-full py-3 font-titular text-lg tracking-wide"
        onClick={abrirAcusacion}
        disabled={!puedeAcusar || fase !== 'jugando'}
      >
        Acusar
      </button>
      {!puedeAcusar && (
        <p className="-mt-2 text-center text-[0.7rem] text-papel-400">
          Coloca a los {caso.reparto.sospechosos.length} sospechosos para poder acusar.
        </p>
      )}

      {errores.length > 0 && (
        <p className="ficha animate-aparecer border-sangre-500 bg-sangre-600/15 p-3 text-sm text-papel-100">
          Hay {errores.length === 1 ? 'una colocación que no encaja' : `${errores.length} colocaciones que no encajan`}{' '}
          con las pistas: {errores.map((e) => personaje(e).nombre).join(', ')}.
        </p>
      )}

      {ayuda && (
        <div className="ficha animate-aparecer border-ambar-400/70 bg-ambar-400/10 p-3">
          <p className="font-maquina text-[0.65rem] uppercase tracking-[0.2em] text-ambar-400">
            Deducción
          </p>
          <p className="mt-1 text-sm leading-snug text-papel-100">{ayuda.texto}</p>
          {detallarPaso(caso, ayuda).length > 0 && (
            <ul className="mt-2 space-y-1 border-l-2 border-ambar-400/40 pl-2.5">
              {detallarPaso(caso, ayuda).map((linea) => (
                <li key={linea} className="font-maquina text-[0.75rem] text-papel-300">
                  {linea}
                </li>
              ))}
            </ul>
          )}
          <button type="button" className="boton-secundario mt-2.5 w-full" onClick={aplicarAyuda}>
            Colocar a {personaje(ayuda.actor).nombre} y seguir
          </button>
        </div>
      )}

      {/*
       * El generador va al final y en secundario a propósito. Es el botón destructivo —tira la
       * partida en curso— y estaba arriba del todo en rojo primario, robándole el sitio a
       * «Acusar», que es el único remate del caso y debe ser el único rojo de la columna.
       */}
      <Grupo titulo="Empezar otro caso">
        <div className="space-y-2">
          <Segmentos
            etiqueta="Tamaño del plano"
            opciones={TAMANOS.map((t) => ({ valor: t, texto: `${t}×${t}` }))}
            valor={tamano}
            onCambio={setTamano}
          />
          <Segmentos
            etiqueta="Dificultad"
            opciones={DIFICULTADES.map((d) => ({ valor: d, texto: NOMBRE_DIFICULTAD[d] }))}
            valor={dificultad}
            onCambio={setDificultad}
          />
          <button
            type="button"
            className="boton-secundario w-full"
            onClick={() => nuevoCaso({ n: tamano, dificultad })}
          >
            Investigar otro caso
          </button>
        </div>
      </Grupo>

      <Grupo titulo="Compartir este caso">
        <button
          type="button"
          className="boton-secundario w-full font-maquina tracking-wide"
          onClick={copiar}
          title="Copiar el enlace al portapapeles"
        >
          {copiado ? '¡Enlace copiado!' : codigo}
        </button>
      </Grupo>
    </div>
  );
}
