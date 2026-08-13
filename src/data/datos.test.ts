/**
 * Comprobaciones de coherencia de los datos. Son baratas y evitan que una errata en un id
 * (que TypeScript no puede pillar, porque son cadenas) llegue a explotar en pleno juego.
 */

import { describe, expect, it } from 'vitest';

import { ELENCO } from './cast';
import { MOBILIARIO, MUEBLES_POR_ID } from './furniture';
import { ESCENARIOS, HABITACIONES, HABITACIONES_POR_ID } from './rooms';
import { N_MAX } from '../engine/types';

describe('coherencia de los datos', () => {
  it('los ids de personaje y de mueble no se repiten', () => {
    expect(new Set(ELENCO.map((p) => p.id)).size).toBe(ELENCO.length);
    expect(new Set(MOBILIARIO.map((m) => m.id)).size).toBe(MOBILIARIO.length);
    expect(new Set(HABITACIONES.map((h) => h.id)).size).toBe(HABITACIONES.length);
  });

  it('el elenco da para el tablero más grande', () => {
    // Un plano de N×N necesita N personajes: la víctima y N-1 sospechosos.
    expect(ELENCO.length).toBeGreaterThanOrEqual(N_MAX);
  });

  it('cada habitación referencia muebles que existen y no los comparte con otra', () => {
    const dueño = new Map<string, string>();
    for (const hab of HABITACIONES) {
      expect(hab.bloqueantes.length, `${hab.id} sin muebles`).toBeGreaterThan(0);
      for (const id of [...hab.bloqueantes, ...hab.suelo]) {
        expect(MUEBLES_POR_ID[id], `${hab.id} usa un mueble inexistente: ${id}`).toBeDefined();
        expect(dueño.get(id), `${id} lo usan ${dueño.get(id)} y ${hab.id}`).toBeUndefined();
        dueño.set(id, hab.id);
      }
      for (const id of hab.bloqueantes) expect(MUEBLES_POR_ID[id]!.bloquea, id).toBe(true);
      for (const id of hab.suelo) expect(MUEBLES_POR_ID[id]!.bloquea, id).toBe(false);
    }
  });

  it('cada escenario referencia habitaciones que existen y trae suficientes', () => {
    for (const e of ESCENARIOS) {
      // El plano más grande puede pedir hasta 7 habitaciones distintas.
      expect(e.habitaciones.length, e.id).toBeGreaterThanOrEqual(7);
      expect(new Set(e.habitaciones).size, `${e.id} repite habitación`).toBe(
        e.habitaciones.length,
      );
      for (const id of e.habitaciones) {
        expect(HABITACIONES_POR_ID[id], `${e.id} usa una habitación inexistente: ${id}`)
          .toBeDefined();
      }
    }
  });

  it('todo mueble del catálogo lo usa alguna habitación', () => {
    const usados = new Set(HABITACIONES.flatMap((h) => [...h.bloqueantes, ...h.suelo]));
    const huerfanos = MOBILIARIO.filter((m) => !usados.has(m.id)).map((m) => m.id);
    expect(huerfanos, 'muebles que nunca saldrán en un plano').toEqual([]);
  });
});
