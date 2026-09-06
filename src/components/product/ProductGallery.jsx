import { useState } from 'react';
import { cn } from '@/lib/cn';

/*
 * Galeria da Página de Produto. Recebe `images` (do ProductDTO.images:
 * [{ url, alt, primary }]) e mostra a imagem principal grande com uma
 * tira de miniaturas quando há mais de uma. Cai para `image` (string
 * única) quando `images` não vier — mantém compatível a PDP antiga.
 */
export default function ProductGallery({ images, image, alt, className }) {
  const list =
    Array.isArray(images) && images.length > 0
      ? images.map((img) => ({ url: img.url, alt: img.alt || alt }))
      : image
        ? [{ url: image, alt }]
        : [];

  const [active, setActive] = useState(0);
  const [errored, setErrored] = useState({});

  // Reset ao trocar de produto vem do `key` no componente pai (Produto.jsx);
  // aqui só garantimos que o índice não passa do fim da lista.
  const safeActive = active < list.length ? active : 0;
  const current = list[safeActive];
  const showImage = current && !errored[safeActive];

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className="overflow-hidden rounded-card bg-subtle">
        <div className="aspect-[3/4] w-full">
          {showImage ? (
            <img
              src={current.url}
              alt={current.alt}
              onError={() => setErrored((e) => ({ ...e, [safeActive]: true }))}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-muted">
              sem imagem
            </div>
          )}
        </div>
      </div>

      {list.length > 1 && (
        <ul className="flex flex-wrap gap-2">
          {list.map((img, i) => (
            <li key={img.url + i}>
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Ver imagem ${i + 1}`}
                aria-current={i === safeActive}
                className={cn(
                  'h-16 w-13 overflow-hidden rounded-card border bg-subtle',
                  i === safeActive ? 'border-accent ring-1 ring-accent' : 'border-border',
                )}
              >
                <img src={img.url} alt="" className="h-full w-full object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
