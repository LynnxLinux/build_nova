import gateronOil from "@/assets/produtos/gateron-oil.png"
import gmkLaser from "@/assets/produtos/gmkLaser.png"
import tofu65 from "@/assets/produtos/Tofu65.png"
import CaboC from "@/assets/produtos/cabo-coiled.png"
import Holyp from "@/assets/produtos/mmd_holy_panda.png"
import pbtbot from "@/assets/produtos/pbtbotanical.png"
import mt3 from "@/assets/produtos/mt3 susuwari.png"
import bakeneko from "@/assets/produtos/bakeneko.png"
import switcht from "@/assets/produtos/switchtester.png"
import blue from "@/assets/produtos/switch blue.png"
import caseP from "@/assets/produtos/case1.png"
import cabo from "@/assets/produtos/cabo.png"

export interface Product {
  id: string;
  name: string;
  price: number;
  rating: number;
  category: string;
  brand: string;
  image: string;
  description: string;
  imageSize?: string;
}

export const products: Product[] = [
  { id: "sw-1", name: "Gateron Oil King (Linear)", price: 32.99, rating: 4.8, category: "Switches", brand: "Gateron", image: gateronOil, description: "Switches lineares ultra suaves com lubrificação de fábrica.", imageSize: "h-32 w-32" },
  { id: "sw-2", name: "Cherry MX Blue (Clicky)", price: 28.99, rating: 4.5, category: "Switches", brand: "Cherry", image: blue, description: "Switches clicky clássicos com retorno tátil.", imageSize:"h-40 w-40"},
  { id: "sw-3", name: "Holy Panda (Táctil)", price: 45.99, rating: 4.9, category: "Switches", brand: "Drop", image: Holyp, description: "Switches táteis premium com bump arredondado.", imageSize: "h-40 w-40" },

  { id: "kc-1", name: "Keycaps GMK Laser", price: 129.99, rating: 4.9, category: "Keycaps", brand: "GMK", image: gmkLaser, description: "Keycaps ABS double-shot com icônico tema Laser.", imageSize:"h-48 w-48"},
  { id: "kc-2", name: "Keycaps PBT Botanical", price: 69.99, rating: 4.7, category: "Keycaps", brand: "Infinikey", image: pbtbot, description: "Keycaps PBT dye-sub com tema botânico.", imageSize:"h-48 w-48"},
  { id: "kc-3", name: "Keycaps MT3 Susuwatari", price: 89.99, rating: 4.6, category: "Keycaps", brand: "Drop", image: mt3, description: "Keycaps esculpidos de perfil alto com estilo retrô.", imageSize:"h-48 w-48" },

  { id: "cs-1", name: "Case de Alumínio Tofu65", price: 119.99, rating: 4.7, category: "Cases", brand: "KBDFans", image: tofu65, description: "Case de alumínio CNC para teclados 65%.", imageSize: "h-48 w-38"},
  { id: "cs-2", name: "Case Bakeneko60", price: 89.99, rating: 4.6, category: "Cases", brand: "CannonKeys", image: bakeneko, description: "Case 60% com montagem gasket o-ring.", imageSize:"h-48 w-48"},

  { id: "cb-1", name: "Cabo USB-C Coiled Personalizado", price: 49.99, rating: 4.8, category: "Cables", brand: "CruzCtrl", image: CaboC, description: "Cabo coiled artesanal com conector aviador.", imageSize:"h-48 w-48" },
  { id: "cb-2", name: "Cabo USB-C Reto", price: 19.99, rating: 4.4, category: "Cables", brand: "Mechcables", image: cabo, description: "Cabo trançado reto.", imageSize:"h-48 w-48" },

  { id: "ac-1", name: "Testador de Switches (72 switches)", price: 39.99, rating: 4.5, category: "Accessories", brand: "KPRepublic", image: switcht, description: "Teste 72 switches diferentes antes de comprar.", imageSize:"h-48 w-48" },
  { id: "ac-2", name: "Case de Transporte para Teclado", price: 34.99, rating: 4.3, category: "Accessories", brand: "KBDFans", image: caseP, description: "Case acolchoado para teclados 65%.", imageSize:"h-48 w-48"},
];

export const categories = ["All", "Switches", "Keycaps", "Cases", "Cables", "Accessories"];
export const brands = ["All", "Gateron", "Cherry", "Drop", "GMK", "Infinikey", "KBDFans", "CannonKeys", "CruzCtrl", "Mechcables", "KPRepublic"];
