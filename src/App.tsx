import { ESCENARIOS, habitacion } from './data/rooms';
import { conOficio, personaje } from './data/cast';
import { NOMBRE_DIFICULTAD } from './engine/types';
import { BarraSospechosos, Coartadas, FichasSospechosos, FichaVictima } from './ui/Dossier';
import { Controles } from './ui/Controles';
import { Pistas } from './ui/Pistas';
import { Tablero } from './ui/Tablero';
import { CapaFinal } from './ui/Veredicto';
import { useJuego } from './state/store';

function Seccion({
  titulo,
  numero,
  children,
  className = '',
}: {
  titulo: string;
  numero?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={className}>
      <h2 className="mb-2 flex items-baseline gap-2 border-b border-tinta-700 pb-1.5">
        <span className="font-titular text-lg text-papel-100">{titulo}</span>
        {numero && (
          <span className="font-maquina text-[0.7rem] text-papel-400">{numero}</span>
        )}
      </h2>
      {children}
    </section>
  );
}

function Cabecera() {
  const caso = useJuego((s) => s.caso);
  const escenario = ESCENARIOS.find((e) => e.id === caso.plano.escenario)!;
  const victima = personaje(caso.reparto.victima);
  const habCrimen = habitacion(caso.plano.habitacionDe[caso.victimaEn]!);

  return (
    <header className="border-b border-tinta-700 bg-tinta-900/50">
      <div className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6">
        <p className="font-maquina text-[0.65rem] uppercase tracking-[0.3em] text-sangre-400">
          Murdoku · caso {caso.semilla}
        </p>
        <h1 className="titulo-caso mt-1 text-3xl leading-none text-papel-100 sm:text-4xl">
          {escenario.nombre}
        </h1>
        <p className="mt-2 max-w-3xl font-maquina text-sm leading-relaxed text-papel-300">
          {escenario.entradilla} Encontraron a {conOficio(victima)} en {habCrimen.art}{' '}
          {habCrimen.nombre}. Nadie compartía fila ni columna con nadie, y solo una persona se
          quedó a solas con {victima.art === 'el' ? 'él' : 'ella'}.
        </p>
        <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 font-maquina text-[0.7rem] text-papel-400">
          <span>
            Plano {caso.n}×{caso.n}
          </span>
          <span aria-hidden>·</span>
          <span>{NOMBRE_DIFICULTAD[caso.dificultad]}</span>
          <span aria-hidden>·</span>
          <span>{caso.reparto.sospechosos.length} sospechosos</span>
          <span aria-hidden>·</span>
          <span>{caso.pistas.length} pistas</span>
        </p>
      </div>
    </header>
  );
}

function ComoSeJuega() {
  return (
    <details className="ficha p-3 text-sm">
      <summary className="cursor-pointer font-titular text-papel-100">Cómo se juega</summary>
      <ol className="mt-2 list-decimal space-y-1.5 pl-4 text-[0.82rem] leading-relaxed text-papel-300">
        <li>
          Cada sospechoso ocupa una casilla. <strong className="text-papel-100">Nadie repite
          fila ni columna</strong>, igual que en un sudoku. La víctima también cuenta.
        </li>
        <li>
          Elige un sospechoso en su ficha y ve marcando en el plano todas las casillas donde
          podría estar. Puedes dejar marcadas las que quieras a la vez.
        </li>
        <li>
          El clic derecho (o el modo <em>Descartar</em>) tacha una casilla con una ✗ cuando la
          descartes.
        </li>
        <li>
          Cuando lo tengas claro, pulsa el <strong className="text-ambar-400">✓</strong> de la
          marca: el sospechoso queda fijado y su fila y su columna se tachan enteras.
        </li>
        <li>
          Con todos colocados, acusa. El asesino es quien se quedó a solas con la víctima en su
          misma habitación.
        </li>
      </ol>
      <p className="mt-2.5 border-t border-tinta-700 pt-2 text-[0.78rem] leading-relaxed text-papel-400">
        Las casillas rayadas están ocupadas por un mueble y nadie puede ponerse ahí. Todos los
        casos tienen una única solución y se pueden resolver razonando, sin probar suerte.
      </p>
    </details>
  );
}

export function App() {
  const caso = useJuego((s) => s.caso);

  return (
    <div className="min-h-full">
      <Cabecera />

      <main className="mx-auto grid max-w-[1500px] gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(230px,270px)_minmax(0,1fr)_minmax(280px,330px)]">
        {/* Sospechosos */}
        <div className="order-2 space-y-4 lg:order-1">
          <FichaVictima />
          <Seccion titulo="Sospechosos" numero={`${caso.reparto.sospechosos.length}`}>
            <FichasSospechosos />
          </Seccion>
          <Seccion titulo="Coartadas">
            <Coartadas />
          </Seccion>
        </div>

        {/* Plano */}
        <div className="order-1 space-y-4 lg:order-2">
          <div className="ficha p-3 sm:p-4">
            <Tablero />
          </div>
          <ComoSeJuega />
        </div>

        {/* Pistas y controles */}
        <div className="order-3 space-y-4">
          <Seccion titulo="Declaraciones" numero={`${caso.pistas.length}`}>
            <Pistas />
          </Seccion>
          <Controles />
        </div>
      </main>

      <footer className="mx-auto max-w-[1500px] px-4 pb-8 text-center font-maquina text-[0.7rem] text-papel-400 sm:px-6">
        Murdoku es un pasatiempo creado por Manuel Garand. Esta es una implementación libre que
        genera casos nuevos.
      </footer>

      {/* Hueco para que la barra fija del móvil no tape el final de la página. */}
      <div className="h-24 lg:hidden" aria-hidden />

      <BarraSospechosos />
      <CapaFinal />
    </div>
  );
}
