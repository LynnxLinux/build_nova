-- =====================================================================
-- QWERTY - Schema do Supabase (ETAPA 2)
-- Rode este arquivo INTEIRO no Supabase > SQL Editor > New query > Run.
-- Depois rode o 02_seed.sql.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. PROFILES (1 linha por usuario do Supabase Auth; senha fica no Auth)
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text not null default '',
  email       text,
  created_at  timestamptz not null default now()
);

-- Cria o profile automaticamente quando alguem se cadastra
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, name, email)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'name', ''), split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- 2. PRODUCTS (loja - pagina /products)
-- ---------------------------------------------------------------------
create table if not exists public.products (
  id           text primary key,                       -- ex: 'sw-1' (mesmo id do front)
  name         text not null,
  description  text not null default '',
  category     text not null check (category in ('Switches','Keycaps','Cases','Cables','Accessories')),
  brand        text not null,
  price        numeric(10,2) not null check (price >= 0),
  rating       numeric(2,1) not null default 0 check (rating between 0 and 5),
  image_key    text not null,                          -- chave mapeada para o asset no front
  image_size   text,                                   -- classes tailwind usadas hoje (ex: 'h-48 w-48')
  stock        integer not null default 100 check (stock >= 0),
  active       boolean not null default true,
  created_at   timestamptz not null default now()
);
create index if not exists products_category_idx on public.products (category);
create index if not exists products_brand_idx    on public.products (brand);

-- ---------------------------------------------------------------------
-- 3. BUILDER_PARTS (pecas do montador - pagina /builder)
-- ---------------------------------------------------------------------
create table if not exists public.builder_parts (
  id                text primary key,                  -- ex: 'sw-mx-gateron'
  name              text not null,
  category          text not null check (category in ('switch','keycap','pcb','case')),
  type              text not null check (type in ('MX','Low Profile','Optical')),
  layout            text check (layout in ('60%','65%','75%','TKL','Full')),  -- NULL para switches
  price             numeric(10,2) not null check (price >= 0),
  image             text not null default '',          -- emoji, como no front atual
  description       text not null default '',
  supported_layouts text[],                            -- so para cases (hoje nenhum usa)
  colors            jsonb,                             -- so para cases: [{"id","name","hex"}]
  active            boolean not null default true
);
create index if not exists builder_parts_category_idx on public.builder_parts (category);

-- ---------------------------------------------------------------------
-- 4. CART_ITEMS (carrinho de quem esta logado)
-- Guarda um "retrato" do item (nome/preco/imagem) porque o carrinho
-- tambem recebe builds personalizadas, que nao existem em products.
-- ---------------------------------------------------------------------
create table if not exists public.cart_items (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  item_id     text not null,                           -- id do item no front (ex: 'sw-1' ou 'build-1730000000')
  name        text not null,
  price       numeric(10,2) not null check (price >= 0),
  quantity    integer not null default 1 check (quantity > 0),
  image       text not null default '',
  category    text,
  created_at  timestamptz not null default now(),
  unique (user_id, item_id)
);
create index if not exists cart_items_user_idx on public.cart_items (user_id);

-- ---------------------------------------------------------------------
-- 5. SAVED_BUILDS (builds salvas - Dashboard)
-- As pecas ficam em JSON para nao precisar de tabela extra.
-- ---------------------------------------------------------------------
create table if not exists public.saved_builds (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  name         text not null,
  layout       text not null,
  parts        jsonb not null default '[]'::jsonb,     -- lista de pecas escolhidas
  total_price  numeric(10,2) not null default 0 check (total_price >= 0),
  created_at   timestamptz not null default now()
);
create index if not exists saved_builds_user_idx on public.saved_builds (user_id);

-- ---------------------------------------------------------------------
-- 6. COMMUNITY_BUILDS + COMMUNITY_LIKES (galeria - /community)
-- ---------------------------------------------------------------------
create table if not exists public.community_builds (
  id           text primary key default gen_random_uuid()::text,
  user_id      uuid references auth.users(id) on delete set null,  -- NULL nos exemplos iniciais
  author_name  text not null,
  title        text not null,
  description  text not null default '',
  layout       text not null,
  switches     text not null default '',
  keycaps      text not null default '',
  image_key    text not null,
  likes        integer not null default 0 check (likes >= 0),
  is_public    boolean not null default true,
  created_at   timestamptz not null default now()
);
create index if not exists community_builds_user_idx on public.community_builds (user_id);

create table if not exists public.community_likes (
  build_id    text not null references public.community_builds(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (build_id, user_id)                      -- 1 curtida por usuario por build
);

-- Mantem community_builds.likes em dia automaticamente
create or replace function public.sync_community_likes()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    update public.community_builds set likes = likes + 1 where id = new.build_id;
    return new;
  else
    update public.community_builds set likes = greatest(likes - 1, 0) where id = old.build_id;
    return old;
  end if;
end;
$$;

drop trigger if exists community_likes_sync on public.community_likes;
create trigger community_likes_sync
  after insert or delete on public.community_likes
  for each row execute function public.sync_community_likes();

-- =====================================================================
-- ROW LEVEL SECURITY
-- =====================================================================
alter table public.profiles         enable row level security;
alter table public.products         enable row level security;
alter table public.builder_parts    enable row level security;
alter table public.cart_items       enable row level security;
alter table public.saved_builds     enable row level security;
alter table public.community_builds enable row level security;
alter table public.community_likes  enable row level security;

-- profiles: so o proprio usuario
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- products / builder_parts: qualquer visitante le os ativos; ninguem escreve pelo front
drop policy if exists "products_public_read" on public.products;
create policy "products_public_read" on public.products
  for select to anon, authenticated using (active);
drop policy if exists "builder_parts_public_read" on public.builder_parts;
create policy "builder_parts_public_read" on public.builder_parts
  for select to anon, authenticated using (active);

-- cart_items: so o proprio carrinho
drop policy if exists "cart_own_all" on public.cart_items;
create policy "cart_own_all" on public.cart_items
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- saved_builds: so as proprias builds
drop policy if exists "saved_builds_own_all" on public.saved_builds;
create policy "saved_builds_own_all" on public.saved_builds
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- community_builds: todos leem as publicas; cada um gerencia as suas
drop policy if exists "community_public_read" on public.community_builds;
create policy "community_public_read" on public.community_builds
  for select to anon, authenticated using (is_public);
drop policy if exists "community_insert_own" on public.community_builds;
create policy "community_insert_own" on public.community_builds
  for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists "community_update_own" on public.community_builds;
create policy "community_update_own" on public.community_builds
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists "community_delete_own" on public.community_builds;
create policy "community_delete_own" on public.community_builds
  for delete to authenticated using (user_id = (select auth.uid()));

-- community_likes: todos veem; cada um cura/descura com o proprio usuario
drop policy if exists "likes_public_read" on public.community_likes;
create policy "likes_public_read" on public.community_likes
  for select to anon, authenticated using (true);
drop policy if exists "likes_insert_own" on public.community_likes;
create policy "likes_insert_own" on public.community_likes
  for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists "likes_delete_own" on public.community_likes;
create policy "likes_delete_own" on public.community_likes
  for delete to authenticated using (user_id = (select auth.uid()));

-- =====================================================================
-- GRANTS (garante que a API do Supabase enxerga as tabelas; o RLS acima
-- continua decidindo QUEM acessa QUAL linha)
-- =====================================================================
grant usage on schema public to anon, authenticated;

grant select on public.products, public.builder_parts,
                public.community_builds, public.community_likes to anon, authenticated;

grant select, update                  on public.profiles         to authenticated;
grant select, insert, update, delete  on public.cart_items       to authenticated;
grant select, insert, update, delete  on public.saved_builds     to authenticated;
grant insert, update, delete          on public.community_builds to authenticated;
grant insert, delete                  on public.community_likes  to authenticated;
