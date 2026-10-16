import { useState } from 'react';
import { optimizedImageUrl } from '@/lib/media';

/**
 * <img> de foto de produto que carrega a cópia menor gerada pelo backend
 * (`size`: 'small' ≈ 800px para cards/miniaturas, 'large' ≈ 1600px para a
 * página do produto) e, se ela não existir ou falhar, cai no original — a
 * foto nunca some por causa da otimização. `onError` só é chamado se o
 * próprio original falhar.
 */
export default function OptimizedImage({ src, size = 'small', onError, ...props }) {
  const optimized = optimizedImageUrl(src, size);
  const [failed, setFailed] = useState(null); // cópia que falhou (por URL)
  const useOptimized = Boolean(optimized) && failed !== optimized;

  return (
    <img
      {...props}
      src={useOptimized ? optimized : src}
      onError={(event) => {
        if (useOptimized) {
          setFailed(optimized);
          return;
        }
        onError?.(event);
      }}
    />
  );
}
