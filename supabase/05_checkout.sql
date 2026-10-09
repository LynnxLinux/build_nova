-- =====================================================================
-- QWERTY - Checkout: enderecos, frete, pedidos e pagamento
-- Rode no Supabase > SQL Editor DEPOIS do 04. Pode rodar mais de uma vez.
--
-- Como funciona (resumo):
--  * o usuario cadastra enderecos (tabela addresses)
--  * o frete e SIMULADO por regiao do Brasil (tabela shipping_rates)
--  * o pedido e criado pela funcao create_order(), que RECALCULA os precos
--    no servidor (o front nao consegue "baratear" o pedido)
--  * quem marca o pedido como pago e o servidor (api/payments.ts), nunca o front
-- =====================================================================

-- 1) Carrinho: guardar as pecas das builds personalizadas ----------------
alter table public.cart_items add column if not exists parts jsonb;

-- 2) Enderecos ---------------------------------------------------------
create table if not exists public.addresses (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  recipient_name  text not null,
  phone           text not null,
  cep             text not null check (cep ~ '^[0-9]{8}$'),
  street          text not null,
  number          text not null,
  complement      text,
  neighborhood    text not null,
  city            text not null,
  state           text not null check (state ~ '^[A-Z]{2}$'),
  created_at      timestamptz not null default now()
);
create index if not exists addresses_user_idx on public.addresses (user_id);

-- 3) Tabela de frete simulado (por regiao) -------------------------------
create table if not exists public.shipping_rates (
  region  text not null check (region in ('Sudeste','Sul','Centro-Oeste','Nordeste','Norte')),
  method  text not null check (method in ('pac','sedex')),
  label   text not null,
  price   numeric(10,2) not null check (price >= 0),
  days    integer not null check (days > 0),
  primary key (region, method)
);

insert into public.shipping_rates (region, method, label, price, days) values
 ('Sudeste','pac','PAC',19.90,5),        ('Sudeste','sedex','SEDEX',34.90,2),
 ('Sul','pac','PAC',24.90,6),            ('Sul','sedex','SEDEX',42.90,3),
 ('Centro-Oeste','pac','PAC',29.90,7),   ('Centro-Oeste','sedex','SEDEX',49.90,4),
 ('Nordeste','pac','PAC',34.90,9),       ('Nordeste','sedex','SEDEX',59.90,5),
 ('Norte','pac','PAC',44.90,12),         ('Norte','sedex','SEDEX',74.90,7)
on conflict (region, method) do nothing;

create or replace function public.uf_region(p_uf text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case upper(p_uf)
    when 'SP' then 'Sudeste' when 'RJ' then 'Sudeste' when 'MG' then 'Sudeste' when 'ES' then 'Sudeste'
    when 'PR' then 'Sul' when 'SC' then 'Sul' when 'RS' then 'Sul'
    when 'DF' then 'Centro-Oeste' when 'GO' then 'Centro-Oeste' when 'MT' then 'Centro-Oeste' when 'MS' then 'Centro-Oeste'
    when 'AL' then 'Nordeste' when 'BA' then 'Nordeste' when 'CE' then 'Nordeste' when 'MA' then 'Nordeste'
    when 'PB' then 'Nordeste' when 'PE' then 'Nordeste' when 'PI' then 'Nordeste' when 'RN' then 'Nordeste' when 'SE' then 'Nordeste'
    when 'AC' then 'Norte' when 'AM' then 'Norte' when 'AP' then 'Norte' when 'PA' then 'Norte'
    when 'RO' then 'Norte' when 'RR' then 'Norte' when 'TO' then 'Norte'
    else null end;
$$;

-- Opcoes de frete para uma UF (usada pelo front e pelo create_order)
create or replace function public.shipping_options(p_uf text)
returns table (method text, label text, price numeric, days integer)
language sql
stable
set search_path = ''
as $$
  select r.method, r.label, r.price, r.days
  from public.shipping_rates r
  where r.region = public.uf_region(p_uf)
  order by r.price;
$$;

-- 4) Pedidos -----------------------------------------------------------
create table if not exists public.orders (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  status            text not null default 'pending' check (status in ('pending','paid','failed','cancelled')),
  subtotal          numeric(10,2) not null default 0 check (subtotal >= 0),
  shipping_cost     numeric(10,2) not null default 0 check (shipping_cost >= 0),
  shipping_method   text not null,
  shipping_days     integer not null,
  total             numeric(10,2) not null default 0 check (total >= 0),
  address           jsonb not null,                      -- copia do endereco no momento da compra
  payment_provider  text not null default 'mercadopago',
  payment_id        text,
  preference_id     text,
  created_at        timestamptz not null default now(),
  paid_at           timestamptz
);
create index if not exists orders_user_idx on public.orders (user_id, created_at desc);

create table if not exists public.order_items (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references public.orders(id) on delete cascade,
  item_id     text not null,
  name        text not null,
  unit_price  numeric(10,2) not null check (unit_price >= 0),
  quantity    integer not null check (quantity > 0),
  category    text,
  image       text,
  parts       jsonb
);
create index if not exists order_items_order_idx on public.order_items (order_id);

-- 5) Preco de uma lista de pecas (NULL se alguma peca nao existe/esta inativa)
create or replace function public.parts_price(p_ids jsonb)
returns numeric
language sql
stable
set search_path = ''
as $$
  select case
    when p_ids is not null
     and jsonb_typeof(p_ids) = 'array'
     and jsonb_array_length(p_ids) > 0
     and (select count(*) from public.builder_parts bp
          where bp.active and bp.id in (select jsonb_array_elements_text(p_ids))) = jsonb_array_length(p_ids)
    then (select sum(bp.price) from public.builder_parts bp
          where bp.active and bp.id in (select jsonb_array_elements_text(p_ids)))
    else null end;
$$;

-- 6) Criar pedido a partir do carrinho (precos recalculados no servidor) --
create or replace function public.create_order(p_address_id uuid, p_shipping_method text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user     uuid := auth.uid();
  v_addr     public.addresses;
  v_rate     record;
  v_order_id uuid;
  v_item     record;
  v_price    numeric(10,2);
  v_subtotal numeric(10,2) := 0;
  v_count    integer := 0;
begin
  if v_user is null then
    raise exception 'not_authenticated';
  end if;

  select * into v_addr from public.addresses where id = p_address_id and user_id = v_user;
  if not found then
    raise exception 'address_not_found';
  end if;

  select * into v_rate from public.shipping_options(v_addr.state) o where o.method = p_shipping_method;
  if not found then
    raise exception 'invalid_shipping';
  end if;

  insert into public.orders (user_id, status, shipping_cost, shipping_method, shipping_days, address)
  values (v_user, 'pending', v_rate.price, v_rate.label, v_rate.days, to_jsonb(v_addr) - 'user_id')
  returning id into v_order_id;

  for v_item in select * from public.cart_items where user_id = v_user loop
    v_price := null;

    if v_item.item_id like 'community-%' then
      select public.parts_price(cb.parts) into v_price
      from public.community_builds cb
      where cb.id = substr(v_item.item_id, 11) and cb.is_public;
    elsif v_item.item_id like 'build-%' then
      v_price := public.parts_price(v_item.parts);
    else
      select p.price into v_price from public.products p where p.id = v_item.item_id and p.active;
    end if;

    if v_price is null then
      raise exception 'invalid_item: %', v_item.name;
    end if;

    insert into public.order_items (order_id, item_id, name, unit_price, quantity, category, image, parts)
    values (v_order_id, v_item.item_id, v_item.name, v_price, v_item.quantity, v_item.category, v_item.image, v_item.parts);

    v_subtotal := v_subtotal + v_price * v_item.quantity;
    v_count := v_count + 1;
  end loop;

  if v_count = 0 then
    raise exception 'empty_cart';
  end if;

  update public.orders
  set subtotal = v_subtotal, total = v_subtotal + v_rate.price
  where id = v_order_id;

  return v_order_id;
end;
$$;

revoke all on function public.create_order(uuid, text) from public, anon;
grant execute on function public.create_order(uuid, text) to authenticated;
grant execute on function public.shipping_options(text) to anon, authenticated;
grant execute on function public.uf_region(text) to anon, authenticated;
grant execute on function public.parts_price(jsonb) to anon, authenticated;

-- 7) RLS ---------------------------------------------------------------
alter table public.addresses      enable row level security;
alter table public.shipping_rates enable row level security;
alter table public.orders         enable row level security;
alter table public.order_items    enable row level security;

drop policy if exists "addresses_own_all" on public.addresses;
create policy "addresses_own_all" on public.addresses
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists "shipping_rates_public_read" on public.shipping_rates;
create policy "shipping_rates_public_read" on public.shipping_rates
  for select to anon, authenticated using (true);

-- pedidos: o usuario so LE os proprios (criar = create_order; pagar = servidor)
drop policy if exists "orders_select_own" on public.orders;
create policy "orders_select_own" on public.orders
  for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists "order_items_select_own" on public.order_items;
create policy "order_items_select_own" on public.order_items
  for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = (select auth.uid())));

grant select, insert, update, delete on public.addresses to authenticated;
grant select on public.shipping_rates to anon, authenticated;
grant select on public.orders, public.order_items to authenticated;
