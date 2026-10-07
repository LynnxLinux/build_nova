// Tipos e filtros da loja. Os produtos em si vêm do Supabase (tabela products),
// veja src/api/catalog.ts. As imagens ficam mapeadas em src/data/productImages.ts.

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

export const categories = ["All", "Switches", "Keycaps", "Cases", "Cables", "Accessories"];
export const brands = ["All", "Gateron", "Cherry", "Drop", "GMK", "Infinikey", "KBDFans", "CannonKeys", "CruzCtrl", "Mechcables", "KPRepublic"];
