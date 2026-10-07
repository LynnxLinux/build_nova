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

