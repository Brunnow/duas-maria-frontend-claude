import { FiCalendar, FiRefreshCw, FiTag, FiTruck } from 'react-icons/fi';
import Button from '@/components/ui/Button';
import Container from '@/components/ui/Container';
import Seo from '@/components/shared/Seo';
import { STORE_WHATSAPP_URL } from '@/lib/contact';
import { RETURN_WINDOW_DAYS } from '@/lib/returnPolicy';

const DAYS = `${RETURN_WINDOW_DAYS} dias`;

const HIGHLIGHTS = [
  {
    Icon: FiCalendar,
    title: `${DAYS} para trocar ou devolver`,
    text: 'Contados a partir do recebimento.',
  },
  {
    Icon: FiTruck,
    title: 'Primeira troca por nossa conta',
    text: 'O frete da 1ª troca ou devolução de cada pedido é grátis.',
  },
  { Icon: FiTag, title: 'Com etiqueta e sem uso', text: 'A peça precisa voltar como chegou.' },
  {
    Icon: FiRefreshCw,
    title: 'Promoção não tem troca',
    text: 'Arrependimento e defeito continuam garantidos.',
  },
];

const STEPS = [
  'Fale com a gente no WhatsApp com o número do pedido e diga o que quer fazer: trocar o tamanho ou devolver.',
  'Combinamos o envio da peça de volta.',
  'Quando a peça chega, conferimos a etiqueta e se não há marcas de uso.',
  'Tudo certo: enviamos o novo tamanho ou fazemos o estorno do valor.',
];

function Section({ title, children }) {
  return (
    <section className="border-t border-border pt-6">
      <h2 className="font-display text-xl text-foreground">{title}</h2>
      <div className="mt-3 flex flex-col gap-3 text-sm leading-relaxed text-muted">{children}</div>
    </section>
  );
}

export default function TrocasDevolucoes() {
  return (
    <Container className="py-10 lg:py-14">
      <Seo
        title="Trocas e devoluções"
        description={`Troca de tamanho e devolução em até ${DAYS} do recebimento, com a primeira troca de cada pedido por nossa conta. Veja as condições da Duas Maria.`}
      />
      <div className="mx-auto flex max-w-3xl flex-col gap-8">
        <header>
          <h1 className="font-display text-3xl text-foreground lg:text-4xl">Trocas e devoluções</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Queremos que você ame cada peça. Se não deu certo, a gente resolve — veja como funciona.
          </p>
        </header>

        <ul className="grid gap-3 sm:grid-cols-2">
          {HIGHLIGHTS.map(({ Icon, title, text }) => (
            <li key={title} className="flex gap-3 rounded-card border border-border p-4">
              <Icon className="mt-0.5 shrink-0 text-accent" size={18} aria-hidden="true" />
              <div>
                <p className="text-sm font-medium text-foreground">{title}</p>
                <p className="mt-0.5 text-sm text-muted">{text}</p>
              </div>
            </li>
          ))}
        </ul>

        <Section title="Condições">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Solicitação em até {DAYS} corridos depois que você recebeu a encomenda.</li>
            <li>Peça com a etiqueta presa.</li>
            <li>Sem marcas de uso, como lavagem, manchas ou cheiro de perfume.</li>
          </ul>
        </Section>

        <Section title="Troca de tamanho">
          <p>
            A troca é feita pelo mesmo produto em outro tamanho, de acordo com o estoque. Se o
            tamanho que você quer não estiver disponível — ou se preferir outra peça — fazemos a
            devolução do valor e você compra o que quiser no site.
          </p>
        </Section>

        <Section title="Devolução (arrependimento)">
          <p>
            Você pode desistir da compra em até {DAYS} após o recebimento, como garante o Código de
            Defesa do Consumidor. Devolvemos o valor pago pelas peças devolvidas — e o frete da
            compra, se o pedido inteiro voltar.
          </p>
          <p>
            O estorno é feito no mesmo meio de pagamento, assim que a peça chega e é conferida. No
            Pix o valor costuma voltar na hora; no cartão, o crédito pode aparecer em até duas
            faturas, conforme o banco.
          </p>
        </Section>

        <Section title="Peças em promoção">
          <p>
            Peças compradas em promoção não têm troca. O direito de arrependimento em até {DAYS}{' '}
            após o recebimento e a garantia contra defeitos continuam valendo normalmente.
          </p>
        </Section>

        <Section title="Defeito">
          <p>
            Recebeu uma peça com defeito? Fale com a gente assim que perceber, com uma foto do
            problema. Nesse caso a troca ou devolução é sempre por nossa conta, inclusive em peças
            de promoção.
          </p>
        </Section>

        <Section title="Frete">
          <p>
            O frete da primeira troca ou devolução de cada pedido é por nossa conta. A partir da
            segunda no mesmo pedido, o envio fica por conta da cliente.
          </p>
        </Section>

        <Section title="Como solicitar">
          <ol className="list-decimal space-y-1.5 pl-5">
            {STEPS.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <div className="mt-2">
            <Button as="a" href={STORE_WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
              Solicitar pelo WhatsApp
            </Button>
          </div>
        </Section>
      </div>
    </Container>
  );
}
