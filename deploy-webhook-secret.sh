#!/bin/bash

# ========================================
# DEPLOY - USAR WEBHOOK_SECRET EXISTENTE
# ========================================

echo "🔧 Actualizando para usar WEBHOOK_SECRET existente..."
echo ""

# Git add, commit y push
git add webhook-estado.js
git commit -m "fix: Usar WEBHOOK_SECRET en lugar de WEBHOOK_SECRET_TOKEN"

echo "🚀 Enviando a Heroku..."
git push heroku main

echo ""
echo "⏳ Esperando 20 segundos..."
sleep 20

echo ""
echo "✅ Listo!"
echo ""
echo "📋 IMPORTANTE:"
echo "1. Ejecuta: heroku config:get WEBHOOK_SECRET -a cafe-bot-whatsapp"
echo "2. Copia el valor que te muestre"
echo "3. Pégalo en Google Apps Script en SECRET_TOKEN"
echo ""
echo "O si prefieres, cambia el token a uno conocido:"
echo "heroku config:set WEBHOOK_SECRET=\"test123\" -a cafe-bot-whatsapp"
echo ""
