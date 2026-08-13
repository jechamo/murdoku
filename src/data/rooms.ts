/**
 * Habitaciones temáticas. Cada caso reparte el plano en 4-7 de estas, y cada habitación
 * solo se amuebla con lo suyo, de modo que el mobiliario delata la estancia.
 *
 * `bloqueantes` son muebles que llenan la casilla; `suelo` son elementos pisables, donde
 * un personaje sí puede colocarse.
 */

export type Habitacion = {
  id: string;
  nombre: string;
  art: 'el' | 'la';
  bloqueantes: string[];
  suelo: string[];
};

export const HABITACIONES: Habitacion[] = [
  {
    id: 'cocina',
    nombre: 'Cocina',
    art: 'la',
    bloqueantes: ['nevera', 'fogones', 'fregadero', 'alacena'],
    suelo: ['mancha_grasa'],
  },
  {
    id: 'salon',
    nombre: 'Salón',
    art: 'el',
    bloqueantes: ['sofa', 'televisor', 'chimenea', 'butaca'],
    suelo: ['alfombra_persa'],
  },
  {
    id: 'dormitorio',
    nombre: 'Dormitorio',
    art: 'el',
    bloqueantes: ['cama', 'armario', 'tocador', 'mesilla'],
    suelo: ['alfombra_piel'],
  },
  {
    id: 'estudio',
    nombre: 'Estudio',
    art: 'el',
    bloqueantes: ['escritorio', 'caja_fuerte', 'globo', 'archivador'],
    suelo: ['alfombra_lectura'],
  },
  {
    id: 'biblioteca',
    nombre: 'Biblioteca',
    art: 'la',
    bloqueantes: ['estanteria', 'atril', 'escalera_mano', 'vitrina'],
    suelo: ['alfombra_raida'],
  },
  {
    id: 'bano',
    nombre: 'Baño',
    art: 'el',
    bloqueantes: ['banera', 'lavabo', 'espejo', 'cesto_ropa'],
    suelo: ['baldosa_suelta'],
  },
  {
    id: 'comedor',
    nombre: 'Comedor',
    art: 'el',
    bloqueantes: ['mesa_larga', 'aparador', 'candelabro', 'trinchero'],
    suelo: ['alfombra_bordada'],
  },
  {
    id: 'invernadero',
    nombre: 'Invernadero',
    art: 'el',
    bloqueantes: ['palmera', 'banco_piedra', 'fuente', 'macetero'],
    suelo: ['charco'],
  },
  {
    id: 'sotano',
    nombre: 'Sótano',
    art: 'el',
    bloqueantes: ['caldera', 'barriles', 'herramientas', 'arcon'],
    suelo: ['trampilla'],
  },
  {
    id: 'pasillo',
    nombre: 'Pasillo',
    art: 'el',
    bloqueantes: ['perchero', 'reloj_pie', 'cuadro', 'consola'],
    suelo: ['felpudo'],
  },
  {
    id: 'musica',
    nombre: 'Sala de Música',
    art: 'la',
    bloqueantes: ['piano', 'arpa', 'gramola', 'atril_musica'],
    suelo: ['tarima'],
  },
  {
    id: 'billar',
    nombre: 'Sala de Billar',
    art: 'la',
    bloqueantes: ['mesa_billar', 'taquera', 'mueble_bar', 'diana'],
    suelo: ['alfombra_verde'],
  },
  {
    id: 'desvan',
    nombre: 'Desván',
    art: 'el',
    bloqueantes: ['baules', 'maniqui', 'espejo_roto', 'jaula'],
    suelo: ['tablon_suelto'],
  },
  {
    id: 'garaje',
    nombre: 'Garaje',
    art: 'el',
    bloqueantes: ['coche', 'banco_trabajo', 'neumaticos', 'gato_hidraulico'],
    suelo: ['mancha_aceite'],
  },
  {
    id: 'vestibulo',
    nombre: 'Vestíbulo',
    art: 'el',
    bloqueantes: ['escalinata', 'estatua', 'paraguero', 'recibidor'],
    suelo: ['felpudo_largo'],
  },
];

export const HABITACIONES_POR_ID: Record<string, Habitacion> = Object.fromEntries(
  HABITACIONES.map((h) => [h.id, h]),
);

export function habitacion(id: string): Habitacion {
  const h = HABITACIONES_POR_ID[id];
  if (!h) throw new Error(`Habitación desconocida: ${id}`);
  return h;
}

/** "la Cocina", "el Salón" */
export function conArticuloHab(h: Habitacion): string {
  return `${h.art} ${h.nombre}`;
}

/** "en la Cocina", "en el Salón" */
export function enHab(h: Habitacion): string {
  return `en ${h.art} ${h.nombre}`;
}

/** "de la Cocina", "del Salón" */
export function deHab(h: Habitacion): string {
  return h.art === 'el' ? `del ${h.nombre}` : `de la ${h.nombre}`;
}

/** Escenarios: cada caso elige uno y reparte sus habitaciones por el plano. */
export type Escenario = {
  id: string;
  nombre: string;
  /** Frase de apertura del caso. */
  entradilla: string;
  habitaciones: string[];
};

export const ESCENARIOS: Escenario[] = [
  {
    id: 'mansion',
    nombre: 'La mansión Vilaseca',
    entradilla:
      'Llovía sobre la mansión Vilaseca cuando se cortó la luz. Al volver, alguien ya no respiraba.',
    habitaciones: ['vestibulo', 'salon', 'comedor', 'biblioteca', 'estudio', 'cocina', 'pasillo'],
  },
  {
    id: 'hotel',
    nombre: 'El hotel Zenit',
    entradilla:
      'El hotel Zenit cerraba por temporada. Solo quedaban ocho huéspedes y una llave de más.',
    habitaciones: ['vestibulo', 'pasillo', 'dormitorio', 'bano', 'salon', 'cocina', 'comedor'],
  },
  {
    id: 'teatro',
    nombre: 'El teatro Almirante',
    entradilla:
      'Bajó el telón, se encendieron las luces de sala y el aplauso se cortó en seco.',
    habitaciones: ['musica', 'vestibulo', 'pasillo', 'desvan', 'salon', 'sotano', 'bano'],
  },
  {
    id: 'finca',
    nombre: 'La finca Los Cerezos',
    entradilla:
      'En Los Cerezos nunca pasaba nada. Hasta la noche en que el invernadero amaneció con las luces dadas.',
    habitaciones: ['invernadero', 'cocina', 'comedor', 'sotano', 'garaje', 'pasillo', 'salon'],
  },
  {
    id: 'club',
    nombre: 'El club Meridiano',
    entradilla:
      'En el club Meridiano se juega fuerte, se bebe más fuerte y no se hacen preguntas. Esa noche hubo que hacerlas.',
    habitaciones: ['billar', 'salon', 'biblioteca', 'vestibulo', 'bano', 'musica', 'pasillo'],
  },
  {
    id: 'casona',
    nombre: 'La casona del faro',
    entradilla:
      'El temporal dejó incomunicada la casona del faro. Nadie pudo entrar. Nadie pudo salir.',
    habitaciones: ['sotano', 'desvan', 'cocina', 'dormitorio', 'estudio', 'pasillo', 'garaje'],
  },
];
