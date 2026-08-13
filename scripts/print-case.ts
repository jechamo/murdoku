/**
 * Vuelca un caso por consola para inspeccionarlo sin abrir el navegador.
 *
 *   npm run caso -- --n 8 --dificultad dificil --semilla A3F91C
 *   npm run caso -- --lote 20
 */

import { personaje } from '../src/data/cast';
import { habitacion } from '../src/data/rooms';
import { mueble } from '../src/data/furniture';
import { generarCaso, ctxDe } from '../src/engine/generate';
import { redactar } from '../src/engine/clues';
import { nivelRequerido } from '../src/engine/solver';
import { columna, fila, nombreCelda, type Caso, type Dificultad } from '../src/engine/types';

function arg(nombre: string): string | undefined {
  const i = process.argv.indexOf(`--${nombre}`);
  return i === -1 ? undefined : process.argv[i + 1];
}

function pintar(caso: Caso): string {
  const { n, plano } = caso;
  const inversas = new Map<number, string>();
  for (const [id, celda] of Object.entries(caso.solucion.posiciones)) {
    inversas.set(celda, personaje(id).nombre.slice(0, 3).toUpperCase());
  }
  inversas.set(caso.victimaEn, '† ' + personaje(caso.reparto.victima).nombre.slice(0, 1));

  const letraHab = new Map(plano.habitaciones.map((h, i) => [h, String.fromCharCode(97 + i)]));

  const lineas: string[] = [];
  lineas.push(
    '     ' +
      Array.from({ length: n }, (_, c) => String.fromCharCode(65 + c).padStart(4).padEnd(8)).join(''),
  );

  for (let f = 0; f < n; f++) {
    let arriba = `${String(f + 1).padStart(2)} |`;
    let abajo = '   |';
    for (let c = 0; c < n; c++) {
      const celda = f * n + c;
      const hab = letraHab.get(plano.habitacionDe[celda]!)!;
      const m = plano.muebleDe[celda];
      const bloq = plano.bloqueada[celda] ? '#' : ' ';
      arriba += ` ${hab}${bloq}${(m ? mueble(m).nombre.slice(0, 4) : '').padEnd(5)}|`;
      abajo += ` ${(inversas.get(celda) ?? '·').padEnd(6)}|`;
    }
    lineas.push(arriba);
    lineas.push(abajo);
    lineas.push('   ' + '+-------'.repeat(n) + '+');
  }

  lineas.push('');
  lineas.push(
    'Habitaciones: ' +
      plano.habitaciones.map((h) => `${letraHab.get(h)}=${habitacion(h).nombre}`).join('  '),
  );
  return lineas.join('\n');
}

function informe(caso: Caso): void {
  const ctx = ctxDe(caso);
  const v = personaje(caso.reparto.victima);
  console.log('═'.repeat(78));
  console.log(
    `CASO ${caso.n}×${caso.n}-${caso.dificultad}-${caso.semilla}   ` +
      `nivel requerido: ${nivelRequerido(caso.pistas, ctx)}   pistas: ${caso.pistas.length}`,
  );
  console.log('═'.repeat(78));
  console.log(
    `Víctima: ${v.art} ${v.oficio} ${v.nombre}, en ${nombreCelda(caso.victimaEn, caso.n)} ` +
      `(${habitacion(caso.plano.habitacionDe[caso.victimaEn]!).nombre})`,
  );
  console.log(
    'Sospechosos: ' + caso.reparto.sospechosos.map((s) => personaje(s).nombre).join(', '),
  );
  console.log('');
  console.log(pintar(caso));
  console.log('');
  console.log('PISTAS');
  caso.pistas.forEach((p, i) => console.log(`  ${String(i + 1).padStart(2)}. ${redactar(p)}`));
  console.log('');
  console.log('SOLUCIÓN');
  for (const [id, celda] of Object.entries(caso.solucion.posiciones)) {
    console.log(
      `  ${personaje(id).nombre.padEnd(12)} ${nombreCelda(celda, caso.n)} ` +
        `(fila ${fila(celda, caso.n) + 1}, col ${columna(celda, caso.n) + 1}) — ` +
        habitacion(caso.plano.habitacionDe[celda]!).nombre,
    );
  }
  console.log(`  ASESINO: ${personaje(caso.solucion.asesino).nombre}`);
}

const lote = arg('lote');
if (lote) {
  // Modo lote: mide reparto de dificultad, número de pistas y tiempo.
  const cuantos = Number(lote);
  const filas: string[] = [];
  for (const n of [6, 7, 8]) {
    for (const d of ['facil', 'medio', 'dificil'] as Dificultad[]) {
      let pistas = 0;
      let ms = 0;
      const niveles: Record<number, number> = {};
      for (let i = 0; i < cuantos; i++) {
        const t0 = performance.now();
        const caso = generarCaso({ semilla: `L${i}`, n, dificultad: d });
        ms += performance.now() - t0;
        pistas += caso.pistas.length;
        const nivel = nivelRequerido(caso.pistas, ctxDe(caso))!;
        niveles[nivel] = (niveles[nivel] ?? 0) + 1;
      }
      filas.push(
        `${n}×${n} ${d.padEnd(8)} pistas≈${(pistas / cuantos).toFixed(1).padStart(5)}  ` +
          `${(ms / cuantos).toFixed(0).padStart(5)} ms  niveles ${JSON.stringify(niveles)}`,
      );
    }
  }
  console.log(filas.join('\n'));
} else {
  informe(
    generarCaso({
      semilla: arg('semilla'),
      n: arg('n') ? Number(arg('n')) : 7,
      dificultad: (arg('dificultad') as Dificultad) ?? 'medio',
    }),
  );
}
