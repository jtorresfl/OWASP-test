# Demo A09:2025 – Security Logging and Alerting Failures

Laboratorio con **datos ficticios**, solo para ejecutar en tu propio equipo (localhost).
No lo uses contra sistemas de terceros.

## Contenido

| Carpeta | Puerto | Descripción |
|---|---|---|
| `vulnerable/` | 3000 | App Express con fallos A09 |
| `fixed/` | 3001 | Misma app con la mitigación aplicada |
| `attack.sh` | – | Simula fuerza bruta + log injection + tráfico legítimo |

## Requisitos
Node.js 18+ y `curl` (en Windows usa Git Bash o WSL).

## Reproducir

```bash
npm install

# Terminal 1: app vulnerable
npm run vulnerable
# Terminal 2: ataque
bash attack.sh http://localhost:3000
cat vulnerable/vulnerable.log
```

### Qué debes observar (app vulnerable)
1. **CWE-778 / sin alertas:** 8 intentos de fuerza bruta contra `admin`; el log solo dice "login attempt", nunca registra el *resultado* fallido ni genera ninguna alerta.
2. **CWE-532:** cada contraseña probada aparece en texto plano (`password=123456`…).
3. **CWE-117:** aparece una línea falsa `INFO login OK user=admin` con otra fecha: es texto inyectado por el atacante a través del campo `username`.

### Aplicar la mitigación y repetir
```bash
# Detén la app vulnerable (Ctrl+C) y levanta la corregida
npm run fixed
bash attack.sh http://localhost:3001
cat fixed/fixed.log
```

### Qué debes observar (app corregida)
1. Cada fallo queda como evento `login_failed` con usuario, IP y user-agent.
2. `password` aparece como `[Redacted]`.
3. El intento de inyección queda **dentro de un único JSON**; el salto de línea se ve como `\n` y no crea una entrada nueva.
4. Al 5.º fallo en 60 s se registra `security_alert` (regla `bruteforce_login`) y se imprime `[ALERTA]` en la consola. En producción este punto enviaría un correo, mensaje de Slack o evento al SIEM.

## Cómo comprobar que quedó corregido (checklist)
- [ ] El log de la app corregida no contiene ninguna contraseña.
- [ ] No existe una línea falsa de `login OK` para `admin`.
- [ ] Hay un `security_alert` tras superar el umbral.
- [ ] Los fallos incluyen contexto (usuario, IP, user-agent, hora).

## Limitaciones (para mencionar en la exposición)
- La alerta es un ejemplo en memoria; en producción se usaría un SIEM (ELK, Grafana Loki, etc.) con playbooks de respuesta.
- No se implementa bloqueo de cuenta ni rate limiting (`express-rate-limit`) para centrarse en A09.
- Los logs deberían además enviarse a un almacenamiento central con integridad protegida.
