O QWERTY é um site que auxilia na montagem de teclados personalizados, permitindo vc escolher quais peças quer


Este projeto foi desenvolvido com o objetivo de criar uma aplicação moderna, funcional e de fácil utilização, utilizando tecnologias atuais do desenvolvimento web. A aplicação foi construída com foco em organização de código, componentização e boas práticas de desenvolvimento.

Tecnologias Utilizadas:
React.js
Vite
TypeScript
Tailwind CSS
Componentes reutilizáveis
Funcionalidades
Interface responsiva e intuitiva
Componentes reutilizáveis para melhor organização
Sistema estruturado para fácil manutenção e escalabilidade
Navegação entre páginas
Estrutura do Projeto

O projeto segue uma estrutura baseada em componentes, facilitando a reutilização e manutenção do código. Cada funcionalidade é separada em arquivos específicos, promovendo melhor organização.

Como Executar o Projeto
Clone o repositório

Instale as dependências:

npm install

Inicie o projeto:

npm run dev

Acesse no navegador:

http://localhost:5173
Considerações

Este projeto foi desenvolvido para fins educacionais e pode ser expandido com novas funcionalidades conforme necessário.

---

## Arquitetura

```text
Usuário → Vercel → React + Vite → Supabase (Auth + PostgreSQL)
```

Não há backend próprio: o front fala direto com o Supabase. A segurança dos dados é feita por Row Level Security (RLS) no banco.

## Como rodar localmente

1. `npm install`
2. Copie `.env.example` para `.env` e preencha com os dados de Supabase > Project Settings > API:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. No Supabase (SQL Editor), rode `supabase/01_schema.sql` e depois `supabase/02_seed.sql`.
4. `npm run dev` (http://localhost:8080)

## Banco de dados

| Tabela | Função |
|---|---|
| `profiles` | Dados do usuário (ligada ao Supabase Auth) |
| `products` | Produtos da loja |
| `builder_parts` | Peças do montador de teclados |
| `cart_items` | Carrinho de quem está logado |
| `saved_builds` | Builds salvas no Dashboard |
| `community_builds` / `community_likes` | Galeria da comunidade e curtidas |

## Deploy na Vercel

Cadastre `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` em Settings > Environment Variables. O `vercel.json` já redireciona todas as rotas para o `index.html` (necessário para o React Router).
