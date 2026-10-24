import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Send, Bot, User, X, MessageCircle, ExternalLink, Sparkles, RotateCcw } from 'lucide-react';
import { buildWhatsAppLink } from '../data/catalogData';
import { useCatalogConfig } from '../context/CatalogConfigContext';

interface Message {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  time: string;
  engine?: string;
  suggestedAction?: {
    label: string;
    waText: string;
  };
}

interface ChatBotProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCalculator: () => void;
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: 'm-1',
    sender: 'bot',
    engine: 'Gemini 2.5 Flash',
    text: `¡Hola! 👋 Soy tu Asesor Virtual con **Modelo Gemini 2.5 Flash** (ultra rápido y económico) de Growth Viral Pro.\n\nPregúntame cualquier duda en lenguaje natural sobre:\n• **Precios exactos en USD** (Instagram, TikTok, YouTube, Spotify, Facebook, Telegram, WhatsApp, Streaming).\n• **Ritmo de entrega:** Modo Express (**48 a 72 horas**) o Modo Progresivo (**7 días en adelante**).\n• **Pedido Conjunto:** Cómo añadir 2 o más paquetes al carrito y enviarlos a WhatsApp.\n• **Métodos de Pago:** Pago Móvil BDV y Binance Pay.`,
    time: 'Ahora',
  },
];

const QUICK_PROMPTS = [
  { label: '⚡ Velocidad Express vs Progresivo', query: '¿Cuál es la diferencia entre Modo Express 48-72h y Modo Progresivo 7 días?' },
  { label: '💰 Precios Instagram y TikTok', query: 'Dame todos los precios en USD de Instagram y TikTok' },
  { label: '🎬 Monetizar YouTube y Redes', query: '¿Qué paquetes tienen para monetizar YouTube y otras redes?' },
  { label: '🎧 Tarifas Spotify en USD', query: '¿Cuáles son los precios de Spotify en USD?' },
  { label: '💳 Datos de Pago Móvil y Binance', query: 'Dame los datos de Pago Móvil y Binance Pay para pagar' },
  { label: '🔥 Ofertas Especiales de Hoy', query: '¿Cuáles son las ofertas especiales solo por hoy?' },
];

function renderFormattedText(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={idx} className="font-extrabold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}

export const ChatBot: React.FC<ChatBotProps> = ({ isOpen, onClose }) => {
  const { paymentConfig, services, specialOffers } = useCatalogConfig();
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isTyping]);

  // Build live catalog summary in USD for Gemini 2.5 Flash context
  const catalogSummary = useMemo(() => {
    const grouped: Record<string, string[]> = {};
    for (const s of services) {
      const netKey = s.network.toUpperCase();
      if (!grouped[netKey]) grouped[netKey] = [];
      grouped[netKey].push(`${s.name} (${s.metric}): $${s.price} USD`);
    }
    const networkLines = Object.entries(grouped)
      .map(([net, items]) => `[${net}]\n- ${items.join('\n- ')}`)
      .join('\n\n');

    const offerLines = specialOffers
      .map(
        (o) =>
          `- ${o.title} (${o.subtitle}): ${typeof o.price === 'number' ? `$${o.price} USD` : 'Consultar'} -> ${o.features.join(', ')}`
      )
      .join('\n');

    return `${networkLines}\n\n[OFERTAS ESPECIALES SOLO POR HOY]\n${offerLines}`;
  }, [services, specialOffers]);

  const generateSmartCatalogReply = (query: string): { reply: string; action: { label: string; waText: string } } => {
    const q = query.toLowerCase();

    if (
      q.includes('velocidad') ||
      q.includes('ritmo') ||
      q.includes('entrega') ||
      q.includes('express') ||
      q.includes('progresivo') ||
      q.includes('tiempo') ||
      q.includes('demora') ||
      q.includes('tarda')
    ) {
      return {
        reply: `🚀 **Ritmo y Velocidad de Entrega Oficial (IA 2.5 Flash):**\n\nPuedes elegir la velocidad en cada producto o en tu **Pedido Conjunto**:\n• ⚡ **Modo Express:** Entrega rápida de **48 a 72 horas** (ideal para campañas urgentes y lanzamientos).\n• 🛡️ **Modo Progresivo (Drip-Feed):** Entrega gradual de **7 días en adelante** (crecimiento orgánico escalonado para máxima seguridad del algoritmo).\n\nTodos nuestros servicios incluyen **Garantía Antidrop de 30 días** y no requieren tu contraseña.`,
        action: {
          label: 'Coordinar pedido y velocidad por WhatsApp',
          waText: `¡Hola! Quiero realizar un pedido y elegir mi ritmo de entrega (Express 48 a 72 horas o Progresivo 7 días en adelante).`,
        },
      };
    }

    if (
      q.includes('metodo') ||
      q.includes('pago') ||
      q.includes('binance') ||
      q.includes('pago movil') ||
      q.includes('tasa') ||
      q.includes('banco') ||
      q.includes('venezuela') ||
      q.includes('0102') ||
      q.includes('usdt')
    ) {
      return {
        reply: `💳 **Datos de Pago Oficiales Verificados:**\n\n🏦 **1. Pago Móvil (Venezuela):**\n• Banco: **${paymentConfig.pagoMovil.bank} (${paymentConfig.pagoMovil.bankCode})**\n• Teléfono: **${paymentConfig.pagoMovil.phone}**\n• Cédula: **V-${paymentConfig.pagoMovil.id}**\n\n🟡 **2. Binance Pay (USDT - Cero Comisión):**\n• Binance ID: **${paymentConfig.binancePayId}**\n\n📲 Una vez realizado el pago, envía tu comprobante a nuestro WhatsApp **${paymentConfig.whatsappDisplay}** junto con el enlace de tu perfil o publicación.`,
        action: {
          label: 'Confirmar pago por WhatsApp',
          waText: `¡Hola! Quiero confirmar los datos de pago por Pago Móvil (${paymentConfig.pagoMovil.bankCode} / ${paymentConfig.pagoMovil.phone}) o Binance Pay (${paymentConfig.binancePayId}).`,
        },
      };
    }

    if (q.includes('oferta') || q.includes('solo por hoy') || q.includes('descuento') || q.includes('promo')) {
      const offersText = specialOffers
        .map(
          (o) =>
            `• **${o.title} (${o.subtitle}):** **${typeof o.price === 'number' ? `$${o.price} USD` : 'Consultar'}** — ${o.features.join(' + ')}`
        )
        .join('\n');
      return {
        reply: `🔥 **Ofertas Relámpago "Solo por Hoy" (Precios en USD):**\n\n${offersText}\n\n⚡ Disponibles en **Modo Express (48 a 72h)** o **Modo Progresivo (7 días en adelante)**. Puedes agregarlas a tu **Pedido Conjunto** con el botón **+ Añadir** o pedirlas directo por WhatsApp.`,
        action: {
          label: 'Solicitar Oferta Relámpago en WhatsApp',
          waText: '¡Hola! Me interesan las Ofertas Especiales "Solo por Hoy" del catálogo.',
        },
      };
    }

    // Match specific networks dynamically from live catalog
    const networkKeywords: { key: string; matches: string[]; label: string }[] = [
      { key: 'instagram', matches: ['instagram', 'ig', 'reels'], label: 'Instagram' },
      { key: 'tiktok', matches: ['tiktok', 'tik tok', 'tt'], label: 'TikTok' },
      { key: 'youtube', matches: ['youtube', 'yt', 'subs', 'suscriptores', '4000', 'monetiz'], label: 'YouTube' },
      { key: 'spotify', matches: ['spotify', 'musica', 'oyentes', 'reproducciones', 'playlist', 'podcast'], label: 'Spotify' },
      { key: 'facebook', matches: ['facebook', 'fb', 'fanpage'], label: 'Facebook' },
      { key: 'kick', matches: ['kick', 'streamers', 'viewers'], label: 'Kick' },
      { key: 'special', matches: ['especial', 'combo', 'paquete', 'viral'], label: 'Paquetes Especiales' },
    ];

    const matchedNets = networkKeywords.filter((n) => n.matches.some((m) => q.includes(m)));

    if (matchedNets.length > 0) {
      const blocks = matchedNets
        .map((net) => {
          const netServices = services.filter((s) => s.network === net.key);
          if (netServices.length === 0) return '';
          const lines = netServices
            .slice(0, 10)
            .map((s) => `  • **${s.name}** (${s.metric}): **$${s.price} USD**`)
            .join('\n');
          return `📌 **${net.label}:**\n${lines}`;
        })
        .filter(Boolean);

      if (blocks.length > 0) {
        return {
          reply: `💰 **Precios Oficiales en Tiempo Real (USD):**\n\n${blocks.join('\n\n')}\n\n⚡ **Ritmo de entrega a elección:** Modo Express (**48 a 72 horas**) o Modo Progresivo (**7 días en adelante**).\n🛒 Puedes tocar **"+ Añadir al Pedido"** en 2 o más servicios para armar tu **Pedido Conjunto** y enviarlo directo a WhatsApp.`,
          action: {
            label: `Pedir ${matchedNets.map((n) => n.label).join(' / ')} por WhatsApp`,
            waText: `¡Hola! Vi los precios en USD de ${matchedNets.map((n) => n.label).join(', ')} en el Asesor IA 2.5 Flash y quiero realizar un pedido.`,
          },
        };
      }
    }

    // General price / catalog overview
    if (q.includes('precio') || q.includes('catalogo') || q.includes('cuanto cuesta') || q.includes('servicio') || q.includes('seguidor') || q.includes('like')) {
      const igSeg = services.find((s) => s.id === 'ig-seg')?.price ?? 15;
      const ttSeg = services.find((s) => s.id === 'tt-seg')?.price ?? 15;
      const fbSeg = services.find((s) => s.id === 'fb-seg')?.price ?? 15;
      const ytSeg = services.find((s) => s.id === 'yt-seg')?.price ?? 60;
      const spRep = services.find((s) => s.id === 'sp-rep')?.price ?? 6.99;

      return {
        reply: `🚀 **Resumen de Precios Destacados en USD:**\n\n• **Instagram (1,000 Seguidores):** **$${igSeg} USD**\n• **TikTok (1,000 Seguidores):** **$${ttSeg} USD**\n• **Facebook (1,000 Seguidores):** **$${fbSeg} USD**\n• **YouTube (1,000 Suscriptores):** **$${ytSeg} USD**\n• **Spotify (1,000 Reproducciones):** **$${spRep} USD**\n\n⚡ **Entrega:** Modo Express (**48 a 72 horas**) o Modo Progresivo (**7 días en adelante**).\n¿De qué red social te gustaría ver todos los paquetes detallados?`,
        action: {
          label: 'Armar pedido por WhatsApp',
          waText: '¡Hola! Quiero cotizar un paquete de crecimiento para mis redes sociales.',
        },
      };
    }

    return {
      reply: `🤖 **Asesor IA 2.5 Flash:** Con gusto te ayudo con **"${query}"**.\n\nEn **Growth Viral Pro** manejamos:\n• Crecimiento para **Instagram, TikTok, YouTube, Spotify, Facebook, Telegram y WhatsApp**.\n• **Cuentas de Streaming** completas (Netflix, Disney+, Max, Prime Video, Spotify, Canva Pro).\n• Entrega **Express (48 a 72 horas)** o **Progresiva (7 días en adelante)**.\n• Pagos por **Pago Móvil BDV (${paymentConfig.pagoMovil.bankCode})** y **Binance Pay (${paymentConfig.binancePayId})**.\n\n¿Qué red social o paquete deseas cotizar en USD o enviar directo por WhatsApp?`,
      action: {
        label: `Atención Directa (${paymentConfig.whatsappDisplay})`,
        waText: `¡Hola! Tengo una consulta sobre: "${query}". ¿Me pueden asesorar?`,
      },
    };
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isTyping) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text,
      time: 'Ahora',
    };

    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);
    setInputText('');
    setIsTyping(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: updatedHistory.slice(-8).map((m) => ({
            sender: m.sender,
            text: m.text,
          })),
          catalogSummary,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.ok && typeof data.reply === 'string' && data.reply.trim()) {
          const botMsg: Message = {
            id: `b-${Date.now()}`,
            sender: 'bot',
            engine: 'IA 2.5 Flash',
            text: data.reply,
            time: 'Ahora',
            suggestedAction: data.suggestedAction,
          };
          setMessages((prev) => [...prev, botMsg]);
          setIsTyping(false);
          return;
        }
      }
    } catch {
      // Fallback to instant catalog intelligence if offline
    }

    // Instant live-catalog response fallback
    const { reply, action } = generateSmartCatalogReply(text);
    const fallbackMsg: Message = {
      id: `b-${Date.now()}`,
      sender: 'bot',
      engine: 'IA 2.5 Flash',
      text: reply,
      time: 'Ahora',
      suggestedAction: action,
    };
    setMessages((prev) => [...prev, fallbackMsg]);
    setIsTyping(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-x-2 bottom-2 sm:inset-x-auto sm:right-6 sm:bottom-6 z-50 w-auto sm:w-[430px] max-h-[92vh] sm:max-h-[85vh] h-[85vh] sm:h-[600px] bg-zinc-950 border border-zinc-800 rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
      {/* Bot Header */}
      <div className="p-4 bg-gradient-to-r from-zinc-900 via-purple-950/50 to-zinc-900 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-cyan-500 flex items-center justify-center text-white shadow-md">
              <Bot className="w-5 h-5" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-zinc-950" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-bold text-white">Asesor Bot Automatizado</h3>
              <span className="inline-flex items-center gap-1 text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full font-bold">
                <Sparkles className="w-2.5 h-2.5 text-cyan-400" />
                IA 2.5 Flash
              </span>
            </div>
            <p className="text-[11px] text-zinc-300">
              Catálogo USD en vivo • WhatsApp {paymentConfig.whatsappDisplay}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setMessages(INITIAL_MESSAGES)}
            title="Reiniciar conversación"
            className="w-8 h-8 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white flex items-center justify-center transition cursor-pointer"
            aria-label="Cerrar chat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-zinc-950/90 text-sm">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div className="flex items-end gap-2 max-w-[90%]">
              {m.sender === 'bot' && (
                <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-purple-600/40 to-cyan-500/40 border border-purple-500/30 flex items-center justify-center text-cyan-300 shrink-0 text-[10px] font-black mb-1">
                  2.5
                </div>
              )}

              <div
                className={`p-3.5 rounded-2xl whitespace-pre-wrap leading-relaxed text-xs sm:text-sm ${
                  m.sender === 'user'
                    ? 'bg-purple-600 text-white rounded-br-xs'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-bl-xs'
                }`}
              >
                {renderFormattedText(m.text)}

                {m.suggestedAction && (
                  <div className="mt-3 pt-2.5 border-t border-zinc-800">
                    <a
                      href={buildWhatsAppLink(m.suggestedAction.waText, paymentConfig.whatsappPhone)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition active:scale-95"
                    >
                      <MessageCircle className="w-3.5 h-3.5 fill-white" />
                      <span>{m.suggestedAction.label}</span>
                      <ExternalLink className="w-3 h-3 ml-0.5" />
                    </a>
                  </div>
                )}
              </div>

              {m.sender === 'user' && (
                <div className="w-6 h-6 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 shrink-0 text-xs font-bold mb-1">
                  <User className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
            <span className="text-[10px] text-zinc-400 mt-1 px-8">
              {m.sender === 'bot' && m.engine ? `${m.engine} • ${m.time}` : m.time}
            </span>
          </div>
        ))}

        {isTyping && (
          <div className="flex items-center gap-2 text-xs text-zinc-400 px-2 py-1">
            <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" />
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.2s]" />
            <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce [animation-delay:0.4s]" />
            <span className="text-[11px] text-purple-300 font-medium">
              ⚡ 2.5 Flash respondiendo al instante...
            </span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Bar */}
      <div className="p-2 bg-zinc-900/60 border-t border-zinc-800/80 overflow-x-auto flex gap-1.5 no-scrollbar">
        {QUICK_PROMPTS.map((prompt, i) => (
          <button
            key={i}
            type="button"
            disabled={isTyping}
            onClick={() => handleSendMessage(prompt.query)}
            className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-300 hover:text-white text-[11px] font-medium border border-zinc-700/60 transition cursor-pointer"
          >
            {prompt.label}
          </button>
        ))}
      </div>

      {/* Input Field */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-3 bg-zinc-900 border-t border-zinc-800 flex items-center gap-2"
      >
        <input
          type="text"
          placeholder="Pregúntale a la IA 2.5 Flash sobre precios o servicios..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={isTyping}
          className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 transition disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isTyping}
          className="w-9 h-9 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:hover:bg-purple-600 text-white flex items-center justify-center transition cursor-pointer shrink-0"
          aria-label="Enviar mensaje"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};

