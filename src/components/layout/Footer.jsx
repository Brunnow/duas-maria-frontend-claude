import { Link } from 'react-router-dom';
import Button from '@/components/ui/Button';
import Container from '@/components/ui/Container';
import Input from '@/components/ui/Input';

const groups = [
  {
    title: 'Loja',
    links: [
      { label: 'Novidades', to: '/produtos' },
      { label: 'Todos os produtos', to: '/produtos' },
    ],
  },
  {
    title: 'Ajuda',
    links: [
      { label: 'Trocas e devoluções', to: '/' },
      { label: 'Envio e prazos', to: '/' },
      { label: 'Fale conosco', to: '/' },
    ],
  },
  {
    title: 'A marca',
    links: [
      { label: 'Sobre a Duas Marias', to: '/' },
      { label: 'Política de privacidade', to: '/' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-border bg-surface">
      <Container className="grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-display text-xl text-foreground">Duas Marias</p>
          <p className="mt-3 max-w-xs text-sm text-muted">
            Moda feminina com curadoria. Peças atemporais, feitas para durar.
          </p>
        </div>

        {groups.map((group) => (
          <nav key={group.title} className="flex flex-col gap-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
              {group.title}
            </h3>
            {group.links.map((link, i) => (
              <Link
                key={i}
                to={link.to}
                className="text-sm text-muted transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        ))}
      </Container>

      <div className="border-t border-border">
        <Container className="flex flex-col gap-6 py-8 lg:flex-row lg:items-end lg:justify-between">
          <form
            className="flex w-full max-w-md flex-col gap-3 sm:flex-row sm:items-end"
            onSubmit={(e) => e.preventDefault()}
          >
            <Input
              label="Newsletter"
              type="email"
              placeholder="seu@email.com"
              className="sm:flex-1"
            />
            <Button type="submit" className="shrink-0">
              Assinar
            </Button>
          </form>
          <p className="text-xs text-muted">
            © {new Date().getFullYear()} Duas Marias. Todos os direitos reservados.
          </p>
        </Container>
      </div>
    </footer>
  );
}
