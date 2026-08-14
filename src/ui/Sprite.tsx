/**
 * Imágenes con respaldo automático.
 *
 * Se intenta cargar `public/img/{personajes|muebles}/{id}.png` y, si el fichero no existe
 * todavía, se pinta un marcador generado. Es decir: **basta con dejar el PNG con el nombre
 * correcto en la carpeta para que aparezca**, sin tocar una línea de código.
 *
 * La lista completa de ficheros esperados está en IMAGENES.md.
 */

import { useEffect, useState, type CSSProperties } from 'react';

import { personaje } from '../data/cast';
import { mueble } from '../data/furniture';

type Carpeta = 'personajes' | 'muebles';

function ruta(carpeta: Carpeta, id: string): string {
  return `${import.meta.env.BASE_URL}img/${carpeta}/${id}.png`;
}

function Imagen({
  carpeta,
  id,
  alt,
  className,
  respaldo,
}: {
  carpeta: Carpeta;
  id: string;
  alt: string;
  className?: string;
  respaldo: React.ReactNode;
}) {
  const [fallo, setFallo] = useState(false);
  const src = ruta(carpeta, id);
  useEffect(() => setFallo(false), [src]);

  if (fallo) return <>{respaldo}</>;
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      draggable={false}
      onError={() => setFallo(true)}
    />
  );
}

/**
 * Los respaldos se dibujan en SVG con `viewBox`, no con tipografía en píxeles: así escalan
 * solos a cualquier tamaño, desde la marca diminuta de candidato hasta el retrato del
 * veredicto, sin depender de container queries ni de cálculos a mano.
 */

/** Retrato de personaje. Mientras no haya PNG, la inicial sobre su color de ficha. */
export function Retrato({
  id,
  className = '',
  estilo,
}: {
  id: string;
  className?: string;
  estilo?: CSSProperties;
}) {
  const p = personaje(id);
  return (
    <Imagen
      carpeta="personajes"
      id={id}
      alt={p.nombre}
      className={`h-full w-full object-cover ${className}`}
      respaldo={
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="xMidYMid slice"
          className={`h-full w-full ${className}`}
          style={estilo}
          aria-hidden
        >
          <defs>
            <linearGradient id={`g-${id}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={p.color} />
              <stop offset="100%" stopColor={p.color} stopOpacity="0.55" />
            </linearGradient>
          </defs>
          <rect width="100" height="100" fill={`url(#g-${id})`} />
          <text
            x="50"
            y="50"
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="58"
            fontWeight="900"
            fontFamily="'Playfair Display', Georgia, serif"
            fill="rgba(11,11,13,0.82)"
          >
            {p.nombre.slice(0, 1)}
          </text>
        </svg>
      }
    />
  );
}

/**
 * Baldosa de mueble. El arte son ilustraciones cuadradas con fondo oscuro opaco que llenan la
 * casilla entera, así que el respaldo imita ese formato: baldosa oscura con el pictograma
 * centrado y pequeño, en vez de un emoji gigante.
 */
export function IconoMueble({ id, className = '' }: { id: string; className?: string }) {
  const m = mueble(id);
  return (
    <Imagen
      carpeta="muebles"
      id={id}
      alt={m.nombre}
      className={`h-full w-full object-cover ${className}`}
      respaldo={
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="xMidYMid slice"
          className={`h-full w-full ${className}`}
          aria-hidden
        >
          <rect width="100" height="100" fill="#0d0c0a" />
          <text x="50" y="53" textAnchor="middle" dominantBaseline="central" fontSize="46">
            {m.icono}
          </text>
        </svg>
      }
    />
  );
}
