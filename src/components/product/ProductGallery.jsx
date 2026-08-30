import { useState } from 'react';
import { cn } from '@/lib/cn';

/*
 * Galeria da Pagina de Produto. O backend expoe uma unica imagem por
 * produto (Product.image), entao por ora e a imagem principal enquadrada,
 * sem tira de miniaturas. Quando houver multiplas imagens, e aqui que
 * elas entram.
 */
export default function ProductGallery({ image, alt, className }) {
  const [errored, setErrored] = useState(false);
  const showImage = image && !errored;

  return (
    <div className={cn('overflow-hidden rounded-card bg-subtle', className)}>
      <div className="aspect-[3/4] w-full">
        {showImage ? (
          <img
            src={image}
            alt={alt}
            onError={() => setErrored(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-muted">
            sem imagem
          </div>
        )}
      </div>
    </div>
  );
}
