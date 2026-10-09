-- =====================================================================
-- QWERTY - Painel de administrador e novos status de pedido
-- Rode no Supabase > SQL Editor DEPOIS do 05. Pode rodar mais de uma vez.
--
-- DEPOIS de rodar, torne a SUA conta administradora (troque o e-mail):
--   update public.profiles set is_admin = true where email = 'seu@email.com';
-- =====================================================================

-- 1) Marca de administrador ----------------------------------------------
alter table public.profiles add column if not exists is_admin boolean not null default false;

-- SEGURANCA: o usuario so pode editar o NOME do proprio perfil.
-- Sem isso ele poderia se promover a admin editando is_admin pelo navegador.
revoke update on public.profiles from authenticated;
grant update (name) on public.profiles to authenticated;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select p.is_admin from public.profiles p where p.id = (select auth.uid())), false);
$$;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- 2) Novos status: enviado e entregue ---------------------------------------
alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check
  check (status in ('pending','paid','shipped','delivered','failed','cancelled'));

-- 3) Politicas do administrador ---------------------------------------------
drop policy if exists "orders_admin_select" on public.orders;
create policy "orders_admin_select" on public.orders
  for select to authenticated using (public.is_admin());

drop policy if exists "order_items_admin_select" on public.order_items;
create policy "order_items_admin_select" on public.order_items
  for select to authenticated using (public.is_admin());

-- admin so consegue alterar o STATUS do pedido (nao valores nem enderecos)
drop policy if exists "orders_admin_update" on public.orders;
create policy "orders_admin_update" on public.orders
  for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
grant update (status) on public.orders to authenticated;

-- admin ve produtos inativos e edita preco, estoque e ativo
drop policy if exists "products_admin_select" on public.products;
create policy "products_admin_select" on public.products
  for select to authenticated using (public.is_admin());

drop policy if exists "products_admin_update" on public.products;
create policy "products_admin_update" on public.products
  for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
grant update (price, stock, active) on public.products to authenticated;
