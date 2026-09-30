import { motion } from "framer-motion";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { Link } from "react-router-dom";

const CartPage = () => {
  const { items, removeItem, updateQuantity, totalPrice, totalItems } = useCart();

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-32 text-center">
        <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h1 className="text-3xl font-bold tracking-tight mb-2">Seu carrinho está vazio</h1>
        <p className="text-foreground mb-8">Que tal montar o teclado dos seus sonhos?</p>
        <Link to="/products" className="inline-flex px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-md shadow-button">
          Ver produtos
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-4xl font-bold tracking-tight mb-8">Carrinho</h1>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-card rounded-lg shadow-card p-4 flex items-center gap-4"
            >
              <div className="h-16 w-16 bg-accent rounded-md flex items-center justify-center text-3xl shrink-0 overflow-hidden">
                <img
                  src={item.image}
                  alt={item.name}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm truncate">{item.name}</h3>
                <p className="text-primary font-semibold text-sm tabular-nums">R${item.price.toFixed(2)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-1 rounded bg-accent hover:bg-accent/80 text-foreground-strong">
                  <Minus className="h-4 w-4" />
                </button>
                <span className="text-sm font-semibold w-8 text-center tabular-nums text-foreground-strong">{item.quantity}</span>
                <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-1 rounded bg-accent hover:bg-accent/80 text-foreground-strong">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <p className="text-sm font-semibold text-foreground-strong tabular-nums w-20 text-right">
                R${(item.price * item.quantity).toFixed(2)}
              </p>
              <button onClick={() => removeItem(item.id)} className="p-2 text-destructive hover:bg-destructive/10 rounded transition-colors">
                <Trash2 className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
        </div>

        <div className="bg-card rounded-lg shadow-card p-6 h-fit sticky top-24">
          <h3 className="font-semibold text-lg mb-4">Resumo do pedido</h3>
          <div className="space-y-2 text-sm mb-6">
            <div className="flex justify-between text-foreground">
              <span>Itens ({totalItems})</span>
              <span className="tabular-nums">R${totalPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-foreground">
              <span>Frete</span>
              <span>Grátis</span>
            </div>
            <div className="border-t border-border pt-2 flex justify-between text-foreground-strong font-semibold">
              <span>Total</span>
              <span className="tabular-nums">R${totalPrice.toFixed(2)}</span>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-md shadow-button"
          >
            Finalizar compra
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default CartPage;