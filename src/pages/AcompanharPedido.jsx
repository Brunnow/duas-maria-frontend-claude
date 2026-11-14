import { useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '@/components/ui/Button';
import Container from '@/components/ui/Container';
import Input from '@/components/ui/Input';
import { requestOrdersLink } from '@/services/publicOrderService';

const SENT_MESSAGE =
  'Se houver pedidos com esses dados, enviamos um link para o e-mail usado na compra. Confira também a caixa de spam.';

/** E-mail (tem @) ou CPF com 11 dígitos, com ou sem pontuação. */
function identifierError(value) {
  const text = value.trim();
  if (!text) return 'Informe o e-mail ou o CPF usado na compra.';
  if (text.includes('@')) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text) ? null : 'E-mail inválido.';
  }
  return text.replace(/\D/g, '').length === 11 ? null : 'CPF inválido. Digite os 11 números.';
}

/*
 * "Acompanhar pedido" para quem comprou sem cadastro. Nunca mostra pedidos
 * aqui: manda o link de "Meus pedidos" para o e-mail usado na compra, assim
 * quem só sabe o CPF de outra pessoa não vê nada.
 */
export default function AcompanharPedido() {
  const [identifier, setIdentifier] = useState('');
  const [error, setError] = useState(null);
  const [formError, setFormError] = useState(null);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const found = identifierError(identifier);
    setError(found);
    if (found) return;

    setSubmitting(true);
    setFormError(null);
    try {
      await requestOrdersLink(identifier.trim());
      setSent(true);
    } catch (err) {
      setFormError(
        err?.response?.status === 429
          ? 'Muitas tentativas. Aguarde alguns minutos e tente de novo.'
          : 'Não foi possível enviar agora. Tente novamente.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container className="flex flex-col items-center py-16 lg:py-24">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-3xl text-foreground">Acompanhar pedido</h1>
        <p className="mt-2 text-sm text-muted">
          Informe o e-mail ou o CPF usado na compra. Enviamos para o seu e-mail um link com todos os
          seus pedidos.
        </p>

        {sent ? (
          <div className="mt-6 flex flex-col gap-4">
            <p role="status" className="rounded-card bg-success/10 px-3 py-2 text-sm text-success">
              {SENT_MESSAGE}
            </p>
            <Button
              variant="secondary"
              onClick={() => {
                setSent(false);
                setIdentifier('');
              }}
            >
              Usar outro e-mail ou CPF
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="mt-6 flex flex-col gap-4">
            <Input
              label="E-mail ou CPF"
              name="identifier"
              value={identifier}
              onChange={(event) => {
                setIdentifier(event.target.value);
                setError(null);
                setFormError(null);
              }}
              error={error}
              autoComplete="email"
              inputMode="email"
            />

            {formError && (
              <p role="alert" className="text-sm text-danger">
                {formError}
              </p>
            )}

            <Button type="submit" loading={submitting} className="mt-2">
              Receber link por e-mail
            </Button>
          </form>
        )}

        <p className="mt-6 text-sm text-muted">
          Tem conta?{' '}
          <Link
            to="/login"
            state={{ from: { pathname: '/pedidos' } }}
            className="text-accent hover:underline"
          >
            Entre para ver seus pedidos
          </Link>
        </p>
      </div>
    </Container>
  );
}
