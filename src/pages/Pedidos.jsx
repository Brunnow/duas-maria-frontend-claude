import { Link } from 'react-router-dom';
import Button from '@/components/ui/Button';
import Container from '@/components/ui/Container';
import EmptyState from '@/components/shared/EmptyState';

/*
 * Rota protegida. A leitura de pedidos ainda nao existe na API
 * (OrderController so tem o POST de criacao). Esta area sera ligada
 * quando o backend expuser um GET de pedidos do usuario.
 */
export default function Pedidos() {
  return (
    <Container className="py-10 lg:py-14">
      <h1 className="font-display text-3xl text-foreground">Meus pedidos</h1>
      <EmptyState
        title="Histórico de pedidos indisponível"
        description="A API ainda não expõe a leitura de pedidos. Esta área será ativada assim que o endpoint estiver disponível."
        action={
          <Button as={Link} to="/produtos" variant="secondary" size="sm">
            Ver produtos
          </Button>
        }
      />
    </Container>
  );
}
