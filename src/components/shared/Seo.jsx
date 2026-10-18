import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_TITLE,
  SITE_NAME,
  siteOrigin,
  toMetaDescription,
} from '@/lib/seo';

function setMeta(attr, key, value) {
  let tag = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!value) {
    tag?.remove();
    return;
  }
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attr, key);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', value);
}

function setCanonical(href) {
  let link = document.head.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
}

function setJsonLd(data) {
  const id = 'seo-jsonld';
  document.getElementById(id)?.remove();
  if (!data) return;
  const script = document.createElement('script');
  script.id = id;
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
}

/**
 * Título, descrição, imagem de compartilhamento e link canônico da página —
 * o que aparece no resultado do Google e ao compartilhar no WhatsApp. Não
 * renderiza nada; ao sair da página volta tudo ao padrão do site.
 * `title` vem sem o nome da loja (ele é acrescentado aqui).
 */
export default function Seo({ title, description, image, type = 'website', jsonLd }) {
  const { pathname } = useLocation();
  const fullTitle = title ? `${title} | ${SITE_NAME}` : DEFAULT_TITLE;
  const desc = description ? toMetaDescription(description) : DEFAULT_DESCRIPTION;
  const jsonLdText = jsonLd ? JSON.stringify(jsonLd) : null;

  useEffect(() => {
    const url = `${siteOrigin()}${pathname}`;
    document.title = fullTitle;
    setMeta('name', 'description', desc);
    setMeta('property', 'og:site_name', SITE_NAME);
    setMeta('property', 'og:title', fullTitle);
    setMeta('property', 'og:description', desc);
    setMeta('property', 'og:type', type);
    setMeta('property', 'og:url', url);
    setMeta('property', 'og:image', image);
    setCanonical(url);
    setJsonLd(jsonLdText ? JSON.parse(jsonLdText) : null);

    return () => {
      document.title = DEFAULT_TITLE;
      setMeta('name', 'description', DEFAULT_DESCRIPTION);
      setMeta('property', 'og:image', null);
      setJsonLd(null);
    };
  }, [fullTitle, desc, image, type, pathname, jsonLdText]);

  return null;
}
