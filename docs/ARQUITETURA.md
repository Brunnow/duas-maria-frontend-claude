# Arquitetura do frontend — Duas Marias

Documento de referência para a modernização do frontend. Define a
**estrutura-alvo** de pastas e as convenções do projeto.

> **Regra de migração:** a estrutura abaixo é adotada de forma
> **incremental**. Não há um _move_ único de pastas. Cada arquivo é
> movido para o novo lugar **quando a fase que o modifica** o tocar.
> Código que já funciona não é movido só por organização.

---

## Estrutura-alvo de `src/`

```
src/
├── main.jsx                 # bootstrap: Provider(redux) + Router + App
├── App.jsx                  # composição de rotas
├── index.css                # Tailwind + tokens de design (@theme)
│
├── app/                     # infraestrutura da aplicação
│   ├── store.js             # configureStore
│   └── router.jsx           # definição de rotas (quando crescer)
│
├── pages/                   # uma pasta/arquivo por rota
│   ├── Home.jsx
│   ├── Catalogo.jsx         # /produtos
│   ├── Produto.jsx          # /produtos/:id
│   ├── Carrinho.jsx         # /carrinho
│   ├── Checkout.jsx         # /checkout
│   ├── Login.jsx            # /login
│   ├── Cadastro.jsx         # /cadastro
│   ├── conta/               # /conta, /pedidos
│   └── admin/               # /admin/*
│
├── components/
│   ├── ui/                  # primitivas do Design System (sem regra de negócio)
│   │   ├── Button.jsx
│   │   ├── Input.jsx
│   │   ├── Select.jsx
│   │   ├── Modal.jsx
│   │   ├── Drawer.jsx
│   │   ├── Badge.jsx
│   │   ├── Price.jsx
│   │   ├── Skeleton.jsx
│   │   ├── Toast.jsx
│   │   └── Container.jsx
│   ├── layout/              # casca do site
│   │   ├── Header.jsx
│   │   ├── Footer.jsx
│   │   ├── MobileMenu.jsx
│   │   └── Layout.jsx       # <Outlet /> + Header + Footer
│   └── shared/              # componentes de domínio reutilizáveis
│       ├── ProductCard.jsx
│       ├── ProductGrid.jsx
│       ├── EmptyState.jsx
│       ├── ErrorState.jsx
│       └── Loader.jsx
│
├── features/               # estado + lógica por domínio (Redux Toolkit)
│   ├── product/
│   ├── cart/
│   ├── auth/
│   └── ui/
│
├── services/              # chamadas à API por domínio (usam src/api/api.js)
│   ├── productService.js
│   ├── cartService.js
│   ├── authService.js
│   └── ...
│
├── hooks/                 # hooks reutilizáveis (useCatalog, useProduct, ...)
├── lib/                   # utilidades puras (format, cn, persist)
└── api/
    └── api.js             # instância única do Axios (ponto central)
```

---

## Convenções

### Imports

- Usar o alias **`@/`** para tudo dentro de `src/` (`import Button from '@/components/ui/Button'`).
- Evitar caminhos relativos profundos (`../../../`).

### Nomenclatura

- **Componentes**: `PascalCase.jsx`, um componente por arquivo, `export default`.
- **Hooks**: `useAlgumaCoisa.js`, `camelCase`.
- **Slices / utilitários / serviços**: `camelCase.js` (`productSlice.js`, `format.js`, `authService.js`).
- **Testes**: coloca-se ao lado do arquivo — `Arquivo.test.js` / `Arquivo.test.jsx`.

### Rotas (em português)

`/` · `/produtos` · `/produtos/:id` · `/carrinho` · `/checkout` ·
`/login` · `/cadastro` · `/conta` · `/pedidos` · `/admin/*`

### Idioma e formatação

- Toda a interface em **pt-BR**.
- Moeda: `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`
  (centralizado em `src/lib/format.js`).

### Estado (Redux)

- Funcionalidades **novas** usam **Redux Toolkit** (`createSlice` / `createAsyncThunk`)
  dentro de `src/features/<dominio>/`.
- Os reducers manuais existentes (`store/reducers/ProductReducer.js`,
  `errorReducer.js`, `store/actions/index.js`) **permanecem** até que uma
  mudança concreta exija tocá-los. Sem migração em massa.

### API

- Uma única instância do Axios em `src/api/api.js`, com `withCredentials: true`
  (autenticação por **cookie JWT** — nada em `localStorage`).
- `api.js` expõe `onUnauthorized(handler)`; em `401` o `authSlice` marca a
  sessão como expirada (`sessionExpired`).
- Nenhuma URL de API espalhada pelo código — sempre via `services/`.
- Configuração por variável de ambiente (`VITE_BACK_END_URL`).
- O CORS do backend libera `http://localhost:5173` com credenciais — o dev
  precisa rodar o Vite nessa porta (padrão).

### Design System

- Antes de criar um componente, verificar se já existe uma primitiva em
  `components/ui/` para a mesma finalidade.
- Tokens de design centralizados no `@theme` de `src/index.css`.
- Evitar valores arbitrários (`w-[450px]`, cores soltas) espalhados pelo código.

### Dependências

- Adicionar bibliotecas **apenas quando a etapa realmente precisar**, uma de cada vez.
- Não substituir tecnologia existente sem necessidade real (ver `CLAUDE.md`).
- Material UI e Emotion **já foram removidos** (na fase Catálogo): as
  primitivas de `components/ui/` cobrem os casos. A base de overlays
  (`Modal`, `Drawer`) usa Headless UI.
- Adicionadas até aqui: `prettier`, `vitest` + `@testing-library/*` +
  `jsdom`, `clsx` + `tailwind-merge`. Removidas: `@mui/material`,
  `@emotion/*`, `react-loader-spinner`.

---

## Estado da migração

| Área                                                               | Situação                                                   |
| ------------------------------------------------------------------ | ---------------------------------------------------------- |
| Tooling (Prettier, alias, Vitest, `.env.example`)                  | ✅ concluído                                               |
| Correção de bugs bloqueantes                                       | ✅ concluído                                               |
| Design System (tokens, fontes, primitivas `ui/`)                   | ✅ fundação concluída (`shared/` evolui com Home/Catálogo) |
| Layout global (`Header`, `Footer`, `MobileMenu`, rota de layout)   | ✅ concluído                                               |
| Home (`Hero` estático + destaques + `ProductCard`/`ProductGrid`)   | ✅ concluído                                               |
| Catálogo (`pages/Catalogo`, `useCatalog` unifica filtros, sidebar) | ✅ concluído (MUI removido; `lint` limpo)                  |
| Página de produto (`pages/Produto`, `/produtos/:id`)               | ✅ código concluído — E2E pendente (reiniciar backend)     |
| Autenticação (`features/auth`, `/login`, `/cadastro`, cookie JWT)  | ✅ código concluído — E2E pendente (reiniciar backend)     |
| Carrinho                                                           | ⏳ próxima (usar endpoints do backend; exige auth)         |
| Conta / Pedidos                                                    | ⬜ pendente (backend: leitura de pedidos)                  |
| Checkout                                                           | ⬜ pendente (pagamento mock)                               |
| Administração                                                      | ⬜ pendente                                                |
| SEO / performance / testes (auditoria)                             | ⬜ pendente                                                |
