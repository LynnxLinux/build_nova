-- =====================================================================
-- QWERTY - Mais produtos na loja (pedido do orientador: pelo menos 5 por categoria)
-- Rode no Supabase > SQL Editor. Pode rodar mais de uma vez sem duplicar.
-- ATENCAO: nomes, marcas e precos novos sao ILUSTRATIVOS (projeto academico).
-- As imagens novas sao ilustracoes geradas para o projeto (src/assets/produtos).
-- Resultado: 6 produtos em cada uma das 5 categorias (30 no total).
-- =====================================================================

insert into public.products (id, name, description, category, brand, price, rating, image_key, image_size, stock) values
 ('sw-4','Kailh Box White (Clicky)','Switches clicky com haste Box, clique firme e resistentes à poeira.','Switches','Kailh',36.99,4.6,'switch-kailh-white','h-48 w-48',100),
 ('sw-5','Gateron Yellow (Linear)','Switches lineares econômicos, suaves e consistentes.','Switches','Gateron',29.99,4.5,'switch-gateron-yellow','h-48 w-48',100),
 ('sw-6','Akko CS Jelly Pink (Táctil)','Switches táteis com bump marcado e digitação macia.','Switches','Akko',39.99,4.6,'switch-akko-pink','h-48 w-48',100),
 ('kc-4','Keycaps PBT Cherry Profile Pretas','Kit PBT perfil Cherry com textura fosca e legendas nítidas.','Keycaps','Qwerty',79.99,4.6,'keycaps-pbt-preto','h-48 w-48',100),
 ('kc-5','Keycaps PBT Branco Ártico','Kit PBT branco com legendas em cinza, visual limpo e minimalista.','Keycaps','Qwerty',74.99,4.5,'keycaps-pbt-artico','h-48 w-48',100),
 ('kc-6','Keycaps XDA Pastel','Kit PBT perfil XDA plano em tons pastel.','Keycaps','Qwerty',64.99,4.4,'keycaps-xda-pastel','h-48 w-48',100),
 ('cs-3','Case de Alumínio Tofu60','Case de alumínio CNC para teclados 60%.','Cases','KBDFans',109.99,4.6,'case-tofu60','h-48 w-48',100),
 ('cs-4','Case de Alumínio Tofu84','Case de alumínio CNC para teclados 75% (84 teclas).','Cases','KBDFans',139.99,4.7,'case-tofu84','h-48 w-48',100),
 ('cs-5','Case Bakeneko65','Case 65% com montagem gasket e visual elegante.','Cases','CannonKeys',94.99,4.6,'case-bakeneko65','h-48 w-48',100),
 ('cs-6','Case Acrílico Transparente 65%','Case acrílico transparente para teclados 65%, ideal para RGB.','Cases','Qwerty',74.99,4.3,'case-acrilico65','h-48 w-48',100),
 ('cb-3','Cabo USB-C Coiled Branco','Cabo coiled branco com conector USB-C e acabamento trançado.','Cables','CruzCtrl',49.99,4.7,'cabo-coiled-branco','h-48 w-48',100),
 ('cb-4','Cabo USB-C Aviador Preto','Cabo preto com conector aviador destacável.','Cables','Qwerty',54.99,4.6,'cabo-aviador-preto','h-48 w-48',100),
 ('cb-5','Cabo USB-C Curto 30 cm','Cabo curto de 30 cm para setups compactos e teclados portáteis.','Cables','Mechcables',24.99,4.4,'cabo-curto-30cm','h-48 w-48',100),
 ('cb-6','Cabo USB-C Trançado Colorido','Cabo trançado com degradê colorido e conector USB-C.','Cables','Mechcables',29.99,4.5,'cabo-trancado-colorido','h-48 w-48',100),
 ('ac-3','Removedor de Keycaps (Keycap Puller)','Removedor de keycaps em aço, não risca as teclas.','Accessories','Qwerty',14.99,4.6,'removedor-keycaps','h-48 w-48',100),
 ('ac-4','Kit Removedor de Keycaps e Switches','Kit com removedor de switches, removedor de keycaps e pincel de limpeza.','Accessories','Lofree',34.99,4.6,'kit-removedor','h-48 w-48',100),
 ('ac-5','Kit de Lubrificação de Switches','Lubrificante e pincel para deixar os switches mais suaves e silenciosos.','Accessories','Qwerty',49.99,4.7,'kit-lubrificacao','h-48 w-48',100),
 ('ac-6','Apoio de Pulso em Madeira','Apoio de pulso em madeira para digitar com mais conforto.','Accessories','Qwerty',69.99,4.5,'apoio-pulso-madeira','h-48 w-48',100)
on conflict (id) do nothing;

-- conferencia: deve mostrar 6 em cada categoria
select category, count(*) as total from public.products where active group by category order by category;
