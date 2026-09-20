import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import api from '@/api/api';
import Container from '@/components/ui/Container';
import Skeleton from '@/components/ui/Skeleton';

const arrowButtonClass =
  'absolute top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center ' +
  'rounded-full bg-surface text-foreground shadow-card transition-colors hover:bg-subtle lg:flex';

/**
 * Vitrine de categorias arrastavel na Home, entre o banner e os destaques.
 * Category nao tem campo de foto no backend, entao cada card usa a imagem
 * do primeiro produto cadastrado naquela categoria (GET
 * /public/categories/{id}/products?pageSize=1) — categoria sem nenhum
 * produto ainda simplesmente nao entra na vitrine, em vez de mostrar um
 * card quebrado.
 */
export default function CategoryShowcase() {
  const categories = useSelector((state) => state.products.categories);
  const [cards, setCards] = useState(null); // null = ainda carregando
  const swiperRef = useRef(null);

  useEffect(() => {
    if (!categories) {
      return undefined;
    }
    let cancelled = false;

    Promise.all(
      categories.map((category) =>
        api
          .get(`/public/categories/${category.categoryId}/products`, { params: { pageSize: 1 } })
          .then((res) => {
            const product = res.data?.content?.[0];
            return product?.image
              ? { categoryId: category.categoryId, categoryName: category.categoryName, image: product.image }
              : null;
          })
          .catch(() => null),
      ),
    ).then((results) => {
      if (!cancelled) setCards(results.filter(Boolean));
    });

    return () => {
      cancelled = true;
    };
  }, [categories]);

  if (cards !== null && cards.length === 0) {
    return null;
  }

  return (
    <Container as="section" className="pt-14 lg:pt-16">
      <h2 className="mb-6 font-display text-2xl text-foreground">Vitrine por categoria</h2>

      {cards === null ? (
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[4/5] w-40 shrink-0" />
          ))}
        </div>
      ) : (
        <div className="relative">
          {/* Setas: convencao que quem usa mouse reconhece de cara. Escondidas no
              mobile, onde o toque/arraste ja e o gesto natural. */}
          <button
            type="button"
            aria-label="Categoria anterior"
            onClick={() => swiperRef.current?.slidePrev()}
            className={`${arrowButtonClass} -left-4`}
          >
            <FiChevronLeft size={20} />
          </button>
          <button
            type="button"
            aria-label="Próxima categoria"
            onClick={() => swiperRef.current?.slideNext()}
            className={`${arrowButtonClass} -right-4`}
          >
            <FiChevronRight size={20} />
          </button>

          <Swiper
            onSwiper={(instance) => {
              swiperRef.current = instance;
            }}
            loop={cards.length > 4}
            spaceBetween={16}
            slidesPerView={2.3}
            // Sempre sobra uma fatia do proximo card na borda (mesmo em telas
            // largas) — e o sinal visual de "tem mais, arraste/clique" que
            // faltava quando os cards enchiam a fileira certinho.
            breakpoints={{ 640: { slidesPerView: 3.3 }, 1024: { slidesPerView: 5.3 } }}
            grabCursor
          >
            {cards.map((c) => (
              <SwiperSlide key={c.categoryId}>
                <Link
                  to={`/produtos?category=${encodeURIComponent(c.categoryName)}`}
                  className="group relative block aspect-[4/5] w-full overflow-hidden rounded-card bg-subtle"
                >
                  <img
                    src={c.image}
                    alt={c.categoryName}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <span className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-transparent to-transparent" />
                  <span className="absolute bottom-0 left-0 right-0 p-4 text-sm font-semibold text-white">
                    {c.categoryName}
                  </span>
                </Link>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      )}
    </Container>
  );
}
