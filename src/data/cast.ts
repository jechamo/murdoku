/**
 * El elenco recurrente. Cada caso reparte N de estos personajes: uno hace de víctima
 * y el resto de sospechosos, así que todos necesitan retrato propio.
 *
 * `id` es también el nombre del fichero de imagen: public/img/personajes/{id}.png
 */

export type Personaje = {
  id: string;
  /** Nombre corto, el que aparece en las pistas. */
  nombre: string;
  /** Oficio con su artículo, para la narrativa: "el comisario", "la pianista". */
  oficio: string;
  art: 'el' | 'la';
  /** Color de la ficha, usado en el tablero y en el placeholder. */
  color: string;
  /** Frase de sabor para el dossier. */
  coartada: string;
};

export const ELENCO: Personaje[] = [
  {
    id: 'comisario',
    nombre: 'Ordóñez',
    oficio: 'comisario',
    art: 'el',
    color: '#7b8794',
    coartada: 'Jura que llevaba toda la tarde revisando el informe de otro caso.',
  },
  {
    id: 'doctora',
    nombre: 'Iriarte',
    oficio: 'doctora',
    art: 'la',
    color: '#2aa198',
    coartada: 'Dice que subió a por su maletín y que no vio a nadie por el camino.',
  },
  {
    id: 'chef',
    nombre: 'Barzán',
    oficio: 'chef',
    art: 'el',
    color: '#d97706',
    coartada: 'Insiste en que no soltó el cuchillo de deshuesar en toda la noche.',
  },
  {
    id: 'viuda',
    nombre: 'Mendaro',
    oficio: 'viuda',
    art: 'la',
    color: '#8b5cf6',
    coartada: 'Afirma que estaba rezando y que los rezos no admiten testigos.',
  },
  {
    id: 'botones',
    nombre: 'Nico',
    oficio: 'botones',
    art: 'el',
    color: '#eab308',
    coartada: 'Cuenta que le mandaron a por hielo y que tardó más de la cuenta.',
  },
  {
    id: 'pianista',
    nombre: 'Solveig',
    oficio: 'pianista',
    art: 'la',
    color: '#6366f1',
    coartada: 'Sostiene que no dejó de tocar, aunque nadie recuerda haber oído música.',
  },
  {
    id: 'jardinero',
    nombre: 'Cosme',
    oficio: 'jardinero',
    art: 'el',
    color: '#4d7c0f',
    coartada: 'Asegura que estaba podando, pero tenía las tijeras limpias.',
  },
  {
    id: 'heredero',
    nombre: 'Fabián',
    oficio: 'heredero',
    art: 'el',
    color: '#e11d48',
    coartada: 'Repite que él ya lo tenía todo y que no necesitaba nada de nadie.',
  },
  {
    id: 'institutriz',
    nombre: 'Prudencia',
    oficio: 'institutriz',
    art: 'la',
    color: '#0891b2',
    coartada: 'Declara que acostaba a los niños, que dormían desde hacía una hora.',
  },
  {
    id: 'taxidermista',
    nombre: 'Ruano',
    oficio: 'taxidermista',
    art: 'el',
    color: '#a16207',
    coartada: 'Explica que trabajaba con un zorro y que el olor lo justifica todo.',
  },
  {
    id: 'soprano',
    nombre: 'Delmira',
    oficio: 'soprano',
    art: 'la',
    color: '#db2777',
    coartada: 'Cuenta que descansaba la voz y que por eso no habló con nadie.',
  },
  {
    id: 'relojero',
    nombre: 'Ibarra',
    oficio: 'relojero',
    art: 'el',
    color: '#3b82f6',
    coartada: 'Dice que ajustaba el reloj de pie y que se le fue el santo al cielo.',
  },
];

export const PERSONAJES_POR_ID: Record<string, Personaje> = Object.fromEntries(
  ELENCO.map((p) => [p.id, p]),
);

export function personaje(id: string): Personaje {
  const p = PERSONAJES_POR_ID[id];
  if (!p) throw new Error(`Personaje desconocido: ${id}`);
  return p;
}

/** "el comisario Ordóñez", para la narrativa. */
export function conOficio(p: Personaje): string {
  return `${p.art} ${p.oficio} ${p.nombre}`;
}
