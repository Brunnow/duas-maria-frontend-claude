# Duas Marias — Frontend

## Objetivo do projeto

Este é o frontend do e-commerce Duas Marias.

O objetivo atual é transformar o frontend existente em um
e-commerce moderno de roupas, com uma experiência visual profissional,
responsiva e consistente.

Este NÃO deve ser tratado como um projeto novo.

Existe uma implementação anterior que deve ser aproveitada sempre que
possível, especialmente a integração existente com a API.

A prioridade é evoluir o projeto de forma incremental, preservando
funcionalidades que já funcionam.

---

# Stack atual

- React 19
- Vite
- JavaScript
- React Router
- Redux
- Redux Toolkit
- Axios
- Tailwind CSS 4
- Material UI
- Swiper
- ESLint

Antes de substituir qualquer tecnologia ou biblioteca existente,
verifique se existe uma necessidade real.

Não trocar a stack simplesmente por preferência.

---

# Arquitetura atual

A estrutura atual inclui:

Existe uma API backend separada desenvolvida em Spring Boot.

O frontend deve consumir a API existente em vez de duplicar regras
de negócio no cliente.

---

# Objetivo visual

O frontend deve evoluir para uma experiência de e-commerce
moderno de moda/roupas.

A interface deve transmitir:

- elegância
- modernidade
- simplicidade
- confiança
- qualidade
- identidade de marca
- boa experiência de compra

Evitar aparência de template genérico ou projeto acadêmico.

Remover progressivamente conteúdos placeholder existentes.

Não utilizar imagens, textos ou banners de terceiros como parte
definitiva da identidade da Duas Marias.

---

# Design System

Criar e manter um sistema visual consistente.

Antes de criar novos componentes, verificar se já existe um componente
reutilizável para a mesma finalidade.

Priorizar:

- tipografia consistente
- espaçamento consistente
- bordas e raios consistentes
- hierarquia visual clara
- estados de hover
- estados de loading
- estados vazios
- estados de erro
- feedback visual para ações do usuário

Evitar valores arbitrários espalhados pelo código.

Quando possível, centralizar tokens de design.

---

# Responsividade

O site deve funcionar corretamente em:

- celular
- tablet
- notebook
- desktop

Mobile-first deve ser considerado sempre que fizer sentido.

Não criar uma interface que funcione apenas em desktop.

Após implementar uma funcionalidade visual importante,
verificar também o comportamento em telas pequenas.

---

# E-commerce

O frontend deverá evoluir para possuir, progressivamente:

## Área pública

- Home
- catálogo
- categorias
- busca
- filtros
- ordenação
- página de produto
- detalhes do produto
- seleção de quantidade
- carrinho

## Autenticação

- login
- cadastro
- logout
- recuperação de sessão
- proteção de rotas privadas

## Usuário

- perfil
- endereços
- pedidos
- detalhes do pedido

## Checkout

- carrinho
- endereço
- forma de pagamento
- revisão do pedido
- confirmação do pedido

## Administração

- dashboard
- produtos
- categorias
- upload de imagens
- edição
- exclusão
- controle de estoque

---

# Home Page

A Home deve deixar de parecer um template de curso.

A estrutura deve evoluir para algo semelhante a uma loja profissional
de moda.

Possíveis seções:

- Header/Navbar
- Hero/Banner principal
- categorias em destaque
- produtos em destaque
- lançamentos
- ofertas
- seção institucional
- benefícios da loja
- newsletter, se fizer sentido
- Footer

Não implementar todas essas seções automaticamente.

Antes de adicionar uma nova seção, avaliar se ela realmente contribui
para a experiência do usuário.

---

# Catálogo

A página de produtos já possui funcionalidades importantes:

- produtos
- categorias
- busca
- filtro
- ordenação
- paginação
- query string

Essas funcionalidades devem ser preservadas.

A interface pode ser completamente refinada visualmente sem quebrar
a lógica existente.

O catálogo deve evoluir para uma experiência moderna de loja de roupas.

Considerar:

- filtros por categoria
- faixa de preço
- ordenação
- busca
- cards de produto
- indicação de estoque
- preço promocional
- desconto
- paginação ou carregamento apropriado
- estados de loading
- estado sem resultados

---

# Product Card

O ProductCard é um componente importante do projeto.

Ele deve possuir uma aparência profissional e consistente.

Considerar:

- imagem
- nome
- preço
- preço promocional
- percentual de desconto
- disponibilidade
- botão de adicionar ao carrinho
- ação para visualizar detalhes
- estados de hover

Não exagerar em elementos visuais.

O produto deve ser o foco principal.

---

# Página de produto

O projeto deve evoluir de um simples modal para uma experiência
de produto adequada a um e-commerce.

Considerar:

- imagem principal
- galeria de imagens
- nome
- descrição
- preço
- preço promocional
- desconto
- estoque
- quantidade
- adicionar ao carrinho
- informações relevantes
- navegação para produtos relacionados

Se alguma informação não existir na API, verificar primeiro o backend
antes de inventar dados.

---

# Carrinho

O botão "Adicionar" atualmente precisa ser integrado ao backend.

Implementar progressivamente:

- adicionar produto
- remover produto
- alterar quantidade
- subtotal
- total
- quantidade total de itens
- estado vazio
- loading
- erros

O carrinho deve utilizar os endpoints existentes no backend.

Não criar uma segunda regra de negócio de carrinho no frontend.

---

# Autenticação

O backend utiliza Spring Security + JWT.

O frontend deve respeitar o mecanismo de autenticação existente.

As requisições autenticadas devem utilizar:

withCredentials: true

Não armazenar JWT ou credenciais de forma insegura no localStorage
se o backend estiver utilizando cookie para autenticação.

Implementar:

- login
- cadastro
- logout
- usuário atual
- proteção de rotas
- tratamento de 401
- estado de autenticação

---

# Redux

O projeto possui Redux e algumas partes ainda utilizam o padrão
manual de actions/reducers.

Ao adicionar novas funcionalidades importantes, preferir
Redux Toolkit quando isso simplificar a implementação.

Não migrar todo o Redux existente automaticamente.

Evitar uma grande refatoração sem necessidade.

Migrações devem acontecer gradualmente.

---

# API

A API está localizada no backend separado.

Utilizar o arquivo:

src/api/api.js

como ponto central para configuração do Axios.

Não espalhar URLs da API pelo projeto.

Utilizar variáveis de ambiente.

Exemplo:

VITE_BACK_END_URL

Nunca colocar:

- senha
- token
- secret
- chave privada

diretamente no código.

---

# Componentização

Priorizar componentes reutilizáveis.

Exemplos:

- Button
- Input
- Modal
- ProductCard
- ProductGrid
- Loader
- Status
- Pagination
- Navbar
- Footer
- EmptyState
- ErrorState

Não criar componentes excessivamente pequenos sem necessidade.

Também não colocar toda a lógica da aplicação dentro de um único
componente.

---

# UX

A experiência do usuário deve ser prioridade.

Toda ação assíncrona importante deve possuir estados apropriados:

- loading
- sucesso
- erro
- vazio

Evitar telas que simplesmente "não mostram nada" enquanto uma API
está sendo carregada.

Erros da API devem ser apresentados de forma compreensível.

Evitar mensagens técnicas diretamente para o usuário final.

---

# Acessibilidade

Considerar:

- textos alternativos em imagens
- labels em inputs
- navegação por teclado
- contraste adequado
- foco visível
- botões semanticamente corretos
- elementos interativos acessíveis

Não utilizar elementos HTML não interativos como substitutos de botões
quando uma ação precisa ser executada.

---

# SEO e URLs

Quando fizer sentido, utilizar URLs amigáveis.

Não quebrar as rotas existentes sem verificar seus usos.

---

# Código existente

IMPORTANTE:

Antes de alterar um componente existente:

1. Leia o arquivo completo.
2. Entenda sua função.
3. Procure onde ele é utilizado.
4. Verifique se existe dependência com Redux/API.
5. Preserve comportamentos que já funcionam.
6. Faça alterações incrementais.

Não reescrever componentes inteiros apenas para mudar algumas partes.

---

# Identidade Duas Marias

O frontend deverá abandonar gradualmente:

- banners de exemplo
- textos genéricos
- imagens externas de demonstração
- referências ao curso/template
- conteúdo que não tenha relação com a marca

A identidade visual definitiva deve ser construída de forma
consistente em todo o site.

Quando não houver informação suficiente sobre a identidade da marca,
não inventar uma identidade definitiva.

Propor opções e solicitar decisão quando uma escolha de branding
for importante.

---

# Imagens

Priorizar imagens locais ou fontes devidamente autorizadas.

Não depender de URLs externas de terceiros para elementos essenciais
da aplicação.


---

# Segurança

Nunca:

- expor secrets
- expor tokens
- colocar credenciais no código
- ignorar erros de autenticação

- criar soluções que contornem a segurança do backend

Não modificar a autenticação do backend sem necessidade.

---

# Git

Este é o repositório de desenvolvimento com Claude Code.

O repositório original do projeto deve permanecer intacto.

IMPORTANTE:

- Nunca executar git push --force.
- Nunca apagar commits.
- Nunca reescrever o histórico sem autorização explícita.
- Antes de mudanças grandes, verificar git status.
- Fazer commits pequenos e descritivos.
- Não fazer commits gigantes contendo dezenas de funcionalidades diferentes.

Após concluir uma etapa importante:

1. testar;
2. verificar git diff;
3. verificar git status;
4. informar as alterações;
5. aguardar confirmação quando a mudança for grande.

---

# Regra de trabalho com Claude

Não implemente várias grandes funcionalidades simultaneamente.

Trabalhar em etapas.

Para cada etapa:

1. analisar;
2. planejar;
3. implementar;
4. testar;
5. corrigir;
6. resumir alterações.

Se uma decisão puder alterar significativamente a arquitetura,
apresente a decisão antes de implementá-la.

---

# Não fazer

Não:

- trocar React por outro framework;
- trocar Vite sem motivo;
- trocar Tailwind sem motivo;
- remover Redux sem avaliar impacto;
- instalar dezenas de bibliotecas para resolver problemas simples;
- reescrever todo o projeto;
- criar um novo backend;
- duplicar funcionalidades existentes;
- remover funcionalidades funcionando sem justificativa;
- alterar o contrato da API sem avaliar o backend.

---

# Qualidade

Antes de considerar uma funcionalidade concluída:

- verificar console do navegador;
- verificar erros de React;
- verificar chamadas da API;
- verificar estados de loading;
- verificar erros;
- verificar responsividade;
- executar npm run build;
- executar npm run lint quando disponível.

---

# Estado inicial conhecido

O frontend atualmente possui:

- Home
- HeroBanner
- catálogo
- filtros
- busca
- ordenação
- paginação
- ProductCard
- ProductViewModal
- Redux para produtos/categorias
- integração Axios com backend

O frontend ainda precisa evoluir principalmente em:

- autenticação
- layout global
- carrinho
- checkout
- pedidos
- perfil
- página de produto
- área administrativa
- identidade visual da Duas Marias

O diagnóstico inicial completo foi realizado antes do desenvolvimento
com Claude Code.

---

# Regra principal

Este projeto deve evoluir de:

"frontend de curso/template"

para:

"e-commerce moderno e profissional de roupas Duas Marias".

Priorize:

1. estabilidade;
2. experiência do usuário;
3. design consistente;
4. reutilização de código;
5. integração correta com o backend;
6. responsividade;
7. segurança;
8. manutenção futura.

Não priorize velocidade em detrimento da qualidade.