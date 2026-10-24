import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  ServiceItem,
  SpecialPackage,
  DiagnosticPriceConfigItem,
  PaymentConfig,
  OrderRecord,
  OrderStatus,
  SocialNetwork,
} from '../types/catalog';
import {
  SERVICES_DATA,
  SPECIAL_OFFERS,
  DEFAULT_DIAGNOSTIC_PRICES,
  DEFAULT_PAYMENT_CONFIG,
} from '../data/catalogData';

const LOCAL_CONFIG_KEY = 'growth_viral_admin_config_v1';
const LOCAL_ORDERS_KEY = 'growth_viral_orders_history_v1';

interface StoredAdminState {
  serviceOverrides: Record<string, Partial<ServiceItem>>;
  customServices: ServiceItem[];
  specialOfferOverrides: Record<string, Partial<SpecialPackage>>;
  diagnosticPriceOverrides: Record<string, number>;
  paymentConfig: PaymentConfig;
}

const DEFAULT_ADMIN_STATE: StoredAdminState = {
  serviceOverrides: {},
  customServices: [],
  specialOfferOverrides: {},
  diagnosticPriceOverrides: {},
  paymentConfig: DEFAULT_PAYMENT_CONFIG,
};

interface CatalogConfigContextValue {
  services: ServiceItem[];
  allServicesAdmin: ServiceItem[];
  specialOffers: SpecialPackage[];
  diagnosticPrices: DiagnosticPriceConfigItem[];
  getDiagnosticPrice: (id: string, fallback: number) => number;
  paymentConfig: PaymentConfig;
  orders: OrderRecord[];
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
  updateDiagnosticPrice: (id: string, price: number) => Promise<void>;
  saveBulkPrices: (payload: {
    servicePrices?: Record<string, number>;
    offerPrices?: Record<string, number | 'consultar'>;
    diagPrices?: Record<string, number>;
  }) => Promise<void>;
  updatePaymentConfig: (nextPayment: PaymentConfig) => Promise<void>;
  resetAllToDefaults: () => Promise<void>;
  recordOrder: (
    orderData: Omit<OrderRecord, 'id' | 'createdAt' | 'status'>
  ) => Promise<OrderRecord>;
  updateOrderStatus: (id: string, status: OrderStatus) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;
  clearOrders: () => Promise<void>;
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

export const CatalogConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [adminState, setAdminState] = useState<StoredAdminState>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_CONFIG_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_ADMIN_STATE,
          ...parsed,
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

  const applyServerConfig = useCallback((config: any) => {
    if (!config || typeof config !== 'object') return;
    const nextState: StoredAdminState = {
      serviceOverrides: config.serviceOverrides || {},
      customServices: Array.isArray(config.customServices) ? config.customServices : [],
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
    };
    setAdminState(nextState);
    try {
      localStorage.setItem(LOCAL_CONFIG_KEY, JSON.stringify(nextState));
    } catch {
      // ignore
    }
  }, []);

  const applyServerOrders = useCallback((serverOrders: any) => {
    if (!Array.isArray(serverOrders)) return;
    setOrders(serverOrders);
    try {
      localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(serverOrders));
    } catch {
      // ignore
    }
  }, []);

  const persistAdminState = useCallback(
    async (nextState: StoredAdminState) => {
      setAdminState(nextState);
      try {
        localStorage.setItem(LOCAL_CONFIG_KEY, JSON.stringify(nextState));
      } catch {
        // ignore
      }
      try {
        const res = await fetch('/api/admin-config', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(nextState),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.config) {
            applyServerConfig(data.config);
          }
        }
      } catch {
        // Fallback already saved in localStorage
      }
    },
    [applyServerConfig]
  );

  // Initial fetch & WebSocket event listener (shared with SessionContext)
  useEffect(() => {
    const fetchInitial = async () => {
      try {
        const res = await fetch('/api/admin-config');
        if (res.ok) {
          const data = await res.json();
          if (data.config) applyServerConfig(data.config);
          if (Array.isArray(data.orders)) applyServerOrders(data.orders);
        }
      } catch {
        // Offline fallback
      }
    };
    fetchInitial();

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
      window.removeEventListener('growth-viral-ws-event', handleWsEvent);
    };
  }, [applyServerConfig, applyServerOrders]);

  // Compute allServicesAdmin (base services + overrides + custom services)
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
      return {
        ...custom,
        ...(override || {}),
        isCustom: true,
      };
    });

    return [...customItems, ...mergedBase];
  }, [adminState.serviceOverrides, adminState.customServices]);

  // Visible services for the public catalog (filters out hidden/paused items)
  const services = useMemo<ServiceItem[]>(() => {
    return allServicesAdmin.filter((s) => !s.hidden);
  }, [allServicesAdmin]);

  // Compute specialOffers
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

  // Compute diagnosticPrices
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
      await persistAdminState(nextState);
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
      await persistAdminState(nextState);
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
      offerPrices?: Record<string, number | 'consultar'>;
      diagPrices?: Record<string, number>;
    }) => {
      const nextServiceOverrides = { ...adminState.serviceOverrides };
      let nextCustomServices = [...adminState.customServices];

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

      const nextOfferOverrides = { ...adminState.specialOfferOverrides };
      if (payload.offerPrices) {
        for (const [id, p] of Object.entries(payload.offerPrices)) {
          nextOfferOverrides[id] = {
            ...(nextOfferOverrides[id] || {}),
            price: p,
          };
        }
      }

      const nextDiagOverrides = { ...adminState.diagnosticPriceOverrides };
      if (payload.diagPrices) {
        for (const [id, p] of Object.entries(payload.diagPrices)) {
          nextDiagOverrides[id] = Math.max(0, Number(p) || 0);
        }
      }

      await persistAdminState({
        ...adminState,
        serviceOverrides: nextServiceOverrides,
        customServices: nextCustomServices,
        specialOfferOverrides: nextOfferOverrides,
        diagnosticPriceOverrides: nextDiagOverrides,
      });
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
    setAdminState(DEFAULT_ADMIN_STATE);
    try {
      localStorage.removeItem(LOCAL_CONFIG_KEY);
    } catch {
      // ignore
    }
    try {
      const res = await fetch('/api/admin-config/reset', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.config) applyServerConfig(data.config);
      }
    } catch {
      // ignore
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
        return next;
      });

      // Fire-and-forget server sync so UI never waits
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
        .catch(() => {
          // Stored locally if offline
        });

      return newOrder;
    },
    [applyServerOrders]
  );

  const updateOrderStatus = useCallback(
    async (id: string, status: OrderStatus) => {
      setOrders((prev) => {
        const next = prev.map((o) => (o.id === id ? { ...o, status } : o));
        try {
          localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });

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
    },
    [applyServerOrders]
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
        return next;
      });

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
    try {
      await fetch('/api/orders', { method: 'DELETE' });
    } catch {
      // ignore
    }
  }, []);

  const contextValue = useMemo<CatalogConfigContextValue>(
    () => ({
      services,
      allServicesAdmin,
      specialOffers,
      diagnosticPrices,
      getDiagnosticPrice,
      paymentConfig: adminState.paymentConfig,
      orders,
      updateServicePrice,
      updateServiceDetails,
      toggleServiceHidden,
      createCustomService,
      deleteCustomService,
      updateSpecialOfferPrice,
      updateDiagnosticPrice,
      saveBulkPrices,
      updatePaymentConfig,
      resetAllToDefaults,
      recordOrder,
      updateOrderStatus,
      deleteOrder,
      clearOrders,
    }),
    [
      services,
      allServicesAdmin,
      specialOffers,
      diagnosticPrices,
      getDiagnosticPrice,
      adminState.paymentConfig,
      orders,
      updateServicePrice,
      updateServiceDetails,
      toggleServiceHidden,
      createCustomService,
      deleteCustomService,
      updateSpecialOfferPrice,
      updateDiagnosticPrice,
      saveBulkPrices,
      updatePaymentConfig,
      resetAllToDefaults,
      recordOrder,
      updateOrderStatus,
      deleteOrder,
      clearOrders,
    ]
  );

  return (
    <CatalogConfigContext.Provider value={contextValue}>
      {children}
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
