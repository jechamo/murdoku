/**
 * Catálogo de mobiliario.
 *
 * La distinción que importa es **si una persona puede estar ahí**, y no es la misma que
 * "¿ocupa la casilla un mueble?". En los Murdokus del libro las pistas dicen «estaba sentada
 * en una silla», «estaba sobre una cama», frente a «estaba junto a una estantería»: en un sofá,
 * una cama o una butaca sí te colocas; en una estantería o una nevera, no, te pones al lado.
 *
 *  - `ocupable: true`  — se puede estar encima o dentro: camas, sofás, butacas, la bañera, el
 *                        coche, y todo lo que es del suelo (alfombras, manchas, trampillas).
 *  - `ocupable: false` — el mueble llena la casilla y nadie cabe: neveras, armarios, pianos.
 *
 * `prep` es la preposición con la que se redacta la ocupación: «en la butaca», «sobre la
 * alfombra».
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
  /** ¿Puede colocarse una persona en esta casilla? */
  ocupable: boolean;
  /** Preposición para la ocupación: "en la cama", "sobre la alfombra". */
  prep: 'en' | 'sobre';
  /** Pictograma del placeholder mientras no haya PNG. */
  icono: string;
};

/** Mueble que llena la casilla: nadie puede estar ahí. */
const lleno = (id: string, nombre: string, art: Articulo, icono: string): Mueble => ({
  id,
  nombre,
  art,
  ocupable: false,
  prep: 'en',
  icono,
});

/** Mueble en el que uno se sienta, se tumba o se mete. */
const asiento = (
  id: string,
  nombre: string,
  art: Articulo,
  icono: string,
  prep: 'en' | 'sobre' = 'en',
): Mueble => ({ id, nombre, art, ocupable: true, prep, icono });

/** Elemento del suelo: se pisa. */
const suelo = (id: string, nombre: string, art: Articulo, icono: string): Mueble => ({
  id,
  nombre,
  art,
  ocupable: true,
  prep: 'sobre',
  icono,
});

export const MOBILIARIO: Mueble[] = [
  // — Cocina
  lleno('nevera', 'nevera', 'la', '🧊'),
  lleno('fogones', 'fogones', 'los', '🔥'),
  lleno('fregadero', 'fregadero', 'el', '🚰'),
  lleno('alacena', 'alacena', 'la', '🥫'),
  suelo('mancha_grasa', 'mancha de grasa', 'la', '🟤'),

  // — Salón
  asiento('sofa', 'sofá', 'el', '🛋️'),
  lleno('televisor', 'televisor', 'el', '📺'),
  lleno('chimenea', 'chimenea', 'la', '🔥'),
  asiento('butaca', 'butaca', 'la', '💺'),
  suelo('alfombra_persa', 'alfombra persa', 'la', '🟥'),

  // — Dormitorio
  asiento('cama', 'cama', 'la', '🛏️'),
  lleno('armario', 'armario', 'el', '🚪'),
  lleno('tocador', 'tocador', 'el', '🪞'),
  lleno('mesilla', 'mesilla de noche', 'la', '🕯️'),
  suelo('alfombra_piel', 'alfombra de piel', 'la', '⬜'),

  // — Estudio
  lleno('escritorio', 'escritorio', 'el', '🗄️'),
  lleno('caja_fuerte', 'caja fuerte', 'la', '🔐'),
  lleno('globo', 'globo terráqueo', 'el', '🌍'),
  lleno('archivador', 'archivador', 'el', '🗃️'),
  suelo('alfombra_lectura', 'alfombra de lectura', 'la', '🟫'),

  // — Biblioteca
  lleno('estanteria', 'estantería', 'la', '📚'),
  lleno('atril', 'atril', 'el', '📖'),
  lleno('escalera_mano', 'escalera de mano', 'la', '🪜'),
  lleno('vitrina', 'vitrina', 'la', '🏺'),
  suelo('alfombra_raida', 'alfombra raída', 'la', '🟨'),

  // — Baño
  asiento('banera', 'bañera', 'la', '🛁'),
  lleno('lavabo', 'lavabo', 'el', '🚿'),
  lleno('espejo', 'espejo', 'el', '🪞'),
  lleno('cesto_ropa', 'cesto de la ropa', 'el', '🧺'),
  suelo('baldosa_suelta', 'baldosa suelta', 'la', '⬛'),

  // — Comedor
  lleno('mesa_larga', 'mesa larga', 'la', '🍽️'),
  lleno('aparador', 'aparador', 'el', '🍶'),
  lleno('candelabro', 'candelabro', 'el', '🕯️'),
  lleno('trinchero', 'trinchero', 'el', '🥄'),
  suelo('alfombra_bordada', 'alfombra bordada', 'la', '🟧'),

  // — Invernadero
  lleno('palmera', 'palmera', 'la', '🌴'),
  asiento('banco_piedra', 'banco de piedra', 'el', '🪨'),
  lleno('fuente', 'fuente', 'la', '⛲'),
  lleno('macetero', 'macetero', 'el', '🪴'),
  suelo('charco', 'charco de agua', 'el', '💧'),

  // — Sótano
  lleno('caldera', 'caldera', 'la', '♨️'),
  lleno('barriles', 'barriles', 'los', '🛢️'),
  lleno('herramientas', 'herramientas', 'las', '🔧'),
  lleno('arcon', 'arcón', 'el', '🧰'),
  suelo('trampilla', 'trampilla', 'la', '🕳️'),

  // — Pasillo
  lleno('perchero', 'perchero', 'el', '🧥'),
  lleno('reloj_pie', 'reloj de pie', 'el', '🕰️'),
  lleno('cuadro', 'cuadro torcido', 'el', '🖼️'),
  lleno('consola', 'consola de entrada', 'la', '🪑'),
  suelo('felpudo', 'felpudo', 'el', '🟩'),

  // — Salón de música
  lleno('piano', 'piano', 'el', '🎹'),
  lleno('arpa', 'arpa', 'el', '🎵'),
  lleno('gramola', 'gramola', 'la', '📻'),
  lleno('atril_musica', 'atril de partituras', 'el', '🎼'),
  suelo('tarima', 'tarima', 'la', '🟪'),

  // — Sala de billar
  lleno('mesa_billar', 'mesa de billar', 'la', '🎱'),
  lleno('taquera', 'taquera', 'la', '🎳'),
  lleno('mueble_bar', 'mueble bar', 'el', '🥃'),
  lleno('diana', 'diana', 'la', '🎯'),
  suelo('alfombra_verde', 'alfombra verde', 'la', '🟩'),

  // — Desván
  asiento('baules', 'baúles', 'los', '📦', 'sobre'),
  lleno('maniqui', 'maniquí', 'el', '🧍'),
  lleno('espejo_roto', 'espejo roto', 'el', '💔'),
  lleno('jaula', 'jaula vacía', 'la', '🪤'),
  suelo('tablon_suelto', 'tablón suelto', 'el', '🟫'),

  // — Garaje
  asiento('coche', 'coche', 'el', '🚗'),
  lleno('banco_trabajo', 'banco de trabajo', 'el', '🔨'),
  lleno('neumaticos', 'neumáticos', 'los', '🛞'),
  lleno('gato_hidraulico', 'gato hidráulico', 'el', '⚙️'),
  suelo('mancha_aceite', 'mancha de aceite', 'la', '⚫'),

  // — Vestíbulo
  asiento('escalinata', 'escalinata', 'la', '🪜'),
  lleno('estatua', 'estatua', 'la', '🗿'),
  lleno('paraguero', 'paragüero', 'el', '☂️'),
  lleno('recibidor', 'mueble recibidor', 'el', '🗝️'),
  suelo('felpudo_largo', 'felpudo largo', 'el', '🟥'),
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

/**
 * Cómo se dice que alguien está ocupando ese mueble: "en la butaca", "sobre la alfombra",
 * "en el coche". Solo tiene sentido con muebles ocupables.
 */
export function ocupando(m: Mueble): string {
  if (m.prep === 'sobre') return `sobre ${m.art} ${m.nombre}`;
  return m.art === 'el' ? `en el ${m.nombre}` : `en ${m.art} ${m.nombre}`;
}
