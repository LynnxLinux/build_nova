-- =====================================================================
-- QWERTY - Home, Comunidade e Montador 3D
-- Rode no Supabase > SQL Editor DEPOIS do 01, 02 (e 03 se precisou).
-- Pode rodar mais de uma vez sem duplicar.
-- ATENCAO: os numeros de vendas e as builds da comunidade abaixo sao
-- DADOS DE EXEMPLO para a apresentacao (ainda nao existe tabela de pedidos).
-- =====================================================================

-- 1) Novas colunas -----------------------------------------------------
alter table public.products
  add column if not exists sales_count integer not null default 0 check (sales_count >= 0);

alter table public.community_builds
  add column if not exists is_featured boolean not null default false,
  add column if not exists parts jsonb not null default '[]'::jsonb;  -- ids de builder_parts

-- 2) Catalogo do montador ---------------------------------------------
-- Pecas Full (antes nao existia PCB nem case para o layout Full)
insert into public.builder_parts (id, name, category, type, layout, price, image, description) values
 ('pcb-mx-full','PCB Full Size Hot-swap','pcb','MX','Full',110.00,'🔧','PCB MX hot-swap para builds Full Size com numpad.'),
 ('cs-full-alu','Case de Alumínio Full Size','case','MX','Full',159.99,'🔲','Case de alumínio CNC para PCBs Full Size.')
on conflict (id) do nothing;

-- MT3 passa a cobrir ate Full (kit completo)
update public.builder_parts
set layout = 'Full',
    description = 'Keycaps MX de perfil alto, kit completo (cobre até o layout Full).'
where id = 'kc-mx-retro';

-- Cores dos cases (aparece o seletor de cor e tinge o modelo 3D)
update public.builder_parts
set colors = '[
  {"id":"black","name":"Preto","hex":"#2a2a2e"},
  {"id":"white","name":"Branco","hex":"#e8e8ea"},
  {"id":"gray","name":"Cinza","hex":"#6b7280"},
  {"id":"blue","name":"Azul","hex":"#1e3a5f"},
  {"id":"purple","name":"Roxo","hex":"#4c1d95"}
]'::jsonb
where category = 'case' and colors is null;

-- 3) Mais vendidos (EXEMPLO) ------------------------------------------
update public.products
set sales_count = case id
  when 'sw-1' then 214 when 'kc-1' then 187 when 'cb-1' then 163 when 'cs-1' then 142
  when 'sw-3' then 120 when 'kc-2' then 98  when 'sw-2' then 87  when 'kc-3' then 64
  when 'cs-2' then 51  when 'ac-1' then 40  when 'cb-2' then 33  when 'ac-2' then 21
  else sales_count end;

-- 4) Builds da comunidade: pecas reais do catalogo --------------------
-- Nova build para os "Teclados em destaque"
insert into public.community_builds (id, author_name, title, description, likes, layout, switches, keycaps, image_key) values
 ('b7','AnaKeys','Branco Ártico','Build TKL de visual limpo, com case Bakeneko e keycaps PBT Botanical.',142,'TKL','Cherry MX Blue (Clicky)','Keycaps PBT Botanical','branco-artico')
on conflict (id) do nothing;

-- Cada build agora aponta para pecas compativeis entre si (builder_parts)
update public.community_builds set parts='["sw-mx-holy","kc-mx-minimal","pcb-mx-75","cs-75-alu"]'::jsonb,
  switches='Holy Panda (Táctil)', keycaps='Keycaps MX Pretas Minimalistas', is_featured=true,
  description='Build 75% em alumínio escuro, com switches táteis Holy Panda e keycaps pretas minimalistas.' where id='b1';
update public.community_builds set parts='["sw-mx-holy","kc-mx-botanical","pcb-mx-65","cs-65-alu"]'::jsonb,
  switches='Holy Panda (Táctil)', keycaps='Keycaps PBT Botanical',
  description='Build 65% com keycaps PBT Botanical, switches Holy Panda e case de alumínio Tofu65.' where id='b2';
update public.community_builds set parts='["sw-mx-cherry","kc-mx-retro","pcb-mx-full","cs-full-alu"]'::jsonb,
  switches='Cherry MX Blue (Clicky)', keycaps='Keycaps MT3 Susuwatari',
  description='Build Full Size com visual retrô: keycaps MT3 Susuwatari e switches clicky Cherry MX Blue.' where id='b3';
update public.community_builds set parts='["sw-mx-gateron","kc-mx-minimal","pcb-mx-65","cs-65-alu"]'::jsonb,
  switches='Gateron Oil King (Linear)', keycaps='Keycaps MX Pretas Minimalistas',
  description='Build 65% toda escura com switches lineares Gateron Oil King e case de alumínio.' where id='b4';
update public.community_builds set parts='["sw-mx-gateron","kc-mx-laser","pcb-mx-full","cs-full-alu"]'::jsonb,
  switches='Gateron Oil King (Linear)', keycaps='Keycaps GMK Laser', is_featured=true,
  description='Build Full Size colorida com keycaps GMK Laser e switches lineares Gateron Oil King.' where id='b5';
update public.community_builds set parts='["sw-lp-cherry","kc-lp-white","pcb-lp-75","cs-lp-75"]'::jsonb,
  switches='Cherry MX Low Profile Red', keycaps='Keycaps Low Profile Brancas',
  description='Build 75% slim e clara, com switches e keycaps low profile.' where id='b6';
update public.community_builds set parts='["sw-mx-cherry","kc-mx-botanical","pcb-mx-tkl","cs-tkl-poly"]'::jsonb,
  is_featured=true where id='b7';
