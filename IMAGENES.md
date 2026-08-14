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
| Fondo | opaco, oscuro | **opaco, oscuro** |
| Encaje | `object-fit: cover`, en una ficha con esquinas redondeadas | `object-fit: cover`, **llenando la casilla entera** |

Lo importante del mobiliario: **no son iconos flotantes, son baldosas**. La ilustración con su
fondo oscuro ocupa toda la casilla y el tinte de la habitación va por encima. Se hizo así
porque las láminas salieron sin canal alfa, y recortar el fondo resultó inviable: se midió y
los objetos oscuros (el sofá, el armario, el piano, el coche) quedan más cerca del fondo que el
propio ruido del fondo, con lo que ningún umbral los separa. Al final juega a favor: una
casilla ocupada por un mueble se distingue de una libre de un vistazo, que es información de
juego.

Los muebles del suelo (alfombras, manchas, trampillas) se dibujan a opacidad baja, porque
encima de ellos sí van personajes y marcas.

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

`laminas/descartadas/` guarda la primera versión de la lámina A, que salió apaisada (1536×1024)
en vez de cuadrada; se sustituyó por `mobiliario-a2.png`.

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

Recortado de `laminas/mobiliario-{a2,b,c,d,e}.png`, rejilla 5x3: cada fila es una habitacion.

| Fichero | Mueble | Llena la casilla |
|---|---|---|
| `nevera.png` | la nevera | si |
| `fogones.png` | los fogones | si |
| `fregadero.png` | el fregadero | si |
| `alacena.png` | la alacena | si |
| `mancha_grasa.png` | la mancha de grasa | no, es del suelo |
| `sofa.png` | el sofá | si |
| `televisor.png` | el televisor | si |
| `chimenea.png` | la chimenea | si |
| `butaca.png` | la butaca | si |
| `alfombra_persa.png` | la alfombra persa | no, es del suelo |
| `cama.png` | la cama | si |
| `armario.png` | el armario | si |
| `tocador.png` | el tocador | si |
| `mesilla.png` | la mesilla de noche | si |
| `alfombra_piel.png` | la alfombra de piel | no, es del suelo |
| `escritorio.png` | el escritorio | si |
| `caja_fuerte.png` | la caja fuerte | si |
| `globo.png` | el globo terráqueo | si |
| `archivador.png` | el archivador | si |
| `alfombra_lectura.png` | la alfombra de lectura | no, es del suelo |
| `estanteria.png` | la estantería | si |
| `atril.png` | el atril | si |
| `escalera_mano.png` | la escalera de mano | si |
| `vitrina.png` | la vitrina | si |
| `alfombra_raida.png` | la alfombra raída | no, es del suelo |
| `banera.png` | la bañera | si |
| `lavabo.png` | el lavabo | si |
| `espejo.png` | el espejo | si |
| `cesto_ropa.png` | el cesto de la ropa | si |
| `baldosa_suelta.png` | la baldosa suelta | no, es del suelo |
| `mesa_larga.png` | la mesa larga | si |
| `aparador.png` | el aparador | si |
| `candelabro.png` | el candelabro | si |
| `trinchero.png` | el trinchero | si |
| `alfombra_bordada.png` | la alfombra bordada | no, es del suelo |
| `palmera.png` | la palmera | si |
| `banco_piedra.png` | el banco de piedra | si |
| `fuente.png` | la fuente | si |
| `macetero.png` | el macetero | si |
| `charco.png` | el charco de agua | no, es del suelo |
| `caldera.png` | la caldera | si |
| `barriles.png` | los barriles | si |
| `herramientas.png` | las herramientas | si |
| `arcon.png` | el arcón | si |
| `trampilla.png` | la trampilla | no, es del suelo |
| `perchero.png` | el perchero | si |
| `reloj_pie.png` | el reloj de pie | si |
| `cuadro.png` | el cuadro torcido | si |
| `consola.png` | la consola de entrada | si |
| `felpudo.png` | el felpudo | no, es del suelo |
| `piano.png` | el piano | si |
| `arpa.png` | el arpa | si |
| `gramola.png` | la gramola | si |
| `atril_musica.png` | el atril de partituras | si |
| `tarima.png` | la tarima | no, es del suelo |
| `mesa_billar.png` | la mesa de billar | si |
| `taquera.png` | la taquera | si |
| `mueble_bar.png` | el mueble bar | si |
| `diana.png` | la diana | si |
| `alfombra_verde.png` | la alfombra verde | no, es del suelo |
| `baules.png` | los baúles | si |
| `maniqui.png` | el maniquí | si |
| `espejo_roto.png` | el espejo roto | si |
| `jaula.png` | la jaula vacía | si |
| `tablon_suelto.png` | el tablón suelto | no, es del suelo |
| `coche.png` | el coche | si |
| `banco_trabajo.png` | el banco de trabajo | si |
| `neumaticos.png` | los neumáticos | si |
| `gato_hidraulico.png` | el gato hidráulico | si |
| `mancha_aceite.png` | la mancha de aceite | no, es del suelo |
| `escalinata.png` | la escalinata | si |
| `estatua.png` | la estatua | si |
| `paraguero.png` | el paragüero | si |
| `recibidor.png` | el mueble recibidor | si |
| `felpudo_largo.png` | el felpudo largo | no, es del suelo |
