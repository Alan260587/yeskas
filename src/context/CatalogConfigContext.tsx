import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  ServiceItem,
  SpecialPackage,
  DiagnosticPriceConfigItem,
  PaymentConfig,
  OrderRecord,
  OrderStatus,
  SocialNetwork,
  RaffleSystemState,
  RaffleParticipant,
  RaffleWinnerRecord,
  RaffleCreditRecord,
  RaffleCreditMonthRecord,
  RaffleCorrectionRecord,
  RaffleCreditStatus,
  isRaffleMonetizationProduct,
  extractBuyerInfoFromOrder,
} from '../types/catalog';
import {
  SERVICES_DATA,
  SPECIAL_OFFERS,
  DEFAULT_DIAGNOSTIC_PRICES,
  DEFAULT_PAYMENT_CONFIG,
} from '../data/catalogData';
import { fetchAndSyncSavedPdfs } from '../utils/pdfStorage';
import {
  subscribeToGlobalCloudStore,
  saveToGlobalCloudStore,
} from '../utils/globalCloudDatabase';
import {
  initAuth,
  login as googleDriveLogin,
  logout as googleDriveLogout,
  findDriveCatalogFile,
  createDriveCatalogFile,
  overwriteDriveCatalogFile,
  readDriveCatalogFile,
  deleteDriveCatalogFile,
  uploadImageDataUrlToGoogleDrive,
  hasInMemoryAccessToken,
  DRIVE_SYNC_FILENAME,
} from '../utils/googleDriveStorage';

const LOCAL_CONFIG_KEY = 'growth_viral_admin_config_v1';
const LOCAL_ORDERS_KEY = 'growth_viral_orders_history_v1';
const LOCAL_RAFFLES_KEY = 'growth_viral_raffles_state_v1';

const INITIAL_CUSTOM_SERVICES: ServiceItem[] = [
  {
    id: 'custom-youtube-1793909619457',
    network: 'youtube',
    name: 'de 0 a monetizar tu canal',
    metric: 'con todas las vistas y seguidores para monetizar',
    price: 550,
    unit: 'con todas las vistas y seguidores para monetizar',
    description: 'Servicio de de 0 a monetizar tu canal garantizado.',
    popular: true,
    tag: 'Nuevo',
    deliveryTime: '48 a 72 horas',
    guarantee: 'Garantía 30D',
    image: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=800&q=80',
    isCustom: true,
    hidden: false,
  },
  {
    id: 'custom-kick-1793042628459',
    network: 'kick',
    name: '5mil seguidores',
    metric: '5mil',
    price: 50,
    unit: '5mil',
    description: 'Servicio de 5mil seguidores garantizado.',
    popular: true,
    tag: 'Nuevo',
    deliveryTime: '48 a 72 horas',
    guarantee: 'Garantía 30D',
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80',
    isCustom: true,
    hidden: false,
  },
  {
    id: 'custom-spotify-1793035914804',
    network: 'spotify',
    name: '100mil vista y 10mil oyentes mensuales por 200$',
    metric: '100mil',
    price: 200,
    unit: '100mil',
    description: '100mil vista  y 19mil oyentes',
    popular: true,
    tag: 'Nuevo',
    deliveryTime: '48 a 72 horas',
    guarantee: 'Garantía 30D',
    image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80',
    isCustom: true,
    hidden: false,
  },
];

interface StoredAdminState {
  serviceOverrides: Record<string, Partial<ServiceItem>>;
  customServices: ServiceItem[];
  specialOfferOverrides: Record<string, Partial<SpecialPackage>>;
  diagnosticPriceOverrides: Record<string, number>;
  paymentConfig: PaymentConfig;
  updatedAt?: number;
  driveFileId?: string;
  driveWebViewLink?: string;
}

const DEFAULT_ADMIN_STATE: StoredAdminState = {
  serviceOverrides: {},
  customServices: INITIAL_CUSTOM_SERVICES,
  specialOfferOverrides: {},
  diagnosticPriceOverrides: {},
  paymentConfig: DEFAULT_PAYMENT_CONFIG,
  updatedAt: 0,
};

const DEFAULT_RAFFLE_STATE: RaffleSystemState = {
  currentCycleNumber: 1,
  currentCycleParticipants: [],
  consumedOrderIds: [],
  excludedOrderIds: [],
  drawHistory: [],
  credits: [],
  corrections: [],
  updatedAt: 0,
};

export interface GoogleDriveConnectionInfo {
  userEmail: string | null;
  userName: string | null;
  userPhoto: string | null;
  hasToken: boolean;
  driveFileId: string | null;
  driveWebViewLink: string | null;
  lastSyncedAt: number | null;
  isSyncing: boolean;
  error: string | null;
}

export interface PendingDriveConfirmation {
  action: 'overwrite' | 'delete';
  fileId: string;
  fileName: string;
  description: string;
  payloadToSave?: any;
  pendingImages?: Array<{ name: string; dataUrl: string }>;
}

interface CatalogConfigContextValue {
  services: ServiceItem[];
  allServicesAdmin: ServiceItem[];
  specialOffers: SpecialPackage[];
  diagnosticPrices: DiagnosticPriceConfigItem[];
  getDiagnosticPrice: (id: string, fallback: number) => number;
  paymentConfig: PaymentConfig;
  orders: OrderRecord[];
  raffleState: RaffleSystemState;
  driveInfo: GoogleDriveConnectionInfo;
  pendingDriveConfirmation: PendingDriveConfirmation | null;
  connectGoogleDrive: () => Promise<void>;
  disconnectGoogleDrive: () => Promise<void>;
  syncNowToGoogleDrive: () => Promise<void>;
  restoreFromGoogleDrive: () => Promise<void>;
  requestDeleteGoogleDriveBackup: () => void;
  confirmPendingDriveAction: () => Promise<void>;
  cancelPendingDriveAction: () => void;
  updateServicePrice: (id: string, price: number) => Promise<void>;
  updateServiceDetails: (id: string, patch: Partial<ServiceItem>) => Promise<void>;
  toggleServiceHidden: (id: string) => Promise<void>;
  createCustomService: (item: {
    network: SocialNetwork;
    name: string;
    metric: string;
    price: number;
    unit?: string;
    description: string;
    tag?: string;
    popular?: boolean;
    deliveryTime?: string;
    image?: string;
  }) => Promise<ServiceItem>;
  deleteCustomService: (id: string) => Promise<void>;
  updateSpecialOfferPrice: (id: string, price: number | 'consultar') => Promise<void>;
  updateSpecialOfferDetails: (id: string, patch: Partial<SpecialPackage>) => Promise<void>;
  updateDiagnosticPrice: (id: string, price: number) => Promise<void>;
  saveBulkPrices: (payload: {
    servicePrices?: Record<string, number>;
    serviceImages?: Record<string, string>;
    offerPrices?: Record<string, number | 'consultar'>;
    offerImages?: Record<string, string>;
    diagPrices?: Record<string, number>;
  }) => Promise<void>;
  updatePaymentConfig: (nextPayment: PaymentConfig) => Promise<void>;
  resetAllToDefaults: () => Promise<void>;
  recordOrder: (
    orderData: Omit<OrderRecord, 'id' | 'createdAt' | 'status'>
  ) => Promise<OrderRecord>;
  updateOrderStatus: (id: string, status: OrderStatus) => Promise<void>;
  updateOrderClientLink: (id: string, clientLink: string) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;
  clearOrders: () => Promise<void>;
  // Sorteos y Créditos ($550 USD -> Crédito $900 USD)
  correctRaffleCycleManually: (payload: {
    orderIdToRemove?: string;
    reason: string;
  }) => Promise<void>;
  recordCreditMonthlyEarnings: (
    creditId: string,
    monthLabel: string,
    reportedEarningsUSD: number
  ) => Promise<void>;
  updateWinnerContactInfo: (
    creditId: string,
    winnerName: string,
    winnerWhatsapp: string
  ) => Promise<void>;
  resetRaffleState: () => Promise<void>;
}

const CatalogConfigContext = createContext<CatalogConfigContextValue | undefined>(undefined);

const DEFAULT_NETWORK_IMAGES: Record<SocialNetwork, string> = {
  facebook: 'https://images.unsplash.com/photo-1562577309-4932fdd64cd1?auto=format&fit=crop&w=800&q=80',
  tiktok: 'https://images.unsplash.com/photo-1611605698335-8b1569810432?auto=format&fit=crop&w=800&q=80',
  instagram: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80',
  youtube: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=800&q=80',
  kick: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80',
  spotify: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80',
  special: 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?auto=format&fit=crop&w=800&q=80',
};

function sanitizeRaffleState(raw: any): RaffleSystemState {
  if (!raw || typeof raw !== 'object') return DEFAULT_RAFFLE_STATE;
  return {
    currentCycleNumber:
      typeof raw.currentCycleNumber === 'number' && raw.currentCycleNumber >= 1
        ? raw.currentCycleNumber
        : 1,
    currentCycleParticipants: Array.isArray(raw.currentCycleParticipants)
      ? raw.currentCycleParticipants
      : [],
    consumedOrderIds: Array.isArray(raw.consumedOrderIds) ? raw.consumedOrderIds : [],
    excludedOrderIds: Array.isArray(raw.excludedOrderIds) ? raw.excludedOrderIds : [],
    drawHistory: Array.isArray(raw.drawHistory) ? raw.drawHistory : [],
    credits: Array.isArray(raw.credits) ? raw.credits : [],
    corrections: Array.isArray(raw.corrections) ? raw.corrections : [],
    updatedAt: typeof raw.updatedAt === 'number' ? raw.updatedAt : 0,
  };
}

export const CatalogConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [adminState, setAdminState] = useState<StoredAdminState>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_CONFIG_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const savedCustom = Array.isArray(parsed.customServices) ? parsed.customServices : [];
        // Ensure the $550 "de 0 a monetizar tu canal" and initial custom services exist if none present
        const mergedCustom =
          savedCustom.length > 0 ? savedCustom : INITIAL_CUSTOM_SERVICES;
        return {
          ...DEFAULT_ADMIN_STATE,
          ...parsed,
          customServices: mergedCustom,
          paymentConfig: {
            ...DEFAULT_PAYMENT_CONFIG,
            ...(parsed.paymentConfig || {}),
            pagoMovil: {
              ...DEFAULT_PAYMENT_CONFIG.pagoMovil,
              ...(parsed.paymentConfig?.pagoMovil || {}),
            },
          },
        };
      }
    } catch {
      // ignore
    }
    return DEFAULT_ADMIN_STATE;
  });

  const [orders, setOrders] = useState<OrderRecord[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_ORDERS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  });

  const [raffleState, setRaffleState] = useState<RaffleSystemState>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_RAFFLES_KEY);
      if (saved) {
        return sanitizeRaffleState(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
    return DEFAULT_RAFFLE_STATE;
  });

  const raffleStateRef = useRef<RaffleSystemState>(raffleState);
  useEffect(() => {
    raffleStateRef.current = raffleState;
  }, [raffleState]);

  const [driveInfo, setDriveInfo] = useState<GoogleDriveConnectionInfo>({
    userEmail: null,
    userName: null,
    userPhoto: null,
    hasToken: false,
    driveFileId: adminState.driveFileId || null,
    driveWebViewLink: adminState.driveWebViewLink || null,
    lastSyncedAt: null,
    isSyncing: false,
    error: null,
  });

  const [pendingDriveConfirmation, setPendingDriveConfirmation] =
    useState<PendingDriveConfirmation | null>(null);

  const lastConfigFingerprintRef = useRef<string>('');
  const lastAppliedTimestampRef = useRef<number>(adminState.updatedAt || 0);
  const lastRaffleTimestampRef = useRef<number>(raffleState.updatedAt || 0);
  const apiServerAvailableRef = useRef<boolean>(true);

  useEffect(() => {
    const unsub = initAuth((user, hasToken) => {
      setDriveInfo((prev) => ({
        ...prev,
        userEmail: user?.email || null,
        userName: user?.displayName || null,
        userPhoto: user?.photoURL || null,
        hasToken,
      }));
    });
    return unsub;
  }, []);

  const persistRaffleState = useCallback(async (nextState: RaffleSystemState) => {
    const now = Date.now();
    const stamped: RaffleSystemState = {
      ...nextState,
      updatedAt: now,
    };
    raffleStateRef.current = stamped;
    lastRaffleTimestampRef.current = now;
    setRaffleState(stamped);

    try {
      localStorage.setItem(LOCAL_RAFFLES_KEY, JSON.stringify(stamped));
    } catch {
      // ignore
    }

    await saveToGlobalCloudStore('raffles', stamped, now).catch(() => {});
  }, []);

  const applyCloudRaffleState = useCallback((incomingRaw: any, incomingUpdatedAt?: number) => {
    if (!incomingRaw || typeof incomingRaw !== 'object') return;
    const incoming = sanitizeRaffleState(incomingRaw);
    const ts = incomingUpdatedAt || incoming.updatedAt || 0;

    const current = raffleStateRef.current;
    // Never overwrite with an older timestamp
    if (ts > 0 && ts < lastRaffleTimestampRef.current) {
      return;
    }
    if (ts === 0 && incoming.drawHistory.length < current.drawHistory.length) {
      return;
    }

    const nextStamped: RaffleSystemState = {
      ...incoming,
      updatedAt: Math.max(ts, current.updatedAt),
    };

    if (JSON.stringify(current) === JSON.stringify(nextStamped)) {
      return;
    }

    raffleStateRef.current = nextStamped;
    lastRaffleTimestampRef.current = nextStamped.updatedAt;
    setRaffleState(nextStamped);
    try {
      localStorage.setItem(LOCAL_RAFFLES_KEY, JSON.stringify(nextStamped));
    } catch {
      // ignore
    }
  }, []);

  // ============================================================================
  // AUTOMATIC RAFFLE ENGINE (Rules 1, 2, 3, 5 — Idempotent & Reactive to Orders)
  // ============================================================================
  const evaluateOrdersForRaffle = useCallback(
    (ordersList: OrderRecord[]) => {
      if (!Array.isArray(ordersList) || ordersList.length === 0) return;

      const current = raffleStateRef.current;
      const consumedSet = new Set(current.consumedOrderIds);
      const excludedSet = new Set(current.excludedOrderIds);
      const inCycleSet = new Set(current.currentCycleParticipants.map((p) => p.orderId));

      // Sort orders chronologically (oldest confirmed first) so cycle order is deterministic
      const qualifyingNewOrders = [...ordersList]
        .filter((order) => {
          if (!order || !order.id) return false;
          if (order.status !== 'completado') return false;
          if (consumedSet.has(order.id) || excludedSet.has(order.id) || inCycleSet.has(order.id)) {
            return false;
          }
          return Array.isArray(order.items) && order.items.some((item) => isRaffleMonetizationProduct(item));
        })
        .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));

      if (qualifyingNewOrders.length === 0 && current.currentCycleParticipants.length < 2) {
        return;
      }

      let nextCycleNumber = current.currentCycleNumber;
      let nextParticipants: RaffleParticipant[] = [...current.currentCycleParticipants];
      const nextConsumed = [...current.consumedOrderIds];
      const nextDrawHistory = [...current.drawHistory];
      const nextCredits = [...current.credits];
      let mutated = false;

      const executeDrawIfReady = () => {
        while (nextParticipants.length >= 2) {
          const p1 = nextParticipants[0];
          const p2 = nextParticipants[1];
          nextParticipants = nextParticipants.slice(2);

          // Idempotency guard: ensure neither order was already drawn in drawHistory
          const alreadyDrawn = nextDrawHistory.some(
            (d) =>
              d.cycleNumber === nextCycleNumber ||
              d.participants.some((p) => p.orderId === p1.orderId || p.orderId === p2.orderId)
          );

          if (!nextConsumed.includes(p1.orderId)) nextConsumed.push(p1.orderId);
          if (!nextConsumed.includes(p2.orderId)) nextConsumed.push(p2.orderId);

          if (!alreadyDrawn) {
            const now = Date.now();
            const winnerIndex = Math.random() < 0.5 ? 0 : 1;
            const winner = winnerIndex === 0 ? p1 : p2;
            const raffleId = `raffle-cycle-${nextCycleNumber}-${now}`;
            const creditId = `credit-cycle-${nextCycleNumber}-${now}`;

            const drawRecord: RaffleWinnerRecord = {
              id: raffleId,
              cycleNumber: nextCycleNumber,
              drawnAt: now,
              winner,
              participants: [p1, p2],
              creditId,
            };

            const creditRecord: RaffleCreditRecord = {
              id: creditId,
              raffleId,
              cycleNumber: nextCycleNumber,
              winnerOrderId: winner.orderId,
              winnerName: winner.buyerName,
              winnerWhatsapp: winner.buyerWhatsapp,
              clientLinkRaw: winner.clientLinkRaw,
              totalCreditUSD: 900,
              remainingBalanceUSD: 900,
              status: 'esperando_monetizacion',
              months: [],
              createdAt: now,
              updatedAt: now,
            };

            nextDrawHistory.unshift(drawRecord);
            nextCredits.unshift(creditRecord);
          }

          nextCycleNumber += 1;
          mutated = true;
        }
      };

      // First check if currentCycleParticipants already has 2
      if (nextParticipants.length >= 2) {
        executeDrawIfReady();
      }

      // Add each newly completed $550 order and trigger draw immediately upon reaching 2/2
      for (const order of qualifyingNewOrders) {
        if (nextConsumed.includes(order.id)) continue;
        const buyerInfo = extractBuyerInfoFromOrder(order);
        const participant: RaffleParticipant = {
          orderId: order.id,
          buyerName: buyerInfo.buyerName,
          buyerWhatsapp: buyerInfo.buyerWhatsapp,
          clientLinkRaw: order.clientLink || '',
          confirmedAt: Date.now(),
        };
        nextParticipants.push(participant);
        mutated = true;

        if (nextParticipants.length >= 2) {
          executeDrawIfReady();
        }
      }

      if (mutated) {
        const nextState: RaffleSystemState = {
          ...current,
          currentCycleNumber: nextCycleNumber,
          currentCycleParticipants: nextParticipants,
          consumedOrderIds: nextConsumed,
          drawHistory: nextDrawHistory,
          credits: nextCredits,
          updatedAt: Date.now(),
        };
        persistRaffleState(nextState);
      }
    },
    [persistRaffleState]
  );

  // React to any change in orders history
  useEffect(() => {
    evaluateOrdersForRaffle(orders);
  }, [orders, evaluateOrdersForRaffle]);

  const applyServerConfig = useCallback((config: any) => {
    if (!config || typeof config !== 'object') return;

    const incomingTimestamp = typeof config.updatedAt === 'number' ? config.updatedAt : 0;
    if (incomingTimestamp > 0 && incomingTimestamp < lastAppliedTimestampRef.current) {
      return;
    }

    const fingerprint = `${incomingTimestamp}_${JSON.stringify(config.customServices || []).length}_${JSON.stringify(config.serviceOverrides || {}).length}_${JSON.stringify(config.specialOfferOverrides || {}).length}_${Object.keys(config.diagnosticPriceOverrides || {}).length}`;
    if (lastConfigFingerprintRef.current === fingerprint) {
      return;
    }
    lastConfigFingerprintRef.current = fingerprint;
    if (incomingTimestamp > 0) {
      lastAppliedTimestampRef.current = incomingTimestamp;
    }

    const incomingCustom = Array.isArray(config.customServices) ? config.customServices : [];
    const nextState: StoredAdminState = {
      serviceOverrides: config.serviceOverrides || {},
      customServices: incomingCustom.length > 0 ? incomingCustom : INITIAL_CUSTOM_SERVICES,
      specialOfferOverrides: config.specialOfferOverrides || {},
      diagnosticPriceOverrides: config.diagnosticPriceOverrides || {},
      paymentConfig: {
        ...DEFAULT_PAYMENT_CONFIG,
        ...(config.paymentConfig || {}),
        pagoMovil: {
          ...DEFAULT_PAYMENT_CONFIG.pagoMovil,
          ...(config.paymentConfig?.pagoMovil || {}),
        },
      },
      updatedAt: incomingTimestamp || Date.now(),
      driveFileId: config.driveFileId || undefined,
      driveWebViewLink: config.driveWebViewLink || undefined,
    };
    setAdminState(nextState);
    if (config.driveFileId || config.driveWebViewLink) {
      setDriveInfo((prev) => ({
        ...prev,
        driveFileId: config.driveFileId || prev.driveFileId,
        driveWebViewLink: config.driveWebViewLink || prev.driveWebViewLink,
      }));
    }
    try {
      localStorage.setItem(LOCAL_CONFIG_KEY, JSON.stringify(nextState));
    } catch {
      // ignore
    }
  }, []);

  const applyServerOrders = useCallback((serverOrders: any) => {
    if (!Array.isArray(serverOrders)) return;
    setOrders((prev) => {
      if (prev.length === serverOrders.length && JSON.stringify(prev) === JSON.stringify(serverOrders)) {
        return prev;
      }
      try {
        localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(serverOrders));
      } catch {
        // ignore
      }
      return serverOrders;
    });
  }, []);

  const queueOrCreateGoogleDriveSync = useCallback(
    async (
      stateToSync: StoredAdminState,
      newImages: Array<{ name: string; dataUrl: string }> = []
    ) => {
      if (!hasInMemoryAccessToken()) {
        return;
      }

      try {
        setDriveInfo((prev) => ({ ...prev, isSyncing: true, error: null }));
        const existingFile = await findDriveCatalogFile();
        const combinedDrivePayload = {
          ...stateToSync,
          raffleState: raffleStateRef.current,
          ordersSnapshotCount: orders.length,
          syncedByEngine: 'Neon + Turso + Google Drive Global Edge v3',
        };

        if (!existingFile) {
          for (const img of newImages) {
            if (img.dataUrl.startsWith('data:image/')) {
              await uploadImageDataUrlToGoogleDrive(img.name, img.dataUrl).catch(() => null);
            }
          }
          const created = await createDriveCatalogFile(combinedDrivePayload);
          setDriveInfo((prev) => ({
            ...prev,
            isSyncing: false,
            driveFileId: created.id,
            driveWebViewLink: created.webViewLink || prev.driveWebViewLink,
            lastSyncedAt: Date.now(),
            error: null,
          }));
        } else {
          setDriveInfo((prev) => ({
            ...prev,
            isSyncing: false,
            driveFileId: existingFile.id,
            driveWebViewLink: existingFile.webViewLink || prev.driveWebViewLink,
          }));
          setPendingDriveConfirmation({
            action: 'overwrite',
            fileId: existingFile.id,
            fileName: existingFile.name || DRIVE_SYNC_FILENAME,
            description: `Se actualizará el archivo "${existingFile.name || DRIVE_SYNC_FILENAME}" en tu Google Drive con los últimos productos, imágenes, precios en USD y estado de Sorteos y Créditos.`,
            payloadToSave: combinedDrivePayload,
            pendingImages: newImages,
          });
        }
      } catch (err: any) {
        setDriveInfo((prev) => ({
          ...prev,
          isSyncing: false,
          error: err?.message || 'Error al sincronizar con Google Drive.',
        }));
      }
    },
    [orders.length]
  );

  const persistAdminState = useCallback(
    async (
      nextState: StoredAdminState,
      newImages: Array<{ name: string; dataUrl: string }> = []
    ) => {
      const now = Date.now();
      const stateWithTimestamp: StoredAdminState = {
        ...nextState,
        updatedAt: now,
      };
      lastAppliedTimestampRef.current = now;
      setAdminState(stateWithTimestamp);

      try {
        localStorage.setItem(LOCAL_CONFIG_KEY, JSON.stringify(stateWithTimestamp));
      } catch {
        // ignore
      }

      const globalPromise = saveToGlobalCloudStore('config', stateWithTimestamp, now).catch(() => {});

      if (apiServerAvailableRef.current) {
        try {
          const res = await fetch('/api/admin-config', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(stateWithTimestamp),
          });
          if (res.status === 404 || res.status === 405) {
            apiServerAvailableRef.current = false;
          } else if (res.ok) {
            const data = await res.json();
            if (data.config) {
              applyServerConfig(data.config);
            }
          }
        } catch {
          // Handled by globalCloudDatabase + Google Drive + localStorage
        }
      }

      await globalPromise;

      if (hasInMemoryAccessToken()) {
        await queueOrCreateGoogleDriveSync(stateWithTimestamp, newImages);
      }
    },
    [applyServerConfig, queueOrCreateGoogleDriveSync]
  );

  const connectGoogleDrive = useCallback(async () => {
    try {
      setDriveInfo((prev) => ({ ...prev, isSyncing: true, error: null }));
      const { user, accessToken } = await googleDriveLogin();

      const existingFile = await findDriveCatalogFile(accessToken);
      if (existingFile) {
        try {
          const driveData = await readDriveCatalogFile(existingFile.id, accessToken);
          if (driveData && typeof driveData === 'object') {
            const driveUpdatedAt = typeof driveData.updatedAt === 'number' ? driveData.updatedAt : 0;
            if (driveUpdatedAt > lastAppliedTimestampRef.current) {
              applyServerConfig({
                ...driveData,
                driveFileId: existingFile.id,
                driveWebViewLink: existingFile.webViewLink,
              });
              await saveToGlobalCloudStore('config', driveData, driveUpdatedAt).catch(() => {});
            }
            if (driveData.raffleState) {
              applyCloudRaffleState(driveData.raffleState, driveData.raffleState.updatedAt);
              await saveToGlobalCloudStore('raffles', driveData.raffleState, driveData.raffleState.updatedAt).catch(() => {});
            }
          }
        } catch {
          // ignore read error on initial connect
        }

        setDriveInfo({
          userEmail: user.email || null,
          userName: user.displayName || null,
          userPhoto: user.photoURL || null,
          hasToken: true,
          driveFileId: existingFile.id,
          driveWebViewLink: existingFile.webViewLink || null,
          lastSyncedAt: Date.now(),
          isSyncing: false,
          error: null,
        });
      } else {
        const now = Date.now();
        const payload = {
          ...adminState,
          raffleState: raffleStateRef.current,
          updatedAt: adminState.updatedAt || now,
          syncedByEngine: 'Neon + Turso + Google Drive Global Edge v3',
        };
        const created = await createDriveCatalogFile(payload, accessToken);
        setDriveInfo({
          userEmail: user.email || null,
          userName: user.displayName || null,
          userPhoto: user.photoURL || null,
          hasToken: true,
          driveFileId: created.id,
          driveWebViewLink: created.webViewLink || null,
          lastSyncedAt: now,
          isSyncing: false,
          error: null,
        });
      }
    } catch (err: any) {
      setDriveInfo((prev) => ({
        ...prev,
        isSyncing: false,
        error: err?.message || 'No se pudo conectar con Google Drive.',
      }));
      throw err;
    }
  }, [adminState, applyServerConfig, applyCloudRaffleState]);

  const disconnectGoogleDrive = useCallback(async () => {
    await googleDriveLogout();
    setPendingDriveConfirmation(null);
    setDriveInfo((prev) => ({
      ...prev,
      userEmail: null,
      userName: null,
      userPhoto: null,
      hasToken: false,
      isSyncing: false,
      error: null,
    }));
  }, []);

  const syncNowToGoogleDrive = useCallback(async () => {
    try {
      setDriveInfo((prev) => ({ ...prev, isSyncing: true, error: null }));
      const existingFile = await findDriveCatalogFile();
      const stateToSave = {
        ...adminState,
        raffleState: raffleStateRef.current,
        updatedAt: Date.now(),
      };

      if (!existingFile) {
        const created = await createDriveCatalogFile({
          ...stateToSave,
          syncedByEngine: 'Neon + Turso + Google Drive Global Edge v3',
        });
        await saveToGlobalCloudStore('config', {
          ...adminState,
          driveFileId: created.id,
          driveWebViewLink: created.webViewLink,
        });
        await saveToGlobalCloudStore('raffles', raffleStateRef.current);
        setDriveInfo((prev) => ({
          ...prev,
          isSyncing: false,
          driveFileId: created.id,
          driveWebViewLink: created.webViewLink || prev.driveWebViewLink,
          lastSyncedAt: Date.now(),
          error: null,
        }));
      } else {
        setDriveInfo((prev) => ({
          ...prev,
          isSyncing: false,
          driveFileId: existingFile.id,
          driveWebViewLink: existingFile.webViewLink || prev.driveWebViewLink,
        }));
        setPendingDriveConfirmation({
          action: 'overwrite',
          fileId: existingFile.id,
          fileName: existingFile.name || DRIVE_SYNC_FILENAME,
          description: `¿Confirmas sobrescribir y actualizar "${existingFile.name || DRIVE_SYNC_FILENAME}" en tu Google Drive con todos tus productos, imágenes, precios y estado de Sorteos y Créditos?`,
          payloadToSave: stateToSave,
        });
      }
    } catch (err: any) {
      setDriveInfo((prev) => ({
        ...prev,
        isSyncing: false,
        error: err?.message || 'Error al preparar el guardado en Google Drive.',
      }));
    }
  }, [adminState]);

  const restoreFromGoogleDrive = useCallback(async () => {
    try {
      setDriveInfo((prev) => ({ ...prev, isSyncing: true, error: null }));
      const existingFile = await findDriveCatalogFile();
      if (!existingFile) {
        setDriveInfo((prev) => ({
          ...prev,
          isSyncing: false,
          error: 'No se encontró ningún archivo guardado en tu Google Drive todavía.',
        }));
        return;
      }

      const driveData = await readDriveCatalogFile(existingFile.id);
      if (driveData && typeof driveData === 'object') {
        const now = Date.now();
        const restoredState: StoredAdminState = {
          serviceOverrides: driveData.serviceOverrides || {},
          customServices: Array.isArray(driveData.customServices) && driveData.customServices.length > 0
            ? driveData.customServices
            : INITIAL_CUSTOM_SERVICES,
          specialOfferOverrides: driveData.specialOfferOverrides || {},
          diagnosticPriceOverrides: driveData.diagnosticPriceOverrides || {},
          paymentConfig: driveData.paymentConfig || DEFAULT_PAYMENT_CONFIG,
          updatedAt: now,
          driveFileId: existingFile.id,
          driveWebViewLink: existingFile.webViewLink,
        };
        applyServerConfig(restoredState);
        await saveToGlobalCloudStore('config', restoredState, now);

        if (driveData.raffleState) {
          applyCloudRaffleState(driveData.raffleState, now);
          await saveToGlobalCloudStore('raffles', driveData.raffleState, now);
        }
      }

      setDriveInfo((prev) => ({
        ...prev,
        isSyncing: false,
        driveFileId: existingFile.id,
        driveWebViewLink: existingFile.webViewLink || prev.driveWebViewLink,
        lastSyncedAt: Date.now(),
        error: null,
      }));
    } catch (err: any) {
      setDriveInfo((prev) => ({
        ...prev,
        isSyncing: false,
        error: err?.message || 'Error al cargar datos desde Google Drive.',
      }));
    }
  }, [applyServerConfig, applyCloudRaffleState]);

  const requestDeleteGoogleDriveBackup = useCallback(async () => {
    try {
      const existingFile = driveInfo.driveFileId
        ? { id: driveInfo.driveFileId, name: DRIVE_SYNC_FILENAME }
        : await findDriveCatalogFile();
      if (!existingFile) {
        setDriveInfo((prev) => ({
          ...prev,
          error: 'No hay archivo de respaldo en Google Drive para eliminar.',
        }));
        return;
      }
      setPendingDriveConfirmation({
        action: 'delete',
        fileId: existingFile.id,
        fileName: existingFile.name || DRIVE_SYNC_FILENAME,
        description: `¿Confirmas eliminar permanentemente el archivo "${existingFile.name || DRIVE_SYNC_FILENAME}" de tu Google Drive? (Tus datos seguirán activos en la web).`,
      });
    } catch (err: any) {
      setDriveInfo((prev) => ({
        ...prev,
        error: err?.message || 'Error al verificar el archivo en Google Drive.',
      }));
    }
  }, [driveInfo.driveFileId]);

  const confirmPendingDriveAction = useCallback(async () => {
    if (!pendingDriveConfirmation) return;
    const currentConfirmation = pendingDriveConfirmation;
    setPendingDriveConfirmation(null);

    try {
      setDriveInfo((prev) => ({ ...prev, isSyncing: true, error: null }));

      if (currentConfirmation.action === 'overwrite' && currentConfirmation.payloadToSave) {
        if (currentConfirmation.pendingImages && currentConfirmation.pendingImages.length > 0) {
          for (const img of currentConfirmation.pendingImages) {
            if (img.dataUrl.startsWith('data:image/')) {
              await uploadImageDataUrlToGoogleDrive(img.name, img.dataUrl).catch(() => null);
            }
          }
        }

        const updated = await overwriteDriveCatalogFile(
          currentConfirmation.fileId,
          {
            ...currentConfirmation.payloadToSave,
            raffleState: raffleStateRef.current,
            syncedByEngine: 'Neon + Turso + Google Drive Global Edge v3',
          }
        );

        const stateWithDriveMeta: StoredAdminState = {
          ...currentConfirmation.payloadToSave,
          driveFileId: updated.id,
          driveWebViewLink: updated.webViewLink,
          updatedAt: Date.now(),
        };

        await saveToGlobalCloudStore('config', stateWithDriveMeta, stateWithDriveMeta.updatedAt);
        await saveToGlobalCloudStore('raffles', raffleStateRef.current);

        setDriveInfo((prev) => ({
          ...prev,
          isSyncing: false,
          driveFileId: updated.id,
          driveWebViewLink: updated.webViewLink || prev.driveWebViewLink,
          lastSyncedAt: Date.now(),
          error: null,
        }));
      } else if (currentConfirmation.action === 'delete') {
        await deleteDriveCatalogFile(currentConfirmation.fileId);
        setDriveInfo((prev) => ({
          ...prev,
          isSyncing: false,
          driveFileId: null,
          driveWebViewLink: null,
          error: null,
        }));
      }
    } catch (err: any) {
      setDriveInfo((prev) => ({
        ...prev,
        isSyncing: false,
        error: err?.message || 'Error al ejecutar la operación en Google Drive.',
      }));
    }
  }, [pendingDriveConfirmation]);

  const cancelPendingDriveAction = useCallback(() => {
    setPendingDriveConfirmation(null);
  }, []);

  // Initial fetch, Global Cloud Database real-time subscription, and cross-device reconciliation
  useEffect(() => {
    let isMounted = true;
    let isFirstSync = true;

    fetchAndSyncSavedPdfs().catch(() => {});

    const unsubGlobalConfig = subscribeToGlobalCloudStore('config', (cloudConfig, updatedAt) => {
      if (!isMounted || !cloudConfig) return;
      applyServerConfig({ ...cloudConfig, updatedAt });
    });

    const unsubGlobalOrders = subscribeToGlobalCloudStore('orders', (cloudOrders) => {
      if (!isMounted || !Array.isArray(cloudOrders)) return;
      applyServerOrders(cloudOrders);
    });

    const unsubGlobalRaffles = subscribeToGlobalCloudStore('raffles', (cloudRaffles, updatedAt) => {
      if (!isMounted || !cloudRaffles) return;
      applyCloudRaffleState(cloudRaffles, updatedAt);
    });

    const reconcileTimer = window.setTimeout(() => {
      if (!isMounted) return;
      try {
        const rawLocal = localStorage.getItem(LOCAL_CONFIG_KEY);
        if (rawLocal) {
          const localParsed = JSON.parse(rawLocal);
          const hasLocalCustom = Array.isArray(localParsed.customServices) && localParsed.customServices.length > 0;
          const hasLocalOverrides =
            Object.keys(localParsed.serviceOverrides || {}).length > 0 ||
            Object.keys(localParsed.specialOfferOverrides || {}).length > 0 ||
            Object.keys(localParsed.diagnosticPriceOverrides || {}).length > 0;
          if ((hasLocalCustom || hasLocalOverrides) && lastAppliedTimestampRef.current <= (localParsed.updatedAt || 0)) {
            saveToGlobalCloudStore('config', localParsed, localParsed.updatedAt || Date.now()).catch(() => {});
          }
        }

        const rawLocalRaffles = localStorage.getItem(LOCAL_RAFFLES_KEY);
        if (rawLocalRaffles) {
          const parsedRaffles = sanitizeRaffleState(JSON.parse(rawLocalRaffles));
          if (
            (parsedRaffles.drawHistory.length > 0 ||
              parsedRaffles.currentCycleParticipants.length > 0 ||
              parsedRaffles.corrections.length > 0) &&
            lastRaffleTimestampRef.current <= (parsedRaffles.updatedAt || 0)
          ) {
            saveToGlobalCloudStore('raffles', parsedRaffles, parsedRaffles.updatedAt || Date.now()).catch(() => {});
          }
        }
      } catch {
        // ignore
      }
    }, 1500);

    const fetchConfig = async () => {
      if (!apiServerAvailableRef.current) return;
      try {
        const res = await fetch('/api/admin-config');
        if (res.status === 404 || res.status === 405) {
          apiServerAvailableRef.current = false;
          return;
        }
        if (res.ok && isMounted) {
          const data = await res.json();
          if (data.config) {
            if (isFirstSync) {
              isFirstSync = false;
              try {
                const rawLocal = localStorage.getItem(LOCAL_CONFIG_KEY);
                if (rawLocal) {
                  const localParsed = JSON.parse(rawLocal);
                  const localCustom: ServiceItem[] = Array.isArray(localParsed.customServices)
                    ? localParsed.customServices
                    : [];
                  const serverCustom: ServiceItem[] = Array.isArray(data.config.customServices)
                    ? data.config.customServices
                    : [];
                  const serverIds = new Set(serverCustom.map((s) => s.id));
                  const missingFromServer = localCustom.filter((s) => s && s.id && !serverIds.has(s.id));

                  const localOverrides = localParsed.serviceOverrides || {};
                  const serverOverrides = data.config.serviceOverrides || {};
                  const hasNewLocalOverrides =
                    Object.keys(localOverrides).length > 0 && Object.keys(serverOverrides).length === 0;

                  if (missingFromServer.length > 0 || hasNewLocalOverrides) {
                    const reconciled: StoredAdminState = {
                      serviceOverrides: { ...localOverrides, ...serverOverrides },
                      customServices: [...missingFromServer, ...serverCustom],
                      specialOfferOverrides: {
                        ...(localParsed.specialOfferOverrides || {}),
                        ...(data.config.specialOfferOverrides || {}),
                      },
                      diagnosticPriceOverrides: {
                        ...(localParsed.diagnosticPriceOverrides || {}),
                        ...(data.config.diagnosticPriceOverrides || {}),
                      },
                      paymentConfig: data.config.paymentConfig || localParsed.paymentConfig || DEFAULT_PAYMENT_CONFIG,
                    };
                    await persistAdminState(reconciled);
                    if (Array.isArray(data.orders)) applyServerOrders(data.orders);
                    return;
                  }
                }
              } catch {
                // ignore reconciliation error
              }
            }
            applyServerConfig(data.config);
          }
          if (Array.isArray(data.orders)) applyServerOrders(data.orders);
        }
      } catch {
        // Offline or static Vercel hosting — handled by Global Cloud Store
      }
    };

    fetchConfig();

    const pollInterval = window.setInterval(fetchConfig, 4000);

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        fetchConfig();
      }
    };
    window.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);

    const handleWsEvent = (e: Event) => {
      const msg = (e as CustomEvent).detail;
      if (!msg) return;
      if (msg.type === 'admin:config_updated' && msg.config) {
        applyServerConfig(msg.config);
      } else if (msg.type === 'admin:orders_updated' && Array.isArray(msg.orders)) {
        applyServerOrders(msg.orders);
      }
    };

    window.addEventListener('growth-viral-ws-event', handleWsEvent);

    return () => {
      isMounted = false;
      unsubGlobalConfig();
      unsubGlobalOrders();
      unsubGlobalRaffles();
      window.clearTimeout(reconcileTimer);
      window.clearInterval(pollInterval);
      window.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      window.removeEventListener('growth-viral-ws-event', handleWsEvent);
    };
  }, [applyServerConfig, applyServerOrders, applyCloudRaffleState, persistAdminState]);

  const allServicesAdmin = useMemo<ServiceItem[]>(() => {
    const mergedBase = SERVICES_DATA.map((baseItem) => {
      const override = adminState.serviceOverrides[baseItem.id];
      if (!override) return baseItem;
      return {
        ...baseItem,
        ...override,
        price:
          typeof override.price === 'number' && !Number.isNaN(override.price)
            ? override.price
            : baseItem.price,
      };
    });

    const customItems = (adminState.customServices || []).map((custom) => {
      const override = adminState.serviceOverrides[custom.id];
      const merged = {
        ...custom,
        ...(override || {}),
        isCustom: true,
      };
      if (!merged.image || !merged.image.trim()) {
        merged.image = DEFAULT_NETWORK_IMAGES[merged.network] || DEFAULT_NETWORK_IMAGES.instagram;
      }
      return merged;
    });

    return [...customItems, ...mergedBase];
  }, [adminState.serviceOverrides, adminState.customServices]);

  const services = useMemo<ServiceItem[]>(() => {
    return allServicesAdmin.filter((s) => !s.hidden);
  }, [allServicesAdmin]);

  const specialOffers = useMemo<SpecialPackage[]>(() => {
    return SPECIAL_OFFERS.map((offer) => {
      const override = adminState.specialOfferOverrides[offer.id];
      if (!override) return offer;
      return {
        ...offer,
        ...override,
      };
    });
  }, [adminState.specialOfferOverrides]);

  const diagnosticPrices = useMemo<DiagnosticPriceConfigItem[]>(() => {
    return DEFAULT_DIAGNOSTIC_PRICES.map((item) => {
      const overridePrice = adminState.diagnosticPriceOverrides[item.id];
      return {
        ...item,
        price:
          typeof overridePrice === 'number' && !Number.isNaN(overridePrice)
            ? overridePrice
            : item.price,
      };
    });
  }, [adminState.diagnosticPriceOverrides]);

  const getDiagnosticPrice = useCallback(
    (id: string, fallback: number): number => {
      const override = adminState.diagnosticPriceOverrides[id];
      if (typeof override === 'number' && !Number.isNaN(override) && override >= 0) {
        return override;
      }
      const found = DEFAULT_DIAGNOSTIC_PRICES.find((d) => d.id === id);
      return found ? found.price : fallback;
    },
    [adminState.diagnosticPriceOverrides]
  );

  // Actions
  const updateServicePrice = useCallback(
    async (id: string, price: number) => {
      const cleanPrice = Math.max(0, Number(price) || 0);
      const nextState: StoredAdminState = {
        ...adminState,
        serviceOverrides: {
          ...adminState.serviceOverrides,
          [id]: {
            ...(adminState.serviceOverrides[id] || {}),
            price: cleanPrice,
          },
        },
        customServices: adminState.customServices.map((c) =>
          c.id === id ? { ...c, price: cleanPrice } : c
        ),
      };
      await persistAdminState(nextState);
    },
    [adminState, persistAdminState]
  );

  const updateServiceDetails = useCallback(
    async (id: string, patch: Partial<ServiceItem>) => {
      const nextState: StoredAdminState = {
        ...adminState,
        serviceOverrides: {
          ...adminState.serviceOverrides,
          [id]: {
            ...(adminState.serviceOverrides[id] || {}),
            ...patch,
          },
        },
        customServices: adminState.customServices.map((c) =>
          c.id === id ? { ...c, ...patch } : c
        ),
      };
      const newImgs: Array<{ name: string; dataUrl: string }> = [];
      if (patch.image && patch.image.startsWith('data:image/')) {
        newImgs.push({ name: patch.name || id, dataUrl: patch.image });
      }
      await persistAdminState(nextState, newImgs);
    },
    [adminState, persistAdminState]
  );

  const toggleServiceHidden = useCallback(
    async (id: string) => {
      const current = allServicesAdmin.find((s) => s.id === id);
      const nextHidden = !current?.hidden;
      await updateServiceDetails(id, { hidden: nextHidden });
    },
    [allServicesAdmin, updateServiceDetails]
  );

  const createCustomService = useCallback(
    async (item: {
      network: SocialNetwork;
      name: string;
      metric: string;
      price: number;
      unit?: string;
      description: string;
      tag?: string;
      popular?: boolean;
      deliveryTime?: string;
      image?: string;
    }): Promise<ServiceItem> => {
      const newService: ServiceItem = {
        id: `custom-${item.network}-${Date.now()}`,
        network: item.network,
        name: item.name.trim(),
        metric: item.metric.trim(),
        price: Math.max(0, Number(item.price) || 0),
        unit: item.unit?.trim() || item.metric.trim(),
        description: item.description.trim() || `Servicio de ${item.name.trim()} garantizado.`,
        popular: Boolean(item.popular),
        tag: item.tag?.trim() || 'Nuevo',
        deliveryTime: item.deliveryTime?.trim() || '48 a 72 horas',
        guarantee: 'Garantía 30D',
        image: item.image?.trim() || DEFAULT_NETWORK_IMAGES[item.network] || DEFAULT_NETWORK_IMAGES.instagram,
        isCustom: true,
        hidden: false,
      };

      const nextState: StoredAdminState = {
        ...adminState,
        customServices: [newService, ...adminState.customServices],
      };
      const newImgs: Array<{ name: string; dataUrl: string }> = [];
      if (newService.image.startsWith('data:image/')) {
        newImgs.push({ name: newService.name, dataUrl: newService.image });
      }
      await persistAdminState(nextState, newImgs);
      return newService;
    },
    [adminState, persistAdminState]
  );

  const deleteCustomService = useCallback(
    async (id: string) => {
      const nextOverrides = { ...adminState.serviceOverrides };
      delete nextOverrides[id];
      const nextState: StoredAdminState = {
        ...adminState,
        serviceOverrides: nextOverrides,
        customServices: adminState.customServices.filter((c) => c.id !== id),
      };
      await persistAdminState(nextState);
    },
    [adminState, persistAdminState]
  );

  const updateSpecialOfferPrice = useCallback(
    async (id: string, price: number | 'consultar') => {
      const nextState: StoredAdminState = {
        ...adminState,
        specialOfferOverrides: {
          ...adminState.specialOfferOverrides,
          [id]: {
            ...(adminState.specialOfferOverrides[id] || {}),
            price,
          },
        },
      };
      await persistAdminState(nextState);
    },
    [adminState, persistAdminState]
  );

  const updateSpecialOfferDetails = useCallback(
    async (id: string, patch: Partial<SpecialPackage>) => {
      const nextState: StoredAdminState = {
        ...adminState,
        specialOfferOverrides: {
          ...adminState.specialOfferOverrides,
          [id]: {
            ...(adminState.specialOfferOverrides[id] || {}),
            ...patch,
          },
        },
      };
      const newImgs: Array<{ name: string; dataUrl: string }> = [];
      if (patch.image && patch.image.startsWith('data:image/')) {
        newImgs.push({ name: id, dataUrl: patch.image });
      }
      await persistAdminState(nextState, newImgs);
    },
    [adminState, persistAdminState]
  );

  const updateDiagnosticPrice = useCallback(
    async (id: string, price: number) => {
      const cleanPrice = Math.max(0, Number(price) || 0);
      const nextState: StoredAdminState = {
        ...adminState,
        diagnosticPriceOverrides: {
          ...adminState.diagnosticPriceOverrides,
          [id]: cleanPrice,
        },
      };
      await persistAdminState(nextState);
    },
    [adminState, persistAdminState]
  );

  const saveBulkPrices = useCallback(
    async (payload: {
      servicePrices?: Record<string, number>;
      serviceImages?: Record<string, string>;
      offerPrices?: Record<string, number | 'consultar'>;
      offerImages?: Record<string, string>;
      diagPrices?: Record<string, number>;
    }) => {
      const nextServiceOverrides = { ...adminState.serviceOverrides };
      let nextCustomServices = [...adminState.customServices];
      const newImgs: Array<{ name: string; dataUrl: string }> = [];

      if (payload.servicePrices) {
        for (const [id, p] of Object.entries(payload.servicePrices)) {
          const clean = Math.max(0, Number(p) || 0);
          nextServiceOverrides[id] = {
            ...(nextServiceOverrides[id] || {}),
            price: clean,
          };
          nextCustomServices = nextCustomServices.map((c) =>
            c.id === id ? { ...c, price: clean } : c
          );
        }
      }

      if (payload.serviceImages) {
        for (const [id, img] of Object.entries(payload.serviceImages)) {
          if (img && img.trim()) {
            const cleanImg = img.trim();
            nextServiceOverrides[id] = {
              ...(nextServiceOverrides[id] || {}),
              image: cleanImg,
            };
            nextCustomServices = nextCustomServices.map((c) =>
              c.id === id ? { ...c, image: cleanImg } : c
            );
            if (cleanImg.startsWith('data:image/')) {
              newImgs.push({ name: id, dataUrl: cleanImg });
            }
          }
        }
      }

      const nextOfferOverrides = { ...adminState.specialOfferOverrides };
      if (payload.offerPrices) {
        for (const [id, p] of Object.entries(payload.offerPrices)) {
          nextOfferOverrides[id] = {
            ...(nextOfferOverrides[id] || {}),
            price: p,
          };
        }
      }

      if (payload.offerImages) {
        for (const [id, img] of Object.entries(payload.offerImages)) {
          if (img && img.trim()) {
            const cleanImg = img.trim();
            nextOfferOverrides[id] = {
              ...(nextOfferOverrides[id] || {}),
              image: cleanImg,
            };
            if (cleanImg.startsWith('data:image/')) {
              newImgs.push({ name: `offer_${id}`, dataUrl: cleanImg });
            }
          }
        }
      }

      const nextDiagOverrides = { ...adminState.diagnosticPriceOverrides };
      if (payload.diagPrices) {
        for (const [id, p] of Object.entries(payload.diagPrices)) {
          nextDiagOverrides[id] = Math.max(0, Number(p) || 0);
        }
      }

      await persistAdminState(
        {
          ...adminState,
          serviceOverrides: nextServiceOverrides,
          customServices: nextCustomServices,
          specialOfferOverrides: nextOfferOverrides,
          diagnosticPriceOverrides: nextDiagOverrides,
        },
        newImgs
      );
    },
    [adminState, persistAdminState]
  );

  const updatePaymentConfig = useCallback(
    async (nextPayment: PaymentConfig) => {
      await persistAdminState({
        ...adminState,
        paymentConfig: nextPayment,
      });
    },
    [adminState, persistAdminState]
  );

  const resetAllToDefaults = useCallback(async () => {
    const now = Date.now();
    const resetState: StoredAdminState = {
      ...DEFAULT_ADMIN_STATE,
      updatedAt: now,
    };
    lastAppliedTimestampRef.current = now;
    setAdminState(resetState);
    try {
      localStorage.removeItem(LOCAL_CONFIG_KEY);
    } catch {
      // ignore
    }
    saveToGlobalCloudStore('config', resetState, now).catch(() => {});
    if (apiServerAvailableRef.current) {
      try {
        const res = await fetch('/api/admin-config/reset', { method: 'POST' });
        if (res.ok) {
          const data = await res.json();
          if (data.config) applyServerConfig(data.config);
        }
      } catch {
        // ignore
      }
    }
  }, [applyServerConfig]);

  // Order history actions (#9)
  const recordOrder = useCallback(
    async (orderData: Omit<OrderRecord, 'id' | 'createdAt' | 'status'>): Promise<OrderRecord> => {
      const newOrder: OrderRecord = {
        ...orderData,
        id: `ord-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        createdAt: Date.now(),
        status: 'pendiente',
      };

      setOrders((prev) => {
        const next = [newOrder, ...prev].slice(0, 300);
        try {
          localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(next));
        } catch {
          // ignore
        }
        saveToGlobalCloudStore('orders', next).catch(() => {});
        return next;
      });

      if (apiServerAvailableRef.current) {
        fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newOrder),
        })
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => {
            if (data && Array.isArray(data.orders)) {
              applyServerOrders(data.orders);
            }
          })
          .catch(() => {});
      }

      return newOrder;
    },
    [applyServerOrders]
  );

  const updateOrderStatus = useCallback(
    async (id: string, status: OrderStatus) => {
      let updatedOrdersList: OrderRecord[] = [];
      setOrders((prev) => {
        const next = prev.map((o) => (o.id === id ? { ...o, status } : o));
        updatedOrdersList = next;
        try {
          localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(next));
        } catch {
          // ignore
        }
        saveToGlobalCloudStore('orders', next).catch(() => {});
        return next;
      });

      // Immediately evaluate if a $550 order became 'completado'
      if (updatedOrdersList.length > 0) {
        evaluateOrdersForRaffle(updatedOrdersList);
      }

      if (apiServerAvailableRef.current) {
        try {
          const res = await fetch(`/api/orders/${encodeURIComponent(id)}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status }),
          });
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data.orders)) applyServerOrders(data.orders);
          }
        } catch {
          // ignore
        }
      }
    },
    [applyServerOrders, evaluateOrdersForRaffle]
  );

  const updateOrderClientLink = useCallback(
    async (id: string, clientLink: string) => {
      const cleanLink = clientLink.trim();
      setOrders((prev) => {
        const next = prev.map((o) => (o.id === id ? { ...o, clientLink: cleanLink } : o));
        try {
          localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(next));
        } catch {
          // ignore
        }
        saveToGlobalCloudStore('orders', next).catch(() => {});
        return next;
      });

      // Also update buyerName & buyerWhatsapp if this order is in currentCycleParticipants
      const current = raffleStateRef.current;
      const inCurrentCycle = current.currentCycleParticipants.some((p) => p.orderId === id);
      if (inCurrentCycle) {
        const info = extractBuyerInfoFromOrder({ id, clientLink: cleanLink });
        const nextParticipants = current.currentCycleParticipants.map((p) =>
          p.orderId === id
            ? {
                ...p,
                buyerName: info.buyerName,
                buyerWhatsapp: info.buyerWhatsapp,
                clientLinkRaw: cleanLink,
              }
            : p
        );
        await persistRaffleState({
          ...current,
          currentCycleParticipants: nextParticipants,
        });
      }
    },
    [persistRaffleState]
  );

  const deleteOrder = useCallback(
    async (id: string) => {
      setOrders((prev) => {
        const next = prev.filter((o) => o.id !== id);
        try {
          localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(next));
        } catch {
          // ignore
        }
        saveToGlobalCloudStore('orders', next).catch(() => {});
        return next;
      });

      if (apiServerAvailableRef.current) {
        try {
          const res = await fetch(`/api/orders/${encodeURIComponent(id)}`, {
            method: 'DELETE',
          });
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data.orders)) applyServerOrders(data.orders);
          }
        } catch {
          // ignore
        }
      }
    },
    [applyServerOrders]
  );

  const clearOrders = useCallback(async () => {
    setOrders([]);
    try {
      localStorage.removeItem(LOCAL_ORDERS_KEY);
    } catch {
      // ignore
    }
    saveToGlobalCloudStore('orders', []).catch(() => {});
    if (apiServerAvailableRef.current) {
      try {
        await fetch('/api/orders', { method: 'DELETE' });
      } catch {
        // ignore
      }
    }
  }, []);

  // ============================================================================
  // RAFFLE & CREDIT ADMIN ACTIONS (Points A, C, D)
  // ============================================================================

  const correctRaffleCycleManually = useCallback(
    async (payload: { orderIdToRemove?: string; reason: string }) => {
      const cleanReason = payload.reason.trim();
      if (!cleanReason) return;

      const current = raffleStateRef.current;
      const now = Date.now();
      let nextParticipants = [...current.currentCycleParticipants];
      const nextExcluded = [...current.excludedOrderIds];
      let removedBuyerName: string | undefined;
      let removedOrderId: string | undefined;
      let whatWasCorrected = '';

      if (payload.orderIdToRemove) {
        const target = nextParticipants.find((p) => p.orderId === payload.orderIdToRemove);
        if (target) {
          removedBuyerName = target.buyerName;
          removedOrderId = target.orderId;
          const prevCount = nextParticipants.length;
          nextParticipants = nextParticipants.filter((p) => p.orderId !== payload.orderIdToRemove);
          if (!nextExcluded.includes(target.orderId)) {
            nextExcluded.push(target.orderId);
          }
          whatWasCorrected = `Ciclo #${current.currentCycleNumber}: Se descontó la venta de "${target.buyerName}" (Pedido #${target.orderId.slice(-6).toUpperCase()}). Contador ajustado de ${prevCount}/2 a ${nextParticipants.length}/2.`;
        } else {
          if (!nextExcluded.includes(payload.orderIdToRemove)) {
            nextExcluded.push(payload.orderIdToRemove);
          }
          removedOrderId = payload.orderIdToRemove;
          whatWasCorrected = `Ciclo #${current.currentCycleNumber}: Se excluyó el pedido #${payload.orderIdToRemove.slice(-6).toUpperCase()} del conteo por cancelación/devolución.`;
        }
      } else if (nextParticipants.length > 0) {
        const lastRemoved = nextParticipants[nextParticipants.length - 1];
        removedBuyerName = lastRemoved.buyerName;
        removedOrderId = lastRemoved.orderId;
        const prevCount = nextParticipants.length;
        nextParticipants = nextParticipants.slice(0, -1);
        if (!nextExcluded.includes(lastRemoved.orderId)) {
          nextExcluded.push(lastRemoved.orderId);
        }
        whatWasCorrected = `Ciclo #${current.currentCycleNumber}: Se descontó 1 venta confirmada ("${lastRemoved.buyerName}", Pedido #${lastRemoved.orderId.slice(-6).toUpperCase()}). Contador ajustado de ${prevCount}/2 a ${nextParticipants.length}/2.`;
      } else {
        whatWasCorrected = `Ciclo #${current.currentCycleNumber}: Registro de corrección administrativa en contador (0/2).`;
      }

      const correctionRecord: RaffleCorrectionRecord = {
        id: `corr-${now}-${Math.random().toString(36).slice(2, 6)}`,
        createdAt: now,
        cycleNumber: current.currentCycleNumber,
        reason: cleanReason,
        whatWasCorrected,
        removedOrderId,
        removedBuyerName,
      };

      await persistRaffleState({
        ...current,
        currentCycleParticipants: nextParticipants,
        excludedOrderIds: nextExcluded,
        corrections: [correctionRecord, ...current.corrections],
        updatedAt: now,
      });
    },
    [persistRaffleState]
  );

  const recordCreditMonthlyEarnings = useCallback(
    async (creditId: string, monthLabel: string, reportedEarningsUSD: number) => {
      const cleanLabel = monthLabel.trim();
      if (!cleanLabel) return;

      const current = raffleStateRef.current;
      const now = Date.now();
      const cleanEarnings = Math.max(0, Number(reportedEarningsUSD) || 0);

      const nextCredits = current.credits.map((credit) => {
        if (credit.id !== creditId) return credit;
        if (credit.remainingBalanceUSD <= 0) return credit;

        // Rule 4: Payment = 50% of reported monthly earnings, capped at remainingBalanceUSD.
        // If reportedEarningsUSD === 0 -> paymentUSD = 0, balance unchanged.
        const halfEarnings = Number((cleanEarnings * 0.5).toFixed(2));
        const paymentUSD =
          cleanEarnings > 0
            ? Number(Math.min(halfEarnings, credit.remainingBalanceUSD).toFixed(2))
            : 0;
        const balanceAfterUSD = Number(
          Math.max(0, credit.remainingBalanceUSD - paymentUSD).toFixed(2)
        );

        const newMonth: RaffleCreditMonthRecord = {
          id: `month-${now}-${Math.random().toString(36).slice(2, 6)}`,
          monthLabel: cleanLabel,
          reportedEarningsUSD: cleanEarnings,
          paymentUSD,
          balanceAfterUSD,
          recordedAt: now,
        };

        const updatedMonths = [...credit.months, newMonth];
        let nextStatus: RaffleCreditStatus = credit.status;
        if (balanceAfterUSD <= 0) {
          nextStatus = 'liquidado';
        } else if (updatedMonths.some((m) => m.reportedEarningsUSD > 0)) {
          nextStatus = 'pagando';
        } else {
          nextStatus = 'esperando_monetizacion';
        }

        return {
          ...credit,
          remainingBalanceUSD: balanceAfterUSD,
          status: nextStatus,
          months: updatedMonths,
          updatedAt: now,
        };
      });

      await persistRaffleState({
        ...current,
        credits: nextCredits,
        updatedAt: now,
      });
    },
    [persistRaffleState]
  );

  const updateWinnerContactInfo = useCallback(
    async (creditId: string, winnerName: string, winnerWhatsapp: string) => {
      const current = raffleStateRef.current;
      const now = Date.now();
      const cleanName = winnerName.trim();
      const cleanWa = winnerWhatsapp.trim();

      const nextCredits = current.credits.map((c) =>
        c.id === creditId
          ? {
              ...c,
              winnerName: cleanName || c.winnerName,
              winnerWhatsapp: cleanWa || c.winnerWhatsapp,
              clientLinkRaw: cleanWa ? `${cleanName || c.winnerName} ${cleanWa}` : c.clientLinkRaw,
              updatedAt: now,
            }
          : c
      );

      const nextDrawHistory = current.drawHistory.map((d) =>
        d.creditId === creditId
          ? {
              ...d,
              winner: {
                ...d.winner,
                buyerName: cleanName || d.winner.buyerName,
                buyerWhatsapp: cleanWa || d.winner.buyerWhatsapp,
                clientLinkRaw: cleanWa ? `${cleanName || d.winner.buyerName} ${cleanWa}` : d.winner.clientLinkRaw,
              },
            }
          : d
      );

      await persistRaffleState({
        ...current,
        credits: nextCredits,
        drawHistory: nextDrawHistory,
        updatedAt: now,
      });
    },
    [persistRaffleState]
  );

  const resetRaffleState = useCallback(async () => {
    const now = Date.now();
    const initialRaffleState: RaffleSystemState = {
      currentCycleNumber: 1,
      currentCycleParticipants: [],
      consumedOrderIds: [],
      excludedOrderIds: [],
      drawHistory: [],
      credits: [],
      corrections: [],
      updatedAt: now,
    };

    await persistRaffleState(initialRaffleState);

    if (hasInMemoryAccessToken()) {
      await queueOrCreateGoogleDriveSync(adminState);
    }
  }, [persistRaffleState, queueOrCreateGoogleDriveSync, adminState]);

  const contextValue = useMemo<CatalogConfigContextValue>(
    () => ({
      services,
      allServicesAdmin,
      specialOffers,
      diagnosticPrices,
      getDiagnosticPrice,
      paymentConfig: adminState.paymentConfig,
      orders,
      raffleState,
      driveInfo,
      pendingDriveConfirmation,
      connectGoogleDrive,
      disconnectGoogleDrive,
      syncNowToGoogleDrive,
      restoreFromGoogleDrive,
      requestDeleteGoogleDriveBackup,
      confirmPendingDriveAction,
      cancelPendingDriveAction,
      updateServicePrice,
      updateServiceDetails,
      toggleServiceHidden,
      createCustomService,
      deleteCustomService,
      updateSpecialOfferPrice,
      updateSpecialOfferDetails,
      updateDiagnosticPrice,
      saveBulkPrices,
      updatePaymentConfig,
      resetAllToDefaults,
      recordOrder,
      updateOrderStatus,
      updateOrderClientLink,
      deleteOrder,
      clearOrders,
      correctRaffleCycleManually,
      recordCreditMonthlyEarnings,
      updateWinnerContactInfo,
      resetRaffleState,
    }),
    [
      services,
      allServicesAdmin,
      specialOffers,
      diagnosticPrices,
      getDiagnosticPrice,
      adminState.paymentConfig,
      orders,
      raffleState,
      driveInfo,
      pendingDriveConfirmation,
      connectGoogleDrive,
      disconnectGoogleDrive,
      syncNowToGoogleDrive,
      restoreFromGoogleDrive,
      requestDeleteGoogleDriveBackup,
      confirmPendingDriveAction,
      cancelPendingDriveAction,
      updateServicePrice,
      updateServiceDetails,
      toggleServiceHidden,
      createCustomService,
      deleteCustomService,
      updateSpecialOfferPrice,
      updateSpecialOfferDetails,
      updateDiagnosticPrice,
      saveBulkPrices,
      updatePaymentConfig,
      resetAllToDefaults,
      recordOrder,
      updateOrderStatus,
      updateOrderClientLink,
      deleteOrder,
      clearOrders,
      correctRaffleCycleManually,
      recordCreditMonthlyEarnings,
      updateWinnerContactInfo,
      resetRaffleState,
    ]
  );

  return (
    <CatalogConfigContext.Provider value={contextValue}>
      {children}
      {/* Mandatory User Confirmation Modal before Overwriting or Deleting a File in Google Drive */}
      {pendingDriveConfirmation && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={cancelPendingDriveAction}
        >
          <div
            className="w-full max-w-md bg-zinc-950 border border-emerald-500/40 rounded-3xl p-5 shadow-2xl text-zinc-100 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${
                  pendingDriveConfirmation.action === 'delete'
                    ? 'bg-rose-500/15 border-rose-500/40 text-rose-400'
                    : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                }`}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7.71 3.5L1.15 15l3.43 6 6.55-11.5L7.71 3.5zm9.73 11.5H4.58L1.15 21h12.86l3.43-6zm5.41-1L16.29 2.5H9.43l6.56 11.5h6.86z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-black text-white">
                  {pendingDriveConfirmation.action === 'delete'
                    ? 'Confirmar eliminación en Google Drive'
                    : 'Confirmar guardado en tu Google Drive'}
                </h4>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  {pendingDriveConfirmation.description}
                </p>
                <div className="mt-2.5 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-emerald-300 truncate">
                  Archivo: {pendingDriveConfirmation.fileName}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={cancelPendingDriveAction}
                className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmPendingDriveAction}
                className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer shadow-lg ${
                  pendingDriveConfirmation.action === 'delete'
                    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/50'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/50'
                }`}
              >
                {pendingDriveConfirmation.action === 'delete'
                  ? 'Confirmar y Eliminar de Drive'
                  : 'Confirmar y Guardar en Google Drive'}
              </button>
            </div>
          </div>
        </div>
      )}
    </CatalogConfigContext.Provider>
  );
};

export function useCatalogConfig(): CatalogConfigContextValue {
  const ctx = useContext(CatalogConfigContext);
  if (!ctx) {
    throw new Error('useCatalogConfig must be used within a CatalogConfigProvider');
  }
  return ctx;
}
