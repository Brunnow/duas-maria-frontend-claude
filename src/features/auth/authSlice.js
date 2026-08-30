import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import * as authService from '@/services/authService';

/*
 * Estado de autenticacao. Feature nova -> Redux Toolkit (convencao do
 * projeto). Nao mexe nos reducers manuais existentes.
 *
 * status: 'idle'   -> ainda nao verificou a sessao
 *         'loading'-> verificando a sessao (bootstrap)
 *         'authenticated'
 *         'anonymous'
 */
const initialState = {
  user: null, // { id, username, roles }
  roles: [],
  status: 'idle',
};

/** Recupera a sessao a partir do cookie ao carregar o app. Silencioso em falha. */
export const bootstrapSession = createAsyncThunk(
  'auth/bootstrap',
  async (_, { rejectWithValue }) => {
    try {
      return await authService.currentUser();
    } catch {
      return rejectWithValue(null);
    }
  },
);

export const login = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    await authService.signin(credentials);
    // /user e a fonte canonica (id, roles atualizados).
    return await authService.currentUser();
  } catch (err) {
    const status = err?.response?.status;
    return rejectWithValue(
      status === 404 || status === 401
        ? 'Usuário ou senha inválidos.'
        : 'Não foi possível entrar. Tente novamente.',
    );
  }
});

export const register = createAsyncThunk('auth/register', async (data, { rejectWithValue }) => {
  try {
    return await authService.signup(data);
  } catch (err) {
    const message = err?.response?.data?.message || '';
    if (message.includes('Username'))
      return rejectWithValue('Este nome de usuário já está em uso.');
    if (message.includes('Email')) return rejectWithValue('Este e-mail já está cadastrado.');
    return rejectWithValue('Não foi possível concluir o cadastro. Tente novamente.');
  }
});

export const logout = createAsyncThunk('auth/logout', async () => {
  try {
    await authService.signout();
  } catch {
    // Ignora erro de rede — a sessao local e limpa de qualquer forma.
  }
});

const setAuthenticated = (state, user) => {
  state.user = user;
  state.roles = user?.roles || [];
  state.status = 'authenticated';
};

const setAnonymous = (state) => {
  state.user = null;
  state.roles = [];
  state.status = 'anonymous';
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /** Chamado pelo interceptor de 401 (sessao expirou/invalida). */
    sessionExpired: setAnonymous,
  },
  extraReducers: (builder) => {
    builder
      .addCase(bootstrapSession.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(bootstrapSession.fulfilled, (state, action) =>
        setAuthenticated(state, action.payload),
      )
      .addCase(bootstrapSession.rejected, setAnonymous)
      .addCase(login.fulfilled, (state, action) => setAuthenticated(state, action.payload))
      .addCase(login.rejected, setAnonymous)
      .addCase(logout.fulfilled, setAnonymous);
  },
});

export const { sessionExpired } = authSlice.actions;
export default authSlice.reducer;

export const selectAuth = (state) => state.auth;
export const selectIsAuthenticated = (state) => state.auth.status === 'authenticated';
