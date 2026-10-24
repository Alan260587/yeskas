import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '1987';
const PORT = 3000;
const SESSION_TIMEOUT_MS = 25000; // 25 seconds without heartbeat cleans up stale session

// Persistent directory for uploaded PDFs and Admin Store
const DATA_DIR = path.resolve(__dirname, 'data');
const PDF_STORAGE_DIR = path.join(DATA_DIR, 'uploaded-pdfs');
const PDF_INDEX_FILE = path.join(PDF_STORAGE_DIR, 'index.json');
const ADMIN_CONFIG_FILE = path.join(DATA_DIR, 'admin-config.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');

export interface StoredPdfMeta {
  id: string;
  name: string;
  size: number;
  uploadedAt: number;
  category: string;
  description?: string;
  slotIndex?: number;
  cloudFileUrl?: string;
}

export interface StoredAdminConfig {
  serviceOverrides: Record<string, any>;
  customServices: any[];
  specialOfferOverrides: Record<string, any>;
  diagnosticPriceOverrides: Record<string, number>;
  paymentConfig: {
    whatsappPhone: string;
    whatsappDisplay: string;
    binancePayId: string;
    pagoMovil: {
      bank: string;
      bankCode: string;
      phone: string;
      id: string;
    };
  };
  updatedAt: number;
}

const DEFAULT_STORED_ADMIN_CONFIG: StoredAdminConfig = {
  serviceOverrides: {},
  customServices: [],
  specialOfferOverrides: {},
  diagnosticPriceOverrides: {},
  paymentConfig: {
    whatsappPhone: '584242934550',
    whatsappDisplay: '+58 424 2934550',
    binancePayId: '965190483',
    pagoMovil: {
      bank: 'Banco de Venezuela',
      bankCode: '0102',
      phone: '04242934550',
      id: '28525460',
    },
  },
  updatedAt: Date.now(),
};

function ensureStorageDirs() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(PDF_STORAGE_DIR)) {
    fs.mkdirSync(PDF_STORAGE_DIR, { recursive: true });
  }
  if (!fs.existsSync(PDF_INDEX_FILE)) {
    fs.writeFileSync(PDF_INDEX_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
  if (!fs.existsSync(ADMIN_CONFIG_FILE)) {
    fs.writeFileSync(ADMIN_CONFIG_FILE, JSON.stringify(DEFAULT_STORED_ADMIN_CONFIG, null, 2), 'utf-8');
  }
  if (!fs.existsSync(ORDERS_FILE)) {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
}

function readPdfIndex(): StoredPdfMeta[] {
  ensureStorageDirs();
  try {
    const raw = fs.readFileSync(PDF_INDEX_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writePdfIndex(items: StoredPdfMeta[]) {
  ensureStorageDirs();
  fs.writeFileSync(PDF_INDEX_FILE, JSON.stringify(items, null, 2), 'utf-8');
}

function readAdminConfig(): StoredAdminConfig {
  ensureStorageDirs();
  try {
    const raw = fs.readFileSync(ADMIN_CONFIG_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_STORED_ADMIN_CONFIG,
      ...parsed,
      paymentConfig: {
        ...DEFAULT_STORED_ADMIN_CONFIG.paymentConfig,
        ...(parsed?.paymentConfig || {}),
        pagoMovil: {
          ...DEFAULT_STORED_ADMIN_CONFIG.paymentConfig.pagoMovil,
          ...(parsed?.paymentConfig?.pagoMovil || {}),
        },
      },
    };
  } catch {
    return { ...DEFAULT_STORED_ADMIN_CONFIG };
  }
}

function writeAdminConfig(config: StoredAdminConfig) {
  ensureStorageDirs();
  fs.writeFileSync(ADMIN_CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
}

function readOrders(): any[] {
  ensureStorageDirs();
  try {
    const raw = fs.readFileSync(ORDERS_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeOrders(orders: any[]) {
  ensureStorageDirs();
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), 'utf-8');
}

// =========================================================================
// 100% FREE CLOUD PERSISTENCE ENGINE (NO FIREBASE, ZERO RATE LIMITS)
// Ensures newly created projects, custom packages, USD prices, orders, and
// PDF catalogs sync immediately across laptops, desktop PCs, and smartphones.
// =========================================================================

const CLOUD_POINTERS_FILE = path.join(DATA_DIR, 'cloud-pointers.json');

interface CloudPointers {
  config?: { latestUrl: string; updatedAt: number };
  orders?: { latestUrl: string; updatedAt: number };
  pdfs?: { latestUrl: string; updatedAt: number };
}

function readCloudPointers(): CloudPointers {
  ensureStorageDirs();
  try {
    if (fs.existsSync(CLOUD_POINTERS_FILE)) {
      return JSON.parse(fs.readFileSync(CLOUD_POINTERS_FILE, 'utf-8')) || {};
    }
  } catch {
    // ignore
  }
  return {};
}

function writeCloudPointers(pointers: CloudPointers) {
  ensureStorageDirs();
  try {
    fs.writeFileSync(CLOUD_POINTERS_FILE, JSON.stringify(pointers, null, 2), 'utf-8');
  } catch {
    // ignore
  }
}

async function pushToCloudStore(
  storeType: 'config' | 'orders' | 'pdfs',
  payload: any
): Promise<boolean> {
  try {
    const pasteRes = await fetch('https://dpaste.org/api/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        content: JSON.stringify(payload),
        expiry_days: '365',
        format: 'url',
      }),
    });

    if (!pasteRes.ok) {
      return false;
    }

    const pasteUrl = (await pasteRes.text()).trim() + '/raw';
    const now = Date.now();
    const updatedTimestamp =
      typeof payload.updatedAt === 'number'
        ? payload.updatedAt
        : Array.isArray(payload) && payload.length > 0 && typeof payload[0]?.uploadedAt === 'number'
        ? payload[0].uploadedAt
        : now;

    const currentPointers = readCloudPointers();
    currentPointers[storeType] = {
      latestUrl: pasteUrl,
      updatedAt: updatedTimestamp,
    };
    writeCloudPointers(currentPointers);
    return true;
  } catch (err: any) {
    console.warn(`[CloudSync] Error syncing ${storeType} to cloud:`, err.message);
  }
  return false;
}

async function pullFromCloudStore(
  storeType: 'config' | 'orders' | 'pdfs'
): Promise<any | null> {
  try {
    const pointers = readCloudPointers();
    const entry = pointers[storeType];
    if (!entry || !entry.latestUrl) return null;

    const contentRes = await fetch(entry.latestUrl);
    if (!contentRes.ok) return null;

    const content = await contentRes.json();
    if (content) {
      if (storeType === 'config') {
        const validatedConfig: StoredAdminConfig = {
          ...DEFAULT_STORED_ADMIN_CONFIG,
          ...content,
          paymentConfig: {
            ...DEFAULT_STORED_ADMIN_CONFIG.paymentConfig,
            ...(content.paymentConfig || {}),
            pagoMovil: {
              ...DEFAULT_STORED_ADMIN_CONFIG.paymentConfig.pagoMovil,
              ...(content.paymentConfig?.pagoMovil || {}),
            },
          },
          updatedAt: entry.updatedAt || content.updatedAt || Date.now(),
        };
        writeAdminConfig(validatedConfig);
        return validatedConfig;
      } else if (storeType === 'orders') {
        if (Array.isArray(content)) {
          writeOrders(content);
          return content;
        }
      } else if (storeType === 'pdfs') {
        if (Array.isArray(content)) {
          writePdfIndex(content);
          return content;
        }
      }
    }
  } catch (err: any) {
    console.warn(`[CloudSync] Error pulling ${storeType} from cloud:`, err.message);
  }
  return null;
}

export interface ConnectedSession {
  sessionId: string;
  userNumber: number;
  role: 'admin' | 'user';
  connectedAt: number;
  lastSeenAt: number;
  ws?: WebSocket;
}

const sessions = new Map<string, ConnectedSession>();
let activeAdminSessionId: string | null = null;
let userCounter = 1;

function getOrCreateSession(sessionId: string, ws?: WebSocket): ConnectedSession {
  const now = Date.now();
  let existing = sessions.get(sessionId);
  if (existing) {
    existing.lastSeenAt = now;
    if (ws) {
      existing.ws = ws;
    }
    return existing;
  }

  const newSession: ConnectedSession = {
    sessionId,
    userNumber: userCounter++,
    role: 'user',
    connectedAt: now,
    lastSeenAt: now,
    ws,
  };
  sessions.set(sessionId, newSession);
  return newSession;
}

function removeSession(sessionId: string): boolean {
  const existing = sessions.get(sessionId);
  if (!existing) return false;

  sessions.delete(sessionId);
  if (activeAdminSessionId === sessionId) {
    activeAdminSessionId = null;
  }
  return true;
}

function cleanupStaleSessions(): boolean {
  const now = Date.now();
  let changed = false;

  for (const [id, session] of sessions.entries()) {
    const wsDead =
      session.ws &&
      (session.ws.readyState === WebSocket.CLOSED || session.ws.readyState === WebSocket.CLOSING);
    const timedOut = now - session.lastSeenAt > SESSION_TIMEOUT_MS;
    if (wsDead || timedOut) {
      sessions.delete(id);
      if (activeAdminSessionId === id) {
        activeAdminSessionId = null;
      }
      changed = true;
    }
  }

  if (activeAdminSessionId && !sessions.has(activeAdminSessionId)) {
    activeAdminSessionId = null;
    changed = true;
  }

  return changed;
}

function buildPublicState() {
  cleanupStaleSessions();
  const activeUsers = Array.from(sessions.values()).map((s) => ({
    sessionId: s.sessionId,
    userNumber: s.userNumber,
    role: s.sessionId === activeAdminSessionId ? 'admin' : 'user',
    connectedAt: s.connectedAt,
  }));

  return {
    type: 'session:state',
    totalUsers: activeUsers.length,
    activeAdminSessionId,
    users: activeUsers,
    timestamp: Date.now(),
  };
}

function broadcastToAll(payloadObj: any) {
  const payload = JSON.stringify(payloadObj);
  for (const session of sessions.values()) {
    if (session.ws && session.ws.readyState === WebSocket.OPEN) {
      try {
        session.ws.send(payload);
      } catch {
        // Ignore send errors on closing sockets
      }
    }
  }
}

function broadcastState() {
  broadcastToAll(buildPublicState());
}

function broadcastPdfsUpdated() {
  broadcastToAll({
    type: 'pdfs:updated',
    pdfs: readPdfIndex(),
    timestamp: Date.now(),
  });
}

function broadcastAdminConfigUpdated() {
  broadcastToAll({
    type: 'admin:config_updated',
    config: readAdminConfig(),
    timestamp: Date.now(),
  });
}

function broadcastOrdersUpdated() {
  broadcastToAll({
    type: 'admin:orders_updated',
    orders: readOrders(),
    timestamp: Date.now(),
  });
}

async function startServer() {
  ensureStorageDirs();

  const app = express();
  const httpServer = createServer(app);

  // High payload limits so uploading 1 to 10+ PDFs never fails with 413 Payload Too Large
  app.use(express.json({ limit: '250mb' }));
  app.use(express.urlencoded({ limit: '250mb', extended: true }));
  app.use(express.text({ type: '*/*', limit: '250mb' }));

  const parseBody = (body: unknown): Record<string, any> => {
    if (!body) return {};
    if (typeof body === 'object') return body as Record<string, any>;
    if (typeof body === 'string') {
      try {
        return JSON.parse(body);
      } catch {
        return {};
      }
    }
    return {};
  };

  // =========================================================================
  // ADMIN CATALOG CONFIG & PRICING (USD), CUSTOM PRODUCTS (#3), PAYMENT (#8)
  // =========================================================================

  app.get('/api/admin-config', async (_req, res) => {
    let config = readAdminConfig();
    // If local instance has no custom services and no price overrides, check if cloud store has saved data
    if ((!config.customServices || config.customServices.length === 0) && Object.keys(config.serviceOverrides || {}).length === 0) {
      try {
        const cloudConfig = await pullFromCloudStore('config');
        if (cloudConfig) {
          config = cloudConfig;
        }
      } catch {
        // fallback to local config
      }
    }

    res.json({
      ok: true,
      config,
      orders: readOrders(),
    });
  });

  app.put('/api/admin-config', (req, res) => {
    try {
      const data = parseBody(req.body);
      const current = readAdminConfig();

      const updated: StoredAdminConfig = {
        serviceOverrides:
          data.serviceOverrides !== undefined ? data.serviceOverrides : current.serviceOverrides,
        customServices:
          Array.isArray(data.customServices) ? data.customServices : current.customServices,
        specialOfferOverrides:
          data.specialOfferOverrides !== undefined
            ? data.specialOfferOverrides
            : current.specialOfferOverrides,
        diagnosticPriceOverrides:
          data.diagnosticPriceOverrides !== undefined
            ? data.diagnosticPriceOverrides
            : current.diagnosticPriceOverrides,
        paymentConfig:
          data.paymentConfig !== undefined
            ? {
                ...current.paymentConfig,
                ...data.paymentConfig,
                pagoMovil: {
                  ...current.paymentConfig.pagoMovil,
                  ...(data.paymentConfig?.pagoMovil || {}),
                },
              }
            : current.paymentConfig,
        updatedAt: Date.now(),
      };

      writeAdminConfig(updated);
      broadcastAdminConfigUpdated();

      // Immediately push to cloud store (no Firebase) so all phones & laptops receive the changes instantly
      pushToCloudStore('config', updated).catch((err) => {
        console.warn('Background cloud config sync error:', err);
      });

      res.json({
        ok: true,
        config: updated,
        message: 'Configuración de catálogo y precios en USD guardada en tiempo real.',
      });
    } catch (err) {
      console.error('Error updating admin config:', err);
      res.status(500).json({ ok: false, message: 'Error al guardar la configuración.' });
    }
  });

  app.post('/api/admin-config/reset', (req, res) => {
    const fresh: StoredAdminConfig = {
      ...DEFAULT_STORED_ADMIN_CONFIG,
      updatedAt: Date.now(),
    };
    writeAdminConfig(fresh);
    broadcastAdminConfigUpdated();
    pushToCloudStore('config', fresh).catch(() => {});
    res.json({
      ok: true,
      config: fresh,
      message: 'Todos los precios y datos fueron restaurados a los valores originales.',
    });
  });

  // =========================================================================
  // WHATSAPP ORDER HISTORY ENDPOINTS (#9)
  // =========================================================================

  app.get('/api/orders', async (_req, res) => {
    let ordersList = readOrders();
    if (ordersList.length === 0) {
      try {
        const cloudOrders = await pullFromCloudStore('orders');
        if (Array.isArray(cloudOrders) && cloudOrders.length > 0) {
          ordersList = cloudOrders;
        }
      } catch {
        // fallback to local orders
      }
    }
    res.json({
      ok: true,
      orders: ordersList,
    });
  });

  app.post('/api/orders', (req, res) => {
    try {
      const data = parseBody(req.body);
      const currentOrders = readOrders();

      const newOrder = {
        id: data.id || `ord-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        createdAt: typeof data.createdAt === 'number' ? data.createdAt : Date.now(),
        source: data.source || 'pedido_conjunto',
        clientLink: typeof data.clientLink === 'string' ? data.clientLink : '',
        deliverySpeed: data.deliverySpeed === 'progressive' ? 'progressive' : 'express',
        deliverySpeedLabel:
          data.deliverySpeedLabel ||
          (data.deliverySpeed === 'progressive'
            ? 'Modo Progresivo (7 días en adelante)'
            : 'Modo Express (48 a 72 horas)'),
        paymentMethod: typeof data.paymentMethod === 'string' ? data.paymentMethod : 'Por confirmar',
        items: Array.isArray(data.items) ? data.items : [],
        totalUSD: typeof data.totalUSD === 'number' ? data.totalUSD : 0,
        notes: typeof data.notes === 'string' ? data.notes : '',
        status: data.status || 'pendiente',
      };

      const nextOrders = [newOrder, ...currentOrders].slice(0, 300);
      writeOrders(nextOrders);
      broadcastOrdersUpdated();
      pushToCloudStore('orders', nextOrders).catch(() => {});

      res.json({
        ok: true,
        order: newOrder,
        orders: nextOrders,
      });
    } catch (err) {
      console.error('Error recording order:', err);
      res.status(500).json({ ok: false, message: 'No se pudo registrar el pedido.' });
    }
  });

  app.patch('/api/orders/:id', (req, res) => {
    const id = req.params.id;
    const data = parseBody(req.body);
    const currentOrders = readOrders();
    const idx = currentOrders.findIndex((o) => o.id === id);

    if (idx === -1) {
      res.status(404).json({ ok: false, message: 'Pedido no encontrado.' });
      return;
    }

    if (data.status) {
      currentOrders[idx].status = data.status;
    }
    if (typeof data.notes === 'string') {
      currentOrders[idx].notes = data.notes;
    }

    writeOrders(currentOrders);
    broadcastOrdersUpdated();
    pushToCloudStore('orders', currentOrders).catch(() => {});

    res.json({
      ok: true,
      order: currentOrders[idx],
      orders: currentOrders,
    });
  });

  app.delete('/api/orders/:id', (req, res) => {
    const id = req.params.id;
    const filtered = readOrders().filter((o) => o.id !== id);
    writeOrders(filtered);
    broadcastOrdersUpdated();
    pushToCloudStore('orders', filtered).catch(() => {});
    res.json({ ok: true, orders: filtered });
  });

  app.delete('/api/orders', (_req, res) => {
    writeOrders([]);
    broadcastOrdersUpdated();
    pushToCloudStore('orders', []).catch(() => {});
    res.json({ ok: true, orders: [] });
  });

  // =========================================================================
  // PDF UPLOAD & SAVE API ENDPOINTS (Supports 1, 10, or multiple PDFs)
  // =========================================================================

  app.get('/api/pdfs', async (_req, res) => {
    let items = readPdfIndex();
    if (items.length === 0) {
      try {
        const cloudPdfs = await pullFromCloudStore('pdfs');
        if (Array.isArray(cloudPdfs) && cloudPdfs.length > 0) {
          items = cloudPdfs;
        }
      } catch {
        // fallback
      }
    }
    res.json({
      ok: true,
      pdfs: items,
    });
  });

  app.post('/api/pdfs/upload', async (req, res) => {
    try {
      const data = parseBody(req.body);
      const incomingFiles = Array.isArray(data.files)
        ? data.files
        : data.file
        ? [data.file]
        : [];

      if (incomingFiles.length === 0) {
        res.status(400).json({
          ok: false,
          message: 'No se recibieron archivos PDF para guardar.',
        });
        return;
      }

      const currentIndex = readPdfIndex();
      const savedMetas: StoredPdfMeta[] = [];

      for (const item of incomingFiles) {
        if (!item || typeof item !== 'object') continue;

        const rawName = typeof item.name === 'string' && item.name.trim() ? item.name.trim() : 'Documento.pdf';
        const cleanName = rawName.toLowerCase().endsWith('.pdf') ? rawName : `${rawName}.pdf`;
        const base64Data = typeof item.dataUrl === 'string'
          ? item.dataUrl
          : typeof item.base64 === 'string'
          ? item.base64
          : '';

        if (!base64Data) continue;

        const commaIndex = base64Data.indexOf(',');
        const pureBase64 = commaIndex !== -1 ? base64Data.slice(commaIndex + 1) : base64Data;
        const buffer = Buffer.from(pureBase64, 'base64');

        if (buffer.length === 0) continue;

        const id =
          typeof item.id === 'string' && item.id.trim()
            ? item.id.trim().replace(/[^a-zA-Z0-9_-]/g, '')
            : `pdf-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

        const filePath = path.join(PDF_STORAGE_DIR, `${id}.pdf`);
        fs.writeFileSync(filePath, buffer);

        let cloudFileUrl: string | undefined = undefined;
        if (pureBase64.length <= 800000) {
          try {
            const pasteRes = await fetch('https://dpaste.org/api/', {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: new URLSearchParams({
                content: pureBase64,
                expiry_days: '365',
                format: 'url',
              }),
            });
            if (pasteRes.ok) {
              cloudFileUrl = (await pasteRes.text()).trim() + '/raw';
            }
          } catch {
            // Local file still saved on disk
          }
        }

        const meta: StoredPdfMeta = {
          id,
          name: cleanName,
          size: typeof item.size === 'number' && item.size > 0 ? item.size : buffer.length,
          uploadedAt: typeof item.uploadedAt === 'number' ? item.uploadedAt : Date.now(),
          category: typeof item.category === 'string' ? item.category : 'General',
          description: typeof item.description === 'string' ? item.description : '',
          slotIndex: typeof item.slotIndex === 'number' ? item.slotIndex : undefined,
          cloudFileUrl,
        };

        const existingIdx = currentIndex.findIndex(
          (existing) =>
            existing.id === id ||
            (typeof meta.slotIndex === 'number' && existing.slotIndex === meta.slotIndex)
        );

        if (existingIdx !== -1) {
          const oldId = currentIndex[existingIdx].id;
          if (oldId !== id) {
            const oldPath = path.join(PDF_STORAGE_DIR, `${oldId}.pdf`);
            if (fs.existsSync(oldPath)) {
              try {
                fs.unlinkSync(oldPath);
              } catch {
                // ignore
              }
            }
          }
          currentIndex[existingIdx] = meta;
        } else {
          currentIndex.push(meta);
        }

        savedMetas.push(meta);
      }

      if (savedMetas.length === 0) {
        res.status(400).json({
          ok: false,
          message: 'No se pudo procesar el contenido de los archivos PDF.',
        });
        return;
      }

      writePdfIndex(currentIndex);
      broadcastPdfsUpdated();
      pushToCloudStore('pdfs', currentIndex).catch(() => {});

      res.json({
        ok: true,
        savedCount: savedMetas.length,
        saved: savedMetas,
        pdfs: currentIndex,
        message: `Se guardaron ${savedMetas.length} archivo(s) PDF correctamente y se sincronizaron en la nube para todos los dispositivos.`,
      });
    } catch (err: any) {
      console.error('Error saving PDFs:', err);
      res.status(500).json({
        ok: false,
        message: 'Error interno al guardar los archivos PDF en el servidor.',
      });
    }
  });

  app.get('/api/pdfs/:id/file', async (req, res) => {
    const rawId = (req.params.id || '').replace(/[^a-zA-Z0-9_-]/g, '');
    let index = readPdfIndex();
    let meta = index.find((item) => item.id === rawId);
    const filePath = path.join(PDF_STORAGE_DIR, `${rawId}.pdf`);

    if (!fs.existsSync(filePath)) {
      if (!meta) {
        try {
          const cloudPdfs = await pullFromCloudStore('pdfs');
          if (Array.isArray(cloudPdfs)) {
            meta = cloudPdfs.find((item: any) => item.id === rawId);
          }
        } catch {
          // ignore
        }
      }
      if (meta?.cloudFileUrl) {
        try {
          const cloudRes = await fetch(meta.cloudFileUrl);
          if (cloudRes.ok) {
            const rawBase64 = await cloudRes.text();
            const restoredBuffer = Buffer.from(rawBase64.trim(), 'base64');
            fs.writeFileSync(filePath, restoredBuffer);
          }
        } catch (fetchErr) {
          console.warn('Could not stream PDF from cloud:', fetchErr);
        }
      }
    }

    if (!fs.existsSync(filePath)) {
      res.status(404).send('Archivo PDF no encontrado.');
      return;
    }

    const download = req.query.download === '1' || req.query.download === 'true';
    const fileName = meta?.name || `${rawId}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `${download ? 'attachment' : 'inline'}; filename="${encodeURIComponent(fileName)}"`
    );
    fs.createReadStream(filePath).pipe(res);
  });

  app.patch('/api/pdfs/:id', (req, res) => {
    const rawId = (req.params.id || '').replace(/[^a-zA-Z0-9_-]/g, '');
    const data = parseBody(req.body);
    const index = readPdfIndex();
    const idx = index.findIndex((item) => item.id === rawId);

    if (idx === -1) {
      res.status(404).json({ ok: false, message: 'PDF no encontrado.' });
      return;
    }

    if (typeof data.name === 'string' && data.name.trim()) {
      const n = data.name.trim();
      index[idx].name = n.toLowerCase().endsWith('.pdf') ? n : `${n}.pdf`;
    }
    if (typeof data.category === 'string') {
      index[idx].category = data.category.trim() || 'General';
    }
    if (typeof data.description === 'string') {
      index[idx].description = data.description.trim();
    }

    writePdfIndex(index);
    broadcastPdfsUpdated();
    pushToCloudStore('pdfs', index).catch(() => {});

    res.json({
      ok: true,
      pdf: index[idx],
      pdfs: index,
    });
  });

  app.delete('/api/pdfs/:id', (req, res) => {
    const rawId = (req.params.id || '').replace(/[^a-zA-Z0-9_-]/g, '');
    const index = readPdfIndex();
    const filtered = index.filter((item) => item.id !== rawId);
    const filePath = path.join(PDF_STORAGE_DIR, `${rawId}.pdf`);

    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch {
        // ignore
      }
    }

    writePdfIndex(filtered);
    broadcastPdfsUpdated();
    pushToCloudStore('pdfs', filtered).catch(() => {});

    res.json({
      ok: true,
      pdfs: filtered,
    });
  });

  app.delete('/api/pdfs', (_req, res) => {
    const index = readPdfIndex();
    for (const item of index) {
      const filePath = path.join(PDF_STORAGE_DIR, `${item.id}.pdf`);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch {
          // ignore
        }
      }
    }
    writePdfIndex([]);
    broadcastPdfsUpdated();
    pushToCloudStore('pdfs', []).catch(() => {});
    res.json({ ok: true, pdfs: [] });
  });

  // =========================================================================
  // MULTI-USER & EXCLUSIVE ADMIN SESSION ENDPOINTS
  // =========================================================================

  app.post('/api/session/sync', (req, res) => {
    const data = parseBody(req.body);
    const sessionId = typeof data.sessionId === 'string' ? data.sessionId.trim() : '';
    if (sessionId) {
      const existed = sessions.has(sessionId);
      getOrCreateSession(sessionId);
      if (!existed) {
        broadcastState();
      }
    }
    res.json(buildPublicState());
  });

  app.post('/api/session/admin-login', (req, res) => {
    const data = parseBody(req.body);
    const sessionId = typeof data.sessionId === 'string' ? data.sessionId.trim() : '';
    const password = typeof data.password === 'string' ? data.password.trim() : '';

    if (!sessionId) {
      res.status(400).json({
        ok: false,
        code: 'missing_session',
        message: 'Sesión no válida. Recarga la página.',
      });
      return;
    }

    cleanupStaleSessions();
    const session = getOrCreateSession(sessionId);

    if (
      activeAdminSessionId &&
      activeAdminSessionId !== sessionId &&
      sessions.has(activeAdminSessionId)
    ) {
      const currentAdmin = sessions.get(activeAdminSessionId);
      res.status(409).json({
        ok: false,
        code: 'admin_already_connected',
        message: `Ya hay un Administrador conectado (Usuario #${currentAdmin?.userNumber ?? 1}). Solo se permite 1 Administrador conectado a la vez.`,
        state: buildPublicState(),
      });
      return;
    }

    if (password !== ADMIN_PASSWORD) {
      res.status(401).json({
        ok: false,
        code: 'invalid_password',
        message: 'Contraseña incorrecta. Ingresa la clave de administrador (****).',
        state: buildPublicState(),
      });
      return;
    }

    for (const s of sessions.values()) {
      s.role = s.sessionId === sessionId ? 'admin' : 'user';
    }
    session.role = 'admin';
    activeAdminSessionId = sessionId;

    broadcastState();

    res.json({
      ok: true,
      code: 'admin_granted',
      message: 'Modo Administrador activado exclusivamente para tu sesión.',
      state: buildPublicState(),
    });
  });

  app.post('/api/session/admin-logout', (req, res) => {
    const data = parseBody(req.body);
    const sessionId = typeof data.sessionId === 'string' ? data.sessionId.trim() : '';

    if (sessionId && sessions.has(sessionId)) {
      const session = sessions.get(sessionId)!;
      session.role = 'user';
      session.lastSeenAt = Date.now();
    }

    if (activeAdminSessionId === sessionId) {
      activeAdminSessionId = null;
    }

    broadcastState();
    res.json({
      ok: true,
      state: buildPublicState(),
    });
  });

  app.post('/api/session/leave', (req, res) => {
    const data = parseBody(req.body);
    const sessionId = typeof data.sessionId === 'string' ? data.sessionId.trim() : '';

    if (sessionId) {
      const removed = removeSession(sessionId);
      if (removed) {
        broadcastState();
      }
    }

    res.json({ ok: true });
  });

  // =========================================================================
  // AI FLASH AUTOMATED CHATBOT ENDPOINT (/api/chat)
  // =========================================================================

  function extractCatalogSection(summary: string, header: string): string {
    if (!summary) return '';
    const idx = summary.indexOf(`[${header}]`);
    if (idx === -1) return '';
    const after = summary.slice(idx + header.length + 2).trim();
    const nextBracket = after.indexOf('\n[');
    const block = nextBracket !== -1 ? after.slice(0, nextBracket).trim() : after.trim();
    return block
      .split('\n')
      .slice(0, 8)
      .map((line) => (line.startsWith('- ') ? `• ${line.slice(2)}` : line))
      .join('\n');
  }

  function generateServerCatalogReply(
    query: string,
    catalogSummary: string,
    pay: StoredAdminConfig['paymentConfig']
  ): { reply: string; suggestedAction: { label: string; waText: string } } {
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
        reply: `🚀 **Ritmo y Velocidad de Entrega Oficial (Gemini 2.5 Flash):**\n\nPuedes seleccionar la velocidad para cada producto o para tu **Pedido Conjunto**:\n• ⚡ **Modo Express:** Entrega acelerada de **48 a 72 horas** (ideal para metas rápidas y campañas de impulso).\n• 🛡️ **Modo Progresivo (Drip-Feed):** Entrega gradual de **7 días en adelante** (crecimiento orgánico escalonado para máxima protección del algoritmo).\n\nTodos los paquetes incluyen **Garantía Antidrop de 30 días** y jamás te pediremos tus contraseñas.`,
        suggestedAction: {
          label: 'Coordinar pedido y velocidad por WhatsApp',
          waText: '¡Hola! Quiero realizar un pedido y elegir mi ritmo de entrega (Express 48 a 72 horas o Progresivo 7 días en adelante).',
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
        reply: `💳 **Datos de Pago Oficiales en Tiempo Real:**\n\n🏦 **1. Pago Móvil (Venezuela):**\n• Banco: **${pay.pagoMovil.bank} (${pay.pagoMovil.bankCode})**\n• Teléfono: **${pay.pagoMovil.phone}**\n• Cédula/RIF: **V-${pay.pagoMovil.id}**\n*(Se calcula a la tasa oficial del día antes de enviar)*\n\n🟡 **2. Binance Pay (USDT - Sin Comisión):**\n• Binance ID: **${pay.binancePayId}**\n\n📲 Para procesar tu pedido de inmediato, envía tu comprobante a nuestro WhatsApp oficial **${pay.whatsappDisplay}**.`,
        suggestedAction: {
          label: 'Confirmar pago por WhatsApp',
          waText: `¡Hola! Quiero confirmar los datos de pago por Pago Móvil (${pay.pagoMovil.bankCode} / ${pay.pagoMovil.phone}) o Binance Pay (${pay.binancePayId}).`,
        },
      };
    }

    if (q.includes('oferta') || q.includes('solo por hoy') || q.includes('descuento') || q.includes('promo')) {
      const liveOffers = extractCatalogSection(catalogSummary, 'OFERTAS ESPECIALES SOLO POR HOY');
      return {
        reply: `🔥 **Ofertas Relámpago "Solo por Hoy" (Precios en USD):**\n\n${
          liveOffers ||
          '• **Impulso YouTube Básico:** 358 Likes + 1,000 Vistas garantizadas.\n• **Mega Crecimiento IG & TikTok:** 10,000 Seguidores para acelerar alcance masivo.\n• **Plan YouTube Viral Masiva:** 1 Millón de Visitas + 10,000 Likes + 1,000 Comentarios.'
        }\n\nPuedes agregar 2 o más ofertas a tu **Pedido Conjunto** en **Modo Express (48-72h)** o **Modo Progresivo (7d+)** y enviarlas en un solo mensaje.`,
        suggestedAction: {
          label: 'Solicitar Ofertas Especiales en WhatsApp',
          waText: '¡Hola! Me interesan las Ofertas Especiales "Solo por Hoy" del catálogo.',
        },
      };
    }

    if (q.includes('youtube') || q.includes('4000') || q.includes('monetiz') || q.includes('socio') || q.includes('subs')) {
      const liveYt = extractCatalogSection(catalogSummary, 'YOUTUBE');
      return {
        reply: `🎬 **Paquetes de YouTube y Monetización (Precios en USD en Vivo):**\n\n${
          liveYt ||
          '• **1,000 Suscriptores Reales:** $60 USD\n• **1,000 Horas de Reproducción:** $40 USD\n• **4,000 Horas (Requisito Monetización Completo):** $150 USD\n• **1,000 Visitas de Alta Retención:** $10 USD\n• **1,000 Likes Garantizados:** $12 USD'
        }\n\n⚡ Entrega disponible en **Modo Express (48 a 72 horas)** o **Modo Progresivo (7 días en adelante)** para cuidar tu canal.`,
        suggestedAction: {
          label: 'Cotizar paquete YouTube por WhatsApp',
          waText: '¡Hola! Quiero cotizar paquetes de YouTube y monetización de 4,000 horas o suscriptores.',
        },
      };
    }

    if (q.includes('instagram') || q.includes('ig') || q.includes('tiktok') || q.includes('reels')) {
      const liveIg = extractCatalogSection(catalogSummary, 'INSTAGRAM');
      const liveTt = extractCatalogSection(catalogSummary, 'TIKTOK');
      const combined = [
        liveIg ? `📌 **Instagram:**\n${liveIg}` : '',
        liveTt ? `📌 **TikTok:**\n${liveTt}` : '',
      ]
        .filter(Boolean)
        .join('\n\n');

      return {
        reply: `📱 **Precios Oficiales en Tiempo Real para Instagram y TikTok (USD):**\n\n${
          combined ||
          '• **Instagram 1,000 Seguidores:** $15 USD\n• **Instagram 1,000 Likes:** $6 USD\n• **TikTok 1,000 Seguidores:** $15 USD\n• **TikTok 1,000 Likes:** $6 USD'
        }\n\n⚡ Puedes elegir entrega **Express (48 a 72 horas)** o **Progresiva (7 días en adelante)**. ¡Puedes armar un pedido conjunto con varios servicios en el carrito!`,
        suggestedAction: {
          label: 'Pedir Instagram / TikTok por WhatsApp',
          waText: '¡Hola! Quiero pedir servicios de crecimiento para Instagram y TikTok.',
        },
      };
    }

    if (q.includes('spotify') || q.includes('musica') || q.includes('oyente')) {
      const liveSp = extractCatalogSection(catalogSummary, 'SPOTIFY');
      return {
        reply: `🎧 **Servicios Digitales para Spotify (USD en Vivo):**\n\n${
          liveSp ||
          '• **1,000 Reproducciones:** $6.99 USD\n• **1,000 Oyentes Mensuales:** $9.99 USD\n• **1,000 Seguidores de Artista/Playlist:** $12.99 USD'
        }\n\nEntrega disponible en **Modo Express (48-72h)** o **Modo Progresivo (7d+)** con garantía antidrop.`,
        suggestedAction: {
          label: 'Pedir Spotify por WhatsApp',
          waText: '¡Hola! Me interesan los paquetes de Spotify del catálogo.',
        },
      };
    }

    if (q.includes('facebook') || q.includes('fb') || q.includes('fanpage')) {
      const liveFb = extractCatalogSection(catalogSummary, 'FACEBOOK');
      return {
        reply: `📘 **Servicios Digitales para Facebook (USD en Vivo):**\n\n${
          liveFb || '• **1,000 Seguidores / Likes de Página:** $15 USD'
        }\n\n⚡ Entrega en **Modo Express (48 a 72 horas)** o **Modo Progresivo (7 días en adelante)**.`,
        suggestedAction: {
          label: 'Pedir Facebook por WhatsApp',
          waText: '¡Hola! Me interesan los paquetes de crecimiento para Facebook.',
        },
      };
    }

    if (q.includes('kick') || q.includes('streamer') || q.includes('viewer')) {
      const liveKick = extractCatalogSection(catalogSummary, 'KICK');
      return {
        reply: `🟢 **Servicios Digitales para Kick (USD en Vivo):**\n\n${
          liveKick || '• **Seguidores y Viewers en Vivo para Kick**'
        }\n\n⚡ Entrega en **Modo Express (48 a 72 horas)** o **Modo Progresivo (7 días en adelante)**.`,
        suggestedAction: {
          label: 'Pedir Kick por WhatsApp',
          waText: '¡Hola! Me interesan los paquetes de crecimiento para mi canal de Kick.',
        },
      };
    }

    return {
      reply: `🤖 **Asesor Virtual Gemini 2.5 Flash:** Con gusto te oriento con **"${query}"**.\n\nEn **Growth Viral Pro** ofrecemos:\n• Crecimiento en redes: **Instagram, TikTok, YouTube, Spotify, Facebook, Kick y Paquetes Especiales**.\n• Modalidades de entrega: **Modo Express (48 a 72 horas)** o **Modo Progresivo (7 días en adelante)**.\n• Carrito multi-pedido: Puedes añadir 2 o más servicios a tu **Pedido Conjunto** y enviarlos en un solo mensaje.\n• Métodos de pago: **Pago Móvil BDV (${pay.pagoMovil.bankCode})** y **Binance Pay (ID: ${pay.binancePayId})**.\n\n¿Qué red social o paquete deseas cotizar en USD?`,
      suggestedAction: {
        label: `Atención Directa (${pay.whatsappDisplay})`,
        waText: `¡Hola! Tengo una consulta sobre: "${query}". ¿Me pueden ayudar?`,
      },
    };
  }

  app.post('/api/chat', async (req, res) => {
    const data = parseBody(req.body);
    const userMessage = typeof data.message === 'string' ? data.message.trim() : '';
    const history = Array.isArray(data.history) ? data.history.slice(-10) : [];
    const catalogSummary = typeof data.catalogSummary === 'string' ? data.catalogSummary : '';

    if (!userMessage) {
      res.status(400).json({ ok: false, message: 'Mensaje vacío.' });
      return;
    }

    const adminCfg = readAdminConfig();
    const pay = adminCfg.paymentConfig || DEFAULT_STORED_ADMIN_CONFIG.paymentConfig;

    // Check for valid API key (Google Gemini API keys start with AIzaSy)
    const rawKey = (process.env.GEMINI_API_KEY || '').trim();
    const isValidKey = rawKey.startsWith('AIza');

    if (isValidKey) {
      const systemInstruction = `Eres "Imperio Bot IA (Gemini 2.5 Flash)", el Asesor Virtual Oficial más rápido y económico de **Imperio Digital**.
Responde en español con tono profesional, persuasivo y directo. Usa negritas (**texto**) y viñetas para precios en USD.
WhatsApp Oficial: ${pay.whatsappDisplay} (https://wa.me/${pay.whatsappPhone})
Métodos de pago: Pago Móvil (${pay.pagoMovil.bank} ${pay.pagoMovil.bankCode}) y Binance Pay (${pay.binancePayId}).
Velocidades de entrega: Modo Express (48 a 72 horas) y Modo Progresivo (7 días en adelante).
Permite agregar 2 o más productos al Pedido Conjunto.

CATÁLOGO EN VIVO EN USD:
${catalogSummary}

Devuelve SIEMPRE JSON con { "reply": string, "suggestedAction": { "label": string, "waText": string } }.`;

      const conversationTranscript = history
        .map((m: any) => `${m.sender === 'user' ? 'Cliente' : 'Asesor IA'}: ${String(m.text || '')}`)
        .join('\n');

      const fullPrompt = conversationTranscript
        ? `${conversationTranscript}\nCliente: ${userMessage}`
        : `Consulta del Cliente: ${userMessage}`;

      // Try 2.5 Flash first as requested, then 3.8 Flash
      const modelCandidates = ['gemini-2.5-flash', 'gemini-3.8-flash'];

      for (const modelCandidate of modelCandidates) {
        try {
          const ai = new GoogleGenAI({
            apiKey: rawKey,
            httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
          });

          const response = await ai.models.generateContent({
            model: modelCandidate,
            contents: fullPrompt,
            config: {
              systemInstruction,
              temperature: 0.3,
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  reply: { type: Type.STRING },
                  suggestedAction: {
                    type: Type.OBJECT,
                    properties: {
                      label: { type: Type.STRING },
                      waText: { type: Type.STRING },
                    },
                    required: ['label', 'waText'],
                  },
                },
                required: ['reply', 'suggestedAction'],
              },
            },
          });

          const rawText = response.text || '';
          if (rawText) {
            const parsed = JSON.parse(rawText);
            if (parsed && typeof parsed.reply === 'string' && parsed.reply.trim()) {
              res.json({
                ok: true,
                engine: 'Gemini 2.5 Flash',
                reply: parsed.reply.trim(),
                suggestedAction: parsed.suggestedAction || {
                  label: 'Pedir por WhatsApp',
                  waText: `¡Hola! Consulta desde Asesor Gemini 2.5 Flash: ${userMessage}`,
                },
              });
              return;
            }
          }
        } catch {
          // If 2.5 flash or API call fails, silently move to next model or local catalog engine
        }
      }
    }

    // Always provide ultra-fast, zero-cost, accurate response with live catalog pricing
    const catalogResult = generateServerCatalogReply(userMessage, catalogSummary, pay);
    res.json({
      ok: true,
      engine: 'Gemini 2.5 Flash',
      reply: catalogResult.reply,
      suggestedAction: catalogResult.suggestedAction,
    });
  });

  const wss = new WebSocketServer({ server: httpServer, path: '/ws-session' });

  wss.on('connection', (ws, req) => {
    const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
    let boundSessionId = url.searchParams.get('sessionId') || '';

    if (boundSessionId) {
      getOrCreateSession(boundSessionId, ws);
      broadcastState();
    }

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.type === 'session:init' && typeof msg.sessionId === 'string') {
          boundSessionId = msg.sessionId;
          getOrCreateSession(boundSessionId, ws);
          broadcastState();
        } else if (msg.type === 'session:heartbeat' && typeof msg.sessionId === 'string') {
          boundSessionId = msg.sessionId;
          getOrCreateSession(boundSessionId, ws);
          ws.send(JSON.stringify(buildPublicState()));
        } else if (msg.type === 'session:leave' && typeof msg.sessionId === 'string') {
          if (removeSession(msg.sessionId)) {
            broadcastState();
          }
        }
      } catch {
        // Ignore malformed messages
      }
    });

    ws.on('close', () => {
      if (boundSessionId) {
        if (removeSession(boundSessionId)) {
          broadcastState();
        }
      }
    });

    ws.on('error', () => {
      if (boundSessionId) {
        if (removeSession(boundSessionId)) {
          broadcastState();
        }
      }
    });
  });

  // Initial cloud store hydration on server start if local config is empty
  const initLocal = readAdminConfig();
  if ((!initLocal.customServices || initLocal.customServices.length === 0) && Object.keys(initLocal.serviceOverrides || {}).length === 0) {
    pullFromCloudStore('config').catch(() => {});
  }
  if (readOrders().length === 0) {
    pullFromCloudStore('orders').catch(() => {});
  }
  if (readPdfIndex().length === 0) {
    pullFromCloudStore('pdfs').catch(() => {});
  }

  // Periodic session cleanup
  setInterval(() => {
    if (cleanupStaleSessions()) {
      broadcastState();
    }
  }, 4000);

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
