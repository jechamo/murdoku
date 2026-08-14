import { useEffect, useState } from 'react';

/**
 * Transición de revelado entre elegir un caso y verlo.
 *
 * Un caso tarda entre 15 y 130 ms en generarse, así que esto **no es una barra de progreso**:
 * no habría nada que medir y un spinner de verdad ni se vería. Es un efecto deliberado, con un
 * mínimo en pantalla para que dé tiempo a leerlo, y el trabajo se lanza tras ceder un fotograma
 * para que la animación llegue a pintar antes de que el hilo se ocupe.
 */
const MINIMO_EN_PANTALLA = 850;

const FRASES = [
  'Precintando la casa…',
  'Tomando declaración a los testigos…',
  'Repasando el plano de la vivienda…',
  'Reuniendo a los sospechosos…',
  'Buscando huellas en el mobiliario…',
];

/**
 * Ejecuta `trabajo` mostrando el revelado. Devuelve una promesa que se resuelve cuando el
 * trabajo ha terminado *y* además ha pasado el mínimo en pantalla.
 */
export function conRevelado(marcar: (activo: boolean) => void, trabajo: () => void): void {
  marcar(true);
  const empezado = Date.now();
  // Dos saltos: el primero deja que React pinte el overlay, el segundo que el navegador lo
  // muestre de verdad antes de bloquear el hilo generando.
  requestAnimationFrame(() => {
    setTimeout(() => {
      trabajo();
      const falta = Math.max(0, MINIMO_EN_PANTALLA - (Date.now() - empezado));
      setTimeout(() => marcar(false), falta);
    }, 0);
  });
}

/**
 * Lupa sobre un plano insinuado. La lupa se queda quieta y lo que gira es el barrido de dentro
 * del cristal: haciendo girar la lupa entera parecía un chupachups.
 */
function Lupa() {
  return (
    <svg viewBox="0 0 120 120" className="h-28 w-28" aria-hidden>
      {/* Rejilla del plano, apenas insinuada bajo el cristal */}
      <g clipPath="url(#cristal)" opacity="0.5">
        <rect x="20" y="20" width="66" height="66" fill="rgba(240,185,92,0.06)" />
        {[33, 46, 59, 72].map((v) => (
          <g key={v}>
            <line x1={v} y1="20" x2={v} y2="86" stroke="rgba(240,185,92,0.4)" strokeWidth="1" />
            <line x1="20" y1={v} x2="86" y2={v} stroke="rgba(240,185,92,0.4)" strokeWidth="1" />
          </g>
        ))}
        {/* Barrido: la aguja que da la vuelta al cristal */}
        <g className="origin-[53px_53px] animate-[girar_1.6s_linear_infinite]">
          <path d="M53 53 L53 17" stroke="#f0b95c" strokeWidth="3" strokeLinecap="round" />
          <circle cx="53" cy="17" r="4" fill="#f0b95c" />
        </g>
      </g>
      <clipPath id="cristal">
        <circle cx="53" cy="53" r="30" />
      </clipPath>
      <circle cx="53" cy="53" r="30" fill="none" stroke="#f0b95c" strokeWidth="5" />
      <path d="M75 75 L100 100" stroke="#f0b95c" strokeWidth="9" strokeLinecap="round" />
    </svg>
  );
}

export function Revelado({ activo }: { activo: boolean }) {
  const [frase, setFrase] = useState(FRASES[0]!);

  useEffect(() => {
    if (activo) setFrase(FRASES[Math.floor(Math.random() * FRASES.length)]!);
  }, [activo]);

  if (!activo) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-5
                 bg-tinta-950/95 backdrop-blur-sm"
      role="status"
      aria-live="polite"
    >
      <Lupa />
      <p className="font-maquina text-sm uppercase tracking-[0.3em] text-ambar-400">
        Nuevo caso
      </p>
      <p className="animate-latido font-titular text-xl text-papel-200">{frase}</p>
    </div>
  );
}
