// APP CORREGIDA - logging estructurado, redacción, eventos de seguridad y alerta.
const express = require('express');
const path = require('path');
const pino = require('pino');

const app = express();
app.use(express.json());

const USERS = { admin: 'S3cret!2026', ana: 'ana-demo-pass' }; // ficticios

// Pino escribe JSON: los saltos de línea del usuario quedan escapados (\n) -> mitiga CWE-117.
// 'redact' elimina campos sensibles -> mitiga CWE-532.
const logger = pino(
  { redact: ['password', 'req.body.password'], base: { app: 'a09-demo' } },
  pino.destination({ dest: path.join(__dirname, 'fixed.log'), sync: true })
);

// Alerta simple: N fallos del mismo origen en una ventana de tiempo.
const THRESHOLD = 5;
const WINDOW_MS = 60 * 1000;
const failures = new Map(); // ip -> [timestamps]

function registerFailure(ip) {
  const now = Date.now();
  const recent = (failures.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  failures.set(ip, recent);
  return recent.length;
}

app.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  const ip = req.ip;
  const ua = req.get('user-agent');

  if (USERS[username] !== undefined && USERS[username] === password) {
    logger.info({ event: 'login_success', user: username, ip, ua });
    return res.json({ ok: true });
  }

  // CWE-778: ahora SÍ se registran los fallos, con contexto
  logger.warn({ event: 'login_failed', user: username, ip, ua, password });
  const count = registerFailure(ip);

  if (count === THRESHOLD) { // una sola alerta al cruzar el umbral (evita ruido)
    const alert = { event: 'security_alert', rule: 'bruteforce_login', ip, failures: count, windowSeconds: WINDOW_MS / 1000 };
    logger.error(alert);
    console.warn('[ALERTA]', JSON.stringify(alert)); // aquí iría el envío a email/Slack/SIEM
  }
  return res.status(401).json({ ok: false });
});

app.listen(3001, () => console.log('Corregida en http://localhost:3001'));
