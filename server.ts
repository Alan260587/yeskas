import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '1987';
const PORT = 3000;
const SESSION_TIMEOUT_MS = 15000; // 15 seconds without heartbeat cleans up stale session

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
    const wsDead = session.ws && (session.ws.readyState === WebSocket.CLOSED || session.ws.readyState === WebSocket.CLOSING);
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

function broadcastState() {
  const payload = JSON.stringify(buildPublicState());
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

async function startServer() {
  const app = express();
  const httpServer = createServer(app);

  // Parse JSON and text bodies (for sendBeacon on page unload)
  app.use(express.json());
  app.use(express.text({ type: '*/*' }));

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

  // REST API: Get current multi-user & admin state + register/heartbeat session
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

  // REST API: Request Admin Login (Exclusive 1 Admin at a time)
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

    // Check if another user is already connected as Admin
    if (activeAdminSessionId && activeAdminSessionId !== sessionId && sessions.has(activeAdminSessionId)) {
      const currentAdmin = sessions.get(activeAdminSessionId);
      res.status(409).json({
        ok: false,
        code: 'admin_already_connected',
        message: `Ya hay un Administrador conectado (Usuario #${currentAdmin?.userNumber ?? 1}). Solo se permite 1 Administrador conectado a la vez.`,
        state: buildPublicState(),
      });
      return;
    }

    // Verify password
    if (password !== ADMIN_PASSWORD) {
      res.status(401).json({
        ok: false,
        code: 'invalid_password',
        message: 'Contraseña incorrecta. Ingresa la clave de administrador (****).',
        state: buildPublicState(),
      });
      return;
    }

    // Grant exclusive Admin role to this session
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

  // REST API: Release Admin role but stay connected as normal user
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

  // REST API: Complete session leave (called on page close / tab close / unload via sendBeacon or fetch)
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

  // WebSocket Server for instant multi-user presence & automatic disconnect on tab close
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

  // Periodic cleanup interval for stale sessions
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
