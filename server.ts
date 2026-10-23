import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '1987';
const PORT = 3000;
const SESSION_TIMEOUT_MS = 15000; // 15 seconds without heartbeat cleans up stale session

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

  app.get('/api/admin-config', (_req, res) => {
    res.json({
      ok: true,
      config: readAdminConfig(),
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

  app.post('/api/admin-config/reset', (_req, res) => {
    const fresh: StoredAdminConfig = {
      ...DEFAULT_STORED_ADMIN_CONFIG,
      updatedAt: Date.now(),
    };
    writeAdminConfig(fresh);
    broadcastAdminConfigUpdated();
    res.json({
      ok: true,
      config: fresh,
      message: 'Todos los precios y datos fueron restaurados a los valores originales.',
    });
  });

  // =========================================================================
  // WHATSAPP ORDER HISTORY ENDPOINTS (#9)
  // =========================================================================

  app.get('/api/orders', (_req, res) => {
    res.json({
      ok: true,
      orders: readOrders(),
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
    res.json({ ok: true, orders: filtered });
  });

  app.delete('/api/orders', (_req, res) => {
    writeOrders([]);
    broadcastOrdersUpdated();
    res.json({ ok: true, orders: [] });
  });

  // =========================================================================
  // PDF UPLOAD & SAVE API ENDPOINTS (Supports 1, 10, or multiple PDFs)
  // =========================================================================

  app.get('/api/pdfs', (_req, res) => {
    const items = readPdfIndex();
    res.json({
      ok: true,
      pdfs: items,
    });
  });

  app.post('/api/pdfs/upload', (req, res) => {
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

        const meta: StoredPdfMeta = {
          id,
          name: cleanName,
          size: typeof item.size === 'number' && item.size > 0 ? item.size : buffer.length,
          uploadedAt: typeof item.uploadedAt === 'number' ? item.uploadedAt : Date.now(),
          category: typeof item.category === 'string' ? item.category : 'General',
          description: typeof item.description === 'string' ? item.description : '',
          slotIndex: typeof item.slotIndex === 'number' ? item.slotIndex : undefined,
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

      res.json({
        ok: true,
        savedCount: savedMetas.length,
        saved: savedMetas,
        pdfs: currentIndex,
        message: `Se guardaron ${savedMetas.length} archivo(s) PDF correctamente.`,
      });
    } catch (err: any) {
      console.error('Error saving PDFs:', err);
      res.status(500).json({
        ok: false,
        message: 'Error interno al guardar los archivos PDF en el servidor.',
      });
    }
  });

  app.get('/api/pdfs/:id/file', (req, res) => {
    const rawId = (req.params.id || '').replace(/[^a-zA-Z0-9_-]/g, '');
    const index = readPdfIndex();
    const meta = index.find((item) => item.id === rawId);
    const filePath = path.join(PDF_STORAGE_DIR, `${rawId}.pdf`);

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
