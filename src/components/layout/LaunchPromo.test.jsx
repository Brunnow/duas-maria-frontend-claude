import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LaunchPromo from './LaunchPromo';
import { launchPromoActive, launchPromoHiddenOn } from '@/lib/launchPromo';

const renderAt = (path = '/') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <LaunchPromo />
    </MemoryRouter>,
  );

const waitDelay = () =>
  act(() => {
    vi.advanceTimersByTime(3100);
  });

describe('LaunchPromo', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-18T20:00:00-03:00'));
    window.localStorage.clear();
  });
  afterEach(() => vi.useRealTimers());

  it('aparece alguns segundos depois de entrar, com os dois cupons', () => {
    renderAt('/');
    expect(screen.queryByRole('complementary', { name: 'Lançamento do site' })).toBeNull();
    waitDelay();
    expect(screen.getByRole('complementary', { name: 'Lançamento do site' })).toBeInTheDocument();
    expect(screen.getByText('PRIMEIRACOMPRA')).toBeInTheDocument();
    expect(screen.getByText('ESQUENTA20')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ver as peças' })).toHaveAttribute('href', '/produtos');
  });

  it('fechar no X some e nao volta mais', () => {
    const { unmount } = renderAt('/');
    waitDelay();
    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }));
    expect(screen.queryByText('PRIMEIRACOMPRA')).toBeNull();
    unmount();

    renderAt('/');
    waitDelay();
    expect(screen.queryByText('PRIMEIRACOMPRA')).toBeNull();
  });

  it('Esc tambem fecha', () => {
    renderAt('/');
    waitDelay();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByText('PRIMEIRACOMPRA')).toBeNull();
  });

  it('copia o cupom e avisa "Copiado!"', async () => {
    const writeText = vi.fn().mockResolvedValue();
    Object.assign(navigator, { clipboard: { writeText } });
    renderAt('/');
    waitDelay();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Copiar cupom ESQUENTA20' }));
    });
    expect(writeText).toHaveBeenCalledWith('ESQUENTA20');
    expect(screen.getByText('Copiado!')).toBeInTheDocument();
  });

  it('nao aparece no checkout', () => {
    renderAt('/checkout');
    waitDelay();
    expect(screen.queryByText('PRIMEIRACOMPRA')).toBeNull();
  });

  it('regras: paginas ocultas e data de fim', () => {
    expect(launchPromoHiddenOn('/carrinho')).toBe(true);
    expect(launchPromoHiddenOn('/admin/produtos')).toBe(true);
    expect(launchPromoHiddenOn('/produtos/152')).toBe(false);
    expect(launchPromoActive(new Date('2026-10-25T23:00:00-03:00'))).toBe(true);
    expect(launchPromoActive(new Date('2026-10-26T00:00:01-03:00'))).toBe(false);
  });
});
