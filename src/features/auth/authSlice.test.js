import { describe, expect, it } from 'vitest';
import reducer, { bootstrapSession, login, logout, sessionExpired } from './authSlice';

const initial = reducer(undefined, { type: '@@INIT' });

describe('authSlice', () => {
  it('estado inicial', () => {
    expect(initial).toEqual({ user: null, roles: [], status: 'idle' });
  });

  it('bootstrap: pending -> loading, fulfilled -> authenticated', () => {
    const loading = reducer(initial, { type: bootstrapSession.pending.type });
    expect(loading.status).toBe('loading');

    const user = { id: 1, username: 'maria', roles: ['ROLE_USER'] };
    const ready = reducer(loading, { type: bootstrapSession.fulfilled.type, payload: user });
    expect(ready).toEqual({ user, roles: ['ROLE_USER'], status: 'authenticated' });
  });

  it('bootstrap rejected -> anonymous', () => {
    const state = reducer(
      { user: null, roles: [], status: 'loading' },
      { type: bootstrapSession.rejected.type },
    );
    expect(state.status).toBe('anonymous');
  });

  it('login fulfilled -> authenticated com roles; rejected -> anonymous', () => {
    const user = { id: 2, username: 'ana', roles: ['ROLE_USER', 'ROLE_ADMIN'] };
    expect(reducer(initial, { type: login.fulfilled.type, payload: user })).toMatchObject({
      status: 'authenticated',
      roles: ['ROLE_USER', 'ROLE_ADMIN'],
    });
    expect(reducer(initial, { type: login.rejected.type, payload: 'erro' }).status).toBe(
      'anonymous',
    );
  });

  it('logout e sessionExpired limpam a sessao', () => {
    const authed = {
      user: { id: 1, username: 'maria' },
      roles: ['ROLE_USER'],
      status: 'authenticated',
    };
    expect(reducer(authed, { type: logout.fulfilled.type }).user).toBeNull();
    expect(reducer(authed, sessionExpired())).toEqual({
      user: null,
      roles: [],
      status: 'anonymous',
    });
  });
});
