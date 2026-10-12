-- =====================================================================
-- QWERTY - Catalogo ampliado do montador de teclados
-- Rode no Supabase > SQL Editor DEPOIS do 06. Pode rodar mais de uma vez.
-- ATENCAO: nomes e precos das pecas novas sao ILUSTRATIVOS (projeto academico).
--
-- Garantia: para CADA layout (60%, 65%, 75%, TKL, Full) e para CADA tipo de
-- switch (MX, Low Profile, Optical) existe pelo menos uma build completa e
-- compativel (switch + keycap + PCB + case).
-- =====================================================================

insert into public.builder_parts (id, name, category, type, layout, price, description) values
 ('sw-mx-kailh-white','Kailh Box White (Clicky)','switch','MX',null,36.99,'Switch clicky de haste Box, com clique firme e som agudo.'),
 ('sw-mx-akko-jelly','Akko CS Jelly Pink (Táctil)','switch','MX',null,39.99,'Switch táctil com bump marcado e digitação macia.'),
 ('sw-mx-gateron-yellow','Gateron Yellow (Linear)','switch','MX',null,29.99,'Linear suave e econômico, ótimo para o dia a dia.'),
 ('sw-mx-outemu-silent','Outemu Silent Peach (Silencioso)','switch','MX',null,31.99,'Switch silencioso, ideal para ambientes compartilhados.'),
 ('sw-mx-cherry-brown','Cherry MX Brown (Táctil)','switch','MX',null,33.99,'Táctil clássico, equilíbrio entre digitação e jogos.'),
 ('sw-lp-choc-brown','Kailh Choc Brown (Low Profile Táctil)','switch','Low Profile',null,35.99,'Switch low profile táctil para teclados slim.'),
 ('sw-lp-gateron-blue','Gateron Low Profile Blue (Clicky)','switch','Low Profile',null,36.99,'Switch low profile clicky com clique audível.'),
 ('sw-opt-gateron-blue','Gateron Optical Blue (Clicky)','switch','Optical',null,40.99,'Ativação óptica com clique audível.'),
 ('sw-opt-gateron-brown','Gateron Optical Brown (Táctil)','switch','Optical',null,41.99,'Ativação óptica com feedback táctil.'),
 ('kc-mx-cherry-black','Keycaps PBT Cherry Profile Pretas','keycap','MX','Full',79.99,'Kit PBT perfil Cherry, textura fosca. Cobre até Full.'),
 ('kc-mx-arctic','Keycaps PBT Branco Ártico','keycap','MX','Full',74.99,'Kit PBT branco com legendas cinza. Cobre até Full.'),
 ('kc-mx-olivia','Keycaps GMK Olivia++','keycap','MX','Full',149.99,'Kit ABS double-shot rosa e preto. Cobre até Full.'),
 ('kc-mx-pastel','Keycaps XDA Pastel','keycap','MX','75%',64.99,'Kit PBT perfil XDA em tons pastel. Cobre até 75%.'),
 ('kc-lp-black','Keycaps Low Profile Pretas','keycap','Low Profile','75%',49.99,'Kit slim preto para switches low profile. Cobre até 75%.'),
 ('kc-lp-gray','Keycaps Low Profile Cinza (Kit Completo)','keycap','Low Profile','Full',59.99,'Kit slim cinza completo. Cobre até Full.'),
 ('kc-opt-black','Keycaps PBT Pretas para Optical','keycap','Optical','Full',54.99,'Kit preto para switches ópticos. Cobre até Full.'),
 ('kc-opt-white','Keycaps PBT Brancas para Optical','keycap','Optical','75%',54.99,'Kit branco para switches ópticos. Cobre até 75%.'),
 ('pcb-mx-60-qmk','PCB 60% Hot-swap QMK','pcb','MX','60%',59.00,'PCB MX hot-swap para builds 60%.'),
 ('cs-60-poly','Case 60% Policarbonato','case','MX','60%',79.99,'Case para PCBs MX 60%.'),
 ('pcb-mx-65-rgb','PCB 65% Hot-swap RGB','pcb','MX','65%',68.00,'PCB MX hot-swap para builds 65%.'),
 ('cs-65-acrylic','Case 65% Acrílico Transparente','case','MX','65%',94.99,'Case para PCBs MX 65%.'),
 ('pcb-mx-75-gasket','PCB 75% Hot-swap Gasket','pcb','MX','75%',74.00,'PCB MX hot-swap para builds 75%.'),
 ('cs-75-poly','Case 75% Policarbonato Gasket','case','MX','75%',109.99,'Case para PCBs MX 75%.'),
 ('pcb-mx-tkl-rgb','PCB TKL Hot-swap RGB','pcb','MX','TKL',82.00,'PCB MX hot-swap para builds TKL.'),
 ('cs-tkl-alu','Case de Alumínio TKL','case','MX','TKL',129.99,'Case para PCBs MX TKL.'),
 ('pcb-mx-full-qmk','PCB Full Size Hot-swap QMK','pcb','MX','Full',118.00,'PCB MX hot-swap para builds Full Size.'),
 ('cs-full-poly','Case Full Size Policarbonato','case','MX','Full',119.99,'Case para PCBs MX Full Size.'),
 ('pcb-lp-60','PCB Low Profile 60% Hot-swap','pcb','Low Profile','60%',52.00,'PCB hot-swap low profile para builds 60%.'),
 ('cs-lp-60','Case Low Profile 60%','case','Low Profile','60%',59.99,'Case slim para PCBs low profile 60%.'),
 ('pcb-lp-65','PCB Low Profile 65% Hot-swap','pcb','Low Profile','65%',56.00,'PCB hot-swap low profile para builds 65%.'),
 ('cs-lp-65','Case Low Profile 65%','case','Low Profile','65%',65.99,'Case slim para PCBs low profile 65%.'),
 ('pcb-lp-tkl','PCB Low Profile TKL Hot-swap','pcb','Low Profile','TKL',64.00,'PCB hot-swap low profile para builds TKL.'),
 ('cs-lp-tkl','Case Low Profile TKL','case','Low Profile','TKL',77.99,'Case slim para PCBs low profile TKL.'),
 ('pcb-lp-full','PCB Low Profile Full Size Hot-swap','pcb','Low Profile','Full',68.00,'PCB hot-swap low profile para builds Full Size.'),
 ('cs-lp-full','Case Low Profile Full Size','case','Low Profile','Full',83.99,'Case slim para PCBs low profile Full Size.'),
 ('pcb-opt-60','PCB Optical 60%','pcb','Optical','60%',66.00,'PCB para switches ópticos, builds 60%.'),
 ('cs-opt-60','Case Optical 60%','case','Optical','60%',79.99,'Case para PCBs ópticas 60%.'),
 ('pcb-opt-65','PCB Optical 65%','pcb','Optical','65%',71.00,'PCB para switches ópticos, builds 65%.'),
 ('cs-opt-65','Case Optical 65%','case','Optical','65%',86.99,'Case para PCBs ópticas 65%.'),
 ('pcb-opt-75','PCB Optical 75%','pcb','Optical','75%',76.00,'PCB para switches ópticos, builds 75%.'),
 ('cs-opt-75','Case Optical 75%','case','Optical','75%',93.99,'Case para PCBs ópticas 75%.'),
 ('pcb-opt-tkl','PCB Optical TKL','pcb','Optical','TKL',81.00,'PCB para switches ópticos, builds TKL.'),
 ('cs-opt-tkl','Case Optical TKL','case','Optical','TKL',100.99,'Case para PCBs ópticas TKL.'),
 ('pcb-opt-full','PCB Optical Full Size','pcb','Optical','Full',86.00,'PCB para switches ópticos, builds Full Size.'),
 ('cs-opt-full','Case Optical Full Size','case','Optical','Full',107.99,'Case para PCBs ópticas Full Size.')
on conflict (id) do nothing;

-- cores dos cases novos (seletor de cor + modelo 3D)
update public.builder_parts
set colors = '[
  {"id":"black","name":"Preto","hex":"#2a2a2e"},
  {"id":"white","name":"Branco","hex":"#e8e8ea"},
  {"id":"gray","name":"Cinza","hex":"#6b7280"},
  {"id":"blue","name":"Azul","hex":"#1e3a5f"},
  {"id":"purple","name":"Roxo","hex":"#4c1d95"}
]'::jsonb
where category = 'case' and colors is null;
