import { beforeEach, describe, expect, it, vi } from 'vitest';

const get = vi.fn();
vi.mock('../../api/api', () => ({ default: { get: (...args) => get(...args) } }));

import { PRODUCTS_ERROR_MESSAGE, fetchCategories, fetchProducts } from './index';

const page = (content) => ({ data: { content, pageNumber: 0, pageSize: 8, totalElements: content.length, totalPages: 1, lastPage: true } });

describe('acoes de produtos e categorias', () => {
  beforeEach(() => {
    get.mockReset();
    // As acoes logam o erro; no jsdom, logar um Error derruba o teste.
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('falha de rede vira mensagem em portugues', async () => {
    get.mockImplementation(() => Promise.reject(new Error('Network Error')));
    const dispatch = vi.fn();
    await fetchProducts('')(dispatch);
    expect(dispatch).toHaveBeenLastCalledWith({ type: 'IS_ERROR', payload: PRODUCTS_ERROR_MESSAGE });
  });

  it('falha atrasada de uma busca antiga nao sobrescreve a busca atual', async () => {
    let rejectOld;
    get
      .mockImplementationOnce(() => new Promise((_, reject) => { rejectOld = reject; }))
      .mockResolvedValueOnce(page([{ productId: 1 }]));
    const dispatch = vi.fn();

    const old = fetchProducts('a')(dispatch);
    await fetchProducts('b')(dispatch);
    rejectOld(new Error('Network Error'));
    await old;

    expect(dispatch).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'IS_ERROR' }));
    expect(dispatch).toHaveBeenLastCalledWith({ type: 'IS_SUCCESS' });
  });

  it('erro nas categorias nao vira erro da lista de produtos', async () => {
    get.mockImplementation(() => Promise.reject(new Error('Network Error')));
    const dispatch = vi.fn();
    await fetchCategories()(dispatch);
    expect(dispatch).toHaveBeenLastCalledWith(expect.objectContaining({ type: 'CATEGORY_ERROR' }));
    expect(dispatch).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'IS_ERROR' }));
  });
});
