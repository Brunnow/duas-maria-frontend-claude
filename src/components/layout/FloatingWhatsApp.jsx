import { FaWhatsapp } from 'react-icons/fa';

const WHATSAPP_URL = 'https://wa.me/5561995730440';

/** Botao flutuante de contato via WhatsApp, visivel em todas as paginas. */
export default function FloatingWhatsApp() {
  return (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar no WhatsApp"
      className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-pop transition-transform hover:scale-105"
    >
      <FaWhatsapp size={28} aria-hidden="true" />
    </a>
  );
}
