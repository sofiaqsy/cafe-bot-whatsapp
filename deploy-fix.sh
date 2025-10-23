#!/bin/bash
cd /Users/keylacusi/Desktop/OPEN IA/cafe-bots/cafe-bot-local
git add webhook-cliente.js
git commit -m "fix: Mantener formato whatsapp:+51 para Twilio

- El error 'Invalid From and To pair' ocurre cuando el formato no es correcto
- Twilio requiere que tanto From como To tengan formato whatsapp:+[número]
- No remover el prefijo whatsapp: del número del cliente
- Agregar logs para debugging del formato"

git push heroku main
echo "✅ Cambios desplegados. Monitorea con: heroku logs --tail"
