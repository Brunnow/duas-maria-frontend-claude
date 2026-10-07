import { Link } from 'react-router-dom';
import Container from '@/components/ui/Container';

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
];

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-border bg-surface">
      <Container className="grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-3">
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
        <Container className="py-8">
          <p className="text-xs text-muted">
            © {new Date().getFullYear()} Duas Marias. Todos os direitos reservados.
          </p>
        </Container>
      </div>
    </footer>
  );
}
