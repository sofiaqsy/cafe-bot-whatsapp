#!/bin/bash

# Script para obtener las variables de Heroku y configurar el bot localmente

echo "================================================"
echo "🔧 CONFIGURACIÓN LOCAL DEL BOT DE WHATSAPP"
echo "================================================"
echo ""

APP_NAME="cafe-bot-whatsapp-ad7ab21dc0a8"

echo "📥 Obteniendo credenciales de Heroku..."
echo ""

# Obtener TWILIO_AUTH_TOKEN
echo "1. TWILIO_AUTH_TOKEN:"
echo "   Ejecuta este comando:"
echo "   heroku config:get TWILIO_AUTH_TOKEN --app $APP_NAME"
echo ""

# Obtener GOOGLE_SPREADSHEET_ID si existe
echo "2. GOOGLE_SPREADSHEET_ID (si tienes configurado):"
echo "   heroku config:get GOOGLE_SPREADSHEET_ID --app $APP_NAME"
echo ""

# Obtener GOOGLE_SERVICE_ACCOUNT_KEY si existe
echo "3. GOOGLE_SERVICE_ACCOUNT_KEY (si tienes configurado):"
echo "   heroku config:get GOOGLE_SERVICE_ACCOUNT_KEY --app $APP_NAME"
echo ""

echo "================================================"
echo "📝 PASOS PARA EJECUTAR EL BOT LOCALMENTE:"
echo "================================================"
echo ""
echo "1. Obtén las credenciales con los comandos de arriba"
echo ""
echo "2. Edita el archivo .env y reemplaza:"
echo "   - TWILIO_AUTH_TOKEN con el valor real"
echo "   - Si tienes Google Sheets, descomenta y agrega:"
echo "     - GOOGLE_SPREADSHEET_ID"
echo "     - GOOGLE_SERVICE_ACCOUNT_KEY (todo el JSON en una línea)"
echo ""
echo "3. Instala las dependencias:"
echo "   npm install"
echo ""
echo "4. Ejecuta el bot:"
echo "   node bot.js"
echo ""
echo "5. En otra terminal, ejecuta ngrok:"
echo "   ngrok http 3000"
echo ""
echo "6. Configura la URL de ngrok en Twilio:"
echo "   https://xxxxx.ngrok-free.app/webhook"
echo ""
echo "================================================"
