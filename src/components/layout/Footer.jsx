import { Link } from 'react-router-dom';
import Container from '@/components/ui/Container';

const WHATSAPP_URL = 'https://wa.me/5561995730440';

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
      { label: 'Trocas e devoluções', href: WHATSAPP_URL },
      { label: 'Envio e prazos', href: WHATSAPP_URL },
      { label: 'Fale conosco', href: WHATSAPP_URL },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-border bg-surface">
      <Container className="grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-3">
        <div>
          <p className="font-display text-xl text-foreground">Duas Maria</p>
          <p className="mt-3 max-w-xs text-sm text-muted">
            Moda feminina com curadoria. Peças atemporais, feitas para durar.
          </p>
        </div>

        {groups.map((group) => (
          <nav key={group.title} className="flex flex-col gap-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
              {group.title}
            </h3>
            {group.links.map((link, i) =>
              link.href ? (
                <a
                  key={i}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted transition-colors hover:text-foreground"
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={i}
                  to={link.to}
                  className="text-sm text-muted transition-colors hover:text-foreground"
                >
                  {link.label}
                </Link>
              ),
            )}
          </nav>
        ))}
      </Container>

      <div className="border-t border-border">
        <Container className="flex flex-col gap-2 py-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted">
            © {new Date().getFullYear()} Duas Maria. Todos os direitos reservados.
          </p>
          <p className="text-xs text-muted">
            Desenvolvido por Bruno Oliveira —{' '}
            <a
              href="https://wa.me/5561994218265"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground transition-colors hover:text-accent"
            >
              WhatsApp
            </a>{' '}
            ·{' '}
            <a
              href="mailto:brunoolvr.dev@gmail.com"
              className="text-foreground transition-colors hover:text-accent"
            >
              brunoolvr.dev@gmail.com
            </a>
          </p>
        </Container>
      </div>
    </footer>
  );
}
