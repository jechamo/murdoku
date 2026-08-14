/**
 * Parte una lámina generada con IA en los PNG sueltos que consume la aplicación.
 *
 *   npm run recortar -- personajes laminas/personajes-1.png comisario doctora botones viuda
 *   npm run recortar -- muebles laminas/mobiliario-a2.png nevera fogones ... alfombra_piel
 *
 * La rejilla se deduce del tamaño real del fichero y de cuántos ids se pasen, no de un tamaño
 * supuesto: las láminas vinieron a 1254×1254, no a los 1024 que se pidieron.
 *
 * Los ids van en orden de lectura (izquierda a derecha, arriba a abajo). Conviene mirar la
 * lámina antes de fiarse de que el generador respetó el orden.
 */

import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

type Carpeta = 'personajes' | 'muebles';

/** Rejilla de cada tipo de lámina y tamaño de salida. */
const FORMATO: Record<Carpeta, { columnas: number; filas: number; lado: number }> = {
  // 12 retratos en tres láminas de 2×2. La celda ya sale cuadrada.
  personajes: { columnas: 2, filas: 2, lado: 512 },
  // 15 objetos por lámina: cada fila es una habitación (4 muebles + 1 elemento de suelo).
  muebles: { columnas: 5, filas: 3, lado: 256 },
};

type Rgb = { r: number; g: number; b: number };

/**
 * Color de fondo de una celda: mediana del anillo de 3 px de su borde, que en estas láminas
 * siempre es fondo porque hay costura visible entre celdas.
 *
 * Nota de por qué NO se intenta detectar la silueta del objeto para recortarlo ajustado: se
 * midió y no es separable. En la celda del sofá, la distancia del objeto al fondo (mediana 41)
 * queda por debajo del propio ruido del fondo (percentil 99: 42); en la del armario pasa lo
 * mismo (43 frente a 383). Los objetos oscuros sobre fondo oscuro no admiten umbral. Por eso se
 * toma la celda entera y se rellena a cuadrado: es la opción que nunca invade la celda vecina
 * ni se come parte del mueble.
 */
function fondoDeCelda(
  datos: Buffer,
  anchoTotal: number,
  canales: number,
  x: number,
  y: number,
  w: number,
  h: number,
): Rgb {
  const rs: number[] = [];
  const gs: number[] = [];
  const bs: number[] = [];
  const tomar = (px: number, py: number) => {
    const i = (py * anchoTotal + px) * canales;
    rs.push(datos[i]!);
    gs.push(datos[i + 1]!);
    bs.push(datos[i + 2]!);
  };
  for (let d = 0; d < 3; d++) {
    for (let px = x; px < x + w; px++) {
      tomar(px, y + d);
      tomar(px, y + h - 1 - d);
    }
    for (let py = y; py < y + h; py++) {
      tomar(x + d, py);
      tomar(x + w - 1 - d, py);
    }
  }
  const mediana = (xs: number[]) => xs.sort((a, b) => a - b)[Math.floor(xs.length / 2)]!;
  return { r: mediana(rs), g: mediana(gs), b: mediana(bs) };
}

async function recortar(carpeta: Carpeta, lamina: string, ids: string[]): Promise<void> {
  const { columnas, filas, lado } = FORMATO[carpeta];
  if (ids.length !== columnas * filas) {
    throw new Error(
      `${lamina}: la rejilla es ${columnas}×${filas} = ${columnas * filas} celdas, ` +
        `pero se han pasado ${ids.length} ids`,
    );
  }

  const original = sharp(lamina);
  const meta = await original.metadata();
  const ancho = meta.width!;
  const alto = meta.height!;

  /**
   * Bordes de celda por redondeo acumulado, no por división entera: 1254/5 da 250,8, y
   * truncar a 250 acumula 4 px de deriva que hacen que la última columna muerda a su vecina.
   */
  const borde = (i: number, total: number, tam: number) => Math.round((i * tam) / total);
  const margen = 3; // recorta la costura entre celdas, que si no deja una raya clara al borde

  const { data, info } = await original.raw().toBuffer({ resolveWithObject: true });
  const canales = info.channels;

  const destino = path.join('public', 'img', carpeta);
  await mkdir(destino, { recursive: true });

  console.log(`\n${lamina} — ${ancho}×${alto}, rejilla ${columnas}×${filas}`);

  for (let i = 0; i < ids.length; i++) {
    const id = ids[i]!;
    const col = i % columnas;
    const fila = Math.floor(i / columnas);
    const cx = borde(col, columnas, ancho) + margen;
    const cy = borde(fila, filas, alto) + margen;
    const celdaW = borde(col + 1, columnas, ancho) - margen - cx;
    const celdaH = borde(fila + 1, filas, alto) - margen - cy;
    const salida = path.join(destino, `${id}.png`);

    if (carpeta === 'personajes') {
      // La celda ya es cuadrada: recorte directo.
      await sharp(lamina)
        .extract({ left: cx, top: cy, width: celdaW, height: celdaH })
        .resize(lado, lado, { fit: 'cover' })
        .png()
        .toFile(salida);
      console.log(`  ${id.padEnd(16)} ${celdaW}×${celdaH} → ${lado}×${lado}`);
      continue;
    }

    // Muebles: la celda es alta y estrecha (250×418) y la salida tiene que ser cuadrada. Se
    // toma la celda entera y se ensancha con el fondo muestreado hasta el cuadrado, así el
    // mueble se conserva completo —los altos, como el reloj de pie o la escalinata, no se
    // decapitan— y nunca se invade la celda de al lado.
    const fondo = fondoDeCelda(data, ancho, canales, cx, cy, celdaW, celdaH);
    const ladoCuadro = Math.max(celdaW, celdaH);
    const relleno = ladoCuadro - Math.min(celdaW, celdaH);

    await sharp(lamina)
      .extract({ left: cx, top: cy, width: celdaW, height: celdaH })
      .extend({
        left: Math.floor(relleno / 2),
        right: Math.ceil(relleno / 2),
        top: 0,
        bottom: 0,
        background: fondo,
      })
      .resize(lado, lado, { fit: 'fill' })
      .png()
      .toFile(salida);

    console.log(
      `  ${id.padEnd(16)} celda ${celdaW}×${celdaH} + ${relleno}px de fondo ` +
        `rgb(${fondo.r},${fondo.g},${fondo.b}) → ${lado}×${lado}`,
    );
  }
}

const [carpeta, lamina, ...ids] = process.argv.slice(2);
if (carpeta !== 'personajes' && carpeta !== 'muebles') {
  console.error('Uso: npm run recortar -- <personajes|muebles> <lamina.png> <id> <id> ...');
  process.exit(1);
}
await recortar(carpeta, lamina!, ids);
