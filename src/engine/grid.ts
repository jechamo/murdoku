/** Geometría de la rejilla y emparejamiento fila-columna. */

import { aCelda, columna, fila, type Celda } from './types';

/** Vecinos ortogonales (arriba, abajo, izquierda, derecha). Nunca en diagonal. */
export function vecinos(celda: Celda, n: number): Celda[] {
  const f = fila(celda, n);
  const c = columna(celda, n);
  const out: Celda[] = [];
  if (f > 0) out.push(aCelda(f - 1, c, n));
  if (f < n - 1) out.push(aCelda(f + 1, c, n));
  if (c > 0) out.push(aCelda(f, c - 1, n));
  if (c < n - 1) out.push(aCelda(f, c + 1, n));
  return out;
}

export function sonAdyacentes(a: Celda, b: Celda, n: number): boolean {
  const df = Math.abs(fila(a, n) - fila(b, n));
  const dc = Math.abs(columna(a, n) - columna(b, n));
  return df + dc === 1;
}

export function distancia(a: Celda, b: Celda, n: number): number {
  return Math.abs(fila(a, n) - fila(b, n)) + Math.abs(columna(a, n) - columna(b, n));
}

export function esPerimetro(celda: Celda, n: number): boolean {
  const f = fila(celda, n);
  const c = columna(celda, n);
  return f === 0 || c === 0 || f === n - 1 || c === n - 1;
}

export function esEsquina(celda: Celda, n: number): boolean {
  const f = fila(celda, n);
  const c = columna(celda, n);
  return (f === 0 || f === n - 1) && (c === 0 || c === n - 1);
}

export function todasLasCeldas(n: number): Celda[] {
  return Array.from({ length: n * n }, (_, i) => i);
}

/** ¿Es contigua la región formada por estas casillas? */
export function esContigua(celdas: readonly Celda[], n: number): boolean {
  if (celdas.length === 0) return true;
  const conjunto = new Set(celdas);
  const pila: Celda[] = [celdas[0]!];
  const vistas = new Set<Celda>([celdas[0]!]);
  while (pila.length > 0) {
    const actual = pila.pop()!;
    for (const v of vecinos(actual, n)) {
      if (conjunto.has(v) && !vistas.has(v)) {
        vistas.add(v);
        pila.push(v);
      }
    }
  }
  return vistas.size === celdas.length;
}

/**
 * ¿Existe una colocación válida de n ocupantes, uno por fila y uno por columna, usando
 * solo casillas libres? Es un emparejamiento perfecto filas-columnas; lo resolvemos con
 * caminos aumentantes, que a este tamaño es instantáneo.
 *
 * Devuelve la columna asignada a cada fila, o null si no hay emparejamiento perfecto.
 */
export function emparejamientoPerfecto(
  libre: readonly boolean[],
  n: number,
  filasPermitidas?: readonly number[],
  columnasPermitidas?: readonly number[],
): number[] | null {
  const filas = filasPermitidas ?? Array.from({ length: n }, (_, i) => i);
  const cols = columnasPermitidas ?? Array.from({ length: n }, (_, i) => i);
  if (filas.length !== cols.length) return null;

  const colDeFila = new Map<number, number>();
  const filaDeCol = new Map<number, number>();

  const aumentar = (f: number, visitadas: Set<number>): boolean => {
    for (const c of cols) {
      if (visitadas.has(c) || !libre[aCelda(f, c, n)]) continue;
      visitadas.add(c);
      const ocupante = filaDeCol.get(c);
      if (ocupante === undefined || aumentar(ocupante, visitadas)) {
        filaDeCol.set(c, f);
        colDeFila.set(f, c);
        return true;
      }
    }
    return false;
  };

  for (const f of filas) {
    if (!aumentar(f, new Set())) return null;
  }
  return filas.map((f) => colDeFila.get(f)!);
}
