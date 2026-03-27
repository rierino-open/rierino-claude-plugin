#!/usr/bin/env node
/**
 * Rierino MCP Proxy
 * Bridges Claude's stdio MCP protocol to the Rierino HTTP JSON-RPC MCP endpoint.
 *
 * Credentials are read exclusively from .env (project root or script dir).
 * Raw JWTs are never exposed to Claude — they are replaced with AES-256-GCM
 * encrypted handles on the way out and decrypted on the way in.
 *
 * Required .env keys:
 *   RIERINO_BASE_URL        - Base URL, e.g. https://your-instance.rierino.com
 *   RIERINO_USERNAME        - Basic-auth username for login
 *   RIERINO_PASSWORD        - Basic-auth password for login
 *
 * Optional .env keys:
 *   REFRESH_INTERVAL_MS     - Token refresh interval in ms (default: 600000)
 */

'use strict';

const fs       = require('fs');
const path     = require('path');
const https    = require('https');
const http     = require('http');
const readline = require('readline');
const crypto   = require('crypto');

// ---------------------------------------------------------------------------
// Load .env — no external dependencies
// ---------------------------------------------------------------------------
(function loadDotEnv() {
  const candidates = [
    path.join(__dirname, '.env'),
    path.join(process.cwd(), '.env')
  ];
  for (const envPath of candidates) {
    if (!fs.existsSync(envPath)) continue;
    const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let val   = trimmed.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = val;
    }
    break;
  }
})();

const ADMIN_GATEWAY       = (process.env.RIERINO_BASE_URL || '').replace(/\/$/, '');
const USERNAME            = process.env.RIERINO_USERNAME || '';
const PASSWORD            = process.env.RIERINO_PASSWORD || '';
const REFRESH_INTERVAL_MS = parseInt(process.env.REFRESH_INTERVAL_MS || '600000', 10);

let gatewayToken = null;

// ---------------------------------------------------------------------------
// Token vault — ephemeral AES-256-GCM key, never leaves this process
// Outbound (proxy → Claude):  JWT regex matches → encrypted handle
// Inbound  (Claude → proxy):  encrypted handles → original JWT
// ---------------------------------------------------------------------------
const VAULT_KEY   = crypto.randomBytes(32);          // new key every process start
const ENC_PREFIX  = '__RTOK__';                       // short, URL-safe sentinel
const JWT_REGEX   = /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*/g;
const HANDLE_REGEX = new RegExp(`${ENC_PREFIX}[A-Za-z0-9_=-]+`, 'g');

function encryptToken(jwt) {
  const iv        = crypto.randomBytes(12);
  const cipher    = crypto.createCipheriv('aes-256-gcm', VAULT_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(jwt, 'utf8'), cipher.final()]);
  const tag       = cipher.getAuthTag();
  // Layout: iv(12) | tag(16) | ciphertext → base64
  return ENC_PREFIX + Buffer.concat([iv, tag, encrypted]).toString('base64');
}

function decryptHandle(handle) {
  const buf       = Buffer.from(handle.slice(ENC_PREFIX.length), 'base64');
  const iv        = buf.slice(0, 12);
  const tag       = buf.slice(12, 28);
  const encrypted = buf.slice(28);
  const decipher  = crypto.createDecipheriv('aes-256-gcm', VAULT_KEY, iv);
  decipher.setAuthTag(tag);
  return decipher.update(encrypted).toString('utf8') + decipher.final('utf8');
}

function walkAndTransform(value, transformString) {
  if (typeof value === 'string')  return transformString(value);
  if (Array.isArray(value))       return value.map(v => walkAndTransform(v, transformString));
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = walkAndTransform(v, transformString);
    return out;
  }
  return value;
}

// Replace all JWTs with encrypted handles before sending to Claude
function maskTokens(obj) {
  return walkAndTransform(obj, s => s.replace(JWT_REGEX, jwt => encryptToken(jwt)));
}

// Replace all encrypted handles with real JWTs before sending to Rierino
function unmaskTokens(obj) {
  return walkAndTransform(obj, s =>
    s.replace(HANDLE_REGEX, handle => {
      try { return decryptHandle(handle); } catch { return handle; }
    })
  );
}

// ---------------------------------------------------------------------------
// HTTP helper
// ---------------------------------------------------------------------------
function httpRequest(url, { method = 'POST', headers = {} } = {}, body) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const lib    = parsed.protocol === 'https:' ? https : http;
    const opts   = {
      hostname : parsed.hostname,
      port     : parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
      path     : parsed.pathname + parsed.search,
      method,
      headers  : { 'Content-Type': 'application/json', ...headers },
      agent    : false   // disable keep-alive pooling — REST backend, fresh connection per request
    };

    const req = lib.request(opts, res => {
      let raw = '';
      res.on('data', chunk => (raw += chunk));
      res.on('end', () => {
        let parsed;
        try { parsed = JSON.parse(raw); } catch { parsed = raw; }
        resolve({ status: res.statusCode, body: parsed });
      });
    });

    req.on('error', reject);
    if (body !== undefined) req.write(JSON.stringify(body));
    req.end();
  });
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
async function login() {
  const encoded  = Buffer.from(`${USERNAME}:${PASSWORD}`).toString('base64');
  const response = await httpRequest(
    `${ADMIN_GATEWAY}/api/auth/login/rpc`,
    { headers: { Authorization: `Basic ${encoded}` } }
  );

  if (response.status !== 200) {
    throw new Error(`Login failed (HTTP ${response.status}): ${JSON.stringify(response.body)}`);
  }

  const token = response.body?.gateway_token;
  if (!token) throw new Error(`Login response missing gateway_token: ${JSON.stringify(response.body)}`);
  gatewayToken = token;
}

async function refresh() {
  try {
    const response = await httpRequest(
      `${ADMIN_GATEWAY}/api/auth/refresh/rpc`,
      { headers: { Authorization: `Bearer ${gatewayToken}` } }
    );

    if (response.status === 200 && response.body?.gateway_token) {
      gatewayToken = response.body.gateway_token;
      logErr('Token refreshed.');
    } else {
      logErr('Refresh failed — re-logging in...');
      await login();
    }
  } catch (err) {
    logErr(`Refresh error: ${err.message} — re-logging in...`);
    await login();
  }
}

// ---------------------------------------------------------------------------
// MCP forwarding
// ---------------------------------------------------------------------------
async function callMcp(mcpRequest) {
  // Restore any encrypted handles Claude may have echoed back
  const realRequest = unmaskTokens(mcpRequest);

  const response = await httpRequest(
    `${ADMIN_GATEWAY}/api/request/rpc/CallMCPServer`,
    { headers: { Authorization: `Bearer ${gatewayToken}` } },
    realRequest
  );

  if (response.status === 401) {
    logErr('401 received — refreshing token and retrying...');
    await refresh();
    return callMcp(mcpRequest);   // retry with original (still-masked) request
  }

  // Mask any JWTs in the response before handing to Claude
  return maskTokens(response.body);
}

// ---------------------------------------------------------------------------
// Stdio bridge
// ---------------------------------------------------------------------------
function logErr(msg) { process.stderr.write(`[rierino-mcp] ${msg}\n`); }
function send(obj)   { process.stdout.write(JSON.stringify(obj) + '\n'); }

let clientProtocolVersion = null;

async function main() {
  if (!ADMIN_GATEWAY || !USERNAME || !PASSWORD) {
    logErr('ERROR: RIERINO_BASE_URL, RIERINO_USERNAME, and RIERINO_PASSWORD must be set in .env');
    process.exit(1);
  }

  logErr(`Connecting to ${ADMIN_GATEWAY} ...`);
  await login();
  logErr('Authenticated. Token vault active. Proxy ready.');

  const timer = setInterval(refresh, REFRESH_INTERVAL_MS);
  timer.unref();

  const rl = readline.createInterface({ input: process.stdin, terminal: false });

  rl.on('line', async line => {
    line = line.trim();
    if (!line) return;

    let mcpRequest;
    try {
      mcpRequest = JSON.parse(line);
    } catch {
      logErr(`Invalid JSON from Claude: ${line}`);
      return;
    }

    // Track the protocol version the client wants so we can echo it back
    if (mcpRequest.method === 'initialize' && mcpRequest.params?.protocolVersion) {
      clientProtocolVersion = mcpRequest.params.protocolVersion;
    }

    // JSON-RPC notifications have no `id` — backend is stateless, drop them all
    const isNotification = !('id' in mcpRequest);
    if (isNotification) return;

    try {
      let result = await callMcp(mcpRequest);
      // Rewrite the server's protocolVersion to match what the client requested,
      // preventing Claude from dropping the connection on a version mismatch.
      if (mcpRequest.method === 'initialize') {
        const patch = {};
        if (clientProtocolVersion && result?.result?.protocolVersion) {
          patch.protocolVersion = clientProtocolVersion;
        }
        // MCP requires serverInfo.version — inject a fallback if the backend omits it
        if (result?.result?.serverInfo && !result.result.serverInfo.version) {
          patch.serverInfo = { ...result.result.serverInfo, version: '1.0.0' };
        }
        if (Object.keys(patch).length) {
          result = { ...result, result: { ...result.result, ...patch } };
        }
      }
      if (!isNotification) send(result);
    } catch (err) {
      logErr(`Error forwarding request: ${err.message}`);
      if (!isNotification) {
        send({
          jsonrpc : '2.0',
          id      : mcpRequest?.id ?? null,
          error   : { code: -32603, message: err.message }
        });
      }
    }
  });

  rl.on('close', () => {
    clearInterval(timer);
    process.exit(0);
  });
}

main().catch(err => {
  process.stderr.write(`[rierino-mcp] Fatal: ${err.message}\n`);
  process.exit(1);
});
