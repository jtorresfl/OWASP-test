// APP VULNERABLE - solo para laboratorio, datos ficticios.
// Fallos A09: CWE-778 (no registra fallos), CWE-117 (log injection),
// CWE-532 (contraseña en el log) y ausencia total de alertas.
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

const USERS = { admin: 'S3cret!2026', ana: 'ana-demo-pass' }; // ficticios
const LOG_FILE = path.join(__dirname, 'vulnerable.log');

function log(msg) {
  fs.appendFileSync(LOG_FILE, `${new Date().toISOString()} INFO ${msg}\n`);
}

app.post('/login', (req, res) => {
  const { username, password } = req.body || {};

  // CWE-117: la entrada del usuario se concatena sin neutralizar saltos de línea
  log(`login attempt user=${username}`);
  // CWE-532: se registra la contraseña en texto plano
  log(`debug credentials password=${password}`);

  if (USERS[username] !== undefined && USERS[username] === password) {
    log(`login OK user=${username}`);
    return res.json({ ok: true });
  }
  // CWE-778: el fallo NO se registra y NO existe ninguna alerta
  return res.status(401).json({ ok: false });
});

app.listen(3000, () => console.log('Vulnerable en http://localhost:3000'));
