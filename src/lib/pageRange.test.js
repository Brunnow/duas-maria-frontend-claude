import { describe, expect, it } from 'vitest';
import { pageRange } from './pageRange';

describe('pageRange', () => {
  it('lista todas as paginas quando sao poucas', () => {
    expect(pageRange(1, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(pageRange(3, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('insere reticencias em torno da pagina atual', () => {
    expect(pageRange(6, 12)).toEqual([1, 2, '…', 5, 6, 7, '…', 11, 12]);
  });

  it('nao gera reticencias quando a pagina atual esta perto das pontas', () => {
    expect(pageRange(2, 12)).toEqual([1, 2, 3, '…', 11, 12]);
    expect(pageRange(11, 12)).toEqual([1, 2, '…', 10, 11, 12]);
  });
});
