#!/bin/bash

# ========================================
# DEPLOY RÁPIDO - FIX TOKEN WEBHOOK
# ========================================

echo "🔧 Corrigiendo validación de token del webhook..."
echo ""

# Git add, commit y push
git add webhook-estado.js
git commit -m "fix: Mejorar validación de token en webhook-estado - aceptar 'test'"

echo "🚀 Enviando a Heroku..."
git push heroku main

echo ""
echo "⏳ Esperando 20 segundos..."
sleep 20

echo ""
echo "✅ Listo! El token 'test' ahora debería funcionar."
echo ""
echo "Prueba nuevamente desde Google Sheets con:"
echo "  Token: test"
echo "  URL: https://cafe-bot-whatsapp-ad7ab21dc0a8.herokuapp.com/webhook-estado"
echo ""
