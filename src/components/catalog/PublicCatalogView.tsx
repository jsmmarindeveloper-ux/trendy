import React, { useState, useEffect } from 'react';
import { Producto, CompetitorProductCache, Tenant } from '../../types';
import { formatCOP } from '../../lib/formatters';
import { ProductDetailModal } from './ProductDetailModal';
import {
  Search,
  Sparkles,
  MessageCircle,
  ShoppingBag,
  ExternalLink,
  ChevronRight,
  Filter,
  Flame,
  Instagram,
  Heart
} from 'lucide-react';

interface PublicCatalogViewProps {
  tenantSlug: string;
  tenant: Tenant | null;
  productos: Producto[];
  competitorCache: Record<string, CompetitorProductCache>;
  onBackToApp?: () => void;
  productSlugToOpen?: string | null;
}

export const PublicCatalogView: React.FC<PublicCatalogViewProps> = ({
  tenantSlug,
  tenant,
  productos,
  competitorCache,
  onBackToApp,
  productSlugToOpen,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedProduct, setSelectedProduct] = useState<Producto | null>(null);
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});

  // Filter only visible products
  const visibleProducts = productos.filter((p) => p.visible_catalogo);

  const categories = Array.from(
    new Set(visibleProducts.map((p) => p.categoria).filter(Boolean))
  );

  const filtered = visibleProducts.filter((p) => {
    const matchesSearch =
      p.nombre_personalizado.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.referencia_competidor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || p.categoria === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Auto-open product detail if URL had a slug
  useEffect(() => {
    if (productSlugToOpen) {
      const match = productos.find(
        (p) => p.slug === productSlugToOpen || p.referencia_competidor.toLowerCase() === productSlugToOpen.toLowerCase()
      );
      if (match) {
        setSelectedProduct(match);
      }
    }
  }, [productSlugToOpen, productos]);

  const storeName = tenant?.config?.nombre_tienda || tenant?.nombre || 'Beauty Boutique';
  const whatsappNumber = tenant?.config?.whatsapp_contacto || '573105559876';

  const toggleLike = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setLikedMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getWaLinkForProduct = (p: Producto) => {
    const phone = whatsappNumber.replace(/\D/g, '');
    const price = formatCOP(p.precio_venta);
    const msg = encodeURIComponent(
      `¡Hola ${storeName}! Me interesa comprar el producto ${p.nombre_personalizado} (Ref: ${p.referencia_competidor}) por ${price} COP. ¿Tienen disponible?`
    );
    return `https://wa.me/${phone}?text=${msg}`;
  };

  return (
    <div className="min-h-screen bg-[#FFF9FB] text-[#2A1820] flex flex-col font-sans">
      
      {/* Top Floating Promo Header */}
      <div className="bg-gradient-to-r from-[#E8829A] via-[#C4607A] to-[#D4AF37] text-white text-center py-2 px-4 text-xs font-medium shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <span className="hidden sm:inline">✨ Cosméticos 100% Originales • Envíos a toda Colombia</span>
          <span className="mx-auto sm:mx-0">📦 Envíos rápidos por Servientrega, Interrapidísimo y Envía</span>
          {onBackToApp && (
            <button
              onClick={onBackToApp}
              className="text-[11px] underline opacity-90 hover:opacity-100 hidden md:block cursor-pointer"
            >
              Volver al Panel
            </button>
          )}
        </div>
      </div>

      {/* Brand Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#F2D6DF] shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#E8829A] to-[#C4607A] flex items-center justify-center text-white shadow-md shadow-[#E8829A]/30">
              <Sparkles size={24} className="text-[#FDF6DC]" />
            </div>
            <div>
              <h1 className="font-serif-luxury text-2xl font-bold text-[#2A1820] tracking-tight">
                {storeName}
              </h1>
              <p className="text-xs text-[#8E6B77]">
                Catálogo Digital Exclusivo & Asesoría Personalizada
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <a
              href={`https://wa.me/${whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(`¡Hola ${storeName}! Me gustaría hacer una consulta sobre su catálogo.`)}`}
              target="_blank"
              rel="noreferrer"
              className="chic-gradient-btn px-4 py-2 rounded-xl text-xs font-semibold shadow-xs flex items-center gap-2 hover:scale-102 transition-transform"
            >
              <MessageCircle size={15} />
              <span>Chatear por WhatsApp</span>
            </a>
          </div>
        </div>
      </header>

      {/* Hero Welcome Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#FAF0F4] via-[#FCEEF2] to-[#FDF6DC]/50 border border-[#F2D6DF] p-6 sm:p-10 shadow-xs">
          <div className="max-w-xl space-y-3">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#C4607A] bg-white px-3 py-1 rounded-full border border-[#F2D6DF]">
              <Sparkles size={13} className="text-[#D4AF37]" /> Colección de Belleza & Tendencias
            </span>
            <h2 className="font-serif-luxury text-2xl sm:text-4xl font-extrabold text-[#2A1820] leading-tight">
              Luce tu mejor versión con productos en tendencia.
            </h2>
            <p className="text-xs sm:text-sm text-[#8E6B77] leading-relaxed">
              {tenant?.config?.mensaje_bienvenida ||
                'Explora nuestras referencias seleccionadas de cosmética profesional. Haz clic en cualquier producto para pedirlo directamente por WhatsApp.'}
            </p>
          </div>
        </div>
      </div>

      {/* Search & Category Filter */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-4 mb-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-[#F2D6DF] shadow-xs">
          {/* Search */}
          <div className="relative w-full sm:w-80">
            <Search size={16} className="absolute left-3.5 top-2.5 text-[#8E6B77]" />
            <input
              type="text"
              placeholder="Buscar en el catálogo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 rounded-xl border border-[#F2D6DF] text-xs sm:text-sm bg-[#FFF9FB] focus:outline-hidden focus:border-[#E8829A] text-[#2A1820]"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all whitespace-nowrap ${
                selectedCategory === 'ALL'
                  ? 'bg-[#2A1820] text-white shadow-xs'
                  : 'bg-[#FAF0F4] text-[#8E6B77] hover:text-[#2A1820]'
              }`}
            >
              Todos ({visibleProducts.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-[#E8829A] text-white shadow-xs'
                    : 'bg-[#FAF0F4] text-[#8E6B77] hover:text-[#2A1820]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Product Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-1 pb-16">
        {filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-[#F2D6DF] p-8">
            <ShoppingBag size={40} className="text-[#E8829A] mx-auto mb-3 opacity-60" />
            <h3 className="font-serif-luxury text-lg font-bold text-[#2A1820]">
              No se encontraron productos
            </h3>
            <p className="text-xs text-[#8E6B77] mt-1">
              Prueba con otro término de búsqueda o selecciona otra categoría.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {filtered.map((prod) => {
              const comp = competitorCache[prod.referencia_competidor];
              const isLiked = likedMap[prod.id];
              const isViral = prod.rotacion_ia === 'alta';

              return (
                <div
                  key={prod.id}
                  onClick={() => setSelectedProduct(prod)}
                  className="luxury-card group rounded-2xl overflow-hidden flex flex-col justify-between cursor-pointer border border-[#F2D6DF] hover:border-[#E8829A] transition-all bg-white shadow-xs hover:shadow-md"
                >
                  {/* Image container */}
                  <div className="relative aspect-square w-full bg-[#FFF9FB] overflow-hidden">
                    <img
                      src={comp?.imagen_url || 'https://images.unsplash.com/photo-1596704017254-9b121068fb31?w=400'}
                      alt={prod.nombre_personalizado}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Viral Badge */}
                    {isViral && (
                      <span className="absolute top-2.5 left-2.5 bg-[#EAFBF2]/95 backdrop-blur-xs text-[#27AE60] text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border border-[#27AE60]/30 shadow-xs flex items-center gap-1">
                        <Flame size={10} /> Viral
                      </span>
                    )}

                    {/* Like heart button */}
                    <button
                      onClick={(e) => toggleLike(e, prod.id)}
                      className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-white/80 backdrop-blur-xs flex items-center justify-center text-[#8E6B77] hover:text-[#E8829A] transition-colors shadow-xs"
                    >
                      <Heart
                        size={14}
                        className={isLiked ? 'fill-[#E8829A] text-[#E8829A]' : ''}
                      />
                    </button>
                  </div>

                  {/* Body Content */}
                  <div className="p-3.5 sm:p-4 flex flex-col justify-between flex-1 space-y-2">
                    <div>
                      <div className="flex items-center justify-between text-[10px] text-[#8E6B77] mb-1">
                        <span className="font-mono uppercase font-semibold text-[#C4607A]">
                          Ref: {prod.referencia_competidor}
                        </span>
                        <span>{prod.categoria}</span>
                      </div>
                      <h3 className="font-serif-luxury text-xs sm:text-sm font-bold text-[#2A1820] line-clamp-2 leading-snug group-hover:text-[#C4607A] transition-colors">
                        {prod.nombre_personalizado}
                      </h3>
                    </div>

                    <div className="pt-2 border-t border-[#F2D6DF]/60 space-y-2">
                      <div className="flex items-baseline justify-between">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-[#8E6B77] block leading-none">
                            Precio
                          </span>
                          <span className="font-serif-luxury font-bold text-base sm:text-lg text-[#2A1820]">
                            {formatCOP(prod.precio_venta)}
                          </span>
                        </div>
                        <span className="text-[10px] text-[#27AE60] font-medium">
                          {prod.stock > 0 ? 'En stock' : 'Consultar'}
                        </span>
                      </div>

                      {/* WhatsApp Button */}
                      <a
                        href={getWaLinkForProduct(prod)}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="w-full bg-[#FAF0F4] hover:bg-[#E8829A] text-[#C4607A] hover:text-white border border-[#F2D6DF] hover:border-[#E8829A] py-1.5 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                      >
                        <MessageCircle size={13} />
                        <span>Pedir por WhatsApp</span>
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-[#F2D6DF] py-8 text-center text-xs text-[#8E6B77]">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p className="font-serif-luxury font-bold text-sm text-[#2A1820]">
            {storeName} • Catálogo Oficial
          </p>
          <p>
            Plataforma impulsada por OmniRetail Intelligence Suite • B2B SaaS
          </p>
        </div>
      </footer>

      {/* Product Detail Modal */}
      <ProductDetailModal
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        producto={selectedProduct}
        competitor={selectedProduct ? competitorCache[selectedProduct.referencia_competidor] : null}
        tenant={tenant}
      />
    </div>
  );
};
