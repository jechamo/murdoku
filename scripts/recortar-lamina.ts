/**
 * Parte una lámina generada con IA en los PNG sueltos que consume la aplicación.
 *
 *   npm run recortar -- personajes laminas/personajes-1.png comisario doctora botones viuda
 *   npm run recortar -- muebles laminas/mobiliario-a.png nevera fogones ... alfombra_piel
 *
 * La rejilla se deduce del tamaño real del fichero y de cuántos ids se pasen, no de un tamaño
 * supuesto: las láminas vinieron a 1254×1254, no a los 1024 que se pidieron.
 *
 * Los ids van en orden de lectura (izquierda a derecha, arriba a abajo). Conviene mirar la
 * lámina antes de fiarse de que el generador respetó el orden.
 *
 * Los dos tipos de lámina se tratan distinto y por buenas razones:
 *
 *  - **personajes**: lámina opaca, rejilla 2×2, la celda ya sale cuadrada. Recorte directo.
 *  - **muebles**: lámina con canal alfa. Se recorta **por la silueta**, no por la línea de la
 *    rejilla. Es lo único que funciona: los objetos están dibujados más grandes que su celda
 *    nominal, así que partir por la rejilla mete medio mueble del vecino en la casilla de al
 *    lado. Ver `recortarMuebles` para el detalle.
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

/** Alfa por encima del cual un píxel cuenta como parte de un objeto. */
const UMBRAL_ALFA = 24;

/**
 * Área mínima de una componente para tomarla en serio. Medido sobre las cinco láminas: las
 * gotas de la mancha de grasa y las salpicaduras del charco son componentes de 11 a 18 px y
 * son parte del objeto; lo único por debajo de 8 px es un píxel suelto de ruido junto a la
 * mesilla de noche.
 */
const AREA_MINIMA = 8;

/** Margen alrededor del objeto dentro de su cuadrado de salida. */
const MARGEN = 0.05;

type Caja = { x0: number; y0: number; x1: number; y1: number };
type Componente = Caja & { area: number; cx: number; cy: number; etiqueta: number };

/**
 * Componentes conexas (8 vecinos) de la máscara de opacidad.
 *
 * Con pila explícita a propósito: una lámina son 1,5 millones de píxeles y una versión
 * recursiva revienta la pila de llamadas.
 */
function componentes(
  alfa: Uint8Array,
  ancho: number,
  alto: number,
): { comps: Componente[]; etiquetas: Int32Array } {
  const total = ancho * alto;
  const etiquetas = new Int32Array(total).fill(-1);
  const pila = new Int32Array(total);
  const comps: Componente[] = [];

  for (let semilla = 0; semilla < total; semilla++) {
    if (!alfa[semilla] || etiquetas[semilla]! >= 0) continue;
    const etiqueta = comps.length;
    let tope = 0;
    pila[tope++] = semilla;
    etiquetas[semilla] = etiqueta;

    let area = 0;
    let x0 = ancho;
    let y0 = alto;
    let x1 = -1;
    let y1 = -1;
    let sumaX = 0;
    let sumaY = 0;

    while (tope > 0) {
      const p = pila[--tope]!;
      const x = p % ancho;
      const y = (p / ancho) | 0;
      area++;
      sumaX += x;
      sumaY += y;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;

      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= ancho || ny >= alto) continue;
          const q = ny * ancho + nx;
          if (alfa[q] && etiquetas[q]! < 0) {
            etiquetas[q] = etiqueta;
            pila[tope++] = q;
          }
        }
      }
    }

    comps.push({ area, x0, y0, x1, y1, cx: sumaX / area, cy: sumaY / area, etiqueta });
  }

  return { comps, etiquetas };
}

/**
 * Recorta cada mueble por su silueta.
 *
 * Dos decisiones que no son evidentes:
 *
 * **Las componentes se reparten por su centroide**, no por contención en la celda. Un objeto
 * puede desbordar su celda —lo hacen casi todos— y hay objetos de varias piezas: el gato
 * hidráulico son 12 componentes, el tocador arrastra su banqueta. Repartiendo por centroide
 * quedan enteros sin depender de que quepan.
 *
 * **Se aplica una máscara, no solo un recorte rectangular.** Cinco pares de objetos tienen los
 * recuadros solapados (el banco de trabajo pisa 122×35 px del de la estatua), así que un
 * recorte rectangular volvería a colar al vecino. Al multiplicar el alfa por la máscara de las
 * componentes propias, lo ajeno desaparece aunque caiga dentro del rectángulo.
 */
async function recortarMuebles(lamina: string, ids: string[], destino: string): Promise<void> {
  const { columnas, filas, lado } = FORMATO.muebles;

  const meta = await sharp(lamina).metadata();
  if (!meta.hasAlpha) {
    throw new Error(
      `${lamina}: la lámina no trae canal alfa. El recorte por silueta lo necesita; ` +
        `hay que volver a generarla con fondo transparente.`,
    );
  }

  const { data, info } = await sharp(lamina).ensureAlpha().raw().toBuffer({
    resolveWithObject: true,
  });
  const ancho = info.width;
  const alto = info.height;
  const canales = info.channels;

  const opaco = new Uint8Array(ancho * alto);
  for (let i = 0; i < ancho * alto; i++) {
    if (data[i * canales + 3]! > UMBRAL_ALFA) opaco[i] = 1;
  }

  const { comps, etiquetas } = componentes(opaco, ancho, alto);
  const anchoCelda = ancho / columnas;
  const altoCelda = alto / filas;

  const porCasilla: Componente[][] = Array.from({ length: columnas * filas }, () => []);
  for (const c of comps) {
    if (c.area < AREA_MINIMA) continue;
    const col = Math.min(columnas - 1, Math.floor(c.cx / anchoCelda));
    const fil = Math.min(filas - 1, Math.floor(c.cy / altoCelda));
    porCasilla[fil * columnas + col]!.push(c);
  }

  const vacias = porCasilla
    .map((cs, i) => (cs.length === 0 ? ids[i] : null))
    .filter((x): x is string => x !== null);
  if (vacias.length > 0) {
    throw new Error(
      `${lamina}: sin ningún objeto en la casilla de ${vacias.join(', ')}. ` +
        `La rejilla ${columnas}×${filas} no encaja con esta lámina.`,
    );
  }

  console.log(`\n${lamina} — ${ancho}×${alto}, ${comps.length} componentes`);

  for (let i = 0; i < ids.length; i++) {
    const id = ids[i]!;
    const suyas = porCasilla[i]!;
    const caja: Caja = {
      x0: Math.min(...suyas.map((c) => c.x0)),
      y0: Math.min(...suyas.map((c) => c.y0)),
      x1: Math.max(...suyas.map((c) => c.x1)),
      y1: Math.max(...suyas.map((c) => c.y1)),
    };
    const w = caja.x1 - caja.x0 + 1;
    const h = caja.y1 - caja.y0 + 1;

    // Se copia el recorte poniendo a cero el alfa de todo lo que no sea de este objeto.
    const mias = new Set(suyas.map((c) => c.etiqueta));
    const recorte = Buffer.alloc(w * h * 4);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const origen = ((caja.y0 + y) * ancho + caja.x0 + x) * canales;
        const dest = (y * w + x) * 4;
        const propio = mias.has(etiquetas[(caja.y0 + y) * ancho + caja.x0 + x]!);
        recorte[dest] = data[origen]!;
        recorte[dest + 1] = data[origen + 1]!;
        recorte[dest + 2] = data[origen + 2]!;
        recorte[dest + 3] = propio ? data[origen + 3]! : 0;
      }
    }

    // Encaje proporcional: el que no quepa se hace más pequeño, pero entero y sin deformar.
    const util = Math.round(lado * (1 - 2 * MARGEN));
    const encajado = await sharp(recorte, { raw: { width: w, height: h, channels: 4 } })
      .resize(util, util, { fit: 'inside' })
      .png()
      .toBuffer();
    const dim = await sharp(encajado).metadata();

    await sharp({
      create: {
        width: lado,
        height: lado,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .composite([
        {
          input: encajado,
          left: Math.round((lado - dim.width!) / 2),
          top: Math.round((lado - dim.height!) / 2),
        },
      ])
      .png()
      .toFile(path.join(destino, `${id}.png`));

    console.log(
      `  ${id.padEnd(16)} ${String(suyas.length).padStart(2)} pieza(s)  ` +
        `silueta ${w}×${h} → ${dim.width}×${dim.height} centrado en ${lado}×${lado}`,
    );
  }
}

/** Retratos: la lámina es opaca y la celda ya es cuadrada, así que basta con partirla. */
async function recortarPersonajes(
  lamina: string,
  ids: string[],
  destino: string,
): Promise<void> {
  const { columnas, filas, lado } = FORMATO.personajes;
  const meta = await sharp(lamina).metadata();
  const ancho = meta.width!;
  const alto = meta.height!;

  /**
   * Bordes de celda por redondeo acumulado, no por división entera: 1254/5 da 250,8, y
   * truncar a 250 acumula 4 px de deriva que hacen que la última columna muerda a su vecina.
   */
  const borde = (i: number, total: number, tam: number) => Math.round((i * tam) / total);
  const margen = 3; // recorta la costura entre celdas, que si no deja una raya clara al borde

  console.log(`\n${lamina} — ${ancho}×${alto}, rejilla ${columnas}×${filas}`);

  for (let i = 0; i < ids.length; i++) {
    const id = ids[i]!;
    const col = i % columnas;
    const fil = Math.floor(i / columnas);
    const cx = borde(col, columnas, ancho) + margen;
    const cy = borde(fil, filas, alto) + margen;
    const w = borde(col + 1, columnas, ancho) - margen - cx;
    const h = borde(fil + 1, filas, alto) - margen - cy;

    await sharp(lamina)
      .extract({ left: cx, top: cy, width: w, height: h })
      .resize(lado, lado, { fit: 'cover' })
      .png()
      .toFile(path.join(destino, `${id}.png`));
    console.log(`  ${id.padEnd(16)} ${w}×${h} → ${lado}×${lado}`);
  }
}

async function recortar(carpeta: Carpeta, lamina: string, ids: string[]): Promise<void> {
  const { columnas, filas } = FORMATO[carpeta];
  if (ids.length !== columnas * filas) {
    throw new Error(
      `${lamina}: la rejilla es ${columnas}×${filas} = ${columnas * filas} celdas, ` +
        `pero se han pasado ${ids.length} ids`,
    );
  }

  const destino = path.join('public', 'img', carpeta);
  await mkdir(destino, { recursive: true });

  if (carpeta === 'muebles') await recortarMuebles(lamina, ids, destino);
  else await recortarPersonajes(lamina, ids, destino);
}

const [carpeta, lamina, ...ids] = process.argv.slice(2);
if (carpeta !== 'personajes' && carpeta !== 'muebles') {
  console.error('Uso: npm run recortar -- <personajes|muebles> <lamina.png> <id> <id> ...');
  process.exit(1);
}
await recortar(carpeta, lamina!, ids);
