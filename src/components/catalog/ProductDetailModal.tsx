import React, { useState } from 'react';
import { Producto, CompetitorProductCache, Tenant } from '../../types';
import { formatCOP } from '../../lib/formatters';
import {
  X,
  MessageCircle,
  Share2,
  Check,
  Sparkles,
  ShoppingBag,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

interface ProductDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  producto: Producto | null;
  competitor: CompetitorProductCache | null;
  tenant: Tenant | null;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  isOpen,
  onClose,
  producto,
  competitor,
  tenant,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !producto) return null;

  const phone = tenant?.config?.whatsapp_contacto?.replace(/\D/g, '') || '573105559876';
  const priceFormatted = formatCOP(producto.precio_venta);
  const waMessage = encodeURIComponent(
    `¡Hola ${tenant?.nombre || ''}! Vi en su catálogo digital el producto ${producto.nombre_personalizado} (Ref: ${producto.referencia_competidor}) por ${priceFormatted} COP y deseo comprarlo. ¿Tienen disponibilidad?`
  );
  const waUrl = `https://wa.me/${phone}?text=${waMessage}`;

  const shareUrl = `${window.location.origin}/catalogo/${tenant?.slug || 'glow-beauty'}/${producto.slug}`;

  const handleShare = async () => {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-[#F2D6DF] p-6 sm:p-8 animate-in fade-in zoom-in-95 my-8">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-[#8E6B77] hover:bg-[#FAF0F4] hover:text-[#2A1820] cursor-pointer"
        >
          <X size={20} />
        </button>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
          {/* Image */}
          <div className="space-y-3">
            <div className="w-full aspect-square rounded-2xl overflow-hidden border border-[#F2D6DF] bg-[#FFF9FB] relative group">
              <img
                src={competitor?.imagen_url || 'https://images.unsplash.com/photo-1596704017254-9b121068fb31?w=600'}
                alt={producto.nombre_personalizado}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              {producto.rotacion_ia === 'alta' && (
                <span className="absolute top-3 left-3 bg-[#EAFBF2] text-[#27AE60] text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full border border-[#27AE60]/30 shadow-xs flex items-center gap-1">
                  <Sparkles size={11} /> Tendencia Viral
                </span>
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-[#8E6B77] px-1">
              <span className="flex items-center gap-1">
                <ShieldCheck size={14} className="text-[#27AE60]" /> 100% Original
              </span>
              <button
                onClick={handleShare}
                className="flex items-center gap-1 text-[#C4607A] hover:underline cursor-pointer"
              >
                {copied ? <Check size={13} className="text-[#27AE60]" /> : <Share2 size={13} />}
                <span>{copied ? '¡Enlace copiado!' : 'Compartir'}</span>
              </button>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-4">
            <div>
              <span className="font-mono text-xs font-bold text-[#C4607A] bg-[#FCEEF2] px-2 py-0.5 rounded-md">
                Ref: {producto.referencia_competidor}
              </span>
              <h2 className="font-serif-luxury text-xl sm:text-2xl font-bold text-[#2A1820] mt-2 leading-tight">
                {producto.nombre_personalizado}
              </h2>
              <span className="text-xs text-[#8E6B77] mt-1 inline-block bg-[#FAF0F4] px-2 py-0.5 rounded-full border border-[#F2D6DF]">
                {producto.categoria}
              </span>
            </div>

            {/* Price Badge */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#FFF9FB] to-[#FCEEF2] border border-[#F2D6DF]">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#8E6B77] block">
                Precio de Venta
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="font-serif-luxury text-3xl font-extrabold text-[#2A1820]">
                  {formatCOP(producto.precio_venta)}
                </span>
                <span className="text-xs text-[#8E6B77]">COP</span>
              </div>
              <div className="mt-1 flex items-center gap-2 text-xs">
                <span className="text-[#27AE60] font-semibold">
                  {producto.stock > 0 ? `● Disponible (${producto.stock} unidades)` : '🔴 Consultar Stock'}
                </span>
              </div>
            </div>

            {/* Description from competitor cache */}
            {competitor?.descripcion && (
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-[#2A1820] uppercase tracking-wider">
                  Detalles del Producto
                </h4>
                <p className="text-xs text-[#8E6B77] leading-relaxed line-clamp-4">
                  {competitor.descripcion}
                </p>
              </div>
            )}

            {/* WhatsApp Purchase Button */}
            <div className="pt-2">
              <a
                href={waUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full chic-gradient-btn py-3.5 px-4 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#E8829A]/30 hover:scale-[1.02] active:scale-98 transition-all"
              >
                <MessageCircle size={18} />
                <span>Pedir por WhatsApp</span>
              </a>
              <p className="text-[11px] text-center text-[#8E6B77] mt-2">
                Atención directa e inmediata con asesoras de {tenant?.nombre || 'la tienda'}.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
