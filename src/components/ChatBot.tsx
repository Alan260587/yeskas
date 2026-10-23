import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, X, MessageCircle, ExternalLink } from 'lucide-react';
import { buildWhatsAppLink } from '../data/catalogData';
import { useCatalogConfig } from '../context/CatalogConfigContext';

interface Message {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  time: string;
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
    text: `¡Hola! 👋 Soy el asistente virtual automatizado de Growth Viral Pro.\n\nPuedo responder tus dudas sobre precios en USD, ritmos de entrega (Modo Express 48 a 72 horas o Progresivo 7 días en adelante), métodos de pago y paquetes de monetización. ¿En qué te puedo ayudar hoy?`,
    time: 'Ahora',
  },
];

const QUICK_PROMPTS = [
  { label: '🎯 Analizador Monetización Multi-Red', query: 'analizador monetizar redes paquetes' },
  { label: '⚡ Velocidad y Ritmo de Entrega', query: 'velocidad ritmo entrega express progresivo' },
  { label: '🎧 Spotify Tarifas', query: 'servicios spotify tarifas' },
  { label: '💰 Precios Instagram & TikTok', query: 'precios instagram y tiktok' },
  { label: '💳 Métodos de Pago', query: 'metodos de pago' },
  { label: '🔥 Ofertas Solo por Hoy', query: 'ofertas solo por hoy' },
];

export const ChatBot: React.FC<ChatBotProps> = ({ isOpen, onClose }) => {
  const { paymentConfig, services } = useCatalogConfig();
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const generateBotReply = (query: string): { reply: string; action?: { label: string; waText: string } } => {
    const q = query.toLowerCase();

    if (
      q.includes('velocidad') ||
      q.includes('ritmo') ||
      q.includes('entrega') ||
      q.includes('express') ||
      q.includes('progresivo') ||
      q.includes('tiempo')
    ) {
      return {
        reply: `🚀 **Ritmo y Velocidad de Entrega Oficial:**\n\n• ⚡ **Modo Express:** **48 a 72 horas** (Entrega acelerada ideal para cumplir metas rápido).\n• 🌱 **Modo Progresivo (Drip-Feed):** **7 días en adelante** (Crecimiento orgánico gradual para máxima protección del algoritmo).\n• 🛡️ Todos los paquetes cuentan con **Garantía de 30 Días Antidrop**.`,
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
      q.includes('moneda') ||
      q.includes('venezuela') ||
      q.includes('0102')
    ) {
      return {
        reply: `💳 *Datos de Pago Verificados:*\n\n🏦 **Pago Móvil (Venezuela):**\n• Banco: **${paymentConfig.pagoMovil.bank} (${paymentConfig.pagoMovil.bankCode})**\n• Teléfono: **${paymentConfig.pagoMovil.phone}**\n• Cédula: **${paymentConfig.pagoMovil.id}**\n*(Consulta la tasa del día por WhatsApp antes de transferir)*\n\n🟡 **Binance Pay (USDT):**\n• ID: **${paymentConfig.binancePayId}** (Cero comisión)\n\n📲 *Envía tu captura de pago al WhatsApp ${paymentConfig.whatsappDisplay} para procesar tu orden al instante.*`,
        action: {
          label: 'Consultar tasa y confirmar por WhatsApp',
          waText: `¡Hola! Quiero consultar la tasa del día para transferir por Pago Móvil (${paymentConfig.pagoMovil.bankCode} / ${paymentConfig.pagoMovil.phone}) o Binance (${paymentConfig.binancePayId}).`,
        },
      };
    }

    if (q.includes('oferta') || q.includes('paquete') || q.includes('solo por hoy')) {
      return {
        reply: `🔥 **Ofertas Especiales "Solo por Hoy":**\n\n• **Impulso YouTube Básico:** 358 Likes + 1,000 Vistas garantizadas.\n• **Mega Crecimiento IG & TikTok:** 10,000 Seguidores para acelerar alcance.\n• **Plan YouTube Viral Masiva:** 1 Millón de Visitas + 10,000 Likes + 1,000 Comentarios.\n\nPuedes añadir varios paquetes a tu pedido conjunto o pedirlos directamente.`,
        action: {
          label: 'Pedir ofertas especiales por WhatsApp',
          waText: '¡Hola! Me interesan las ofertas especiales del catálogo para mis redes.',
        },
      };
    }

    if (
      q.includes('youtube') ||
      q.includes('4000') ||
      q.includes('monetiz') ||
      q.includes('socio') ||
      q.includes('horas') ||
      q.includes('analizador')
    ) {
      return {
        reply: `🎯 **Analizador de Monetización Multi-Red (YouTube, TikTok, Instagram, Facebook, Kick, Spotify):**\n\n• **Diagnóstico en vivo:** Eliges tu plataforma, colocas tu enlace y evalúa tus métricas actuales.\n• **Multi-Paquete:** Puedes seleccionar uno, varios o todos los paquetes recomendados y ajustar cantidades.\n• **Ritmo de entrega:** Elige entre **Modo Express (48 a 72 horas)** o **Modo Progresivo (7 días en adelante)**.\n• **Pago verificado:** Coordina por Pago Móvil (${paymentConfig.pagoMovil.bankCode}) o Binance (ID: ${paymentConfig.binancePayId}).`,
        action: {
          label: 'Acordar plan de monetización por WhatsApp',
          waText: '¡Hola! Quiero revisar el plan de monetización de mi cuenta y ponernos de acuerdo en los paquetes del catálogo.',
        },
      };
    }

    if (q.includes('spotify') || q.includes('musica') || q.includes('oyente') || q.includes('pista') || q.includes('podcast')) {
      const spotItems = services.filter((s) => s.network === 'spotify');
      const listStr = spotItems
        .slice(0, 6)
        .map((s, idx) => `  ${idx + 1}. ${s.name} (${s.metric}): **$${s.price} USD**`)
        .join('\n');
      return {
        reply: `🎧 **Tarifario de Servicios Digitales para Spotify (Precios en USD):**\n\n${listStr}\n\n• Entrega Express (48 a 72 horas) o Progresiva (7 días en adelante).\n¡Puedes añadir varios paquetes juntos al carrito o pedir por WhatsApp!`,
        action: {
          label: 'Pedir servicios de Spotify por WhatsApp',
          waText: '¡Hola! Me interesan los servicios de Spotify del catálogo.',
        },
      };
    }

    if (q.includes('instagram') || q.includes('ig') || q.includes('tiktok') || q.includes('seguidor') || q.includes('like') || q.includes('vista')) {
      const igSeg = services.find((s) => s.id === 'ig-seg')?.price ?? 15;
      const ttSeg = services.find((s) => s.id === 'tt-seg')?.price ?? 15;
      const fbSeg = services.find((s) => s.id === 'fb-seg')?.price ?? 15;
      const ytSeg = services.find((s) => s.id === 'yt-seg')?.price ?? 60;

      return {
        reply: `🚀 **Precios Actualizados en USD:**\n\n• **Instagram:** 1K Seg: $${igSeg} USD\n• **TikTok:** 1K Seg: $${ttSeg} USD\n• **Facebook:** 1K Seg: $${fbSeg} USD\n• **YouTube:** 1K Subs: $${ytSeg} USD\n• **Ritmo de entrega:** Modo Express (48 a 72 horas) o Modo Progresivo (7 días en adelante).\n\nPuedes armar un pedido con varios servicios juntos en el carrito y enviármelo a WhatsApp.`,
        action: {
          label: 'Hacer pedido por WhatsApp',
          waText: '¡Hola! Quiero cotizar varios servicios de seguidores e interacciones del catálogo.',
        },
      };
    }

    return {
      reply: `Entiendo tu consulta sobre "${query}".\n\nPara darte atención personalizada y cotización exacta en USD, puedes hablar directamente con nuestro asesor por WhatsApp al ${paymentConfig.whatsappDisplay}. Atendemos de inmediato.`,
      action: {
        label: `Hablar con Asesor (${paymentConfig.whatsappDisplay})`,
        waText: `¡Hola! Tengo una consulta sobre el catálogo: "${query}". ¿Me pueden ayudar?`,
      },
    };
  };

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text,
      time: 'Ahora',
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    setTimeout(() => {
      const { reply, action } = generateBotReply(text);
      const botMsg: Message = {
        id: `b-${Date.now()}`,
        sender: 'bot',
        text: reply,
        time: 'Ahora',
        suggestedAction: action,
      };
      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[94vw] sm:w-[420px] max-h-[85vh] h-[580px] bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
      {/* Bot Header */}
      <div className="p-4 bg-gradient-to-r from-zinc-900 via-purple-950/40 to-zinc-900 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-cyan-500 flex items-center justify-center text-white shadow-md">
              <Bot className="w-5 h-5" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-zinc-950" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-bold text-white">Bot Automatizado</h3>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full font-bold">
                Online
              </span>
            </div>
            <p className="text-[11px] text-zinc-300">
              Respuestas instantáneas • WhatsApp {paymentConfig.whatsappDisplay}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-8 h-8 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white flex items-center justify-center transition cursor-pointer"
          aria-label="Cerrar chat"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-zinc-950/90 text-sm">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div className="flex items-end gap-2 max-w-[88%]">
              {m.sender === 'bot' && (
                <div className="w-6 h-6 rounded-lg bg-purple-600/30 flex items-center justify-center text-purple-300 shrink-0 text-xs font-bold mb-1">
                  AI
                </div>
              )}

              <div
                className={`p-3.5 rounded-2xl whitespace-pre-wrap leading-relaxed text-xs sm:text-sm ${
                  m.sender === 'user'
                    ? 'bg-purple-600 text-white rounded-br-xs'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-bl-xs'
                }`}
              >
                {m.text}

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
            <span className="text-[10px] text-zinc-400 mt-1 px-8">{m.time}</span>
          </div>
        ))}

        {isTyping && (
          <div className="flex items-center gap-2 text-xs text-zinc-400 px-2 py-1">
            <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" />
            <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce [animation-delay:0.2s]" />
            <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce [animation-delay:0.4s]" />
            <span className="text-[11px]">Escribiendo respuesta...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Bar */}
      <div className="p-2 bg-zinc-900/60 border-t border-zinc-800/80 overflow-x-auto flex gap-1.5 no-scrollbar">
        {QUICK_PROMPTS.map((prompt, i) => (
          <button
            key={i}
            onClick={() => handleSendMessage(prompt.query)}
            className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-[11px] font-medium border border-zinc-700/60 transition cursor-pointer"
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
          placeholder="Escribe tu consulta o pide un precio..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 transition"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="w-9 h-9 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:hover:bg-purple-600 text-white flex items-center justify-center transition cursor-pointer shrink-0"
          aria-label="Enviar mensaje"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
