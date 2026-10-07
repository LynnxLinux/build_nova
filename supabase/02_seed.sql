-- =====================================================================
-- QWERTY - Dados iniciais (copiados de src/data/*.ts)
-- Rode DEPOIS do 01_schema.sql. Pode rodar mais de uma vez sem duplicar.
-- =====================================================================

-- PRODUCTS (12) - image_key precisa ser mapeada para o asset no front (Etapa 5)
insert into public.products (id, name, description, category, brand, price, rating, image_key, image_size) values
 ('sw-1','Gateron Oil King (Linear)','Switches lineares ultra suaves com lubrificação de fábrica.','Switches','Gateron',32.99,4.8,'gateron-oil','h-32 w-32'),
 ('sw-2','Cherry MX Blue (Clicky)','Switches clicky clássicos com retorno tátil.','Switches','Cherry',28.99,4.5,'switch-blue','h-40 w-40'),
 ('sw-3','Holy Panda (Táctil)','Switches táteis premium com bump arredondado.','Switches','Drop',45.99,4.9,'holy-panda','h-40 w-40'),
 ('kc-1','Keycaps GMK Laser','Keycaps ABS double-shot com icônico tema Laser.','Keycaps','GMK',129.99,4.9,'gmk-laser','h-48 w-48'),
 ('kc-2','Keycaps PBT Botanical','Keycaps PBT dye-sub com tema botânico.','Keycaps','Infinikey',69.99,4.7,'pbt-botanical','h-48 w-48'),
 ('kc-3','Keycaps MT3 Susuwatari','Keycaps esculpidos de perfil alto com estilo retrô.','Keycaps','Drop',89.99,4.6,'mt3-susuwatari','h-48 w-48'),
 ('cs-1','Case de Alumínio Tofu65','Case de alumínio CNC para teclados 65%.','Cases','KBDFans',119.99,4.7,'tofu65','h-48 w-38'),
 ('cs-2','Case Bakeneko60','Case 60% com montagem gasket o-ring.','Cases','CannonKeys',89.99,4.6,'bakeneko','h-48 w-48'),
 ('cb-1','Cabo USB-C Coiled Personalizado','Cabo coiled artesanal com conector aviador.','Cables','CruzCtrl',49.99,4.8,'cabo-coiled','h-48 w-48'),
 ('cb-2','Cabo USB-C Reto','Cabo trançado reto.','Cables','Mechcables',19.99,4.4,'cabo-reto','h-48 w-48'),
 ('ac-1','Testador de Switches (72 switches)','Teste 72 switches diferentes antes de comprar.','Accessories','KPRepublic',39.99,4.5,'switch-tester','h-48 w-48'),
 ('ac-2','Case de Transporte para Teclado','Case acolchoado para teclados 65%.','Accessories','KBDFans',34.99,4.3,'case-transporte','h-48 w-48')
on conflict (id) do nothing;

-- BUILDER_PARTS (18)
insert into public.builder_parts (id, name, category, type, layout, price, image, description) values
 ('sw-mx-gateron','Gateron Oil King (Linear)','switch','MX',null,32.99,'🔴','Switches lineares MX ultra suaves com lubrificação de fábrica.'),
 ('sw-mx-cherry','Cherry MX Blue (Clicky)','switch','MX',null,28.99,'🔵','Switches clicky clássicos MX com retorno tátil.'),
 ('sw-mx-holy','Holy Panda (Táctil)','switch','MX',null,45.99,'🟤','Switches táteis premium MX com bump arredondado.'),
 ('sw-lp-cherry','Cherry MX Low Profile Red','switch','Low Profile',null,34.99,'🟠','Switch linear de baixo perfil para teclados slim.'),
 ('sw-opt-razer','Razer Optical Red','switch','Optical',null,38.99,'🟡','Ativação óptica para resposta ultra rápida.'),

 ('kc-mx-laser','Keycaps GMK Laser','keycap','MX','Full',129.99,'🎨','Keycaps MX double-shot ABS. Cobertura completa Full layout.'),
 ('kc-mx-botanical','Keycaps PBT Botanical','keycap','MX','TKL',69.99,'🌿','Keycaps MX PBT dye-sub. Cobre até layout TKL.'),
 ('kc-mx-retro','Keycaps MT3 Susuwatari','keycap','MX','65%',89.99,'⬛','Keycaps MX de perfil alto para teclados 60%/65%.'),
 ('kc-lp-white','Keycaps Low Profile Brancas','keycap','Low Profile','75%',49.99,'⚪','Keycaps slim para switches low profile até 75%.'),
 ('kc-mx-minimal','Keycaps MX Pretas Minimalistas','keycap','MX','75%',59.99,'⬜','Keycaps MX pretas com visual clean. Cobre até 75%.'),

 ('pcb-mx-60','PCB DZ60 RGB','pcb','MX','60%',55.00,'🔧','PCB MX hot-swap para builds 60% com RGB.'),
 ('pcb-mx-65','PCB KBD67 Lite','pcb','MX','65%',65.00,'🔧','PCB MX hot-swap para builds 65%.'),
 ('pcb-mx-75','PCB Feker IK75','pcb','MX','75%',70.00,'🔧','PCB MX hot-swap para builds 75% com knob.'),
 ('pcb-mx-tkl','PCB Keychron Q3','pcb','MX','TKL',80.00,'🔧','PCB MX hot-swap para builds TKL.'),
 ('pcb-lp-75','PCB Nuphy Air75','pcb','Low Profile','75%',60.00,'🔧','PCB hot-swap low profile, layout 75%.'),

 ('cs-60-alu','Case de Alumínio Tofu60','case','MX','60%',99.99,'🔲','Case de alumínio CNC para PCBs 60%.'),
 ('cs-65-alu','Case de Alumínio Tofu65','case','MX','65%',119.99,'🔲','Case de alumínio CNC para PCBs 65%.'),
 ('cs-75-alu','Case GMMK Pro (75%)','case','MX','75%',139.99,'🔲','Case de alumínio com montagem gasket para PCBs 75%.'),
 ('cs-tkl-poly','Case Bakeneko TKL','case','MX','TKL',89.99,'📦','Case com montagem gasket o-ring para PCBs TKL.'),
 ('cs-lp-75','Case Nuphy Air75','case','Low Profile','75%',69.99,'📦','Case slim para PCBs low profile 75%.')
on conflict (id) do nothing;

-- COMMUNITY_BUILDS (6) - user_id NULL = exemplos do site
insert into public.community_builds (id, author_name, title, description, likes, layout, switches, keycaps, image_key) values
 ('b1','LucasTech','Midnight Purple','Build em alumínio anodizado roxo escuro Tofu65 com switches Lavender e keycaps Lavender Lore.',234,'75%','Durock Lavender','Lavender Lore','midnight-purple'),
 ('b2','RafaBuilds','Botanical Garden','Build oriental com keycaps artísticos em PBT e case de madeira, inspirada na estética tradicional chinesa.',189,'65%','Holy Panda','PBT Botanical','botanic-garden'),
 ('b3','GuiSetup','Vintage Terminal','Build minimalista com keycaps creme e detalhes azulados, em um design retrô e elegante.',312,'Full Size','Box Jade','MT3 Susuwatari','retro-terminal'),
 ('b4','CaioMods','Phantom Assassin','Build toda preta e cinza silenciosa com case amortecido e Reaper Switch.',156,'65%','LEOBOG Reaper Switch','ePBT Black','furtive-mode'),
 ('b5','FanaticoRGB','Neon Dreams','Build full RGB com case transparente e keycaps de gatinhos.',278,'Full Size','Gateron Milky Yellow','Pudding cats','neon-dreams'),
 ('b6','PedroFPS','Pure White','Setup minimalista todo branco com switches táteis silenciosos.',203,'75%','Boba U4','ePBT White','pure-white')
on conflict (id) do nothing;
