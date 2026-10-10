import React, { useState, useMemo } from 'react';
import { 
  Youtube, 
  Sparkles, 
  CheckCircle2, 
  MessageCircle, 
  ArrowRight, 
  ShieldCheck, 
  Clock, 
  Users, 
  Flame, 
  HelpCircle,
  Music,
  Share2,
  Tv,
  Eye,
  Radio,
  Zap,
  ShoppingBag,
  Check,
  Tag,
  FileText,
  Download
} from 'lucide-react';
import { ServiceItem } from '../types/catalog';
import { 
  WHATSAPP_DISPLAY, 
  BINANCE_PAY_ID, 
  buildWhatsAppLink, 
  buildUniversalMonetizationPlanWhatsAppMessage,
  PAGO_MOVIL_DATA 
} from '../data/catalogData';
import { ROICalculator } from './ROICalculator';
import { generateInstructionsPDF } from '../utils/generateInstructionsPDF';

type PlatformKey = 'youtube' | 'tiktok' | 'instagram' | 'facebook' | 'kick' | 'spotify';

interface PlatformConfig {
  id: PlatformKey;
  name: string;
  icon: string;
  color: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  title: string;
  subtitle: string;
  inputPlaceholder: string;
  inputLabel: string;
  thresholds: Array<{
    id: string;
    label: string;
    target: number;
    unit: string;
    min: number;
    max: number;
    step: number;
    defaultVal: number;
    presets: number[];
  }>;
}

const PLATFORMS_CONFIG: PlatformConfig[] = [
  {
    id: 'youtube',
    name: 'YouTube',
    icon: '▶️',
    color: 'from-red-600 to-rose-700',
    badgeBg: 'bg-red-500/20',
    badgeBorder: 'border-red-500/30',
    badgeText: 'text-red-400',
    title: 'Programa de Socios de YouTube (YPP)',
    subtitle: 'Requisitos oficiales: 4,000 Horas de reproducción públicas + 1,000 Suscriptores.',
    inputPlaceholder: 'https://youtube.com/@micanal o @nombre_de_canal',
    inputLabel: 'Enlace o nombre de tu canal de YouTube',
    thresholds: [
      {
        id: 'hours',
        label: 'Horas de reproducción públicas (últimos 365 días)',
        target: 4000,
        unit: 'h',
        min: 0,
        max: 4000,
        step: 50,
        defaultVal: 1200,
        presets: [0, 500, 1500, 2500, 3500],
      },
      {
        id: 'subs',
        label: 'Suscriptores actuales del canal',
        target: 1000,
        unit: 'subs',
        min: 0,
        max: 1000,
        step: 25,
        defaultVal: 350,
        presets: [0, 250, 500, 750, 1000],
      },
    ],
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: '🎵',
    color: 'from-cyan-500 via-zinc-900 to-rose-500',
    badgeBg: 'bg-cyan-500/20',
    badgeBorder: 'border-cyan-500/30',
    badgeText: 'text-cyan-400',
    title: 'TikTok Creator Rewards & Monetización LIVE',
    subtitle: 'Requisitos oficiales: 10,000 Seguidores + 100,000 Visualizaciones en los últimos 30 días.',
    inputPlaceholder: 'https://tiktok.com/@miusuario o @usuario',
    inputLabel: 'Enlace o usuario de tu cuenta de TikTok',
    thresholds: [
      {
        id: 'followers',
        label: 'Seguidores actuales de TikTok',
        target: 10000,
        unit: 'seguidores',
        min: 0,
        max: 10000,
        step: 250,
        defaultVal: 2500,
        presets: [500, 1000, 3000, 6000, 10000],
      },
      {
        id: 'views',
        label: 'Visualizaciones de video en los últimos 30 días',
        target: 100000,
        unit: 'vistas',
        min: 0,
        max: 100000,
        step: 2000,
        defaultVal: 22000,
        presets: [5000, 25000, 50000, 75000, 100000],
      },
    ],
  },
  {
    id: 'instagram',
    name: 'Instagram',
    icon: '📸',
    color: 'from-fuchsia-600 via-pink-600 to-rose-500',
    badgeBg: 'bg-pink-500/20',
    badgeBorder: 'border-pink-500/30',
    badgeText: 'text-pink-400',
    title: 'Meta Creator: Suscripciones y Colaboraciones de Marca',
    subtitle: 'Meta de industria para preparar tu cuenta para monetizar: 10,000 Seguidores + 5,000 Vistas de Reels.',
    inputPlaceholder: 'https://instagram.com/miusuario o @usuario',
    inputLabel: 'Enlace o @usuario de tu perfil de Instagram',
    thresholds: [
      {
        id: 'followers',
        label: 'Seguidores actuales de Instagram',
        target: 10000,
        unit: 'seguidores',
        min: 0,
        max: 10000,
        step: 250,
        defaultVal: 3000,
        presets: [500, 2000, 5000, 8000, 10000],
      },
      {
        id: 'reelsViews',
        label: 'Reproducciones promedio en tus Reels',
        target: 5000,
        unit: 'vistas',
        min: 0,
        max: 5000,
        step: 200,
        defaultVal: 1200,
        presets: [500, 1500, 3000, 4000, 5000],
      },
    ],
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: '📘',
    color: 'from-blue-600 to-indigo-700',
    badgeBg: 'bg-blue-500/20',
    badgeBorder: 'border-blue-500/30',
    badgeText: 'text-blue-400',
    title: 'Monetización In-Stream y Estrellas de Facebook',
    subtitle: 'Requisitos oficiales de Fanpage / Perfil Profesional: 5,000 Seguidores + 60,000 Minutos de reproducción.',
    inputPlaceholder: 'https://facebook.com/mipagina o enlace de perfil',
    inputLabel: 'Enlace de tu página o perfil profesional de Facebook',
    thresholds: [
      {
        id: 'followers',
        label: 'Seguidores de página / perfil profesional',
        target: 5000,
        unit: 'seguidores',
        min: 0,
        max: 5000,
        step: 100,
        defaultVal: 1500,
        presets: [500, 1500, 3000, 4000, 5000],
      },
      {
        id: 'videoMinutes',
        label: 'Reproducciones / Minutos de video acumulados',
        target: 60000,
        unit: 'vistas',
        min: 0,
        max: 60000,
        step: 1500,
        defaultVal: 18000,
        presets: [5000, 20000, 40000, 50000, 60000],
      },
    ],
  },
  {
    id: 'kick',
    name: 'Kick',
    icon: '🎮',
    color: 'from-emerald-500 to-green-600',
    badgeBg: 'bg-emerald-500/20',
    badgeBorder: 'border-emerald-500/30',
    badgeText: 'text-emerald-400',
    title: 'Programa de Afiliados Oficial de Kick Streaming',
    subtitle: 'Requisitos de Afiliado: 75 a 100 Seguidores + Espectadores estables durante tus horas de transmisión.',
    inputPlaceholder: 'https://kick.com/mistreamer o @canal',
    inputLabel: 'Enlace o nombre de canal en Kick',
    thresholds: [
      {
        id: 'followers',
        label: 'Seguidores actuales en tu canal de Kick',
        target: 100,
        unit: 'seguidores',
        min: 0,
        max: 100,
        step: 5,
        defaultVal: 25,
        presets: [0, 25, 50, 75, 100],
      },
      {
        id: 'streamHours',
        label: 'Horas de directo que transmites por sesión',
        target: 5,
        unit: 'horas',
        min: 1,
        max: 5,
        step: 1,
        defaultVal: 2,
        presets: [1, 2, 3, 4, 5],
      },
    ],
  },
  {
    id: 'spotify',
    name: 'Spotify',
    icon: '🎧',
    color: 'from-emerald-600 via-green-600 to-emerald-500',
    badgeBg: 'bg-emerald-500/20',
    badgeBorder: 'border-emerald-500/30',
    badgeText: 'text-emerald-400',
    title: 'Monetización y Algoritmo de Spotify for Artists',
    subtitle: 'Meta de posicionamiento y regalías: 5,000 Oyentes Mensuales + Streams dirigidos para cobrar regalías.',
    inputPlaceholder: 'https://open.spotify.com/artist/... o nombre de artista',
    inputLabel: 'Enlace de tu perfil de artista o canción en Spotify',
    thresholds: [
      {
        id: 'listeners',
        label: 'Oyentes Mensuales actuales en tu perfil',
        target: 5000,
        unit: 'oyentes',
        min: 0,
        max: 5000,
        step: 150,
        defaultVal: 1200,
        presets: [200, 1000, 2500, 4000, 5000],
      },
      {
        id: 'streams',
        label: 'Reproducciones / Streams acumulados de tu sencillo',
        target: 5000,
        unit: 'streams',
        min: 0,
        max: 5000,
        step: 250,
        defaultVal: 1500,
        presets: [500, 1500, 3000, 4000, 5000],
      },
    ],
  },
];

interface YouTubeMonetizationCalculatorProps {
  onClose?: () => void;
  isModal?: boolean;
  onAddToCart?: (service: ServiceItem) => void;
  onOpenInstructions?: () => void;
}

export interface DiagnosticPackageItem {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  detail: string;
  category: string;
  deliveryTime: string;
  guarantee: string;
  network: PlatformKey;
  metric: string;
}

export const YouTubeMonetizationCalculator: React.FC<YouTubeMonetizationCalculatorProps> = ({
  onClose,
  isModal = false,
  onAddToCart,
  onOpenInstructions,
}) => {
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformKey>('youtube');
  const [deliverySpeed, setDeliverySpeed] = useState<'express' | 'progressive'>('express');
  const [addedPackageId, setAddedPackageId] = useState<string | null>(null);

  const [accountUrls, setAccountUrls] = useState<Record<PlatformKey, string>>({
    youtube: '',
    tiktok: '',
    instagram: '',
    facebook: '',
    kick: '',
    spotify: '',
  });

  // State values for each platform's sliders
  const [metricValues, setMetricValues] = useState<Record<string, number>>({
    'youtube-hours': 1200,
    'youtube-subs': 350,
    'tiktok-followers': 2500,
    'tiktok-views': 22000,
    'instagram-followers': 3000,
    'instagram-reelsViews': 1200,
    'facebook-followers': 1500,
    'facebook-videoMinutes': 18000,
    'kick-followers': 35,
    'kick-streamHours': 2,
    'spotify-listeners': 1200,
    'spotify-streams': 1500,
  });

  const [includeInteractionBoost, setIncludeInteractionBoost] = useState<boolean>(true);
  const [showHowItWorks, setShowHowItWorks] = useState<boolean>(false);

  const activePlatform = useMemo(() => {
    return PLATFORMS_CONFIG.find((p) => p.id === selectedPlatform)!;
  }, [selectedPlatform]);

  const currentUrl = accountUrls[selectedPlatform];

  const handleUrlChange = (val: string) => {
    setAccountUrls((prev) => ({
      ...prev,
      [selectedPlatform]: val,
    }));
  };

  const setMetricValue = (key: string, val: number) => {
    setMetricValues((prev) => ({
      ...prev,
      [key]: val,
    }));
  };

  // Plan Breakdown Calculator based on selected platform, delivery speed (Idea #4) and catalog prices
  const planDiagnostic = useMemo(() => {
    const packages: DiagnosticPackageItem[] = [];
    const metricsSummary: Array<{ label: string; current: number; missing: number; target: number; unit: string }> = [];
    const isExpress = deliverySpeed === 'express';

    if (selectedPlatform === 'youtube') {
      const currentHours = metricValues['youtube-hours'] ?? 1200;
      const currentSubs = metricValues['youtube-subs'] ?? 350;
      const missingHours = Math.max(0, 4000 - currentHours);
      const missingSubs = Math.max(0, 1000 - currentSubs);

      metricsSummary.push({ label: 'Horas públicas', current: currentHours, missing: missingHours, target: 4000, unit: 'h' });
      metricsSummary.push({ label: 'Suscriptores', current: currentSubs, missing: missingSubs, target: 1000, unit: 'subs' });

      if (missingHours > 0) {
        if (missingHours > 2800) {
          packages.push({
            id: 'diag-yt-4000h',
            name: 'Servicio Oficial de 4,000 Horas YouTube',
            price: 130,
            originalPrice: 160,
            detail: `${missingHours.toLocaleString()}h de reproducción de alta retención (Paquete Completo)`,
            category: 'Horas',
            deliveryTime: isExpress ? '48 - 72 hrs' : '5 - 7 días (Drip-Feed)',
            guarantee: 'Garantía 30 días Antidrop',
            network: 'youtube',
            metric: `${missingHours.toLocaleString()} Horas`,
          });
        } else if (missingHours > 1600) {
          packages.push({
            id: 'diag-yt-2500h',
            name: 'Paquete de 2,500 Horas de Reproducción',
            price: 85,
            originalPrice: 105,
            detail: `Cubre tus ${missingHours.toLocaleString()}h faltantes con retención gradual`,
            category: 'Horas',
            deliveryTime: isExpress ? '36 - 48 hrs' : '4 - 5 días (Drip-Feed)',
            guarantee: 'Garantía 30 días Antidrop',
            network: 'youtube',
            metric: '2,500 Horas',
          });
        } else if (missingHours > 600) {
          packages.push({
            id: 'diag-yt-1500h',
            name: 'Paquete de 1,500 Horas de Reproducción',
            price: 55,
            originalPrice: 70,
            detail: `Impulso para completar tus ${missingHours.toLocaleString()}h faltantes`,
            category: 'Horas',
            deliveryTime: isExpress ? '24 - 36 hrs' : '3 - 4 días (Drip-Feed)',
            guarantee: 'Garantía 30 días Antidrop',
            network: 'youtube',
            metric: '1,500 Horas',
          });
        } else {
          packages.push({
            id: 'diag-yt-sprint',
            name: 'Paquete Sprint de Horas Restantes',
            price: 30,
            originalPrice: 40,
            detail: `Remate final de ${missingHours.toLocaleString()}h para enviar tu solicitud`,
            category: 'Horas',
            deliveryTime: isExpress ? '12 - 24 hrs' : '2 - 3 días (Drip-Feed)',
            guarantee: 'Garantía 30 días Antidrop',
            network: 'youtube',
            metric: `${missingHours.toLocaleString()} Horas`,
          });
        }
      }

      if (missingSubs > 0) {
        packages.push({
          id: 'diag-yt-1ksubs',
          name: '1K Suscriptores Reales para YouTube',
          price: 60,
          originalPrice: 75,
          detail: `Cumple los 1,000 subs requeridos (Te faltan ${missingSubs.toLocaleString()})`,
          category: 'Suscriptores',
          deliveryTime: isExpress ? '24 - 48 hrs' : '3 - 5 días (Drip-Feed)',
          guarantee: 'Garantía 30 días Antidrop',
          network: 'youtube',
          metric: '1K Suscriptores',
        });
      }

      if (includeInteractionBoost) {
        packages.push({
          id: 'diag-yt-boost',
          name: 'Impulso YouTube Básico (Oferta Especial)',
          price: 15,
          originalPrice: 20,
          detail: '358 Likes garantizados + 1,000 Vistas en video para activar el algoritmo',
          category: 'Interacción',
          deliveryTime: isExpress ? '12 - 24 hrs' : '1 - 2 días',
          guarantee: 'Garantía 30 días Antidrop',
          network: 'youtube',
          metric: '358 Likes + 1K Vistas',
        });
      }
    } 
    else if (selectedPlatform === 'tiktok') {
      const currentFollowers = metricValues['tiktok-followers'] ?? 2500;
      const currentViews = metricValues['tiktok-views'] ?? 22000;
      const missingFollowers = Math.max(0, 10000 - currentFollowers);
      const missingViews = Math.max(0, 100000 - currentViews);

      metricsSummary.push({ label: 'Seguidores', current: currentFollowers, missing: missingFollowers, target: 10000, unit: 'seguidores' });
      metricsSummary.push({ label: 'Vistas en 30 días', current: currentViews, missing: missingViews, target: 100000, unit: 'vistas' });

      if (missingFollowers > 0) {
        const unitsOf1K = Math.min(10, Math.ceil(missingFollowers / 1000));
        const price = unitsOf1K * 15;
        packages.push({
          id: `diag-tt-followers-${unitsOf1K}k`,
          name: `Paquete de ${unitsOf1K * 1000} Seguidores Reales TikTok`,
          price,
          originalPrice: Math.round(price * 1.25),
          detail: `Alcanza los 10,000 seguidores para el Fondo de Creadores y LIVE (${unitsOf1K}k a $15 c/u)`,
          category: 'Seguidores',
          deliveryTime: isExpress ? '24 - 48 hrs' : '3 - 5 días (Drip-Feed)',
          guarantee: 'Garantía 30 días Antidrop',
          network: 'tiktok',
          metric: `${unitsOf1K}K Seguidores`,
        });
      }

      if (missingViews > 0) {
        const promoUnits = Math.min(10, Math.ceil(missingViews / 10000));
        const price = promoUnits * 10;
        packages.push({
          id: `diag-tt-views-${promoUnits * 3}k`,
          name: `Impulso de Reproducciones Virales TikTok (${promoUnits * 3}K Vistas)`,
          price,
          originalPrice: Math.round(price * 1.3),
          detail: `Súper Promo de vistas para activar el algoritmo Para Ti y alcanzar los 100K`,
          category: 'Vistas',
          deliveryTime: isExpress ? '12 - 24 hrs' : '2 - 4 días',
          guarantee: 'Garantía 30 días Antidrop',
          network: 'tiktok',
          metric: `${promoUnits * 3}K Vistas`,
        });
      }

      if (includeInteractionBoost) {
        packages.push({
          id: 'diag-tt-likes-1k',
          name: '1K Likes en Videos TikTok',
          price: 10,
          originalPrice: 15,
          detail: '1,000 Me Gustas para disparar el ratio de interacción y retención',
          category: 'Likes',
          deliveryTime: isExpress ? '12 - 24 hrs' : '1 - 2 días',
          guarantee: 'Garantía 30 días Antidrop',
          network: 'tiktok',
          metric: '1K Likes',
        });
      }
    }
    else if (selectedPlatform === 'instagram') {
      const currentFollowers = metricValues['instagram-followers'] ?? 3000;
      const currentViews = metricValues['instagram-reelsViews'] ?? 1200;
      const missingFollowers = Math.max(0, 10000 - currentFollowers);
      const missingViews = Math.max(0, 5000 - currentViews);

      metricsSummary.push({ label: 'Seguidores', current: currentFollowers, missing: missingFollowers, target: 10000, unit: 'seguidores' });
      metricsSummary.push({ label: 'Vistas en Reels', current: currentViews, missing: missingViews, target: 5000, unit: 'vistas' });

      if (missingFollowers > 0) {
        const unitsOf1K = Math.min(10, Math.ceil(missingFollowers / 1000));
        const price = unitsOf1K * 15;
        packages.push({
          id: `diag-ig-followers-${unitsOf1K}k`,
          name: `Mega Crecimiento: ${unitsOf1K * 1000} Seguidores Instagram`,
          price,
          originalPrice: Math.round(price * 1.25),
          detail: `Prepara tu cuenta para monetizar y colaboraciones (${unitsOf1K}k a $15 c/u)`,
          category: 'Seguidores',
          deliveryTime: isExpress ? '24 - 48 hrs' : '3 - 5 días (Drip-Feed)',
          guarantee: 'Garantía 30 días Antidrop',
          network: 'instagram',
          metric: `${unitsOf1K}K Seguidores`,
        });
      }

      if (missingViews > 0) {
        const unitsOfViews = Math.min(5, Math.ceil(missingViews / 1000));
        const price = unitsOfViews * 10;
        packages.push({
          id: `diag-ig-reels-${unitsOfViews}k`,
          name: `Interacción y Vistas en Reels (${unitsOfViews * 1000} Vistas)`,
          price,
          originalPrice: Math.round(price * 1.3),
          detail: `Posiciona tus reels en la pestaña Explorar ($10 por cada 1,000)`,
          category: 'Reels',
          deliveryTime: isExpress ? '12 - 24 hrs' : '2 - 3 días',
          guarantee: 'Garantía 30 días Antidrop',
          network: 'instagram',
          metric: `${unitsOfViews}K Vistas`,
        });
      }

      if (includeInteractionBoost) {
        packages.push({
          id: 'diag-ig-likes-1k',
          name: '1K Likes en Posts y Reels',
          price: 10,
          originalPrice: 15,
          detail: '1,000 corazones para validar engagement y presencia estética',
          category: 'Likes',
          deliveryTime: isExpress ? '12 - 24 hrs' : '1 - 2 días',
          guarantee: 'Garantía 30 días Antidrop',
          network: 'instagram',
          metric: '1K Likes',
        });
      }
    }
    else if (selectedPlatform === 'facebook') {
      const currentFollowers = metricValues['facebook-followers'] ?? 1500;
      const currentMinutes = metricValues['facebook-videoMinutes'] ?? 18000;
      const missingFollowers = Math.max(0, 5000 - currentFollowers);
      const missingMinutes = Math.max(0, 60000 - currentMinutes);

      metricsSummary.push({ label: 'Seguidores', current: currentFollowers, missing: missingFollowers, target: 5000, unit: 'seguidores' });
      metricsSummary.push({ label: 'Vistas / Minutos', current: currentMinutes, missing: missingMinutes, target: 60000, unit: 'vistas' });

      if (missingFollowers > 0) {
        const unitsOf1K = Math.min(5, Math.ceil(missingFollowers / 1000));
        const price = unitsOf1K * 15;
        packages.push({
          id: `diag-fb-followers-${unitsOf1K}k`,
          name: `Seguidores de Página / Perfil (${unitsOf1K * 1000} Seg.)`,
          price,
          originalPrice: Math.round(price * 1.25),
          detail: `Alcanza la meta de 5,000 seguidores para monetizar In-Stream (${unitsOf1K}k a $15 c/u)`,
          category: 'Seguidores',
          deliveryTime: isExpress ? '24 - 48 hrs' : '3 - 5 días (Drip-Feed)',
          guarantee: 'Garantía 30 días Antidrop',
          network: 'facebook',
          metric: `${unitsOf1K}K Seguidores`,
        });
      }

      if (missingMinutes > 0) {
        const unitsOfViews = Math.min(5, Math.ceil(missingMinutes / 12000));
        const price = unitsOfViews * 10;
        packages.push({
          id: `diag-fb-views-${unitsOfViews}k`,
          name: `Reproducciones de Video y Reels (${unitsOfViews * 1000} Vistas)`,
          price,
          originalPrice: Math.round(price * 1.3),
          detail: `Tiempo de visualización de alta retención para cumplir los 60,000 minutos`,
          category: 'Vistas',
          deliveryTime: isExpress ? '24 - 48 hrs' : '3 - 5 días',
          guarantee: 'Garantía 30 días Antidrop',
          network: 'facebook',
          metric: `${unitsOfViews}K Vistas`,
        });
      }

      if (includeInteractionBoost) {
        packages.push({
          id: 'diag-fb-emojis-1k',
          name: '1K Emojis / Reacciones Personalizadas',
          price: 15,
          originalPrice: 20,
          detail: '1,000 reacciones (Me encanta / Me importa) para interacción orgánica',
          category: 'Reacciones',
          deliveryTime: isExpress ? '12 - 24 hrs' : '1 - 2 días',
          guarantee: 'Garantía 30 días Antidrop',
          network: 'facebook',
          metric: '1K Emojis',
        });
      }
    }
    else if (selectedPlatform === 'kick') {
      const currentFollowers = metricValues['kick-followers'] ?? 35;
      const streamHours = metricValues['kick-streamHours'] ?? 2;
      const missingFollowers = Math.max(0, 100 - currentFollowers);

      metricsSummary.push({ label: 'Seguidores', current: currentFollowers, missing: missingFollowers, target: 100, unit: 'seguidores' });
      metricsSummary.push({ label: 'Horas de directo', current: streamHours, missing: 0, target: 5, unit: 'horas' });

      if (missingFollowers > 0) {
        packages.push({
          id: 'diag-kick-100subs',
          name: 'Kick 100 Seguidores (Meta Afiliado)',
          price: 5,
          originalPrice: 8,
          detail: 'Desbloquea el requisito de seguidores del Programa de Afiliados de Kick',
          category: 'Seguidores',
          deliveryTime: isExpress ? '12 - 24 hrs' : '2 - 3 días',
          guarantee: 'Garantía 30 días Antidrop',
          network: 'kick',
          metric: '100 Seguidores',
        });
      }

      const viewerPrices: Record<number, number> = { 1: 5, 2: 7, 3: 9, 4: 11, 5: 13 };
      const hoursPrice = viewerPrices[streamHours] || 7;
      packages.push({
        id: `diag-kick-viewers-${streamHours}h`,
        name: `Kick Viewers x ${streamHours} Horas (100 Viewers)`,
        price: hoursPrice,
        originalPrice: hoursPrice + 4,
        detail: `Audiencia simultánea continua para posicionar tu directo en la portada de Kick`,
        category: 'Viewers',
        deliveryTime: isExpress ? 'En vivo inmediato' : 'Agendado con tu directo',
        guarantee: 'Garantía 30 días Antidrop',
        network: 'kick',
        metric: `100 Viewers x ${streamHours}H`,
      });

      if (includeInteractionBoost) {
        packages.push({
          id: 'diag-kick-300subs',
          name: 'Kick 300 Seguidores Extra (Impulso Canal)',
          price: 7,
          originalPrice: 10,
          detail: 'Comunidad sólida para optar a verificación y contratos en Kick',
          category: 'Seguidores',
          deliveryTime: isExpress ? '24 - 48 hrs' : '2 - 4 días',
          guarantee: 'Garantía 30 días Antidrop',
          network: 'kick',
          metric: '300 Seguidores',
        });
      }
    }
    else if (selectedPlatform === 'spotify') {
      const currentListeners = metricValues['spotify-listeners'] ?? 1200;
      const currentStreams = metricValues['spotify-streams'] ?? 1500;
      const missingListeners = Math.max(0, 5000 - currentListeners);
      const missingStreams = Math.max(0, 5000 - currentStreams);

      metricsSummary.push({ label: 'Oyentes Mensuales', current: currentListeners, missing: missingListeners, target: 5000, unit: 'oyentes' });
      metricsSummary.push({ label: 'Reproducciones', current: currentStreams, missing: missingStreams, target: 5000, unit: 'streams' });

      if (missingListeners > 0) {
        const units = Math.min(5, Math.ceil(missingListeners / 1000));
        const price = units * 15;
        packages.push({
          id: `diag-spot-listeners-${units}k`,
          name: `Oyentes Mensuales (${units * 1000} Oyentes)`,
          price,
          originalPrice: Math.round(price * 1.25),
          detail: `Métrica clave visible en tu perfil para cobrar regalías ($15 por cada 1,000)`,
          category: 'Oyentes',
          deliveryTime: isExpress ? '24 - 48 hrs' : '3 - 5 días (Drip-Feed)',
          guarantee: 'Garantía 30 días Antidrop',
          network: 'spotify',
          metric: `${units}K Oyentes`,
        });
      }

      if (missingStreams > 0) {
        const units = Math.min(5, Math.ceil(missingStreams / 1000));
        const price = units * 15;
        packages.push({
          id: `diag-spot-streams-${units}k`,
          name: `Reproducciones dirigidas - America Latina S4 (${units * 1000} Streams)`,
          price,
          originalPrice: Math.round(price * 1.25),
          detail: `Streams geolocalizados para posicionar en charts regionales ($15 por cada 1,000)`,
          category: 'Streams',
          deliveryTime: isExpress ? '24 - 48 hrs' : '3 - 6 días (Drip-Feed)',
          guarantee: 'Garantía 30 días Antidrop',
          network: 'spotify',
          metric: `${units}K Streams`,
        });
      }

      if (includeInteractionBoost) {
        packages.push({
          id: 'diag-spot-saves-1k',
          name: '1,000 Guardar (Saves) en Biblioteca',
          price: 15,
          originalPrice: 20,
          detail: 'La métrica clave que activa el algoritmo Discover Weekly y Release Radar',
          category: 'Saves',
          deliveryTime: isExpress ? '12 - 24 hrs' : '2 - 3 días',
          guarantee: 'Garantía 30 días Antidrop',
          network: 'spotify',
          metric: '1K Saves',
        });
      }
    }

    const total = packages.reduce((acc, p) => acc + p.price, 0);

    return {
      packages,
      total,
      metricsSummary,
    };
  }, [selectedPlatform, metricValues, includeInteractionBoost, deliverySpeed]);

  const handleAddToCartPackage = (pkg: DiagnosticPackageItem) => {
    if (onAddToCart) {
      onAddToCart({
        id: pkg.id,
        network: pkg.network,
        name: pkg.name,
        metric: pkg.metric,
        price: pkg.price,
        unit: pkg.detail,
        description: `${pkg.detail} | ⏱️ ${pkg.deliveryTime} | 🛡️ ${pkg.guarantee}`,
        deliveryTime: pkg.deliveryTime,
        guarantee: pkg.guarantee,
        image: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=800&q=80',
      });
      setAddedPackageId(pkg.id);
      setTimeout(() => setAddedPackageId(null), 1500);
    }
  };

  const getSinglePackageWaUrl = (pkg: DiagnosticPackageItem) => {
    const text = `🔥 ¡Hola! Vengo del Centro de Diagnóstico de ${activePlatform.name} y me interesa adquirir este paquete:\n\n📌 *Paquete:* ${pkg.name} ($${pkg.price} USD)\n📝 *Detalle:* ${pkg.detail}\n⏱️ *Tiempo de Entrega:* ${pkg.deliveryTime}\n🛡️ *Garantía:* ${pkg.guarantee}\n🚀 *Ritmo Solicitado:* ${deliverySpeed === 'express' ? 'Express (24-48h)' : 'Progresivo / Drip-feed (3-7 días)'}\n🔗 *Mi enlace:* ${currentUrl.trim() || 'Te lo facilito por aquí en el chat'}\n\n¿Me confirmas disponibilidad y tasa para coordinar por Binance (ID: ${BINANCE_PAY_ID}) o Pago Móvil? ¡Gracias!`;
    return buildWhatsAppLink(text);
  };

  const handleSendToWhatsApp = () => {
    const message = buildUniversalMonetizationPlanWhatsAppMessage({
      platformName: activePlatform.name,
      platformIcon: activePlatform.icon,
      accountUrl: currentUrl || 'Te lo paso por aquí en el chat',
      metrics: planDiagnostic.metricsSummary,
      recommendedPackages: planDiagnostic.packages.map((p) => ({
        name: p.name,
        price: p.price,
        detail: p.detail,
        deliveryTime: p.deliveryTime,
        guarantee: p.guarantee,
      })),
      deliverySpeed,
      totalEstimate: planDiagnostic.total,
    });

    const link = buildWhatsAppLink(message);
    window.open(link, '_blank');
  };

  return (
    <div className="bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-10 text-white shadow-2xl relative overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Section Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8 pb-6 border-b border-zinc-800 relative z-10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-bold mb-2 uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-amber-400" />
            Centro de Diagnóstico y Monetización Multi-Red
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            ¿Qué paquetes necesitas para monetizar tu cuenta?
          </h2>
          <p className="text-xs sm:text-sm text-zinc-300 mt-1 max-w-2xl">
            Elige tu plataforma, coloca tu enlace, descubre qué te falta para monetizar o alcanzar tus metas, y ponte de acuerdo por WhatsApp con los paquetes del catálogo.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
          <button
            onClick={() => {
              if (onOpenInstructions) {
                onOpenInstructions();
              } else {
                generateInstructionsPDF();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600/30 to-indigo-600/30 hover:from-purple-600/50 hover:to-indigo-600/50 text-purple-200 hover:text-white text-xs font-bold border border-purple-500/40 transition cursor-pointer shadow-sm"
            title="Ver y descargar manual completo en PDF"
          >
            <FileText className="w-3.5 h-3.5 text-purple-400" />
            <span>Instructivo PDF</span>
          </button>

          <button
            onClick={() => setShowHowItWorks(!showHowItWorks)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold border border-zinc-700 transition cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>{showHowItWorks ? 'Ocultar Guía' : '¿Cómo funciona?'}</span>
          </button>

          {isModal && onClose && (
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl bg-zinc-800 text-zinc-300 hover:text-white text-xs font-semibold hover:bg-zinc-700 transition cursor-pointer"
            >
              Cerrar ✕
            </button>
          )}
        </div>
      </div>

      {/* Explanatory 4-step Banner */}
      {showHowItWorks && (
        <div className="mb-8 p-4 sm:p-5 rounded-2xl bg-zinc-900/95 border border-zinc-750 text-xs text-zinc-300 relative z-10 animate-in fade-in duration-200">
          <div className="flex items-center justify-between mb-3">
            <span className="font-extrabold text-white text-xs sm:text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              ¿Cómo funciona el analizador para cada plataforma?
            </span>
            <span className="text-[10px] text-zinc-400">4 Pasos sencillos</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-zinc-950/80 p-3 rounded-xl border border-zinc-800">
              <span className="w-5 h-5 rounded-full bg-purple-600/30 text-purple-400 font-bold inline-flex items-center justify-center text-[10px] mb-1.5">
                1
              </span>
              <div className="font-bold text-white text-[11px]">1. Elige tu Red Social</div>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Selecciona YouTube, TikTok, Instagram, Facebook, Kick o Spotify.
              </p>
            </div>

            <div className="bg-zinc-950/80 p-3 rounded-xl border border-zinc-800">
              <span className="w-5 h-5 rounded-full bg-blue-600/30 text-blue-400 font-bold inline-flex items-center justify-center text-[10px] mb-1.5">
                2
              </span>
              <div className="font-bold text-white text-[11px]">2. Pones tu Enlace</div>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Pega el link de tu canal, perfil o canción y ajusta tus métricas de hoy.
              </p>
            </div>

            <div className="bg-zinc-950/80 p-3 rounded-xl border border-zinc-800">
              <span className="w-5 h-5 rounded-full bg-amber-600/30 text-amber-400 font-bold inline-flex items-center justify-center text-[10px] mb-1.5">
                3
              </span>
              <div className="font-bold text-white text-[11px]">3. Diagnóstico y Paquetes</div>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Calcula qué te falta y asigna los paquetes exactos del catálogo sumando el total.
              </p>
            </div>

            <div className="bg-zinc-950/80 p-3 rounded-xl border border-zinc-800">
              <span className="w-5 h-5 rounded-full bg-emerald-600/30 text-emerald-400 font-bold inline-flex items-center justify-center text-[10px] mb-1.5">
                4
              </span>
              <div className="font-bold text-white text-[11px]">4. Acuerdo en WhatsApp</div>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Tocas el botón para coordinar tasa (Pago Móvil / Binance) y la entrega.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* PLATFORMS SELECTOR TABS (YouTube, TikTok, Instagram, Facebook, Kick, Spotify) */}
      <div className="mb-8 relative z-10">
        <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-3">
          Selecciona la plataforma a diagnosticar:
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {PLATFORMS_CONFIG.map((platform) => {
            const isSelected = selectedPlatform === platform.id;
            return (
              <button
                key={platform.id}
                onClick={() => setSelectedPlatform(platform.id)}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all cursor-pointer text-center ${
                  isSelected
                    ? 'bg-zinc-900 border-purple-500 shadow-lg shadow-purple-950/40 text-white'
                    : 'bg-zinc-950/80 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                }`}
              >
                <span className="text-2xl mb-1">{platform.icon}</span>
                <span className="text-xs font-bold">{platform.name}</span>
                <span className={`text-[10px] font-semibold mt-0.5 ${isSelected ? 'text-purple-300' : 'text-zinc-500'}`}>
                  Monetización
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* MAIN DIAGNOSTIC WORKBENCH */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative z-10">
        
        {/* Left Column: Platform Inputs & Sliders */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Active Platform Header Banner */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 sm:p-5 flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">{activePlatform.icon}</span>
                <h3 className="text-base sm:text-lg font-black text-white">
                  {activePlatform.title}
                </h3>
              </div>
              <p className="text-xs text-zinc-300 mt-1">
                {activePlatform.subtitle}
              </p>
            </div>
            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shrink-0 ${activePlatform.badgeBg} ${activePlatform.badgeBorder} ${activePlatform.badgeText} border`}>
              Meta Oficial
            </span>
          </div>

          {/* Account URL Input */}
          <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-4 sm:p-5">
            <label className="block text-xs sm:text-sm font-bold text-white mb-1.5 flex items-center justify-between">
              <span>{activePlatform.inputLabel}:</span>
              <span className="text-[11px] text-purple-400 font-semibold">Para vincular tu cotización</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder={activePlatform.inputPlaceholder}
                value={currentUrl}
                onChange={(e) => handleUrlChange(e.target.value)}
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 transition shadow-inner"
              />
              {currentUrl.trim() && (
                <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold whitespace-nowrap self-center">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Listo</span>
                </div>
              )}
            </div>
          </div>

          {/* Interactive Metric Sliders for the active platform */}
          {activePlatform.thresholds.map((metric) => {
            const key = `${activePlatform.id}-${metric.id}`;
            const currentValue = metricValues[key] ?? metric.defaultVal;
            const missing = Math.max(0, metric.target - currentValue);
            const percentage = Math.min(100, Math.round((currentValue / metric.target) * 100));

            return (
              <div key={metric.id} className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-4 sm:p-5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <label className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-purple-400" />
                    <span>{metric.label}:</span>
                  </label>
                  <div className="flex items-baseline gap-1 self-end sm:self-auto">
                    <span className="text-base font-black text-purple-400 bg-purple-950/60 border border-purple-900 px-2.5 py-0.5 rounded-lg">
                      {currentValue.toLocaleString()} {metric.unit}
                    </span>
                    <span className="text-xs text-zinc-400">/ {metric.target.toLocaleString()} {metric.unit}</span>
                  </div>
                </div>

                <input
                  type="range"
                  min={metric.min}
                  max={metric.max}
                  step={metric.step}
                  value={currentValue}
                  onChange={(e) => setMetricValue(key, Number(e.target.value))}
                  className="w-full h-3 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-600 focus:outline-none"
                />

                <div className="flex justify-between text-[11px] text-zinc-400">
                  <span>{metric.min.toLocaleString()}</span>
                  <span className="text-emerald-400 font-bold">{percentage}% alcanzado</span>
                  <span className="text-purple-400 font-bold">Meta: {metric.target.toLocaleString()}</span>
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-[11px] text-zinc-400 self-center mr-1">Preajuste:</span>
                  {metric.presets.map((preset) => (
                    <button
                      key={preset}
                      onClick={() => setMetricValue(key, preset)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium transition cursor-pointer ${
                        currentValue === preset
                          ? 'bg-purple-600 border-purple-500 text-white'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                      }`}
                    >
                      {preset.toLocaleString()} {metric.unit}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Optional Boost Package Checkbox */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="universal-boost"
                checked={includeInteractionBoost}
                onChange={(e) => setIncludeInteractionBoost(e.target.checked)}
                className="mt-1 w-4 h-4 rounded text-purple-600 accent-purple-600 cursor-pointer"
              />
              <label htmlFor="universal-boost" className="cursor-pointer">
                <div className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                  <span>Incluir paquete de interacción complementario</span>
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.2 rounded-full font-bold">
                    Recomendado para revisión
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Añade likes o guardados (saves) del catálogo para validar actividad orgánica y acelerar la aprobación.
                </p>
              </label>
            </div>
          </div>

        </div>

        {/* Right Column: Diagnostic & WhatsApp Agreement Card */}
        <div className="lg:col-span-5 bg-gradient-to-b from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-7 space-y-6 shadow-2xl">
          
          {/* Header of Diagnostic Box */}
          <div>
            <div className="flex items-center justify-between text-xs uppercase tracking-wider text-zinc-400 font-bold mb-2">
              <span>Diagnóstico Oficial</span>
              <span className="text-purple-400 font-black">{activePlatform.name}</span>
            </div>

            {/* Metrics Missing Grid */}
            <div className="space-y-3 mb-4">
              {planDiagnostic.metricsSummary.map((m, idx) => {
                const perc = Math.min(100, Math.round((m.current / m.target) * 100));
                return (
                  <div key={idx} className="bg-zinc-950/90 border border-zinc-800 rounded-2xl p-3.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-400">{m.label}:</span>
                      {m.missing === 0 ? (
                        <span className="text-emerald-400 font-bold">¡Meta Cumplida!</span>
                      ) : (
                        <span className="text-white font-bold">
                          Te faltan: <strong className="text-rose-400">{m.missing.toLocaleString()} {m.unit}</strong>
                        </span>
                      )}
                    </div>
                    <div className="w-full h-2 bg-zinc-800 rounded-full mt-2 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-rose-500 rounded-full transition-all duration-500"
                        style={{ width: `${perc}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-zinc-400 mt-1">
                      <span>{m.current.toLocaleString()} / {m.target.toLocaleString()}</span>
                      <span>{perc}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Idea 4: Selector de Velocidad y Ritmo de Entrega para Todos los Paquetes */}
          <div className="bg-zinc-950/90 border border-zinc-800 rounded-2xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Ritmo y Velocidad de Entrega (Para todos los paquetes):</span>
              </span>
              <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full font-bold">
                Idea #4 Activa
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDeliverySpeed('express')}
                className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                  deliverySpeed === 'express'
                    ? 'bg-amber-500/15 border-amber-500/60 text-white shadow-md shadow-amber-950/40'
                    : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                }`}
              >
                <div className="text-xs font-black flex items-center gap-1 text-amber-400">
                  <Zap className="w-3 h-3" />
                  <span>Modo Express</span>
                </div>
                <div className="text-[10px] text-zinc-300 mt-0.5">24 a 48 hrs (Acelerado)</div>
                <div className="text-[9px] text-zinc-400 mt-0.5">Para monetizar urgente</div>
              </button>

              <button
                type="button"
                onClick={() => setDeliverySpeed('progressive')}
                className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                  deliverySpeed === 'progressive'
                    ? 'bg-emerald-500/15 border-emerald-500/60 text-white shadow-md shadow-emerald-950/40'
                    : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                }`}
              >
                <div className="text-xs font-black flex items-center gap-1 text-emerald-400">
                  <Clock className="w-3 h-3" />
                  <span>Modo Progresivo</span>
                </div>
                <div className="text-[10px] text-zinc-300 mt-0.5">3 a 7 días (Drip-Feed)</div>
                <div className="text-[9px] text-zinc-400 mt-0.5">Algoritmo 100% natural</div>
              </button>
            </div>
          </div>

          {/* Recommended Packages from Catalog (Idea 4 Applied to All Packages) */}
          <div>
            <div className="text-xs font-bold text-white uppercase tracking-wider mb-2.5 flex items-center justify-between">
              <span>Paquetes para Monetizarlo:</span>
              <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Garantía y Entrega Incluida
              </span>
            </div>

            <div className="space-y-3">
              {planDiagnostic.packages.length === 0 ? (
                <div className="p-4 bg-emerald-950/30 border border-emerald-500/30 rounded-2xl text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>🎉 ¡Tu cuenta ya cumple con las metas requeridas para monetizar o postular al programa de socios!</span>
                </div>
              ) : (
                planDiagnostic.packages.map((pkg) => {
                  const singleWaUrl = getSinglePackageWaUrl(pkg);
                  const isJustAdded = addedPackageId === pkg.id;

                  return (
                    <div
                      key={pkg.id}
                      className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 flex flex-col gap-3 transition-all hover:border-zinc-700 hover:shadow-lg shadow-black/40"
                    >
                      {/* Package Header & Pricing */}
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-bold text-white text-xs sm:text-sm flex items-center gap-1.5 flex-wrap">
                            <span className="w-2 h-2 rounded-full bg-purple-500" />
                            <span>{pkg.name}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-purple-300 font-semibold border border-zinc-700">
                              {pkg.category}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">{pkg.detail}</p>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="flex items-baseline justify-end gap-1.5">
                            <span className="text-xs text-zinc-400 line-through">${pkg.originalPrice}</span>
                            <span className="text-base font-black text-emerald-400">${pkg.price}</span>
                          </div>
                          <span className="text-[9px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded font-bold uppercase tracking-wider block mt-0.5">
                            Ahorras ${pkg.originalPrice - pkg.price} USD
                          </span>
                        </div>
                      </div>

                      {/* Idea 4: Delivery Time & Guarantee Badges for this package */}
                      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-zinc-900 text-[10px]">
                        <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 font-medium">
                          <Clock className="w-3 h-3 text-amber-400" />
                          <span>Entrega: <strong className="text-white">{pkg.deliveryTime}</strong></span>
                        </span>

                        <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-emerald-300 font-medium">
                          <ShieldCheck className="w-3 h-3 text-emerald-400" />
                          <span>{pkg.guarantee}</span>
                        </span>

                        <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-zinc-900/60 text-zinc-400">
                          <span>🔒 Sin contraseña</span>
                        </span>
                      </div>

                      {/* Individual Package Action Buttons */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        {onAddToCart ? (
                          <button
                            type="button"
                            onClick={() => handleAddToCartPackage(pkg)}
                            className={`py-2 px-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
                              isJustAdded
                                ? 'bg-purple-600 text-white'
                                : 'bg-zinc-900 hover:bg-zinc-800 text-purple-300 border border-purple-500/40'
                            }`}
                          >
                            {isJustAdded ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-white" />
                                <span>¡Añadido!</span>
                              </>
                            ) : (
                              <>
                                <ShoppingBag className="w-3.5 h-3.5 text-purple-400" />
                                <span>Añadir al Pedido</span>
                              </>
                            )}
                          </button>
                        ) : null}

                        <a
                          href={singleWaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`py-2 px-2.5 rounded-xl text-xs font-bold bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 hover:text-white transition flex items-center justify-center gap-1.5 active:scale-95 ${
                            !onAddToCart ? 'col-span-2' : ''
                          }`}
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Pedir por WhatsApp</span>
                        </a>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Total Investment */}
          <div className="bg-zinc-950/90 border border-zinc-800 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-zinc-400 block font-semibold">Total en Paquetes:</span>
                <span className="text-[11px] text-emerald-400">Pago Móvil / Binance Pay ID {BINANCE_PAY_ID}</span>
              </div>
              <div className="text-right">
                <span className="text-3xl font-black text-white">${planDiagnostic.total}</span>
                <span className="text-xs font-semibold text-zinc-400 ml-1">USD</span>
              </div>
            </div>
          </div>

          {/* Ponerse de acuerdo por WhatsApp Button */}
          <div className="space-y-2">
            <button
              onClick={handleSendToWhatsApp}
              className="w-full flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl font-black text-sm sm:text-base bg-emerald-600 hover:bg-emerald-500 text-white shadow-xl shadow-emerald-950/60 transition active:scale-95 cursor-pointer"
            >
              <MessageCircle className="w-5 h-5 fill-white" />
              <span>Ponerse de Acuerdo por WhatsApp</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
            <p className="text-[11px] text-zinc-400 text-center leading-relaxed">
              Al tocar aquí se abrirá WhatsApp con el enlace de {activePlatform.name}, lo que te falta para monetizar, los paquetes y el total de ${planDiagnostic.total} USD para ponernos de acuerdo en la tasa y la entrega.
            </p>
          </div>

        </div>
      </div>

      {/* Idea #20: Simulador de Retorno de Inversión (ROI) y Proyección de Ganancias Post-Monetización */}
      <ROICalculator
        platform={selectedPlatform}
        packageInvestmentUSD={planDiagnostic.total}
        channelOrAccountUrl={currentUrl}
        onConsultPlan={handleSendToWhatsApp}
      />
    </div>
  );
};
