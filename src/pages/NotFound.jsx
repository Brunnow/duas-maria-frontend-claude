import { Link } from 'react-router-dom';
import Button from '@/components/ui/Button';
import Container from '@/components/ui/Container';

export default function NotFound() {
  return (
    <Container className="flex flex-col items-center gap-6 py-28 text-center">
      <p className="font-display text-6xl text-foreground">404</p>
      <h1 className="max-w-sm text-muted">A página que você procura não existe ou foi movida.</h1>
      <Button as={Link} to="/">
        Voltar para a home
      </Button>
    </Container>
  );
}
