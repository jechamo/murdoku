/**
 * El sistema de ayuda tiene que ser capaz de resolver el caso él solo, paso a paso y sin
 * conjeturar. Si en algún momento se queda sin siguiente deducción antes de acabar, es que
 * la cadena de razonamiento tiene un agujero.
 */

import { describe, expect, it } from 'vitest';

import { actoresAColocar, generarCaso, posicionesCompletas } from './generate';
import { colocacionesErroneas, detallarPaso, estaResuelto, siguientePaso } from './explain';
import { DIFICULTADES, type Asignacion } from './types';

const CASOS = [4, 5, 6, 7, 8].flatMap((n) =>
  DIFICULTADES.flatMap((dificultad) =>
    ['E1', 'E2', 'E3', 'E4'].map((semilla) => ({
      caso: generarCaso({ semilla, n, dificultad }),
      etiqueta: `${n}×${n} ${dificultad} ${semilla}`,
    })),
  ),
);

describe('la ayuda paso a paso', () => {
  it('el lote cubre las dos variantes: con el cadáver a la vista y sin él', () => {
    const variantes = new Set(CASOS.map(({ caso }) => caso.victimaRevelada));
    expect(variantes, 'faltan casos de alguna variante').toEqual(new Set([true, false]));
  });

  it('resuelve cualquier caso siguiendo solo sus propias indicaciones', () => {
    for (const { caso, etiqueta } of CASOS) {
      const colocados: Asignacion = {};
      let pasos = 0;

      while (!estaResuelto(caso, colocados)) {
        const paso = siguientePaso(caso, colocados);
        expect(paso, `${etiqueta}: se quedó sin deducciones tras ${pasos} pasos`).not.toBeNull();
        colocados[paso!.actor] = paso!.celda;
        pasos++;
        expect(pasos, `${etiqueta}: bucle`).toBeLessThanOrEqual(caso.n + 1);
      }

      expect(pasos, etiqueta).toBe(actoresAColocar(caso).length);
      expect(colocados, etiqueta).toEqual(posicionesCompletas(caso));
    }
  });

  it('cada deducción cita al menos una pista y la cita bien', () => {
    for (const { caso, etiqueta } of CASOS) {
      const paso = siguientePaso(caso, {});
      expect(paso, etiqueta).not.toBeNull();
      // El primer paso de un caso siempre nace de alguna pista concreta.
      expect(paso!.pistasClave.length, etiqueta).toBeGreaterThan(0);
      for (const i of paso!.pistasClave) {
        expect(i, etiqueta).toBeGreaterThanOrEqual(0);
        expect(i, etiqueta).toBeLessThan(caso.pistas.length);
      }
      expect(detallarPaso(caso, paso!), etiqueta).toHaveLength(paso!.pistasClave.length);
      expect(paso!.texto, etiqueta).toContain('pista');
    }
  });

  it('señala las colocaciones equivocadas y calla mientras las haya', () => {
    const { caso } = CASOS[0]!;
    const [primero, segundo] = caso.reparto.sospechosos as [string, string];

    // Al primer sospechoso se le pone la casilla del segundo: es un error, y de los dos.
    const mal: Asignacion = { [primero]: posicionesCompletas(caso)[segundo]! };
    expect(colocacionesErroneas(caso, mal)).toEqual([primero]);
    expect(siguientePaso(caso, mal)).toBeNull();

    const bien: Asignacion = { [primero]: posicionesCompletas(caso)[primero]! };
    expect(colocacionesErroneas(caso, bien)).toEqual([]);
  });
});
