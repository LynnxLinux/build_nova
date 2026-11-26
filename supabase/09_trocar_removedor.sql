-- =====================================================================
-- QWERTY - Troca o "Removedor de Switches" pelo "Kit Removedor de Keycaps e Switches"
-- Rode no Supabase > SQL Editor (so se voce JA tinha rodado o 08 antes).
-- Preco e nota sao ILUSTRATIVOS (projeto academico).
-- =====================================================================
update public.products
set name        = 'Kit Removedor de Keycaps e Switches',
    description = 'Kit com removedor de switches, removedor de keycaps e pincel de limpeza.',
    brand       = 'Lofree',
    price       = 34.99,
    rating      = 4.6,
    image_key   = 'kit-removedor'
where id = 'ac-4';

select id, name, image_key from public.products where id = 'ac-4';
