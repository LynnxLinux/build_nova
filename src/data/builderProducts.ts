export type ComponentCategory = "switch" | "keycap" | "pcb" | "case";
export type SwitchType = "MX" | "Low Profile" | "Optical";
export type LayoutSize = "60%" | "65%" | "75%" | "TKL" | "Full";

export interface CaseColor {
  id: string;
  name: string;
  hex: string;
}

export interface BuilderProduct {
  id: string;
  name: string;
  category: ComponentCategory;
  type: SwitchType;
  layout: LayoutSize | null;
  price: number;
  image: string;
  description: string;
  /** Only for cases */
  supportedLayouts?: LayoutSize[];
  colors?: CaseColor[];
}

const standardColors: CaseColor[] = [
  { id: "black", name: "Preto", hex: "#1a1a1a" },
  { id: "silver", name: "Prata", hex: "#a0a0a0" },
  { id: "white", name: "Branco", hex: "#e8e8e8" },
  { id: "navy", name: "Azul Marinho", hex: "#1e3a5f" },
  { id: "burgundy", name: "Bordô", hex: "#6b1d1d" },
];

const slimColors: CaseColor[] = [
  { id: "white", name: "Branco", hex: "#e8e8e8" },
  { id: "silver", name: "Prata", hex: "#c0c0c0" },
  { id: "space-gray", name: "Cinza Espacial", hex: "#4a4a4a" },
  { id: "rose", name: "Rosé", hex: "#b76e79" },
  { id: "midnight", name: "Meia-noite", hex: "#1c1c2e" },
];

export const builderProducts: BuilderProduct[] = [
  // Switches
  { id: "sw-mx-gateron", name: "Gateron Oil King (Linear)", category: "switch", type: "MX", layout: null, price: 32.99, image: "🔴", description: "Switches lineares MX ultra suaves com lubrificação de fábrica." },
  { id: "sw-mx-cherry", name: "Cherry MX Blue (Clicky)", category: "switch", type: "MX", layout: null, price: 28.99, image: "🔵", description: "Switches clicky clássicos MX com retorno tátil." },
  { id: "sw-mx-holy", name: "Holy Panda (Táctil)", category: "switch", type: "MX", layout: null, price: 45.99, image: "🟤", description: "Switches táteis premium MX com bump arredondado." },
  { id: "sw-lp-cherry", name: "Cherry MX Low Profile Red", category: "switch", type: "Low Profile", layout: null, price: 34.99, image: "🟠", description: "Switch linear de baixo perfil para teclados slim." },
  { id: "sw-opt-razer", name: "Razer Optical Red", category: "switch", type: "Optical", layout: null, price: 38.99, image: "🟡", description: "Ativação óptica para resposta ultra rápida." },

  // Keycaps
  { id: "kc-mx-laser", name: "Keycaps GMK Laser", category: "keycap", type: "MX", layout: "Full", price: 129.99, image: "🎨", description: "Keycaps MX double-shot ABS. Cobertura completa Full layout." },
  { id: "kc-mx-botanical", name: "Keycaps PBT Botanical", category: "keycap", type: "MX", layout: "TKL", price: 69.99, image: "🌿", description: "Keycaps MX PBT dye-sub. Cobre até layout TKL." },
  { id: "kc-mx-retro", name: "Keycaps MT3 Susuwatari", category: "keycap", type: "MX", layout: "65%", price: 89.99, image: "⬛", description: "Keycaps MX de perfil alto para teclados 60%/65%." },
  { id: "kc-lp-white", name: "Keycaps Low Profile Brancas", category: "keycap", type: "Low Profile", layout: "75%", price: 49.99, image: "⚪", description: "Keycaps slim para switches low profile até 75%." },
  { id: "kc-mx-minimal", name: "Keycaps MX Pretas Minimalistas", category: "keycap", type: "MX", layout: "75%", price: 59.99, image: "⬜", description: "Keycaps MX pretas com visual clean. Cobre até 75%." },

  // PCBs
  { id: "pcb-mx-60", name: "PCB DZ60 RGB", category: "pcb", type: "MX", layout: "60%", price: 55.00, image: "🔧", description: "PCB MX hot-swap para builds 60% com RGB." },
  { id: "pcb-mx-65", name: "PCB KBD67 Lite", category: "pcb", type: "MX", layout: "65%", price: 65.00, image: "🔧", description: "PCB MX hot-swap para builds 65%." },
  { id: "pcb-mx-75", name: "PCB Feker IK75", category: "pcb", type: "MX", layout: "75%", price: 70.00, image: "🔧", description: "PCB MX hot-swap para builds 75% com knob." },
  { id: "pcb-mx-tkl", name: "PCB Keychron Q3", category: "pcb", type: "MX", layout: "TKL", price: 80.00, image: "🔧", description: "PCB MX hot-swap para builds TKL." },
  { id: "pcb-lp-75", name: "PCB Nuphy Air75", category: "pcb", type: "Low Profile", layout: "75%", price: 60.00, image: "🔧", description: "PCB hot-swap low profile, layout 75%." },

  // Cases
  { id: "cs-60-alu", name: "Case de Alumínio Tofu60", category: "case", type: "MX", layout: "60%", price: 99.99, image: "🔲", description: "Case de alumínio CNC para PCBs 60%." },
  { id: "cs-65-alu", name: "Case de Alumínio Tofu65", category: "case", type: "MX", layout: "65%", price: 119.99, image: "🔲", description: "Case de alumínio CNC para PCBs 65%." },
  { id: "cs-75-alu", name: "Case GMMK Pro (75%)", category: "case", type: "MX", layout: "75%", price: 139.99, image: "🔲", description: "Case de alumínio com montagem gasket para PCBs 75%." },
  { id: "cs-tkl-poly", name: "Case Bakeneko TKL", category: "case", type: "MX", layout: "TKL", price: 89.99, image: "📦", description: "Case com montagem gasket o-ring para PCBs TKL." },
  { id: "cs-lp-75", name: "Case Nuphy Air75", category: "case", type: "Low Profile", layout: "75%", price: 69.99, image: "📦", description: "Case slim para PCBs low profile 75%." },
];
