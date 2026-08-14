import { useState } from 'react';

import { ELENCO, personaje } from '../data/cast';
import { leerCodigo } from '../engine/generate';
import {
  DIFICULTADES,
  NOMBRE_DIFICULTAD,
  N_MAX,
  N_MIN,
  PERFILES,
  type Dificultad,
} from '../engine/types';
import { Retrato } from './Sprite';
import { useJuego } from '../state/store';

const TAMANOS = Array.from({ length: N_MAX - N_MIN + 1 }, (_, i) => N_MIN + i);

/** Qué se le pide al jugador en cada nivel, en una frase. */
const QUE_PIDE: Record<Dificultad, string> = {
  aprendiz: 'Cada pista se ve en el plano: en qué habitación, junto a qué mueble.',
  facil: 'Como Aprendiz, y además esquinas, paredes y contar cuántos hay en una sala.',
  medio: 'Hay que cruzar unas pistas con otras. A veces el cadáver tampoco viene situado.',
  dificil: 'Deducciones encadenadas: mirar qué filas y columnas les quedan libres a los demás.',
};

/**
 * Tablón de investigación: los retratos del elenco clavados al fondo con hilo rojo entre
 * ellos. Es decorado, así que no responde al ratón ni lo lee un lector de pantalla.
 */
function Tablon() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 100">
        <path
          d="M6 12 L22 8 L38 9 L74 8 L90 11 M6 12 L8 36 L6 68 L10 88 M90 11 L92 34 L91 62 L90 86
             M8 36 L52 90 M92 34 L22 88 M38 9 L91 62"
          fill="none"
          stroke="rgba(198,47,38,0.5)"
          strokeWidth="0.35"
        />
      </svg>
      {ELENCO.map((p, i) => {
        // Reparto fijo, no aleatorio: la portada tiene que verse igual cada vez que se abre.
        // Van todas por los bordes, dejando libre el centro para el panel.
        const izquierda = [1, 14, 25, 73, 85, 1, 86, 2, 17, 47, 70, 85][i]!;
        const arriba = [6, 1, 10, 9, 4, 32, 30, 64, 84, 86, 82, 57][i]!;
        const giro = [-7, 5, -4, 8, -6, 6, -9, 4, -5, 7, -3, 9][i]!;
        return (
          <div
            key={p.id}
            className="absolute w-24 bg-papel-200 p-1 pb-4 shadow-ficha sm:w-32"
            style={{
              left: `${izquierda}%`,
              top: `${arriba}%`,
              // @ts-expect-error variable CSS propia, usada por la animación `colgar`
              '--giro': `${giro}deg`,
              transform: `rotate(${giro}deg)`,
              animation: `colgar ${5 + (i % 4)}s ease-in-out ${i * 0.3}s infinite`,
            }}
          >
            <div className="aspect-square w-full overflow-hidden">
              <Retrato id={p.id} />
            </div>
            {/* Chincheta */}
            <span
              className="absolute left-1/2 top-[-5px] h-2.5 w-2.5 -translate-x-1/2 rounded-full
                         shadow-[0_1px_3px_rgba(0,0,0,0.8)]"
              style={{ background: p.color }}
            />
          </div>
        );
      })}
      {/*
       * Velo en dos capas: uno suave y general que hunde el tablón sin apagarlo, y otro radial
       * que oscurece el centro para que el panel se lea sobre él. Con un degradado plano de
       * arriba abajo las fichas se perdían del todo.
       */}
      <div className="absolute inset-0 bg-tinta-950/55" />
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 58% 72% at 50% 44%, rgba(11,11,13,0.97) 45%, rgba(11,11,13,0.2) 100%)',
        }}
      />
    </div>
  );
}

function Selector<T extends string | number>({
  etiqueta,
  opciones,
  valor,
  onCambio,
}: {
  etiqueta: string;
  opciones: { valor: T; texto: string }[];
  valor: T;
  onCambio: (v: T) => void;
}) {
  return (
    <div role="radiogroup" aria-label={etiqueta} className="flex flex-wrap gap-2">
      {opciones.map((o) => (
        <button
          key={String(o.valor)}
          type="button"
          role="radio"
          aria-checked={o.valor === valor}
          className={`min-w-[3.5rem] rounded-md border px-3 py-2 font-maquina text-sm font-bold
                      transition focus-visible:outline-none focus-visible:shadow-foco ${
                        o.valor === valor
                          ? 'border-ambar-400 bg-ambar-500 text-tinta-950'
                          : 'border-tinta-600 bg-tinta-900/80 text-papel-300 hover:border-ambar-400/60'
                      }`}
          onClick={() => onCambio(o.valor)}
        >
          {o.texto}
        </button>
      ))}
    </div>
  );
}

export function Menu() {
  const { caso, nuevoCaso } = useJuego();
  const [n, setN] = useState(caso.n);
  const [dificultad, setDificultad] = useState<Dificultad>(caso.dificultad);
  const [codigo, setCodigo] = useState('');

  const perfil = PERFILES[dificultad];
  const codigoValido = codigo.trim() === '' ? null : leerCodigo(codigo);

  return (
    <div className="relative min-h-full overflow-hidden">
      <Tablon />

      <div className="relative mx-auto flex min-h-full max-w-3xl flex-col justify-center px-4 py-10 sm:px-6">
        <header className="text-center">
          <p className="font-maquina text-[0.65rem] uppercase tracking-[0.4em] text-sangre-400">
            Sudoku con cadáver
          </p>
          <h1 className="titulo-caso mt-2 text-6xl leading-none text-papel-100 sm:text-8xl">
            MURDOKU
          </h1>
          <p className="mx-auto mt-4 max-w-xl font-maquina text-sm leading-relaxed text-papel-300">
            Un plano, unos cuantos sospechosos y unas declaraciones. Nadie repite fila ni
            columna. Coloca a cada uno en su sitio y descubre quién se quedó a solas con la
            víctima.
          </p>
        </header>

        <div className="ficha mt-8 space-y-6 p-5 sm:p-6">
          <section>
            <h2 className="mb-2 font-maquina text-[0.65rem] uppercase tracking-[0.25em] text-papel-400">
              Tamaño del plano
            </h2>
            <Selector
              etiqueta="Tamaño del plano"
              opciones={TAMANOS.map((t) => ({ valor: t, texto: `${t}×${t}` }))}
              valor={n}
              onCambio={setN}
            />
            <p className="mt-2 font-maquina text-xs text-papel-400">
              {n}×{n} · {n - 1} sospechosos y la víctima
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-maquina text-[0.65rem] uppercase tracking-[0.25em] text-papel-400">
              Nivel
            </h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {DIFICULTADES.map((d) => {
                const activo = d === dificultad;
                return (
                  <button
                    key={d}
                    type="button"
                    aria-pressed={activo}
                    className={`rounded-md border p-3 text-left transition
                                focus-visible:outline-none focus-visible:shadow-foco ${
                                  activo
                                    ? 'border-ambar-400 bg-ambar-400/10 shadow-foco'
                                    : 'border-tinta-600 bg-tinta-900/80 hover:border-ambar-400/50'
                                }`}
                    onClick={() => setDificultad(d)}
                  >
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="font-titular text-lg text-papel-100">
                        {NOMBRE_DIFICULTAD[d]}
                      </span>
                      <span className="font-maquina text-[0.65rem] text-ambar-400">
                        desde {PERFILES[d].desde} años
                      </span>
                    </span>
                    <span className="mt-1 block text-[0.75rem] leading-snug text-papel-400">
                      {QUE_PIDE[d]}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <button
            type="button"
            className="boton-primario w-full py-4 font-titular text-2xl tracking-wide"
            onClick={() => nuevoCaso({ n, dificultad })}
          >
            Abrir el caso
          </button>

          <p className="text-center font-maquina text-xs text-papel-400">
            {perfil.cadaverSiempreALaVista
              ? 'El cadáver viene situado en el plano.'
              : 'A veces el cadáver tampoco viene situado: habrá que buscarlo.'}
          </p>

          <section className="border-t border-tinta-700 pt-4">
            <h2 className="mb-2 font-maquina text-[0.65rem] uppercase tracking-[0.25em] text-papel-400">
              ¿Te han pasado un caso?
            </h2>
            <div className="flex gap-2">
              <input
                type="text"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                placeholder="7x7-medio-A3F91C"
                aria-label="Código del caso"
                className="min-w-0 flex-1 rounded-md border border-tinta-600 bg-tinta-900 px-3 py-2
                           font-maquina text-sm text-papel-200 placeholder:text-papel-400/50
                           focus:border-ambar-400 focus:outline-none"
              />
              <button
                type="button"
                className="boton-secundario"
                disabled={!codigoValido}
                onClick={() => codigoValido && nuevoCaso(codigoValido)}
              >
                Abrir
              </button>
            </div>
            {codigo.trim() !== '' && !codigoValido && (
              <p className="mt-1.5 font-maquina text-xs text-sangre-400">
                Ese código no tiene la forma esperada.
              </p>
            )}
          </section>
        </div>

        <footer className="mt-6 text-center font-maquina text-[0.7rem] leading-relaxed text-papel-400">
          Sospechosos de esta temporada:{' '}
          {ELENCO.slice(0, 6)
            .map((p) => personaje(p.id).nombre)
            .join(', ')}{' '}
          y más.
          <br />
          Murdoku es un pasatiempo creado por Manuel Garand.
        </footer>
      </div>
    </div>
  );
}
