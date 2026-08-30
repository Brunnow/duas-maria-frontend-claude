import { Link } from 'react-router-dom';
import Button from '@/components/ui/Button';
import Container from '@/components/ui/Container';

/*
 * Hero da Home. Por enquanto e um hero tipografico sobre fundo tonal
 * (sem foto de terceiros). Quando houver arte de campanha, basta
 * aplicar a imagem como background desta <section>.
 */
export default function Hero() {
  return (
    <section className="bg-subtle">
      <Container className="flex min-h-[60vh] flex-col justify-center py-16 lg:min-h-[72vh] lg:py-24">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent">Nova coleção</p>
        <h1 className="mt-4 max-w-2xl font-display text-4xl leading-tight text-foreground sm:text-5xl lg:text-6xl">
          Peças atemporais para o dia a dia
        </h1>
        <p className="mt-5 max-w-md text-sm text-muted sm:text-base">
          Moda feminina com curadoria: caimento, tecido e acabamento pensados para durar.
        </p>
        <div className="mt-8">
          <Button as={Link} to="/produtos" size="lg">
            Ver produtos
          </Button>
        </div>
      </Container>
    </section>
  );
}
