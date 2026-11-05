export type SocialNetwork = 'facebook' | 'tiktok' | 'instagram' | 'youtube' | 'kick' | 'spotify' | 'special';

export type DeliverySpeedMode = 'express' | 'progressive';

export interface ServiceItem {
  id: string;
  network: SocialNetwork;
  name: string;
  metric: string; // e.g. "1K Seg.", "1K Likes", "100 Viewers x 2H"
  price: number; // in USD
  unit: string;
  description: string;
  popular?: boolean;
  tag?: string;
  image: string;
  deliveryTime?: string;
  guarantee?: string;
  hidden?: boolean;
  isCustom?: boolean;
}

export interface DiagnosticPackageItem {
  id: string;
  name: string;
  price: number;
  detail: string;
  category: string;
  deliveryTime?: string;
  guarantee?: string;
}

export interface DiagnosticPriceConfigItem {
  id: string;
  network: SocialNetwork;
  name: string;
  metric: string;
  price: number;
  unitDescription: string;
}

export interface SpecialPackage {
  id: string;
  network: SocialNetwork;
  title: string;
  subtitle: string;
  price: number | 'consultar';
  description: string;
  features: string[];
  isTodayOnly?: boolean;
  freeTrialAvailable?: boolean;
  image: string;
  hidden?: boolean;
}

export interface CartItem {
  id: string;
  serviceId: string;
  network: SocialNetwork;
  name: string;
  metric: string;
  unitPrice: number;
  quantity: number; // multiplier, e.g. 1 means 1 unit (1K), 2 means 2 units (2K)
  deliverySpeed?: DeliverySpeedMode;
}

export interface OrderDetails {
  usernameOrUrl: string;
  paymentMethod: string;
  clientNotes?: string;
}

export interface PaymentConfig {
  whatsappPhone: string;
  whatsappDisplay: string;
  binancePayId: string;
  pagoMovil: {
    bank: string;
    bankCode: string;
    phone: string;
    id: string;
  };
}

export type OrderStatus = 'pendiente' | 'en_proceso' | 'completado' | 'cancelado';

export interface OrderRecordItem {
  name: string;
  metric: string;
  network: string;
  unitPrice: number;
  quantity: number;
}

export interface OrderRecord {
  id: string;
  createdAt: number;
  source: 'catalogo_individual' | 'pedido_conjunto' | 'plan_monetizacion' | 'oferta_especial';
  clientLink: string;
  deliverySpeed: DeliverySpeedMode;
  deliverySpeedLabel: string;
  paymentMethod: string;
  items: OrderRecordItem[];
  totalUSD: number;
  notes?: string;
  status: OrderStatus;
}

// ============================================================================
// SORTEOS Y CRÉDITOS ($550 USD "de 0 a monetizar tu canal" -> Crédito $900 USD)
// ============================================================================

export interface RaffleParticipant {
  orderId: string;
  buyerName: string;
  buyerWhatsapp: string;
  clientLinkRaw: string;
  confirmedAt: number;
}

export interface RaffleWinnerRecord {
  id: string;
  cycleNumber: number;
  drawnAt: number;
  winner: RaffleParticipant;
  participants: [RaffleParticipant, RaffleParticipant];
  creditId: string;
}

export interface RaffleCorrectionRecord {
  id: string;
  createdAt: number;
  cycleNumber: number;
  reason: string;
  whatWasCorrected: string;
  removedOrderId?: string;
  removedBuyerName?: string;
}

export type RaffleCreditStatus = 'esperando_monetizacion' | 'pagando' | 'liquidado';

export interface RaffleCreditMonthRecord {
  id: string;
  monthLabel: string;
  reportedEarningsUSD: number;
  paymentUSD: number;
  balanceAfterUSD: number;
  recordedAt: number;
}

export interface RaffleCreditRecord {
  id: string;
  raffleId: string;
  cycleNumber: number;
  winnerOrderId: string;
  winnerName: string;
  winnerWhatsapp: string;
  clientLinkRaw: string;
  totalCreditUSD: number; // $900 USD
  remainingBalanceUSD: number;
  status: RaffleCreditStatus;
  months: RaffleCreditMonthRecord[];
  createdAt: number;
  updatedAt: number;
}

export interface RaffleSystemState {
  currentCycleNumber: number;
  currentCycleParticipants: RaffleParticipant[];
  consumedOrderIds: string[];
  excludedOrderIds: string[];
  drawHistory: RaffleWinnerRecord[];
  credits: RaffleCreditRecord[];
  corrections: RaffleCorrectionRecord[];
  updatedAt: number;
}

/**
 * Identifies the $550 USD "de 0 a monetizar tu canal" product by its price (550)
 * and its name (containing "de 0 a monetizar" or "monetizar tu canal"),
 * never by its array index/position.
 */
export function isRaffleMonetizationProduct(item: {
  name?: string;
  price?: number;
  unitPrice?: number;
}): boolean {
  if (!item) return false;
  const priceVal = typeof item.price === 'number' ? item.price : item.unitPrice;
  if (Number(priceVal) !== 550) return false;
  const normName = String(item.name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
  return (
    normName.includes('de 0 a monetizar') ||
    normName.includes('monetizar tu canal') ||
    normName.includes('monetizar')
  );
}

/**
 * Extracts valid WhatsApp phone digits and buyer display name from OrderRecord.clientLink
 */
export function extractBuyerInfoFromOrder(order: {
  id: string;
  clientLink?: string;
  notes?: string;
}): {
  buyerName: string;
  buyerWhatsapp: string;
  validPhoneDigits: string;
} {
  const raw = String(order.clientLink || '').trim();

  // 1. Check for wa.me/<digits> pattern first
  let validPhoneDigits = '';
  const waMatch = raw.match(/wa\.me\/(\+?[0-9]{8,15})/i);
  if (waMatch && waMatch[1]) {
    validPhoneDigits = waMatch[1].replace(/\D/g, '');
  } else {
    // Extract phone number sequences with at least 8 digits
    const phoneCandidates = raw.match(/\+?[0-9][0-9\s\-().]{6,}[0-9]/g);
    if (phoneCandidates && phoneCandidates.length > 0) {
      for (const cand of phoneCandidates) {
        const digits = cand.replace(/\D/g, '');
        if (digits.length >= 8 && digits.length <= 15) {
          validPhoneDigits = digits;
          break;
        }
      }
    } else {
      const allDigits = raw.replace(/\D/g, '');
      if (allDigits.length >= 8 && allDigits.length <= 15) {
        validPhoneDigits = allDigits;
      }
    }
  }

  // 2. Extract readable buyer name from clientLink or notes
  let cleanedName = raw
    .replace(/https?:\/\/\S+/gi, '')
    .replace(/wa\.me\/\S+/gi, '')
    .replace(/\+?[0-9][0-9\s\-().]{6,}[0-9]/g, '')
    .replace(/^[\s\-|•:,/]+|[\s\-|•:,/]+$/g, '')
    .trim();

  const lowerCleaned = cleanedName.toLowerCase();
  if (
    !cleanedName ||
    lowerCleaned === 'por confirmar en whatsapp' ||
    lowerCleaned === 'te lo paso por aqui en el chat' ||
    lowerCleaned === 'te lo paso por aquí en el chat' ||
    lowerCleaned === 'enviado por chat'
  ) {
    const notesClean = String(order.notes || '')
      .replace(/🚀.*$/i, '')
      .trim();
    if (notesClean && notesClean.length <= 50) {
      cleanedName = notesClean;
    } else {
      cleanedName = `Comprador #${order.id.slice(-4).toUpperCase()}`;
    }
  }

  return {
    buyerName: cleanedName,
    buyerWhatsapp: validPhoneDigits ? `+${validPhoneDigits}` : raw || 'Sin teléfono válido',
    validPhoneDigits,
  };
}
