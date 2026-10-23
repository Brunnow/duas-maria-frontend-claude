import { usePixelPageView } from '@/hooks/usePixelPageView';

/** Monta o PageView do Pixel uma única vez, dentro do Router (ver App). */
export default function PixelPageView() {
  usePixelPageView();
  return null;
}
