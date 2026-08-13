import type { Plano } from '../engine/types';

/**
 * Color de cada habitación **dentro de un caso concreto**.
 *
 * No se asigna un color fijo a cada estancia: con colores fijos, un plano que junte Salón y
 * Cocina (dos naranjas) sale ilegible, y la identidad de una habitación ya la dan su nombre y
 * sus muebles. Lo único que el color tiene que hacer es **separar regiones vecinas**, así que
 * se reparte por orden desde una paleta de tonos bien alejados entre sí.
 */
const PALETA = [
  '#2aa198', // verdeazulado
  '#d99a2b', // ámbar
  '#8b5cf6', // violeta
  '#e0524a', // rojo
  '#6aa84f', // verde
  '#4a90d9', // azul
  '#c2559b', // magenta
];

export function colorDeHabitacion(plano: Plano, idHabitacion: string): string {
  const i = plano.habitaciones.indexOf(idHabitacion);
  return PALETA[(i < 0 ? 0 : i) % PALETA.length]!;
}
