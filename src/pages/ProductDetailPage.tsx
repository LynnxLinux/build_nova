import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ShoppingCart, Star, Zap } from "lucide-react";
import { useProducts } from "@/api/catalog";
import { usePurchase } from "@/hooks/usePurchase";
import ProductCard from "@/components/products/ProductCard";

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const categoryLabel: Record<string, string> = {
  Switches: "Switches",
  Keycaps: "Keycaps",
  Cases: "Cases",
  Cables: "Cabos",
  Accessories: "Acessórios",
};

const ProductDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { data: products = [], isLoading, isError } = useProducts();
  const { addProduct, buyProduct } = usePurchase();

  const product = products.find((p) => p.id === id);

  if (isLoading) {
    return <p className="container mx-auto px-4 py-32 text-center text-foreground">Carregando produto...</p>;
  }
  if (isError) {
    return <p className="container mx-auto px-4 py-32 text-center text-foreground">Não foi possível carregar o produto.</p>;
  }
  if (!product) {
    return (
      <div className="container mx-auto px-4 py-32 text-center">
        <p className="text-lg text-foreground mb-4">Produto não encontrado.</p>
        <Link to="/products" className="text-primary font-semibold hover:underline">
          Voltar para os produtos
        </Link>
      </div>
    );
  }

  const available = product.stock === undefined || product.stock > 0;
  const related = products.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4);

  return (
    <div className="container mx-auto px-4 py-12">
      <Link to="/products" className="inline-flex items-center gap-1.5 text-sm text-foreground hover:text-primary transition-colors mb-6">
        <ArrowLeft className="h-4 w-4" /> Voltar para os produtos
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-accent rounded-2xl flex items-center justify-center min-h-[320px] md:min-h-[440px] p-8"
        >
          <img src={product.image} alt={product.name} className="max-h-[360px] w-full object-contain" />
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">
              {categoryLabel[product.category] ?? product.category} · {product.brand}
            </p>
            <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>
            <div className="flex items-center gap-1.5 mt-2">
              <Star className="h-4 w-4 fill-current text-primary" />
              <span className="text-sm text-foreground tabular-nums">{product.rating} de 5</span>
            </div>
          </div>

          <p className="text-3xl font-bold text-primary tabular-nums">{brl(product.price)}</p>

          <p className="text-foreground">{product.description}</p>

          <p className={`text-sm font-medium ${available ? "text-green-500" : "text-destructive"}`}>
            {available ? "Em estoque" : "Indisponível no momento"}
          </p>

          <div className="space-y-2 max-w-sm">
            <button
              type="button"
              onClick={() => buyProduct(product)}
              disabled={!available}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-primary text-primary-foreground font-semibold rounded-xl shadow-button disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Zap className="h-4 w-4" /> Comprar agora
            </button>
            <button
              type="button"
              onClick={() => addProduct(product)}
              disabled={!available}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-accent text-foreground-strong font-semibold rounded-xl border border-border disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ShoppingCart className="h-4 w-4" /> Adicionar ao carrinho
            </button>
          </div>

          <dl className="grid grid-cols-2 gap-3 text-sm bg-card rounded-lg shadow-card p-4 max-w-sm">
            <dt className="text-muted-foreground">Marca</dt>
            <dd className="text-foreground-strong text-right">{product.brand}</dd>
            <dt className="text-muted-foreground">Categoria</dt>
            <dd className="text-foreground-strong text-right">{categoryLabel[product.category] ?? product.category}</dd>
            <dt className="text-muted-foreground">Código</dt>
            <dd className="text-foreground-strong text-right">{product.id.toUpperCase()}</dd>
          </dl>
        </motion.div>
      </div>

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="text-2xl font-bold tracking-tight mb-6">Produtos relacionados</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {related.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default ProductDetailPage;
