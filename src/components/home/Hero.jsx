import { Link } from 'react-router-dom';
import Button from '@/components/ui/Button';
import bannerFull from '@/assets/hero-banner.webp';
import banner1200 from '@/assets/hero-banner-1200.webp';
import bannerMobile from '@/assets/hero-banner-mobile.webp';

/*
 * Duas artes com a logo já aplicada: horizontal (md+) e vertical 4:5 (celular).
 * O botão no desktop é posicionado em % da imagem, alinhado ao texto
 * "ROUPAS E ACESSÓRIOS" da arte — se a arte mudar, revisar left/top.
 */
export default function Hero() {
  return (
    <section className="bg-hero">
      <h1 className="sr-only">Duas Maria — Roupas e acessórios</h1>

      <div className="relative mx-auto max-w-[1983px]">
        <picture>
          <source
            media="(min-width: 768px)"
            srcSet={`${banner1200} 1200w, ${bannerFull} 1983w`}
            sizes="100vw"
          />
          <img
            src={bannerMobile}
            alt="Joscilene e Maria, fundadoras da Duas Maria, vestindo peças da marca"
            width={940}
            height={1175}
            fetchPriority="high"
            className="mx-auto block h-auto w-full max-w-[480px] md:max-w-none"
          />
        </picture>

        <div className="absolute left-[21.5%] top-[69%] hidden md:block">
          <Button as={Link} to="/produtos" className="lg:h-12 lg:px-7">
            Ver produtos
          </Button>
        </div>
      </div>
    </section>
  );
}
