import { Link } from 'react-router-dom';
import { FaBarcode, FaFacebook, FaInstagram, FaWhatsapp } from 'react-icons/fa';
import { FiLock, FiMail, FiPhone, FiShield } from 'react-icons/fi';
import { SiAmericanexpress, SiMastercard, SiMercadopago, SiPix, SiVisa } from 'react-icons/si';
import Container from '@/components/ui/Container';
import {
  STORE_EMAIL,
  STORE_FACEBOOK_URL,
  STORE_INSTAGRAM_URL,
  STORE_PHONE_DISPLAY,
  STORE_PHONE_TEL,
  STORE_WHATSAPP_URL as WHATSAPP_URL,
} from '@/lib/contact';
import { INTEREST_FREE_INSTALLMENTS } from '@/lib/installments';
import { RETURN_POLICY_PATH } from '@/lib/returnPolicy';

const linkClass = 'text-sm text-muted transition-colors hover:text-foreground';
const headingClass = 'text-xs font-semibold uppercase tracking-wider text-foreground';

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
      { label: 'Trocas e devoluções', to: RETURN_POLICY_PATH },
      { label: 'Envio e prazos', href: WHATSAPP_URL },
      { label: 'Fale conosco', href: WHATSAPP_URL },
    ],
  },
];

const socials = [
  { label: 'Instagram', href: STORE_INSTAGRAM_URL, Icon: FaInstagram },
  { label: 'Facebook', href: STORE_FACEBOOK_URL, Icon: FaFacebook },
  { label: 'WhatsApp', href: WHATSAPP_URL, Icon: FaWhatsapp },
];

// O Checkout Pro do Mercado Pago aceita todos estes (a preferência não exclui
// nenhum meio). Elo e Hipercard não têm ícone no react-icons: vão só com o nome.
const paymentMethods = [
  { label: 'Pix', Icon: SiPix },
  { label: 'Visa', Icon: SiVisa },
  { label: 'Mastercard', Icon: SiMastercard },
  { label: 'Amex', Icon: SiAmericanexpress },
  { label: 'Elo' },
  { label: 'Hipercard' },
  { label: 'Boleto', Icon: FaBarcode },
];

// Só garantias verdadeiras — nenhum selo de terceiro que a loja não contratou.
const securityItems = [
  { label: 'Site seguro', detail: 'Conexão criptografada (HTTPS)', Icon: FiLock },
  { label: 'Pagamento protegido', detail: 'Processado pelo Mercado Pago', Icon: SiMercadopago },
  { label: 'Dados protegidos', detail: 'Não guardamos dados de cartão', Icon: FiShield },
];

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-border bg-surface">
      <Container className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-display text-xl text-foreground">Duas Maria</p>
          <p className="mt-3 max-w-xs text-sm text-muted">
            Moda feminina com curadoria. Peças atemporais, feitas para durar.
          </p>
          <ul className="mt-5 flex gap-2" aria-label="Redes sociais">
            {socials.map(({ label, href, Icon }) => (
              <li key={label}>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted transition-colors hover:border-foreground hover:text-foreground"
                >
                  <Icon size={16} aria-hidden="true" />
                </a>
              </li>
            ))}
          </ul>
        </div>

        {groups.map((group) => (
          <nav key={group.title} className="flex flex-col gap-3" aria-label={group.title}>
            <h3 className={headingClass}>{group.title}</h3>
            {group.links.map((link, i) =>
              link.href ? (
                <a
                  key={i}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClass}
                >
                  {link.label}
                </a>
              ) : (
                <Link key={i} to={link.to} className={linkClass}>
                  {link.label}
                </Link>
              ),
            )}
          </nav>
        ))}

        <div className="flex flex-col gap-3">
          <h3 className={headingClass}>Atendimento</h3>
          <a href={STORE_PHONE_TEL} className={`${linkClass} inline-flex items-center gap-2`}>
            <FiPhone size={14} aria-hidden="true" className="shrink-0" />
            {STORE_PHONE_DISPLAY}
          </a>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={`${linkClass} inline-flex items-center gap-2`}
          >
            <FaWhatsapp size={14} aria-hidden="true" className="shrink-0" />
            WhatsApp
          </a>
          <a
            href={`mailto:${STORE_EMAIL}`}
            className={`${linkClass} inline-flex items-center gap-2 break-all`}
          >
            <FiMail size={14} aria-hidden="true" className="shrink-0" />
            {STORE_EMAIL}
          </a>
        </div>
      </Container>

      <div className="border-t border-border">
        <Container className="grid gap-8 py-8 lg:grid-cols-2 lg:gap-12">
          <div>
            <h3 className={headingClass}>Formas de pagamento</h3>
            <ul className="mt-3 flex flex-wrap gap-2" aria-label="Formas de pagamento">
              {paymentMethods.map(({ label, Icon }) => (
                <li
                  key={label}
                  className="flex h-8 items-center gap-1.5 rounded-md border border-border bg-background px-2.5 text-xs font-medium text-foreground"
                >
                  {Icon && <Icon size={14} aria-hidden="true" />}
                  {label}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-muted">
              Cartão de crédito em até {INTEREST_FREE_INSTALLMENTS}x sem juros.
            </p>
          </div>

          <div>
            <h3 className={headingClass}>Compra segura</h3>
            <ul className="mt-3 grid gap-4 sm:grid-cols-3">
              {securityItems.map(({ label, detail, Icon }) => (
                <li key={label} className="flex items-start gap-2.5">
                  <Icon size={18} aria-hidden="true" className="mt-0.5 shrink-0 text-foreground" />
                  <span className="text-xs leading-snug">
                    <span className="block font-medium text-foreground">{label}</span>
                    <span className="text-muted">{detail}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </div>

      <div className="border-t border-border">
        {/* pb-24 no celular: o botão flutuante do WhatsApp cobria esta linha. */}
        <Container className="flex flex-col gap-2 pt-8 pb-24 sm:flex-row sm:items-center sm:justify-between sm:pb-8">
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
