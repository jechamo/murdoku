# Imágenes del juego

Los 12 retratos y los 75 muebles ya están puestos, recortados de las láminas que hay en
`laminas/`. Este documento explica cómo reponer o sustituir cualquiera de ellos.

**Para cambiar una imagen basta con dejar el fichero con el nombre exacto en su carpeta.** No
hay que tocar código ni registrar nada: `src/ui/Sprite.tsx` intenta cargar el PNG y solo cae a
un marcador generado si no lo encuentra.

```
public/img/personajes/{id}.png
public/img/muebles/{id}.png
```

## Los dos formatos son distintos

Retratos y mobiliario **no** se usan igual, así que no comparten formato:

| | Personajes | Mobiliario |
|---|---|---|
| Tamaño | 512 × 512 px | 256 × 256 px |
| Fondo | opaco, oscuro | **transparente** |
| Encaje | `object-fit: cover`, en una ficha con esquinas redondeadas | `object-fit: contain`, **silueta centrada** con un 5% de margen |

Lo importante del mobiliario: **son siluetas recortadas, no baldosas**. El objeto se recorta por
su contorno y se centra en un cuadrado transparente, así que el suelo de la habitación asoma a
su alrededor y no hace falta echar color por encima del mueble.

La primera versión sí fueron baldosas opacas, porque las láminas llegaron sin canal alfa y los
objetos oscuros no se separaban del fondo oscuro ni con umbral. Al rehacerlas con fondo
transparente eso dejó de ser un problema, y con ello se arregló el fallo de verdad: partiendo
por la línea de la rejilla, **la celda de un mueble se comía el borde del de al lado**, porque
los objetos están dibujados más grandes que su celda nominal. Cinco pares llegan a solaparse
—el banco de trabajo pisa 122 × 35 px del recuadro de la estatua—, así que ni recortando por el
contorno del objeto basta con el rectángulo: hay que enmascarar. Ver `scripts/recortar-lamina.ts`.

Los muebles en los que cabe una persona (la cama, el sofá, la butaca, la bañera, y todo lo del
suelo) se dibujan algo más tenues, porque encima de ellos van a caer retratos y marcas.

Los retratos se muestran desde 24 px (marca de candidato en una casilla) hasta 80 px
(veredicto), así que la cara tiene que reconocerse en miniatura: mejor primer plano marcado y
mucho contraste que plano medio con detalle fino.

## Rehacer un recorte

Las láminas originales están en `laminas/`. El recortador deduce la rejilla del tamaño real del
fichero, así que sirve aunque una lámina venga a otra resolución:

```bash
npm run recortar -- personajes laminas/personajes-1.png comisario doctora botones viuda
npm run recortar -- muebles laminas/mobiliario-b.png escritorio caja_fuerte ... baldosa_suelta
```

Los ids van en orden de lectura. Conviene mirar la lámina antes de fiarse de que el generador
respetó el orden pedido.

**Una lámina de mobiliario nueva tiene que venir con fondo transparente**: el recortador aborta
si no encuentra canal alfa, y también si alguna de las 15 casillas se queda sin ningún objeto,
que es la señal de que la rejilla no encaja con esa lámina.

`laminas/descartadas/` guarda la primera versión de la lámina A, que salió apaisada (1536×1024)
en vez de cuadrada, y `laminas/descartadas/opacas/` las cinco de mobiliario sin canal alfa, que
son las que obligaban a recortar por rejilla.

## Personajes

Recortados de `laminas/personajes-{1,2,3}.png`, rejilla 2x2.

| Fichero | Personaje | Lamina |
|---|---|---|
| `comisario.png` | el comisario Ordóñez | 1 |
| `doctora.png` | la doctora Iriarte | 1 |
| `chef.png` | el chef Barzán | 1 |
| `viuda.png` | la viuda Mendaro | 1 |
| `botones.png` | el botones Nico | 2 |
| `pianista.png` | la pianista Solveig | 2 |
| `jardinero.png` | el jardinero Cosme | 2 |
| `heredero.png` | el heredero Fabián | 2 |
| `institutriz.png` | la institutriz Prudencia | 3 |
| `taxidermista.png` | el taxidermista Ruano | 3 |
| `soprano.png` | la soprano Delmira | 3 |
| `relojero.png` | el relojero Ibarra | 3 |

## Mobiliario

Recortado de `laminas/mobiliario-{a,b,c,d,e}.png`, rejilla 5x3: cada fila es una habitacion.

| Fichero | Mueble | ¿Cabe una persona? |
|---|---|---|
| `nevera.png` | la nevera | no, llena la casilla |
| `fogones.png` | los fogones | no, llena la casilla |
| `fregadero.png` | el fregadero | no, llena la casilla |
| `alacena.png` | la alacena | no, llena la casilla |
| `mancha_grasa.png` | la mancha de grasa | sí, se pisa |
| `sofa.png` | el sofá | sí, uno se sienta o se tumba |
| `televisor.png` | el televisor | no, llena la casilla |
| `chimenea.png` | la chimenea | no, llena la casilla |
| `butaca.png` | la butaca | sí, uno se sienta o se tumba |
| `alfombra_persa.png` | la alfombra persa | sí, se pisa |
| `cama.png` | la cama | sí, uno se sienta o se tumba |
| `armario.png` | el armario | no, llena la casilla |
| `tocador.png` | el tocador | no, llena la casilla |
| `mesilla.png` | la mesilla de noche | no, llena la casilla |
| `alfombra_piel.png` | la alfombra de piel | sí, se pisa |
| `escritorio.png` | el escritorio | no, llena la casilla |
| `caja_fuerte.png` | la caja fuerte | no, llena la casilla |
| `globo.png` | el globo terráqueo | no, llena la casilla |
| `archivador.png` | el archivador | no, llena la casilla |
| `alfombra_lectura.png` | la alfombra de lectura | sí, se pisa |
| `estanteria.png` | la estantería | no, llena la casilla |
| `atril.png` | el atril | no, llena la casilla |
| `escalera_mano.png` | la escalera de mano | no, llena la casilla |
| `vitrina.png` | la vitrina | no, llena la casilla |
| `alfombra_raida.png` | la alfombra raída | sí, se pisa |
| `banera.png` | la bañera | sí, uno se sienta o se tumba |
| `lavabo.png` | el lavabo | no, llena la casilla |
| `espejo.png` | el espejo | no, llena la casilla |
| `cesto_ropa.png` | el cesto de la ropa | no, llena la casilla |
| `baldosa_suelta.png` | la baldosa suelta | sí, se pisa |
| `mesa_larga.png` | la mesa larga | no, llena la casilla |
| `aparador.png` | el aparador | no, llena la casilla |
| `candelabro.png` | el candelabro | no, llena la casilla |
| `trinchero.png` | el trinchero | no, llena la casilla |
| `alfombra_bordada.png` | la alfombra bordada | sí, se pisa |
| `palmera.png` | la palmera | no, llena la casilla |
| `banco_piedra.png` | el banco de piedra | sí, uno se sienta o se tumba |
| `fuente.png` | la fuente | no, llena la casilla |
| `macetero.png` | el macetero | no, llena la casilla |
| `charco.png` | el charco de agua | sí, se pisa |
| `caldera.png` | la caldera | no, llena la casilla |
| `barriles.png` | los barriles | no, llena la casilla |
| `herramientas.png` | las herramientas | no, llena la casilla |
| `arcon.png` | el arcón | no, llena la casilla |
| `trampilla.png` | la trampilla | sí, se pisa |
| `perchero.png` | el perchero | no, llena la casilla |
| `reloj_pie.png` | el reloj de pie | no, llena la casilla |
| `cuadro.png` | el cuadro torcido | no, llena la casilla |
| `consola.png` | la consola de entrada | no, llena la casilla |
| `felpudo.png` | el felpudo | sí, se pisa |
| `piano.png` | el piano | no, llena la casilla |
| `arpa.png` | el arpa | no, llena la casilla |
| `gramola.png` | la gramola | no, llena la casilla |
| `atril_musica.png` | el atril de partituras | no, llena la casilla |
| `tarima.png` | la tarima | sí, se pisa |
| `mesa_billar.png` | la mesa de billar | no, llena la casilla |
| `taquera.png` | la taquera | no, llena la casilla |
| `mueble_bar.png` | el mueble bar | no, llena la casilla |
| `diana.png` | la diana | no, llena la casilla |
| `alfombra_verde.png` | la alfombra verde | sí, se pisa |
| `baules.png` | los baúles | sí, se pisa |
| `maniqui.png` | el maniquí | no, llena la casilla |
| `espejo_roto.png` | el espejo roto | no, llena la casilla |
| `jaula.png` | la jaula vacía | no, llena la casilla |
| `tablon_suelto.png` | el tablón suelto | sí, se pisa |
| `coche.png` | el coche | sí, uno se sienta o se tumba |
| `banco_trabajo.png` | el banco de trabajo | no, llena la casilla |
| `neumaticos.png` | los neumáticos | no, llena la casilla |
| `gato_hidraulico.png` | el gato hidráulico | no, llena la casilla |
| `mancha_aceite.png` | la mancha de aceite | sí, se pisa |
| `escalinata.png` | la escalinata | sí, uno se sienta o se tumba |
| `estatua.png` | la estatua | no, llena la casilla |
| `paraguero.png` | el paragüero | no, llena la casilla |
| `recibidor.png` | el mueble recibidor | no, llena la casilla |
| `felpudo_largo.png` | el felpudo largo | sí, se pisa |
