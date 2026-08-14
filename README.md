# Murdoku

Generador web de **Murdokus**: el pasatiempo de Manuel Garand que cruza el sudoku con el
Cluedo. Un plano repartido en habitaciones amuebladas, un cadáver, unos cuantos sospechosos y
una lista de declaraciones. Hay que colocar a cada uno en su casilla y señalar al culpable

Casos infinitos de 6×6 a 8×8, en tres dificultades, generados en el navegador.

## Las reglas

- Cada ocupante del plano —la víctima incluida— está en una casilla, y **nadie repite fila ni
  columna**. Es la regla del sudoku.
- Las casillas llenas de muebles grandes (una cama, una bañera, la chimenea) no admiten a
  nadie. Las cosas del suelo, como una alfombra o una baldosa suelta, sí se pisan.
- La casilla del cadáver se conoce desde el principio.
- Resuelto el plano, **el asesino es el único sospechoso que se quedó a solas con la víctima en
  su misma habitación**.

## Lo que este generador garantiza

Son las dos propiedades que justifican todo el motor, y se comprueban por **caminos
independientes** en cada caso generado:

- **Solución única.** Se cuentan las soluciones por búsqueda exhaustiva sobre los dominios
  crudos, sin apoyarse en la propagación. Con n ≤ 8 el espacio son como mucho 8! = 40 320
  permutaciones, así que la unicidad se decide de forma exacta, no por heurística.
- **Sin azar.** Un motor de propagación por niveles tiene que cerrar la rejilla sin una sola
  conjetura. Si hiciera falta probar suerte en algún punto, el caso se descarta y se genera
  otro. Nunca hay que adivinar.

Además, el conjunto de pistas es **irredundante**: quitar cualquiera de las que aparecen rompe
la resolubilidad. No sobra ninguna.

La dificultad es la técnica más avanzada que hace falta:

| | Técnicas necesarias |
|---|---|
| **Fácil** | filtrado por pistas directas + unicidad de fila y columna (singles desnudos y ocultos) |
| **Medio** | lo anterior + cruzar pistas entre sospechosos (consistencia de arcos) |
| **Difícil** | lo anterior + conjuntos de Hall en filas y columnas, y recuentos por habitación |

## Cómo se juega

1. Elige un sospechoso en su ficha.
2. Marca en el plano **todas** las casillas donde podría estar. Puedes dejar marcadas las que
   quieras a la vez.
3. Clic derecho (o el modo *Descartar*) para tachar una casilla con una ✗.
4. Cuando lo tengas claro, pulsa el ✓ de la marca: el sospechoso queda fijado y **su fila y su
   columna se tachan enteras**.
5. Con todos colocados, acusa.

Hay *Deshacer* ilimitado, *Comprobar* para saber si alguna colocación no encaja, y *Dame una
pista*, que da el siguiente paso deducible citando exactamente de qué declaraciones sale.

## Desarrollo

```bash
npm install
npm run dev      # servidor de desarrollo
npm test         # 29 tests sobre 180 casos generados
npm run build    # compila a dist/
npm run caso     # vuelca un caso por consola, en ASCII
```

`npm run caso` acepta parámetros, y tiene un modo lote para medir el generador:

```bash
npm run caso -- --n 8 --dificultad dificil --semilla A3F91C
npm run caso -- --lote 20
```

### Semillas

Un caso es su semilla más el tamaño y la dificultad, y va en la URL
(`#/caso/8x8-dificil-A3F91C`). La misma semilla da siempre el mismo caso, así que un enlace
lleva a quien lo abra exactamente al mismo Murdoku.

### Estructura

```
src/engine/   el motor, sin una línea de React: se ejecuta y se prueba headless
  rng.ts        PRNG determinista a partir de la semilla
  layout.ts     reparto en habitaciones contiguas y amueblado
  solution.ts   permutación válida, víctima y culpable
  clues.ts      catálogo de pistas: evaluación, redacción y banco
  solver.ts     conteo exhaustivo + propagación por niveles
  generate.ts   orquestador y minimización del conjunto de pistas
  explain.ts    ayuda paso a paso, sobre el mismo motor
src/data/     elenco, mobiliario, habitaciones y escenarios
src/ui/       componentes
src/state/    estado de la partida
```

## Despliegue

Cada push a `main` compila, pasa los tests y publica en GitHub Pages:
**https://jechamo.github.io/murdoku/**

Hay un paso único que hay que dar a mano la primera vez, en
**Settings → Pages → Build and deployment → Source**, eligiendo **GitHub Actions**. Sin eso el
workflow falla en `configure-pages` con `Get Pages site failed: Not Found`. No se puede
automatizar: crear el sitio por API exige derechos de administración del repositorio, y el
`GITHUB_TOKEN` de Actions no los tiene. Hecho eso, basta con relanzar el workflow desde la
pestaña Actions.

## Imágenes

El juego funciona sin ninguna imagen: mientras no exista el PNG se dibuja un marcador
generado. **Para poner arte de verdad basta con dejar el fichero con el nombre correcto en
`public/img/personajes/` o `public/img/muebles/`**, sin tocar código. La lista completa de
nombres y los formatos recomendados están en [IMAGENES.md](IMAGENES.md).

## Créditos

Murdoku es un pasatiempo creado por **Manuel Garand**. Esto es una implementación libre que
genera casos nuevos, sin relación con el libro original ni con su autor.
