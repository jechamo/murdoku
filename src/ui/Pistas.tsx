import { redactar } from '../engine/clues';
import { useJuego } from '../state/store';

/**
 * Las pistas del caso. Se pueden tachar a mano según se van gastando, que es lo que se hace
 * con el lápiz en el libro.
 *
 * Las que la ayuda señala como clave para la deducción actual quedan resaltadas.
 */
export function Pistas() {
  const { caso, pistasUsadas, ayuda, alternarPista } = useJuego();
  const clave = new Set(ayuda?.pistasClave ?? []);

  return (
    <ol className="space-y-1.5">
      {caso.pistas.map((pista, i) => {
        const usada = pistasUsadas.includes(i);
        const señalada = clave.has(i);

        return (
          <li key={i}>
            <button
              type="button"
              className={`flex w-full items-start gap-2.5 rounded border px-2.5 py-2 text-left
                          font-maquina text-[0.82rem] leading-snug transition
                          focus-visible:outline-none focus-visible:shadow-foco
                          ${
                            señalada
                              ? 'border-ambar-400/80 bg-ambar-400/10 text-papel-100'
                              : 'border-tinta-700 bg-tinta-900/60 hover:border-tinta-500'
                          }
                          ${usada ? 'opacity-45' : ''}`}
              onClick={() => alternarPista(i)}
              aria-pressed={usada}
            >
              <span
                className={`mt-px shrink-0 font-bold ${
                  señalada ? 'text-ambar-400' : 'text-sangre-400'
                }`}
              >
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className={usada ? 'line-through decoration-sangre-400/70' : ''}>
                {redactar(pista)}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
