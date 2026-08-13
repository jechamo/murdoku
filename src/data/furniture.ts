/**
 * Catálogo de mobiliario.
 *
 * Dos clases, y la diferencia es la regla del juego:
 *  - `bloquea: true`  — el mueble llena la casilla. Nadie puede estar ahí.
 *  - `bloquea: false` — es algo del suelo (una alfombra, una baldosa suelta). Se puede pisar,
 *                       así que un personaje sí puede ocupar esa casilla.
 *
 * Cada `id` aparece **como mucho una vez en todo el tablero**. Es lo que permite que una pista
 * como "junto al televisor" señale a una única casilla sin ambigüedad.
 *
 * `id` es también el nombre del fichero: public/img/muebles/{id}.png
 */

export type Articulo = 'el' | 'la' | 'los' | 'las';

export type Mueble = {
  id: string;
  nombre: string;
  art: Articulo;
  bloquea: boolean;
  /** Pictograma del placeholder mientras no haya PNG. */
  icono: string;
};

const M = (
  id: string,
  nombre: string,
  art: Articulo,
  bloquea: boolean,
  icono: string,
): Mueble => ({ id, nombre, art, bloquea, icono });

export const MOBILIARIO: Mueble[] = [
  // — Cocina
  M('nevera', 'nevera', 'la', true, '🧊'),
  M('fogones', 'fogones', 'los', true, '🔥'),
  M('fregadero', 'fregadero', 'el', true, '🚰'),
  M('alacena', 'alacena', 'la', true, '🥫'),
  M('mancha_grasa', 'mancha de grasa', 'la', false, '🟤'),

  // — Salón
  M('sofa', 'sofá', 'el', true, '🛋️'),
  M('televisor', 'televisor', 'el', true, '📺'),
  M('chimenea', 'chimenea', 'la', true, '🔥'),
  M('butaca', 'butaca', 'la', true, '💺'),
  M('alfombra_persa', 'alfombra persa', 'la', false, '🟥'),

  // — Dormitorio
  M('cama', 'cama', 'la', true, '🛏️'),
  M('armario', 'armario', 'el', true, '🚪'),
  M('tocador', 'tocador', 'el', true, '🪞'),
  M('mesilla', 'mesilla de noche', 'la', true, '🕯️'),
  M('alfombra_piel', 'alfombra de piel', 'la', false, '⬜'),

  // — Estudio
  M('escritorio', 'escritorio', 'el', true, '🗄️'),
  M('caja_fuerte', 'caja fuerte', 'la', true, '🔐'),
  M('globo', 'globo terráqueo', 'el', true, '🌍'),
  M('archivador', 'archivador', 'el', true, '🗃️'),
  M('alfombra_lectura', 'alfombra de lectura', 'la', false, '🟫'),

  // — Biblioteca
  M('estanteria', 'estantería', 'la', true, '📚'),
  M('atril', 'atril', 'el', true, '📖'),
  M('escalera_mano', 'escalera de mano', 'la', true, '🪜'),
  M('vitrina', 'vitrina', 'la', true, '🏺'),
  M('alfombra_raida', 'alfombra raída', 'la', false, '🟨'),

  // — Baño
  M('banera', 'bañera', 'la', true, '🛁'),
  M('lavabo', 'lavabo', 'el', true, '🚿'),
  M('espejo', 'espejo', 'el', true, '🪞'),
  M('cesto_ropa', 'cesto de la ropa', 'el', true, '🧺'),
  M('baldosa_suelta', 'baldosa suelta', 'la', false, '⬛'),

  // — Comedor
  M('mesa_larga', 'mesa larga', 'la', true, '🍽️'),
  M('aparador', 'aparador', 'el', true, '🍶'),
  M('candelabro', 'candelabro', 'el', true, '🕯️'),
  M('trinchero', 'trinchero', 'el', true, '🥄'),
  M('alfombra_bordada', 'alfombra bordada', 'la', false, '🟧'),

  // — Invernadero
  M('palmera', 'palmera', 'la', true, '🌴'),
  M('banco_piedra', 'banco de piedra', 'el', true, '🪨'),
  M('fuente', 'fuente', 'la', true, '⛲'),
  M('macetero', 'macetero', 'el', true, '🪴'),
  M('charco', 'charco de agua', 'el', false, '💧'),

  // — Sótano
  M('caldera', 'caldera', 'la', true, '♨️'),
  M('barriles', 'barriles', 'los', true, '🛢️'),
  M('herramientas', 'herramientas', 'las', true, '🔧'),
  M('arcon', 'arcón', 'el', true, '🧰'),
  M('trampilla', 'trampilla', 'la', false, '🕳️'),

  // — Pasillo
  M('perchero', 'perchero', 'el', true, '🧥'),
  M('reloj_pie', 'reloj de pie', 'el', true, '🕰️'),
  M('cuadro', 'cuadro torcido', 'el', true, '🖼️'),
  M('consola', 'consola de entrada', 'la', true, '🪑'),
  M('felpudo', 'felpudo', 'el', false, '🟩'),

  // — Salón de música
  M('piano', 'piano', 'el', true, '🎹'),
  M('arpa', 'arpa', 'el', true, '🎵'),
  M('gramola', 'gramola', 'la', true, '📻'),
  M('atril_musica', 'atril de partituras', 'el', true, '🎼'),
  M('tarima', 'tarima', 'la', false, '🟪'),

  // — Sala de billar
  M('mesa_billar', 'mesa de billar', 'la', true, '🎱'),
  M('taquera', 'taquera', 'la', true, '🎳'),
  M('mueble_bar', 'mueble bar', 'el', true, '🥃'),
  M('diana', 'diana', 'la', true, '🎯'),
  M('alfombra_verde', 'alfombra verde', 'la', false, '🟩'),

  // — Desván
  M('baules', 'baúles', 'los', true, '📦'),
  M('maniqui', 'maniquí', 'el', true, '🧍'),
  M('espejo_roto', 'espejo roto', 'el', true, '💔'),
  M('jaula', 'jaula vacía', 'la', true, '🪤'),
  M('tablon_suelto', 'tablón suelto', 'el', false, '🟫'),

  // — Garaje
  M('coche', 'coche', 'el', true, '🚗'),
  M('banco_trabajo', 'banco de trabajo', 'el', true, '🔨'),
  M('neumaticos', 'neumáticos', 'los', true, '🛞'),
  M('gato_hidraulico', 'gato hidráulico', 'el', true, '⚙️'),
  M('mancha_aceite', 'mancha de aceite', 'la', false, '⚫'),

  // — Vestíbulo
  M('escalinata', 'escalinata', 'la', true, '🪜'),
  M('estatua', 'estatua', 'la', true, '🗿'),
  M('paraguero', 'paragüero', 'el', true, '☂️'),
  M('recibidor', 'mueble recibidor', 'el', true, '🗝️'),
  M('felpudo_largo', 'felpudo largo', 'el', false, '🟥'),
];

export const MUEBLES_POR_ID: Record<string, Mueble> = Object.fromEntries(
  MOBILIARIO.map((m) => [m.id, m]),
);

export function mueble(id: string): Mueble {
  const m = MUEBLES_POR_ID[id];
  if (!m) throw new Error(`Mueble desconocido: ${id}`);
  return m;
}

/** "el televisor", "los barriles" */
export function conArticulo(m: Mueble): string {
  return `${m.art} ${m.nombre}`;
}

/** "junto al televisor", "junto a la nevera", "junto a los barriles" */
export function juntoA(m: Mueble): string {
  return m.art === 'el' ? `junto al ${m.nombre}` : `junto a ${m.art} ${m.nombre}`;
}

/** "sobre la alfombra persa". Solo tiene sentido con muebles que no bloquean. */
export function sobre(m: Mueble): string {
  return `sobre ${m.art} ${m.nombre}`;
}
