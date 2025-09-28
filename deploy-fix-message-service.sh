#!/bin/bash

# ========================================
# FIX - USAR MESSAGE-SERVICE CORRECTO
# ========================================

echo "🔧 Corrigiendo servicio de mensajes en webhook..."
echo ""

# Git add, commit y push
git add webhook-estado.js
git commit -m "fix: Usar message-service en lugar de twilio-service inexistente"

echo "🚀 Enviando a Heroku..."
git push heroku main

echo ""
echo "⏳ Esperando 25 segundos..."
sleep 25

echo ""
echo "✅ Listo!"
echo ""
echo "🧪 Ahora prueba desde Google Sheets:"
echo "1. Ejecuta 'Test Enviar Notificación'"
echo "2. Deberías recibir un WhatsApp con la notificación"
echo ""
echo "Si el token sigue fallando, recuerda:"
echo "- Ver token actual: heroku config:get WEBHOOK_SECRET -a cafe-bot-whatsapp"
echo "- Cambiar a test: heroku config:set WEBHOOK_SECRET=\"test\" -a cafe-bot-whatsapp"
echo ""
