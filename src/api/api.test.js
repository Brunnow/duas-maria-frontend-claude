import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import api from './api';

const networkError = (config) => Object.assign(new Error('Network Error'), { config, isAxiosError: true });

describe('api: nova tentativa em falha de rede', () => {
  const originalAdapter = api.defaults.adapter;

  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    api.defaults.adapter = originalAdapter;
    vi.useRealTimers();
  });

  it('GET que perde a conexao tenta de novo e entrega a resposta', async () => {
    let calls = 0;
    api.defaults.adapter = async (config) => {
      calls += 1;
      if (calls === 1) throw networkError(config);
      return { data: { ok: true }, status: 200, statusText: 'OK', headers: {}, config };
    };

    const promise = api.get('/public/products');
    await vi.advanceTimersByTimeAsync(600);

    await expect(promise).resolves.toMatchObject({ data: { ok: true } });
    expect(calls).toBe(2);
  });

  it('desiste depois de duas novas tentativas', async () => {
    let calls = 0;
    api.defaults.adapter = async (config) => {
      calls += 1;
      throw networkError(config);
    };

    const promise = api.get('/public/products');
    const assertion = expect(promise).rejects.toThrow('Network Error');
    await vi.advanceTimersByTimeAsync(2500);
    await assertion;
    expect(calls).toBe(3);
  });

  it('nao repete POST nem erro com resposta do servidor', async () => {
    let calls = 0;
    api.defaults.adapter = async (config) => {
      calls += 1;
      if (config.method === 'post') throw networkError(config);
      const error = networkError(config);
      error.response = { status: 500, data: {} };
      throw error;
    };

    await expect(api.post('/carts', {})).rejects.toThrow();
    await expect(api.get('/public/products')).rejects.toThrow();
    expect(calls).toBe(2);
  });
});
