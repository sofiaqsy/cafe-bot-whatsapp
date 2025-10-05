#!/bin/bash

# Deployment rápido para corregir el método sendMessage
echo "=========================================="
echo "🔧 FIX: Corrigiendo messageService.sendMessage"
echo "=========================================="
echo ""

cd /Users/keylacusi/Desktop/OPEN IA/cafe-bots/cafe-bot-local 2>/dev/null

echo "✅ Cambio realizado:"
echo "   enviarMensaje() -> sendMessage()"
echo ""

# Verificar el cambio
echo "📋 Verificando cambio en webhook-cliente.js:"
grep -n "sendMessage" webhook-cliente.js | head -5

echo ""
echo "🚀 Iniciando deployment..."
echo ""

git add webhook-cliente.js
git commit -m "fix: Cambiar enviarMensaje por sendMessage en webhook-cliente

- El messageService usa sendMessage, no enviarMensaje
- Corrige error 500 en el webhook"

git push heroku main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Deploy exitoso!"
    echo ""
    echo "⏳ Esperando reinicio de Heroku (15 segundos)..."
    sleep 15
    
    echo ""
    echo "🧪 Probando endpoint..."
    curl -s https://cafe-bot-whatsapp-ad7ab21dc0a8.herokuapp.com/webhook-cliente/test | python -m json.tool
    
    echo ""
    echo "=========================================="
    echo "✅ LISTO PARA PROBAR"
    echo "=========================================="
    echo ""
    echo "Ve a Google Sheets y prueba:"
    echo "📦 Notificaciones WhatsApp → Tests → Test Aprobación Cliente"
    echo ""
    echo "Monitorea los logs con:"
    echo "heroku logs --tail"
else
    echo "❌ Error en deployment"
fi
