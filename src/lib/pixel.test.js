import { afterEach, describe, expect, it, vi } from 'vitest';

// O módulo lê as variáveis ao carregar: cada teste importa uma cópia nova.
async function loadPixel(env) {
  vi.resetModules();
  for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value);
  return import('./pixel');
}

afterEach(() => {
  vi.unstubAllEnvs();
  delete window.fbq;
  delete window._fbq;
  document.head.querySelectorAll('script[src*="fbevents"]').forEach((s) => s.remove());
});

describe('pixel', () => {
  it('em dev, sem VITE_META_PIXEL_DEBUG, nao carrega nada nem dispara', async () => {
    const pixel = await loadPixel({ VITE_META_PIXEL_ID: '1128713843004608' });
    pixel.initPixel();
    pixel.track('ViewContent', { value: 1 });
    expect(pixel.pixelEnabled).toBe(false);
    expect(window.fbq).toBeUndefined();
  });

  it('sem ID, mesmo com debug, tudo e no-op', async () => {
    const pixel = await loadPixel({ VITE_META_PIXEL_ID: '', VITE_META_PIXEL_DEBUG: 'true' });
    pixel.initPixel();
    expect(window.fbq).toBeUndefined();
  });

  it('com debug: carrega o script async, inicia sem PageView e passa o eventID', async () => {
    const pixel = await loadPixel({
      VITE_META_PIXEL_ID: '1128713843004608',
      VITE_META_PIXEL_DEBUG: 'true',
    });
    pixel.initPixel();
    pixel.initPixel(); // segunda chamada não faz nada

    const scripts = document.head.querySelectorAll('script[src*="fbevents"]');
    expect(scripts).toHaveLength(1);
    expect(scripts[0].async).toBe(true);
    expect(window.fbq.queue).toEqual([['init', '1128713843004608']]);

    pixel.trackPageView();
    pixel.track('Purchase', { value: 10, currency: 'BRL' }, 99);
    expect(window.fbq.queue.slice(1)).toEqual([
      ['track', 'PageView', {}],
      ['track', 'Purchase', { value: 10, currency: 'BRL' }, { eventID: '99' }],
    ]);
  });

  it('metaCookies devolve so os cookies que existem', async () => {
    const pixel = await loadPixel({});
    document.cookie = '_fbp=fb.1.123.456';
    expect(pixel.metaCookies()).toEqual({ fbp: 'fb.1.123.456' });
    document.cookie = '_fbc=fb.1.123.AbC';
    expect(pixel.metaCookies()).toEqual({ fbp: 'fb.1.123.456', fbc: 'fb.1.123.AbC' });
    document.cookie = '_fbp=; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = '_fbc=; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  });

  it('money arredonda em centavos e aceita texto da API', async () => {
    const pixel = await loadPixel({});
    expect(pixel.money('274.80')).toBe(274.8);
    expect(pixel.money(0.1 + 0.2)).toBe(0.3);
    expect(pixel.money(undefined)).toBe(0);
  });
});
