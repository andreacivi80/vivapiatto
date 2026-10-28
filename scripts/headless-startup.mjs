import { readFile } from "node:fs/promises";
import { join } from "node:path";

// Exit zero alone proves neither readiness nor failure of a handed-off browser.
export const failedHeadlessExit = (exitCode) =>
  exitCode !== null && exitCode !== undefined && exitCode !== 0;

export const parseDevToolsEndpoint = (text) => {
  const [portText, browserPath] = String(text).trim().split(/\r?\n/);
  if (!/^\d{1,5}$/.test(portText || "")) return null;
  const port = Number(portText);
  if (port < 1 || port > 65535 || !/^\/devtools\/browser\/[A-Za-z0-9-]+$/.test(browserPath || "")) return null;
  return { port, browserPath };
};

export const fetchCdpJson = async (url, { timeoutMs = 5000, fetcher = fetch } = {}) => {
  const controller = new AbortController();
  let timer;
  try {
    return await Promise.race([
      (async () => {
        const response = await fetcher(url, { signal: controller.signal });
        if (response.ok === false) throw new Error(`CDP HTTP ${response.status}`);
        return response.json();
      })(),
      new Promise((_, reject) => {
        timer = setTimeout(() => {
          controller.abort();
          reject(new Error("Scadenza della richiesta CDP"));
        }, Math.max(1, timeoutMs));
      }),
    ]);
  } finally {
    clearTimeout(timer);
    controller.abort();
  }
};

export const waitForHeadlessEndpoint = async ({
  child, profile, getSpawnError = () => null, getDiagnostics = () => "",
  timeoutMs = 30000, now = Date.now,
  readPortFile = () => readFile(join(profile, "DevToolsActivePort"), "utf8"),
  sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)), fetcher = fetch,
}) => {
  const deadline = now() + timeoutMs;
  let lastError = "endpoint non disponibile";
  while (now() < deadline) {
    const spawnError = getSpawnError();
    if (spawnError) throw spawnError;
    try {
      const endpoint = parseDevToolsEndpoint(await readPortFile());
      if (endpoint && now() < deadline) {
        const version = await fetchCdpJson(`http://127.0.0.1:${endpoint.port}/json/version`, {
          timeoutMs: Math.min(2000, deadline - now()), fetcher,
        });
        const ws = new URL(version.webSocketDebuggerUrl);
        if (ws.protocol === "ws:" && ["127.0.0.1", "localhost", "[::1]"].includes(ws.hostname) &&
            Number(ws.port) === endpoint.port && ws.pathname === endpoint.browserPath) {
          return { ...endpoint, browserWebSocketUrl: ws.href };
        }
        lastError = "endpoint CDP diverso dal profilo del test";
      }
    } catch (error) {
      lastError = error.message || String(error);
    }
    if (failedHeadlessExit(child.exitCode) || child.signalCode) {
      throw new Error(`Edge terminato prima dell'avvio (${child.exitCode ?? child.signalCode}): ${getDiagnostics()}`);
    }
    const remaining = deadline - now();
    if (remaining > 0) await sleep(Math.min(100, remaining));
  }
  throw new Error(`Edge headless non pronto entro ${timeoutMs} ms: ${lastError}; ${getDiagnostics()}`);
};

export const connectHeadlessCdp = async (address, {
  WebSocketImpl = WebSocket, connectTimeoutMs = 10000, requestTimeoutMs = 30000,
} = {}) => {
  const socket = new WebSocketImpl(address);
  const pending = new Map();
  const events = [];
  let nextId = 1;
  const rejectPending = (error) => {
    for (const call of pending.values()) { clearTimeout(call.timer); call.reject(error); }
    pending.clear();
  };
  socket.addEventListener("close", () => rejectPending(new Error("Connessione CDP chiusa")));
  socket.addEventListener("error", () => rejectPending(new Error("Errore di connessione CDP")));
  socket.addEventListener("message", ({ data }) => {
    let message;
    try { message = JSON.parse(data); } catch { rejectPending(new Error("Risposta CDP non valida")); return; }
    const call = pending.get(message.id);
    if (call) {
      clearTimeout(call.timer); pending.delete(message.id);
      if (message.error) call.reject(new Error(message.error.message));
      else call.resolve(message.result);
    } else if (!message.id) events.push(message);
  });
  await new Promise((resolve, reject) => {
    let timer;
    const finish = (error) => {
      clearTimeout(timer);
      socket.removeEventListener("open", opened);
      socket.removeEventListener("error", failed);
      socket.removeEventListener("close", failed);
      if (error) reject(error); else resolve();
    };
    const opened = () => finish();
    const failed = () => finish(new Error("Apertura CDP fallita"));
    socket.addEventListener("open", opened, { once: true });
    socket.addEventListener("error", failed, { once: true });
    socket.addEventListener("close", failed, { once: true });
    timer = setTimeout(() => {
      finish(new Error("Scadenza apertura CDP"));
      socket.close();
    }, connectTimeoutMs);
  });
  return {
    events,
    send(method, params = {}) {
      if (socket.readyState !== 1) return Promise.reject(new Error("Connessione CDP non aperta"));
      const id = nextId++;
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          pending.delete(id); reject(new Error(`Scadenza comando CDP: ${method}`));
        }, requestTimeoutMs);
        pending.set(id, { resolve, reject, timer });
        try { socket.send(JSON.stringify({ id, method, params })); }
        catch (error) { clearTimeout(timer); pending.delete(id); reject(error); }
      });
    },
    close() { rejectPending(new Error("Connessione CDP chiusa")); socket.close(); },
  };
};
