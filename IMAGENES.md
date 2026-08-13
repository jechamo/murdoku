# Imágenes del juego

Todo funciona ya sin ninguna imagen: mientras no exista el PNG, se dibuja un marcador
generado (la inicial del personaje sobre su color, o el pictograma del mueble).

**Para poner una imagen de verdad basta con dejar el fichero con el nombre exacto en su
carpeta.** No hay que tocar código, ni registrar nada, ni reconstruir listas. El componente
`src/ui/Sprite.tsx` intenta cargar el PNG y solo cae al marcador si no lo encuentra.

```
public/img/personajes/{id}.png
public/img/muebles/{id}.png
```

## Formato recomendado

| | Personajes | Mobiliario |
|---|---|---|
| Tamaño | 512 × 512 px | 256 × 256 px |
| Recorte | cuadrado, la cara centrada en el tercio superior | cuadrado, objeto centrado |
| Fondo | puede ser opaco: se recorta en cuadrado | **transparente**, se pinta sobre el color de la habitación |
| Encaje | `object-fit: cover` — el borde se recorta | `object-fit: contain` — se ve entero |

Los retratos se muestran desde 24 px (marca de candidato en una casilla) hasta 80 px (veredicto),
así que la cara tiene que reconocerse en miniatura: mejor un primer plano marcado y con mucho
contraste que un plano medio con detalle fino.

El mobiliario se dibuja pequeño y a media opacidad, porque ambienta el plano pero no debe
competir con las marcas de deducción. Siluetas claras funcionan mejor que ilustraciones densas.

## Puedes ir poco a poco

No hace falta completar una carpeta entera. Cada fichero que añadas sustituye a su marcador y
los demás siguen como estaban.

### Personajes

| Fichero | Personaje |
|---|---|
| `comisario.png` | el comisario Ordóñez |
| `doctora.png` | la doctora Iriarte |
| `chef.png` | el chef Barzán |
| `viuda.png` | la viuda Mendaro |
| `botones.png` | el botones Nico |
| `pianista.png` | la pianista Solveig |
| `jardinero.png` | el jardinero Cosme |
| `heredero.png` | el heredero Fabián |
| `institutriz.png` | la institutriz Prudencia |
| `taxidermista.png` | el taxidermista Ruano |
| `soprano.png` | la soprano Delmira |
| `relojero.png` | el relojero Ibarra |

### Mobiliario

| Fichero | Mueble | Llena la casilla |
|---|---|---|
| `nevera.png` | la nevera | sí |
| `fogones.png` | los fogones | sí |
| `fregadero.png` | el fregadero | sí |
| `alacena.png` | la alacena | sí |
| `mancha_grasa.png` | la mancha de grasa | no |
| `sofa.png` | el sofá | sí |
| `televisor.png` | el televisor | sí |
| `chimenea.png` | la chimenea | sí |
| `butaca.png` | la butaca | sí |
| `alfombra_persa.png` | la alfombra persa | no |
| `cama.png` | la cama | sí |
| `armario.png` | el armario | sí |
| `tocador.png` | el tocador | sí |
| `mesilla.png` | la mesilla de noche | sí |
| `alfombra_piel.png` | la alfombra de piel | no |
| `escritorio.png` | el escritorio | sí |
| `caja_fuerte.png` | la caja fuerte | sí |
| `globo.png` | el globo terráqueo | sí |
| `archivador.png` | el archivador | sí |
| `alfombra_lectura.png` | la alfombra de lectura | no |
| `estanteria.png` | la estantería | sí |
| `atril.png` | el atril | sí |
| `escalera_mano.png` | la escalera de mano | sí |
| `vitrina.png` | la vitrina | sí |
| `alfombra_raida.png` | la alfombra raída | no |
| `banera.png` | la bañera | sí |
| `lavabo.png` | el lavabo | sí |
| `espejo.png` | el espejo | sí |
| `cesto_ropa.png` | el cesto de la ropa | sí |
| `baldosa_suelta.png` | la baldosa suelta | no |
| `mesa_larga.png` | la mesa larga | sí |
| `aparador.png` | el aparador | sí |
| `candelabro.png` | el candelabro | sí |
| `trinchero.png` | el trinchero | sí |
| `alfombra_bordada.png` | la alfombra bordada | no |
| `palmera.png` | la palmera | sí |
| `banco_piedra.png` | el banco de piedra | sí |
| `fuente.png` | la fuente | sí |
| `macetero.png` | el macetero | sí |
| `charco.png` | el charco de agua | no |
| `caldera.png` | la caldera | sí |
| `barriles.png` | los barriles | sí |
| `herramientas.png` | las herramientas | sí |
| `arcon.png` | el arcón | sí |
| `trampilla.png` | la trampilla | no |
| `perchero.png` | el perchero | sí |
| `reloj_pie.png` | el reloj de pie | sí |
| `cuadro.png` | el cuadro torcido | sí |
| `consola.png` | la consola de entrada | sí |
| `felpudo.png` | el felpudo | no |
| `piano.png` | el piano | sí |
| `arpa.png` | el arpa | sí |
| `gramola.png` | la gramola | sí |
| `atril_musica.png` | el atril de partituras | sí |
| `tarima.png` | la tarima | no |
| `mesa_billar.png` | la mesa de billar | sí |
| `taquera.png` | la taquera | sí |
| `mueble_bar.png` | el mueble bar | sí |
| `diana.png` | la diana | sí |
| `alfombra_verde.png` | la alfombra verde | no |
| `baules.png` | los baúles | sí |
| `maniqui.png` | el maniquí | sí |
| `espejo_roto.png` | el espejo roto | sí |
| `jaula.png` | la jaula vacía | sí |
| `tablon_suelto.png` | el tablón suelto | no |
| `coche.png` | el coche | sí |
| `banco_trabajo.png` | el banco de trabajo | sí |
| `neumaticos.png` | los neumáticos | sí |
| `gato_hidraulico.png` | el gato hidráulico | sí |
| `mancha_aceite.png` | la mancha de aceite | no |
| `escalinata.png` | la escalinata | sí |
| `estatua.png` | la estatua | sí |
| `paraguero.png` | el paragüero | sí |
| `recibidor.png` | el mueble recibidor | sí |
| `felpudo_largo.png` | el felpudo largo | no |
