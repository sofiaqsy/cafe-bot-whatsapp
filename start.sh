#!/bin/bash

# Script para iniciar el bot localmente

echo "☕ Iniciando Bot de WhatsApp localmente..."
echo ""

# Verificar si existe node_modules
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias..."
    npm install
    echo ""
fi

# Verificar si existe .env
if [ ! -f ".env" ]; then
    echo "❌ Error: No se encontró el archivo .env"
    echo "   Por favor, configura el archivo .env primero"
    exit 1
fi

# Verificar si TWILIO_AUTH_TOKEN está configurado
if grep -q "tu_auth_token_aqui_reemplazar" .env; then
    echo "⚠️  Advertencia: TWILIO_AUTH_TOKEN no está configurado"
    echo "   Por favor, actualiza el archivo .env con tu token real"
    echo ""
    echo "   Para obtenerlo, ejecuta:"
    echo "   heroku config:get TWILIO_AUTH_TOKEN --app cafe-bot-whatsapp-ad7ab21dc0a8"
    echo ""
    read -p "¿Deseas continuar de todos modos? (s/n): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        exit 1
    fi
fi

echo "🚀 Iniciando el bot..."
echo ""
echo "📌 Panel local: http://localhost:3000"
echo "📌 Test: http://localhost:3000/test"
echo "📌 Admin: http://localhost:3000/admin"
echo ""
echo "💡 Recuerda ejecutar ngrok en otra terminal:"
echo "   ngrok http 3000"
echo ""
echo "================================================"
echo ""

# Iniciar el bot
node bot.js
