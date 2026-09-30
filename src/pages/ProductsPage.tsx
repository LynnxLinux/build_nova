import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Star, ShoppingCart } from "lucide-react";
import { products, categories, brands } from "@/data/products";
import { useCart } from "@/context/CartContext";
import { toast } from "sonner";


const ProductsPage = () => {
  const { addItem } = useCart();
  const [category, setCategory] = useState("All");
  const [brand, setBrand] = useState("All");
  const [sort, setSort] = useState("popular");

  const filtered = useMemo(() => {
    let result = [...products];
    if (category !== "All") result = result.filter((p) => p.category === category);
    if (brand !== "All") result = result.filter((p) => p.brand === brand);
    if (sort === "price-low") result = [...result].sort((a, b) => a.price - b.price);
    else if (sort === "price-high") result = [...result].sort((a, b) => b.price - a.price);
    else result = [...result].sort((a, b) => b.rating - a.rating);
    return result;
  }, [category, brand, sort]);

  return (
    <div className="container mx-auto px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <h1 className="text-4xl font-bold tracking-tight mb-2">Produtos</h1>
        <p className="text-foreground mb-8">Peças premium para o seu próximo setup.</p>
      </motion.div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-4 mb-8">
        <div className="flex gap-2 flex-wrap">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                category === c ? "bg-primary text-primary-foreground" : "bg-card text-foreground hover:bg-accent"
              }`}
            >
              {{
                All: "Todos",
                Switches: "Switches",
                Keycaps: "Keycaps",
                Cases: "Cases",
                Cables: "Cabos",
                Accessories: "Acessórios"
              }[c] || c}
            </button>
          ))}
        </div>

        <select
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          className="bg-card border border-border rounded-md px-3 py-2 text-sm text-foreground-strong focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
        >
          {brands.map((b) => (
            <option key={b} value={b}>
              {b === "All" ? "Todas as marcas" : b}
            </option>
          ))}
        </select>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="bg-card border border-border rounded-md px-3 py-2 text-sm text-foreground-strong focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
        >
          <option value="popular">Mais populares</option>
          <option value="price-low">Preço: menor para maior</option>
          <option value="price-high">Preço: maior para menor</option>
        </select>
      </div>

      {/* Grid de produtos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filtered.map((product, i) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
            whileHover={{ y: -4 }}
            className="bg-card rounded-lg shadow-card overflow-hidden group"
          >
            <div className="h-48 bg-accent flex items-center justify-center text-7xl">
              <img
                src={product.image}
                alt={product.name}
                className={`${product.imageSize || "h-24 w-24"} object-contain transition-transform duration-300 group-hover:scale-105`}
                />
            </div>  

            <div className="p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">
                {{
                  Cables: "Cabos",
                  Accessories: "Acessórios",
                  }[product.category] || product.category}
              </p>

              <h3 className="font-semibold text-sm mb-1">{product.name}</h3>

              <p className="text-xs text-foreground mb-3 line-clamp-2">
                {product.description}
              </p>

              <div className="flex items-center gap-1 mb-3">
                <Star className="h-3 w-3 fill-current text-primary" />
                <span className="text-xs text-foreground tabular-nums">
                  {product.rating}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-primary font-bold tabular-nums">
                  {product.price.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                    })}
                </span>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    addItem({
                      id: product.id,
                      name: product.name,
                      price: product.price,
                      image: product.image,
                    });
                    toast.success(`${product.name} adicionado ao carrinho`);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-md"
                >
                  <ShoppingCart className="h-3 w-3" /> Adicionar
                </motion.button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20 text-foreground">
          <p className="text-lg">
            Nenhum produto encontrado com os filtros atuais.
          </p>
        </div>
      )}
    </div>
  );
};

export default ProductsPage;