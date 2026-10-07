-- 1) Veja o que está gravado hoje nos 3 produtos sem imagem:
select id, name, image_key from public.products where id in ('kc-3','cb-2','ac-2');

-- 2) Corrige as chaves para as que o front conhece (src/data/productImages.ts):
update public.products
set image_key = case id
  when 'kc-3' then 'mt3-susuwatari'
  when 'cb-2' then 'cabo-reto'
  when 'ac-2' then 'case-transporte'
end
where id in ('kc-3','cb-2','ac-2');
