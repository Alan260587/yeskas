import React, { useState, useMemo, useRef } from 'react';
import {
  ShoppingBag,
  MessageCircle,
  Check,
  Sparkles,
  Clock,
  ShieldCheck,
  Plus,
  Minus,
  Zap,
  DollarSign,
  ArrowRight,
  Image as ImageIcon,
  Upload,
  Save,
  X,
} from 'lucide-react';
import { ServiceItem, DeliverySpeedMode } from '../types/catalog';
import {
  NETWORK_INFO,
  buildSingleProductWhatsAppMessage,
  buildWhatsAppLink,
} from '../data/catalogData';
import { useCatalogConfig } from '../context/CatalogConfigContext';
import { useSession } from '../context/SessionContext';
import { readAndCompressImageFile } from '../utils/globalCloudDatabase';

interface ProductCardProps {
  service: ServiceItem;
  onAddToCart: (service: ServiceItem, quantity?: number, deliverySpeed?: DeliverySpeedMode) => void;
  onOpenCart?: () => void;
  isInCart: boolean;
  cartQuantity?: number;
  totalCartItems?: number;
}

export const ProductCard: React.FC<ProductCardProps> = React.memo(
  ({
    service,
    onAddToCart,
    onOpenCart,
    isInCart,
    cartQuantity = 0,
    totalCartItems = 0,
  }) => {
    const [justAdded, setJustAdded] = useState(false);
    const [quantity, setQuantity] = useState<number>(1);
    const [deliverySpeed, setDeliverySpeed] = useState<DeliverySpeedMode>('express');
    const [isEditingCard, setIsEditingPrice] = useState(false);
    const [draftPrice, setDraftPrice] = useState(String(service.price));
    const [draftImage, setDraftImage] = useState<string>('');
    const [isSavingDraft, setIsSavingDraft] = useState(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const { paymentConfig, recordOrder, updateServiceDetails } = useCatalogConfig();
    const { isAdmin } = useSession();

    const netInfo = NETWORK_INFO[service.network] || NETWORK_INFO.instagram;

    const handleAdd = () => {
      onAddToCart(service, quantity, deliverySpeed);
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 900);
    };

    const directWaUrl = useMemo(() => {
      const msg = buildSingleProductWhatsAppMessage(service, undefined, {
        quantity,
        deliverySpeed,
        paymentConfig,
      });
      return buildWhatsAppLink(msg, paymentConfig.whatsappPhone);
    }, [service, quantity, deliverySpeed, paymentConfig]);

    const handleRecordDirectOrder = () => {
      recordOrder({
        source: 'catalogo_individual',
        clientLink: 'Por confirmar en WhatsApp',
        deliverySpeed,
        deliverySpeedLabel:
          deliverySpeed === 'progressive'
            ? 'Modo Progresivo (7 días en adelante)'
            : 'Modo Express (48 a 72 horas)',
        paymentMethod: `Pago Móvil (${paymentConfig.pagoMovil.bankCode}) / Binance (${paymentConfig.binancePayId})`,
        items: [
          {
            name: service.name,
            metric: service.metric,
            network: service.network,
            unitPrice: service.price,
            quantity,
          },
        ],
        totalUSD: service.price * quantity,
      });
    };

    const handleImageFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        // Compress into draft preview ONLY — does NOT save until user clicks "Guardar"
        const compressedDataUrl = await readAndCompressImageFile(file);
        setDraftImage(compressedDataUrl);
      } catch {
        // ignore
      }
      e.target.value = '';
    };

    const handleManualSaveCard = async () => {
      setIsSavingDraft(true);
      try {
        const num = Math.max(0, Number(draftPrice) || 0);
        const patch: Partial<ServiceItem> = { price: num };
        if (draftImage && draftImage.trim()) {
          patch.image = draftImage.trim();
        }
        await updateServiceDetails(service.id, patch);
        setIsEditingPrice(false);
      } finally {
        setIsSavingDraft(false);
      }
    };

    const optimizedImg = useMemo(() => {
      if (isEditingCard && draftImage && draftImage.trim()) {
        return draftImage.trim();
      }
      const fallbackMap: Record<string, string> = {
        facebook: 'https://images.unsplash.com/photo-1562577309-4932fdd64cd1?auto=format&fit=crop&w=480&q=75',
        tiktok: 'https://images.unsplash.com/photo-1611605698335-8b1569810432?auto=format&fit=crop&w=480&q=75',
        instagram: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=480&q=75',
        youtube: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=480&q=75',
        kick: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=480&q=75',
        spotify: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=480&q=75',
        special: 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?auto=format&fit=crop&w=480&q=75',
      };
      const rawImg =
        service.image && service.image.trim()
          ? service.image.trim()
          : fallbackMap[service.network] || fallbackMap.instagram;
      return rawImg.replace('w=800&q=80', 'w=480&q=75');
    }, [service.image, service.network, isEditingCard, draftImage]);

    return (
      <div
        className={`group relative bg-zinc-900 border rounded-3xl overflow-hidden flex flex-col transition-colors duration-150 ${
          isInCart
            ? 'border-purple-500/70 ring-1 ring-purple-500/30'
            : 'border-zinc-800 hover:border-zinc-700'
        } ${netInfo.borderHover}`}
      >
        {/* Representative Image Container */}
        <div className="relative h-40 w-full overflow-hidden bg-zinc-950">
          <img
            src={optimizedImg}
            alt={service.name}
            className="w-full h-full object-cover opacity-85 group-hover:opacity-100 transition-opacity duration-200"
            loading="lazy"
            decoding="async"
          />

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/35 to-transparent" />

          {/* Platform Badge */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
            <span
              className={`text-[11px] font-extrabold px-2.5 py-1 rounded-xl shadow uppercase tracking-wider ${netInfo.badgeColor}`}
            >
              {netInfo.name}
            </span>
            {service.popular && (
              <span className="text-[10px] font-black px-2 py-1 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow flex items-center gap-1 uppercase">
                <Sparkles className="w-3 h-3" />
                {service.tag || 'Popular'}
              </span>
            )}
          </div>

          {/* Admin Draft Editor Overlay (Manual "Guardar" for Image & Price) */}
          {isAdmin && isEditingCard && (
            <div className="absolute inset-0 bg-zinc-950/95 p-3 flex flex-col justify-between z-10">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                  Editar Imagen y Precio (Borrador)
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingPrice(false);
                    setDraftImage('');
                  }}
                  className="p-1 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileSelect}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2.5 py-1.5 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-200 text-[10px] font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    <Upload className="w-3 h-3" />
                    <span>Subir Foto</span>
                  </button>
                  <input
                    type="text"
                    value={draftImage}
                    onChange={(e) => setDraftImage(e.target.value)}
                    placeholder="O pega URL de imagen..."
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1 text-[10px] text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1 bg-zinc-900 border border-emerald-500/60 rounded-lg px-2 py-1">
                    <span className="text-xs font-black text-emerald-400">$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={draftPrice}
                      onChange={(e) => setDraftPrice(e.target.value)}
                      className="w-16 bg-transparent text-xs font-black text-white focus:outline-none"
                    />
                    <span className="text-[10px] text-zinc-400 font-bold">USD</span>
                  </div>

                  <button
                    type="button"
                    disabled={isSavingDraft}
                    onClick={handleManualSaveCard}
                    className="flex-1 py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-black flex items-center justify-center gap-1 shadow cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSavingDraft ? 'Guardando...' : 'Guardar'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Price Tag Overlay */}
          <div className="absolute bottom-3 right-3 bg-zinc-950/95 border border-zinc-700 px-3 py-1.5 rounded-2xl shadow flex items-center gap-1.5">
            <span className="text-xs text-zinc-300 font-semibold">USD</span>
            <span className="text-xl font-black text-white">
              ${service.price * quantity}
            </span>
            {quantity > 1 && (
              <span className="text-[10px] text-emerald-400 font-bold">
                (x{quantity})
              </span>
            )}
            {isAdmin && !isEditingCard && (
              <button
                type="button"
                onClick={() => {
                  setDraftPrice(String(service.price));
                  setDraftImage(service.image || '');
                  setIsEditingPrice(true);
                }}
                className="ml-1 px-1.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 border border-amber-500/30 transition cursor-pointer flex items-center gap-1 text-[10px] font-bold"
                title="Editar Imagen y Precio en USD (Se guarda al pulsar Guardar)"
              >
                <ImageIcon className="w-3 h-3" />
                <DollarSign className="w-3 h-3 -ml-1" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <h3 className="font-bold text-base text-white group-hover:text-purple-300 transition-colors">
                {service.name}
              </h3>
            </div>

            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="inline-block px-2.5 py-0.5 rounded-lg bg-zinc-800 text-zinc-200 text-xs font-semibold border border-zinc-700/60">
                {service.metric}
              </span>
              <span className="text-[11px] text-emerald-400 font-bold">
                ${service.price} USD c/u
              </span>
              {isInCart && (
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-600/30 text-purple-200 border border-purple-500/50">
                  ✓ En tu carrito (x{cartQuantity})
                </span>
              )}
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed line-clamp-2 mb-3">
              {service.description}
            </p>

            {/* Base B: Delivery Speed Selector (Express 48-72h vs Progresivo 7d+) */}
            <div className="space-y-1.5 pt-2 border-t border-zinc-800/60">
              <div className="flex items-center justify-between text-[10px] text-zinc-400 font-semibold">
                <span>Ritmo y Velocidad de Entrega:</span>
                <span className="text-emerald-400 flex items-center gap-0.5">
                  <ShieldCheck className="w-3 h-3" />
                  {service.guarantee || 'Garantía 30D'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setDeliverySpeed('express')}
                  className={`px-2 py-1.5 rounded-lg border text-left transition cursor-pointer ${
                    deliverySpeed === 'express'
                      ? 'bg-amber-500/15 border-amber-500/50 text-white'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <div className="text-[10px] font-black text-amber-400 flex items-center gap-1">
                    <Zap className="w-2.5 h-2.5" />
                    <span>Modo Express</span>
                  </div>
                  <div className="text-[9px] text-zinc-300">48 a 72 horas</div>
                </button>

                <button
                  type="button"
                  onClick={() => setDeliverySpeed('progressive')}
                  className={`px-2 py-1.5 rounded-lg border text-left transition cursor-pointer ${
                    deliverySpeed === 'progressive'
                      ? 'bg-emerald-500/15 border-emerald-500/50 text-white'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <div className="text-[10px] font-black text-emerald-400 flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    <span>Progresivo</span>
                  </div>
                  <div className="text-[9px] text-zinc-300">7 días en adelante</div>
                </button>
              </div>
            </div>
          </div>

          {/* Base C: Quantity Selector + Multi-Order Cart & Direct WhatsApp */}
          <div className="space-y-2 pt-2 border-t border-zinc-800/80">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1 bg-zinc-950 border border-zinc-800 rounded-xl px-1.5 py-1">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-6 h-6 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-300 hover:text-white transition cursor-pointer"
                  title="Menos paquetes"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="text-xs font-black text-white px-1.5 min-w-[26px] text-center">
                  x{quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="w-6 h-6 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-300 hover:text-white transition cursor-pointer"
                  title="Añadir más paquetes"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              <button
                type="button"
                onClick={handleAdd}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
                  justAdded
                    ? 'bg-purple-600 text-white'
                    : isInCart
                    ? 'bg-purple-600/30 hover:bg-purple-600/40 text-purple-100 border border-purple-500/60'
                    : 'bg-purple-600 hover:bg-purple-500 text-white'
                }`}
              >
                {justAdded ? (
                  <>
                    <Check className="w-4 h-4 text-white shrink-0" />
                    <span>¡Agregado (x{quantity})!</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {isInCart
                        ? `Sumar +${quantity} al Carrito`
                        : `Agregar ${quantity > 1 ? `x${quantity} ` : ''}al Carrito`}
                    </span>
                  </>
                )}
              </button>
            </div>

            {/* When product is in cart or multiple items exist, show quick Open Cart / Send to WhatsApp button right on card */}
            {isInCart && onOpenCart && (
              <button
                type="button"
                onClick={onOpenCart}
                className="w-full py-2 px-3 rounded-xl text-xs font-black bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white flex items-center justify-center gap-1.5 shadow cursor-pointer active:scale-95"
              >
                <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
                <span>
                  Ver Carrito ({totalCartItems}) y Mandar a WhatsApp
                </span>
                <ArrowRight className="w-3.5 h-3.5 shrink-0" />
              </button>
            )}

            {/* Direct WhatsApp Order */}
            <a
              href={directWaUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleRecordDirectOrder}
              className="w-full py-2 px-3 rounded-xl text-xs font-bold bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 hover:text-white transition flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>
                Pedir solo este por WhatsApp (${service.price * quantity} USD)
              </span>
            </a>
          </div>
        </div>
      </div>
    );
  }
);
